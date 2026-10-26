/*
  Skin check. Answers → products. Every suggestion has a reason that can be read on the product's own label
  (DECISIONS 216, after the owner's "I need you to really check the logic"):
  - 01 Cleanser · label "For oily to combination skin", non-stripping, soap-free: suggested for oily, combination and normal
    skin and for breakouts, whatever the goals; an option for mildly dry skin (only if it doesn't leave it tight); not for
    very dry skin (it is made to remove excess oil). Goals never take it away: everyone cleanses.
  - 02 Clarity Serum · label "Controls oil. Evens skin tone. Hydrates.": suggested for oily and combination skin, for
    breakouts (not as an acne treatment), and for the goals excess oil, uneven tone, dark spots and marks, dehydration;
    an option for dry skin without those goals (for its hydration).
  - 03 Barrier Cream · the daily moisturiser in every routine (lightweight, oil-control, barrier support).
  - 04 SPF 50+ · every morning, for everyone ("For all skin types").
  - Sensitive skin changes how to start (a patch test, one new product at a time), never what is suggested, so no answer
    ends without a routine (owner, DECISIONS 215).
  Each product is 'core' (suggested, ticked) or 'optional' (shown unticked), with the visitor's goals it answers
  ('concerns') and which of their answers it suits ('fits': 'type', 'acne'). A set is offered only when the ticked products
  are exactly a set's contents; a three-product result offers the missing step when The Full Ritual then costs less than
  that step alone (the bag's honest switch). Answers stay in the page; nothing is stored or sent.
*/
const ORDER = ['type', 'react', 'acne', 'concerns'];

export function match(a) {
  const sensitive = a.react === 'some' || a.react === 'high';
  const C = new Set(a.concerns);
  const t = a.type;
  const oily = t === 'oily' || t === 'combination';
  const veryDry = t === 'very_dry';
  const dry = t === 'dry';
  const acne = a.acne === 'yes';
  const picks = {};
  const put = (step, level, reason, ...cids) => {
    const p = (picks[step] ||= { level, reasons: [], notes: [], concerns: [], fits: [] });
    if (level === 'core') p.level = 'core';
    if (reason && !p.reasons.includes(reason)) p.reasons.push(reason);
    cids.filter((c) => C.has(c) && !p.concerns.includes(c)).forEach((c) => p.concerns.push(c));
  };
  const fit = (step, f) => { if (picks[step] && !picks[step].fits.includes(f)) picks[step].fits.push(f); };
  const note = (step, n) => { if (picks[step] && !picks[step].notes.includes(n)) picks[step].notes.push(n); };

  // 01 Cleanser
  if (oily || (acne && !veryDry)) {
    put(1, 'core', 'cleanser_oil', 'oil');
    if (oily) fit(1, 'type');
    if (acne) fit(1, 'acne');
  } else if (t === 'normal') put(1, 'core', 'cleanser_daily');
  else if (dry) put(1, 'optional', 'cleanser_daily');
  if (dry) note(1, 'tight');
  // 02 Clarity Serum
  if (oily || acne || C.has('oil')) {
    put(2, 'core', 'serum_oil', 'oil');
    if (oily) fit(2, 'type');
    if (acne) fit(2, 'acne');
  }
  if (C.has('tone') || C.has('marks')) put(2, 'core', 'serum_tone', 'tone', 'marks');
  if (C.has('dehydration')) put(2, 'core', 'serum_hydra', 'dehydration');
  // dry skin: the serum's hydration ("Hydrates" on its label) is worth considering, even without a goal
  if ((dry || veryDry) && !picks[2]) put(2, 'optional', 'serum_hydra');
  if (picks[2]) {
    if (dry) note(2, 'with_moisturiser');
    if (veryDry) note(2, 'not_replace');
    if (acne) note(2, 'not_acne');
  }
  // 03 Barrier Cream
  if (C.has('barrier')) put(3, 'core', 'cream_barrier', 'barrier');
  if (C.has('dehydration')) put(3, 'core', 'cream_hydra', 'dehydration');
  if (oily || acne) { put(3, 'core', 'cream_oil', 'oil'); if (oily) fit(3, 'type'); }
  if (!picks[3]) put(3, 'core', 'cream_daily');
  if (veryDry) note(3, 'richer');
  // 04 SPF 50+
  put(4, 'core', 'spf_daily', 'spf', 'tone', 'marks');
  if (C.has('tone') || C.has('marks')) note(4, 'spf_tone');

  if (sensitive) Object.keys(picks).forEach((s) => note(s, 'patch'));
  // three suggested: the fourth may complete the routine as The Full Ritual (never the cleanser for very dry skin)
  const sets = true;
  let complete = null;
  const core = [1, 2, 3, 4].filter((s) => picks[s]?.level === 'core');
  if (core.length === 3) {
    const m = [1, 2, 3, 4].find((s) => !core.includes(s));
    if (!(m === 1 && veryDry)) {
      picks[m] ||= { level: 'optional', reasons: [], notes: [], concerns: [], fits: [] };
      complete = m;
    }
  }
  return { guidance: false, picks, sets, complete, sensitive };
}

class SkinCheck extends (typeof HTMLElement !== "undefined" ? HTMLElement : class {}) {
  connectedCallback() {
    const raw = this.querySelector('[data-skc-data]');
    if (!raw) return;
    this.data = JSON.parse(raw.textContent);
    this.s = this.data.strings;
    this.form = this.querySelector('[data-skc-form]');
    this.screens = [...this.querySelectorAll('[data-screen]')];
    this.i = 0;
    this.querySelector('[data-skc-start]').addEventListener('click', () => this.go(0));
    this.querySelector('[data-skc-back]').addEventListener('click', () => (this.i > 0 ? this.go(this.i - 1) : this.show('intro')));
    this.querySelectorAll('[data-skc-change]').forEach((b) => b.addEventListener('click', () => this.go(0)));
    this.querySelector('[data-skc-restart]').addEventListener('click', () => { this.form.reset(); this.querySelectorAll('[data-skc-next]').forEach((b, k) => { b.disabled = ORDER[k] !== 'concerns'; }); this.go(0); });
    this.querySelectorAll('[data-skc-next]').forEach((b) => b.addEventListener('click', () => this.next()));
    this.form.addEventListener('change', (e) => {
      const fs = e.target.closest('fieldset');
      const next = fs.querySelector('[data-skc-next]');
      if (e.target.type === 'radio') next.disabled = false;
    });
    // a tap on a single-choice answer moves on; keyboard selection (click with detail 0) waits for Next
    this.form.addEventListener('click', (e) => {
      const input = e.target.closest('label')?.querySelector('input[type="radio"]');
      if (!input || e.detail === 0) return;
      clearTimeout(this._t);
      this._t = setTimeout(() => { if (input.checked) this.next(); }, 260);
    });
    this.form.addEventListener('submit', (e) => e.preventDefault());
    this.list = this.querySelector('[data-skc-list]');
    this.also = this.querySelector('[data-skc-also]');
    this.list.addEventListener('change', () => this.updateBuy());
    this.also.addEventListener('change', () => this.updateBuy());
    // "Complete your routine": tick the fourth step and move it up into the routine, in step order
    this.querySelector('[data-skc-complete-btn]').addEventListener('click', () => {
      const li = this.also.querySelector(`.skc__item[data-step="${this.complete}"]`);
      if (!li) return;
      li.querySelector('input').checked = true;
      li.hidden = false;
      const after = [...this.list.children].find((x) => Number(x.dataset.step) > this.complete);
      this.list.insertBefore(li, after || null);
      this.syncAlso();
      this.updateBuy();
      li.querySelector('input').focus({ preventScroll: true });
    });
    this.buyForm = this.querySelector('product-form');
    this.addBtn = this.querySelector('[data-skc-add]');
    this.addSingles = this.querySelector('[data-skc-add-singles]');
    this.addSingles.addEventListener('click', () => { this.forceSingles = true; });
    this.addBtn.addEventListener('click', () => { this.forceSingles = false; });
    if (this.buyForm) this.buyForm.itemsOverride = () => this.items();
  }
  show(name) {
    this.screens.forEach((sc) => { sc.hidden = sc.dataset.screen !== name; });
    this.form.hidden = !ORDER.includes(name);
    this.dataset.state = name;
  }
  go(i) {
    this.i = i;
    const q = ORDER[i];
    this.show(q);
    const fs = this.querySelector(`[data-screen="${q}"]`);
    this.querySelector('[data-skc-progress]').textContent = this.s.progress.replace('__N__', i + 1).replace('__T__', ORDER.length);
    this.querySelector('[data-skc-meter]').style.setProperty('--v', `${((i + 1) / ORDER.length) * 100}%`);
    (fs.querySelector('input:checked') || fs.querySelector('input'))?.focus({ preventScroll: true });
    this.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
  next() {
    const q = ORDER[this.i];
    if (q !== 'concerns' && !this.form.querySelector(`input[name="${q}"]:checked`)) return;
    if (this.i < ORDER.length - 1) this.go(this.i + 1);
    else this.result();
  }
  answers() {
    const one = (n) => this.form.querySelector(`input[name="${n}"]:checked`)?.value;
    return { type: one('type'), react: one('react'), acne: one('acne'), concerns: [...this.form.querySelectorAll('input[name="concerns"]:checked')].map((x) => x.value) };
  }
  result() {
    const a = this.answers();
    const r = match(a);
    this.sets = r.sets;
    this.complete = r.complete;
    // the answers as chips: skin type, and reactivity / breakouts when they apply
    const prof = this.querySelector('[data-skc-profile]');
    prof.innerHTML = '';
    ['type', 'react', 'acne'].forEach((n) => {
      const sub = this.form.querySelector(`input[name="${n}"]:checked`)?.closest('label').querySelector('.skc__opt-sub');
      if (sub) { const li = document.createElement('li'); li.className = 'chip'; li.textContent = sub.textContent; prof.append(li); }
    });
    if (r.guidance) { this.show('guidance'); this.querySelector('[data-screen="guidance"]').focus({ preventScroll: true }); return; }
    this.list.innerHTML = '';
    this.also.innerHTML = '';
    [1, 2, 3, 4].forEach((step) => {
      const p = r.picks[step];
      if (!p || !this.data.products[step]?.id) return;
      (p.level === 'core' ? this.list : this.also).append(this.row(step, p));
    });
    this.syncAlso();
    this.show('result');
    this.updateBuy();
    this.querySelector('[data-screen="result"]').focus({ preventScroll: true });
    this.scrollIntoView({ block: 'start' });
  }
  row(step, p) {
    const d = this.data.products[step];
    const li = document.createElement('li');
    li.className = 'skc__item';
    li.dataset.step = step;
    li.style.setProperty('--sku', `var(--c-step-${step})`);
    const id = `skc-${step}-${this.id || 'x'}`;
    const chips = p.concerns.length ? `<ul class="skc__for" role="list" aria-label="${this.s.for_label}">${p.concerns.map((c) => `<li>${this.s.chips[c] || c}</li>`).join('')}</ul>` : '';
    const benefit = d.benefit ? `<p class="skc__benefit">${d.benefit}</p>` : '';
    const reasons = p.reasons.map((k) => `<p class="skc__why">${this.s.reasons[k] || ''}</p>`).join('');
    const notes = p.notes.map((k) => `<p class="skc__note t-xs">${this.s.notes[k] || ''}</p>`).join('');
    const when = d.when === 'am' ? this.s.when_am : this.s.when_both;
    const fmt = (c) => (window.BTS?.formatMoney ? window.BTS.formatMoney(c) : String(c / 100));
    li.innerHTML = `
      <label class="skc__pick" for="${id}">
        <input type="checkbox" id="${id}" value="${step}" ${p.level === 'core' && d.available ? 'checked' : ''} ${d.available ? '' : 'disabled'}>
        <span class="skc__opt-box" aria-hidden="true"></span>
        <span class="skc__thumb" aria-hidden="true"><img src="${d.img}" alt="" width="120" height="380" loading="lazy"></span>
        <span class="skc__body">
          <span class="step-tag">${this.s.step.replace('__N__', step)} · ${d.label}</span>
          <span class="skc__name">${d.title}</span>
          <span class="skc__meta t-xs">${when} · ${fmt(d.price)}</span>
        </span>
      </label>
      <div class="skc__detail">${chips}${benefit}${reasons}${notes}<a class="skc__more t-xs" href="${d.url}">${d.title} →</a></div>`;
    return li;
  }
  syncAlso() {
    this.querySelector('[data-skc-also-wrap]').hidden = !this.also.children.length;
  }
  chosen() {
    return [...this.querySelectorAll('.skc__item input:checked')].map((x) => Number(x.value)).sort();
  }
  setFor(steps) {
    if (!this.sets || steps.length < 2) return null;
    const key = steps.join(',');
    // BTS.bundles lists each set's steps as "1,2,4" (a stock-up repeats a step, so it never matches)
    return (window.BTS?.bundles || []).find((b) => {
      const st = String(b.steps).split(',').map(Number).sort();
      return b.available && new Set(st).size === st.length && st.join(',') === key;
    }) || null;
  }
  updateBuy() {
    const steps = this.chosen();
    const fmt = (c) => (window.BTS?.formatMoney ? window.BTS.formatMoney(c) : String(c / 100));
    const sum = steps.reduce((t, s) => t + (this.data.products[s]?.price || 0), 0);
    const set = this.setFor(steps);
    this.currentSet = set;
    const setBox = this.querySelector('[data-skc-set]');
    setBox.hidden = !set;
    if (set) this.querySelector('[data-skc-set-text]').textContent = this.s.set_text.replace('__S__', set.name).replace('__P__', fmt(set.price)).replace('__Q__', fmt(sum));
    this.querySelector('[data-skc-total]').textContent = steps.length ? fmt(set ? set.price : sum) : '';
    this.addBtn.disabled = !steps.length;
    this.addBtn.querySelector('.btn__label') || (this.addBtn.innerHTML = '<span class="btn__label"></span>');
    this.addBtn.querySelector('.btn__label').textContent = !steps.length ? this.s.nothing : set ? this.s.add_set.replace('__S__', set.name) : steps.length === 1 ? this.s.add_one : this.s.add_items.replace('__N__', steps.length);
    this.addSingles.hidden = !set;
    this.addSingles.querySelector('.btn__label') || (this.addSingles.innerHTML = '<span class="btn__label"></span>');
    this.addSingles.querySelector('.btn__label').textContent = this.s.add_separately;
    // the honest switch: only while the fourth step is unticked and The Full Ritual costs less than adding it alone
    const box = this.querySelector('[data-skc-complete]');
    const m = this.complete;
    const full = this.setFor([1, 2, 3, 4]);
    const others = [1, 2, 3, 4].filter((x) => x !== m);
    const ready = m && full && others.every((x) => steps.includes(x)) && !steps.includes(m);
    const single = m ? this.data.products[m]?.price || 0 : 0;
    const extra = ready ? full.price - others.reduce((t, x) => t + (this.data.products[x]?.price || 0), 0) : 0;
    box.hidden = !(ready && extra > 0 && extra < single);
    if (!box.hidden) {
      const d = this.data.products[m];
      this.querySelector('[data-skc-complete-text]').textContent = this.s.complete_text.replace('__P__', d.title).replace('__S__', full.name).replace('__X__', fmt(extra)).replace('__Q__', fmt(single));
      this.querySelector('[data-skc-complete-benefit]').textContent = d.benefit || '';
      this.querySelector('[data-skc-complete-name]').textContent = d.title;
      const img = this.querySelector('[data-skc-complete-img]');
      img.src = d.img;
      this.querySelector('[data-skc-complete] .skc__thumb').style.setProperty('--sku', `var(--c-step-${m})`);
      this.querySelector('[data-skc-complete-btn] .btn__label').textContent = this.s.complete_cta.replace('__P__', d.title);
    }
    // while the offer shows, the fourth step lives in it, not twice on the page
    this.also.querySelectorAll('.skc__item').forEach((li) => { li.hidden = !box.hidden && Number(li.dataset.step) === m; });
    this.querySelector('[data-skc-also-wrap]').hidden = ![...this.also.children].some((li) => !li.hidden);
  }
  items() {
    const steps = this.chosen();
    const set = this.currentSet;
    if (set && !this.forceSingles) return [{ id: set.id, quantity: 1 }];
    return steps.map((s) => ({ id: this.data.products[s].id, quantity: 1 }));
  }
}
if (typeof customElements !== 'undefined' && !customElements.get('skin-check')) customElements.define('skin-check', SkinCheck);
