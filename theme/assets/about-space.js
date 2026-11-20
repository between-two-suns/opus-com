// About hero, "the space between" (DECISIONS 319–320): scroll drives one smoothed progress value (--p); the CSS turns it
// into the light settling, today's sun setting, tomorrow's rising, the heading parting and the line forming. On laptops
// the space leans gently toward the pointer. Each heading word is told which way to part (with the sun on its side).
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const phone = matchMedia('(max-width: 749px)');
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const init = (root) => {
  root.querySelectorAll('[data-ab-sp]:not([data-ready])').forEach((el) => {
    if (reduce.matches) return;
    el.dataset.ready = '';
    el.classList.add('is-live');
    const stage = el.querySelector('.ab-sp__stage');
    const words = [...el.querySelectorAll('.ab-sp__title .w')];
    const aim = () => {
      const r = stage.getBoundingClientRect();
      words.forEach((w) => {
        const b = w.getBoundingClientRect();
        const dx = (b.left + b.width / 2 - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (b.top + b.height / 2 - (r.top + r.height / 2)) / (r.height / 2);
        // Laptops: words part sideways with the suns. Phones: up with today's sun or down with tomorrow's.
        w.style.setProperty('--wd', phone.matches ? (dx * 0.3).toFixed(3) : (Math.sign(dx || 1) * (0.6 + Math.abs(dx) * 0.6)).toFixed(3));
        w.style.setProperty('--wy', phone.matches ? (Math.sign(dy || 1) * 0.6).toFixed(3) : (dy * 0.2).toFixed(3));
      });
    };
    let target = 0, p = 0, mx = 0, tx = 0, raf = 0;
    const read = () => {
      const r = el.getBoundingClientRect();
      const run = r.height - stage.clientHeight - (parseFloat(getComputedStyle(stage).top) || 0);
      target = ease(run > 0 ? Math.min(1, Math.max(0, -r.top / run)) / 0.94 : 0);
    };
    // One loop, smoothed: the scene follows the scroll with a little weight instead of jumping with each wheel step.
    const frame = () => {
      raf = 0;
      p += (target - p) * 0.14;
      if (Math.abs(target - p) < 0.0005) p = target;
      mx += (tx * (1 - p) - mx) * 0.07;
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--mx', mx.toFixed(4));
      if (p !== target || Math.abs(tx * (1 - p) - mx) > 0.002) raf = requestAnimationFrame(frame);
    };
    const queue = () => { read(); if (!raf) raf = requestAnimationFrame(frame); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', () => { aim(); queue(); });
    if (fine.matches) {
      stage.addEventListener('pointermove', (e) => { tx = (e.clientX / innerWidth) * 2 - 1; queue(); });
      stage.addEventListener('pointerleave', () => { tx = 0; queue(); });
    }
    aim();
    document.fonts?.ready.then(aim);
    read(); p = target; queue();
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
