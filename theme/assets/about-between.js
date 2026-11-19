// About hero, "the space between" (DECISIONS 317): the scroll parts the two suns and opens the window onto the evening.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

const init = (root) => {
  root.querySelectorAll('[data-ab-btw]:not([data-ready])').forEach((el) => {
    if (reduce.matches) return;
    el.dataset.ready = '';
    el.classList.add('is-live');
    const stage = el.querySelector('.ab-btw__stage');
    const copy = el.querySelector('.ab-btw__copy');
    // The window starts just under the text, however many lines the title takes in this language and size.
    const fit = () => {
      const top = copy.offsetTop + copy.offsetHeight + Math.max(20, stage.clientHeight * 0.035);
      const t0 = Math.min(top, stage.clientHeight * 0.62);
      el.style.setProperty('--t0', `${t0}px`);
      // At rest the window shows the lower part of the frame; the photo is moved down so her face sits in it.
      el.style.setProperty('--shift', `${t0 * (stage.clientWidth < 750 ? 0.52 : 0.42)}px`);
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(stage);
    document.fonts?.ready.then(fit);
    let raf = 0, last = -1;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - stage.clientHeight - (parseFloat(getComputedStyle(stage).top) || 0);
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      const e = ease(p / 0.9);
      if (Math.abs(e - last) < 0.0005) return;
      last = e;
      // First the window widens (the suns part), then its top lifts behind the title. The title fades out while the
      // edge passes under it and comes back light on the evening sky, so it is never dark on the photo.
      const kx = 1 - ease(e / 0.6), kt = 1 - ease((e - 0.45) / 0.55);
      const co = e < 0.45 ? 1 : e < 0.62 ? 1 - (e - 0.45) / 0.17 : e < 0.8 ? 0 : (e - 0.8) / 0.2;
      el.style.setProperty('--e', e.toFixed(4));
      el.style.setProperty('--kx', kx.toFixed(4));
      el.style.setProperty('--kt', kt.toFixed(4));
      el.style.setProperty('--co', co.toFixed(3));
      el.toggleAttribute('data-dark', e >= 0.7);
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('resize', queue);
    update();
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
