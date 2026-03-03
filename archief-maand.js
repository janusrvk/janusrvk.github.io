// ---- Archief maanddetail: klikbaar paneel voor elke maand ----
// Albums: Spotify JSON export voor maanden vóór maart 2026, Last.fm vanaf maart 2026
// Films: Letterboxd RSS
// Boeken: Goodreads RSS

const CORS_PROXY = 'https://corsproxy.io/?url=';
const LASTFM_USER = 'janusrvk';
const LASTFM_API_KEY = '74f09a6e65ddc20949e95f2a014cd3ee';
const LETTERBOXD_USER = 'janusrvk';
const GOODREADS_USER_ID = '161530834';
const TMDB_KEY = 'b1d6bd7b009c1dcc3e3561c6c0ef383a';

// Grens: vanaf maart 2026 gebruiken we Last.fm, daarvoor Spotify export
const LASTFM_CUTOFF = new Date(2026, 2, 1); // 1 maart 2026

// ---- Maandnaam parsing ----
const MAANDEN = {
  'januari': 0, 'februari': 1, 'maart': 2, 'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'augustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'december': 11
};

function parseMonthTitle(text) {
  const clean = text.trim().toLowerCase();
  for (const [naam, idx] of Object.entries(MAANDEN)) {
    if (clean.startsWith(naam)) {
      const yearMatch = clean.match(/\d{4}/);
      if (yearMatch) {
        return { month: idx, year: parseInt(yearMatch[0], 10) };
      }
    }
  }
  return null;
}

// ---- Spotify history cache ----
let spotifyCache = null;

async function getSpotifyHistory() {
  if (spotifyCache !== null) return spotifyCache;
  try {
    const res = await fetch('/spotify-history.json');
    if (!res.ok) { spotifyCache = []; return []; }
    spotifyCache = await res.json();
    return spotifyCache;
  } catch {
    spotifyCache = [];
    return [];
  }
}

// ---- Album art via Last.fm ----
const albumArtCache = new Map();

async function fetchAlbumArt(artist, album) {
  const key = `${artist}|||${album}`;
  if (albumArtCache.has(key)) return albumArtCache.get(key);
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${LASTFM_API_KEY}&format=json`
    );
    const data = await res.json();
    const image = data.album?.image?.find((img) => img.size === 'extralarge')?.['#text']
      || data.album?.image?.find((img) => img.size === 'large')?.['#text'] || '';
    albumArtCache.set(key, image);
    return image;
  } catch {
    albumArtCache.set(key, '');
    return '';
  }
}

// ---- Album detectie uit Spotify history ----
// Spotify extended history formaat:
// { ts, master_metadata_track_name, master_metadata_album_artist_name, master_metadata_album_album_name, ms_played, ... }
function detectAlbumsFromSpotify(history, monthStart, monthEnd) {
  const albumMap = new Map();

  for (const entry of history) {
    const ts = new Date(entry.ts);
    if (ts < monthStart || ts >= monthEnd) continue;
    // Filter: minstens 30 seconden geluisterd
    if ((entry.ms_played || 0) < 30000) continue;

    const album = entry.master_metadata_album_album_name;
    const artist = entry.master_metadata_album_artist_name;
    const track = entry.master_metadata_track_name;
    if (!album || !artist || !track) continue;

    const key = `${artist}|||${album}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, { album, artist, trackNames: new Set(), msPlayed: 0 });
    }
    const e = albumMap.get(key);
    e.trackNames.add(track);
    e.msPlayed += entry.ms_played || 0;
  }

  const MIN_UNIQUE_TRACKS = 5;
  const MIN_MINUTES = 15;
  const albums = [];
  for (const e of albumMap.values()) {
    if (e.trackNames.size >= MIN_UNIQUE_TRACKS && e.msPlayed >= MIN_MINUTES * 60 * 1000) {
      albums.push({ album: e.album, artist: e.artist, image: '', msPlayed: e.msPlayed });
    }
  }
  albums.sort((a, b) => b.msPlayed - a.msPlayed);
  return albums.slice(0, 10);
}

// ---- Album detectie uit Last.fm ----
async function fetchLastfmScrobbles(fromTs, toTs) {
  const tracks = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&from=${fromTs}&to=${toTs}&limit=200&page=${page}`
    );
    const data = await res.json();
    totalPages = parseInt(data.recenttracks?.['@attr']?.totalPages || '1', 10);

    for (const t of (data.recenttracks?.track || [])) {
      if (t['@attr']?.nowplaying === 'true') continue;
      tracks.push({
        name: t.name,
        artist: t.artist?.['#text'] || t.artist,
        album: t.album?.['#text'] || '',
        image: t.image?.find((img) => img.size === 'extralarge')?.['#text']
          || t.image?.find((img) => img.size === 'large')?.['#text'] || '',
      });
    }
    page++;
  }
  return tracks;
}

function detectAlbumsFromLastfm(tracks) {
  const albumMap = new Map();
  for (const t of tracks) {
    if (!t.album) continue;
    const key = `${t.artist}|||${t.album}`;
    if (!albumMap.has(key)) {
      albumMap.set(key, { album: t.album, artist: t.artist, image: t.image, trackNames: new Set(), playCount: 0 });
    }
    const e = albumMap.get(key);
    e.trackNames.add(t.name);
    e.playCount++;
    if (!e.image && t.image) e.image = t.image;
  }

  const albums = [];
  for (const e of albumMap.values()) {
    if (e.trackNames.size >= 4) {
      albums.push({ album: e.album, artist: e.artist, image: e.image, playCount: e.playCount });
    }
  }
  albums.sort((a, b) => b.playCount - a.playCount);
  return albums;
}

// ---- Render albums ----
async function renderAlbums(container, monthStart, monthEnd) {
  try {
    let albums;
    if (monthStart >= LASTFM_CUTOFF) {
      // Last.fm
      const fromTs = Math.floor(monthStart.getTime() / 1000);
      const toTs = Math.floor(monthEnd.getTime() / 1000);
      const tracks = await fetchLastfmScrobbles(fromTs, toTs);
      albums = detectAlbumsFromLastfm(tracks);
    } else {
      // Spotify export
      const history = await getSpotifyHistory();
      if (history.length === 0) {
        container.innerHTML = '<p class="interest-placeholder">Spotify-export nog niet beschikbaar. Plaats je <code>spotify-history.json</code> in de <code>public/</code> map.</p>';
        return;
      }
      albums = detectAlbumsFromSpotify(history, monthStart, monthEnd);
      // Album art ophalen via Last.fm
      albums = await Promise.all(albums.map(async (a) => ({
        ...a,
        image: await fetchAlbumArt(a.artist, a.album),
      })));
    }

    if (albums.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen albums gevonden.</p>';
      return;
    }
    container.innerHTML = albums.map((a) => `
      <div class="feed-item" style="cursor: default;">
        ${a.image ? `<img src="${a.image}" alt="${a.album}" class="feed-art feed-art-music" />` : '<div class="feed-art feed-art-music feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${a.album}</span>
          <span class="feed-meta">${a.artist}</span>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<p class="interest-placeholder">Kon albums niet laden.</p>';
  }
}

// ---- Films via lokale Letterboxd diary ----
let letterboxdCache = null;

async function getLetterboxdDiary() {
  if (letterboxdCache !== null) return letterboxdCache;
  try {
    const res = await fetch('/letterboxd-diary.json');
    if (!res.ok) { letterboxdCache = []; return []; }
    letterboxdCache = await res.json();
    return letterboxdCache;
  } catch {
    letterboxdCache = [];
    return [];
  }
}

function toStars(rating) {
  if (!rating) return '';
  const n = parseFloat(rating);
  if (isNaN(n)) return '';
  return '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '');
}

async function fetchTmdbByTitle(title, year) {
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`
    );
    const data = await res.json();
    const movie = data.results?.[0];
    if (!movie) return { poster: '', director: '' };
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '';
    const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_KEY}`);
    const credits = await creditsRes.json();
    const director = credits.crew?.find((c) => c.job === 'Director')?.name || '';
    return { poster, director };
  } catch {
    return { poster: '', director: '' };
  }
}

async function renderFilms(container, monthStart, monthEnd) {
  try {
    const diary = await getLetterboxdDiary();
    const items = diary.filter((entry) => {
      const d = new Date(entry.date);
      return d >= monthStart && d < monthEnd;
    });

    if (items.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen films gevonden.</p>';
      return;
    }

    const filmData = await Promise.all(items.map(async (entry) => {
      const { poster, director } = await fetchTmdbByTitle(entry.title, entry.year);
      return { title: entry.title, year: entry.year, link: entry.uri, poster, director, rating: toStars(entry.rating) };
    }));

    container.innerHTML = filmData.map((f) => `
      <a href="${f.link}" target="_blank" rel="noopener" class="feed-item">
        ${f.poster ? `<img src="${f.poster}" alt="${f.title}" class="feed-art" />` : '<div class="feed-art feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${f.title}${f.year ? ` (${f.year})` : ''}</span>
          <span class="feed-meta">${f.director}${f.rating ? (f.director ? ' — ' : '') + f.rating : ''}</span>
        </div>
      </a>
    `).join('');
  } catch {
    container.innerHTML = '<p class="interest-placeholder">Kon films niet laden.</p>';
  }
}

// ---- Boeken via Goodreads ----
async function renderBooks(container, monthStart, monthEnd) {
  try {
    const res = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=read`)}`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const items = Array.from(xml.querySelectorAll('item')).filter((item) => {
      const readAt = item.querySelector('user_read_at')?.textContent;
      const pubDate = item.querySelector('pubDate')?.textContent;
      const dateStr = readAt || pubDate || '';
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= monthStart && d < monthEnd;
    });

    if (items.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen boeken gevonden.</p>';
      return;
    }

    container.innerHTML = items.map((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '#';
      const author = item.querySelector('author_name')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const descDoc = parser.parseFromString(description, 'text/html');
      const coverSrc = descDoc.querySelector('img')?.getAttribute('src') || '';
      const hiResCover = coverSrc.replace(/\._\w+\d+_/, '._SX100_');

      return `
        <a href="${link}" target="_blank" rel="noopener" class="feed-item">
          ${hiResCover ? `<img src="${hiResCover}" alt="${title}" class="feed-art feed-art-book" />` : '<div class="feed-art feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${title}</span>
            <span class="feed-meta">${author}</span>
          </div>
        </a>
      `;
    }).join('');
  } catch {
    container.innerHTML = '<p class="interest-placeholder">Kon boeken niet laden.</p>';
  }
}

// ---- UI: inline uitklap-rij (desktop) ----
let activeRow = null;

function closeDetail() {
  if (activeRow) {
    const detailRow = activeRow.nextElementSibling;
    if (detailRow?.classList.contains('archief-detail-row')) {
      const inner = detailRow.querySelector('.archief-detail-inner');
      if (inner) inner.style.maxHeight = '0';
      detailRow.classList.remove('open');
    }
    activeRow.classList.remove('active');
    activeRow = null;
  }
}

// ---- UI: bottom sheet modal (mobiel) ----
let activeModal = null;

function closeMobileModal() {
  if (!activeModal) return;
  const overlay = activeModal;
  overlay.classList.remove('open');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
  activeModal = null;
}

function openMobileModal(monthLabel, parsed) {
  closeMobileModal();

  const monthStart = new Date(parsed.year, parsed.month, 1);
  const monthEnd = new Date(parsed.year, parsed.month + 1, 1);

  const overlay = document.createElement('div');
  overlay.className = 'archief-modal-overlay';
  overlay.innerHTML = `
    <div class="archief-modal">
      <div class="archief-modal-handle"></div>
      <div class="archief-modal-header">
        <span class="archief-modal-title">${monthLabel}</span>
        <button class="archief-modal-close" aria-label="Sluiten">&#x2715;</button>
      </div>
      <div class="archief-modal-content">
        <div class="archief-detail-section">
          <h4>Meest geluisterde albums</h4>
          <div class="detail-albums"><p class="interest-placeholder">Laden&hellip;</p></div>
        </div>
        <div class="archief-detail-section">
          <h4>Films gekeken</h4>
          <div class="detail-films"><p class="interest-placeholder">Laden&hellip;</p></div>
        </div>
        <div class="archief-detail-section">
          <h4>Boeken gelezen</h4>
          <div class="detail-books"><p class="interest-placeholder">Laden&hellip;</p></div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModal = overlay;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeMobileModal(); });
  overlay.querySelector('.archief-modal-close').addEventListener('click', closeMobileModal);

  Promise.all([
    renderAlbums(overlay.querySelector('.detail-albums'), monthStart, monthEnd),
    renderFilms(overlay.querySelector('.detail-films'), monthStart, monthEnd),
    renderBooks(overlay.querySelector('.detail-books'), monthStart, monthEnd),
  ]);

  requestAnimationFrame(() => overlay.classList.add('open'));
}

function initArchiefCards() {
  const rows = document.querySelectorAll('.archief-row');

  rows.forEach((row) => {
    const monthEl = row.querySelector('.archief-row-month');
    if (!monthEl) return;

    const parsed = parseMonthTitle(monthEl.textContent);
    if (!parsed) return;

    row.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        openMobileModal(monthEl.textContent.trim(), parsed);
        return;
      }

      const isOpen = activeRow === row;
      closeDetail();
      if (isOpen) return;

      const monthStart = new Date(parsed.year, parsed.month, 1);
      const monthEnd = new Date(parsed.year, parsed.month + 1, 1);

      let detailRow = row.nextElementSibling;
      if (!detailRow?.classList.contains('archief-detail-row')) {
        detailRow = document.createElement('tr');
        detailRow.className = 'archief-detail-row';
        detailRow.innerHTML = `
          <td colspan="5">
            <div class="archief-detail-inner">
              <div class="archief-detail-content">
                <div class="archief-detail-section">
                  <h4>Meest geluisterde albums</h4>
                  <div class="detail-albums"><p class="interest-placeholder">Laden...</p></div>
                </div>
                <div class="archief-detail-section">
                  <h4>Films gekeken</h4>
                  <div class="detail-films"><p class="interest-placeholder">Laden...</p></div>
                </div>
                <div class="archief-detail-section">
                  <h4>Boeken gelezen</h4>
                  <div class="detail-books"><p class="interest-placeholder">Laden...</p></div>
                </div>
              </div>
            </div>
          </td>
        `;
        row.after(detailRow);
        const inner = detailRow.querySelector('.archief-detail-inner');
        Promise.all([
          renderAlbums(detailRow.querySelector('.detail-albums'), monthStart, monthEnd),
          renderFilms(detailRow.querySelector('.detail-films'), monthStart, monthEnd),
          renderBooks(detailRow.querySelector('.detail-books'), monthStart, monthEnd),
        ]).then(() => {
          if (inner) inner.style.maxHeight = inner.scrollHeight + 'px';
        });
      }

      const inner = detailRow.querySelector('.archief-detail-inner');
      if (inner) inner.style.maxHeight = '';
      requestAnimationFrame(() => detailRow.classList.add('open'));
      row.classList.add('active');
      activeRow = row;
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeDetail(); closeMobileModal(); }
  });
}

// Init wanneer DOM klaar is
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArchiefCards);
} else {
  initArchiefCards();
}
