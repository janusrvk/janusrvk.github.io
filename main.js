// ---- Main entry point (shared across most pages) ----
import { initNav } from './nav.js';

initNav();

// ---- Avatar scroll-naar-topbar effect ----
// Verwijder dit blok om het effect ongedaan te maken
(function initAvatarScroll() {
  const heroAvatar = document.querySelector('.hero-avatar');
  const brand = document.querySelector('.topbar-brand');
  if (!heroAvatar || !brand) return;

  // Maak topbar avatar element aan (begint verborgen)
  const topbarAvatar = document.createElement('img');
  topbarAvatar.src = heroAvatar.src;
  topbarAvatar.alt = heroAvatar.alt;
  topbarAvatar.className = 'topbar-avatar-scroll';
  brand.prepend(topbarAvatar);

  let visible = false;

  window.addEventListener('scroll', () => {
    const rect = heroAvatar.getBoundingClientRect();
    const shouldShow = rect.top <= 56; // topbar hoogte

    if (shouldShow && !visible) {
      visible = true;
      topbarAvatar.classList.add('visible');
      heroAvatar.style.opacity = '0';
    } else if (!shouldShow && visible) {
      visible = false;
      topbarAvatar.classList.remove('visible');
      heroAvatar.style.opacity = '1';
    }
  }, { passive: true });
})();