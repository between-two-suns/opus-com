/* Product page: swipe gallery, sticky add-to-bag, variant picker. */

class MediaGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-track]');
    this.slides = [...this.querySelectorAll('[data-slide]')];
    this.dots = [...this.querySelectorAll('[data-dot]')];
    this.prev = this.querySelector('[data-prev]');
    this.next = this.querySelector('[data-next]');
    if (this.slides.length < 2) return;
    this.dots.forEach((dot) => dot.addEventListener('click', () => this.go(Number(dot.dataset.dot))));
    this.prev?.addEventListener('click', () => this.go(this.index - 1));
    this.next?.addEventListener('click', () => this.go(this.index + 1));
    this.track.addEventListener('keydown', (e) => {
      const rtl = document.dir === 'rtl';
      if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index + (rtl ? -1 : 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index + (rtl ? 1 : -1)); }
    });
    this.index = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting && en.intersectionRatio > 0.6) this.setActive(this.slides.indexOf(en.target)); });
    }, { root: this.track, threshold: [0.6] });
    this.slides.forEach((s) => io.observe(s));
    this.setActive(0);
  }
  go(i) {
    const n = Math.max(0, Math.min(this.slides.length - 1, i));
    this.slides[n].scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest', inline: 'start' });
    this.setActive(n);
  }
  setActive(i) {
    this.index = i;
    this.dots.forEach((d, k) => (k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    if (this.prev) this.prev.disabled = i === 0;
    if (this.next) this.next.disabled = i === this.slides.length - 1;
  }
}
if (!customElements.get('media-gallery')) customElements.define('media-gallery', MediaGallery);

class StickyAtc extends HTMLElement {
  connectedCallback() {
    const target = document.getElementById(this.dataset.target);
    if (!target) return;
    this.hidden = false;
    let pastTarget = false;
    let footerVisible = false;
    const update = () => this.classList.toggle('is-visible', pastTarget && !footerVisible);
    new IntersectionObserver(([e]) => {
      pastTarget = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(target);
    const footer = document.querySelector('.site-footer');
    if (footer) new IntersectionObserver(([e]) => { footerVisible = e.isIntersecting; update(); }).observe(footer);
  }
}
if (!customElements.get('sticky-atc')) customElements.define('sticky-atc', StickyAtc);

class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.variants = JSON.parse(this.querySelector('[data-variants]')?.textContent || '[]');
    this.form = this.closest('form');
    this.addEventListener('change', () => this.onChange());
  }
  onChange() {
    const selected = [...this.querySelectorAll('fieldset')].map((fs) => fs.querySelector('input:checked')?.value);
    const variant = this.variants.find((v) => v.options.every((o, i) => o === selected[i]));
    const idInput = this.form.querySelector('[data-variant-id]');
    const atc = this.form.querySelector('[data-atc]');
    const label = this.form.querySelector('[data-atc-label]');
    if (!variant) {
      atc.disabled = true;
      label.textContent = window.BTS?.strings?.soldOut || '';
      return;
    }
    idInput.value = variant.id;
    atc.disabled = !variant.available;
    label.textContent = variant.available ? window.BTS.strings.addToCart : window.BTS.strings.soldOut;
    const price = document.querySelector('.pdp__price .price__current');
    if (price && window.BTS?.formatMoney) price.textContent = window.BTS.formatMoney(variant.price);
    const url = new URL(location.href);
    url.searchParams.set('variant', variant.id);
    history.replaceState({}, '', url);
  }
}
if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
