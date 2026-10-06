/* ==========================================================================
   BETWEEN TWO SUNS — theme.js (core, ES module, no dependencies)
   Progressive enhancement: every feature here has a working no-JS fallback.
   ========================================================================== */

const BTS = (window.BTS = window.BTS || {});
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ---------- Utilities ---------- */
export function formatMoney(cents, format) {
  const fmt = format || BTS.moneyFormat || '{{amount}}';
  const value = Number(cents) / 100;
  const fixed = (n, d, ts = ',', ds = '.') => {
    const parts = n.toFixed(d).split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ts);
    return parts.join(ds);
  };
  return fmt.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
    switch (key) {
      case 'amount_no_decimals': return fixed(value, 0);
      case 'amount_with_comma_separator': return fixed(value, 2, '.', ',');
      case 'amount_no_decimals_with_comma_separator': return fixed(value, 0, '.', ',');
      case 'amount_with_apostrophe_separator': return fixed(value, 2, "'", '.');
      default: return fixed(value, 2);
    }
  });
}
BTS.formatMoney = formatMoney;

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
      const current = $('[data-cart-root]');
      if (next && current) current.replaceWith(next);
      const count = Number(doc.querySelector('[data-cart-root]')?.dataset.count || 0);
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
    const error = this.querySelector('[data-form-error]');
    if (error) { error.hidden = true; error.textContent = ''; }
    button.classList.add('is-loading');
    button.setAttribute('aria-busy', 'true');
    try {
      await Cart.add(items);
      announce(BTS.strings?.added || 'Added');
      openDialog('CartDrawer', document.getElementById('CartToggle'));
      this.dispatchEvent(new CustomEvent('cart:added', { bubbles: true, detail: { items } }));
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
    $('[data-cart-root]')?.classList.remove('is-updating');
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
  if (input) changeLine(Number(input.dataset.lineQty), Math.max(0, Number(input.value)), input.closest('[data-cart-root]'));
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
      const value = chip.getAttribute('aria-pressed') === 'true' ? '' : chip.dataset.concern;
      this.apply(value, true);
    }));
  }
  apply(value, push) {
    this.chips.forEach((chip) => chip.setAttribute('aria-pressed', String(chip.dataset.concern === value || (!value && chip.dataset.concern === ''))));
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
