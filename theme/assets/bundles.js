/* Build your routine: tap bottles onto the shelf; total, saving and CTA update live.
   Savings come from data-t2/t3/t4 (Theme settings → Offers), which mirror real Shopify discounts. */
class RoutineBuilder extends HTMLElement {
  connectedCallback() {
    this.choices = [...this.querySelectorAll('.builder__choice')];
    this.slots = Object.fromEntries([...this.querySelectorAll('[data-slot]')].map((el) => [el.dataset.slot, el]));
    this.stage = this.querySelector('[data-stage]');
    this.countEl = this.querySelector('[data-count]');
    this.offerEl = this.querySelector('[data-offer]');
    this.cta = this.querySelector('[data-cta]');
    this.totalEl = this.querySelector('[data-total]');
    this.totalSep = this.querySelector('[data-total-sep]');
    this.wasEl = this.querySelector('[data-was]');
    this.meter = [...this.querySelectorAll('.builder__meter li')];
    this.tiers = { 2: +this.dataset.t2 || 0, 3: +this.dataset.t3 || 0, 4: +this.dataset.t4 || 0 };
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.selected = new Set();

    this.choices.forEach((btn) => btn.addEventListener('click', () => this.toggle(btn.dataset.step)));
    this.querySelectorAll('[data-preset]').forEach((chip) => chip.addEventListener('click', () => {
      const want = new Set(chip.dataset.preset.split(','));
      this.choices.forEach((b) => { if (!b.disabled && want.has(b.dataset.step) !== this.selected.has(b.dataset.step)) this.toggle(b.dataset.step, true); });
      this.update();
    }));
    // Tapping a bottle on the shelf toggles it too.
    Object.values(this.slots).forEach((slot) => slot.addEventListener('click', () => {
      const btn = this.choices.find((b) => b.dataset.step === slot.dataset.slot);
      if (btn && !btn.disabled) this.toggle(slot.dataset.slot);
    }));

    const form = this.querySelector('product-form');
    if (form) form.itemsOverride = () => this.chosen().map((b) => ({ id: Number(b.dataset.id), quantity: 1 }));
    this.update();
  }

  chosen() { return this.choices.filter((b) => this.selected.has(b.dataset.step)); }

  pct(n) {
    if (n >= 4 && this.tiers[4]) return this.tiers[4];
    if (n >= 3 && this.tiers[3]) return this.tiers[3];
    if (n >= 2 && this.tiers[2]) return this.tiers[2];
    return 0;
  }

  toggle(step, silent) {
    const btn = this.choices.find((b) => b.dataset.step === step);
    const slot = this.slots[step];
    const on = !this.selected.has(step);
    if (on) this.selected.add(step); else this.selected.delete(step);
    btn?.setAttribute('aria-pressed', String(on));
    if (slot) {
      slot.classList.toggle('is-in', on);
      if (on && !this.reduce.matches) {
        slot.classList.remove('is-landing');
        void slot.offsetWidth; // restart the landing animation
        slot.classList.add('is-landing');
      }
    }
    if (!silent) {
      const key = on ? 'strAdded' : 'strRemoved';
      window.BTS?.announce?.((this.dataset[key] || '').replace('__X__', btn?.dataset.title || ''));
      this.update();
    }
  }

  update() {
    const items = this.chosen();
    const n = items.length;
    const sum = items.reduce((t, b) => t + Number(b.dataset.price || 0), 0);
    const unpriced = items.some((b) => Number(b.dataset.price) === 0) && this.dataset.comingSoon === 'true';
    const pct = this.pct(n);
    const fmt = (c) => (window.BTS?.formatMoney ? window.BTS.formatMoney(c, this.dataset.money) : String(c / 100));

    this.stage.style.setProperty('--fill', String(n / 4));
    this.meter.forEach((li) => li.classList.toggle('is-on', this.selected.has(li.dataset.step)));
    this.countEl.textContent = n ? (this.dataset.strCount || '').replace('__N__', n) : this.dataset.strEmpty;

    // Next saving (or the one reached), only if tiers exist.
    let next = null;
    for (let k = n + 1; k <= 4; k++) { const p = this.pct(k); if (p > pct) { next = { need: k - n, p }; break; } }
    let offer = '';
    if (next && n < 4) offer = (this.dataset.strNext || '').replace('__N__', next.need).replace('__P__', next.p);
    else if (pct) offer = (this.dataset.strSaving || '').replace('__P__', pct);
    this.offerEl.hidden = !offer;
    this.offerEl.textContent = offer;

    this.cta.disabled = n === 0 || unpriced;
    const show = n > 0 && !unpriced;
    this.totalSep.hidden = !show;
    this.totalEl.textContent = show ? fmt(pct ? Math.round((sum * (100 - pct)) / 100) : sum) : '';
    this.wasEl.hidden = !(show && pct);
    this.wasEl.textContent = show && pct ? fmt(sum) : '';
  }
}
if (!customElements.get('routine-builder')) customElements.define('routine-builder', RoutineBuilder);
