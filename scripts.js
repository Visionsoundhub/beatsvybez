document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION & DOM ELEMENTS ---
    const a = {
        mainContent: document.getElementById('page-beats'),
        beatListEl: document.getElementById('beatList'),
        searchInput: document.getElementById('search-input'),
        mainAudio: document.getElementById('main-audio-element'),
        stickyPlayer: document.getElementById('sticky-player'),
        stickyPlayerTitle: document.getElementById('sticky-player-title'),
        
        socialProofModal: document.getElementById('social-proof-modal'),
        socialProofViewers: document.getElementById('social-proof-viewers'),
        socialProofConfirmBtn: document.getElementById('social-proof-confirm-btn'),
        socialProofModalClose: document.getElementById('social-proof-modal-close'),

        categoryButtons: document.querySelectorAll('#page-beats .filter-btn'),
        
        vaultInfoAccordion: document.getElementById('vault-info-accordion'),

        infoBoxes: {
            ai: document.getElementById('aiInfoBox'),
            vault: document.getElementById('vaultInfoBox'),
            custom: document.getElementById('customInfoBox'),
            general: document.getElementById('generalInfoBox')
        },
        vibeBtn: document.getElementById('vibe-search-btn'),
        vibeModal: document.getElementById('vibe-modal'),
        vibeModalClose: document.getElementById('vibe-modal-close'),
        vibeBubblesContainer: document.getElementById('vibe-bubbles-container'),
        shuffleVibesBtn: document.getElementById('shuffle-vibes-btn'),
        vibeCanvas: document.getElementById('vibe-visualizer'),
        loader: document.querySelector('.loader-container'),
        player: {
            container: document.getElementById('main-player'),
            playPauseBtn: document.querySelector('.play-pause-btn'),
            playPauseIcon: document.querySelector('.play-pause-btn i'),
            prevBtn: document.getElementById('prev-btn'),
            nextBtn: document.getElementById('next-btn'),
            progressBar: document.querySelector('.progress-bar'),
            progressBarContainer: document.querySelector('.progress-bar-container'),
            timeDisplay: document.querySelector('.time-display')
        },
        data: {
            beats: [],
            vibes: []
        },
        state: {
            currentPlaylist: [],
            currentTrackIndex: -1,
            vibeAnimationId: null
        },
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

    // --- "SMART" SOCIAL PROOF LOGIC ---
    function getViewerCount(beatId) {
        const key = `viewers_${beatId}`;
        const now = new Date().getTime();
        try {
            const storedData = JSON.parse(localStorage.getItem(key));
            if (storedData && (now - storedData.timestamp < 20 * 1000)) {
                return storedData.count;
            }
        } catch (e) {
            console.error("Could not parse viewer count from localStorage", e);
        }
        const newCount = Math.floor(Math.random() * 4);
        const newData = {
            count: newCount,
            timestamp: now
        };
        localStorage.setItem(key, JSON.stringify(newData));
        return newCount;
    }

    // --- DATA LOADING ---
    async function loadData() {
        showLoader();
        try {
            const [beatsResponse, vibesResponse] = await Promise.all([
                fetch('beats.json?v=' + Date.now()),
                fetch('vibes.json?v=' + Date.now())
            ]);
            if (!beatsResponse.ok || !vibesResponse.ok) {
                throw new Error('Network response was not ok.');
            }

            // --- αλλαγή εδώ: διαβάζουμε beatslist αντί για σκέτο array ---
            const beatsData = await beatsResponse.json();
            a.data.beats = beatsData.beatslist || []; 

            a.data.vibes = await vibesResponse.json();
            initializeApp();
        } catch (error) {
            console.error('Failed to load data:', error);
            if (a.beatListEl) {
               a.beatListEl.innerHTML = '<p style="color: #ff5555; text-align: center;">Αποτυχία φόρτωσης δεδομένων. Παρακαλώ δοκιμάστε ξανά.</p>';
            }
        } finally {
            hideLoader();
        }
    }

    // --- UI & LOADER ---
    function showLoader() { if (a.loader) a.loader.style.display = 'flex'; }
    function hideLoader() { if (a.loader) a.loader.style.display = 'none'; }
    
    // --- BEAT ITEM CREATION ---
    function createBeatElement(beat, isSingleView = false) {
        const item = document.createElement('div');
        item.className = 'beat-item';
        item.dataset.beatId = beat.id;

        const playlist = isSingleView ? [beat] : a.state.currentPlaylist;
        const playlistIndex = playlist.findIndex(b => b.id === beat.id);

        const priceHtml = beat.price ? `<div class="beat-item-price ${beat.status === 'sold' ? 'sold' : ''}">${beat.status === 'sold' ? 'SOLD' : beat.price}</div>` : '';
        const buyButtonHtml = (beat.checkoutUrl && beat.status !== 'sold')
            ? `<a href="${beat.checkoutUrl}" class="btn buy-btn-green" target="_blank" data-beat-id-social="${beat.id}">Αγορά</a>`
            : `<button class="btn buy-btn-green" disabled>${beat.status === 'sold' ? 'SOLD' : 'Αγορά'}</button>`;
        
        const categoryName = a.categoryDisplayNames[beat.category] || beat.category;
        const titleAndCategoryHtml = `
            <div class="beat-item-title-wrapper">
                <div class="beat-item-title">${beat.title}</div>
                <div class="beat-item-category">${categoryName}</div>
            </div>
        `;

        item.innerHTML = `
            <button class="beat-item-play-btn" aria-label="Αναπαραγωγή ${beat.title}"><i class="fas fa-play"></i></button>
            ${titleAndCategoryHtml}
            ${priceHtml}
            <button class="btn share-btn" aria-label="Κοινοποίηση ${beat.title}"><i class="fas fa-share-alt"></i></button>
            ${buyButtonHtml}
        `;
        
        item.querySelector('.beat-item-play-btn').addEventListener('click', () => handleTracklistClick(playlistIndex, playlist));
        item.querySelector('.share-btn')?.addEventListener('click', (e) => { e.stopPropagation(); shareBeat(beat); });
        
        const buyBtn = item.querySelector('.buy-btn-green');
        if (buyBtn && !buyBtn.disabled) {
            buyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const beatId = this.dataset.beatIdSocial;
                const viewers = getViewerCount(beatId);
                const purchaseLink = this.href;

                if (a.socialProofViewers) {
                    a.socialProofViewers.textContent = viewers > 0 ? `${viewers} άλλοι βλέπουν αυτό το προϊόν` : '';
                }
                
                if (a.socialProofConfirmBtn) {
                    a.socialProofConfirmBtn.dataset.link = purchaseLink;
                }
                if (a.socialProofModal) {
                    a.socialProofModal.classList.add('visible');
                }
            });
        }
        
        return item;
    }

    // ... (όλος ο υπόλοιπος κώδικας ίδιος, δεν αλλάζει)

    loadData();
});
