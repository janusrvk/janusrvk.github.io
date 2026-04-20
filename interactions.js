// ---- Interacties: eye color-cycle + pupil mouse-tracking, tab expand/collapse, archief toggle ----

const THEMES = ['ink', 'orange', 'cream', 'rust'];

// ---------- Eye color cycle + pupil-tracking ----------
function initEyes() {
  const root = document.documentElement;
  const eyes = Array.from(document.querySelectorAll('[data-eye]'));

  // Lees opgeslagen thema (optioneel)
  const stored = localStorage.getItem('janus-theme');
  if (stored && THEMES.includes(stored)) {
    root.setAttribute('data-theme', stored);
  } else if (stored) {
    // Oud/verwijderd thema (bv. amber) — reset naar default
    localStorage.removeItem('janus-theme');
  }

  // Klik op een oog wisselt thema
  eyes.forEach((eye) => {
    eye.addEventListener('click', (e) => {
      e.stopPropagation();
      const current = root.getAttribute('data-theme') || THEMES[0];
      const idx = THEMES.indexOf(current);
      const next = THEMES[(idx + 1) % THEMES.length];
      root.setAttribute('data-theme', next);
      localStorage.setItem('janus-theme', next);

      // korte knipper-animatie
      const pupil = eye.querySelector('.pupil');
      if (pupil) {
        pupil.animate(
          [
            { transform: 'translate(0,0) scale(0.55)' },
            { transform: 'translate(0,0) scale(1.1)' },
            // herstel naar door JS gestuurde positie
            { transform: pupil.style.transform || 'translate(0,0) scale(1)' },
          ],
          { duration: 360, easing: 'cubic-bezier(0.5, 0, 0.2, 1)' }
        );
      }
    });
  });

  // ---------- Pupil-tracking: pupillen schuiven richting de muis ----------
  if (eyes.length === 0) return;

  // Voorkom werk bij prefers-reduced-motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  // Cache eye-rects, herbereken bij scroll/resize
  let eyeRects = [];
  const measureEyes = () => {
    eyeRects = eyes.map((eye) => {
      const r = eye.getBoundingClientRect();
      return {
        eye,
        cx: r.left + r.width / 2,
        cy: r.top + r.height / 2,
        radius: r.width / 2,
      };
    });
  };
  measureEyes();
  window.addEventListener('resize', measureEyes);
  window.addEventListener('scroll', measureEyes, { passive: true });

  // Mouse tracking
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  }, { passive: true });

  // Touch fallback (één vinger)
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    mouseX = t.clientX;
    mouseY = t.clientY;
  }, { passive: true });

  // RAF-loop schrijft de pupil-offset (-1..1) op iedere eye
  let raf;
  const tick = () => {
    eyeRects.forEach(({ eye, cx, cy, radius }) => {
      const dx = mouseX - cx;
      const dy = mouseY - cy;
      const dist = Math.hypot(dx, dy);
      // Begrens binnen het oog: hoe verder weg, hoe sterker richting buiten (max 1)
      const ratio = dist === 0 ? 0 : Math.min(1, dist / (radius * 4));
      const nx = dist === 0 ? 0 : (dx / dist) * ratio;
      const ny = dist === 0 ? 0 : (dy / dist) * ratio;
      const pupil = eye.querySelector('.pupil');
      if (pupil) {
        pupil.style.setProperty('--px', nx.toFixed(3));
        pupil.style.setProperty('--py', ny.toFixed(3));
      }
    });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  // Re-meet bij font-load (Archivo Black laadt async → letters worden groter)
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(measureEyes);
  }
}

// ---------- Tab expand / collapse ----------
function initTabs() {
  const sections = document.querySelectorAll('.tab-section');

  sections.forEach((section) => {
    const oButton = section.querySelector('.tab-o');
    const oLetter = section.querySelector('.tab-o-letter');
    const closeBtn = section.querySelector('[data-close]');
    if (!oButton) return;

    // Alleen de "e"-knop opent de sectie (niet het hele woord)
    const openHandler = (e) => {
      // Niet openen als er op iets binnen de content geklikt is
      if (e.target.closest('a, button:not(.tab-o-letter), .tab-content')) return;
      if (section.classList.contains('is-open')) return;
      e.stopPropagation();
      openSection(section);
    };
    oButton.addEventListener('click', openHandler);
    oLetter?.addEventListener('click', openHandler);

    // Klik op close-knop = sluit
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeSection(section);
    });
  });

  // Escape-toets sluit open tab
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.tab-section.is-open').forEach(closeSection);
    }
  });

  // Bij hash navigatie (vanaf andere pagina, bv. /#archief) → openen
  const openFromHash = () => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    const target = document.getElementById(hash);
    if (target?.classList.contains('tab-section')) {
      openSection(target);
      // soft scroll
      setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };
  window.addEventListener('hashchange', openFromHash);
  openFromHash();
}

function openSection(section) {
  // Sluit andere open tabs (1 tegelijk)
  document.querySelectorAll('.tab-section.is-open').forEach((s) => {
    if (s !== section) s.classList.remove('is-open');
  });
  section.classList.add('is-open');

  // Soft scroll zodat het uitklappende blok in beeld komt
  setTimeout(() => {
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 80);
}

function closeSection(section) {
  section.classList.remove('is-open');
}

// ---------- Archief: Toon meer / minder ----------
function initArchief() {
  const toggle = document.getElementById('archief-toggle');
  const hidden = document.getElementById('archief-hidden');
  if (!toggle || !hidden) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const opening = !hidden.classList.contains('archief-visible');
    hidden.classList.toggle('archief-visible');
    toggle.textContent = opening ? 'Toon minder' : 'Toon meer';
  });
}

// ---------- CV-secties: Loopbaan/Opleiding als mini-tab met O-oog ----------
// Kies de eerste "o" in het woord (fallback: a>e>u), zodat we de letter
// kunnen vervangen door een klikbare eye-knop in tab-stijl.
function pickCvEyeIndex(name) {
  const priorities = ['o', 'a', 'e', 'u'];
  for (const letter of priorities) {
    const idx = name.indexOf(letter);
    if (idx !== -1) return idx;
  }
  return 0;
}

function buildCvSectionTitle(titleEl) {
  const name = titleEl.textContent.trim().toLowerCase();
  if (!name) return null;
  const eyeIdx = pickCvEyeIndex(name);

  titleEl.setAttribute('aria-label', name);
  titleEl.innerHTML = '';

  const frag = document.createDocumentFragment();
  for (let i = 0; i < name.length; i++) {
    if (i === eyeIdx) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cv-section-eye';
      btn.setAttribute('aria-label', `Toon ${name}`);
      btn.setAttribute('aria-expanded', 'false');
      const letter = document.createElement('span');
      letter.className = 'cv-section-eye-letter';
      letter.textContent = name[i];
      const cross = document.createElement('span');
      cross.className = 'cv-section-eye-cross';
      cross.setAttribute('aria-hidden', 'true');
      cross.textContent = '×';
      btn.appendChild(letter);
      btn.appendChild(cross);
      frag.appendChild(btn);
    } else {
      const span = document.createElement('span');
      span.className = 'cv-section-letter';
      span.textContent = name[i];
      frag.appendChild(span);
    }
  }

  titleEl.appendChild(frag);
  return titleEl.querySelector('.cv-section-eye');
}

function initCvSections() {
  const sections = document.querySelectorAll('.cv-section');

  sections.forEach((section) => {
    const titleEl = section.querySelector('.cv-section-title');
    if (!titleEl) return;

    const eye = buildCvSectionTitle(titleEl);
    if (!eye) return;

    const toggle = () => {
      const willOpen = !section.classList.contains('is-active');
      section.classList.toggle('is-active');
      eye.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    };

    eye.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
    eye.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  });
}

// ---------- Init alles ----------
initEyes();
initTabs();
initArchief();
initCvSections();
