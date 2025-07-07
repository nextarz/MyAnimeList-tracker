const apiBase = "https://api.jikan.moe/v4";

const searchForm = document.getElementById('searchForm'); const queryInput = document.getElementById('queryInput'); const resultsContainer = document.getElementById('resultsContainer'); const airingContainer = document.getElementById('airingContainer'); const infoModal = document.getElementById('infoModal'); const modalTitle = document.getElementById('modalTitle'); const modalDesc = document.getElementById('modalDesc'); const modalInfoList = document.getElementById('modalInfoList'); const modalRating = document.getElementById('modalRating'); const closeModalBtn = document.getElementById('closeModalBtn'); const trailerContainer = document.getElementById('trailerContainer'); const trailerFrame = document.getElementById('trailerFrame');

const characterSection = document.createElement('div'); const themeSection = document.createElement('div'); characterSection.className = 'mb-4'; themeSection.className = 'mb-4';

// Close modal closeModalBtn.addEventListener('click', closeModal); window.addEventListener('keydown', e => { if (e.key === 'Escape' && infoModal.open) closeModal(); });

function closeModal() { trailerFrame.src = ''; // stop video trailerContainer.classList.add('hidden'); infoModal.close(); searchForm.querySelector('button[type="submit"]').focus(); characterSection.innerHTML = ''; themeSection.innerHTML = ''; }

function createAnimeCard(anime) { const div = document.createElement('article'); div.setAttribute('tabindex', '0'); div.className = 'bg-slate-800 rounded-md flex gap-4 p-3 hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 cursor-pointer shadow';

const img = document.createElement('img'); img.src = anime.images.jpg.image_url; img.alt = Cover image for ${anime.title}; img.className = "w-20 h-28 rounded-md object-cover border border-gray-600"; img.onerror = () => { img.src = 'https://via.placeholder.com/150x200?text=No+Image'; };

const info = document.createElement('div'); info.className = 'flex flex-col justify-between';

const title = document.createElement('h3'); title.className = 'font-semibold text-lg leading-tight'; title.textContent = anime.title;

const synopsis = document.createElement('p'); synopsis.className = 'line-clamp-4 mt-1 mb-2 text-slate-300 text-sm'; synopsis.textContent = anime.synopsis || "No synopsis available.";

const score = document.createElement('p'); score.className = 'text-slate-400 text-sm'; score.textContent = Score: ${anime.score ?? "N/A"};

info.append(title, synopsis, score); div.append(img, info); div.addEventListener('click', () => openModal(anime.mal_id));

return div; }

async function fetchAnime(query) { resultsContainer.innerHTML = <p class="text-center text-slate-400 mt-10">Loading...</p>; try { const res = await fetch(${apiBase}/anime?q=${encodeURIComponent(query)}&limit=20); const { data } = await res.json(); const seen = new Set(); resultsContainer.innerHTML = ''; data.forEach(anime => { if (!seen.has(anime.mal_id)) { seen.add(anime.mal_id); resultsContainer.appendChild(createAnimeCard(anime)); } }); } catch (err) { resultsContainer.innerHTML = <p class="text-red-500 text-center">Failed to fetch anime.</p>; } }

async function fetchAiringAnime() { airingContainer.innerHTML = <p class="text-center text-slate-400">Loading airing anime...</p>; try { const res = await fetch(${apiBase}/seasons/now); const { data } = await res.json(); airingContainer.innerHTML = ''; const seen = new Set(); data.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)); data.forEach(anime => { if (!seen.has(anime.mal_id)) { seen.add(anime.mal_id); airingContainer.appendChild(createAnimeCard(anime)); } }); } catch (err) { airingContainer.innerHTML = <p class="text-red-500 text-center">Failed to load airing anime.</p>; } }

async function openModal(id) { modalTitle.textContent = "Loading..."; modalDesc.textContent = ""; modalInfoList.innerHTML = ""; modalRating.textContent = ""; trailerFrame.src = ''; trailerContainer.classList.add("hidden"); infoModal.showModal();

try { const res = await fetch(${apiBase}/anime/${id}/full); const { data } = await res.json();

modalTitle.textContent = data.title;
modalDesc.textContent = data.synopsis || "No synopsis.";
modalRating.textContent = data.score ? `⭐ Rating: ${data.score}` : "";

const info = [
  { label: 'Alternative Titles', value: `${data.title_english || '-'} / ${data.title_japanese || '-'}` },
  { label: 'Type', value: data.type ?? 'Unknown' },
  { label: 'Episodes', value: data.episodes ?? 'Unknown' },
  { label: 'Status', value: data.status ?? 'Unknown' },
  { label: 'Aired', value: data.aired.string ?? 'Unknown' },
  { label: 'Premiered', value: data.season ? `${data.season} ${data.year}` : 'Unknown' },
  { label: 'Broadcast', value: data.broadcast?.string ?? 'Unknown' },
  { label: 'Producers', value: data.producers.map(p => p.name).join(', ') || 'Unknown' },
  { label: 'Studios', value: data.studios.map(s => s.name).join(', ') || 'Unknown' },
  { label: 'Source', value: data.source ?? 'Unknown' },
  { label: 'Genres', value: data.genres.map(g => g.name).join(', ') || 'Unknown' },
  { label: 'Themes', value: data.themes.map(t => t.name).join(', ') || 'Unknown' },
  { label: 'Duration', value: data.duration ?? 'Unknown' },
  { label: 'Rating', value: data.rating ?? 'Unknown' },
];

modalInfoList.innerHTML = info.map(i => `
  <li><span class="font-semibold text-blue-400">${i.label}:</span> ${i.value}</li>
`).join('');

// Fetch characters
const charRes = await fetch(`${apiBase}/anime/${id}/characters`);
const charData = await charRes.json();
if (charData?.data?.length) {
  characterSection.innerHTML = '<h3 class="text-lg font-semibold mb-2">Karakter</h3><div class="flex overflow-x-auto gap-3">' +
    charData.data.slice(0, 10).map(c => `
      <div class="flex-shrink-0 w-24 text-center">
        <img src="${c.character.images.jpg.image_url}" class="rounded-md mb-1 w-full aspect-[3/4] object-cover border border-gray-600">
        <div class="text-xs text-white leading-tight">${c.character.name}</div>
        <div class="text-[10px] text-slate-400">${c.role}</div>
      </div>
    `).join('') + '</div>';
  infoModal.insertBefore(characterSection, trailerContainer);
}

// Fetch theme songs
const themeRes = await fetch(`${apiBase}/anime/${id}/themes`);
const themeData = await themeRes.json();
if (themeData?.data) {
  const { openings, endings } = themeData.data;
  themeSection.innerHTML = `
    <h3 class="text-lg font-semibold mt-4 mb-2">Lagu Opening</h3>
    ${openings.map(op => `<p class="text-sm text-slate-300">${op}</p>`).join('')}
    <h3 class="text-lg font-semibold mt-4 mb-2">Lagu Ending</h3>
    ${endings.map(ed => `<p class="text-sm text-slate-300">${ed}</p>`).join('')}
  `;
  infoModal.insertBefore(themeSection, trailerContainer);
}

// Trailer
if (data.trailer?.embed_url) {
  trailerFrame.src = `${data.trailer.embed_url}?autoplay=0&mute=0`;
  trailerContainer.classList.remove("hidden");
}

infoModal.scrollTo({ top: 0, behavior: 'smooth' });

} catch (err) { modalTitle.textContent = "Error"; modalDesc.textContent = "Failed to load anime detail."; } }

searchForm.addEventListener('submit', (e) => { e.preventDefault(); fetchAnime(queryInput.value.trim()); });

window.onload = () => { queryInput.focus(); fetchAiringAnime(); document.getElementById('year').textContent = new Date().getFullYear(); };

