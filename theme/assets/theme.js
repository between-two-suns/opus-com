/* ==========================================================================
   BETWEEN TWO SUNS — theme.js (core, ES module, no dependencies)
   Progressive enhancement: every feature here has a working no-JS fallback.
   ========================================================================== */

const BTS = (window.BTS = window.BTS || {});
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Utilities ---------- */
// Prices the BTS way (Pricing & Offers spec): whole pounds, rounded down, "EGP 1,349" / "1,349 ج.م".
// Mirrors snippets/egp.liquid; the store money format is intentionally not used.
export function formatMoney(cents) {
  const pounds = Math.floor(Number(cents || 0) / 100);
  const num = String(pounds).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (document.documentElement.lang || '').startsWith('ar') ? `${num} ج.م` : `EGP ${num}`;
}
BTS.formatMoney = formatMoney;
// A selection of routine steps that is exactly one of the fixed-price bundles → that bundle (or null).
// One line for a matched bundle: "Your picks make The Night Ritual · Save EGP 48 vs buying separately".
BTS.bundleNote = (b) => {
  if (!b) return '';
  const st = BTS.strings || {};
  const parts = [(st.bundleMatch || '').replace('__X__', b.name)];
  if (b.compare > b.price) parts.push((st.saveVs || '').replace('__A__', formatMoney(b.compare - b.price)));
  return parts.join(' · ');
};
BTS.matchBundle = (steps) => {
  const key = [...steps].map(String).sort().join(',');
  return (BTS.bundles || []).find((b) => b.available && b.steps.split(',').sort().join(',') === key) || null;
};

export function announce(message) {
  const region = document.getElementById('a11y-status');
  if (!region) return;
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}
BTS.announce = announce;

function toast(message) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<p class="toast__msg" role="status"></p>';
    document.body.append(el);
  }
  el.firstElementChild.textContent = message;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 3200);
}

const debounce = (fn, wait = 250) => {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
};

/* ---------- Dialogs (menu, search, cart) ---------- */
function openDialog(id, trigger) {
  const dialog = document.getElementById(id);
  if (!dialog || typeof dialog.showModal !== 'function') return false;
  if (!dialog.open) {
    $$('dialog[open]').forEach((d) => d !== dialog && d.close());
    dialog.showModal();
    document.documentElement.classList.add('has-open-dialog');
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
      dialog._trigger = trigger;
    }
    dialog.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true }));
  }
  return true;
}
BTS.openDialog = openDialog;

document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open-dialog]');
  if (opener) {
    if (openDialog(opener.dataset.openDialog, opener)) event.preventDefault();
    return;
  }
  const closer = event.target.closest('[data-close-dialog]');
  if (closer) {
    closer.closest('dialog')?.close();
    return;
  }
  // Backdrop click closes
  if (event.target instanceof HTMLDialogElement && event.target.open) {
    const r = event.target.getBoundingClientRect();
    const inside = event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
    if (!inside) event.target.close();
  }
});

document.addEventListener('close', (event) => {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  dialog._trigger?.setAttribute('aria-expanded', 'false');
  if (!$('dialog[open]')) document.documentElement.classList.remove('has-open-dialog');
}, true);

/* Bag sheet (phones): its grab handle works. Pull down from the top of the sheet, or from the top of the list when it's
   scrolled to the start, and let go past 90px to close (DECISIONS 263). */
(() => {
  const phone = window.matchMedia('(max-width: 749px)');
  let sheet = null, y0 = null, d = 0;
  document.addEventListener('touchstart', (e) => {
    sheet = e.target.closest?.('#CartDrawer[open]');
    if (!sheet || !phone.matches) { sheet = null; return; }
    const body = sheet.querySelector('.drawer__body');
    const fromHead = !!e.target.closest('.drawer__head');
    const fromTop = body?.contains(e.target) && body.scrollTop <= 0 && !e.target.closest('.cart-upsell > .cart-lines, quantity-input');
    if (!fromHead && !fromTop) { sheet = null; return; }
    y0 = e.touches[0].clientY; d = 0;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!sheet || y0 == null) return;
    d = Math.max(0, e.touches[0].clientY - y0);
    sheet.style.transition = 'none';
    sheet.style.transform = d ? `translateY(${d}px)` : '';
  }, { passive: true });
  const end = () => {
    if (!sheet || y0 == null) return;
    const s = sheet;
    s.style.transition = ''; s.style.transform = '';
    if (d > 90) s.close();
    sheet = null; y0 = null; d = 0;
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
})();

/* ---------- Header ---------- */
class SiteHeader extends HTMLElement {
  connectedCallback() {
    this.header = this.querySelector('[data-header]');
    this.toggle = this.querySelector('[data-mega-toggle]');
    this.panel = this.querySelector('[data-mega]');
    const onScroll = () => this.header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    if (this.toggle && this.panel) {
      // A hover may already have opened it: a click right after must not close it again.
      this.toggle.addEventListener('click', () => {
        if (!this.panel.hidden && Date.now() - (this.openedAt || 0) < 800) return;
        this.setMega(this.panel.hidden);
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.panel.hidden) { this.setMega(false); this.toggle.focus(); }
      });
      document.addEventListener('click', (e) => { if (!this.contains(e.target)) this.setMega(false); });
      this.panel.addEventListener('focusout', (e) => {
        if (!this.panel.contains(e.relatedTarget) && e.relatedTarget !== this.toggle) this.setMega(false);
      });
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        let t;
        const li = this.toggle.closest('li');
        li.addEventListener('mouseenter', () => { clearTimeout(t); t = setTimeout(() => this.setMega(true), 120); });
        this.header.addEventListener('mouseleave', () => { clearTimeout(t); t = setTimeout(() => this.setMega(false), 220); });
        this.panel.addEventListener('mouseenter', () => clearTimeout(t));
        this.panel.addEventListener('mouseleave', () => { clearTimeout(t); t = setTimeout(() => this.setMega(false), 220); });
      }
    }
  }
  setMega(open) {
    if (!this.panel) return;
    if (open && this.panel.hidden) this.openedAt = Date.now();
    this.panel.hidden = !open;
    this.toggle.setAttribute('aria-expanded', String(open));
  }
}
customElements.define('site-header', SiteHeader);

/* ---------- Cart ---------- */
const Cart = {
  sections: ['cart-drawer'],
  async request(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ ...body, sections: Cart.sections.join(','), sections_url: window.location.pathname }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.status) {
      const err = new Error(data.description || data.message || BTS.strings?.error || 'Error');
      err.data = data;
      throw err;
    }
    return data;
  },
  render(sections) {
    if (!sections) return;
    if (Cart.holdRender) { const wait = Cart.holdRender; Cart.holdRender = null; return wait.then(() => Cart.render(sections)); }
    const html = sections['cart-drawer'];
    if (html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const next = doc.querySelector('[data-cart-root]');
      const current = $('#CartDrawer [data-cart-root]');
      const count = Number(next?.dataset.count || 0);
      // Keep keyboard focus inside the open bag across the re-render (same control if it still exists).
      const drawer = document.getElementById('CartDrawer');
      const had = drawer?.contains(document.activeElement) ? document.activeElement : null;
      const key = had && (had.dataset.lineRemove ? `[data-line-remove="${had.dataset.lineRemove}"]` : had.id ? `#${CSS.escape(had.id)}` : null);
      if (next && current) current.replaceWith(next);
      if (drawer?.open && !drawer.contains(document.activeElement)) {
        const target = (key && drawer.querySelector(key)) || drawer.querySelector('[data-close-dialog]');
        target?.focus({ preventScroll: true });
      }
      Cart.updateCount(count);
    }
  },
  updateCount(count) {
    // while a pack is flying the number waits, and rolls over when it lands (rollCount)
    if (Cart.holdCount) { Cart.pendingCount = count; return; }
    $$('[data-cart-count]').forEach((el) => {
      el.dataset.count = count;
      el.textContent = count > 0 ? count : '';
    });
    const label = BTS.strings?.cartCount;
    $$('[data-cart-label]').forEach((el) => {
      if (label) el.textContent = label.replace(/\{\{\s*count\s*\}\}/, count);
    });
  },
  async add(items) {
    const data = await Cart.request(BTS.routes.cartAdd + '.js', { items });
    await Cart.render(data.sections);
    // Spec limits: 5 per single, 3 per bundle. Trim any line the add pushed over, and say why.
    for (const it of data.items || []) {
      const max = it.product_type === 'Bundle' ? 3 : 5;
      if (it.quantity > max) {
        const fixed = await Cart.request(BTS.routes.cartChange + '.js', { id: it.key, quantity: max });
        Cart.render(fixed.sections);
        toast((BTS.strings?.qtyLimit || '').replace('__N__', max));
      }
    }
    return data;
  },
  async change(line, quantity) {
    const data = await Cart.request(BTS.routes.cartChange + '.js', { line, quantity });
    Cart.render(data.sections);
    return data;
  },
};
BTS.Cart = Cart;

function formToItems(form) {
  const fd = new FormData(form);
  const ids = fd.getAll('items[][id]');
  if (ids.length) {
    const qtys = fd.getAll('items[][quantity]');
    return ids.map((id, i) => ({ id: Number(id), quantity: Number(qtys[i] || 1) }));
  }
  const item = { id: Number(fd.get('id')), quantity: Number(fd.get('quantity') || 1) };
  const props = {};
  for (const [k, v] of fd.entries()) {
    const m = k.match(/^properties\[(.+)\]$/);
    if (m && v) props[m[1]] = v;
  }
  if (Object.keys(props).length) item.properties = props;
  if (fd.get('selling_plan')) item.selling_plan = fd.get('selling_plan');
  return [item];
}


/* ---------- Add to bag: one continuous moment ----------
   Tap → the button answers at once (press + a fill from the tap point, no spinner) and the request goes out in
   parallel. The pack itself lifts off its photo and is thrown into the bag on a real arc; the bag catches it
   (squash, ring in the pack colour, the brand's two arcs close around it) and the count rolls to the new number.
   Then a small card confirms it in place of the full bag: the routine step that just lit up, the free-delivery
   bar filling from where it was, the next step one tap away, and View bag / Check out. Nothing here is a timer,
   a stock claim or any other pressure; the card says only what is true of this bag. */
const isShown = (el) => !!el && (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0);
function visibleBag() {
  return $$('[data-bag-target], #CartToggle').find(isShown) || document.getElementById('CartToggle');
}
const inView = (el) => { const r = el?.getBoundingClientRect(); return !!r && r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function sourceImage(form, button) {
  const sticky = !!button?.closest('sticky-atc');
  const scope = sticky ? null : form.closest('.dayline__step, .card, .bundle, .cart-upsell__item, routine-builder, .cs, .added');
  const candidates = [
    scope?.querySelector('.dayline__bottle img, .card__media img, .bundle__packs img, .builder__slot.is-in img, .cs__bottle.is-key img, .cart-upsell__img img'),
    // on a product page the big pack on the stage is the one that flies, whichever button was tapped
    $('.gallery__slide--studio .gallery__cutout'),
    $('.sticky-atc.is-visible .sticky-atc__thumb img'),
    $('.pdp__gallery img'),
  ];
  return candidates.find((el) => el && inView(el) && (el.currentSrc || el.src));
}
// how much of an element is on screen (0–1)
function shownShare(el) {
  const r = el.getBoundingClientRect();
  const w = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
  const h = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
  return r.width && r.height ? (w * h) / (r.width * r.height) : 0;
}
// the pack picture to throw and where it leaves from: its photo when that is mostly in view, otherwise it rises out of the button
function launch(form, button) {
  const img = sourceImage(form, button) || $('.gallery__slide--studio .gallery__cutout, .pdp__gallery img');
  if (!img || !(img.currentSrc || img.src)) return null;
  if (shownShare(img) >= 0.5) return { src: img.currentSrc || img.src, rect: img.getBoundingClientRect(), ratio: img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0 };
  const b = button.getBoundingClientRect();
  const ir = img.getBoundingClientRect();
  const ratio = ir.width && ir.height ? ir.width / ir.height : 0.6;
  const h = Math.min(120, Math.max(72, b.height * 2));
  return { src: img.currentSrc || img.src, rect: { left: b.left + b.width / 2 - (h * ratio) / 2, top: b.top + b.height / 2 - h / 2, width: h * ratio, height: h }, fromButton: true };
}

/* The throw: x glides, y rises then falls (separate easings on nested layers make a true arc). */
function flyToBag(src, bag) {
  const a = src.rect;
  const b = bag.getBoundingClientRect();
  const h = Math.min(a.height, 220);
  const w = (a.width / a.height) * h;
  const sx = a.left + a.width / 2, sy = a.top + a.height / 2;
  const tx = b.left + b.width / 2, ty = b.top + b.height / 2;
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.hypot(dx, dy);
  const lift = 150;
  const dur = Math.round(Math.min(860, Math.max(560, 420 + dist * 0.35)));
  const arc = Math.min(160, 70 + Math.abs(dx) * 0.12);
  const end = Math.max(0.1, 30 / h);
  const outer = document.createElement('div');
  outer.className = 'fly';
  outer.setAttribute('aria-hidden', 'true');
  outer.style.cssText = `left:${sx - w / 2}px;top:${sy - h / 2}px;width:${w}px;height:${h}px`;
  outer.innerHTML = `<div class="fly__in${src.fromButton ? ' fly__in--pop' : ''}"><img src="${src.src}" alt=""></div>`;
  document.body.appendChild(outer);
  const inner = outer.firstElementChild;
  const total = lift + dur;
  const k = lift / total;
  const peakY = Math.min(0, dy) - arc;
  const spin = dx > 0 ? 14 : -14;
  outer.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }],
    { duration: dur, delay: lift, easing: 'cubic-bezier(.4, 0, .6, 1)', fill: 'both' });
  const anim = inner.animate([
    { transform: 'translateY(0) scale(1) rotate(0deg)', opacity: 1, easing: 'cubic-bezier(.3, .6, .5, 1)' },
    { transform: `translateY(-10px) scale(1.07) rotate(${-spin * 0.25}deg)`, opacity: 1, offset: k, easing: 'cubic-bezier(.42, .12, .32, 1)' },
    { transform: `translateY(${peakY}px) scale(${(1 + end) / 2}) rotate(${spin * 0.5}deg)`, opacity: 1, offset: k + (1 - k) * 0.42, easing: 'cubic-bezier(.55, 0, .85, .35)' },
    { transform: `translateY(${dy * 0.96}px) scale(${end * 1.15}) rotate(${spin}deg)`, opacity: 1, offset: 0.93 },
    { transform: `translateY(${dy}px) scale(${end}) rotate(${spin}deg)`, opacity: 0 },
  ], { duration: total, fill: 'forwards' });
  return new Promise((resolve) => {
    let settled = false;
    const done = () => { if (settled) return; settled = true; outer.remove(); resolve(); };
    anim.onfinish = done;
    anim.oncancel = done;
    setTimeout(done, total + 120);
  });
}

/* The catch: the bag gives a little, a ring in the pack colour opens, the two arcs close around it. */
function catchInBag(bag, tint, mark = true) {
  if (!bag) return;
  const icon = bag.querySelector('svg') || bag;
  icon.animate?.([
    { transform: 'scale(1, 1)' }, { transform: 'scale(1.18, .82) translateY(2px)', offset: 0.22 },
    { transform: 'scale(.92, 1.1) translateY(-2px)', offset: 0.5 }, { transform: 'scale(1.03, .98)', offset: 0.75 }, { transform: 'scale(1, 1)' },
  ], { duration: 560, easing: 'ease-out' });
  const r = bag.getBoundingClientRect();
  const ring = document.createElement('span');
  ring.className = 'bag-ring';
  ring.setAttribute('aria-hidden', 'true');
  ring.style.cssText = `left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;${tint ? `--ring:${tint}` : ''}`;
  document.body.appendChild(ring);
  ring.animate([{ transform: 'translate(-50%, -50%) scale(.4)', opacity: 0.9 }, { transform: 'translate(-50%, -50%) scale(2.6)', opacity: 0 }],
    { duration: 700, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => ring.remove();
  if (mark) closeMark(r);
}

/* A routine is several bottles: each one is thrown in turn, from wherever it is on the page
   (its own row or slot, the set's photo, or out of the button), and the bag catches each in its colour. */
const packFor = (step) => (BTS.packs || []).find((p) => String(p.step) === String(step));
function stepsFor(items) {
  const out = [];
  for (const it of items) {
    const id = Number(it.id);
    const bundle = (BTS.bundles || []).find((x) => Number(x.id) === id);
    if (bundle) out.push(...String(bundle.steps).split(/[^0-9]+/).filter(Boolean));
    else { const p = (BTS.packs || []).find((x) => Number(x.variant) === id); if (p) out.push(String(p.step)); }
  }
  return [...new Set(out)].sort();
}
function routineSources(form, button, steps) {
  const scope = form.closest('skin-forecast, routine-builder, .forecast, .builder, .bundle, .pdp, section') || document.body;
  const photo = [...scope.querySelectorAll('.bundle__stage img, .gallery__slide img, .pdp__gallery img')].find((el) => shownShare(el) >= 0.5);
  const n = steps.length;
  return steps.map((step, i) => {
    const pack = packFor(step);
    const own = scope.querySelector(`[data-slot="${step}"] img, .forecast__step[data-step="${step}"] img, li[data-step="${step}"] img`);
    const src = pack?.img || own?.currentSrc || own?.src;
    if (!src) return null;
    const tint = `var(--c-step-${step})`;
    if (own && shownShare(own) >= 0.5) return { src, rect: own.getBoundingClientRect(), tint };
    if (photo) {
      const r = photo.getBoundingClientRect();
      const h = Math.min(220, r.height * 0.55), w = h * 0.36;
      const cx = r.left + (r.width * (i + 0.5)) / n;
      return { src, rect: { left: cx - w / 2, top: r.top + r.height * 0.3, width: w, height: h }, tint };
    }
    const b = button.getBoundingClientRect();
    const h = Math.min(110, Math.max(72, b.height * 2)), w = h * 0.36;
    const cx = b.left + (b.width * (i + 0.5)) / n;
    return { src, rect: { left: cx - w / 2, top: b.top + b.height / 2 - h / 2, width: w, height: h }, tint, fromButton: true };
  }).filter(Boolean);
}
function throwRoutine(sources, bag) {
  // every bottle leaves from somewhere you can see
  sources.forEach((src) => {
    const r = src.rect, top = Math.min(Math.max(r.top, 8), innerHeight - r.height - 8);
    src.rect = { left: r.left, top, width: r.width, height: r.height };
  });
  return Promise.all(sources.map((src, i) => new Promise((r) => setTimeout(r, i * 110))
    .then(() => flyToBag(src, bag))
    .then(() => { if (i < sources.length - 1) catchInBag(bag, src.tint, false); })));
}
function closeMark(rect) {
  const tpl = document.getElementById('BtsMark');
  if (!tpl) return;
  const mark = document.createElement('div');
  mark.className = 'bag-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.appendChild(tpl.content.cloneNode(true));
  mark.style.transform = `translate(${rect.left + rect.width / 2 - 23}px, ${rect.top + rect.height / 2 - 25}px)`;
  document.body.appendChild(mark);
  const [right, left] = mark.querySelectorAll('path');
  const opts = { duration: 620, easing: 'cubic-bezier(.3, 1.3, .5, 1)', fill: 'forwards' };
  right?.animate([{ transform: 'translateX(80%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1, offset: 0.6 }, { transform: 'translateX(-6%)', opacity: 0 }], opts);
  const last = left?.animate([{ transform: 'translateX(-80%)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1, offset: 0.6 }, { transform: 'translateX(6%)', opacity: 0 }], opts);
  if (last) last.onfinish = () => mark.remove(); else mark.remove();
}

/* The count rolls to its new number (old slides up and out, new slides in). */
function rollCount(count) {
  $$('[data-cart-count]').forEach((el) => {
    const from = Number(el.dataset.count || 0);
    el.dataset.count = count;
    if (reduceMotion() || from === count || !isShown(el.closest('a, button') || el)) { el.textContent = count > 0 ? count : ''; return; }
    el.innerHTML = `<span class="roll"><span>${from || ''}</span><span>${count || ''}</span></span>`;
    el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump');
    setTimeout(() => { if (el.dataset.count == String(count)) el.textContent = count > 0 ? count : ''; }, 560);
  });
}

/* The button's own moment: a fill from the tap point while the bag updates, then "✓ Added". */
function pressFrom(button, event) {
  const r = button.getBoundingClientRect();
  const x = event?.clientX ? event.clientX - r.left : r.width / 2;
  const y = event?.clientY ? event.clientY - r.top : r.height / 2;
  button.style.setProperty('--px', `${x}px`);
  button.style.setProperty('--py', `${y}px`);
  button.classList.remove('is-added');
  button.classList.add('is-adding');
}
function celebrate(button) {
  if (!button) return;
  button.classList.remove('is-adding');
  if (!button.classList.contains('btn')) return;
  button.classList.remove('is-added');
  void button.offsetWidth;
  button.classList.add('is-added');
  button.closest('.sticky-atc')?.classList.add('is-added');
  clearTimeout(button._addedT);
  button._addedT = setTimeout(() => { button.classList.remove('is-added'); button.closest('.sticky-atc')?.classList.remove('is-added'); }, 1800);
}

/* The confirmation card. It is rebuilt from the freshly rendered bag, so every figure on it is the bag's own. */
const AddedCard = {
  el: null, timer: 0,
  build() {
    if (this.el) return this.el;
    const s = BTS.strings || {};
    const el = document.createElement('div');
    el.className = 'added';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', s.added || 'Added to your bag');
    el.hidden = true;
    el.innerHTML = `
      <div class="added__card">
        <div class="added__head">
          <span class="added__thumb" data-thumb></span>
          <div class="added__titles">
            <p class="added__eyebrow"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12.5l4.2 4.2L19 7" pathLength="1"/></svg><span>${s.added || 'Added to your bag'}</span></p>
            <p class="added__name" data-name></p>
          </div>
          <button type="button" class="added__close" data-added-close aria-label="${s.close || 'Close'}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
        <div class="added__routine" data-routine></div>
        <div class="added__ship" data-ship></div>
        <div class="added__next" data-next></div>
        <div class="added__ctas">
          <button type="button" class="btn btn--secondary btn--small" data-added-bag></button>
          <form action="${BTS.routes.cart}" method="post"><button type="submit" name="checkout" class="btn btn--small">${s.checkout || 'Check out'}</button></form>
        </div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => {
      if (e.target.closest('[data-added-close]')) this.hide();
      if (e.target.closest('[data-added-bag]')) { this.hide(true); openDialog('CartDrawer', visibleBag()); }
    });
    el.addEventListener('pointerenter', () => this.pause());
    el.addEventListener('pointerleave', () => this.arm());
    el.addEventListener('focusin', () => this.pause());
    el.addEventListener('focusout', (e) => { if (!el.contains(e.relatedTarget)) this.arm(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !el.hidden) this.hide(); });
    // swipe down to dismiss (phones)
    let y0 = null;
    el.addEventListener('touchstart', (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchmove', (e) => { if (y0 == null) return; const d = e.touches[0].clientY - y0; if (d > 0) el.firstElementChild.style.transform = `translateY(${d}px)`; }, { passive: true });
    el.addEventListener('touchend', (e) => { const d = (e.changedTouches[0]?.clientY || 0) - (y0 ?? 0); el.firstElementChild.style.transform = ''; y0 = null; if (d > 60) this.hide(); });
    this.el = el;
    return el;
  },
  show({ name, thumb, tint, before, packs }) {
    const el = this.build();
    const root = $('#CartDrawer [data-cart-root]');
    if (!root) return;
    const s = BTS.strings || {};
    el.querySelector('[data-name]').textContent = name || '';
    const th = el.querySelector('[data-thumb]');
    th.style.setProperty('--sku', tint || 'var(--c-paper)');
    th.classList.toggle('is-stack', !!packs?.length);
    th.style.setProperty('--n', packs?.length || 1);
    th.innerHTML = packs?.length
      ? packs.map((p, i) => `<img src="${p.src}" alt="" style="--i:${i};--c:${p.tint}">`).join('')
      : (thumb ? `<img src="${thumb}" alt="">` : '');
    // routine: the bag's own four steps; the one this add lit up fills in
    const routine = root.querySelector('.cart-routine');
    const rSlot = el.querySelector('[data-routine]');
    rSlot.replaceChildren(...(routine ? [routine.cloneNode(true)] : []));
    let k = 0;
    rSlot.querySelectorAll('.cart-progress span.is-on').forEach((sp) => { if (!before.steps.includes(sp.dataset.step)) { sp.classList.add('is-new'); sp.style.setProperty('--k', k++); } });
    // the whole routine is in the bag for the first time: say so, and let the bar glow across
    const complete = rSlot.querySelectorAll('.cart-progress span.is-on').length === 4 && before.steps.length < 4;
    el.classList.toggle('is-complete', complete);
    el.querySelector('.added__eyebrow span').textContent = complete ? (s.routineComplete || s.added) : (s.added || 'Added to your bag');
    // free delivery: the bar fills from where it was
    const ship = root.querySelector('.incentive--ship');
    const sSlot = el.querySelector('[data-ship]');
    sSlot.replaceChildren(...(ship ? [ship.cloneNode(true)] : []));
    const bar = sSlot.querySelector('.incentive__meter span');
    if (bar) {
      const to = bar.style.getPropertyValue('--v');
      bar.style.setProperty('--v', before.ship || '0%');
      if (ship.classList.contains('is-done') && before.shipDone === false) sSlot.firstElementChild.classList.add('is-new');
      requestAnimationFrame(() => requestAnimationFrame(() => bar.style.setProperty('--v', to)));
    }
    // the next step of the routine, one tap away (the bag's own first suggestion)
    const next = root.querySelector('.cart-upsell__item');
    const nSlot = el.querySelector('[data-next]');
    nSlot.replaceChildren();
    if (next) {
      const label = document.createElement('p');
      label.className = 'added__next-label';
      label.textContent = s.completeRoutine || '';
      const list = document.createElement('ul');
      list.className = 'added__next-list';
      list.setAttribute('role', 'list');
      list.append(next.cloneNode(true));
      nSlot.append(label, list);
    }
    const count = Number(root.dataset.count || 0);
    el.querySelector('[data-added-bag]').textContent = `${s.viewCart || 'View bag'} (${count})`;
    if (el.hidden) {
      el.hidden = false;
      el.classList.remove('is-out');
      void el.offsetWidth;
      el.classList.add('is-in');
    } else {
      el.firstElementChild.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.015)' }, { transform: 'scale(1)' }], { duration: 360, easing: 'ease-out' });
    }
    this.arm();
  },
  arm() { clearTimeout(this.timer); this.timer = setTimeout(() => this.hide(), 6000); },
  pause() { clearTimeout(this.timer); },
  hide(instant) {
    const el = this.el;
    if (!el || el.hidden) return;
    clearTimeout(this.timer);
    if (instant || reduceMotion()) { el.hidden = true; el.classList.remove('is-in', 'is-out'); return; }
    el.classList.remove('is-in');
    el.classList.add('is-out');
    setTimeout(() => { if (el.classList.contains('is-out')) { el.hidden = true; el.classList.remove('is-out'); } }, 320);
  },
};
document.addEventListener('dialog:open', (e) => { if (e.target.id === 'CartDrawer') AddedCard.hide(true); });

/* What the bag looked like just before this add (so the card can show what changed). */
function bagBefore() {
  const root = $('#CartDrawer [data-cart-root]');
  return {
    steps: [...(root?.querySelectorAll('.cart-progress span.is-on') || [])].map((sp) => sp.dataset.step),
    ship: root?.querySelector('.incentive--ship .incentive__meter span')?.style.getPropertyValue('--v') || '0%',
    shipDone: !!root?.querySelector('.incentive--ship.is-done'),
    count: Number(root?.dataset.count || $('[data-cart-count]')?.dataset.count || 0),
  };
}

class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
  }
  async onSubmit(event) {
    event.preventDefault();
    const button = event.submitter || this.form.querySelector('[type="submit"]');
    if (!button || button.disabled || this._busy) return;
    const items = this.itemsOverride ? this.itemsOverride() : formToItems(this.form);
    if (!items.length) return;
    // Adds from inside the full bag (its routine cards) stay in the bag: no flight, no card.
    const fromDialog = !!this.closest('dialog');
    const error = this.querySelector('[data-form-error]');
    if (error) { error.hidden = true; error.textContent = ''; }
    this._busy = true;
    button.setAttribute('aria-busy', 'true');
    pressFrom(button, Cart.lastPointer);
    const before = bagBefore();
    const steps = stepsFor(items);
    const routine = steps.length > 1;
    const packs = !fromDialog && routine ? routineSources(this, button, steps) : [];
    const src = fromDialog || routine ? null : launch(this, button);
    const bag = fromDialog ? null : visibleBag();
    const tint = getComputedStyle(this.closest('[data-step]') || this).getPropertyValue('--sku').trim();
    const thumb = src ? src.src : '';
    const name = this.closest('[data-product-title]')?.dataset.productTitle || '';
    // the throw starts with the tap; the request runs alongside it
    Cart.holdCount = !fromDialog;
    const flight = !bag || reduceMotion() ? Promise.resolve() : packs.length ? throwRoutine(packs, bag) : src ? flyToBag(src, bag) : Promise.resolve();
    // the bag's contents refresh after the landing, so nothing re-lays out the page mid-flight
    Cart.holdRender = flight;
    try {
      const data = await Cart.add(items);
      await flight;
      if (!fromDialog) catchInBag(bag, packs.length ? packs[packs.length - 1].tint : tint);
      Cart.holdCount = false;
      rollCount(Cart.pendingCount ?? before.count);
      Cart.pendingCount = null;
      celebrate(button);
      announce(BTS.strings?.added || 'Added');
      this.dispatchEvent(new CustomEvent('cart:added', { bubbles: true, detail: { items } }));
      // on the bag page itself the page simply refreshes to show the new line and the lit step
      if (!fromDialog && document.body.classList.contains('template-cart')) { setTimeout(() => window.location.reload(), 350); return; }
      if (!fromDialog) {
        const want = Number(items[0]?.id);
        const line = (data?.items || []).find((it) => Number(it.variant_id ?? it.id) === want) || data?.items?.[0];
        const bundle = (BTS.bundles || []).find((x) => Number(x.id) === want);
        // sets use the theme's own (translated) set names; a routine picked step by step is "3 steps of your routine"
        const label = bundle ? bundle.name : routine ? (BTS.strings?.addedSteps || '').replace('__N__', steps.length) : '';
        const stack = routine ? steps.map((st) => ({ src: packFor(st)?.img, tint: `var(--c-step-${st})` })).filter((p) => p.src) : null;
        AddedCard.show({ name: label || line?.product_title || name, thumb: thumb || line?.image, tint, before, packs: stack });
      }
    } catch (err) {
      await flight;
      Cart.holdRender = null;
      Cart.holdCount = false;
      if (Cart.pendingCount != null) { rollCount(Cart.pendingCount); Cart.pendingCount = null; }
      button.classList.remove('is-adding');
      button.animate?.([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 360 });
      const msg = err.message || BTS.strings?.error;
      if (error) { error.textContent = msg; error.hidden = false; } else { toast(msg); }
      announce(msg);
    } finally {
      Cart.holdRender = null;
      this._busy = false;
      button.removeAttribute('aria-busy');
    }
  }
}
customElements.define('product-form', ProductForm);
// where the last tap landed, so the button's fill starts under the finger
document.addEventListener('pointerdown', (e) => { Cart.lastPointer = { clientX: e.clientX, clientY: e.clientY }; }, true);
document.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') Cart.lastPointer = null; }, true);

/* Cart drawer + cart page line controls (delegated so re-renders keep working) */
const changeLine = debounce(async (line, qty, root) => {
  root?.classList.add('is-updating');
  try {
    const data = await Cart.change(line, qty);
    announce((BTS.strings?.cartCount || '').replace(/\{\{\s*count\s*\}\}/, data.item_count));
    if (document.body.classList.contains('template-cart')) window.location.reload();
  } catch (err) {
    toast(err.message);
  } finally {
    $$('[data-cart-root]').forEach((r) => r.classList.remove('is-updating'));
  }
}, 280);

document.addEventListener('click', (event) => {
  const remove = event.target.closest('[data-line-remove]');
  if (remove) {
    event.preventDefault();
    changeLine(Number(remove.dataset.lineRemove), 0, remove.closest('[data-cart-root]'));
  }
});

document.addEventListener('change', (event) => {
  const input = event.target.closest('[data-line-qty]');
  if (!input) return;
  // Spec limits: 5 per single product, 3 per bundle (the input's max).
  const max = input.max ? Number(input.max) : Infinity;
  let qty = Math.max(0, Number(input.value));
  if (qty > max) { qty = max; input.value = max; toast((BTS.strings?.qtyLimit || '').replace('__N__', max)); }
  changeLine(Number(input.dataset.lineQty), qty, input.closest('[data-cart-root]'));
});

// Bag: upgrade a set in one tap (a duo to The Clear & Protect Trio, a three-step set to The Full Ritual): remove the line, add the bigger set.
document.addEventListener('click', async (event) => {
  const btn = event.target.closest('[data-upgrade-line]');
  if (!btn) return;
  event.preventDefault();
  const root = btn.closest('[data-cart-root]');
  root?.classList.add('is-updating');
  btn.classList.add('is-loading');
  try {
    await fetch(BTS.routes.cartChange + '.js', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ id: btn.dataset.upgradeLine, quantity: 0 }) });
    await Cart.add([{ id: Number(btn.dataset.upgradeTo), quantity: 1 }]);
    announce(BTS.strings?.added || 'Added');
    if (document.body.classList.contains('template-cart')) window.location.reload();
  } catch (err) {
    toast(err.message);
  } finally {
    $$('[data-cart-root]').forEach((r) => r.classList.remove('is-updating'));
  }
});

/* ---------- Quantity stepper ---------- */
class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-step]');
      if (!btn) return;
      e.preventDefault();
      const min = Number(this.input.min || 0);
      const max = this.input.max ? Number(this.input.max) : Infinity;
      const next = Math.min(max, Math.max(min, Number(this.input.value || 0) + Number(btn.dataset.step)));
      if (next !== Number(this.input.value)) {
        this.input.value = next;
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
}
customElements.define('quantity-input', QuantityInput);

/* ---------- Predictive search ---------- */
class PredictiveSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input[type="search"]');
    this.results = this.querySelector('[data-results]');
    this.suggestions = this.querySelector('[data-suggestions]');
    this.url = this.dataset.url;
    this.controller = null;
    this.input.addEventListener('input', debounce(() => this.search(), 220));
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); this.closest('dialog')?.close(); }
    });
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        const first = this.results.querySelector('a');
        if (first) { e.preventDefault(); first.focus(); }
      }
    });
    this.results.addEventListener('keydown', (e) => {
      const links = [...this.results.querySelectorAll('a')];
      const i = links.indexOf(document.activeElement);
      if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); links[Math.min(links.length - 1, i + 1)].focus(); }
      if (e.key === 'ArrowUp' && i > -1) { e.preventDefault(); (i === 0 ? this.input : links[i - 1]).focus(); }
    });
    this.closest('dialog')?.addEventListener('dialog:open', () => setTimeout(() => this.input.focus(), 50));
  }
  async search() {
    const q = this.input.value.trim();
    if (!q) {
      this.results.innerHTML = '';
      this.suggestions.hidden = false;
      this.input.setAttribute('aria-expanded', 'false');
      return;
    }
    this.controller?.abort();
    this.controller = new AbortController();
    try {
      const params = new URLSearchParams({ q, section_id: 'predictive-search', 'resources[type]': 'product,article,page', 'resources[limit]': '6' });
      const res = await fetch(`${this.url}?${params}`, { signal: this.controller.signal });
      if (!res.ok) throw new Error(res.status);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const inner = doc.querySelector('[data-predictive]');
      this.results.innerHTML = inner ? inner.outerHTML : '';
      this.suggestions.hidden = true;
      this.input.setAttribute('aria-expanded', 'true');
    } catch (err) {
      if (err.name !== 'AbortError') this.results.innerHTML = '';
    }
  }
}
customElements.define('predictive-search', PredictiveSearch);

/* ---------- Concern filter (collection) ---------- */
class ConcernFilter extends HTMLElement {
  connectedCallback() {
    this.chips = $$('[data-concern]', this);
    this.grid = document.getElementById(this.dataset.grid);
    this.status = this.querySelector('[data-filter-status]');
    const initial = new URLSearchParams(location.search).get('concern') || '';
    this.apply(initial, false);
    this.chips.forEach((chip) => chip.addEventListener('click', (e) => {
      e.preventDefault();
      const value = chip.getAttribute('aria-current') === 'true' ? '' : chip.dataset.concern;
      this.apply(value, true);
    }));
  }
  apply(value, push) {
    this.chips.forEach((chip) => chip.setAttribute('aria-current', String(chip.dataset.concern === value || (!value && chip.dataset.concern === ''))));
    let shown = 0;
    $$('[data-concerns]', this.grid).forEach((card) => {
      const li = card.closest('li') || card;
      const match = !value || card.dataset.concerns.split(' ').includes(value);
      li.hidden = !match;
      if (match) shown++;
    });
    if (this.status) this.status.textContent = this.status.dataset.template.replace('__COUNT__', shown);
    if (push) {
      const url = new URL(location.href);
      value ? url.searchParams.set('concern', value) : url.searchParams.delete('concern');
      history.replaceState({}, '', url);
    }
  }
}
customElements.define('concern-filter', ConcernFilter);

/* ---------- Product morph between pages (cross-document View Transitions) ----------
   The PDP's studio cutout is always named `pack-hero`; here we give the same name to the
   bottle the visitor actually tapped, just before navigation, so only that one morphs. */
if ('onpageswap' in window) {
  const clear = () => $$('[data-vt]').forEach((el) => { el.style.viewTransitionName = ''; el.removeAttribute('data-vt'); });
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="/products/"]');
    if (!link || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const scope = link.closest('.card, .hero__product, .routine-strip__item, .menu-tile, .forecast__step') || link;
    const img = scope.querySelector('img');
    clear();
    if (img) { img.style.viewTransitionName = 'pack-hero'; img.setAttribute('data-vt', ''); }
  }, true);
  window.addEventListener('pageshow', clear);
}



/* Step-to-step reveal on product pages (cross-document view transitions; no-op where unsupported). */
document.addEventListener('click', (e) => {
  const t = e.target.closest?.('.pdp-tabs__link');
  if (!t || t.getAttribute('aria-current') === 'page') return;
  const r = t.getBoundingClientRect();
  try { sessionStorage.setItem('bts:vt', JSON.stringify({ x: r.left + r.width / 2, y: r.top + r.height / 2, t: Date.now() })); } catch (err) {}
});
window.addEventListener('pagereveal', (e) => {
  if (!e.viewTransition) return;
  let d = null;
  try { d = JSON.parse(sessionStorage.getItem('bts:vt') || 'null'); sessionStorage.removeItem('bts:vt'); } catch (err) {}
  if (!d || Date.now() - d.t > 5000) return;
  const root = document.documentElement;
  root.style.setProperty('--vt-x', `${d.x}px`);
  root.style.setProperty('--vt-y', `${d.y}px`);
  root.classList.add('vt-step');
  e.viewTransition.finished.finally(() => root.classList.remove('vt-step'));
});
