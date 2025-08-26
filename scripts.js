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

    // --- SOCIAL PROOF LOGIC ---
    function getViewerCount(beatId) {
        const key = `viewers_${beatId}`;
        const now = new Date().getTime();
        try {
            const storedData = JSON.parse(localStorage.getItem(key));
            if (storedData && (now - storedData.timestamp < 20 * 1000)) {
                return storedData.count;
            }
        } catch (e) {}
        // Πάντα τουλάχιστον 1 (για να μην λέει "0")
        const newCount = Math.floor(Math.random() * 3) + 1; 
        const newData = { count: newCount, timestamp: now };
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

            // ✅ Eδώ η αλλαγή για beatslist
            const beatsData = await beatsResponse.json();
            a.data.beats = beatsData.beatslist || []; 

            a.data.vibes = await vibesResponse.json();
            initializeApp();

        } catch (error) {
            console.error('Failed to load data:', error);
            if (a.beatListEl) {
                a.beatListEl.innerHTML = '<p style="color:#ff5555;text-align:center;">Αποτυχία φόρτωσης δεδομένων. Παρακαλώ δοκιμάστε ξανά.</p>';
            }
        } finally {
            hideLoader();
        }
    }

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
            ? `<a href="${beat.checkoutUrl}" class="btn buy-btn-green" data-beat-id-social="${beat.id}">Αγορά</a>`
            : `<button class="btn buy-btn-green" disabled>${beat.status === 'sold' ? 'SOLD' : 'Αγορά'}</button>`;

        const categoryName = a.categoryDisplayNames[beat.category] || beat.category;
        const titleAndCategoryHtml = `
            <div class="beat-item-title-wrapper">
                <div class="beat-item-title">${beat.title}</div>
                <div class="beat-item-category">${categoryName}</div>
            </div>
        `;

        item.innerHTML = `
            <button class="beat-item-play-btn"><i class="fas fa-play"></i></button>
            ${titleAndCategoryHtml}
            ${priceHtml}
            <button class="btn share-btn"><i class="fas fa-share-alt"></i></button>
            ${buyButtonHtml}
        `;
        
        item.querySelector('.beat-item-play-btn').addEventListener('click', () => handleTracklistClick(playlistIndex, playlist));
        item.querySelector('.share-btn')?.addEventListener('click', (e) => { e.stopPropagation(); shareBeat(beat); });

        return item;
    }

    // --- RENDER ---
    function renderFullBeatListView(filter) {
        showLoader();
        setTimeout(() => {
            if (!a.beatListEl) return;
            a.beatListEl.innerHTML = '';
            let filteredBeats = a.data.beats;

            if (filter.type === 'category') {
                filteredBeats = filter.value === 'all' 
                    ? a.data.beats.filter(b => b.category !== 'ai' && b.category !== 'custom') 
                    : a.data.beats.filter(b => b.category === filter.value);
            } else if (filter.type === 'search') {
                const term = filter.value.toLowerCase();
                filteredBeats = a.data.beats.filter(b => 
                    b.title.toLowerCase().includes(term) || 
                    (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
                );
            } else if (filter.type === 'vibe') {
                filteredBeats = a.data.beats.filter(b => 
                    (b.tags && b.tags.some(t => filter.value.includes(t)))
                );
            }
            
            a.state.currentPlaylist = filteredBeats;
            if (filteredBeats.length === 0) {
                const noResults = document.createElement('p');
                noResults.textContent = 'Δεν βρέθηκαν beats.';
                noResults.style.color = '#888';
                noResults.style.textAlign = 'center';
                a.beatListEl.appendChild(noResults);
            } else {
                filteredBeats.forEach(beat => {
                    const beatElement = createBeatElement(beat);
                    a.beatListEl.appendChild(beatElement);
                });
            }
            updatePlayingUI();
            hideLoader();
        }, 50);
    }

    function renderSingleBeatView(beat) {
        showLoader();
        setTimeout(() => {
            if (!a.mainContent || !a.beatListEl) return;
            a.mainContent.classList.add('single-beat-view');
            a.beatListEl.innerHTML = '';

            const backButton = document.createElement('a');
            backButton.href = window.location.pathname;
            backButton.className = 'back-to-all-btn';
            backButton.innerHTML = '&larr; Επιστροφή';
            a.beatListEl.appendChild(backButton);

            const beatElement = createBeatElement(beat, true);
            a.beatListEl.appendChild(beatElement);

            a.state.currentPlaylist = [beat];
            updatePlayingUI();
            hideLoader();
        }, 50);
    }

    // --- AUDIO PLAYER ---
    function handleTracklistClick(index, playlist) {
        const track = playlist[index];
        if (!track || !a.mainAudio) return;
        if (a.state.currentPlaylist !== playlist) a.state.currentPlaylist = playlist;
        if (a.state.currentTrackIndex === index && !a.mainAudio.paused) a.mainAudio.pause();
        else playTrack(index);
    }
    function playTrack(index) {
        if (index < 0 || index >= a.state.currentPlaylist.length) return;
        a.state.currentTrackIndex = index;
        const track = a.state.currentPlaylist[a.state.currentTrackIndex];
        if (!track || !track.audioSrc || !a.mainAudio) return;
        a.mainAudio.src = track.audioSrc;
        a.mainAudio.play().catch(e => console.error("Audio play failed:", e));
        if (a.stickyPlayerTitle) a.stickyPlayerTitle.textContent = track.title;
        if (a.stickyPlayer) a.stickyPlayer.classList.add('visible');
    }
    function playNext() {
        if (a.state.currentPlaylist.length === 0) return;
        let nextIndex = (a.state.currentTrackIndex + 1) % a.state.currentPlaylist.length;
        playTrack(nextIndex);
    }
    function playPrev() {
        if (a.state.currentPlaylist.length === 0) return;
        let prevIndex = (a.state.currentTrackIndex - 1 + a.state.currentPlaylist.length) % a.state.currentPlaylist.length;
        playTrack(prevIndex);
    }
    function updatePlayingUI() {
        document.querySelectorAll('.beat-item').forEach(item => {
            item.classList.remove('is-playing-card');
            const playBtnIcon = item.querySelector('.beat-item-play-btn i');
            if (playBtnIcon) playBtnIcon.className = 'fas fa-play';
        });
        if (a.mainAudio && !a.mainAudio.paused && a.state.currentTrackIndex > -1 && a.state.currentPlaylist[a.state.currentTrackIndex]) {
            const playingBeatId = a.state.currentPlaylist[a.state.currentTrackIndex].id;
            const currentItem = document.querySelector(`.beat-item[data-beat-id='${playingBeatId}']`);
            if (currentItem) {
                currentItem.classList.add('is-playing-card');
                const playBtnIcon = currentItem.querySelector('.beat-item-play-btn i');
                if (playBtnIcon) playBtnIcon.className = 'fas fa-pause';
            }
        }
    }

    // --- SHARING ---
    async function shareBeat(beat) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?beat=${beat.id}`;
        if (navigator.share) {
            try { await navigator.share({ title: `Check out this beat: ${beat.title}`, text: `Listen to "${beat.title}"!`, url: shareUrl }); }
            catch (e) {}
        } else {
            try { await navigator.clipboard.writeText(shareUrl); alert('Ο σύνδεσμος αντιγράφηκε!'); }
            catch (e) { alert('Η αντιγραφή απέτυχε.'); }
        }
    }

    // --- SOCIAL PROOF HANDLERS ---
    function setupSocialProofHandlers() {
        // Buy button click
        document.addEventListener('click', function(e) {
            if (e.target.matches('[data-beat-id-social]')) {
                e.preventDefault();
                const beatId = e.target.dataset.beatIdSocial;
                const viewers = getViewerCount(beatId);
                const purchaseLink = e.target.href;

                if (a.socialProofViewers) {
                    a.socialProofViewers.textContent = `${viewers} άλλοι βλέπουν αυτό το προϊόν`;
                }
                if (a.socialProofConfirmBtn) {
                    a.socialProofConfirmBtn.dataset.link = purchaseLink;
                }
                if (a.socialProofModal) {
                    a.socialProofModal.classList.add('visible');
                    document.body.classList.add('modal-open');
                }
            }
        });

        // Confirm → ανοίγει checkout
        if (a.socialProofConfirmBtn) {
            a.socialProofConfirmBtn.addEventListener('click', function() {
                const link = this.dataset.link;
                if (link) {
                    window.open(link, '_blank');
                }
                if (a.socialProofModal) {
                    a.socialProofModal.classList.remove('visible');
                    document.body.classList.remove('modal-open');
                }
            });
        }

        // Close button
        if (a.socialProofModalClose) {
            a.socialProofModalClose.addEventListener('click', function() {
                if (a.socialProofModal) {
                    a.socialProofModal.classList.remove('visible');
                    document.body.classList.remove('modal-open');
                }
            });
        }

        // Click outside
        if (a.socialProofModal) {
            a.socialProofModal.addEventListener('click', function(e) {
                if (e.target === this) {
                    this.classList.remove('visible');
                    document.body.classList.remove('modal-open');
                }
            });
        }
    }

    // --- INITIALIZATION ---
    function initializeApp() {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedBeatId = urlParams.get('beat');
        if (sharedBeatId) {
            const beatIdNum = parseInt(sharedBeatId, 10);
            const singleBeat = a.data.beats.find(b => b.id === beatIdNum);
            if (singleBeat) renderSingleBeatView(singleBeat);
            else renderFullBeatListView({ type: 'category', value: 'all' });
        } else {
            renderFullBeatListView({ type: 'category', value: 'all' });
        }
    }

    // Run init
    setupSocialProofHandlers();
    loadData();
});
