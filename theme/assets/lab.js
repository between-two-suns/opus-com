/* Climate lab: the condition crossing the middle of the viewport (or under a fine pointer) sets the stage's weather. */
class ClimateLab extends HTMLElement {
  connectedCallback() {
    const items = [...this.querySelectorAll('.lab__item')];
    const set = (c) => {
      if (this.dataset.active === c) return;
      this.dataset.active = c;
      items.forEach((i) => i.classList.toggle('is-active', i.dataset.c === c));
    };
    set(items[0]?.dataset.c);
    items[0]?.classList.add('is-active');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) set(e.target.dataset.c); });
    }, { rootMargin: window.matchMedia('(min-width: 990px)').matches ? '-48% 0px -48% 0px' : '-70% 0px -28% 0px' });
    items.forEach((i) => io.observe(i));
    if (window.matchMedia('(pointer: fine)').matches) items.forEach((i) => i.addEventListener('pointerenter', () => set(i.dataset.c)));
  }
}
if (!customElements.get('climate-lab')) customElements.define('climate-lab', ClimateLab);
