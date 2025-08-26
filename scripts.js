document.addEventListener("DOMContentLoaded", () => {
  const beatsContainer = document.getElementById("beatsContainer");
  const searchInput = document.getElementById("searchInput");

  let allBeats = [];

  // Φόρτωση beats από το beats.json
  fetch("beats.json")
    .then(res => res.json())
    .then(data => {
      // Το Admin αποθηκεύει τα beats στο "beatslist"
      allBeats = data.beatslist || []; 
      renderBeats(allBeats);
    })
    .catch(err => {
      console.error("Δεν μπόρεσα να φορτώσω το beats.json:", err);
      beatsContainer.innerHTML = "<p>Σφάλμα κατά τη φόρτωση των beats.</p>";
    });

  function renderBeats(list) {
    beatsContainer.innerHTML = "";
    if (!list || list.length === 0) {
      beatsContainer.innerHTML = "<p>Δεν υπάρχουν διαθέσιμα beats αυτή τη στιγμή.</p>";
      return;
    }

    list.forEach((beat) => {
      // Δημιουργούμε το HTML για κάθε beat, χρησιμοποιώντας τις κλάσεις από το styles.css σου
      const beatCard = document.createElement("div");
      beatCard.className = "beat-card"; // Υποθέτω ότι έχεις μια τέτοια κλάση

      beatCard.innerHTML = `
        <div class="beat-info">
          <h3>${beat.title}</h3>
          <p>Κατηγορία: ${beat.category || 'N/A'}</p>
        </div>
        <div class="beat-player">
          <audio controls src="${beat.audioSrc}"></audio>
        </div>
        <div class="beat-actions">
          <span class="price">${beat.price}</span>
          <button class="buy-button">Αγορά</button>
        </div>
      `;

      // Λειτουργία κουμπιού "Αγορά"
      beatCard.querySelector(".buy-button").addEventListener("click", () => {
        if (beat.checkoutUrl) {
          window.open(beat.checkoutUrl, "_blank");
        } else {
          alert("Για αγορά, επικοινωνήστε μαζί μας.");
        }
      });

      beatsContainer.appendChild(beatCard);
    });
  }

  // Λειτουργία αναζήτησης
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allBeats.filter(b => 
        b.title.toLowerCase().includes(term) ||
        (b.category && b.category.toLowerCase().includes(term))
      );
      renderBeats(filtered);
    });
  }
});
