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

closeModalBtn.addEventListener('click', () => {
  infoModal.close();
  searchForm.querySelector('button[type="submit"]').focus();
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && infoModal.open) {
    infoModal.close();
    searchForm.querySelector('button[type="submit"]').focus();
  }
});

function formatDate(dateStr) {
  if (!dateStr) return "Unknown";
  const d = new Date(dateStr);
  return isNaN(d) ? "Unknown" : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function createAnimeCard(anime) {
  const div = document.createElement('article');
  div.setAttribute('tabindex', '0');
  div.className = 'bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 cursor-pointer shadow';

  const img = document.createElement('img');
  img.src = anime.images.jpg.image_url;
  img.alt = `Cover image for ${anime.title}`;
  img.className = "w-20 h-28 rounded-md flex-shrink-0 object-cover border border-gray-600";
  img.onerror = function () {
    this.src = 'https://storage.googleapis.com/workspace-0f70711f-8b4e-4d94-86f1-2a93ccde5887/image/647f8a56-45bb-416e-9ddd-10d7c0000b19.png';
  };

  const info = document.createElement('div');
  info.className = 'flex flex-col justify-between';

  const title = document.createElement('h3');
  title.className = 'font-semibold text-lg leading-tight';
  title.textContent = anime.title;

  const synopsis = document.createElement('p');
  synopsis.className = 'line-clamp-4 mt-1 mb-2 text-slate-300 text-sm leading-snug';
  synopsis.textContent = anime.synopsis || "No synopsis available.";

  const score = document.createElement('p');
  score.className = 'text-slate-400 text-sm';
  score.textContent = `Score: ${anime.score ?? "N/A"}`;

  info.append(title, synopsis, score);
  div.append(img, info);

  div.addEventListener('click', () => openModal(anime.mal_id));
  div.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal(anime.mal_id);
    }
  });

  return div;
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

    const seenIds = new Set();
    resultsContainer.innerHTML = '';
    data.forEach(anime => {
      if (!seenIds.has(anime.mal_id)) {
        seenIds.add(anime.mal_id);
        resultsContainer.appendChild(createAnimeCard(anime));
      }
    });
  } catch (err) {
    resultsContainer.innerHTML = `<p class="text-center text-red-500 mt-10">Failed to fetch data. Please try again.</p>`;
    console.error('Error in fetchAnime:', err);
  }
}

async function openModal(id) {
  modalTitle.textContent = "Loading details...";
  modalDesc.textContent = "";
  modalInfoList.innerHTML = "";
  modalRating.textContent = "";
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

    infoRows.forEach(row => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="font-semibold text-blue-400">${row.label}:</span> ${row.value}`;
      modalInfoList.appendChild(li);
    });

    modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";
    infoModal.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    modalTitle.textContent = "Failed to load details";
    modalDesc.textContent = "Unable to retrieve info. Please try again.";
    console.error('Error in openModal:', err);
  }
}

// ✅ FIX: Load ALL airing anime with debug logs
async function fetchAllAiringAnime() {
  airingContainer.innerHTML = `<p class="text-slate-400 text-center">Loading...</p>`;
  let currentPage = 1;
  let hasNext = true;
  const seenIds = new Set();

  try {
    airingContainer.innerHTML = '';
    while (hasNext) {
      console.log(`Fetching airing page ${currentPage}...`);
      const res = await fetch(`${apiBase}/seasons/now?page=${currentPage}`);
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
      const json = await res.json();

      console.log(`Page ${currentPage}:`, json.pagination);
      hasNext = json.pagination?.has_next_page;

      for (const anime of json.data) {
        if (!seenIds.has(anime.mal_id)) {
          seenIds.add(anime.mal_id);
          airingContainer.appendChild(createAnimeCard(anime));
        }
      }

      currentPage++;
      await new Promise(r => setTimeout(r, 300)); // sedikit delay biar aman
    }

    console.log("✅ Done fetching all airing anime");
  } catch (err) {
    airingContainer.innerHTML = `<p class="text-red-500 text-center">Failed to load airing anime.</p>`;
    console.error('Error in fetchAllAiringAnime:', err);
  }
}

// 🔍 Search
searchForm.addEventListener('submit', e => {
  e.preventDefault();
  fetchAnime(queryInput.value.trim());
});

// 🏁 On Load
window.onload = () => {
  queryInput.focus();
  fetchAllAiringAnime();
};