/* Product page demo (v2): "choose how to buy", the live free-delivery line, a looping gallery and its thumbnails. */

const ar = () => (document.documentElement.lang || '').startsWith('ar');
const rtl = () => document.documentElement.dir === 'rtl';
const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// Same as snippets/egp.liquid: whole pounds, rounded down, "EGP 1,349" / "1,349 ج.م".
const egp = (cents) => {
  const n = Math.floor(Math.max(0, cents) / 100).toLocaleString('en-US');
  return ar() ? `${n} ج.م` : `EGP ${n}`;
};

function initBuy(box) {
  const form = box.querySelector('product-form form');
  if (!form) return;
  const idInput = form.querySelector('[data-variant-id]');
  const label = box.querySelector('[data-v2-atc-label]');
  const options = [...box.querySelectorAll('.v2-opt__input')];
  const stickyName = document.querySelector('[data-v2-sticky-name]');
  const stickyPrice = document.querySelector('[data-v2-sticky-price]');
  const ship = box.querySelector('[data-v2-ship]');
  const threshold = Number(box.dataset.threshold || 0);
  let cartTotal = Number(box.dataset.cartTotal || 0);
  // the button reads "Add to bag · EGP 499": swap only the price part when the option changes
  const labelTpl = label ? label.textContent.trim() : '';
  const firstPrice = options[0]?.dataset.priceLabel || '';

  const selected = () => options.find((o) => o.checked) || null;
  const price = () => Number(selected()?.dataset.price ?? box.dataset.price ?? 0);

  function updateShip() {
    if (!ship || !threshold) return;
    const after = cartTotal + price();
    const left = threshold - after;
    const text = ship.querySelector('[data-v2-ship-text]');
    const meter = ship.querySelector('[data-v2-meter]');
    ship.classList.toggle('is-done', left <= 0);
    if (text) text.textContent = left <= 0 ? ship.dataset.done : ship.dataset.leftTpl.replace('__A__', egp(left));
    if (meter) meter.style.setProperty('--v', `${Math.min(100, Math.round((after / threshold) * 100))}%`);
  }

  function render() {
    const opt = selected();
    if (opt) {
      idInput.value = opt.value;
      if (label && firstPrice) label.textContent = labelTpl.replace(firstPrice, opt.dataset.priceLabel);
      if (stickyName) stickyName.textContent = opt.dataset.name;
      if (stickyPrice) stickyPrice.textContent = opt.dataset.priceLabel;
    }
    updateShip();
  }

  options.forEach((o) => o.addEventListener('change', render));
  // after anything is added the bag total changes: refresh the distance to free delivery
  document.addEventListener('cart:added', async () => {
    try {
      const res = await fetch(`${BTS.routes.cart}.js`, { headers: { Accept: 'application/json' } });
      cartTotal = Number((await res.json()).total_price || 0);
      updateShip();
    } catch (e) { /* keep the last known total */ }
  });
  render();
}

/* The gallery loops: past the last photo (swipe, arrow or arrow key) it starts again at the first, and back
   from the first goes to the last. A short fade covers the jump. Thumbnails follow the current photo. */
function initGallery(gallery) {
  const track = gallery.querySelector('[data-track]');
  const slides = [...gallery.querySelectorAll('[data-slide]')];
  const thumbs = [...gallery.querySelectorAll('[data-thumb]')];
  const strip = gallery.querySelector('.v2-thumbs');
  if (!track || slides.length < 2) return;
  const last = slides.length - 1;
  const prev = gallery.querySelector('[data-prev]');
  const next = gallery.querySelector('[data-next]');

  const mark = (i) => {
    thumbs.forEach((t, k) => (k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
    const t = thumbs[i];
    if (t && strip) {
      const s = strip.getBoundingClientRect(), r = t.getBoundingClientRect();
      if (r.left < s.left || r.right > s.right) strip.scrollBy({ left: r.left - (s.left + s.width / 2 - r.width / 2) });
    }
  };
  const orig = gallery.setActive?.bind(gallery);
  gallery.setActive = (i) => {
    orig?.(i);
    // with a loop there is no dead end: both arrows always work
    if (prev) prev.disabled = false;
    if (next) next.disabled = false;
    mark(i);
  };

  let wrapping = false;
  function wrapTo(i) {
    if (wrapping) return;
    wrapping = true;
    const jump = () => {
      const t = track.getBoundingClientRect(), r = slides[i].getBoundingClientRect();
      track.scrollBy({ left: r.left - t.left, behavior: 'instant' });
      gallery.setActive(i);
    };
    if (reduce()) { jump(); wrapping = false; return; }
    track.classList.add('is-wrapping');
    setTimeout(() => {
      jump();
      requestAnimationFrame(() => { track.classList.remove('is-wrapping'); setTimeout(() => { wrapping = false; }, 180); });
    }, 160);
  }
  const at = () => gallery.index ?? 0;

  // arrows (capture on the gallery runs before the stock handlers on the buttons)
  gallery.addEventListener('click', (e) => {
    const b = e.target.closest('[data-next], [data-prev]');
    if (!b) return;
    if (b.matches('[data-next]') && at() === last) { e.stopPropagation(); wrapTo(0); }
    else if (b.matches('[data-prev]') && at() === 0) { e.stopPropagation(); wrapTo(last); }
  }, true);
  // keyboard on the track
  track.addEventListener('keydown', (e) => {
    const fwd = e.key === (rtl() ? 'ArrowLeft' : 'ArrowRight');
    const back = e.key === (rtl() ? 'ArrowRight' : 'ArrowLeft');
    if (fwd && at() === last) { e.preventDefault(); e.stopImmediatePropagation(); wrapTo(0); }
    else if (back && at() === 0) { e.preventDefault(); e.stopImmediatePropagation(); wrapTo(last); }
  }, true);
  // swipes past either end
  let startX = null, startI = 0;
  track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; startI = at(); }, { passive: true });
  track.addEventListener('touchend', (e) => {
    if (startX == null) return;
    const dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    const forward = rtl() ? dx > 0 : dx < 0;
    if (forward && startI === last && at() === last) wrapTo(0);
    else if (!forward && startI === 0 && at() === 0) wrapTo(last);
  }, { passive: true });

  thumbs.forEach((t) => t.addEventListener('click', () => gallery.go?.(Number(t.dataset.thumb))));
  gallery.setActive(at());
}

document.querySelectorAll('[data-v2-buy]').forEach(initBuy);
customElements.whenDefined('media-gallery').then(() => {
  document.querySelectorAll('.pdp--v2 media-gallery').forEach(initGallery);
});
