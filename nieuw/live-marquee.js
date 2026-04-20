// ---- Live marquee: Nu luisterend / Nu kijkend / Nu lezend ----
// Gebruikt: Last.fm (muziek), Letterboxd RSS via worker (films), Goodreads RSS via worker (boeken)

const LASTFM_USER = 'janusrvk';
const LASTFM_API_KEY = '74f09a6e65ddc20949e95f2a014cd3ee';
const LETTERBOXD_FEED = 'https://goodreads-proxy.janusrvk.workers.dev/letterboxd';
const GOODREADS_PROXY = 'https://goodreads-proxy.janusrvk.workers.dev';

const liveTrack = document.getElementById('marquee-live');
if (liveTrack) {
  initLiveMarquee();
}

async function fetchNowMusic() {
  try {
    const res = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USER}&api_key=${LASTFM_API_KEY}&format=json&limit=1`
    );
    const data = await res.json();
    const track = data.recenttracks?.track?.[0];
    if (!track) return null;
    const title = track.name || null;
    const artist = track.artist?.['#text'] || track.artist?.name || null;
    if (!title) return null;
    return { title, credit: artist };
  } catch {
    return null;
  }
}

async function fetchNowFilm() {
  try {
    const res = await fetch(LETTERBOXD_FEED);
    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, 'text/xml');
    const item = xml.querySelector('item');
    if (!item) return null;
    // Letterboxd title format: "Title, YYYY - ★★★½"
    const raw = item.querySelector('title')?.textContent || '';
    // Pak het jaar voordat we het strippen — gebruiken we als "credit"
    const yearMatch = raw.match(/,\s*(\d{4})/);
    const year = yearMatch ? yearMatch[1] : null;
    const cleaned = raw
      .replace(/,\s*\d{4}\s*-\s*★+½?/, '')
      .replace(/,\s*\d{4}/, '')
      .trim();
    if (!cleaned) return null;
    return { title: cleaned, credit: year };
  } catch {
    return null;
  }
}

async function fetchNowBook() {
  try {
    let res = await fetch(`${GOODREADS_PROXY}?shelf=currently-reading`);
    let text = await res.text();
    let xml = new DOMParser().parseFromString(text, 'text/xml');
    let item = xml.querySelector('item');
    if (!item) {
      res = await fetch(`${GOODREADS_PROXY}?shelf=read`);
      text = await res.text();
      xml = new DOMParser().parseFromString(text, 'text/xml');
      item = xml.querySelector('item');
    }
    if (!item) return null;
    const title = item.querySelector('title')?.textContent?.trim() || null;
    if (!title) return null;
    // Goodreads RSS heeft author_name als custom-element
    const author =
      item.getElementsByTagName('author_name')[0]?.textContent?.trim() ||
      item.querySelector('author name')?.textContent?.trim() ||
      null;
    return { title, credit: author };
  } catch {
    return null;
  }
}

function buildItem(tag, entry) {
  if (!entry) {
    return `<span class="marquee-item"><span class="marquee-tag">${tag}</span>—<span class="marquee-sep">●</span></span>`;
  }
  const titleHtml = `<span class="marquee-title">${escapeHtml(entry.title)}</span>`;
  const creditHtml = entry.credit
    ? `<span class="marquee-credit"> — ${escapeHtml(entry.credit)}</span>`
    : '';
  return `<span class="marquee-item"><span class="marquee-tag">${tag}</span>${titleHtml}${creditHtml}<span class="marquee-sep">●</span></span>`;
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function initLiveMarquee() {
  const [music, film, book] = await Promise.all([
    fetchNowMusic(),
    fetchNowFilm(),
    fetchNowBook(),
  ]);

  const trio =
    buildItem('Nu luisterend', music) +
    buildItem('Nu kijkend', film) +
    buildItem('Nu lezend', book);

  // Herhaal het trio meerdere keren zodat de loop naadloos is.
  // De CSS-animatie verplaatst -50%, dus minstens twee identieke runs nodig.
  const REPEATS = 4;
  liveTrack.innerHTML = trio.repeat(REPEATS);
}
