import"./main-_2U3sEls.js";const f="https://corsproxy.io/?url=",_="janusrvk",L="74f09a6e65ddc20949e95f2a014cd3ee";async function w(){const t=document.getElementById("lastfm-content");try{const n=(await(await fetch(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${_}&api_key=${L}&format=json&limit=5`)).json()).recenttracks?.track;if(!n||n.length===0){t.innerHTML='<p class="interest-placeholder">Geen recente tracks gevonden.</p>';return}const l=n.map(e=>{const c=e["@attr"]?.nowplaying==="true",s=e.image?.find(p=>p.size==="medium")?.["#text"],r=e.artist?.["#text"]||e.artist,o=e.name,d=e.album?.["#text"];return`
        <a href="${e.url}" target="_blank" rel="noopener" class="feed-item${c?" now-playing":""}">
          ${s?`<img src="${s}" alt="${o}" class="feed-art feed-art-music" />`:'<div class="feed-art feed-art-music feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${o}</span>
            <span class="feed-meta">${r}${d?` — ${d}`:""}</span>
          </div>
          ${c?'<span class="lastfm-live">Nu aan het luisteren</span>':""}
        </a>
      `}).join("");t.innerHTML=l}catch{t.innerHTML='<p class="interest-placeholder">Kon Last.fm niet laden.</p>'}}w();setInterval(w,3e4);const b="janusrvk";async function M(){const t=document.getElementById("letterboxd-content");try{const i=await(await fetch(`${f}${encodeURIComponent(`https://letterboxd.com/${b}/rss/`)}`)).text(),n=new DOMParser,l=n.parseFromString(i,"text/xml"),e=Array.from(l.querySelectorAll("item")).slice(0,5);if(e.length===0){t.innerHTML='<p class="interest-placeholder">Geen recente films gevonden.</p>';return}const c=e.map(s=>{const r=s.querySelector("title")?.textContent||"",o=s.querySelector("link")?.textContent||"#",d=s.querySelector("description")?.textContent||"",m=n.parseFromString(d,"text/html").querySelector("img")?.getAttribute("src")||"",h=r.match(/★+½?/),g=h?h[0]:"",$=r.replace(/,\s*\d{4}\s*-\s*★+½?/,"").replace(/,\s*\d{4}/,"").trim(),y=r.match(/,\s*(\d{4})/),x=y?y[1]:"";return`
        <a href="${o}" target="_blank" rel="noopener" class="feed-item">
          ${m?`<img src="${m}" alt="${$}" class="feed-art" />`:'<div class="feed-art feed-art-empty"></div>'}
          <div class="feed-info">
            <span class="feed-title">${$}${x?` (${x})`:""}</span>
            ${g?`<span class="feed-meta">${g}</span>`:""}
          </div>
        </a>
      `}).join("");t.innerHTML=c}catch{t.innerHTML='<p class="interest-placeholder">Kon Letterboxd niet laden.</p>'}}M();const S="161530834";async function T(){const t=document.getElementById("goodreads-content");try{const i=await(await fetch(`${f}${encodeURIComponent(`https://www.goodreads.com/review/list_rss/${S}?shelf=currently-reading`)}`)).text(),n=new DOMParser,l=n.parseFromString(i,"text/xml"),e=Array.from(l.querySelectorAll("item")).slice(0,5);if(e.length===0){const s=await(await fetch(`${f}${encodeURIComponent(`https://www.goodreads.com/review/list_rss/${S}?shelf=read`)}`)).text(),r=n.parseFromString(s,"text/xml"),o=Array.from(r.querySelectorAll("item")).slice(0,5);if(o.length===0){t.innerHTML='<p class="interest-placeholder">Geen boeken gevonden.</p>';return}v(t,o,n,"Gelezen");return}v(t,e,n,"Aan het lezen")}catch{t.innerHTML='<p class="interest-placeholder">Kon Goodreads niet laden.</p>'}}function v(t,a,i,n){const l=a.map(e=>{const c=e.querySelector("title")?.textContent||"",s=e.querySelector("link")?.textContent||"#",r=e.querySelector("author_name")?.textContent||"",o=e.querySelector("description")?.textContent||"",m=(i.parseFromString(o,"text/html").querySelector("img")?.getAttribute("src")||"").replace(/\._\w+\d+_/,"._SX100_");return`
      <a href="${s}" target="_blank" rel="noopener" class="feed-item">
        ${m?`<img src="${m}" alt="${c}" class="feed-art feed-art-book" />`:'<div class="feed-art feed-art-empty"></div>'}
        <div class="feed-info">
          <span class="feed-title">${c}</span>
          <span class="feed-meta">${r}</span>
        </div>
      </a>
    `}).join("");t.innerHTML=l}T();
