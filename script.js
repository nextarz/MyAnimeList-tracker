// anime_tracker_script.js const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById("searchForm"); const queryInput = document.getElementById("queryInput"); const resultsContainer = document.getElementById("resultsContainer"); const airingContainer = document.getElementById("airingContainer"); const airingSort = document.getElementById("airingSort"); const infoModal = document.getElementById("infoModal"); const modalTitle = document.getElementById("modalTitle"); const modalDesc = document.getElementById("modalDesc"); const modalInfoList = document.getElementById("modalInfoList"); const modalRating = document.getElementById("modalRating"); const closeModalBtn = document.getElementById("closeModalBtn"); const trailerContainer = document.getElementById("modalTrailer"); const trailerFrame = document.getElementById("trailerFrame");

// Modal close closeModalBtn.addEventListener("click", () => { infoModal.close(); });

// ESC key close window.addEventListener("keydown", (e) => { if (e.key === "Escape" && infoModal.open) { infoModal.close(); } });

function formatDate(dateStr) { if (!dateStr) return "Unknown"; const d = new Date(dateStr); return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric", }); }

function createAnimeCard(anime) { const div = document.createElement("article"); div.className = "bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow";

const img = document.createElement("img"); img.src = anime.images.jpg.image_url; img.alt = anime.title; img.className = "w-20 h-28 rounded-md object-cover border border-gray-600"; img.onerror = () => { img.src = "https://via.placeholder.com/150x210?text=No+Image"; };

const info = document.createElement("div"); info.className = "flex flex-col justify-between";

const title = document.createElement("h3"); title.className = "font-semibold text-lg leading-tight"; title.textContent = anime.title;

const synopsis = document.createElement("p"); synopsis.className = "text-slate-300 text-sm mt-1 line-clamp-4"; synopsis.textContent = anime.synopsis || "No synopsis available.";

const score = document.createElement("p"); score.className = "text-slate-400 text-sm"; score.textContent = Score: ${anime.score ?? "N/A"};

info.append(title, synopsis, score); div.append(img, info);

div.addEventListener("click", () => openModal(anime.mal_id));

return div; }

async function fetchAnime(query) { resultsContainer.innerHTML = <p class="text-center text-slate-400">Loading...</p>; try { const res = await fetch(${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20); const { data } = await res.json(); resultsContainer.innerHTML = "";

if (data.length === 0) {
  resultsContainer.innerHTML = `<p class="text-center text-slate-400">No results found for "${query}"</p>`;
  return;
}

const seen = new Set();
for (const anime of data) {
  if (!seen.has(anime.mal_id)) {
    resultsContainer.appendChild(createAnimeCard(anime));
    seen.add(anime.mal_id);
  }
}

} catch (err) { resultsContainer.innerHTML = <p class="text-red-500 text-center">Failed to fetch results.</p>; console.error(err); } }

async function fetchAiringAnime(sort = "popularity") { airingContainer.innerHTML = <p class="text-center text-slate-400">Loading airing anime...</p>; try { const res = await fetch(${apiBase}/seasons/now); const { data } = await res.json();

let list = data;
if (sort === "score") list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
else if (sort === "date") list.sort((a, b) => new Date(b.aired.from) - new Date(a.aired.from));

airingContainer.innerHTML = "";
const seen = new Set();
list.forEach(anime => {
  if (!seen.has(anime.mal_id)) {
    airingContainer.appendChild(createAnimeCard(anime));
    seen.add(anime.mal_id);
  }
});

} catch (err) { airingContainer.innerHTML = <p class="text-red-500 text-center">Failed to load airing anime.</p>; console.error(err); } }

async function openModal(id) { modalTitle.textContent = "Loading..."; modalDesc.textContent = ""; modalInfoList.innerHTML = ""; modalRating.textContent = ""; trailerContainer.classList.add("hidden"); trailerFrame.src = ""; infoModal.showModal();

try { const res = await fetch(${apiBase}/anime/${id}/full); const { data } = await res.json();

modalTitle.textContent = data.title;
modalDesc.textContent = data.synopsis || "No synopsis available.";
modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";

const infoList = [
  { label: "Episodes", value: data.episodes },
  { label: "Studio", value: data.studios.map(s => s.name).join(", ") },
  { label: "Producers", value: data.producers.map(p => p.name).join(", ") },
  { label: "Release Date", value: formatDate(data.aired.from) },
  { label: "Status", value: data.status },
  { label: "Genres", value: data.genres.map(g => g.name).join(", ") }
];

infoList.forEach(item => {
  const li = document.createElement("li");
  li.innerHTML = `<span class="font-semibold text-blue-400">${item.label}:</span> ${item.value || "Unknown"}`;
  modalInfoList.appendChild(li);
});

if (data.trailer?.embed_url) {
  trailerContainer.classList.remove("hidden");
  trailerFrame.src = data.trailer.embed_url;
}

} catch (err) { modalTitle.textContent = "Failed to load details"; modalDesc.textContent = "Please try again later."; console.error(err); } }

// Initial searchForm.addEventListener("submit", e => { e.preventDefault(); const query = queryInput.value.trim(); if (query) fetchAnime(query); });

window.onload = () => { fetchAiringAnime(); document.getElementById("year").textContent = new Date().getFullYear(); };

airingSort.addEventListener("change", () => { fetchAiringAnime(airingSort.value); });

