// ---- Interesses page: nav + Last.fm, Letterboxd, Goodreads ----
import { initNav } from './nav.js';

initNav();

// ---- Last.fm integration ----
const LASTFM_USER = 'janusrvk';
const LASTFM_API_KEY = '74f09a6e65ddc20949e95f2a014cd3ee';

async function fetchLastFm() {
  const container = document.getElementById('lastfm-content');
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=5`
    );
    const data = await res.json();
    const tracks = data.recenttracks?.track;

    if (!tracks || tracks.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen recente tracks gevonden.</p>';
      return;
    }

    const html = tracks.map((track) => {
      const isNowPlaying = track['@attr']?.nowplaying === 'true';
      const image = track.image?.find((img) => img.size === 'medium')?.['#text'];
      const artist = track.artist?.['#text'] || track.artist;
      const name = track.name;
      const album = track.album?.['#text'];
      const url = track.url;

      return `
        <a href="${url}" target="_blank" rel="noopener" class="lastfm-track${isNowPlaying ? ' now-playing' : ''}">
          ${image ? `<img src="${image}" alt="${name}" class="lastfm-art" />` : '<div class="lastfm-art lastfm-art-empty"></div>'}
          <div class="lastfm-info">
            <span class="lastfm-name">${name}</span>
            <span class="lastfm-artist">${artist}${album ? ` — ${album}` : ''}</span>
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

async function fetchLetterboxd() {
  const container = document.getElementById('letterboxd-content');
  try {
    const res = await fetch(`/api/letterboxd/${LETTERBOXD_USER}/rss/`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 5);

    if (items.length === 0) {
      container.innerHTML = '<p class="interest-placeholder">Geen recente films gevonden.</p>';
      return;
    }

    const html = items.map((item) => {
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

      return `
        <a href="${link}" target="_blank" rel="noopener" class="feed-item">
          ${posterSrc ? `<img src="${posterSrc}" alt="${cleanTitle}" class="feed-art" />` : '<div class="feed-art feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${cleanTitle}${year ? ` (${year})` : ''}</span>
            ${rating ? `<span class="feed-meta">${rating}</span>` : ''}
          </div>
        </a>
      `;
    }).join('');

    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="interest-placeholder">Kon Letterboxd niet laden.</p>';
  }
}

fetchLetterboxd();

// ---- Goodreads integration (RSS) ----
const GOODREADS_USER_ID = '161530834';

async function fetchGoodreads() {
  const container = document.getElementById('goodreads-content');
  try {
    const res = await fetch(`/api/goodreads/review/list_rss/${GOODREADS_USER_ID}?shelf=currently-reading`);
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 5);

    if (items.length === 0) {
      const res2 = await fetch(`/api/goodreads/review/list_rss/${GOODREADS_USER_ID}?shelf=read`);
      const text2 = await res2.text();
      const xml2 = parser.parseFromString(text2, 'text/xml');
      const items2 = Array.from(xml2.querySelectorAll('item')).slice(0, 5);

      if (items2.length === 0) {
        container.innerHTML = '<p class="interest-placeholder">Geen boeken gevonden.</p>';
        return;
      }
      renderBooks(container, items2, parser, 'Gelezen');
      return;
    }

    renderBooks(container, items, parser, 'Aan het lezen');
  } catch (err) {
    container.innerHTML = '<p class="interest-placeholder">Kon Goodreads niet laden.</p>';
  }
}

function renderBooks(container, items, parser, shelfLabel) {
  const html = items.map((item) => {
    const title = item.querySelector('title')?.textContent || '';
    const link = item.querySelector('link')?.textContent || '#';
    const author = item.querySelector('author_name')?.textContent || '';
    const description = item.querySelector('description')?.textContent || '';

    const descDoc = parser.parseFromString(description, 'text/html');
    const img = descDoc.querySelector('img');
    const coverSrc = img?.getAttribute('src') || '';
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

  container.innerHTML = html;
}

fetchGoodreads();
