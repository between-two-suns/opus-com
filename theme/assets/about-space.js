// About hero, "the space between" (DECISIONS 319–325). The scroll story itself is native scroll-driven CSS (about.css),
// run by the browser on the compositor, so nothing here runs while scrolling. This only:
// - keeps --hdr equal to the real header height (the inline script sets it before first paint), and
// - tells each heading word which way to part (with the sun on its side), measured once and on resize.
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
    let t = 0;
    addEventListener('resize', () => { clearTimeout(t); t = setTimeout(fit, 120); });
    fit();
    document.fonts?.ready.then(fit);
  });
};

init(document);
document.addEventListener('shopify:section:load', (ev) => init(ev.target));
