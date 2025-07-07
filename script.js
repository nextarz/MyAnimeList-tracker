const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById('searchForm');
const queryInput = document.getElementById('queryInput');
const resultsContainer = document.getElementById('resultsContainer');
const airingContainer = document.getElementById('airingContainer');
const airingSort = document.getElementById('airingSort');

const infoModal = document.getElementById('infoModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalInfoList = document.getElementById('modalInfoList');
const modalRating = document.getElementById('modalRating');
const trailerContainer = document.getElementById('modalTrailer');
const trailerFrame = document.getElementById('trailerFrame');
const closeModalBtn = document.getElementById('closeModalBtn');

document.getElementById('year').textContent = new Date().getFullYear();

async function fetchAiringAnime(sortBy = "popularity") {
  try {
    const res = await fetch(`${apiBase}/top/anime?filter=airing&limit=25`);
    const { data } = await res.json();
    airingContainer.innerHTML = "";

    let airingOnly = data.filter(anime => anime.status === "Currently Airing");

    // Sorting logic
    if (sortBy === "score") {
      airingOnly.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    } else if (sortBy === "date") {
      airingOnly.sort((a, b) => new Date(b.aired.from) - new Date(a.aired.from));
    }

    const unique = new Set();
    airingOnly.forEach(anime => {
      if (!unique.has(anime.mal_id)) {
        unique.add(anime.mal_id);
        airingContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    airingContainer.innerHTML = `<p class="text-red-500 text-sm text-center">Failed to load airing anime.</p>`;
  }
}

async function fetchAnime(query) {
  if (!query.trim()) {
    resultsContainer.innerHTML = `<p class="text-center text-slate-400 mt-10">Please enter an anime name to search.</p>`;
    return;
  }
  resultsContainer.innerHTML = `<p class="text-center text-slate-400 mt-10">Loading...</p>`;
  try {
    const res = await fetch(`${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20`);
    const { data } = await res.json();
    if (!data.length) {
      resultsContainer.innerHTML = `<p class="text-center text-slate-400 mt-10">No results found for "<strong>${query}</strong>".</p>`;
      return;
    }
    resultsContainer.innerHTML = "";
    const unique = new Set();
    data.forEach(anime => {
      if (!unique.has(anime.mal_id)) {
        unique.add(anime.mal_id);
        resultsContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    resultsContainer.innerHTML = `<p class="text-center text-red-500 mt-10">Failed to fetch data. Please try again.</p>`;
  }
}

function createAnimeCard(anime) {
  const card = document.createElement('article');
  card.className = 'bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 cursor-pointer shadow';
  card.tabIndex = 0;

  const img = document.createElement('img');
  img.src = anime.images.jpg.image_url;
  img.alt = `Cover image for ${anime.title}`;
  img.className = "w-20 h-28 rounded-md object-cover border border-gray-600";
  img.onerror = () => {
    img.src = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/647f8a56-45bb-416e-9ddd-10d7c0000b19.png';
  };

  const info = document.createElement('div');
  info.className = 'flex flex-col justify-between';

  const title = document.createElement('h3');
  title.className = 'font-semibold text-lg leading-tight text-white';
  title.textContent = anime.title;

  const synopsis = document.createElement('p');
  synopsis.className = 'line-clamp-4 mt-1 mb-2 text-slate-300 text-sm leading-snug';
  synopsis.textContent = anime.synopsis || "No synopsis available.";

  const score = document.createElement('p');
  score.className = 'text-slate-400 text-sm';
  score.textContent = `Score: ${anime.score ?? "N/A"}`;

  info.append(title, synopsis, score);
  card.append(img, info);

  card.addEventListener('click', () => openModal(anime.mal_id));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(anime.mal_id);
    }
  });

  return card;
}

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  if (isNaN(d)) return "Unknown";
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

async function openModal(id) {
  modalTitle.textContent = "Loading details...";
  modalDesc.textContent = "";
  modalInfoList.innerHTML = "";
  modalRating.textContent = "";
  trailerContainer.classList.add("hidden");
  trailerFrame.src = "";

  infoModal.showModal();

  try {
    const res = await fetch(`${apiBase}/anime/${id}/full`);
    const { data } = await res.json();

    modalTitle.textContent = data.title;
    modalDesc.textContent = data.synopsis || "No synopsis available.";

    const infoRows = [
      { label: 'Episodes', value: data.episodes ?? "Unknown" },
      { label: 'Studio', value: data.studios.map(s => s.name).join(', ') || "Unknown" },
      { label: 'Producers', value: data.producers.map(p => p.name).join(', ') || "Unknown" },
      { label: 'Release Date', value: formatDate(data.aired.from) },
      { label: 'Status', value: data.status ?? "Unknown" },
      { label: 'Genres', value: data.genres.map(g => g.name).join(', ') || "Unknown" }
    ];

    modalInfoList.innerHTML = "";
    infoRows.forEach(row => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="font-semibold text-blue-400">${row.label}:</span> ${row.value}`;
      modalInfoList.appendChild(li);
    });

    modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";

    if (data.trailer?.embed_url) {
      trailerContainer.classList.remove("hidden");
      trailerFrame.src = data.trailer.embed_url;
    }
  } catch (err) {
    modalTitle.textContent = "Failed to load details";
    modalDesc.textContent = "Unable to retrieve info. Please try again.";
  }
}

closeModalBtn.addEventListener('click', () => {
  trailerFrame.src = "";
  infoModal.close();
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && infoModal.open) {
    trailerFrame.src = "";
    infoModal.close();
  }
});

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetchAnime(queryInput.value);
});

// 🔄 Ganti sorting
airingSort.addEventListener('change', (e) => {
  fetchAiringAnime(e.target.value);
});

// 🔃 Load awal
window.onload = () => {
  queryInput.focus();
  fetchAiringAnime();
};