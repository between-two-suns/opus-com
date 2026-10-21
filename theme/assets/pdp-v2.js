/* Product page demo (v2): "choose how to buy", the live free-delivery line and the gallery thumbnails. */

const ar = () => (document.documentElement.lang || '').startsWith('ar');
// Same as snippets/egp.liquid: whole pounds, rounded down, "EGP 1,349" / "1,349 ج.م".
const egp = (cents) => {
  const n = Math.floor(Math.max(0, cents) / 100).toLocaleString('en-US');
  return ar() ? `${n} ج.م` : `EGP ${n}`;
};

function initBuy(box) {
  const form = box.querySelector('product-form form');
  if (!form) return;
  const idInput = form.querySelector('[data-variant-id]');
  const qty = form.querySelector('input[name="quantity"]');
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
  const maxSingle = qty?.max || '5';

  const selected = () => options.find((o) => o.checked) || null;
  const price = () => Number(selected()?.dataset.price ?? box.dataset.price ?? 0);

  function updateShip() {
    if (!ship || !threshold) return;
    const after = cartTotal + price() * Math.max(1, Number(qty?.value || 1));
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
      // sets are capped at 3 per order, like on their own pages
      if (qty) {
        qty.max = opt === options[0] ? maxSingle : '3';
        if (Number(qty.value) > Number(qty.max)) qty.value = qty.max;
      }
    }
    updateShip();
  }

  options.forEach((o) => o.addEventListener('change', render));
  qty?.addEventListener('change', updateShip);
  qty?.addEventListener('input', updateShip);
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

function initThumbs(gallery) {
  const thumbs = [...gallery.querySelectorAll('[data-thumb]')];
  if (!thumbs.length) return;
  const mark = (i) => thumbs.forEach((t, k) => (k === i ? t.setAttribute('aria-current', 'true') : t.removeAttribute('aria-current')));
  thumbs.forEach((t) => t.addEventListener('click', () => gallery.go?.(Number(t.dataset.thumb))));
  const orig = gallery.setActive?.bind(gallery);
  if (orig) gallery.setActive = (i) => { orig(i); mark(i); };
  mark(gallery.index || 0);
}

document.querySelectorAll('[data-v2-buy]').forEach(initBuy);
customElements.whenDefined('media-gallery').then(() => {
  document.querySelectorAll('.pdp--v2 media-gallery').forEach(initThumbs);
});
