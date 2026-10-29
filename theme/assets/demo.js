// Demo switch behaviours (DECISIONS 265). Only act when <html> has .is-demo (set by `?demo=1`, see theme.liquid).
if (document.documentElement.classList.contains('is-demo')) {
  // shorter search hint
  document.querySelectorAll('[data-demo-placeholder]').forEach((i) => { i.placeholder = i.dataset.demoPlaceholder; });

  // bag sheet (phones): pull down from its top, or from the top of the list when scrolled to the start; past 90px it closes
  const phone = window.matchMedia('(max-width: 749px)');
  let sheet = null, y0 = null, d = 0;
  document.addEventListener('touchstart', (e) => {
    sheet = e.target.closest?.('#CartDrawer[open]');
    if (!sheet || !phone.matches) { sheet = null; return; }
    const body = sheet.querySelector('.drawer__body');
    const fromHead = !!e.target.closest('.drawer__head');
    const fromTop = body?.contains(e.target) && body.scrollTop <= 0 && !e.target.closest('.cart-upsell > .cart-lines, quantity-input');
    if (!fromHead && !fromTop) { sheet = null; return; }
    y0 = e.touches[0].clientY; d = 0;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!sheet || y0 == null) return;
    d = Math.max(0, e.touches[0].clientY - y0);
    sheet.style.transition = 'none';
    sheet.style.transform = d ? `translateY(${d}px)` : '';
  }, { passive: true });
  const end = () => {
    if (!sheet || y0 == null) return;
    const s = sheet;
    s.style.transition = ''; s.style.transform = '';
    if (d > 90) s.close();
    sheet = null; y0 = null; d = 0;
  };
  document.addEventListener('touchend', end);
  document.addEventListener('touchcancel', end);
}
