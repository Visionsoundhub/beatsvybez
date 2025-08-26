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
        
        // --- ΝΕΟ ELEMENT ΓΙΑ ΤΟ VAULT ACCORDION ---
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
            a.data.beats = await beatsResponse.json();
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

    // --- VIEW RENDERING LOGIC ---
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
            backButton.innerHTML = '&larr; Επιστροφή σε όλα τα beats';
            a.beatListEl.appendChild(backButton);

            const beatElement = createBeatElement(beat, true);
            a.beatListEl.appendChild(beatElement);

            a.state.currentPlaylist = [beat];
            updatePlayingUI();
            hideLoader();
        }, 50);
    }

    // --- AUDIO PLAYER LOGIC ---
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

    // --- SHARE FUNCTIONALITY ---
    async function shareBeat(beat) {
        const shareUrl = `${window.location.origin}${window.location.pathname}?beat=${beat.id}`;
        if (navigator.share) {
            try { await navigator.share({ title: `Check out this beat: ${beat.title}`, text: `Listen to "${beat.title}" by VybezMadeThis!`, url: shareUrl }); }
            catch (err) { console.error('Share failed:', err); }
        } else {
            try { await navigator.clipboard.writeText(shareUrl); alert('Ο σύνδεσμος αντιγράφηκε!'); }
            catch (err) { alert('Η αντιγραφή απέτυχε.'); }
        }
    }
    
    // --- VIBE SEARCH LOGIC ---
    function displayRandomVibes() {
        if (!a.vibeBubblesContainer) return;
        a.vibeBubblesContainer.innerHTML = '';
        const shuffledVibes = [...a.data.vibes].sort(() => 0.5 - Math.random());
        shuffledVibes.slice(0, 6).forEach(vibe => {
            const bubble = document.createElement('div');
            bubble.className = 'vibe-bubble';
            bubble.textContent = vibe.name;
            bubble.dataset.vibeTags = vibe.tags.join(',');
            bubble.style.animationDuration = `${Math.random() * 2 + 3}s`;
            bubble.style.animationDelay = `-${Math.random() * 2}s`;
            bubble.addEventListener('click', () => {
                const tags = bubble.dataset.vibeTags.split(',');
                if (a.searchInput) a.searchInput.value = '';
                document.querySelector('#page-beats .filter-btn.active')?.classList.remove('active');
                renderFullBeatListView({ type: 'vibe', value: tags });
                closeVibeModal();
            });
            a.vibeBubblesContainer.appendChild(bubble);
        });
    }

    function openVibeModal() {
        if (!a.vibeModal || !document.body) return;
        a.vibeModal.classList.add('visible');
        document.body.classList.add('modal-open');
        displayRandomVibes();
        resizeVibeCanvas();
        if (a.state.vibeAnimationId) cancelAnimationFrame(a.state.vibeAnimationId);
        drawVibeVisualizer();
    }

    function closeVibeModal() {
        if (!a.vibeModal || !document.body) return;
        a.vibeModal.classList.remove('visible');
        document.body.classList.remove('modal-open');
    }
    
    // --- VIBE VISUALIZER ---
    function resizeVibeCanvas() {
        if (!a.vibeCanvas) return;
        const container = document.querySelector('#vibe-modal .vibe-modal-content');
        if (!container) return;
        const size = Math.min(container.clientWidth, container.clientHeight);
        a.vibeCanvas.width = size; a.vibeCanvas.height = size;
    }

    function drawVibeVisualizer() {
        if (!a.vibeCanvas) return;
        const ctx = a.vibeCanvas.getContext('2d'), r = a.vibeCanvas.width / 3.5, p = 128, cx = a.vibeCanvas.width/2, cy = a.vibeCanvas.height/2, t = Date.now()*0.0005;
        ctx.clearRect(0, 0, a.vibeCanvas.width, a.vibeCanvas.height);
        ctx.beginPath();
        for (let i = 0; i <= p; i++) {
            const angle = (i/p)*Math.PI*2, wave = Math.sin(t + i*0.5)*10, pulse = (Math.sin(t*2)+1)/2 * 15, currentRadius = r + wave + pulse;
            const x = cx + Math.cos(angle) * currentRadius, y = cy + Math.sin(angle) * currentRadius;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        const g = ctx.createRadialGradient(cx, cy, r - 20, cx, cy, r + 20);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(200,200,255,0.8)'); g.addColorStop(1, 'rgba(126,87,194,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 2; ctx.shadowColor = 'rgba(200,200,255,0.8)'; ctx.shadowBlur = 15;
        ctx.stroke(); ctx.shadowBlur = 0;
        a.state.vibeAnimationId = requestAnimationFrame(drawVibeVisualizer);
    }

    // --- INITIALIZATION & EVENT LISTENERS ---
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
            if (a.categoryButtons) a.categoryButtons.forEach(button => {
                button.addEventListener('click', () => {
                    a.categoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    const cat = button.dataset.category;
                    if(a.searchInput) a.searchInput.value = '';
                    
                    // --- ΛΟΓΙΚΗ ΓΙΑ ΤΗΝ ΕΜΦΑΝΙΣΗ ΤΩΝ INFO BOXES & VAULT ACCORDION ---
                    Object.values(a.infoBoxes).forEach(box => { if (box) box.style.display = 'none'; });
                    if (a.vaultInfoAccordion) {
                        if (cat === 'vault') {
                            a.vaultInfoAccordion.style.display = 'block';
                        } else {
                            a.vaultInfoAccordion.style.display = 'none';
                            a.vaultInfoAccordion.removeAttribute('open');
                        }
                    }
                    if (a.infoBoxes[cat]) {
                        a.infoBoxes[cat].style.display = 'block';
                    } else if (a.infoBoxes.general) {
                        a.infoBoxes.general.style.display = 'block';
                    }
                    
                    renderFullBeatListView({ type: 'category', value: cat });
                });
            });
            if(a.searchInput) a.searchInput.addEventListener('input', () => {
                a.categoryButtons.forEach(btn => btn.classList.remove('active'));
                Object.values(a.infoBoxes).forEach(box => { if (box) box.style.display = 'none'; });
                if (a.vaultInfoAccordion) a.vaultInfoAccordion.style.display = 'none'; // Απόκρυψη και στην αναζήτηση
                if (a.infoBoxes.general) a.infoBoxes.general.style.display = 'block';
                renderFullBeatListView({ type: 'search', value: a.searchInput.value });
            });
        }

        if(a.player.playPauseBtn) a.player.playPauseBtn.addEventListener('click', () => { if (a.mainAudio && a.mainAudio.src) a.mainAudio.paused ? a.mainAudio.play() : a.mainAudio.pause(); });
        if(a.player.nextBtn) a.player.nextBtn.addEventListener('click', playNext);
        if(a.player.prevBtn) a.player.prevBtn.addEventListener('click', playPrev);
        if(a.mainAudio) {
            a.mainAudio.addEventListener('play', () => { if(a.player.playPauseIcon) a.player.playPauseIcon.className = 'fas fa-pause'; updatePlayingUI(); });
            a.mainAudio.addEventListener('pause', () => { if(a.player.playPauseIcon) a.player.playPauseIcon.className = 'fas fa-play'; updatePlayingUI(); });
            a.mainAudio.addEventListener('ended', playNext);
            a.mainAudio.addEventListener('timeupdate', () => {
                if (!a.mainAudio) return; const { currentTime, duration } = a.mainAudio;
                if (duration && a.player.progressBar && a.player.timeDisplay) {
                    a.player.progressBar.style.width = `${(currentTime / duration) * 100}%`;
                    const formatTime = s => { if(isNaN(s)||s<0)return "0:00"; const m = Math.floor(s/60); const sc = Math.floor(s%60); return `${m}:${sc<10?'0':''}${sc}`; };
                    a.player.timeDisplay.textContent = `${formatTime(currentTime)} / ${formatTime(duration)}`;
                }
            });
        }
        if(a.player.progressBarContainer) a.player.progressBarContainer.addEventListener('click', e => { if (a.mainAudio && a.mainAudio.duration) a.mainAudio.currentTime = (e.offsetX/a.player.progressBarContainer.clientWidth)*a.mainAudio.duration; });
        
        // Vibe Modal Listeners
        if(a.vibeBtn) a.vibeBtn.addEventListener('click', openVibeModal);
        if(a.vibeModalClose) a.vibeModalClose.addEventListener('click', closeVibeModal);
        if(a.vibeModal) a.vibeModal.addEventListener('click', e => { if (e.target === a.vibeModal) closeVibeModal(); });
        if(a.shuffleVibesBtn) a.shuffleVibesBtn.addEventListener('click', displayRandomVibes);
        
        // Social Proof Modal Listeners
        if(a.socialProofConfirmBtn) {
            a.socialProofConfirmBtn.addEventListener('click', function() {
                const link = this.dataset.link;
                if (link) window.open(link, '_blank');
                if (a.socialProofModal) a.socialProofModal.classList.remove('visible');
            });
        }
        if(a.socialProofModalClose) {
            a.socialProofModalClose.addEventListener('click', () => {
                if (a.socialProofModal) a.socialProofModal.classList.remove('visible');
            });
        }
        if (a.socialProofModal) {
            a.socialProofModal.addEventListener('click', e => {
                if (e.target === a.socialProofModal) a.socialProofModal.classList.remove('visible');
            });
        }
        
        window.addEventListener('resize', resizeVibeCanvas);
    }

    loadData();
});