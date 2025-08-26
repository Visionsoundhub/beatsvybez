document.addEventListener("DOMContentLoaded", () => {
  const beatsContainer = document.getElementById("beatsContainer");
  const searchInput = document.getElementById("searchInput");
  const vibeButtons = document.querySelectorAll(".vibe-button");

  let allBeats = [];

  // Φόρτωση beats από beats.json
  fetch("beats.json")
    .then(res => res.json())
    .then(data => {
      allBeats = data.beatslist;
      renderBeats(allBeats);
    })
    .catch(err => console.error("Error loading beats:", err));

  function renderBeats(list) {
    beatsContainer.innerHTML = "";
    list.forEach((beat) => {
      const tags = beat.tags ? beat.tags.join(", ") : "";

      const beatCard = document.createElement("div");
      beatCard.classList.add("beat-card");

      beatCard.innerHTML = `
        <div class="beat-info">
          <h3 class="beat-title">${beat.title}</h3> 
          <p class="beat-meta"><strong>Κατηγορία:</strong> ${beat.category || "-"}</p>
          ${tags ? `<p class="beat-tags"><strong>Tags:</strong> ${tags}</p>` : ""}
          ${beat.bpm ? `<p><strong>BPM:</strong> ${beat.bpm}</p>` : ""}
          ${beat.key ? `<p><strong>Key:</strong> ${beat.key}</p>` : ""}
        </div>
        <div class="beat-actions">
          <audio controls src="${beat.audioSrc}" class="player"></audio>
          <div class="buy-box">
            <span class="price">${beat.price}</span>
            <button class="buy-button">Αγορά</button>
          </div>
        </div>
      `;

      beatCard.querySelector(".buy-button").addEventListener("click", () => {
        if (beat.checkoutUrl) {
          window.open(beat.checkoutUrl, "_blank");
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
        b.category.toLowerCase().includes(term) ||
        (b.tags && b.tags.some(t => t.toLowerCase().includes(term)))
    );
    renderBeats(filtered);
  });

  // 🎚️ Φίλτρα
  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vibe = btn.dataset.vibe;
      if (vibe === "all") {
        renderBeats(allBeats);
      } else {
        const filtered = allBeats.filter(
          (b) => b.category.toLowerCase() === vibe
        );
        renderBeats(filtered);
      }
    });
  });
});
