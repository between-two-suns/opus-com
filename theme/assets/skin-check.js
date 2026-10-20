/*
  Skin check. Answers → products, from the four formulations (owner + ICI answers, DECISIONS 171, 173):
  - each product is 'core' (suggested, ticked) or 'optional' (shown under "Also worth considering", not ticked),
    and lists the customer's concerns it answers (shown as chips beside its pack benefit line);
  - highly reactive or irritated skin gets guidance and no products;
  - a set is offered only when the ticked products are exactly a set's contents, and never for sensitive skin;
  - a three-product result offers the missing step when it suits and The Full Ritual then costs less than that step
    alone (the bag's honest switch, same rule). Answers stay in the page; nothing is stored or sent.
*/
const ORDER = ['type', 'react', 'acne', 'concerns'];
const TREAT = ['oil', 'tone', 'marks', 'dehydration'];

export function match(a) {
  if (a.react === 'high') return { guidance: true, picks: {} };
  const C = new Set(a.concerns);
  const t = a.type;
  const veryDry = t === 'very_dry';
  const dry = t === 'dry';
  const treating = TREAT.some((c) => C.has(c));
  const picks = {};
  const put = (step, level, reason, ...cids) => {
    const p = (picks[step] ||= { level, reasons: [], notes: [], concerns: [] });
    if (level === 'core') p.level = 'core';
    if (reason && !p.reasons.includes(reason)) p.reasons.push(reason);
    cids.filter((c) => C.has(c) && !p.concerns.includes(c)).forEach((c) => p.concerns.push(c));
  };
  const note = (step, n) => { if (picks[step] && !picks[step].notes.includes(n)) picks[step].notes.push(n); };

  // 01 Cleanser: oily, combination, normal and acne-prone; an option for mildly dry; never very dry
  if (!veryDry) {
    if (a.acne === 'yes' || t === 'oily') put(1, 'core', 'cleanser_oil', 'oil');
    else if (t === 'combination') put(1, C.has('oil') || !treating ? 'core' : 'optional', 'cleanser_oil', 'oil');
    else if (t === 'normal') put(1, treating ? 'optional' : 'core', 'cleanser_daily');
    else if (dry) { put(1, 'optional', 'cleanser_daily'); note(1, 'tight'); }
  }
  // 02 Clarity Serum: by concern, for every skin type
  if (C.has('oil')) put(2, 'core', 'serum_oil', 'oil');
  if (C.has('tone') || C.has('marks')) put(2, 'core', 'serum_tone', 'tone', 'marks');
  if (C.has('dehydration')) put(2, 'core', 'serum_hydra', 'dehydration');
  if (picks[2]) {
    if (dry) note(2, 'with_moisturiser');
    if (veryDry) note(2, 'not_replace');
    if (a.acne === 'yes') note(2, 'not_acne');
  }
  // 03 Barrier Cream: the everyday moisturiser for every type (a lighter layer for very dry skin)
  if (C.has('barrier')) put(3, 'core', 'cream_barrier', 'barrier');
  if (C.has('dehydration')) put(3, 'core', 'cream_hydra', 'dehydration');
  if (C.has('oil') && (t === 'oily' || t === 'combination' || a.acne === 'yes')) put(3, 'core', 'cream_oil', 'oil');
  if (!picks[3]) put(3, 'core', 'cream_daily');
  if (veryDry) note(3, 'richer');
  // 04 SPF 50+: every morning, for everyone; part of any routine for uneven tone and marks
  put(4, 'core', 'spf_daily', 'spf', 'tone', 'marks');
  if (C.has('tone') || C.has('marks')) note(4, 'spf_tone');

  // Mildly sensitive: cautious, individual suggestions with a patch test; the cleanser and serum are not ticked
  if (a.react === 'some') {
    [1, 2].forEach((s) => { if (picks[s]) picks[s].level = 'optional'; });
    Object.keys(picks).forEach((s) => note(s, 'patch'));
  }
  // Three suggested products: the fourth may complete the routine as The Full Ritual, if it suits (never the
  // cleanser for very dry skin, never for sensitive skin). The serum suits every type (ICI); offered on its pack benefit.
  const sets = a.react === 'no';
  let complete = null;
  const core = [1, 2, 3, 4].filter((s) => picks[s]?.level === 'core');
  if (sets && core.length === 3) {
    const m = [1, 2, 3, 4].find((s) => !core.includes(s));
    if (!(m === 1 && veryDry)) {
      picks[m] ||= { level: 'optional', reasons: [], notes: [], concerns: [] };
      complete = m;
    }
  }
  return { guidance: false, picks, sets, complete };
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
