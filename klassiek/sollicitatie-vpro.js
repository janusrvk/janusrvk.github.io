// ---- VPRO sollicitatie page: nav + accordion ----
import { initNav } from './nav.js';

initNav();

// ---- Accordion toggle ----
document.querySelectorAll('.accordion-header').forEach((btn) => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const body = btn.nextElementSibling;

    // Close all others
    document.querySelectorAll('.accordion-header').forEach((other) => {
      other.setAttribute('aria-expanded', 'false');
      other.nextElementSibling.classList.remove('open');
    });

    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      body.classList.add('open');
    }
  });
});
