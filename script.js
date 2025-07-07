const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const resultsContainer = document.getElementById('resultsContainer');
const airingContainer = document.getElementById('airingContainer');
const infoModal = document.getElementById('infoModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalInfoList = document.getElementById('modalInfoList');
const modalRating = document.getElementById('modalRating');
const closeModalBtn = document.getElementById('closeModalBtn');
const trailerContainer = document.getElementById('trailerContainer');
const trailerFrame = document.getElementById('trailerFrame');
const favButton = document.getElementById('favButton');

let currentAnime = null;

// Modal
closeModalBtn.addEventListener('click', closeModal);
window.addEventListener('keydown', e => e.key === 'Escape' && infoModal.close());

function closeModal() {
  trailerFrame.src = '';
  trailerContainer.classList.add("hidden");
  infoModal.close();
}

function createAnimeCard(anime) {
  const div = document.createElement('article');
  div.className = 'bg-slate-800 p-3 rounded-md shadow hover:bg-slate-700 cursor-pointer flex gap-4';
  div.innerHTML = `
    <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="w-20 h-28 object-cover rounded-md border border-gray-600" />
    <div class="flex flex-col justify-between">
      <h3 class="text-lg font-semibold">${anime.title}</h3>
      <p class="text-sm text-slate-300 line-clamp-3">${anime.synopsis || 'No synopsis'}</p>
      <p class="text-sm text-slate-400">Score: ${anime.score ?? 'N/A'}</p>
    </div>
  `;
  div.onclick = () => openModal(anime.mal_id);
  return div;
}

async function fetchAnime(query) {
  resultsContainer.innerHTML = `<p class="text-center text-slate-400">Loading...</p>`;
  try {
    const res = await fetch(`${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20`);
    const { data } = await res.json();
    resultsContainer.innerHTML = '';
    const seen = new Set();
    data.forEach(anime => {
      if (!seen.has(anime.mal_id)) {
        seen.add(anime.mal_id);
        resultsContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch {
    resultsContainer.innerHTML = `<p class="text-red-500 text-center">Failed to fetch.</p>`;
  }
}

async function fetchAiringAnime() {
  airingContainer.innerHTML = `<p class="text-center text-slate-400">Loading...</p>`;
  try {
    const res = await fetch(`${apiBase}/seasons/now`);
    const { data } = await res.json();
    airingContainer.innerHTML = '';
    data.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    const seen = new Set();
    data.forEach(anime => {
      if (!seen.has(anime.mal_id)) {
        seen.add(anime.mal_id);
        airingContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch {
    airingContainer.innerHTML = `<p class="text-red-500 text-center">Failed to load airing anime.</p>`;
  }
}

async function openModal(id) {
  modalTitle.textContent = "Loading...";
  modalDesc.textContent = "";
  modalInfoList.innerHTML = "";
  trailerFrame.src = '';
  trailerContainer.classList.add("hidden");
  infoModal.showModal();

  try {
    const res = await fetch(`${apiBase}/anime/${id}/full`);
    const { data } = await res.json();

    currentAnime = data;

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.synopsis || "No synopsis.";
    modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";

    const rows = [
      { label: 'Episodes', value: data.episodes ?? 'Unknown' },
      { label: 'Status', value: data.status ?? 'Unknown' },
      { label: 'Aired', value: data.aired.string ?? 'Unknown' },
      { label: 'Studios', value: data.studios.map(s => s.name).join(', ') || 'Unknown' },
      { label: 'Genres', value: data.genres.map(g => g.name).join(', ') || 'Unknown' },
    ];
    modalInfoList.innerHTML = rows.map(r => `<li><span class="font-semibold text-blue-400">${r.label}:</span> ${r.value}</li>`).join('');

    if (data.trailer?.embed_url) {
      trailerFrame.src = data.trailer.embed_url + "?autoplay=0";
      trailerContainer.classList.remove("hidden");
    }
  } catch {
    modalTitle.textContent = "Error";
    modalDesc.textContent = "Failed to load detail.";
  }
}

favButton.addEventListener('click', () => {
  if (!currentAnime) return;
  const favs = JSON.parse(localStorage.getItem("favorites") || "[]");
  if (!favs.some(a => a.mal_id === currentAnime.mal_id)) {
    favs.push({ mal_id: currentAnime.mal_id, title: currentAnime.title });
    localStorage.setItem("favorites", JSON.stringify(favs));
    alert("✅ Anime ditambahkan ke favorit!");
  } else {
    alert("❗ Anime sudah ada di favorit.");
  }
});

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  fetchAnime(queryInput.value.trim());
});

window.onload = () => {
  queryInput.focus();
  fetchAiringAnime();
  document.getElementById('year').textContent = new Date().getFullYear();
};