/*
  Routines · the finder demo (DECISIONS 211, 215). Three questions beside the four packs: what you'd like help with
  (the packs answer with every tick), how your skin feels by midday, and breakouts or sensitivity. The matching rules
  are the skin check's (match() in skin-check.js, shared so the two never disagree). Every answer ends in a routine.
  The result: the set that holds exactly the suggested steps at its real price, each step with what it helps with,
  one button (the bottom bar on phones). Answers stay in the page; nothing is stored or sent.
*/
const ORDER = ['concerns', 'type', 'more'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const phone = matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)');
const fmt = (c) => (window.BTS?.formatMoney ? window.BTS.formatMoney(c) : String(c / 100));

const init = async (root) => {
  if (root.dataset.ready) return;
  root.dataset.ready = '';
  const { match } = await import(root.dataset.match);
  const data = JSON.parse(root.querySelector('[data-rf-data]').textContent);
  const P = data.products, S = data.s;
  const form = root.querySelector('[data-rf-form]');
  const screens = [...root.querySelectorAll('[data-screen]')];
  const packs = [...root.querySelectorAll('.rf-pack')];
  const progress = root.querySelector('[data-rf-progress]');
  const back = root.querySelector('[data-rf-back]');
  const hdrWrap = document.querySelector('.site-header-wrap')?.closest('.shopify-section');
  const hdr = () => hdrWrap && root.style.setProperty('--hdr', hdrWrap.offsetHeight + 'px');
  hdr(); if (hdrWrap && window.ResizeObserver) new ResizeObserver(hdr).observe(hdrWrap);
  let i = -1, picks = null, chosen = [], sets = true, complete = null, currentSet = null, forceSingles = false;

  const one = (n) => form.querySelector(`input[name="${n}"]:checked`)?.value;
  // the last question answers two of the rules' questions at once: breakouts, and sensitivity
  const answers = (fill) => {
    const more = one('more');
    return {
      type: one('type') || (fill ? 'normal' : undefined),
      acne: more === 'breakouts' || more === 'both' ? 'yes' : 'no',
      react: more === 'sensitive' || more === 'both' ? 'some' : 'no',
      concerns: [...form.querySelectorAll('input[name="concerns"]:checked')].map((x) => x.value),
    };
  };

  // the stage answers: suggested steps forward, the rest back a little; only a step that doesn't suit fades
  const stage = (states) => packs.forEach((li) => {
    const s = states[li.dataset.step] || 'opt';
    if (li.dataset.state !== s && s === 'core') { li.classList.remove('is-pulse'); void li.offsetWidth; li.classList.add('is-pulse'); }
    li.dataset.state = s;
  });
  const live = () => {
    if (i < 0) return stage({ 1: 'core', 2: 'core', 3: 'core', 4: 'core' });
    const a = answers(true), r = match(a), st = {};
    Object.entries(r.picks).forEach(([k, v]) => { st[k] = v.level === 'core' ? 'core' : 'opt'; });
    if (a.type === 'very_dry' && one('type')) st[1] = 'off';
    stage(st);
  };
  const mark = (p) => root.style.setProperty('--p', p.toFixed(3));

  const show = (name) => {
    screens.forEach((sc) => {
      const on = sc.dataset.screen === name;
      sc.hidden = !on;
      sc.classList.toggle('is-in', on);
    });
    root.dataset.state = name;
    // phones: on the result the button is the bottom bar, so the dock steps aside (as on a product page)
    document.documentElement.classList.toggle('is-buying', name === 'result' && phone.matches);
  };
  const top = () => { if (root.getBoundingClientRect().top < -40) root.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' }); };
  const go = (n) => {
    i = n;
    const q = ORDER[n];
    show(q);
    back.hidden = false;
    progress.textContent = S.progress.replace('__N__', n + 1).replace('__T__', ORDER.length);
    mark(n / ORDER.length);
    live();
    const fs = root.querySelector(`[data-screen="${q}"]`);
    (fs.querySelector('input:checked') || fs.querySelector('input'))?.focus({ preventScroll: true });
    top();
  };
  const intro = () => { i = -1; show('intro'); back.hidden = true; progress.textContent = ''; mark(0); live(); };
  const next = () => {
    const q = ORDER[i];
    if (q !== 'concerns' && !one(q)) return;
    if (i < ORDER.length - 1) go(i + 1); else result();
  };

  const setFor = (steps) => {
    if (!sets || steps.length < 2) return null;
    const key = [...steps].sort().join(',');
    return (window.BTS?.bundles || []).find((b) => {
      const st = String(b.steps).split(',').map(Number).sort();
      return b.available && new Set(st).size === st.length && st.join(',') === key;
    }) || null;
  };
  // each step: its pack, what it helps with among the visitor's own goals, when it's used, its price
  const row = (step, checked, opt) => {
    const d = P[step];
    const helps = (picks[step]?.concerns || []).map((c) => S.chips[c]).filter(Boolean);
    const li = document.createElement('li');
    li.className = 'rf-step' + (opt ? ' rf-step--opt' : '');
    li.dataset.step = step;
    li.style.setProperty('--sku', `var(--c-step-${step})`);
    li.innerHTML = `<label><input type="checkbox" value="${step}" ${checked ? 'checked' : ''} ${d.available ? '' : 'disabled'}>
      <span class="rf-step__img" aria-hidden="true"><img src="${d.img}" alt="" width="140" height="431" loading="lazy"></span>
      <span class="rf-step__txt"><span class="rf-step__name">${d.title}</span><span class="rf-step__when">${[d.am ? S.when_am : S.when_both, ...helps].join(' · ')}</span></span>
      <span class="rf-step__price">${fmt(d.price)}</span></label>`;
    return li;
  };
  const list = root.querySelector('[data-rf-steps]'), also = root.querySelector('[data-rf-also]');
  const result = (full) => {
    const a = answers(false);
    const r = full ? { sets: true, complete: null, sensitive: false, picks: { 1: { level: 'core' }, 2: { level: 'core' }, 3: { level: 'core' }, 4: { level: 'core' } } } : match(a);
    mark(1);
    back.hidden = false;
    progress.textContent = '';
    picks = r.picks; sets = r.sets; complete = r.complete;
    list.innerHTML = ''; also.innerHTML = '';
    [1, 2, 3, 4].forEach((s) => {
      const p = picks[s];
      if (!p || !P[s]?.id) return;
      (p.level === 'core' ? list : also).append(row(s, p.level === 'core' && P[s].available, p.level !== 'core'));
    });
    root.querySelector('[data-rf-also-title]').hidden = !also.children.length || also.children.length === 1 && complete;
    // "Made for": the visitor's own answers, so the routine reads as theirs
    const forEl = root.querySelector('[data-rf-for]');
    const bits = full ? [] : [S.skin.replace('__T__', S.types[a.type] || ''), ...a.concerns.map((c) => S.chips[c]), a.acne === 'yes' && S.breakouts, a.react !== 'no' && S.sensitive].filter(Boolean);
    forEl.hidden = !bits.length;
    forEl.innerHTML = bits.length ? `<b>${forEl.dataset.label}</b>${bits.join(' · ')}` : '';
    root.querySelector('[data-rf-gentle]').hidden = !r.sensitive;
    show('result');
    update();
    root.querySelector('[data-screen="result"]').focus({ preventScroll: true });
    top();
  };
  const update = () => {
    chosen = [...root.querySelectorAll('.rf-step input:checked')].map((x) => Number(x.value)).sort();
    const st = {};
    [1, 2, 3, 4].forEach((s) => { st[s] = chosen.includes(s) ? 'core' : picks?.[s] ? 'opt' : 'off'; });
    stage(st);
    const set = setFor(chosen);
    currentSet = set;
    const sum = chosen.reduce((t, s) => t + (P[s]?.price || 0), 0);
    const total = set ? set.price : sum;
    const txt = (sel, t) => root.querySelectorAll(sel).forEach((x) => { x.textContent = t; });
    root.querySelector('[data-rf-name]').textContent = set ? set.name : S.result;
    root.querySelector('[data-rf-eyebrow]').hidden = !set;
    txt('[data-rf-total]', chosen.length ? fmt(total) : '');
    txt('[data-rf-was]', set && sum > set.price ? fmt(sum) : '');
    txt('[data-rf-save]', set && sum > set.price ? S.save.replace('__A__', fmt(sum - set.price)) : '');
    root.querySelector('[data-rf-btnprice]').textContent = chosen.length ? ` · ${fmt(total)}` : '';
    // the honest switch: the fourth step, only when the full set then costs less than adding it on its own
    const cBtn = root.querySelector('[data-rf-complete]');
    const fullSet = setFor([1, 2, 3, 4]);
    const others = [1, 2, 3, 4].filter((x) => x !== complete);
    const ready = complete && fullSet && others.every((x) => chosen.includes(x)) && !chosen.includes(complete);
    const single = complete ? P[complete]?.price || 0 : 0;
    const extra = ready ? fullSet.price - others.reduce((t, x) => t + (P[x]?.price || 0), 0) : 0;
    cBtn.hidden = !(ready && extra > 0 && extra < single);
    if (!cBtn.hidden) cBtn.textContent = S.complete_text.replace('__P__', P[complete].title).replace('__S__', fullSet.name).replace('__X__', fmt(extra)).replace('__Q__', fmt(single));
    root.querySelectorAll('[data-rf-add]').forEach((b) => { b.disabled = !chosen.length; });
    txt('[data-rf-add] .btn__label', !chosen.length ? S.nothing : set ? S.add_set.replace('__S__', set.name) : chosen.length === 1 ? S.add_one : S.add_items.replace('__N__', chosen.length));
    root.querySelector('[data-rf-singles]').hidden = !set;
  };

  root.querySelector('[data-rf-start]').addEventListener('click', () => go(0));
  root.querySelectorAll('[data-rf-skip]').forEach((b) => b.addEventListener('click', () => result(true)));
  root.querySelectorAll('[data-rf-next]').forEach((b) => b.addEventListener('click', next));
  back.addEventListener('click', () => {
    if (root.dataset.state === 'result') go(ORDER.length - 1);
    else if (i > 0) go(i - 1);
    else intro();
  });
  root.querySelectorAll('[data-rf-change]').forEach((b) => b.addEventListener('click', () => go(0)));
  root.querySelector('[data-rf-restart]').addEventListener('click', () => { form.reset(); form.querySelectorAll('[data-rf-next]').forEach((b) => { b.disabled = !b.closest('.rf-q--multi'); }); intro(); });
  root.querySelector('[data-rf-complete]').addEventListener('click', () => {
    const li = also.querySelector(`.rf-step[data-step="${complete}"]`);
    if (!li) return;
    li.querySelector('input').checked = true;
    li.classList.remove('rf-step--opt');
    const after = [...list.children].find((x) => Number(x.dataset.step) > complete);
    list.insertBefore(li, after || null);
    root.querySelector('[data-rf-also-title]').hidden = !also.children.length;
    update();
  });
  root.querySelector('[data-screen="result"]').addEventListener('change', update);
  form.addEventListener('change', (e) => {
    if (e.target.type === 'radio') e.target.closest('fieldset').querySelector('[data-rf-next]').disabled = false;
    live();
  });
  // a tap on a single-choice answer moves on after a beat (so the packs can be seen answering); keyboard waits for Next
  form.addEventListener('click', (e) => {
    const input = e.target.closest('label')?.querySelector('input[type="radio"]');
    if (!input || e.detail === 0) return;
    clearTimeout(root._t);
    root._t = setTimeout(() => { if (input.checked) next(); }, reduce.matches ? 120 : 480);
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  phone.addEventListener('change', () => document.documentElement.classList.toggle('is-buying', root.dataset.state === 'result' && phone.matches));
  const buy = root.querySelector('product-form');
  root.querySelector('[data-rf-singles]').addEventListener('click', () => { forceSingles = true; });
  root.querySelectorAll('[data-rf-add]').forEach((b) => b.addEventListener('click', () => { forceSingles = false; }));
  if (buy) buy.itemsOverride = () => (currentSet && !forceSingles ? [{ id: currentSet.id, quantity: 1 }] : chosen.map((s) => ({ id: P[s].id, quantity: 1 })));
  intro();
};

document.querySelectorAll('.rf').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('.rf').forEach(init));
