// ---- Shared navigation & footer ----
// Injected on every page via import

const sections = [
  { id: 'archief', label: 'Archief' },
  { id: 'over-mij', label: 'Over mij' },
];

function isHomePage() {
  const path = window.location.pathname;
  return path === '/' || path === '/index.html';
}

export function initNav() {
  const onHome = isHomePage();

  // Build nav links — on homepage use anchors, on other pages link to /#section
  const navLinks = [
    `<a href="/klassiek/" class="nav-link${onHome ? ' active' : ''}" data-section="home">Home</a>`,
    ...sections.map(
      (s) =>
        `<a href="${onHome ? '#' + s.id : '/#' + s.id}" class="nav-link" data-section="${s.id}">${s.label}</a>`
    ),
  ].join('');

  // Build footer links (always use /#section for consistency)
  const footerLinks = [
    `<a href="/klassiek/">Home</a>`,
    ...sections.map((s) => `<a href="/#${s.id}">${s.label}</a>`),
  ].join('');

  // Inject header
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <div class="topbar-inner">
      <a href="/klassiek/" class="topbar-brand"><span class="topbar-brand-text">Janus van Koolwijk</span></a>
      <nav class="topbar-nav" id="topbar-nav">
        ${navLinks}
      </nav>
      <button class="menu-toggle" id="menu-toggle" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  `;
  document.body.prepend(header);

  // Inject footer
  const footer = document.createElement('footer');
  footer.className = 'footer';
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-top">
        <div class="footer-brand">Janus van Koolwijk</div>
        <div class="footer-links">
          ${footerLinks}
        </div>
      </div>
<div class="footer-bottom">
        <p>&copy; 2026 Janus van Koolwijk</p>
      </div>
    </div>
  `;
  document.body.appendChild(footer);

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const topbarNav = document.getElementById('topbar-nav');

  menuToggle.addEventListener('click', () => {
    topbarNav.classList.toggle('open');
  });

  // Close menu on nav click (mobile)
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        topbarNav.classList.remove('open');
      }
    });
  });

  // Active nav highlighting on scroll (homepage only)
  if (onHome) {
    const sectionEls = sections
      .map((s) => ({ id: s.id, el: document.getElementById(s.id) }))
      .filter((s) => s.el);

    const navLinkEls = document.querySelectorAll('.nav-link[data-section]');

    function updateActiveNav() {
      const scrollY = window.scrollY + 100; // offset for topbar
      let activeId = 'home';

      for (const s of sectionEls) {
        if (s.el.offsetTop <= scrollY) {
          activeId = s.id;
        }
      }

      navLinkEls.forEach((link) => {
        link.classList.toggle('active', link.dataset.section === activeId);
      });
    }

    window.addEventListener('scroll', updateActiveNav, { passive: true });
    updateActiveNav();
  }
}
