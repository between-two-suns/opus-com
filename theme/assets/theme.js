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
// One line for a matched bundle: "Your picks make The Day Ritual · Save EGP 48 vs buying separately".
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
      this.toggle.addEventListener('click', () => this.setMega(this.panel.hidden));
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
      }
    }
  }
  setMega(open) {
    if (!this.panel) return;
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
    Cart.render(data.sections);
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


/* ---------- Add to bag: the bottle flies into the bag, and the brand mark closes around it ---------- */
const isShown = (el) => !!el && (el.checkVisibility ? el.checkVisibility() : el.getClientRects().length > 0);
function visibleBag() {
  return $$('[data-bag-target], #CartToggle').find(isShown) || document.getElementById('CartToggle');
}
const inView = (el) => { const r = el?.getBoundingClientRect(); return !!r && r.width > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
function sourceImage(form, button) {
  const scope = (button?.closest('sticky-atc') ? null : form.closest('.dayline__step, .card, .bundle, .cart-upsell__item, routine-builder, .cs'));
  const candidates = [
    scope?.querySelector('.dayline__bottle img, .card__media img, .bundle__packs img, .builder__slot.is-in img, .cs__bottle.is-key img'),
    $('.sticky-atc.is-visible .sticky-atc__thumb img'),
    $('.gallery__slide--studio img, .gallery__cutout, .pdp__gallery img'),
  ];
  return candidates.find((el) => el && inView(el));
}
function flyToBag(form, button) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const img = sourceImage(form, button);
  const bag = visibleBag();
  if (reduce || !img || !bag) return Promise.resolve();
  const a = img.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  if (!a.width || !a.height) return Promise.resolve();
  const h = Math.min(a.height, 260);
  const w = (a.width / a.height) * h;
  const sx = a.left + a.width / 2 - w / 2;
  const sy = a.top + a.height / 2 - h / 2;
  const tx = b.left + b.width / 2 - w / 2;
  const ty = b.top + b.height / 2 - h / 2;
  const fly = document.createElement('div');
  fly.className = 'fly';
  fly.setAttribute('aria-hidden', 'true');
  fly.style.cssText = `width:${w}px;height:${h}px`;
  fly.innerHTML = `<img src="${img.currentSrc || img.src}" alt="">`;
  document.body.appendChild(fly);
  const mx = (sx + tx) / 2;
  const my = Math.min(sy, ty) - 90;
  const anim = fly.animate([
    { transform: `translate(${sx}px, ${sy}px) scale(1) rotate(0deg)`, opacity: 1 },
    { transform: `translate(${mx}px, ${my}px) scale(.55) rotate(-12deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${tx}px, ${ty}px) scale(.12) rotate(0deg)`, opacity: 0.4 },
  ], { duration: 680, easing: 'cubic-bezier(.55, 0, .3, 1)', fill: 'forwards' });
  return new Promise((resolve) => {
    const done = () => { fly.remove(); closeMark(b); resolve(); };
    anim.onfinish = done;
    anim.oncancel = done;
    setTimeout(resolve, 760);
  });
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

class ProductForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.form.addEventListener('submit', (e) => this.onSubmit(e));
  }
  async onSubmit(event) {
    event.preventDefault();
    const button = event.submitter || this.form.querySelector('[type="submit"]');
    if (!button || button.disabled || button.classList.contains('is-loading')) return;
    const items = this.itemsOverride ? this.itemsOverride() : formToItems(this.form);
    if (!items.length) return;
    // Decide now, while attached: adds from inside a dialog (the bag's routine cards) never fly or reopen it.
    const fromDialog = !!this.closest('dialog');
    const error = this.querySelector('[data-form-error]');
    if (error) { error.hidden = true; error.textContent = ''; }
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    try {
      await Cart.add(items);
      announce(BTS.strings?.added || 'Added');
      this.dispatchEvent(new CustomEvent('cart:added', { bubbles: true, detail: { items } }));
      if (!fromDialog) {
        await flyToBag(this, button);
        if (!$('dialog[open]')) openDialog('CartDrawer', visibleBag());
      }
    } catch (err) {
      const msg = err.message || BTS.strings?.error;
      if (error) { error.textContent = msg; error.hidden = false; } else { toast(msg); }
      announce(msg);
    } finally {
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
    }
  }
}
customElements.define('product-form', ProductForm);

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

// Bag: upgrade a duo to The Day Ritual (remove the duo line, add the ritual) in one tap.
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

/* ---------- Micro-interactions (fine pointers only, never with reduced motion) ---------- */
const fineMotion = window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (fineMotion) {
  // Bottles tilt toward the pointer inside product cards and bundle stages.
  document.addEventListener('pointermove', (e) => {
    const media = e.target.closest?.('.card__media, .bundle__stage, .gallery__slide--studio');
    if (!media) return;
    const r = media.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    media.style.setProperty('--tx', x.toFixed(3));
    media.style.setProperty('--ty', y.toFixed(3));
    media.classList.add('is-tilting');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const media = e.target.closest?.('.card__media, .bundle__stage, .gallery__slide--studio');
    if (media && !media.contains(e.relatedTarget)) { media.classList.remove('is-tilting'); media.style.removeProperty('--tx'); media.style.removeProperty('--ty'); }
  });
  // Primary calls to action lean toward the pointer a few pixels.
  document.addEventListener('pointermove', (e) => {
    const btn = e.target.closest?.('[data-magnetic]');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    btn.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 8}px ${((e.clientY - r.top) / r.height - 0.5) * 6}px`;
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const btn = e.target.closest?.('[data-magnetic]');
    if (btn && !btn.contains(e.relatedTarget)) btn.style.translate = '';
  });
}

// Add-to-bag confirmation on the button itself, and a bump on the bag icon.
document.addEventListener('cart:added', (e) => {
  const btn = e.target.querySelector?.('[type="submit"]');
  if (btn) { btn.classList.add('is-added'); setTimeout(() => btn.classList.remove('is-added'), 1800); }
  $$('[data-cart-count]').forEach((el) => { el.classList.remove('is-bump'); void el.offsetWidth; el.classList.add('is-bump'); });
});

/* ---------- Time of day: page tone follows the section in the middle of the screen ---------- */
{
  const toned = $$('[data-tone]');
  if (toned.length && 'IntersectionObserver' in window) {
    const root = document.documentElement;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const c = getComputedStyle(e.target).getPropertyValue('--tone-c').trim();
        if (c) root.style.setProperty('--tone', c);
      });
    }, { rootMargin: '-50% 0px -50% 0px' });
    toned.forEach((el) => io.observe(el));
  }
}

/* ---------- Sunlight cursor: a soft light follows the pointer under the content; products get a label ---------- */
if (fineMotion) {
  const wrap = document.createElement('div');
  wrap.className = 'cursor';
  wrap.setAttribute('aria-hidden', 'true');
  wrap.innerHTML = '<span class="cursor__light"></span>';
  const label = document.createElement('span');
  label.className = 'cursor__label';
  label.setAttribute('aria-hidden', 'true');
  document.body.append(wrap, label);
  const light = wrap.firstChild;
  const viewText = document.documentElement.dataset.viewLabel || '';
  const pos = { x: innerWidth / 2, y: innerHeight / 2, lx: innerWidth / 2, ly: innerHeight / 2, tx: 0, ty: 0 };
  let raf = 0;
  const loop = () => {
    pos.lx += (pos.tx - pos.lx) * 0.12; pos.ly += (pos.ty - pos.ly) * 0.12;
    pos.x += (pos.tx - pos.x) * 0.35; pos.y += (pos.ty - pos.y) * 0.35;
    light.style.transform = `translate3d(${pos.lx}px, ${pos.ly}px, 0)`;
    label.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    raf = Math.abs(pos.tx - pos.lx) + Math.abs(pos.ty - pos.ly) > 0.5 ? requestAnimationFrame(loop) : 0;
  };
  document.addEventListener('pointermove', (e) => {
    pos.tx = e.clientX; pos.ty = e.clientY;
    wrap.classList.add('is-on');
    const t = e.target.closest?.('[data-cursor], .card__media');
    const text = t ? (t.dataset.cursor || viewText) : '';
    if (text) label.textContent = text;
    label.classList.toggle('is-on', !!text);
    if (!raf) raf = requestAnimationFrame(loop);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { wrap.classList.remove('is-on'); label.classList.remove('is-on'); });
}
