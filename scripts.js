document.addEventListener('DOMContentLoaded', () => {
    // Stripe client με Publishable Key
    const stripe = Stripe("YOUR_PUBLISHABLE_KEY"); // βάλε εδώ το pk_test_... ή pk_live_...

    // --- CONFIGURATION & DOM ELEMENTS ---
    const a = {
        mainContent: document.getElementById('page-beats'),
        beatListEl: document.getElementById('beatList'),
        searchInput: document.getElementById('search-input'),
        mainAudio: document.getElementById('main-audio-element'),
        stickyPlayer: document.getElementById('sticky-player'),
        stickyPlayerTitle: document.getElementById('sticky-player-title'),
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

    // --- STRIPE CHECKOUT FUNCTION ---
    async function checkoutWithStripe(beat) {
        try {
            const response = await fetch('/.netlify/functions/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    beatId: beat.id,
                    title: beat.title,
                    price: beat.priceRaw // ευρώ
                })
            });

            const data = await response.json();

            if (data.id) {
                const result = await stripe.redirectToCheckout({ sessionId: data.id });
                if (result.error) {
                    alert(result.error.message);
                }
            } else {
                alert("Αποτυχία δημιουργίας checkout");
            }
        } catch (err) {
            console.error(err);
            alert("Σφάλμα κατά το Checkout");
        }
    }

    // --- BEAT ITEM CREATION ---
    function createBeatElement(beat) {
        const item = document.createElement('div');
        item.className = 'beat-item';
        item.dataset.beatId = beat.id;

        const priceHtml = beat.price
            ? `<div class="beat-item-price">${beat.status === 'sold' ? 'SOLD' : beat.price}</div>`
            : '';

        const categoryName = a.categoryDisplayNames[beat.category] || beat.category;

        item.innerHTML = `
            <button class="beat-item-play-btn"><i class="fas fa-play"></i></button>
            <div class="beat-item-title-wrapper">
                <div class="beat-item-title">${beat.title}</div>
                <div class="beat-item-category">${categoryName}</div>
            </div>
            ${priceHtml}
        `;

        // --- BUY BUTTON ---
        const buyBtn = document.createElement('button');
        buyBtn.className = 'btn buy-btn-green';
        buyBtn.textContent = (beat.status !== 'sold') ? 'Αγορά' : 'SOLD';
        buyBtn.disabled = (beat.status === 'sold');

        // Προσθήκη event listener αντί για inline onclick
        if (beat.status !== 'sold') {
            buyBtn.addEventListener('click', () => checkoutWithStripe(beat));
        }

        item.appendChild(buyBtn);

        // --- PLAY BTN
        item.querySelector('.beat-item-play-btn').addEventListener('click', () => handleTrackClick(beat));

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
