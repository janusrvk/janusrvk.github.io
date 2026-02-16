// ---- Shared navigation & footer ----
// Injected on every page via import

const pages = [
  { href: '/', label: 'Home' },
  { href: '/interesses.html', label: 'Interesses' },
  { href: '/sollicitaties.html', label: 'Sollicitaties' },
  { href: '/over-mij.html', label: 'Over mij' },
];

function getCurrentPage() {
  const path = window.location.pathname;
  if (path === '/' || path === '/index.html') return '/';
  return path;
}

export function initNav() {
  const currentPage = getCurrentPage();

  // Build nav links
  const navLinks = pages
    .map(
      (p) =>
        `<a href="${p.href}" class="nav-link${currentPage === p.href ? ' active' : ''}">${p.label}</a>`
    )
    .join('');

  // Inject header
  const header = document.createElement('header');
  header.className = 'topbar';
  header.innerHTML = `
    <div class="topbar-inner">
      <a href="/" class="topbar-brand">Janus van Koolwijk</a>
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
  const footerLinks = pages
    .map((p) => `<a href="${p.href}">${p.label}</a>`)
    .join('');

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
}
