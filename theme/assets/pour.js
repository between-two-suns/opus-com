/*
  Press to pour (product page demo, DECISIONS 211). Press and hold the pack: its texture pours from the nozzle and fills
  the frame behind it. Let go early and it draws back; hold until it has filled and it stays, until the next tap.
  A swipe (the gallery scrolls sideways) never pours. Keyboard: the button pours fully, or puts it back.
  The texture photo is fetched once the page has loaded, so it never competes with the first screen.
*/
const reduce = matchMedia('(prefers-reduced-motion: reduce)');

const init = (slide) => {
  if (slide.dataset.pourReady) return;
  const tex = slide.querySelector('.pour__tex'), btn = slide.querySelector('[data-pour]'), cut = slide.querySelector('.gallery__cutout');
  if (!tex || !btn || !cut) return;
  slide.dataset.pourReady = '';
  const img = tex.querySelector('img');
  const load = () => { if (img && !img.srcset) img.srcset = img.dataset.srcset; };
  if (document.readyState === 'complete') setTimeout(load, 300); else addEventListener('load', () => setTimeout(load, 300), { once: true });

  // the pour starts at the pack's nozzle: the top middle of the pack as drawn (the image is fitted inside its box)
  const origin = () => {
    const s = slide.getBoundingClientRect(), r = cut.getBoundingClientRect();
    const ar = (cut.naturalWidth || 1) / (cut.naturalHeight || 3);
    const h = Math.min(r.height, r.width / ar);
    slide.style.setProperty('--px', Math.round(r.left + r.width / 2 - s.left) + 'px');
    slide.style.setProperty('--py', Math.round(r.top + (r.height - h) / 2 + h * 0.04 - s.top) + 'px');
  };
  origin();
  if (window.ResizeObserver) new ResizeObserver(origin).observe(slide);
  cut.addEventListener('load', origin);

  let holding = false, auto = false, timer = 0, sx = 0, sy = 0;
  const set = (on, full) => {
    if (!on) auto = false;
    slide.classList.toggle('is-pour', on);
    slide.classList.toggle('is-poured', !!full);
    btn.setAttribute('aria-pressed', String(!!full));
  };
  tex.addEventListener('transitionend', (e) => { if (e.target === tex && slide.classList.contains('is-pour') && (holding || auto || reduce.matches)) set(true, true); });
  const start = (e) => {
    if (e.button > 0 || e.target.closest('a')) return;
    if (slide.classList.contains('is-poured')) return; // a tap puts it back (handled on release)
    load();
    sx = e.clientX; sy = e.clientY; holding = true;
    // a short beat first, so a quick swipe through the gallery never starts a pour
    timer = setTimeout(() => { if (holding) { origin(); set(true, false); } }, 140);
  };
  const move = (e) => { if (holding && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { holding = false; clearTimeout(timer); if (!slide.classList.contains('is-poured')) set(false); } };
  const end = (e) => {
    clearTimeout(timer);
    if (slide.classList.contains('is-poured') && !holding && e.type === 'pointerup' && Math.hypot(e.clientX - sx, e.clientY - sy) < 10) { set(false); return; }
    if (holding && !slide.classList.contains('is-poured')) set(false);
    holding = false;
  };
  slide.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; start(e); });
  slide.addEventListener('pointermove', move);
  slide.addEventListener('pointerup', end);
  slide.addEventListener('pointercancel', () => { holding = false; clearTimeout(timer); if (!slide.classList.contains('is-poured')) set(false); });
  slide.addEventListener('contextmenu', (e) => e.preventDefault());
  // keyboard (and screen readers): the button pours fully, or puts it back
  btn.addEventListener('click', (e) => {
    if (e.detail !== 0) return; // pointer presses are handled above
    load(); origin();
    if (slide.classList.contains('is-poured')) set(false); else { set(true, false); auto = true; if (reduce.matches) set(true, true); }
  });
};

document.querySelectorAll('.gallery__slide--studio').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('.gallery__slide--studio').forEach(init));
