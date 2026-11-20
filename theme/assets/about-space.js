// About hero, "the space between" (DECISIONS 319–322): the scroll position is turned straight into one value (--p),
// once per frame, with no smoothing delay (it should follow the finger and the wheel exactly). The CSS turns --p into
// transforms and opacities only. On laptops the space leans gently toward the pointer.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const init = (root) => {
  root.querySelectorAll('[data-ab-sp]:not([data-ready])').forEach((el) => {
    if (reduce.matches) return;
    el.dataset.ready = '';
    el.classList.add('is-live');
    const stage = el.querySelector('.ab-sp__stage');
    const words = [...el.querySelectorAll('.ab-sp__title .w')];
    // Each heading word parts with the sun on its side (measured once, and again on resize).
    const aim = () => {
      const r = stage.getBoundingClientRect();
      words.forEach((w) => {
        const b = w.getBoundingClientRect();
        const dx = (b.left + b.width / 2 - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (b.top + b.height / 2 - (r.top + r.height / 2)) / (r.height / 2);
        w.style.setProperty('--wd', (Math.sign(dx || 1) * (0.6 + Math.abs(dx) * 0.6)).toFixed(3));
        w.style.setProperty('--wy', (dy * 0.25).toFixed(3));
      });
    };
    let top = 0, run = 1, raf = 0, last = -1, mx = 0, tx = 0;
    // The real header height (the floating pill on laptops is shorter than --header-h): the hero tucks under exactly
    // the header, never under the announcement bar above it.
    const hdr = document.querySelector('.shopify-section:has(> .site-header-wrap)') || document.querySelector('.site-header-wrap');
    const measure = () => {
      if (hdr) el.style.setProperty('--hdr', `${hdr.offsetHeight}px`);
      const r = el.getBoundingClientRect();
      top = r.top + scrollY;
      run = Math.max(1, el.offsetHeight - stage.offsetHeight);
    };
    const frame = () => {
      raf = 0;
      const p = ease(Math.min(1, Math.max(0, (scrollY - top) / run / 0.92)));
      if (Math.abs(p - last) > 0.0003) { last = p; el.style.setProperty('--p', p.toFixed(4)); }
      // only the pointer lean is eased, and it fades out as the space opens
      const want = tx * (1 - p);
      mx += (want - mx) * 0.1;
      el.style.setProperty('--mx', mx.toFixed(4));
      if (Math.abs(want - mx) > 0.002) raf = requestAnimationFrame(frame);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { measure(); aim(); queue(); });
    if (fine.matches) {
      stage.addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth) * 2 - 1; queue(); });
      stage.addEventListener('pointerleave', () => { tx = 0; queue(); });
    }
    measure();
    aim();
    document.fonts?.ready.then(() => { measure(); aim(); });
    queue();
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
