(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))o(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const s of t.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function i(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function o(e){if(e.ep)return;e.ep=!0;const t=i(e);fetch(e.href,t)}})();const u=[{id:"interesses",label:"Interesses"},{id:"archief",label:"Archief"},{id:"over-mij",label:"Over mij"}];function p(){const r=window.location.pathname;return r==="/"||r==="/index.html"}function v(){const r=p(),n=[`<a href="/" class="nav-link${r?" active":""}" data-section="home">Home</a>`,...u.map(a=>`<a href="${r?"#"+a.id:"/#"+a.id}" class="nav-link" data-section="${a.id}">${a.label}</a>`)].join(""),i=['<a href="/">Home</a>',...u.map(a=>`<a href="/#${a.id}">${a.label}</a>`)].join(""),o=document.createElement("header");o.className="topbar",o.innerHTML=`
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
          ${i}
        </div>
      </div>
<div class="footer-bottom">
        <p>&copy; 2026 Janus van Koolwijk</p>
      </div>
    </div>
  `,document.body.appendChild(e);const t=document.getElementById("menu-toggle"),s=document.getElementById("topbar-nav");if(t.addEventListener("click",()=>{s.classList.toggle("open")}),document.querySelectorAll(".nav-link").forEach(a=>{a.addEventListener("click",()=>{window.innerWidth<=768&&s.classList.remove("open")})}),r){let d=function(){const c=window.scrollY+100;let f="home";for(const l of a)l.el.offsetTop<=c&&(f=l.id);m.forEach(l=>{l.classList.toggle("active",l.dataset.section===f)})};var b=d;const a=u.map(c=>({id:c.id,el:document.getElementById(c.id)})).filter(c=>c.el),m=document.querySelectorAll(".nav-link[data-section]");window.addEventListener("scroll",d,{passive:!0}),d()}}v();(function(){const n=document.querySelector(".hero-avatar"),i=document.querySelector(".topbar-brand");if(!n||!i)return;const o=document.createElement("img");o.src=n.src,o.alt=n.alt,o.className="topbar-avatar-scroll",i.prepend(o);let e=!1;window.addEventListener("scroll",()=>{const s=n.getBoundingClientRect().top<=56;s&&!e?(e=!0,o.classList.add("visible"),n.style.opacity="0"):!s&&e&&(e=!1,o.classList.remove("visible"),n.style.opacity="1")},{passive:!0})})();
