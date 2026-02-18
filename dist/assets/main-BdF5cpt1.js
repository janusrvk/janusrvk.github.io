(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const a of t.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function r(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=r(e);fetch(e.href,t)}})();const u=[{id:"interesses",label:"Interesses"},{id:"sollicitaties",label:"Sollicitaties"},{id:"over-mij",label:"Over mij"}];function p(){const i=window.location.pathname;return i==="/"||i==="/index.html"}function v(){const i=p(),n=[`<a href="/" class="nav-link${i?" active":""}" data-section="home">Home</a>`,...u.map(s=>`<a href="${i?"#"+s.id:"/#"+s.id}" class="nav-link" data-section="${s.id}">${s.label}</a>`)].join(""),r=['<a href="/">Home</a>',...u.map(s=>`<a href="/#${s.id}">${s.label}</a>`)].join(""),o=document.createElement("header");o.className="topbar",o.innerHTML=`
    <div class="topbar-inner">
      <a href="/" class="topbar-brand">Janus van Koolwijk</a>
      <nav class="topbar-nav" id="topbar-nav">
        ${n}
      </nav>
      <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  `,document.body.prepend(o);const e=document.createElement("footer");e.className="footer",e.innerHTML=`
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">Janus van Koolwijk</div>
        <div class="footer-links">
          ${r}
        </div>
      </div>
<div class="footer-bottom">
        <p>&copy; 2026 Janus van Koolwijk</p>
      </div>
    </div>
  `,document.body.appendChild(e);const t=document.getElementById("menu-toggle"),a=document.getElementById("topbar-nav");if(t.addEventListener("click",()=>{a.classList.toggle("open")}),document.querySelectorAll(".nav-link").forEach(s=>{s.addEventListener("click",()=>{window.innerWidth<=768&&a.classList.remove("open")})}),i){let d=function(){const c=window.scrollY+100;let f="home";for(const l of s)l.el.offsetTop<=c&&(f=l.id);m.forEach(l=>{l.classList.toggle("active",l.dataset.section===f)})};var b=d;const s=u.map(c=>({id:c.id,el:document.getElementById(c.id)})).filter(c=>c.el),m=document.querySelectorAll(".nav-link[data-section]");window.addEventListener("scroll",d,{passive:!0}),d()}}v();(function(){const n=document.querySelector(".hero-avatar"),r=document.querySelector(".topbar-brand");if(!n||!r)return;const o=document.createElement("img");o.src=n.src,o.alt=n.alt,o.className="topbar-avatar-scroll",r.prepend(o);let e=!1;window.addEventListener("scroll",()=>{const a=n.getBoundingClientRect().top<=56;a&&!e?(e=!0,o.classList.add("visible"),n.style.opacity="0"):!a&&e&&(e=!1,o.classList.remove("visible"),n.style.opacity="1")},{passive:!0})})();
