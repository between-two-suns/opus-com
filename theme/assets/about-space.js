// About hero, "the space between" (DECISIONS 319–325). The scroll story itself is native scroll-driven CSS (about.css),
// run by the browser on the compositor, so nothing here runs while scrolling. This only:
// - keeps --hdr equal to the real header height (the inline script sets it before first paint), and
// - tells each heading word which way to part (with the sun on its side), measured once and on resize, and
// - in browsers without scroll-driven CSS only, sets the paused animations' position from the scroll (see below).
const init = (root) => {
  root.querySelectorAll('[data-ab-sp]:not([data-ready])').forEach((el) => {
    el.dataset.ready = '';
    const stage = el.querySelector('.ab-sp__stage');
    const words = [...el.querySelectorAll('.ab-sp__title .w')];
    const hdr = document.querySelector('.shopify-section:has(> .site-header-wrap)') || document.querySelector('.site-header-wrap');
    const fit = () => {
      if (hdr) el.style.setProperty('--hdr', `${hdr.offsetHeight}px`);
      const r = stage.getBoundingClientRect();
      words.forEach((w) => {
        const b = w.getBoundingClientRect();
        const dx = (b.left + b.width / 2 - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (b.top + b.height / 2 - (r.top + r.height / 2)) / (r.height / 2);
        w.style.setProperty('--wd', (Math.sign(dx || 1) * (0.6 + Math.abs(dx) * 0.6)).toFixed(3));
        w.style.setProperty('--wy', (dy * 0.25).toFixed(3));
      });
    };
    let t = 0, relayout = () => {};
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { fit(); relayout(); }, 120); });
    fit();
    document.fonts?.ready.then(fit);

    // Older browsers (no scroll-driven CSS): the same CSS animations sit paused (class is-js); each frame we only set
    // their position (Web Animations currentTime), which is cheap and keeps them in step with the scroll.
    if (!el.classList.contains('is-js')) return;
    const RANGE = { 'ab-sp-out': [0, 0.18], 'ab-sp-part': [0, 0.24], 'ab-sp-line': [0.5, 0.72] };
    const OWN = /^ab-sp-(img|wash|amber|dusk|a|b|halo|moon|orb|out|part|line)$/;
    let anims = [], top = 0, run = 1, raf = 0, last = -1;
    const collect = () => {
      anims = el.getAnimations({ subtree: true })
        .filter((a) => a.animationName && OWN.test(a.animationName))
        .map((a) => ({ a, r: RANGE[a.animationName] || [0, 1] }));
    };
    const measure = () => {
      top = el.getBoundingClientRect().top + scrollY;
      run = Math.max(1, (el.offsetHeight - stage.offsetHeight) * 0.92);
    };
    const frame = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, (scrollY - top) / run));
      if (Math.abs(p - last) < 0.0002) return;
      last = p;
      for (const { a, r } of anims) {
        const k = Math.min(1, Math.max(0, (p - r[0]) / (r[1] - r[0])));
        a.currentTime = k * 999.9;
      }
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(frame); };
    collect();
    measure();
    relayout = () => { measure(); last = -1; queue(); };
    addEventListener('scroll', queue, { passive: true });
    addEventListener('load', () => { collect(); measure(); last = -1; queue(); });
    frame();
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
