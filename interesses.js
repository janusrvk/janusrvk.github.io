// ---- Interesses: Last.fm, Letterboxd, Goodreads ----

// CORS proxy voor RSS feeds (niet nodig voor Last.fm want die API staat CORS toe)
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// ---- Last.fm integration ----
const LASTFM_USER = 'janusrvk';
const LASTFM_API_KEY = '74f09a6e65ddc20949e95f2a014cd3ee';

async function fetchLastFm() {
  const container = document.getElementById('strip-music');
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=2`
    );
    const data = await res.json();
    const tracks = data.recenttracks?.track?.slice(0, 1);

    if (!tracks || tracks.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen recente tracks gevonden.</p>';
      return;
    }

    const html = tracks.map((track) => {
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      const image = track.image?.find((img) => img.size === 'extralarge')?.['#text']
        || track.image?.find((img) => img.size === 'large')?.['#text']
        || track.image?.find((img) => img.size === 'medium')?.['#text'];
      const artist = track.artist?.['#text'] || track.artist;
      const name = track.name;
      const album = track.album?.['#text'];
      const url = track.url;

      return `
        <a href="${url}" target="_blank" rel="noopener" class="feed-item${isNowPlaying ? ' now-playing' : ''}">
          ${image ? `<img src="${image}" alt="${name}" class="feed-art feed-art-music" />` : '<div class="feed-art feed-art-music feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${name}</span>
            <span class="feed-meta">${artist}${album ? ` — ${album}` : ''}</span>
          </div>
          ${isNowPlaying ? '<span class="lastfm-live">Nu aan het luisteren</span>' : ''}
        </a>
      `;
    }).join('');

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="interest-placeholder">Kon Last.fm niet laden.</p>';
  }
}

fetchLastFm();
setInterval(fetchLastFm, 30000);

// ---- Letterboxd integration (RSS) ----
const LETTERBOXD_USER = 'janusrvk';
const TMDB_KEY = 'b1d6bd7b009c1dcc3e3561c6c0ef383a';

async function fetchDirector(tmdbId) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_KEY}`);
    const data = await res.json();
    const director = data.crew?.find((c) => c.job === 'Director');
    return director?.name || '';
  } catch {
    return '';
  }
}

async function fetchLetterboxd() {
  const container = document.getElementById('strip-film');
  try {
    const res = await fetch('https://goodreads-proxy.janusrvk.workers.dev/letterboxd');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 1);

    if (items.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen recente films gevonden.</p>';
      return;
    }

    const filmData = await Promise.all(items.map(async (item) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const description = item.querySelector('description')?.textContent || '';

      const descDoc = parser.parseFromString(description, 'text/html');
      const img = descDoc.querySelector('img');
      const posterSrc = img?.getAttribute('src') || '';

      const ratingMatch = title.match(/★+½?/);
      const rating = ratingMatch ? ratingMatch[0] : '';

      const cleanTitle = title.replace(/,\s*\d{4}\s*-\s*★+½?/, '').replace(/,\s*\d{4}/, '').trim();
      const yearMatch = title.match(/,\s*(\d{4})/);
      const year = yearMatch ? yearMatch[1] : '';

      const tmdbId = item.getElementsByTagName('tmdb:movieId')[0]?.textContent || '';
      const director = tmdbId ? await fetchDirector(tmdbId) : '';

      return { cleanTitle, year, link, posterSrc, rating, director };
    }));

    const html = filmData.map((f) => `
      <a href="${f.link}" target="_blank" rel="noopener" class="feed-item">
        ${f.posterSrc ? `<img src="${f.posterSrc}" alt="${f.cleanTitle}" class="feed-art" />` : '<div class="feed-art feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${f.cleanTitle}${f.year ? ` (${f.year})` : ''}</span>
          <span class="feed-meta">${f.director}${f.rating ? (f.director ? ' — ' : '') + f.rating : ''}</span>
        </div>
      </a>
    `).join('');

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="interest-placeholder">Kon Letterboxd niet laden.</p>';
  }
}

fetchLetterboxd();

// ---- Goodreads integration (statische JSON, dagelijks ververst door GitHub Action) ----
// Voorheen werden CORS-proxies gebruikt; die zijn te onbetrouwbaar gebleken
// (allorigins down, corsproxy + worker krijgen CloudFront 403). De JSON wordt
// nu gegenereerd door scripts/fetch-goodreads.py via .github/workflows/goodreads.yml.
let goodreadsDataPromise = null;
function loadGoodreads() {
  if (!goodreadsDataPromise) {
    goodreadsDataPromise = fetch('/goodreads.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .catch(() => ({ shelves: { 'currently-reading': [], read: [] } }));
  }
  return goodreadsDataPromise;
}

async function fetchGoodreads() {
  const container = document.getElementById('strip-book');
  try {
    const data = await loadGoodreads();
    const currentlyReading = data.shelves?.['currently-reading'] || [];
    const readShelf = data.shelves?.read || [];
    const book = currentlyReading[0] || readShelf[0];

    if (!book) {
      container.innerHTML = '<p class="interest-placeholder">Geen boeken gevonden.</p>';
      return;
    }

    renderBookCard(container, book);
  } catch (err) {
    container.innerHTML = '<p class="interest-placeholder"><a href="https://www.goodreads.com/user/show/161530834" target="_blank" rel="noopener">Bekijk op Goodreads →</a></p>';
  }
}

function renderBookCard(container, book) {
  const cover = book.image || '';
  container.innerHTML = `
    <a href="${book.link || '#'}" target="_blank" rel="noopener" class="feed-item">
      ${cover ? `<img src="${cover}" alt="${book.title}" class="feed-art feed-art-book" />` : '<div class="feed-art feed-art-empty"></div>'}
      <div class="feed-info">
        <span class="feed-title">${book.title || ''}</span>
        <span class="feed-meta">${book.author || ''}</span>
      </div>
    </a>
  `;
}

fetchGoodreads();


// ---- Statistieken Dashboard ----
function formatNumber(n) {
  return new Intl.NumberFormat('nl-NL').format(n);
}

async function fetchScrobbleCount() {
  // Spotify (jan 1 – feb 14 2026) + Last.fm (feb 14 2026 – nu)
  const lastfmCutoff = new Date(2026, 1, 14); // 14 feb 2026
  const fromTimestamp = Math.floor(lastfmCutoff.getTime() / 1000);

  const [statsRes, lastfmRes] = await Promise.all([
    fetch('/spotify-stats.json'),
    fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&from=${fromTimestamp}&limit=1`),
  ]);

  const stats = await statsRes.json();
  const spotifyCount = stats.spotify2026PreLastfm || 0;

  const lastfmData = await lastfmRes.json();
  const lastfmCount = parseInt(lastfmData.recenttracks?.['@attr']?.total || '0', 10);

  return spotifyCount + lastfmCount;
}


async function fetchFilmCount() {
  // Letterboxd RSS geeft maar ~50 items terug, dus gebruik de volledige diary-export
  // en vul aan met nieuwere RSS-items (sinds laatste handmatige update).
  const currentYear = new Date().getFullYear();
  const seen = new Set();
  let count = 0;

  const [diaryRes, rssRes] = await Promise.allSettled([
    fetch('/letterboxd-diary.json'),
    fetch('https://goodreads-proxy.janusrvk.workers.dev/letterboxd'),
  ]);

  const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const dayKey = (s) => {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  };

  if (diaryRes.status === 'fulfilled' && diaryRes.value.ok) {
    const diary = await diaryRes.value.json();
    for (const entry of diary) {
      const day = dayKey(entry.date);
      if (!day || new Date(day).getFullYear() !== currentYear) continue;
      const key = `${norm(entry.title)}|${day}`;
      if (seen.has(key)) continue;
      seen.add(key);
      count++;
    }
  }

  if (rssRes.status === 'fulfilled' && rssRes.value.ok) {
    const text = await rssRes.value.text();
    const doc = new DOMParser().parseFromString(text, 'text/xml');
    for (const item of doc.querySelectorAll('item')) {
      const watchedDate = item.getElementsByTagName('letterboxd:watchedDate')[0]?.textContent;
      const pubDate = item.querySelector('pubDate')?.textContent;
      const day = dayKey(watchedDate || pubDate);
      if (!day || new Date(day).getFullYear() !== currentYear) continue;
      const rawTitle = item.querySelector('title')?.textContent || '';
      const cleanTitle = rawTitle.replace(/,\s*\d{4}\s*-\s*★+½?/, '').replace(/,\s*\d{4}/, '').trim();
      const key = `${norm(cleanTitle)}|${day}`;
      if (seen.has(key)) continue;
      seen.add(key);
      count++;
    }
  }

  return count;
}

// Correctie: RSS telde 10 op 20 feb 2026, werkelijk aantal was 9
const BOOK_COUNT_OFFSET = -1;

async function fetchBookCount() {
  const data = await loadGoodreads();
  const currentYear = new Date().getFullYear();
  const read = data.shelves?.read || [];
  const items = read.filter((b) => {
    const date = b.dateRead || b.dateAdded || '';
    return date.startsWith(String(currentYear));
  });
  return Math.max(0, items.length + BOOK_COUNT_OFFSET);
}

async function fetchStats() {
  const [scrobbles, films, books] = await Promise.allSettled([
    fetchScrobbleCount(),
    fetchFilmCount(),
    fetchBookCount(),
  ]);

  const elScrobbles = document.getElementById('stat-scrobbles');
  const elFilms = document.getElementById('stat-films');
  const elBooks = document.getElementById('stat-books');

  elScrobbles.textContent = scrobbles.status === 'fulfilled' ? formatNumber(scrobbles.value) : '?';
  elFilms.textContent = films.status === 'fulfilled' ? formatNumber(films.value) : '?';
  elBooks.textContent = books.status === 'fulfilled' ? formatNumber(books.value) : '?';
}

if (document.getElementById('stat-scrobbles')) {
  fetchStats();
}
