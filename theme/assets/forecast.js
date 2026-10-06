/* Signature 2 · Today's Skin Forecast
   The visitor states today's conditions; the ambient light re-tints, the routine re-orders emphasis,
   and one button adds exactly the steps they keep. No external weather data, no invented numbers. */
const ORDER = ['sun', 'city', 'humidity', 'ac', 'heat'];

class SkinForecast extends HTMLElement {
  connectedCallback() {
    this.format = this.dataset.moneyFormat;
    this.keySteps = JSON.parse(this.dataset.keySteps || '{}');
    this.active = [];
    this.time = new Date().getHours() < 15 ? 'am' : 'pm';
    this.steps = [...this.querySelectorAll('.forecast__step')];
    this.chips = [...this.querySelectorAll('[data-condition]')];
    this.timeBtns = [...this.querySelectorAll('[data-time-btn]')];
    this.total = this.querySelector('[data-total]');
    this.routineTitle = this.querySelector('[data-routine-title]');
    this.count = this.querySelector('[data-routine-count]');
    this.readout = this.querySelector('[data-readout]');
    this.cta = this.querySelector('[data-forecast-cta]');
    this.strings = {
      am: this.routineTitle?.dataset.am,
      pm: this.routineTitle?.dataset.pm,
    };

    this.chips.forEach((chip) => chip.addEventListener('click', () => this.toggle(chip.dataset.condition)));
    this.timeBtns.forEach((btn) => btn.addEventListener('click', () => this.setTime(btn.dataset.timeBtn)));
    this.querySelector('[role="radiogroup"]')?.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) return;
      e.preventDefault();
      this.setTime(this.time === 'am' ? 'pm' : 'am');
      this.timeBtns.find((b) => b.dataset.timeBtn === this.time)?.focus();
    });
    this.steps.forEach((step) => step.querySelector('[data-include]')?.addEventListener('change', () => {
      step.dataset.userSet = 'true';
      this.render();
    }));

    // Override the add form so only included steps are added.
    const pf = this.querySelector('[data-forecast-form]');
    if (pf) pf.itemsOverride = () => this.included().map((s) => ({ id: Number(s.dataset.variant), quantity: 1 }));

    this.setTime(this.time, true);
  }

  toggle(condition) {
    const i = this.active.indexOf(condition);
    if (i > -1) this.active.splice(i, 1); else this.active.unshift(condition);
    this.render();
  }

  setTime(time, initial = false) {
    this.time = time;
    this.dataset.time = time;
    this.timeBtns.forEach((b) => {
      const on = b.dataset.timeBtn === time;
      b.setAttribute('aria-checked', String(on));
      b.tabIndex = on ? 0 : -1;
    });
    // Reset automatic inclusion when time changes (SPF is a morning step per the label).
    this.steps.forEach((s) => {
      if (s.dataset.userSet === 'true' && !initial) return;
      const box = s.querySelector('[data-include]');
      if (box) box.checked = time === 'am' || s.dataset.pm === 'true';
    });
    this.render();
  }

  included() {
    return this.steps.filter((s) => {
      const box = s.querySelector('[data-include]');
      return (box ? box.checked : true) && s.dataset.available !== 'false';
    });
  }

  render() {
    ORDER.forEach((c) => { this.dataset[c] = String(this.active.includes(c)); });
    this.chips.forEach((chip) => chip.setAttribute('aria-pressed', String(this.active.includes(chip.dataset.condition))));

    const key = new Set(this.active.flatMap((c) => this.keySteps[c] || []));
    this.steps.forEach((s) => {
      const step = Number(s.dataset.step);
      const reasonEl = s.querySelector('[data-reason]');
      const cond = this.active.find((c) => s.dataset[`reason${c[0].toUpperCase()}${c.slice(1)}`]);
      const reason = cond ? s.dataset[`reason${cond[0].toUpperCase()}${cond.slice(1)}`] : s.dataset.reasonDefault;
      if (reasonEl && reason) reasonEl.textContent = reason;
      const isKey = key.has(step);
      s.classList.toggle('is-key', isKey);
      const badge = s.querySelector('[data-key]');
      if (badge) badge.hidden = !isKey;
      const box = s.querySelector('[data-include]');
      s.classList.toggle('is-excluded', box ? !box.checked : false);
      const note = s.querySelector('[data-pm-note]');
      if (note) note.hidden = !(this.time === 'pm' && s.dataset.pm === 'false');
    });

    const chosen = this.included();
    const sum = chosen.reduce((acc, s) => acc + Number(s.dataset.price || 0), 0);
    if (this.total) this.total.textContent = window.BTS?.formatMoney ? window.BTS.formatMoney(sum, this.format) : '';
    if (this.cta) {
      const zero = chosen.some((s) => Number(s.dataset.price) === 0) && this.dataset.zeroSoon === 'true';
      this.cta.disabled = chosen.length === 0 || zero;
    }
    if (this.routineTitle) this.routineTitle.textContent = this.time === 'am' ? this.routineTitle.dataset.am : this.routineTitle.dataset.pm;
    if (this.count) this.count.textContent = (this.count.dataset.template || '').replace('__COUNT__', chosen.length);
    if (this.readout) {
      this.readout.textContent = this.active.length
        ? this.active.map((c) => `${this.readout.dataset[c] || c.toUpperCase()} ↑`).join('   ')
        : this.readout.dataset.empty || '';
    }
  }
}
if (!customElements.get('skin-forecast')) customElements.define('skin-forecast', SkinForecast);
