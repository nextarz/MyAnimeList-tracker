// script.js
const apiBase = "https://api.jikan.moe/v4";

// elements
const searchForm = document.getElementById("searchForm");
const queryInput = document.getElementById("queryInput");
const resultsContainer = document.getElementById("resultsContainer");
const airingContainer = document.getElementById("airingContainer");

const infoModal = document.getElementById("infoModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalContent = document.getElementById("modalContent");

// close modal handlers
closeModalBtn.addEventListener("click", () => infoModal.close());
window.addEventListener("keydown", e => {
  if (e.key === "Escape" && infoModal.open) infoModal.close();
});

// build card
function createAnimeCard(anime) {
  const div = document.createElement("article");
  div.className = "bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow";
  div.tabIndex = 0;

  div.innerHTML = `
    <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="w-20 h-28 rounded-md object-cover border border-gray-600" />
    <div class="flex flex-col justify-between">
      <h3 class="font-semibold text-lg">${anime.title}</h3>
      <p class="line-clamp-4 text-sm text-slate-300">${anime.synopsis || "No synopsis."}</p>
      <p class="text-slate-400 text-sm">Score: ${anime.score ?? "N/A"}</p>
    </div>
  `;
  div.addEventListener("click", () => openModal(anime.mal_id));
  return div;
}

// search
async function fetchAnime(query) {
  resultsContainer.innerHTML = '<p class="text-center text-slate-400 mt-10">Loading...</p>';
  try {
    const res = await fetch(`${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20`);
    const { data } = await res.json();
    resultsContainer.innerHTML = "";
    const seen = new Set();
    data.forEach(a => {
      if (!seen.has(a.mal_id)) {
        seen.add(a.mal_id);
        resultsContainer.appendChild(createAnimeCard(a));
      }
    });
  } catch {
    resultsContainer.innerHTML = '<p class="text-red-500 text-center">Failed to fetch anime.</p>';
  }
}

// unlimited airing
async function fetchAiringAnime() {
  airingContainer.innerHTML = '<p class="text-center text-slate-400">Loading airing anime...</p>';
  let page = 1, all = [], seen = new Set();
  try {
    while (true) {
      const res = await fetch(`${apiBase}/seasons/now?page=${page}`);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      const list = json.data;
      if (!list.length) break;
      list.forEach(a => {
        if (!seen.has(a.mal_id)) {
          seen.add(a.mal_id);
          all.push(a);
        }
      });
      if (!json.pagination.has_next_page) break;
      page++;
    }
    airingContainer.innerHTML = "";
    all.forEach(a => airingContainer.appendChild(createAnimeCard(a)));
  } catch {
    airingContainer.innerHTML = '<p class="text-red-500 text-center">Failed to load airing anime.</p>';
  }
}

// modal detail
async function openModal(id) {
  window.scrollTo({ top: 0, behavior: "smooth" });
  infoModal.showModal();
  modalContent.innerHTML = '<p class="text-center text-slate-400">Loading details...</p>';

  try {
    const [dRes, cRes] = await Promise.all([
      fetch(`${apiBase}/anime/${id}/full`),
      fetch(`${apiBase}/anime/${id}/characters`)
    ]);
    const { data } = await dRes.json();
    const { data: chars } = await cRes.json();

    // build UI
    const cover = data.images.jpg.image_url;
    const short = (data.synopsis || "").split(". ").slice(0,2).join(". ") + ".";
    const stats = [
      `${data.type} · ${data.year || "?"}`,
      data.status,
      `${data.episodes || "?"} ep`,
      `⭐ ${data.score || "N/A"}`
    ].map(s => `<li>${s}</li>`).join("");
    const genres = [...data.genres, ...data.themes].map(g=>`<span class="bg-slate-700 px-2 py-1 rounded text-xs">${g.name}</span>`).join("");
    const charsHTML = chars.slice(0,6).map(c=>`
      <div class="flex flex-col items-center">
        <img src="${c.character.images.jpg.image_url}" class="w-16 h-20 rounded border border-gray-600" />
        <span class="text-xs mt-1 text-center">${c.character.name}</span>
      </div>`).join("");

    modalContent.innerHTML = `
      <div class="flex flex-col sm:flex-row gap-4">
        <img src="${cover}" class="w-36 rounded border border-gray-600" />
        <div class="flex-1 space-y-2">
          <h2 class="text-2xl font-bold">${data.title}</h2>
          <ul class="flex gap-2 text-sm text-slate-400 flex-wrap">${stats}</ul>
          <div class="flex gap-2 flex-wrap mt-2">${genres}</div>
          <p class="mt-3 text-sm leading-relaxed">${short}</p>
          <h3 class="mt-4 font-bold">Karakter</h3>
          <div class="grid grid-cols-3 gap-2 mt-2">${charsHTML}</div>
        </div>
      </div>
    `;
  } catch {
    modalContent.innerHTML = '<p class="text-red-500 text-center">Error loading detail.</p>';
  }
}

// init
searchForm.addEventListener("submit", e => {
  e.preventDefault();
  fetchAnime(queryInput.value.trim());
});
window.onload = () => {
  queryInput.focus();
  fetchAiringAnime();
  document.getElementById("year").textContent = new Date().getFullYear();
};