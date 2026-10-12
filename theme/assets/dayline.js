/* Signature 3 · One day, four steps.
   CSS does the motion: one custom property, --pos (0..n-1), with a rest on every step.
   Where the browser supports scroll timelines, --pos comes straight from the scroll position in CSS.
   Elsewhere this file eases --pos toward the scroll target every frame.
   JS also keeps the active step / dots in sync and, when scrolling stops between two products,
   settles on the nearer one. Reduced motion or no JS: a plain list. */
const STOPS = [0, 0.35, 0.65, 1]; // scroll fractions where each of the 4 steps rests (mirrors @keyframes day-pos)

class DayLine extends HTMLElement {
  connectedCallback() {
    this.steps = [...this.querySelectorAll('.dayline__step')];
    this.dots = [...this.querySelectorAll('[data-go]')];
    this.n = this.steps.length;
    if (this.n < 2) return;
    this.dataset.n = String(this.n);
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.native = this.n === 4 && CSS.supports('animation-timeline: view()');
    this.pos = 0;
    this.active = -1;
    this.dots.forEach((d) => d.addEventListener('click', () => this.go(Number(d.dataset.go))));
    // Keyboard: tabbing into a step brings it to the centre.
    this.addEventListener('focusin', (e) => {
      const step = e.target.closest('.dayline__step');
      if (step && !this.reduce.matches && !step.classList.contains('is-active')) this.go(Number(step.dataset.index), true);
    });
    this.onScroll = () => { if (!this.raf) this.raf = requestAnimationFrame(this.frame); };
    this.frame = () => this.tick();
    this.onEnd = () => this.settle();
    this.reduce.addEventListener('change', () => this.setup());
    this.setup();
  }

  disconnectedCallback() { this.teardown(); }

  teardown() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onScroll);
    window.removeEventListener('scrollend', this.onEnd);
    cancelAnimationFrame(this.raf); this.raf = 0;
  }

  setup() {
    this.teardown();
    if (this.reduce.matches) {
      this.steps.forEach((s) => s.classList.add('is-active'));
      this.style.removeProperty('--pos');
      return;
    }
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onScroll, { passive: true });
    if ('onscrollend' in window) window.addEventListener('scrollend', this.onEnd);
    this.pos = this.target();
    this.tick();
  }

  run() {
    const r = this.getBoundingClientRect();
    return { r, run: r.height - window.innerHeight };
  }

  progress() {
    const { r, run } = this.run();
    return run > 0 ? Math.min(1, Math.max(0, -r.top / run)) : 0;
  }

  // Raw progress → routine position, resting on each stop (same shape as the CSS keyframes).
  target() {
    const p = this.progress();
    if (this.n === 4) {
      const holds = [[0, 0.12], [0.28, 0.42], [0.58, 0.72], [0.88, 1]];
      for (let i = 0; i < 4; i++) {
        if (p <= holds[i][1]) {
          if (p >= holds[i][0]) return i;
          const t = (p - holds[i - 1][1]) / (holds[i][0] - holds[i - 1][1]);
          return i - 1 + t * t * (3 - 2 * t);
        }
      }
      return 3;
    }
    const raw = p * (this.n - 1);
    const i = Math.min(this.n - 2, Math.floor(raw));
    const t = Math.min(1, Math.max(0, (raw - i - 0.25) / 0.5));
    return i + t * t * (3 - 2 * t);
  }

  tick() {
    this.raf = 0;
    const goal = this.target();
    if (this.native) {
      this.pos = goal;
    } else {
      // Ease toward the goal; keep animating until it arrives.
      this.pos += (goal - this.pos) * 0.18;
      if (Math.abs(goal - this.pos) < 0.001) this.pos = goal;
      this.style.setProperty('--pos', this.pos.toFixed(4));
      if (this.pos !== goal) this.raf = requestAnimationFrame(this.frame);
    }
    const active = Math.max(0, Math.min(this.n - 1, Math.round(this.pos)));
    if (active !== this.active) {
      this.active = active;
      this.steps.forEach((s, i) => s.classList.toggle('is-active', i === active));
      this.dots.forEach((d, i) => d.setAttribute('aria-current', i === active ? 'step' : 'false'));
    }
    if (!('onscrollend' in window)) { clearTimeout(this.endTimer); this.endTimer = setTimeout(this.onEnd, 160); }
  }

  // Stopped between two products? Glide to the nearer one.
  settle() {
    const { r, run } = this.run();
    if (run <= 0 || r.top > 1 || r.bottom < window.innerHeight - 1) return;
    const p = -r.top / run;
    const stops = this.n === 4 ? STOPS : this.steps.map((_, i) => i / (this.n - 1));
    let k = 0;
    stops.forEach((s, i) => { if (Math.abs(s - p) < Math.abs(stops[k] - p)) k = i; });
    if (Math.abs(stops[k] - p) * run > 24) this.go(k);
  }

  go(index, instant) {
    const { r, run } = this.run();
    const stops = this.n === 4 ? STOPS : this.steps.map((_, i) => i / (this.n - 1));
    const top = window.scrollY + r.top + run * stops[index];
    window.scrollTo({ top, behavior: instant || this.reduce.matches ? 'instant' : 'smooth' });
  }
}
if (!customElements.get('day-line')) customElements.define('day-line', DayLine);
