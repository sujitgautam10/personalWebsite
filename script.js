
import * as BadWordsModule from 'https://esm.sh/bad-words';

const Filter = BadWordsModule.default || BadWordsModule.Filter || BadWordsModule;
const filter = new Filter();

/* words.js is git-ignored (it holds the real banned-word list) so it
   won't exist on a fresh clone. Try it first; fall back to the tracked
   words.example.js template so the site still works without it. */
let ABC = [];
try {
  ({ ABC } = await import('./words.js'));
} catch {
  ({ ABC } = await import('./words.example.js'));
}
filter.addWords(...ABC);

let ABC = [];
let filter = { isProfane: () => false };

Promise.all([
  import('https://esm.sh/bad-words'),
  import('./words.example.js')
]).then(([BadWordsModule, wordsModule]) => {
  const Filter = BadWordsModule.default || BadWordsModule.Filter || BadWordsModule;
  ABC = wordsModule.ABC || [];
  filter = new Filter();
  filter.addWords(...ABC);
}).catch(err => {
  console.warn('Content filter failed to load; profanity check disabled for this session.', err);
});


const GREETING_ONLY_RE = /^(hi+|hey+|hello+|yo+|sup+|namaste|namaskar|hola)[\s!.,?]*$/i;
function collapseSpelledOut(text) {
  return text.replace(/(?:[a-z][\s\-_.*])+[a-z]/g, match => match.replace(/[\s\-_.*]/g, ''));
}

function hasInappropriateContent(text) {
  const lower = text.trim().toLowerCase();
  const collapsed = collapseSpelledOut(lower);

  const containsBannedWord = ABC.some(word => collapsed.includes(word) || lower.includes(word));

  return GREETING_ONLY_RE.test(lower) || filter.isProfane(lower) || containsBannedWord;
}

'use strict';


/* ─────────────────────────────────────────
   PRELOADER
   - Fires on DOMContentLoaded (doesn't wait for fonts/CDN)
   - Hard cap: hides after 1200ms max no matter what
───────────────────────────────────────── */
function hidePreloader() {
  const pre = document.getElementById('preloader');
  if (!pre || pre.classList.contains('gone')) return;
  pre.classList.add('gone');
  initReveal();
}
/* Hide as soon as DOM is ready — fast path */
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(hidePreloader, 300);
});
/* Absolute fallback: never show longer than 1.2s */
setTimeout(hidePreloader, 1200);

/* ─────────────────────────────────────────
   THEME
───────────────────────────────────────── */
const html     = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
let theme      = localStorage.getItem('sg-theme') || 'dark';
html.setAttribute('data-theme', theme);

themeBtn?.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', theme);
  localStorage.setItem('sg-theme', theme);
});

/* ─────────────────────────────────────────
   SCROLL CONTAINER + NAVBAR STUCK
───────────────────────────────────────── */
const wrap = document.getElementById('scrollWrap');
const nav  = document.getElementById('nav');

wrap?.addEventListener('scroll', () => {
  nav?.classList.toggle('stuck', wrap.scrollTop > 20);
}, { passive: true });



/* ─────────────────────────────────────────
   SECTION TRACKING  (active nav + dots)
───────────────────────────────────────── */
const sections = document.querySelectorAll('.snap-sec[id]');
const navLinks = document.querySelectorAll('.nl');
const sideDots = document.querySelectorAll('.sd');

function setActive(id) {
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.s === id));
  sideDots.forEach(d => d.classList.toggle('active', d.dataset.t === id));
}

if (sections.length && wrap) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.4) setActive(e.target.id); });
  }, { root: wrap, threshold: 0.4 });
  sections.forEach(s => obs.observe(s));
}

/* ─────────────────────────────────────────
   NAVIGATION — instant jump (no smooth scroll)
   Smooth scroll fights with CSS scroll-snap: the browser tries to stop
   at every snap point it passes through on the way to the target,
   which looks like it's stepping through each section in turn. An
   instant jump avoids that entirely.
───────────────────────────────────────── */
function goTo(id) {
  const el = document.getElementById(id);
  if (!el || !wrap) return;

  wrap.style.scrollSnapType = 'none';
  wrap.scrollTop = el.offsetTop;

  setTimeout(() => { wrap.style.scrollSnapType = ''; }, 500);
}
document.querySelectorAll('a[href^="#"]').forEach(a => {
  const handle = e => {
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    e.stopPropagation();
    goTo(id);
  };
  a.addEventListener('click', handle);
  a.addEventListener('touchend', handle, { passive: false });
});

sideDots.forEach(b => {
  b.addEventListener('click', () => goTo(b.dataset.t));
  b.addEventListener('touchend', e => { e.preventDefault(); goTo(b.dataset.t); }, { passive: false });
});

/* ─────────────────────────────────────────
   MOBILE HAMBURGER MENU (≤480px only)
───────────────────────────────────────── */
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNav     = document.getElementById('mobileNav');

function closeMobileNav() {
  mobileNav?.classList.remove('open');
  mobileNav?.setAttribute('aria-hidden', 'true');
  hamburgerBtn?.classList.remove('active');
  hamburgerBtn?.setAttribute('aria-expanded', 'false');
}
function openMobileNav() {
  mobileNav?.classList.add('open');
  mobileNav?.setAttribute('aria-hidden', 'false');
  hamburgerBtn?.classList.add('active');
  hamburgerBtn?.setAttribute('aria-expanded', 'true');
}

hamburgerBtn?.addEventListener('click', () => {
  mobileNav?.classList.contains('open') ? closeMobileNav() : openMobileNav();
});

mobileNav?.querySelectorAll('.mn-link').forEach(link => {
  link.addEventListener('click', closeMobileNav);
  link.addEventListener('touchend', closeMobileNav, { passive: true });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && mobileNav?.classList.contains('open')) closeMobileNav();
});

document.addEventListener('click', e => {
  if (!mobileNav?.classList.contains('open')) return;
  if (!mobileNav.contains(e.target) && e.target !== hamburgerBtn && !hamburgerBtn.contains(e.target)) {
    closeMobileNav();
  }
});
/* ─────────────────────────────────────────
   REVEAL ON SCROLL
───────────────────────────────────────── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!wrap) return;
  const ro = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const d = parseInt(e.target.dataset.d || '0', 10) * 70;
        setTimeout(() => e.target.classList.add('vis'), d);
        ro.unobserve(e.target);
      }
    });
  }, { root: wrap, threshold: 0.07, rootMargin: '0px 0px -16px 0px' });
  items.forEach((el, i) => { el.dataset.d = String(i % 6); ro.observe(el); });
}

/* ─────────────────────────────────────────
   SKILL TILE TILT  (desktop only)
───────────────────────────────────────── */
document.querySelectorAll('.skill-tile').forEach(tile => {
  tile.addEventListener('mousemove', e => {
    const r  = tile.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    tile.style.transform = `perspective(400px) rotateX(${dy * -7}deg) rotateY(${dx * 7}deg) translateY(-4px)`;
  });
  tile.addEventListener('mouseleave', () => { tile.style.transform = ''; });
});

/* ─────────────────────────────────────────
   HERO PHOTO — custom cursor + subtle parallax
───────────────────────────────────────── */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const heroStage = document.getElementById('heroPhotoStage');
const heroPhoto = document.getElementById('heroPhoto');
const canHover  = window.matchMedia('(hover: hover)').matches;

if (heroStage && heroPhoto && !prefersReducedMotion && canHover) {
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  document.body.appendChild(dot);

  heroStage.addEventListener('mouseenter', () => dot.classList.add('active'));
  heroStage.addEventListener('mouseleave', () => {
    dot.classList.remove('active');
    heroPhoto.style.transform = '';
  });
  heroStage.addEventListener('mousemove', e => {
    dot.style.left = `${e.clientX}px`;
    dot.style.top  = `${e.clientY}px`;

    const r  = heroStage.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
    const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
    heroPhoto.style.transform = `rotate(1.5deg) scale(1.035) translate(${dx * 6}px, ${dy * 6}px)`;
  });
}

/* ─────────────────────────────────────────
   MAGNETIC BUTTONS + CLICK RIPPLE
───────────────────────────────────────── */
document.querySelectorAll('[data-magnetic]').forEach(btn => {
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    btn.addEventListener('mousemove', e => {
      const r  = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width  / 2) * 0.22;
      const my = (e.clientY - r.top  - r.height / 2) * 0.28;
      btn.style.transform = `translate(${mx}px, ${my}px) translateY(-3px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
  }

  btn.addEventListener('click', e => {
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 1.6;
    const span = document.createElement('span');
    span.className = 'btn-ripple';
    span.style.width  = span.style.height = `${size}px`;
    span.style.left = `${e.clientX - r.left - size / 2}px`;
    span.style.top  = `${e.clientY - r.top  - size / 2}px`;
    btn.appendChild(span);
    span.addEventListener('animationend', () => span.remove());
  });
});

/* ─────────────────────────────────────────
   MOBILE KEYBOARD — keep input visible & footer unaffected
───────────────────────────────────────── */
function revealFocusedField() {
  const f = document.activeElement;
  const isField = f && (f.tagName === 'INPUT' || f.tagName === 'TEXTAREA');
  if (!isField || !wrap) return;
  const vv = window.visualViewport;
  const rect = f.getBoundingClientRect();
  const visibleBottom = vv ? vv.height + vv.offsetTop : window.innerHeight;
  const visibleTop = vv ? vv.offsetTop : 0;
  if (rect.bottom > visibleBottom - 16) {
    wrap.scrollBy({ top: rect.bottom - visibleBottom + 24, behavior: 'smooth' });
  } else if (rect.top < visibleTop + 16) {
    wrap.scrollBy({ top: rect.top - visibleTop - 24, behavior: 'smooth' });
  }
}

if (window.visualViewport) {
  const vv = window.visualViewport;
  const KB_THRESHOLD = 120; /* px shrink that signals the keyboard opened */

  vv.addEventListener('resize', () => {
    const f = document.activeElement;
    const isField = f && (f.tagName === 'INPUT' || f.tagName === 'TEXTAREA');
    const kbOpen  = (window.innerHeight - vv.height) > KB_THRESHOLD;

    wrap?.classList.toggle('kb-open', isField && kbOpen);
    document.getElementById('contact')?.classList.toggle('kb-open', isField && kbOpen);

    if (isField && kbOpen) setTimeout(revealFocusedField, 80);
  });
}

/* Also disable scroll-snap the moment a field is focused — some Android
   browsers fire the viewport resize event late, so this covers the gap. */
document.querySelectorAll('.fg input, .fg textarea').forEach(f => {
  f.addEventListener('focus', () => {
    wrap?.classList.add('kb-open');
    document.getElementById('contact')?.classList.add('kb-open');
    setTimeout(revealFocusedField, 250);
  });
  f.addEventListener('blur', () => {
    setTimeout(() => {
      wrap?.classList.remove('kb-open');
      document.getElementById('contact')?.classList.remove('kb-open');
    }, 150);
  });
  f.addEventListener('input', () => revealFocusedField());
});

/* ─────────────────────────────────────────
   CONTACT FORM
───────────────────────────────────────── */
const form        = document.getElementById('contactForm');
const submitBtn   = document.getElementById('submitBtn');
const formOk      = document.getElementById('formOk');
const countdownEl = document.getElementById('countdownEl');
const COOLDOWN     = 60;
const COOLDOWN_KEY = 'sg-cooldown-until';
let cooling = false, coolTimer = null;


function valField(f) {
  const err = f.parentElement.querySelector('.ferr');
  if (!err) return true;
  const v = f.value.trim();
  if (!v)                                                              { setErr(f, err, 'Required.');            return false; }
  if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))   { setErr(f, err, 'Please enter a valid email address.');  return false; }
  if (f.tagName === 'TEXTAREA' && v.length < 10)                      { setErr(f, err, 'Please enter at least 10 characters.');   return false; }
  if (f.tagName === 'TEXTAREA' && hasInappropriateContent(v))          { setErr(f, err, "🚫 Message blocked. Please use appropriate language."); return false; }
  clrErr(f, err);
  return true;
}
function setErr(f, e, m) { e.textContent = m; f.style.borderColor = '#f87171'; f.setAttribute('aria-invalid', 'true'); }
function clrErr(f, e)    { e.textContent = ''; f.style.borderColor = ''; f.removeAttribute('aria-invalid'); }

function startCooldown(resumeFromMs) {
  cooling = true;
  const until = resumeFromMs || (Date.now() + COOLDOWN * 1000);
  localStorage.setItem(COOLDOWN_KEY, String(until));

  submitBtn.disabled = true;
  submitBtn.childNodes[0].textContent = 'Sent ✓';

  const tick = () => {
    const rem = Math.ceil((until - Date.now()) / 1000);
    if (rem <= 0) {
      clearInterval(coolTimer);
      cooling = false;
      localStorage.removeItem(COOLDOWN_KEY);
      submitBtn.disabled = false;
      submitBtn.childNodes[0].textContent = 'Send Message';
      if (countdownEl) countdownEl.textContent = '';
      return;
    }
    if (countdownEl) countdownEl.textContent = `Resend available in ${rem}s`;
  };
  tick();
  coolTimer = setInterval(tick, 1000);
}

/* On page load, check if a cooldown was already running before the
   refresh — if so, resume the countdown instead of resetting it. */
(function resumeCooldownIfActive() {
  const storedUntil = parseInt(localStorage.getItem(COOLDOWN_KEY), 10);
  if (storedUntil && storedUntil > Date.now()) {
    startCooldown(storedUntil);
  }
})();

if (form) {
  const fields = [...form.querySelectorAll('input:not([type=hidden]):not([name=_gotcha]), textarea')];

  fields.forEach(f => {
    f.addEventListener('blur',  () => valField(f));
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid')) valField(f); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const hp = form.querySelector('[name="_gotcha"]');
    if (hp?.value || cooling) return;

    let ok = true;
    fields.forEach(f => { if (!valField(f)) ok = false; });
    if (!ok) { form.querySelector('[aria-invalid]')?.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.childNodes[0].textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error('network');
      form.reset();
      formOk?.classList.add('show');
      setTimeout(() => formOk?.classList.remove('show'), 5000);
      startCooldown();
    } catch {
      submitBtn.disabled = false;
      submitBtn.childNodes[0].textContent = 'Try again';
      if (formOk) {
        formOk.style.cssText = 'background:rgba(248,113,113,0.09);border-color:rgba(248,113,113,0.22);color:#f87171;';
        formOk.textContent   = 'Something went wrong. Please try again.';
        formOk.classList.add('show');
        setTimeout(() => {
          formOk.classList.remove('show');
          formOk.removeAttribute('style');
          formOk.textContent = "Message sent! I'll reply within 24 hours.";
          submitBtn.childNodes[0].textContent = 'Send Message';
        }, 4000);
      }
    }
  });
}

/* ─────────────────────────────────────────
   SCROLL TO TOP BUTTON — visible only on the last (Contact) section
───────────────────────────────────────── */
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
  sideDots.forEach(d => {
    if (d.dataset.t === 'contact') {
      const contactObs = new MutationObserver(() => {
        scrollTopBtn.classList.toggle('show', d.classList.contains('active'));
      });
      contactObs.observe(d, { attributes: true, attributeFilter: ['class'] });
    }
  });

const goToTop = () => {
  wrap.style.scrollSnapType = 'none';
  wrap.style.overflow = 'hidden';   // halts any residual momentum/inertia scroll
  wrap.scrollTop = 0;

  requestAnimationFrame(() => {
    wrap.scrollTop = 0;
    setTimeout(() => {
      wrap.style.overflow = '';
      wrap.style.scrollSnapType = '';
    }, 500);
  });
};

  scrollTopBtn.addEventListener('click', goToTop);
  scrollTopBtn.addEventListener('touchend', e => { e.preventDefault(); goToTop(); }, { passive: false });
}

/* ─────────────────────────────────────────
   CV "COMING SOON" MODAL
   - Uses `inert` (not just aria-hidden) so the modal's contents are
     fully unreachable by keyboard/focus while closed.
   - Focus is moved into the modal on open, and back out to the
     trigger button before the modal is hidden on close — this avoids
     the "aria-hidden on focused element" browser warning, since focus
     never sits inside the modal at the moment it's marked hidden.
───────────────────────────────────────── */
const cvBtn   = document.getElementById('cvBtn');
const cvModal = document.getElementById('cvModal');



function openCvModal() {
  if (!cvModal || !wrap) return;

  cvModal.removeAttribute('aria-hidden');
  cvModal.removeAttribute('inert');
  cvModal.classList.add('open');

  document.documentElement.classList.add('modal-open');
  wrap.style.overflow = 'hidden';

  cvModal.querySelector('.cv-modal-close')?.focus();
}

function closeCvModal() {
  if (!cvModal || !wrap) return;

  cvBtn?.focus({ preventScroll: true });   // was: cvBtn?.focus();

  cvModal.classList.remove('open');
  cvModal.setAttribute('aria-hidden', 'true');
  cvModal.setAttribute('inert', '');

  document.documentElement.classList.remove('modal-open');
  wrap.style.overflow = '';
}

cvBtn?.addEventListener('click', openCvModal);
cvModal?.querySelectorAll('[data-cv-close]').forEach(el => {
  el.addEventListener('click', closeCvModal);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cvModal?.classList.contains('open')) closeCvModal();
});
