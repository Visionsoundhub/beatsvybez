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
      beatCard.innerHTML = `
        <div class="beat-info">
          <h3>${beat.title}</h3>
          <p>${beat.genre}</p>
        </div>
        <div class="beat-actions">
          <span class="price">${beat.price}</span>
          <button class="buy-button">Αγορά</button>
        </div>
      `;
      beatCard
        .querySelector(".buy-button")
        .addEventListener("click", () => handleBuy(beat));
      beatsContainer.appendChild(beatCard);
    });
  }

  function handleBuy(beat) {
    // Αυτή τη στιγμή απλά δείχνει μήνυμα – εδώ μπορείς να βάλεις PayPal / Email link
    alert(`Για αγορά του beat "${beat.title}" επικοινώνησε μαζί μας!`);
    // ή redirect:
    // window.location.href = "mailto:yourmail@example.com?subject=Αγορά beat: " + beat.title;
  }

  // ✅ Αναζήτηση
  searchInput.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allBeats.filter(
      (b) =>
        b.title.toLowerCase().includes(term) ||
        b.genre.toLowerCase().includes(term)
    );
    renderBeats(filtered);
  });

  // ✅ Filter buttons με Tag
  vibeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const vibe = btn.dataset.vibe;
      if (vibe === "all") {
        renderBeats(allBeats);
      } else {
        const filtered = allBeats.filter(
          (b) => b.genre.toLowerCase() === vibe.toLowerCase()
        );
        renderBeats(filtered);
      }
    });
  });
});
