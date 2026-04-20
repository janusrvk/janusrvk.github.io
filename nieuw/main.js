// ---- Main entry point (shared across most pages) ----
import { initNav } from './nav.js';

initNav();

// Brand-naam scrollanimatie — verschijnt in topbar zodra de hero-naam voorbijscrolt
(function initBrandScroll() {
  // Werkt zowel met de nieuwe (.hero-word) als de oude (.masthead-name) opmaak
  const heroName = document.querySelector('.hero-word:last-of-type, .hero-word, .masthead-name');
  if (!heroName) return;
  const brandText = document.querySelector('.topbar-brand-text');
  if (!brandText) return;

  brandText.classList.add('brand-hidden');
  let nameVisible = false;

  const onScroll = () => {
    const shouldShow = heroName.getBoundingClientRect().bottom <= 56;
    if (shouldShow && !nameVisible) {
      nameVisible = true;
      brandText.classList.remove('brand-hidden');
    } else if (!shouldShow && nameVisible) {
      nameVisible = false;
      brandText.classList.add('brand-hidden');
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
