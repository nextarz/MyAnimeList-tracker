// script.js const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById("searchForm"); const queryInput = document.getElementById("queryInput"); const resultsContainer = document.getElementById("resultsContainer"); const airingContainer = document.getElementById("airingContainer");

const infoModal = document.getElementById("infoModal"); const closeModalBtn = document.getElementById("closeModalBtn"); const trailerContainer = document.getElementById("trailerContainer"); const trailerFrame = document.getElementById("trailerFrame"); const modalContent = document.getElementById("modalContent");

closeModalBtn.addEventListener("click", closeModal); window.addEventListener("keydown", e => { if (e.key === "Escape" && infoModal.open) closeModal(); });

function closeModal() { trailerFrame.src = ""; trailerContainer.classList.add("hidden"); infoModal.close(); searchForm.querySelector('button[type="submit"]').focus(); }

function createAnimeCard(anime) { const div = document.createElement("article"); div.className = "bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow"; div.tabIndex = 0;

const img = document.createElement("img"); img.src = anime.images?.jpg?.image_url || ""; img.alt = anime.title; img.className = "w-20 h-28 rounded-md object-cover border border-gray-600"; img.onerror = () => img.src = "https://via.placeholder.com/150x200?text=No+Image";

const info = document.createElement("div"); info.className = "flex flex-col justify-between";

const title = document.createElement("h3"); title.className = "font-semibold text-lg"; title.textContent = anime.title;

const synopsis = document.createElement("p"); synopsis.className = "line-clamp-4 text-sm text-slate-300"; synopsis.textContent = anime.synopsis || "No synopsis available.";

const score = document.createElement("p"); score.className = "text-slate-400 text-sm"; score.textContent = Score: ${anime.score ?? "N/A"};

info.append(title, synopsis, score); div.append(img, info); div.addEventListener("click", () => openModal(anime.mal_id)); return div; }

async function fetchAnime(query) { resultsContainer.innerHTML = <p class="text-center text-slate-400 mt-10">Loading...</p>; try { const res = await fetch(${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20); const { data } = await res.json(); const seen = new Set(); resultsContainer.innerHTML = ""; data.forEach(anime => { if (!seen.has(anime.mal_id)) { seen.add(anime.mal_id); resultsContainer.appendChild(createAnimeCard(anime)); } }); } catch (err) { console.error(err); resultsContainer.innerHTML = <p class="text-red-500 text-center">Failed to fetch anime.</p>; } }

async function fetchAiringAnime() { airingContainer.innerHTML = <p class="text-slate-400 text-center">Loading airing anime...</p>; let page = 1; let allAnime = []; const seen = new Set();

try { while (true) { const res = await fetch(${apiBase}/seasons/now?page=${page}); if (!res.ok) throw new Error(HTTP error! Status: ${res.status});

const json = await res.json();
  const animeList = json.data;

  if (animeList.length === 0) break;

  animeList.forEach(anime => {
    if (!seen.has(anime.mal_id)) {
      seen.add(anime.mal_id);
      allAnime.push(anime);
    }
  });

  if (!json.pagination.has_next_page) break;
  page++;
}

airingContainer.innerHTML = "";
allAnime.forEach(anime => {
  airingContainer.appendChild(createAnimeCard(anime));
});

} catch (err) { console.error("Airing fetch error:", err); airingContainer.innerHTML = <p class="text-red-500 text-center">Failed to load airing anime.</p>; } }

async function openModal(id) { window.scrollTo({ top: 0, behavior: "smooth" }); infoModal.showModal(); modalContent.innerHTML = <p class='text-slate-400 text-center'>Loading...</p>;

try { const [animeRes, charsRes] = await Promise.all([ fetch(${apiBase}/anime/${id}/full), fetch(${apiBase}/anime/${id}/characters) ]); const { data } = await animeRes.json(); const { data: characters } = await charsRes.json();

const cover = data.images.jpg.image_url;
const synopsis = (data.synopsis || "No synopsis available.").split(". ").slice(0, 2).join(". ") + ".";
const infoList = [
  `${data.type} · ${data.year ?? "Unknown"}`,
  `${data.status ?? "Unknown"}`,
  `${data.episodes ?? "??"} episode`,
  `${data.score ?? "N/A"}`
];
const genres = [...data.genres, ...data.themes].map(g => g.name);

modalContent.innerHTML = `
  <div class="flex flex-col sm:flex-row gap-4">
    <img src="${cover}" class="w-36 rounded shadow border border-gray-600" />
    <div class="flex-1 space-y-2">
      <h2 class="text-2xl font-bold">${data.title}</h2>
      <ul class="flex gap-2 text-sm text-slate-400 flex-wrap">
        ${infoList.map(item => `<li class="flex items-center gap-1">${item}</li>`).join("")}
      </ul>
      <div class="flex gap-2 flex-wrap">
        ${genres.map(g => `<span class="px-2 py-1 text-xs bg-slate-700 rounded">${g}</span>`).join("")}
      </div>
      <p class="text-sm mt-2 leading-relaxed">${synopsis}</p>
    </div>
  </div>
`;

} catch (err) { console.error(err); modalContent.innerHTML = <p class='text-red-500 text-center'>Failed to load anime detail.</p>; } }

searchForm.addEventListener("submit", e => { e.preventDefault(); fetchAnime(queryInput.value.trim()); });

window.onload = () => { queryInput.focus(); fetchAiringAnime(); document.getElementById("year").textContent = new Date().getFullYear(); };

