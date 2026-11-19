// About hero, "the space between" (DECISIONS 319): scrolling sets today's sun and raises tomorrow's as the space
// between them opens onto the day; on laptops the space leans gently toward the pointer.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const init = (root) => {
  root.querySelectorAll('[data-ab-sp]:not([data-ready])').forEach((el) => {
    if (reduce.matches) return;
    el.dataset.ready = '';
    el.classList.add('is-live');
    const stage = el.querySelector('.ab-sp__stage');
    let raf = 0, p = -1, mx = 0, tx = 0;
    const frame = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - stage.clientHeight - (parseFloat(getComputedStyle(stage).top) || 0);
      const np = ease(run > 0 ? Math.min(1, Math.max(0, -r.top / run)) / 0.92 : 0);
      if (Math.abs(np - p) > 0.0004) { p = np; el.style.setProperty('--p', p.toFixed(4)); }
      // The pointer lean eases in and fades as the space opens, so it never fights the scroll.
      mx += (tx * (1 - p) - mx) * 0.08;
      el.style.setProperty('--mx', mx.toFixed(4));
      if (Math.abs(tx * (1 - p) - mx) > 0.002) raf = requestAnimationFrame(frame);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    if (fine.matches) {
      stage.addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth) * 2 - 1; queue(); });
      stage.addEventListener('pointerleave', () => { tx = 0; queue(); });
    }
    queue();
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
