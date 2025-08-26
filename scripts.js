document.addEventListener('DOMContentLoaded', () => {
    const beatsContainer = document.getElementById('beatsContainer');
    const searchInput = document.getElementById('searchInput');

    let allBeats = [];

    fetch('beats.json')
        .then(response => response.json())
        .then(data => {
            allBeats = data.beatslist || [];
            renderBeats(allBeats);
        })
        .catch(error => {
            console.error('Error fetching beats:', error);
            beatsContainer.innerHTML = '<p>Error loading beats. Please try again later.</p>';
        });

    function renderBeats(beatsToRender) {
        beatsContainer.innerHTML = '';
        if (beatsToRender.length === 0) {
            beatsContainer.innerHTML = '<p>No beats found.</p>';
            return;
        }

        beatsToRender.forEach(beat => {
            const beatCard = document.createElement('div');
            beatCard.className = 'beat-card'; // Χρησιμοποιεί την κλάση από το CSS σου

            beatCard.innerHTML = `
                <div class="beat-info">
                    <h3>${beat.title}</h3>
                    <p>Category: ${beat.category || 'N/A'}</p>
                </div>
                <div class="beat-player">
                    <audio controls src="${beat.audioSrc}"></audio>
                </div>
                <div class="beat-actions">
                    <span class="price">${beat.price}</span>
                    <button class="buy-button">Αγορά</button>
                </div>
            `;

            const buyButton = beatCard.querySelector('.buy-button');
            if (beat.checkoutUrl) {
                buyButton.addEventListener('click', () => {
                    window.open(beat.checkoutUrl, '_blank');
                });
            } else {
                buyButton.disabled = true;
                buyButton.textContent = 'Μη Διαθέσιμο';
            }

            beatsContainer.appendChild(beatCard);
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredBeats = allBeats.filter(beat =>
                beat.title.toLowerCase().includes(searchTerm) ||
                (beat.category && beat.category.toLowerCase().includes(searchTerm))
            );
            renderBeats(filteredBeats);
        });
    }
});
