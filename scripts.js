document.addEventListener("DOMContentLoaded", () => {
  const beatsContainer = document.getElementById("beatsContainer");
  const searchInput = document.getElementById("searchInput");
  const vibeButtons = document.querySelectorAll(".vibe-button");

  let allBeats = [];

  // Φόρτωση beats από το beats.json
  fetch("beats.json")
    .then((res) => res.json())
    .then((data) => {
      allBeats = data.beatslist;
      renderBeats(allBeats);
    })
    .catch((err) => console.error("Error loading beats:", err));

  function renderBeats(list) {
    beatsContainer.innerHTML = "";
    list.forEach((beat) => {
      const beatCard = document.createElement("div");
      beatCard.classList.add("beat-card");

      // Tags formatting
      const tags = beat.tags ? beat.tags.join(", ") : "";

      beatCard.innerHTML = `
        <div class="beat-info">
          <h3>${beat.title}</h3>
          <p><strong>Κατηγορία:</strong> ${beat.category || "N/A"}</p>
          ${tags ? `<p><strong>Tags:</strong> ${tags}</p>` : ""}
          ${beat.bpm ? `<p><strong>BPM:</strong> ${beat.bpm}</p>` : ""}
          ${beat.key ? `<p><strong>Key:</strong> ${beat.key}</p>` : ""}
        </div>
        <div class="beat-actions">
          <audio controls src="${beat.audioSrc}"></audio>
          <span class="price">${beat.price}</span>
          <button class="buy-button">Αγορά</button>
        </div>
      `;
      
      // Buy button event
      beatCard.querySelector(".buy-button").addEventListener("click", () => {
        if (beat.checkoutUrl) {
          window.open(beat.checkoutUrl, "_blank"); // redirect σε Payhip / link
        } else {
          alert(`Για αγορά του beat "${beat.title}" επικοινώνησε μαζί μας!`);
        }
      });

      beatsContainer.appendChild(beatCard);
    });
  }

  // ✅ Αναζήτηση
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

  // ✅ Filter buttons
  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vibe = btn.dataset.vibe;
      if (vibe === "all") {
        renderBeats(allBeats);
      } else {
        const filtered = allBeats.filter(
          (b) => b.category.toLowerCase() === vibe.toLowerCase()
        );
        renderBeats(filtered);
      }
    });
  });
});
