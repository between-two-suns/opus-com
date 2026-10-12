/* Climate switch: pick a condition → the stage's light changes, the steps that matter lift,
   and the button adds exactly those steps (real prices, summed). */
const FX = { sun: 'sun', city: 'dust', humidity: 'humidity', ac: 'ac', heat: 'heat' }; // stage weather per condition

class ClimateSwitch extends HTMLElement {
  connectedCallback() {
    this.map = JSON.parse(this.dataset.keySteps || '{}');
    this.opts = [...this.querySelectorAll('.cs__opt')];
    this.lines = [...this.querySelectorAll('.cs__line')];
    this.keys = [...this.querySelectorAll('.cs__key')];
    this.bottles = [...this.querySelectorAll('.cs__bottle')];
    this.cta = this.querySelector('[data-cta]');
    this.ctaLabel = this.querySelector('[data-cta-label]');
    this.total = this.querySelector('[data-total]');
    this.opts.forEach((o) => o.addEventListener('click', () => this.set(o.dataset.c)));
    // Arrow keys move between options (one group, roving focus kept simple: all buttons stay tabbable).
    this.querySelector('.cs__switch')?.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      const i = this.opts.indexOf(document.activeElement);
      if (i < 0) return;
      const rtl = document.documentElement.dir === 'rtl';
      const step = (e.key === 'ArrowRight') !== rtl ? 1 : -1;
      const next = this.opts[(i + step + this.opts.length) % this.opts.length];
      next.focus(); this.set(next.dataset.c); e.preventDefault();
    });
    const form = this.querySelector('product-form');
    if (form) form.itemsOverride = () => this.chosen().map((k) => ({ id: Number(k.dataset.id), quantity: 1 }));
    this.set(this.opts[0]?.dataset.c || 'sun', true);
  }

  chosen() { return this.keys.filter((k) => !k.hidden && !k.hasAttribute('data-unavailable')); }

  set(c, initial) {
    this.current = c;
    this.dataset.active = FX[c] || c;
    const steps = new Set((this.map[c] || []).map(String));
    this.opts.forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.c === c)));
    this.lines.forEach((l) => { l.hidden = l.dataset.c !== c; });
    this.keys.forEach((k) => { k.hidden = !steps.has(k.dataset.step); });
    this.bottles.forEach((b) => b.classList.toggle('is-key', steps.has(b.dataset.step)));
    const items = this.chosen();
    const sum = items.reduce((t, k) => t + Number(k.dataset.price || 0), 0);
    const unpriced = this.dataset.comingSoon === 'true' && items.some((k) => Number(k.dataset.price) === 0);
    const fmt = (v) => (window.BTS?.formatMoney ? window.BTS.formatMoney(v, this.dataset.money) : String(v / 100));
    this.ctaLabel.textContent = (this.dataset.strCta || '').replace('__N__', items.length);
    this.total.textContent = unpriced ? '' : fmt(sum);
    this.cta.disabled = !items.length || unpriced;
    if (!initial) this.classList.remove('is-entered'), void this.offsetWidth, this.classList.add('is-entered');
  }
}
if (!customElements.get('climate-switch')) customElements.define('climate-switch', ClimateSwitch);
