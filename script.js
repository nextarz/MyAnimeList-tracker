// script.js const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById("searchForm"); const queryInput = document.getElementById("queryInput"); const resultsContainer = document.getElementById("resultsContainer"); const airingContainer = document.getElementById("airingContainer");

const infoModal = document.getElementById("infoModal"); const modalTitle = document.getElementById("modalTitle"); const modalDesc = document.getElementById("modalDesc"); const modalInfoList = document.getElementById("modalInfoList"); const modalRating = document.getElementById("modalRating"); const closeModalBtn = document.getElementById("closeModalBtn");

const trailerContainer = document.getElementById("trailerContainer"); const trailerFrame = document.getElementById("trailerFrame"); const modalLayout = document.getElementById("modalLayout");

const modalCharacters = document.querySelector("#modalCharacters .grid");

// Close modal closeModalBtn.addEventListener("click", closeModal); window.addEventListener("keydown", e => { if (e.key === "Escape" && infoModal.open) closeModal(); });

function closeModal() { trailerFrame.src = ""; trailerContainer.classList.add("hidden"); infoModal.close(); searchForm.querySelector('button[type="submit"]').focus(); }

// Build anime card function createAnimeCard(anime) { const div = document.createElement("article"); div.className = "bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow"; div.tabIndex = 0;

const img = document.createElement("img"); img.src = anime.images?.jpg?.image_url || ""; img.alt = anime.title; img.className = "w-20 h-28 rounded-md object-cover border border-gray-600"; img.onerror = () => img.src = "https://via.placeholder.com/150x200?text=No+Image";

const info = document.createElement("div"); info.className = "flex flex-col justify-between";

const title = document.createElement("h3"); title.className = "font-semibold text-lg"; title.textContent = anime.title;

const synopsis = document.createElement("p"); synopsis.className = "line-clamp-4 text-sm text-slate-300"; synopsis.textContent = anime.synopsis || "No synopsis available.";

const score = document.createElement("p"); score.className = "text-slate-400 text-sm"; score.textContent = Score: ${anime.score ?? "N/A"};

info.append(title, synopsis, score); div.append(img, info); div.addEventListener("click", () => openModal(anime.mal_id)); return div; }

// Search anime async function fetchAnime(query) { resultsContainer.innerHTML = <p class="text-center text-slate-400 mt-10">Loading...</p>; try { const res = await fetch(${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20); const { data } = await res.json(); const seen = new Set(); resultsContainer.innerHTML = ""; data.forEach(anime => { if (!seen.has(anime.mal_id)) { seen.add(anime.mal_id); resultsContainer.appendChild(createAnimeCard(anime)); } }); } catch (err) { console.error(err); resultsContainer.innerHTML = <p class="text-red-500 text-center">Failed to fetch anime.</p>; } }

// Fetch all airing pages async function fetchAiringAnime() { airingContainer.innerHTML = <p class="text-slate-400 text-center">Loading airing anime...</p>; let page = 1; let allAnime = []; const seen = new Set();

try { while (true) { const res = await fetch(${apiBase}/seasons/now?page=${page}); if (!res.ok) throw new Error(HTTP error! Status: ${res.status});

const json = await res.json();
  const animeList = json.data;

  if (animeList.length === 0) break;

  animeList.forEach((anime) => {
    if (!seen.has(anime.mal_id)) {
      seen.add(anime.mal_id);
      allAnime.push(anime);
    }
  });

  if (!json.pagination.has_next_page) break;
  page++;
}

airingContainer.innerHTML = "";
allAnime.forEach((anime) => {
  airingContainer.appendChild(createAnimeCard(anime));
});

} catch (err) { console.error("Airing fetch error:", err); airingContainer.innerHTML = <p class="text-red-500 text-center">Failed to load airing anime.</p>; } }

// Open modal with details async function openModal(id) { window.scrollTo({ top: 0, behavior: "smooth" }); infoModal.showModal(); modalLayout.innerHTML = <p class="text-center text-slate-400">Loading...</p>;

try { const [animeRes, charsRes] = await Promise.all([ fetch(${apiBase}/anime/${id}/full), fetch(${apiBase}/anime/${id}/characters) ]); const { data } = await animeRes.json(); const { data: characters } = await charsRes.json();

const html = `
  <div class="flex gap-5 mb-4">
    <img src="${data.images.jpg.image_url}" alt="${data.title}" class="w-32 h-44 rounded-md object-cover border border-slate-600"/>
    <div class="flex-1">
      <h2 class="text-2xl font-bold mb-1">${data.title}</h2>
      <div class="flex flex-wrap gap-1 mb-2">
        ${data.genres.map(g => `<span class="bg-blue-600 text-xs px-2 py-0.5 rounded">${g.name}</span>`).join(" ")}
      </div>
      <p class="text-sm text-slate-300 line-clamp-5">${data.synopsis || "No synopsis available."}</p>
    </div>
  </div>
  <ul class="text-sm space-y-1 mb-4">
    <li><span class="text-blue-400 font-semibold">Episodes:</span> ${data.episodes ?? "Unknown"}</li>
    <li><span class="text-blue-400 font-semibold">Status:</span> ${data.status}</li>
    <li><span class="text-blue-400 font-semibold">Aired:</span> ${data.aired.string}</li>
    <li><span class="text-blue-400 font-semibold">Broadcast:</span> ${data.broadcast.string}</li>
    <li><span class="text-blue-400 font-semibold">Studios:</span> ${data.studios.map(s => s.name).join(", ")}</li>
    <li><span class="text-blue-400 font-semibold">Themes:</span> ${data.themes.map(t => t.name).join(", ")}</li>
    <li><span class="text-blue-400 font-semibold">Source:</span> ${data.source}</li>
    <li><span class="text-blue-400 font-semibold">Duration:</span> ${data.duration}</li>
    <li><span class="text-blue-400 font-semibold">Rating:</span> ${data.rating}</li>
    <li><span class="text-blue-400 font-semibold">Score:</span> ${data.score ?? "N/A"}</li>
  </ul>
  <h3 class="font-bold text-lg mb-2">Karakter</h3>
  <div class="grid grid-cols-3 gap-3 mb-4">
    ${characters.slice(0, 6).map(char => `
      <div class="flex flex-col items-center">
        <img src="${char.character.images.jpg.image_url}" alt="${char.character.name}" class="w-16 h-20 rounded shadow border border-gray-600 mb-1 object-cover" />
        <span class="text-xs text-center">${char.character.name}</span>
      </div>
    `).join("")}
  </div>
  ${data.trailer?.embed_url ? `
    <div class="aspect-video w-full rounded overflow-hidden">
      <iframe src="${data.trailer.embed_url}?autoplay=0&mute=0" class="w-full h-full" allowfullscreen loading="lazy"></iframe>
    </div>` : ""}
`;

modalLayout.innerHTML = html;

} catch (err) { console.error(err); modalLayout.innerHTML = <p class="text-red-500 text-center">Failed to load anime detail.</p>; } }

searchForm.addEventListener("submit", e => { e.preventDefault(); fetchAnime(queryInput.value.trim()); });

window.onload = () => { queryInput.focus(); fetchAiringAnime(); document.getElementById("year").textContent = new Date().getFullYear(); };

