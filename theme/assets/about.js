// About (DECISIONS 193): the two-suns sky (scroll runs one day, 06:00 to 06:00) and the morning/night counter.

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

// Sky colour by hours after 06:00 (0–24): day, golden hour, dusk, night, then the next dawn.
const STOPS = [[0, '#f8ede3'], [3, '#f5f1ea'], [8, '#f3eee4'], [10.5, '#f7dfc8'], [12.5, '#eebca8'], [13.6, '#8a6f86'], [14.6, '#3a3858'], [16, '#24283f'], [21, '#22263d'], [22.4, '#5d5272'], [23.2, '#e9c9bd'], [24, '#f8ede3']];
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const RGB = STOPS.map(([t, c]) => [t, hex(c)]);
const skyAt = (t) => {
  let i = 1;
  while (i < RGB.length - 1 && t > RGB[i][0]) i++;
  const [t0, a] = RGB[i - 1], [t1, b] = RGB[i];
  const k = Math.min(1, Math.max(0, (t - t0) / (t1 - t0 || 1)));
  return a.map((v, j) => Math.round(v + (b[j] - v) * k));
};
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// A module runs once per page however many sections load it; the editor's section reloads call init again.
const init = (root) => {
  root.querySelectorAll('[data-ab-sky]:not(.is-live)').forEach((el) => {
    if (reduce.matches) return;
    const beats = [...el.querySelectorAll('.ab-sky__beat')];
    const moments = [...el.querySelectorAll('.ab-sky__moment')];
    el.classList.add('is-live');
    let raf = 0, last = -1;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const run = r.height - innerHeight;
      const p = run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
      if (Math.abs(p - last) < 0.0005) return;
      last = p;
      const t = p * 24;
      const c = skyAt(t), L = lum(c);
      el.style.setProperty('--p', p.toFixed(4));
      el.style.setProperty('--sky', `rgb(${c.join(',')})`);
      el.style.setProperty('--night', ease((0.62 - L) / 0.4).toFixed(3));
      // Today's sun goes down through the afternoon; tomorrow's comes up with the dawn.
      el.style.setProperty('--a', ease((t - 6) / 7.5).toFixed(4));
      el.style.setProperty('--b', (1 - ease((t - 19.5) / 4.5)).toFixed(4));
      el.toggleAttribute('data-dark', L < 0.45);
      const beat = p < 0.16 ? 0 : p < 0.5 ? 1 : p < 0.84 ? 2 : 3;
      beats.forEach((b, i) => b.classList.toggle('is-on', i === beat));
      moments.forEach((m) => m.classList.toggle('is-on', t >= Number(m.dataset.at)));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  });

  root.querySelectorAll('[data-ab-rt]:not([data-ready])').forEach((sec) => {
    sec.dataset.ready = '';
    const btns = [...sec.querySelectorAll('.ab-rt__mode')];
    const photos = [...sec.querySelectorAll('.ab-rt__photo')];
    const set = (mode, focus) => {
      sec.dataset.mode = mode;
      btns.forEach((b) => {
        const on = b.dataset.mode === mode;
        b.setAttribute('aria-checked', on);
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
      });
      photos.forEach((ph) => { if (ph.dataset.photo === mode) ph.removeAttribute('aria-hidden'); else ph.setAttribute('aria-hidden', 'true'); });
    };
    btns.forEach((b) => {
      b.addEventListener('click', () => set(b.dataset.mode));
      b.addEventListener('keydown', (e) => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
        e.preventDefault();
        set(sec.dataset.mode === 'am' ? 'pm' : 'am', true);
      });
    });
    // Warm the night photo once the section is near, so the first switch doesn't wait on the network.
    const pm = sec.querySelector('.ab-rt__photo[data-photo="pm"] img');
    if (pm && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((es) => { if (es.some((x) => x.isIntersecting)) { pm.loading = 'eager'; io.disconnect(); } }, { rootMargin: '400px' });
      io.observe(sec);
    }
  });
};
init(document);
document.addEventListener('shopify:section:load', (e) => init(e.target));
