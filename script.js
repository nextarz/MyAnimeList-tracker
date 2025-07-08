// script.js
const apiBase = "https://api.jikan.moe/v4";
let countdownInterval; // Buat simpen interval
const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const resultsContainer = document.getElementById("resultsContainer");
const airingContainer = document.getElementById("airingContainer");

const infoModal = document.getElementById("infoModal");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalInfoList = document.getElementById("modalInfoList");
const modalRating = document.getElementById("modalRating");
const closeModalBtn = document.getElementById("closeModalBtn");

const trailerContainer = document.getElementById("trailerContainer");
const trailerFrame = document.getElementById("trailerFrame");

const modalCharacters = document.querySelector("#modalCharacters .grid");

// Close modal
closeModalBtn.addEventListener("click", closeModal);
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && infoModal.open) closeModal();
});

function closeModal() {
  trailerFrame.src = "";
  trailerContainer.classList.add("hidden");
  infoModal.close();
  searchForm.querySelector('button[type="submit"]').focus();
}

// Anime card
function createAnimeCard(anime) {
  const div = document.createElement("article");
  div.className = "bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow";
  div.tabIndex = 0;

  const img = document.createElement("img");
  img.src = anime.images?.jpg?.image_url || "";
  img.alt = anime.title;
  img.className = "w-20 h-28 rounded-md object-cover border border-gray-600";
  img.onerror = () => img.src = "https://via.placeholder.com/150x200?text=No+Image";

  const info = document.createElement("div");
  info.className = "flex flex-col justify-between";

  const title = document.createElement("h3");
  title.className = "font-semibold text-lg";
  title.textContent = anime.title;

  const synopsis = document.createElement("p");
  synopsis.className = "line-clamp-4 text-sm text-slate-300";
  synopsis.textContent = anime.synopsis || "No synopsis available.";

  const score = document.createElement("p");
  score.className = "text-slate-400 text-sm";
  score.textContent = `Score: ${anime.score ?? "N/A"}`;

  info.append(title, synopsis, score);
  div.append(img, info);
  div.addEventListener("click", () => openModal(anime.mal_id));
  return div;
}

// Search anime
async function fetchAiringAnime() {
  airingContainer.innerHTML = `<p class="text-slate-400 text-center">Loading airing anime...</p>`;
  try {
    const res = await fetch("https://api.jikan.moe/v4/seasons/now");

    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    const { data } = await res.json();
    airingContainer.innerHTML = "";
    const seen = new Set();
    data.forEach((anime) => {
      if (!seen.has(anime.mal_id)) {
        seen.add(anime.mal_id);
        airingContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    console.error("Airing fetch error:", err);
    airingContainer.innerHTML = `<p class="text-red-500 text-center">Failed to load airing anime.</p>`;
  }
}

// Anime airing/berlangsung 
async function fetchAiringAnime() {
  airingContainer.innerHTML = `<p class="text-slate-400 text-center">Loading airing anime...</p>`;
  const seen = new Set();
  let page = 1;
  let allAnime = [];

  try {
    while (true) {
      const res = await fetch(`${apiBase}/seasons/now?page=${page}`);
      if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
      const json = await res.json();
      const data = json.data;

      if (!data || data.length === 0) break;

      data.forEach((anime) => {
        if (!seen.has(anime.mal_id)) {
          seen.add(anime.mal_id);
          allAnime.push(anime);
        }
      });

      if (!json.pagination?.has_next_page) break;
      page++;
    
    // Tambahin delay 500ms biar gak diban
  await new Promise(r => setTimeout(r, 500));
}

    airingContainer.innerHTML = "";
    allAnime.forEach((anime) => {
      airingContainer.appendChild(createAnimeCard(anime));
    });
  } catch (err) {
    console.error("Airing fetch error:", err);
    airingContainer.innerHTML = `<p class="text-red-500 text-center">Failed to load airing anime.</p>`;
  }
}

// Open modal untuk detail anime
async function openModal(id) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  infoModal.showModal();

  modalTitle.textContent = "Loading...";
  modalDesc.textContent = "";
  modalInfoList.innerHTML = "";
  modalRating.textContent = "";
  modalCharacters.innerHTML = "";
  trailerFrame.src = "";
  trailerContainer.classList.add("hidden");
  document.getElementById("modalCountdown").textContent = "";

  try {
    const [animeRes, charsRes] = await Promise.all([
      fetch(`${apiBase}/anime/${id}/full`),
      fetch(`${apiBase}/anime/${id}/characters`)
    ]);
    const { data } = await animeRes.json();
    const { data: characters } = await charsRes.json();

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.synopsis || "No synopsis available.";
    modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";

    const info = [
      { label: "Episodes", value: data.episodes ?? "Unknown" },
      { label: "Status", value: data.status ?? "Unknown" },
      { label: "Aired", value: data.aired?.string ?? "Unknown" },
      { label: "Broadcast", value: data.broadcast?.string ?? "Unknown" },
      { label: "Studios", value: data.studios.map(s => s.name).join(", ") || "Unknown" },
      { label: "Genres", value: data.genres.map(g => g.name).join(", ") || "Unknown" },
      { label: "Themes", value: data.themes.map(t => t.name).join(", ") || "Unknown" },
      { label: "Source", value: data.source || "Unknown" },
      { label: "Duration", value: data.duration || "Unknown" },
      { label: "Rating", value: data.rating || "Unknown" }
    ];
    modalInfoList.innerHTML = info.map(i =>
      `<li><span class="font-semibold text-blue-400">${i.label}:</span> ${i.value}</li>`
    ).join("");

    characters.slice(0, 6).forEach(char => {
      const div = document.createElement("div");
      div.className = "flex flex-col items-center";
      div.innerHTML = `
        <img src="${char.character.images.jpg.image_url}" alt="${char.character.name}" class="w-16 h-20 rounded shadow border border-gray-600 mb-1 object-cover" />
        <span class="text-xs">${char.character.name}</span>`;
      modalCharacters.appendChild(div);
    });
    
// trailer
if (data.trailer?.embed_url) {
  trailerFrame.src = `${data.trailer.embed_url}?autoplay=0&mute=0`;
  trailerContainer.classList.remove("hidden");
}

// COUNTDOWN DARI ANILIST 
const ani = await fetchAniListAiring(data.mal_id);

const countdownEl = document.getElementById("modalCountdown");
if (ani && ani.airingAt && ani.episode) {
  const nextEpNum = ani.episode;
  const currentEp = nextEpNum - 1;
  const nextAirMs = new Date(ani.airingAt * 1000).getTime();

  const update = () => {
    const now = Date.now();
    const diff = nextAirMs - now;

    if (diff <= 0) {
      countdownEl.textContent = `📺 Current Episode: ${nextEpNum} | ⏳ Airing now!`;
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    countdownEl.textContent =
      `📺 Current Episode: ${currentEp} | ⏳ Next Episode (${nextEpNum}) in: ${days}d ${hours}h ${mins}m ${secs}s`;
  };

  update();
  // Sebelum bikin interval baru
if (countdownInterval) clearInterval(countdownInterval);

// Bikin interval
countdownInterval = setInterval(update, 1000);
} else {
  countdownEl.textContent = `📺 Episode info not available`;
}

  } catch (err) {
    console.error("Modal Error:", err);
    modalTitle.textContent = "Error";
    modalDesc.textContent = "Failed to load anime detail.";
  }
}

//helper cuountdown 
async function fetchAniListAiring(idMal) {
  const query = `
    query ($id: Int) {
      Media(idMal: $id, type: ANIME) {
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }
  `;
  const res = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ query, variables: { id: idMal } })
  });
  const json = await res.json();
  return json.data?.Media?.nextAiringEpisode || null;
}


// pencarian anime
async function fetchAnime(query) {
  if (!query) return;

  resultsContainer.innerHTML = `<p class="text-slate-400 text-center">Searching for "${query}"...</p>`;
  try {
    const res = await fetch(`${apiBase}/anime?q=${encodeURIComponent(query)}&limit=25`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const { data } = await res.json();
    resultsContainer.innerHTML = "";

    if (!data.length) {
      resultsContainer.innerHTML = `<p class="text-slate-400 text-center">No results for "${query}".</p>`;
      return;
    }

    const seen = new Set();
    data.forEach(anime => {
      const uniqueKey = `${anime.mal_id}-${anime.title}`.toLowerCase().trim();
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        resultsContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    console.error("Search error:", err);
    resultsContainer.innerHTML = `<p class="text-red-500 text-center">Failed to fetch search results.</p>`;
  }
}

searchForm.addEventListener("submit", e => {
  e.preventDefault();
  fetchAnime(queryInput.value.trim());
});

window.onload = () => {
  queryInput.focus();
  fetchAiringAnime();
  document.getElementById("year").textContent = new Date().getFullYear();
};