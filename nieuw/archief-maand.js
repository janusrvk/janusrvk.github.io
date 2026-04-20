// ---- Archief maanddetail: klikbaar paneel onder elke maandkaart ----
// Albums: Spotify JSON export voor maanden vóór maart 2026, Last.fm vanaf maart 2026
// Films: Letterboxd diary
// Boeken: Goodreads RSS via Cloudflare worker

const LASTFM_USER = 'janusrvk';
const LASTFM_API_KEY = '74f09a6e65ddc20949e95f2a014cd3ee';
const TMDB_KEY = 'b1d6bd7b009c1dcc3e3561c6c0ef383a';
const GOODREADS_PROXY = 'https://goodreads-proxy.janusrvk.workers.dev';

// Grens: vanaf maart 2026 Last.fm, daarvoor Spotify export
const LASTFM_CUTOFF = new Date(2026, 2, 1);

const MAANDEN = {
  'januari': 0, 'februari': 1, 'maart': 2, 'april': 3, 'mei': 4, 'juni': 5,
  'juli': 6, 'augustus': 7, 'september': 8, 'oktober': 9, 'november': 10, 'december': 11,
};

function parseMonthLabel(monthEl) {
  const monthName = monthEl.firstChild?.textContent?.trim().toLowerCase() || '';
  const year = monthEl.querySelector('.archief-year')?.textContent?.trim();
  const idx = MAANDEN[monthName];
  if (idx === undefined || !year) return null;
  return { month: idx, year: parseInt(year, 10), label: `${monthName} ${year}` };
}

// ---- Caches ----
let spotifyAlbumsCache = null;
let spotifyTracksCache = null;
let letterboxdCache = null;
const albumArtCache = new Map();
const instrumentalTagCache = new Map();
const artistTagCache = new Map();

async function getJson(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    return await res.json();
  } catch { return fallback; }
}
async function getSpotifyAlbums() {
  if (spotifyAlbumsCache !== null) return spotifyAlbumsCache;
  spotifyAlbumsCache = await getJson('/spotify-albums.json', {});
  return spotifyAlbumsCache;
}
async function getSpotifyTracks() {
  if (spotifyTracksCache !== null) return spotifyTracksCache;
  spotifyTracksCache = await getJson('/spotify-tracks.json', {});
  return spotifyTracksCache;
}
async function getLetterboxdDiary() {
  if (letterboxdCache !== null) return letterboxdCache;
  letterboxdCache = await getJson('/letterboxd-diary.json', []);
  return letterboxdCache;
}

function monthKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

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
  } catch { albumArtCache.set(key, ''); return ''; }
}

// ---- Instrumental filter ----
const TRACK_INSTRUMENTAL_TAGS = ['instrumental', 'ambient', 'classical', 'new age', 'new-age', 'nature sounds', 'no vocals', 'wordless', 'background music', 'lo-fi', 'lofi', 'lo fi', 'drone', 'post-classical', 'white noise', 'binaural', 'meditation', 'sleep music'];
const ARTIST_INSTRUMENTAL_TAGS = ['instrumental', 'ambient', 'classical', 'new age', 'new-age', 'nature sounds', 'drone', 'post-classical', 'white noise'];

async function getArtistTags(artist) {
  if (artistTagCache.has(artist)) return artistTagCache.get(artist);
  try {
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=artist.getTopTags&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`);
    const data = await res.json();
    const tags = (data.toptags?.tag || []).slice(0, 5).map((t) => t.name.toLowerCase());
    artistTagCache.set(artist, tags);
    return tags;
  } catch { artistTagCache.set(artist, []); return []; }
}

async function isInstrumental(artist, track) {
  const key = `${artist}|||${track}`;
  if (instrumentalTagCache.has(key)) return instrumentalTagCache.get(key);
  try {
    const [trackRes, artistTags] = await Promise.all([
      fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${LASTFM_API_KEY}&format=json`),
      getArtistTags(artist),
    ]);
    const trackData = await trackRes.json();
    const trackTags = (trackData.toptags?.tag || []).map((t) => t.name.toLowerCase());
    const trackMatch = trackTags.some((tag) => TRACK_INSTRUMENTAL_TAGS.some((it) => tag.includes(it)));
    const artistMatch = artistTags.some((tag) => ARTIST_INSTRUMENTAL_TAGS.some((it) => tag.includes(it)));
    const result = trackMatch || artistMatch;
    instrumentalTagCache.set(key, result);
    return result;
  } catch { instrumentalTagCache.set(key, false); return false; }
}

// ---- Last.fm scrobbles ----
async function fetchLastfmScrobbles(fromTs, toTs) {
  const tracks = [];
  let page = 1, totalPages = 1;
  while (page <= totalPages) {
    const res = await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&from=${fromTs}&to=${toTs}&limit=200&page=${page}`);
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
    if (!albumMap.has(key)) albumMap.set(key, { album: t.album, artist: t.artist, image: t.image, trackNames: new Set(), playCount: 0 });
    const e = albumMap.get(key);
    e.trackNames.add(t.name);
    e.playCount++;
    if (!e.image && t.image) e.image = t.image;
  }
  const albums = [];
  for (const e of albumMap.values()) {
    if (e.trackNames.size >= 4) albums.push({ album: e.album, artist: e.artist, image: e.image, playCount: e.playCount });
  }
  albums.sort((a, b) => b.playCount - a.playCount);
  return albums.slice(0, 10);
}

// ---- Renderers ----
function placeholder(text) { return `<p class="feed-placeholder">${text}</p>`; }
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function escapeAttr(s) { return escapeHtml(s); }

async function renderAlbums(container, monthStart, monthEnd) {
  try {
    let albums;
    if (monthStart >= LASTFM_CUTOFF) {
      const fromTs = Math.floor(monthStart.getTime() / 1000);
      const toTs = Math.floor(monthEnd.getTime() / 1000);
      const tracks = await fetchLastfmScrobbles(fromTs, toTs);
      albums = detectAlbumsFromLastfm(tracks);
    } else {
      const all = await getSpotifyAlbums();
      const raw = all[monthKey(monthStart)] || [];
      if (!raw.length) { container.innerHTML = placeholder('Geen albums gevonden.'); return; }
      albums = await Promise.all(raw.map(async (a) => ({ album: a.album, artist: a.artist, image: await fetchAlbumArt(a.artist, a.album) })));
    }
    if (!albums.length) { container.innerHTML = placeholder('Geen albums gevonden.'); return; }
    container.innerHTML = albums.map((a) => `
      <div class="feed-item">
        ${a.image ? `<img src="${a.image}" alt="${escapeAttr(a.album)}" class="feed-art" loading="lazy" />` : '<div class="feed-art feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${escapeHtml(a.album)}</span>
          <span class="feed-meta">${escapeHtml(a.artist)}</span>
        </div>
      </div>`).join('');
  } catch { container.innerHTML = placeholder('Kon albums niet laden.'); }
}

async function renderTracks(container, monthStart, monthEnd) {
  try {
    let tracks;
    if (monthStart >= LASTFM_CUTOFF) {
      const fromTs = Math.floor(monthStart.getTime() / 1000);
      const toTs = Math.floor(monthEnd.getTime() / 1000);
      const scrobbles = await fetchLastfmScrobbles(fromTs, toTs);
      const trackMap = new Map();
      for (const t of scrobbles) {
        const key = (t.artist || '') + '|||' + (t.name || '');
        if (!trackMap.has(key)) trackMap.set(key, { track: t.name, artist: t.artist, album: t.album, count: 0 });
        trackMap.get(key).count++;
      }
      const sorted = [...trackMap.values()].sort((a, b) => b.count - a.count);
      const seen = new Set();
      tracks = [];
      for (const t of sorted) {
        const albumKey = t.artist + '|||' + (t.album || t.track);
        if (seen.has(albumKey)) continue;
        seen.add(albumKey);
        tracks.push(t);
        if (tracks.length === 100) break;
      }
    } else {
      const all = await getSpotifyTracks();
      tracks = all[monthKey(monthStart)] || [];
    }
    if (!tracks.length) { container.innerHTML = placeholder('Geen nummers gevonden.'); return; }

    const instrumentalFlags = await Promise.all(tracks.map((t) => isInstrumental(t.artist, t.track || t.name)));
    tracks = tracks.filter((_, i) => !instrumentalFlags[i]).slice(0, 10);
    if (!tracks.length) { container.innerHTML = placeholder('Geen nummers gevonden.'); return; }

    const tracksWithArt = await Promise.all(tracks.map(async (t) => ({ ...t, image: t.album ? await fetchAlbumArt(t.artist, t.album) : '' })));

    container.innerHTML = tracksWithArt.map((t) => `
      <div class="feed-item">
        ${t.image ? `<img src="${t.image}" alt="${escapeAttr(t.track)}" class="feed-art" loading="lazy" />` : '<div class="feed-art feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${escapeHtml(t.track)}</span>
          <span class="feed-meta">${escapeHtml(t.artist)}${t.album ? ` — ${escapeHtml(t.album)}` : ''}</span>
        </div>
      </div>`).join('');
  } catch { container.innerHTML = placeholder('Kon nummers niet laden.'); }
}

function toStars(rating) {
  if (!rating) return '';
  const n = parseFloat(rating);
  if (isNaN(n)) return '';
  return '★'.repeat(Math.floor(n)) + (n % 1 >= 0.5 ? '½' : '');
}

async function fetchTmdbByTitle(title, year) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(title)}&year=${year}&language=en-US`);
    const data = await res.json();
    const movie = data.results?.[0];
    if (!movie) return { poster: '', director: '' };
    const poster = movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : '';
    const credRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${TMDB_KEY}`);
    const cred = await credRes.json();
    const director = cred.crew?.find((c) => c.job === 'Director')?.name || '';
    return { poster, director };
  } catch { return { poster: '', director: '' }; }
}

async function renderFilms(container, monthStart, monthEnd) {
  try {
    const diary = await getLetterboxdDiary();
    const items = diary.filter((entry) => {
      const d = new Date(entry.date);
      return d >= monthStart && d < monthEnd;
    });
    if (!items.length) { container.innerHTML = placeholder('Geen films gevonden.'); return; }
    const data = await Promise.all(items.map(async (e) => {
      const { poster, director } = await fetchTmdbByTitle(e.title, e.year);
      return { title: e.title, year: e.year, poster, director, rating: toStars(e.rating) };
    }));
    container.innerHTML = data.map((f) => `
      <div class="feed-item">
        ${f.poster ? `<img src="${f.poster}" alt="${escapeAttr(f.title)}" class="feed-art feed-art-film" loading="lazy" />` : '<div class="feed-art feed-art-film feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${escapeHtml(f.title)}${f.year ? ` <span class="feed-year">(${f.year})</span>` : ''}</span>
          <span class="feed-meta">${escapeHtml(f.director)}${f.rating ? (f.director ? ' — ' : '') + f.rating : ''}</span>
        </div>
      </div>`).join('');
  } catch { container.innerHTML = placeholder('Kon films niet laden.'); }
}

async function renderBooks(container, monthStart, monthEnd) {
  try {
    const res = await fetch(`${GOODREADS_PROXY}?shelf=read`);
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
    if (!items.length) { container.innerHTML = placeholder('Geen boeken gevonden.'); return; }
    container.innerHTML = items.map((item) => {
      const title = item.querySelector('title')?.textContent || '';
      const author = item.querySelector('author_name')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const descDoc = parser.parseFromString(description, 'text/html');
      const cover = descDoc.querySelector('img')?.getAttribute('src') || '';
      const hi = cover.replace(/\._\w+\d+_/, '._SX100_');
      return `
        <div class="feed-item">
          ${hi ? `<img src="${hi}" alt="${escapeAttr(title)}" class="feed-art feed-art-book" loading="lazy" />` : '<div class="feed-art feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${escapeHtml(title)}</span>
            <span class="feed-meta">${escapeHtml(author)}</span>
          </div>
        </div>`;
    }).join('');
  } catch { container.innerHTML = placeholder('Kon boeken niet laden.'); }
}

// ---- UI: inline panel onder elke kaart ----
let activeCard = null;

function closeActive() {
  if (!activeCard) return;
  const detail = activeCard.querySelector('.archief-detail');
  if (detail) detail.classList.remove('is-open');
  activeCard.classList.remove('is-active');
  const eyeBtn = activeCard.querySelector('.archief-month-eye');
  eyeBtn?.setAttribute('aria-expanded', 'false');
  activeCard = null;
}

function buildDetailPanel() {
  const div = document.createElement('div');
  div.className = 'archief-detail';
  div.innerHTML = `
    <div class="archief-detail-grid">
      <div class="archief-detail-section">
        <h5 class="archief-detail-title">Meest geluisterd — nummers</h5>
        <div class="feed-list detail-tracks">${placeholder('Laden…')}</div>
      </div>
      <div class="archief-detail-section">
        <h5 class="archief-detail-title">Meest geluisterd — albums</h5>
        <div class="feed-list detail-albums">${placeholder('Laden…')}</div>
      </div>
      <div class="archief-detail-section">
        <h5 class="archief-detail-title">Films gekeken</h5>
        <div class="feed-list detail-films">${placeholder('Laden…')}</div>
      </div>
      <div class="archief-detail-section">
        <h5 class="archief-detail-title">Boeken gelezen</h5>
        <div class="feed-list detail-books">${placeholder('Laden…')}</div>
      </div>
    </div>
  `;
  return div;
}

// ---- Kies welke letter van de maandnaam het oog wordt ----
// Priority: o > a > e > u. Valt terug op eerste klinker, anders eerste letter.
function pickEyeIndex(name) {
  const priorities = ['o', 'a', 'e', 'u'];
  for (const letter of priorities) {
    const idx = name.indexOf(letter);
    if (idx !== -1) return idx;
  }
  const match = name.match(/[aeiou]/i);
  return match ? match.index : 0;
}

// ---- Bouw de maandtitel opnieuw op: letters + eye-knop + jaartal ----
function buildMonthTitle(monthEl, parsed) {
  const name = parsed.label.split(' ')[0]; // bv "januari"
  const eyeIdx = pickEyeIndex(name);

  // Leeg maken, dan herbouwen
  monthEl.innerHTML = '';
  monthEl.setAttribute('aria-label', parsed.label);

  const frag = document.createDocumentFragment();
  for (let i = 0; i < name.length; i++) {
    if (i === eyeIdx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'archief-month-eye';
      btn.setAttribute('aria-label', `Toon details ${parsed.label}`);
      btn.setAttribute('aria-expanded', 'false');
      // Letter-in-pill zoals .tab-o / .tab-o-letter
      const letter = document.createElement('span');
      letter.className = 'archief-month-eye-letter';
      letter.textContent = name[i];
      const cross = document.createElement('span');
      cross.className = 'archief-month-eye-cross';
      cross.setAttribute('aria-hidden', 'true');
      cross.textContent = '×';
      btn.appendChild(letter);
      btn.appendChild(cross);
      frag.appendChild(btn);
    } else {
      const span = document.createElement('span');
      span.className = 'archief-month-letter';
      span.textContent = name[i];
      frag.appendChild(span);
    }
  }

  const yearSpan = document.createElement('span');
  yearSpan.className = 'archief-year';
  yearSpan.textContent = parsed.year;
  frag.appendChild(yearSpan);

  monthEl.appendChild(frag);
  return monthEl.querySelector('.archief-month-eye');
}

function initArchiefMaand() {
  const cards = document.querySelectorAll('.archief-card');
  cards.forEach((card) => {
    const monthEl = card.querySelector('.archief-month');
    if (!monthEl) return;
    const parsed = parseMonthLabel(monthEl);
    if (!parsed) return;

    // Herbouw de maandtitel met een klikbare eye-letter
    const eyeBtn = buildMonthTitle(monthEl, parsed);
    if (!eyeBtn) return;

    const open = () => {
      const isOpen = activeCard === card;
      closeActive();
      if (isOpen) return;

      let detail = card.querySelector('.archief-detail');
      const monthStart = new Date(parsed.year, parsed.month, 1);
      const monthEnd = new Date(parsed.year, parsed.month + 1, 1);

      if (!detail) {
        detail = buildDetailPanel();
        card.appendChild(detail);
        Promise.all([
          renderTracks(detail.querySelector('.detail-tracks'), monthStart, monthEnd),
          renderAlbums(detail.querySelector('.detail-albums'), monthStart, monthEnd),
          renderFilms(detail.querySelector('.detail-films'), monthStart, monthEnd),
          renderBooks(detail.querySelector('.detail-books'), monthStart, monthEnd),
        ]);
      }
      requestAnimationFrame(() => {
        detail.classList.add('is-open');
        card.classList.add('is-active');
        eyeBtn.setAttribute('aria-expanded', 'true');
        activeCard = card;
        setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      });
    };

    eyeBtn.addEventListener('click', (e) => { e.stopPropagation(); open(); });
    eyeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeCard) closeActive();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initArchiefMaand);
} else {
  initArchiefMaand();
}
