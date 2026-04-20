// ---- Main entry point (shared across most pages) ----
import { initNav } from './nav.js';

initNav();


// Brand-naam scrollanimatie — verschijnt in topbar zodra de mastheadnaam voorbijscrolt
(function initBrandScroll() {
  const mastheadName = document.querySelector('.masthead-name');
  if (!mastheadName) return;
  const brandText = document.querySelector('.topbar-brand-text');
  if (!brandText) return;

  brandText.classList.add('brand-hidden');
  let nameVisible = false;

  window.addEventListener('scroll', () => {
    const shouldShow = mastheadName.getBoundingClientRect().bottom <= 56;
    if (shouldShow && !nameVisible) {
      nameVisible = true;
      brandText.classList.remove('brand-hidden');
    } else if (!shouldShow && nameVisible) {
      nameVisible = false;
      brandText.classList.add('brand-hidden');
    }
  }, { passive: true });
})();

