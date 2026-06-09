'use strict';

/* ── Preloader ── */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  setTimeout(() => { pre.classList.add('gone'); initReveal(); }, 700);
});

/* ── Theme ── */
const html = document.documentElement;
const themeBtn = document.getElementById('themeBtn');
let theme = localStorage.getItem('sg-theme') || 'dark';
html.setAttribute('data-theme', theme);

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    theme = theme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', theme);
    localStorage.setItem('sg-theme', theme);
  });
}

/* ── Typewriter ── */
const typedEl = document.getElementById('typed');
const words = ['Software Engineering Student', 'Web Developer', 'Problem Solver', 'BSc at PCPS College'];
let wi = 0, ci = 0, deleting = false;
function typeLoop() {
  if (!typedEl) return;
  const word = words[wi];
  typedEl.textContent = deleting ? word.slice(0, ci--) : word.slice(0, ci++);
  if (!deleting && ci > word.length) { deleting = true; setTimeout(typeLoop, 1400); return; }
  if (deleting && ci < 0) { deleting = false; wi = (wi + 1) % words.length; ci = 0; setTimeout(typeLoop, 300); return; }
  setTimeout(typeLoop, deleting ? 45 : 75);
}
setTimeout(typeLoop, 900);

/* ── Scroll container ── */
const wrap = document.getElementById('scrollWrap');

/* ── Navbar stuck ── */
const nav = document.getElementById('nav');
if (wrap && nav) {
  wrap.addEventListener('scroll', () => {
    nav.classList.toggle('stuck', wrap.scrollTop > 20);
  }, { passive: true });
}

/* ── Section tracking ── */
const sections = document.querySelectorAll('.snap-sec[id]');
const navLinks  = document.querySelectorAll('.nl');
const sideDots  = document.querySelectorAll('.sd');

function setActive(id) {
  navLinks.forEach(l => l.classList.toggle('active', l.dataset.s === id));
  sideDots.forEach(d => d.classList.toggle('active', d.dataset.t === id));
}

if (sections.length) {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting && e.intersectionRatio >= 0.4) setActive(e.target.id); });
  }, { root: wrap, threshold: 0.4 });
  sections.forEach(s => obs.observe(s));
}

/* ── Scroll to section — mobile-safe with scroll-snap ── */
function goTo(id) {
  const el = document.getElementById(id);
  if (!el || !wrap) return;
  /* On mobile, smooth scroll inside a snap container can be blocked.
     Use instant scroll first so snap locks correctly, then let snap animate. */
  const isMobile = window.innerWidth <= 768;
  if (isMobile) {
    /* Temporarily disable snap, jump to position, re-enable */
    wrap.style.scrollSnapType = 'none';
    wrap.scrollTop = el.offsetTop;
    requestAnimationFrame(() => {
      wrap.style.scrollSnapType = '';
    });
  } else {
    wrap.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
  }
}

/* Nav links — use both click and touchend for mobile reliability */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  const handler = e => {
    const id = a.getAttribute('href').slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    e.stopPropagation();
    goTo(id);
  };
  a.addEventListener('click', handler);
  a.addEventListener('touchend', handler, { passive: false });
});
sideDots.forEach(b => {
  b.addEventListener('click', () => goTo(b.dataset.t));
  b.addEventListener('touchend', e => { e.preventDefault(); goTo(b.dataset.t); }, { passive: false });
});

/* ── Mobile menu — disabled (nav is always visible on all screen sizes) ── */
function closeMenu() {} // no-op kept for any legacy calls

/* ── Reveal on scroll ── */
function initReveal() {
  const items = document.querySelectorAll('.reveal');
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

/* ── Skill tile tilt ── */
document.querySelectorAll('.skill-tile').forEach(tile => {
  tile.addEventListener('mousemove', e => {
    const r = tile.getBoundingClientRect();
    const dx = (e.clientX - r.left - r.width/2)  / (r.width/2);
    const dy = (e.clientY - r.top  - r.height/2) / (r.height/2);
    tile.style.transform = `perspective(400px) rotateX(${dy*-7}deg) rotateY(${dx*7}deg) translateY(-4px)`;
  });
  tile.addEventListener('mouseleave', () => { tile.style.transform = ''; });
});

/* ── Contact form ── */
const form       = document.getElementById('contactForm');
const submitBtn  = document.getElementById('submitBtn');
const formOk     = document.getElementById('formOk');
const countdownEl = document.getElementById('countdownEl');
const COOLDOWN = 30;
let cooling = false, coolTimer = null;

function valField(f) {
  const err = f.parentElement.querySelector('.ferr');
  if (!err) return true;
  const v = f.value.trim();
  if (!v) { setErr(f, err, 'Required.'); return false; }
  if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErr(f, err, 'Valid email please.'); return false; }
  if (f.tagName === 'TEXTAREA' && v.length < 10) { setErr(f, err, 'At least 10 characters.'); return false; }
  clrErr(f, err); return true;
}
function setErr(f, e, m) { e.textContent = m; f.style.borderColor = '#f87171'; f.setAttribute('aria-invalid','true'); }
function clrErr(f, e) { e.textContent = ''; f.style.borderColor = ''; f.removeAttribute('aria-invalid'); }

function startCooldown() {
  cooling = true; let rem = COOLDOWN;
  const tick = () => {
    if (rem <= 0) {
      clearInterval(coolTimer); cooling = false;
      submitBtn.disabled = false;
      submitBtn.childNodes[0].textContent = 'Send Message';
      if (countdownEl) countdownEl.textContent = '';
      return;
    }
    if (countdownEl) countdownEl.textContent = `Resend available in ${rem}s`;
    rem--;
  };
  tick(); coolTimer = setInterval(tick, 1000);
}

/* ── Mobile keyboard fix — scroll focused input above keyboard ── */
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    const focused = document.activeElement;
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) {
      setTimeout(() => {
        focused.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  });
}

if (form) {
  const fields = [...form.querySelectorAll('input:not([type=hidden]):not([name=_gotcha]),textarea')];
  fields.forEach(f => {
    f.addEventListener('blur', () => valField(f));
    f.addEventListener('input', () => { if (f.getAttribute('aria-invalid')) valField(f); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const hp = form.querySelector('[name="_gotcha"]');
    if (hp && hp.value) return;
    if (cooling) return;
    let ok = true;
    fields.forEach(f => { if (!valField(f)) ok = false; });
    if (!ok) { form.querySelector('[aria-invalid]')?.focus(); return; }

    submitBtn.disabled = true;
    submitBtn.childNodes[0].textContent = 'Sending…';

    try {
      const res = await fetch(form.action, {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error();
      form.reset();
      if (formOk) formOk.classList.add('show');
      submitBtn.childNodes[0].textContent = 'Sent ✓';
      setTimeout(() => { if (formOk) formOk.classList.remove('show'); }, 5000);
      startCooldown();
    } catch {
      submitBtn.disabled = false;
      submitBtn.childNodes[0].textContent = 'Try again';
      if (formOk) {
        formOk.style.cssText = 'background:rgba(248,113,113,0.09);border-color:rgba(248,113,113,0.22);color:#f87171;';
        formOk.textContent = 'Something went wrong. Please try again.';
        formOk.classList.add('show');
        setTimeout(() => {
          formOk.classList.remove('show');
          formOk.removeAttribute('style');
          formOk.textContent = 'Message sent! I\'ll reply within 24 hours.';
          submitBtn.childNodes[0].textContent = 'Send Message';
        }, 4000);
      }
    }
  });
}
