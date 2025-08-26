document.addEventListener("DOMContentLoaded", () => {
  const beatsContainer = document.getElementById("beatsContainer");
  const searchInput = document.getElementById("searchInput");
  const vibeButtons = document.querySelectorAll(".vibe-button"); // Υποθέτω ότι έχεις κουμπιά με class="vibe-button"

  let allBeats = [];

  // Φόρτωση beats από beats.json
  fetch("beats.json")
    .then(res => res.json())
    .then(data => {
      allBeats = data.beatslist; // Υποθέτω ότι το beats.json έχει το "beatslist" array
      renderBeats(allBeats);
    })
    .catch(err => console.error("Error loading beats:", err));

  function renderBeats(list) {
    beatsContainer.innerHTML = "";
    if (list.length === 0) {
      beatsContainer.innerHTML = "<p class='no-beats-message'>Δεν βρέθηκαν beats.</p>";
      return;
    }

    list.forEach((beat) => {
      const tags = beat.tags ? beat.tags.join(", ") : "";

      const beatCard = document.createElement("div");
      beatCard.classList.add("beat-card"); // Χρησιμοποιούμε την κλάση σου για styling

      beatCard.innerHTML = `
        <div class="beat-header">
          <h3 class="beat-title">${beat.title}</h3> 
        </div>
        <div class="beat-details">
          <p class="beat-category"><strong>Κατηγορία:</strong> ${beat.category || "-"}</p>
          ${tags ? `<p class="beat-tags"><strong>Tags:</strong> ${tags}</p>` : ""}
          ${beat.bpm ? `<p class="beat-bpm"><strong>BPM:</strong> ${beat.bpm}</p>` : ""}
          ${beat.key ? `<p class="beat-key"><strong>Key:</strong> ${beat.key}</p>` : ""}
        </div>
        <div class="beat-player">
          <audio controls src="${beat.audioSrc}" class="audio-player"></audio>
        </div>
        <div class="beat-actions">
          <span class="price">${beat.price}</span>
          <button class="buy-button">Αγορά</button>
        </div>
      `;

      beatCard.querySelector(".buy-button").addEventListener("click", () => {
        if (beat.checkoutUrl) {
          window.open(beat.checkoutUrl, "_blank"); // Ανοίγει το Payhip link
        } else {
          alert(`Επικοινώνησε για αγορά: ${beat.title}`);
        }
      });

      beatsContainer.appendChild(beatCard);
    });
  }

  // 🔍 Αναζήτηση
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allBeats.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        (b.category && b.category.toLowerCase().includes(term)) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
    );
    renderBeats(filtered);
  });

  // 🎚️ Φίλτρα
  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      vibeButtons.forEach(b => b.classList.remove('active')); // Αφαιρεί active από όλα
      btn.classList.add('active'); // Προσθέτει active στο πατημένο

      const vibe = btn.dataset.vibe;
      if (vibe === "all") {
        renderBeats(allBeats);
      } else {
        const filtered = allBeats.filter(
          (b) => b.category && b.category.toLowerCase() === vibe
        );
        renderBeats(filtered);
      }
    });
  });
});
