/* ============================================================
   Rainier E. Inoc — Portfolio interactions
   Loaded with `defer`, so the DOM is fully parsed when this runs.
   ============================================================ */

// Progressive enhancement flag — reveal animations only apply when JS is on
document.documentElement.classList.add('js');

// Dynamic year
document.querySelectorAll('.js-year').forEach(el => el.textContent = new Date().getFullYear());

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Reveal on scroll ----
const revealEls = document.querySelectorAll('.reveal');
if (reduceMotion || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('visible'));
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach(el => io.observe(el));
}

// Reduced-motion users get a manually scrollable tools row instead of the auto-marquee
if (reduceMotion) {
  const vp = document.querySelector('.marquee-viewport');
  if (vp) vp.setAttribute('tabindex', '0');   // keyboard-scrollable
}

// ---- Scrollspy: highlight the sidebar nav of the section in view ----
const navLinks = [...document.querySelectorAll('.nav-link')];
const sections = navLinks
  .map(l => document.querySelector(l.getAttribute('href')))
  .filter(Boolean);

function setActive(id) {
  navLinks.forEach(l => {
    const active = l.getAttribute('href') === '#' + id;
    l.classList.toggle('active', active);
    if (active) l.setAttribute('aria-current', 'true');
    else l.removeAttribute('aria-current');
  });
}

// A section activates when its top edge crosses this line (40% down the viewport)
const TRIGGER_RATIO = 0.40;
// How close to the page bottom counts as "at the bottom" (px)
const BOTTOM_TOLERANCE = 60;

let ticking = false;
let suppressSpy = false;   // true while a click-driven smooth scroll is in flight
let releaseTimer = null;

function updateActiveSection() {
  ticking = false;

  const viewportH = window.innerHeight;
  const scrollY   = window.scrollY;
  const docHeight = document.documentElement.scrollHeight;

  // Rule 1: at (or very near) the bottom of the page → the LAST section wins.
  if (viewportH + scrollY >= docHeight - BOTTOM_TOLERANCE) {
    setActive(sections[sections.length - 1].id);
    return;
  }

  // Rule 2: otherwise → the last section whose top edge has crossed the trigger line.
  const triggerLine = viewportH * TRIGGER_RATIO;
  let currentId = sections[0].id;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= triggerLine) {
      currentId = section.id;
    }
  }
  setActive(currentId);
}

// Hand control back to the scrollspy once a click-driven scroll has settled
function releaseSpy() {
  suppressSpy = false;
  updateActiveSection();
}

// ---- Click: highlight instantly, pause the spy until the scroll settles ----
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    setActive(link.getAttribute('href').slice(1));
    suppressSpy = true;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(releaseSpy, 250);
  });
});

function onScroll() {
  if (suppressSpy) {
    // Click-driven scroll in progress → keep the clicked link highlighted.
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(releaseSpy, 150);
    return;
  }
  if (!ticking) {
    ticking = true;
    requestAnimationFrame(updateActiveSection);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
updateActiveSection(); // set the correct state on page load

// ---- Mobile hamburger menu ----
const sidebar    = document.getElementById('sidebar');
const menuToggle = document.querySelector('.menu-toggle');
const menuIcon   = menuToggle ? menuToggle.querySelector('i') : null;

function setMenu(open) {
  if (!sidebar || !menuToggle) return;
  sidebar.classList.toggle('nav-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
  if (menuIcon) {
    menuIcon.classList.toggle('ph-list', !open);
    menuIcon.classList.toggle('ph-x', open);
  }
}

if (menuToggle && sidebar) {
  // Toggle on hamburger tap
  menuToggle.addEventListener('click', () => setMenu(!sidebar.classList.contains('nav-open')));

  // Close after tapping a nav link (page scrolls to the section)
  navLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));

  // Close on Escape (and return focus to the button)
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sidebar.classList.contains('nav-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });

  // Close when clicking/tapping outside the bar
  document.addEventListener('click', e => {
    if (sidebar.classList.contains('nav-open') && !sidebar.contains(e.target)) setMenu(false);
  });
}

// ---- Works lightbox: click a project card to view the full image ----
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lbImg   = lightbox.querySelector('.lightbox-img');
  const lbCap   = lightbox.querySelector('.lightbox-caption');
  const lbClose = lightbox.querySelector('.lightbox-close');

  function openLightbox(card) {
    const img = card.querySelector('.thumb img');
    if (!img) return;                       // image missing → fall through to the file link
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.alt;
    const title = card.querySelector('h3');
    lbCap.textContent = title ? title.textContent : '';
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';  // stop the page scrolling behind the popup
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lbImg.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      openLightbox(card);
    });
  });

  lbClose.addEventListener('click', closeLightbox);

  // Click on the dark backdrop (not the image) closes it
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.hidden) closeLightbox();
  });
}