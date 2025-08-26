<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Beat Store</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <header class="site-header">
    <h1 class="logo">Beat Store</h1>
  </header>

  <!-- 🔍 Αναζήτηση -->
  <section class="search-bar">
    <input 
      type="text" 
      id="searchInput" 
      placeholder="Αναζήτησε με τίτλο, tags ή κατηγορία..." 
    />
  </section>

  <!-- 🎶 Vibes / φίλτρα -->
  <section class="filters">
    <button class="vibe-button" data-vibe="all">Όλα</button>
    <button class="vibe-button" data-vibe="trap">Trap / Drill</button>
    <button class="vibe-button" data-vibe="latin">Latin Urban / Afro</button>
    <button class="vibe-button" data-vibe="lofi">Lofi</button>
    <button class="vibe-button" data-vibe="custom">Custom</button>
  </section>

  <!-- 📀 Beats -->
  <main>
    <div id="beatsContainer" class="beats-container"></div>
  </main>

  <footer class="site-footer">
    <p>© 2025 BeatStore | All Rights Reserved</p>
  </footer>

  <script src="scripts.js"></script>
</body>
</html>
