/* Signature 3 · One day, four steps.
   Pins the stage and maps scroll to a position 0..n-1 with a rest on each step,
   so every bottle holds the centre long enough to read and buy. Motion-allowed browsers only;
   otherwise the section stays a plain list. */
class DayLine extends HTMLElement {
  connectedCallback() {
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.steps = [...this.querySelectorAll('.dayline__step')];
    this.skies = [...this.querySelectorAll('.dayline__sky')];
    this.dots = [...this.querySelectorAll('[data-go]')];
    this.sun = this.querySelector('.dayline__sun');
    this.n = this.steps.length;
    if (this.n < 2) return;
    this.dots.forEach((d) => d.addEventListener('click', () => this.go(Number(d.dataset.go))));
    // Keyboard: tabbing into a step brings it to the centre.
    this.addEventListener('focusin', (e) => {
      const step = e.target.closest('.dayline__step');
      if (step && this.pinned && !step.classList.contains('is-active')) this.go(Number(step.dataset.index), true);
    });
    this.reduce.addEventListener('change', () => this.setup());
    this.setup();
  }

  setup() {
    this.pinned = !this.reduce.matches;
    this.classList.toggle('is-pinned', this.pinned);
    this.closest('.dayline')?.classList.toggle('is-pinned', this.pinned);
    if (!this.pinned) {
      this.steps.forEach((s) => { s.classList.add('is-active'); s.style.cssText = `--i: ${s.dataset.index}`; });
      window.removeEventListener('scroll', this.onScroll);
      return;
    }
    this.onScroll = this.onScroll || (() => { if (!this.ticking) { this.ticking = true; requestAnimationFrame(() => this.render()); } });
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    this.render();
  }

  progress() {
    const r = this.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  // Raw progress → position with a plateau on every step (smoothstep across the middle of each segment).
  position(p) {
    const raw = p * (this.n - 1);
    const i = Math.min(this.n - 2, Math.floor(raw));
    const f = raw - i;
    const t = Math.min(1, Math.max(0, (f - 0.28) / 0.44));
    return i + t * t * (3 - 2 * t);
  }

  render() {
    this.ticking = false;
    const p = this.progress();
    const pos = this.position(p);
    const active = Math.round(pos);
    this.style.setProperty('--p', p.toFixed(4));
    this.steps.forEach((s, i) => {
      const o = i - pos;
      s.style.setProperty('--o', o.toFixed(4));
      s.style.setProperty('--a', Math.min(2, Math.abs(o)).toFixed(4));
      const on = i === active;
      if (s.classList.contains('is-active') !== on) s.classList.toggle('is-active', on);
    });
    this.skies.forEach((k, i) => k.style.setProperty('--a', Math.min(1, Math.abs(i - pos)).toFixed(4)));
    this.dots.forEach((d, i) => d.setAttribute('aria-current', i === active ? 'step' : 'false'));
    if (this.sun) {
      // The sun rides a half-ellipse from the start edge to the end edge of the arc.
      const rtl = document.documentElement.dir === 'rtl';
      const a = Math.PI * (1 - p);
      const x = 50 + 50 * Math.cos(a) * (rtl ? -1 : 1);
      const y = 100 - 100 * Math.sin(a);
      this.sun.style.left = `${x}%`;
      this.sun.style.top = `${y}%`;
    }
  }

  go(index, instant) {
    const r = this.getBoundingClientRect();
    const run = r.height - window.innerHeight;
    const top = window.scrollY + r.top + (run * index) / (this.n - 1);
    window.scrollTo({ top, behavior: instant || this.reduce.matches ? 'instant' : 'smooth' });
  }
}
if (!customElements.get('day-line')) customElements.define('day-line', DayLine);
