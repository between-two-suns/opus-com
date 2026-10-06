/* Signature 1 · The Space Between — scroll fallback.
   Browsers with CSS scroll-driven animations do this entirely in CSS (home.css).
   Here we only drive one custom property (--p) with rAF, and only while the hero is visible. */
class SpaceBetween extends HTMLElement {
  connectedCallback() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const cssDriven = CSS.supports('animation-timeline: scroll()');
    if (!this.classList.contains('hero--motion') || cssDriven || reduce.matches) return;

    let ticking = false;
    let visible = true;
    const range = () => window.innerHeight * 0.9;
    const update = () => {
      ticking = false;
      const p = Math.min(1, Math.max(0, window.scrollY / range()));
      this.style.setProperty('--p', p.toFixed(4));
    };
    const onScroll = () => {
      if (!visible || ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) onScroll(); }).observe(this);
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
  }
}
if (!customElements.get('space-between')) customElements.define('space-between', SpaceBetween);
