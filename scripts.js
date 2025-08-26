document.addEventListener('DOMContentLoaded', () => {
    // --- STRIPE FRONTEND CONFIG ---
    const stripe = Stripe("pk_live_51S0JjoLu6b81hM6KW6pHuQNGMh2sXTsyYw9iCt2Esw8Fr9BA41WLnaUEgvUmLbrzZKL0Fy5XNNp9Q3Eck3CBWyTk00WjPJIuo3");

    // --- CONFIGURATION & DOM ELEMENTS ---
    const a = {
        mainContent: document.getElementById('page-beats'),
        beatListEl: document.getElementById('beatList'),
        searchInput: document.getElementById('search-input'),
        mainAudio: document.getElementById('main-audio-element'),
        stickyPlayer: document.getElementById('sticky-player'),
        stickyPlayerTitle: document.getElementById('sticky-player-title'),
        categoryButtons: document.querySelectorAll('#page-beats .filter-btn'),
        loader: document.querySelector('.loader-container'),
        data: { beats: [] },
        state: { currentPlaylist: [], currentTrackIndex: -1 },
        categoryDisplayNames: {
            'trap': 'Trap / Drill',
            'boombap': 'Rap / Boombap',
            'latin': 'Latin Urban / Afro',
            'lofi': 'Lofi',
            'custom': 'Custom',
            'vault': 'Vault Beats',
            'ai': 'AI Access',
            'all': 'All Beats'
        }
    };

    // --- LOADING DATA ---
    async function loadData() {
        showLoader();
        try {
            const beatsResponse = await fetch('beats.json?v=' + Date.now());
            const beatsJson = await beatsResponse.json();
            a.data.beats = beatsJson.beatslist || [];
            initializeApp();
        } catch (error) {
            console.error('Failed to load data:', error);
            if (a.beatListEl) {
                a.beatListEl.innerHTML = '<p style="color:red;text-align:center;">Αποτυχία φόρτωσης δεδομένων.</p>';
            }
        } finally {
            hideLoader();
        }
    }

    function showLoader() { if (a.loader) a.loader.style.display = 'flex'; }
    function hideLoader() { if (a.loader) a.loader.style.display = 'none'; }

    // --- BEAT ITEM CREATION ---
    function createBeatElement(beat) {
        const item = document.createElement('div');
        item.className = 'beat-item';
        item.dataset.beatId = beat.id;

        const priceHtml = beat.price
            ? `<div class="beat-item-price ${beat.status === 'sold' ? 'sold' : ''}">
                ${beat.status === 'sold' ? 'SOLD' : beat.price}
               </div>`
            : '';

        const buyButtonHtml = (beat.status !== 'sold')
            ? `<button class="btn buy-btn-green" data-beat-id="${beat.id}" data-price="${beat.priceRaw}">Αγορά</button>`
            : `<button class="btn buy-btn-green" disabled>SOLD</button>`;

        const categoryName = a.categoryDisplayNames[beat.category] || beat.category;

        item.innerHTML = `
            <button class="beat-item-play-btn"><i class="fas fa-play"></i></button>
            <div class="beat-item-title-wrapper">
                <div class="beat-item-title">${beat.title}</div>
                <div class="beat-item-category">${categoryName}</div>
            </div>
            ${priceHtml}
            ${buyButtonHtml}
        `;

        // --- PLAY BTN
        item.querySelector('.beat-item-play-btn').addEventListener('click', () => handleTrackClick(beat));

        // --- BUY BTN (Stripe) ---
        const buyBtn = item.querySelector('.buy-btn-green');
        if (buyBtn && !buyBtn.disabled) {
            buyBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                const beatId = this.dataset.beatId;
                const price = parseFloat(this.dataset.price);

                try {
                    const response = await fetch('/.netlify/functions/create-checkout', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ beatId, price })
                    });
                    const session = await response.json();
                    if (session.id) {
                        await stripe.redirectToCheckout({ sessionId: session.id });
                    } else {
                        alert("Σφάλμα στο checkout");
                    }
                } catch (err) {
                    console.error(err);
                    alert("Αποτυχία Stripe checkout");
                }
            });
        }

        return item;
    }

    // --- RENDER LIST ---
    function renderBeats() {
        if (!a.beatListEl) return;
        a.beatListEl.innerHTML = '';
        a.state.currentPlaylist = a.data.beats;

        if (a.data.beats.length === 0) {
            const noResults = document.createElement('p');
            noResults.textContent = 'Δεν βρέθηκαν beats.';
            noResults.style.color = '#888';
            noResults.style.textAlign = 'center';
            a.beatListEl.appendChild(noResults);
        } else {
            a.data.beats.forEach(beat => {
                const beatElement = createBeatElement(beat);
                a.beatListEl.appendChild(beatElement);
            });
        }
    }

    // --- AUDIO PLAYER ---
    function handleTrackClick(beat) {
        if (!a.mainAudio) return;
        if (a.mainAudio.src.includes(beat.audioSrc) && !a.mainAudio.paused) {
            a.mainAudio.pause();
        } else {
            a.mainAudio.src = beat.audioSrc;
            a.mainAudio.play();
            if (a.stickyPlayerTitle) a.stickyPlayerTitle.textContent = beat.title;
            if (a.stickyPlayer) a.stickyPlayer.classList.add('visible');
        }
    }

    // --- INIT APP ---
    function initializeApp() {
        renderBeats();
    }

    loadData();
});
