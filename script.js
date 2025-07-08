
const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const resultsContainer = document.getElementById("resultsContainer");
const airingContainer = document.getElementById("airingContainer");

const infoModal = document.getElementById("infoModal");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDesc");
const modalInfoList = document.getElementById("modalInfoList");
const modalRating = document.getElementById("modalRating");
const modalCountdown = document.getElementById("modalCountdown");
const trailerContainer = document.getElementById("trailerContainer");
const trailerFrame = document.getElementById("trailerFrame");
const modalCharacters = document.querySelector("#modalCharacters .grid");
const closeModalBtn = document.getElementById("closeModalBtn");

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

async function fetchAnime(query) {
  resultsContainer.innerHTML = `<p class="text-slate-400 text-center">Loading...</p>`;
  try {
    const res = await fetch(`${apiBase}/anime?q=${encodeURIComponent(query)}&order_by=popularity&sort=asc&limit=20`);
    const { data } = await res.json();
    resultsContainer.innerHTML = "";
    const seen = new Set();
    data.forEach(anime => {
      if (!seen.has(anime.mal_id)) {
        seen.add(anime.mal_id);
        resultsContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    console.error("Search error:", err);
    resultsContainer.innerHTML = `<p class="text-red-500 text-center">Failed to search anime.</p>`;
  }
}

async function fetchAiringAnime() {
  airingContainer.innerHTML = `<p class="text-slate-400 text-center">Loading airing anime...</p>`;
  const seen = new Set();
  let page = 1, allAnime = [];

  try {
    while (true) {
      const res = await fetch(`${apiBase}/seasons/now?page=${page}`);
      if (!res.ok) break;
      const json = await res.json();
      const data = json.data;

      if (!data || data.length === 0) break;

      data.forEach(anime => {
        if (!seen.has(anime.mal_id)) {
          seen.add(anime.mal_id);
          allAnime.push(anime);
        }
      });

      if (!json.pagination?.has_next_page) break;
      page++;
      await new Promise(r => setTimeout(r, 500));
    }

    airingContainer.innerHTML = "";
    allAnime.forEach(anime => {
      airingContainer.appendChild(createAnimeCard(anime));
    });
  } catch (err) {
    console.error("Airing fetch error:", err);
    airingContainer.innerHTML = `<p class="text-red-500 text-center">Failed to load airing anime.</p>`;
  }
}

async function openModal(id) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  infoModal.showModal();

  modalTitle.textContent = "Loading...";
  modalDesc.textContent = "";
  modalInfoList.innerHTML = "";
  modalRating.textContent = "";
  modalCountdown.textContent = "";
  modalCharacters.innerHTML = "";
  trailerFrame.src = "";
  trailerContainer.classList.add("hidden");

  try {
    const [animeRes, charsRes] = await Promise.all([
      fetch(`${apiBase}/anime/${id}/full`),
      fetch(`${apiBase}/anime/${id}/characters`)
    ]);
    const { data } = await animeRes.json();
    const { data: characters } = await charsRes.json();

    modalTitle.textContent = data.title;

    const originalSynopsis = data.synopsis || "Sinopsis tidak tersedia.";
    modalDesc.textContent = originalSynopsis;
    translateToIndo(originalSynopsis).then(translated => {
      if (translated && translated !== originalSynopsis) {
        modalDesc.textContent = translated;
      }
    });

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

    if (data.trailer?.embed_url) {
      trailerFrame.src = `${data.trailer.embed_url}?autoplay=0&mute=0`;
      trailerContainer.classList.remove("hidden");
    }

    if (data.broadcast?.time && data.broadcast?.day && data.status === "Currently Airing") {
      const nextEpTime = parseBroadcastTime(data.broadcast.time, data.broadcast.day);
      updateCountdownDisplay(nextEpTime, data.episodes || 0);
    }

  } catch (err) {
    console.error(err);
    modalTitle.textContent = "Error";
    modalDesc.textContent = "Failed to load anime detail.";
  }
}

function parseBroadcastTime(timeStr, dayStr) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const now = new Date();
  const [hour, minute] = timeStr.split(":").map(Number);
  let target = new Date();
  target.setUTCHours(hour, minute, 0, 0);
  target.setUTCDate(now.getUTCDate() + ((7 + days.indexOf(dayStr) - now.getUTCDay()) % 7));
  if (target < now) target.setUTCDate(target.getUTCDate() + 7);
  return target;
}

function updateCountdownDisplay(nextDate, currentEp) {
  function update() {
    const now = new Date();
    const diff = nextDate - now;
    if (diff <= 0) {
      modalCountdown.textContent = `📺 Current Episode: ${currentEp + 1} | ⏳ Next in: airing now!`;
      return;
    }
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    modalCountdown.textContent = `📺 Current Episode: ${currentEp} | ⏳ Next in: ${days}d ${hours}h ${mins}m ${secs}s`;
  }
  update();
  const interval = setInterval(update, 1000);
  infoModal.addEventListener("close", () => clearInterval(interval));
}

async function translateToIndo(text) {
  const encoded = encodeURIComponent(text);
  try {
    const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=id&dt=t&q=${encoded}`);
    const data = await res.json();
    return data[0].map(t => t[0]).join("") || text;
  } catch (err) {
    console.error("Translate error:", err);
    return text;
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
