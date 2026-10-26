/*
  Creators page (DECISIONS 224).
  - The application works like the routine finder: one part per screen, Back and Next at the bottom, each part checked
    before moving on. Without this script all three parts show and the form still sends.
  - Phones: a pinned "Apply to join" bar once the hero has scrolled away, hidden again while the form is on screen.
*/
(() => {
  const form = document.querySelector('[data-cr-steps]');
  if (form && !form.querySelector('[data-cr-done]')) {
    const steps = [...form.querySelectorAll('[data-cr-step]')];
    const back = form.querySelector('[data-cr-back]');
    const next = form.querySelector('[data-cr-next]');
    const send = form.querySelector('[data-cr-send]');
    const of = form.querySelector('[data-cr-of]');
    const card = form.closest('.cr-apply__card') || form;
    const tpl = form.dataset.of || '';
    let i = 0;
    const show = (n, focus) => {
      i = n;
      steps.forEach((s, k) => { s.hidden = k !== n; });
      back.hidden = n === 0;
      next.hidden = n === steps.length - 1;
      send.hidden = n !== steps.length - 1;
      if (of) of.textContent = tpl.replace('__N__', n + 1).replace('__T__', steps.length);
      if (focus) {
        if (card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        steps[n].querySelector('input:not([type="hidden"]), select, textarea')?.focus({ preventScroll: true });
      }
    };
    // a part is checked before moving on: the browser's own message points at the first missing field
    const valid = (n) => {
      for (const el of steps[n].querySelectorAll('input, select, textarea')) {
        if (!el.checkValidity()) { el.reportValidity(); return false; }
      }
      return true;
    };
    form.classList.add('is-stepped');
    next.addEventListener('click', () => { if (valid(i)) show(i + 1, true); });
    back.addEventListener('click', () => show(i - 1, true));
    // Enter in a text field moves to the next part instead of sending early
    form.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' || e.target.tagName === 'TEXTAREA' || i === steps.length - 1) return;
      e.preventDefault();
      next.click();
    });
    // if the server sent the form back with an error, open on the part that holds the first invalid field
    const bad = steps.findIndex((s) => s.querySelector('[aria-invalid="true"]'));
    show(bad > 0 ? bad : 0, false);
  }

  const bar = document.querySelector('[data-cr-bar]');
  const hero = document.querySelector('.cr-hero');
  const apply = document.getElementById('CreatorApply');
  if (bar && hero && apply && 'IntersectionObserver' in window) {
    let pastHero = false, onForm = false;
    const set = () => bar.classList.toggle('is-on', pastHero && !onForm);
    new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting && e.boundingClientRect.top < 0; set(); }).observe(hero);
    new IntersectionObserver(([e]) => { onForm = e.isIntersecting; set(); }, { rootMargin: '0px 0px -30% 0px' }).observe(apply);
  }
})();
