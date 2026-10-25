// About (DECISIONS 193): the two-suns sky (scroll runs one day, 06:00 to 06:00).

const reduce = matchMedia('(prefers-reduced-motion: reduce)');

// Sky colour by hours after 06:00 (0–24), in the brand's colours: ivory day, lilac dusk, ink night, mint dawn, ending on
// the page's own colour so the next section follows without a seam.
const PAGE = ((v) => (/^#[0-9a-f]{6}/i.test(v) ? v.slice(0, 7) : '#f5f1ea'))(getComputedStyle(document.documentElement).getPropertyValue('--c-daylight').trim());
const STOPS = [[0, '#f3f1ea'], [3, '#f5f1ea'], [8, '#f2efe9'], [10.5, '#efe7f0'], [12.3, '#e3d1e7'], [13.5, '#a48fb4'], [14.5, '#4f4a6e'], [16, '#24283f'], [21, '#22263d'], [22.3, '#3f5a66'], [23, '#cfe6df'], [23.6, '#e2eee7'], [24, PAGE]];
// What each part of the day is, for the clock (hours after 06:00 where each one starts).
const PARTS = [0, 2.5, 11, 15, 17, 23.5];
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
// The arc is drawn at its real size (not a stretched viewBox), so the trail's dashes match the dot exactly.
const fitArc = (svg) => {
  const w = Math.round(svg.clientWidth), h = Math.round(svg.clientHeight);
  if (!w || !h) return;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.querySelectorAll('path').forEach((pa) => pa.setAttribute('d', `M0 ${h} Q${w / 2} ${-h} ${w} ${h}`));
};

const init = (root) => {
  root.querySelectorAll('.ab-sky__arc').forEach((svg) => {
    fitArc(svg);
    if ('ResizeObserver' in window) new ResizeObserver(() => fitArc(svg)).observe(svg);
  });
  root.querySelectorAll('[data-ab-sky]:not([data-ready])').forEach((el) => {
    if (reduce.matches) return;
    el.dataset.ready = '';
    const beats = [...el.querySelectorAll('.ab-sky__beat')];
    const marks = [...el.querySelectorAll('.ab-sky__mark')];
    const trail = el.querySelector('.ab-sky__trail');
    const timeEl = el.querySelector('[data-time]'), nowEl = el.querySelector('[data-now]');
    const labels = [...(el.querySelector('template[data-labels]')?.content.children || [])].map((x) => x.textContent);
    let part = -1, shown = '0600';
    const digits = timeEl ? [...timeEl.children].filter((d) => !d.classList.contains('ab-sky__colon')) : [];
    const more = el.querySelector('.ab-sky__more');
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
      // Tomorrow's sun is felt before it is seen: its glow comes up under the horizon through the small hours.
      el.style.setProperty('--dawn', (ease((t - 16.5) / 5.5) * (1 - 0.55 * ease((t - 22.5) / 1.5))).toFixed(3));
      el.toggleAttribute('data-dark', L < 0.45);
      const beat = p < 0.16 ? 0 : p < 0.5 ? 1 : p < 0.84 ? 2 : 3;
      beats.forEach((b, i) => b.classList.toggle('is-on', i === beat));
      if (more) more.tabIndex = beat === 1 ? 0 : -1;
      marks.forEach((m) => m.classList.toggle('is-on', t >= Number(m.dataset.at)));
      if (trail) trail.style.strokeDashoffset = (1 - p).toFixed(4);
      // The clock counts in five-minute steps; its line changes with the part of the day.
      const mins = Math.round((t * 60) / 5) * 5, hh = (6 + Math.floor(mins / 60)) % 24, mm = mins % 60;
      const hhmm = String(hh).padStart(2, '0') + String(mm).padStart(2, '0');
      if (hhmm !== shown) {
        // Only the digits that change roll over.
        digits.forEach((d, i) => {
          if (hhmm[i] === shown[i]) return;
          d.textContent = hhmm[i];
          d.classList.remove('is-tick'); void d.offsetWidth; d.classList.add('is-tick');
        });
        shown = hhmm;
      }
      let k = 0;
      while (k < PARTS.length - 1 && t >= PARTS[k + 1]) k++;
      if (k !== part && nowEl && labels[k]) { part = k; nowEl.textContent = labels[k]; }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    update();
  });

};
init(document);
document.addEventListener('shopify:section:load', (e) => init(e.target));
