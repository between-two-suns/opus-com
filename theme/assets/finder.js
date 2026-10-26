/*
  Routines · the finder demo (DECISIONS 211). The skin check's questions and matching rules (match() in skin-check.js,
  shared so the two never disagree), shown one per screen beside the four packs. After every answer, and every tick on
  the last question, the packs answer: core steps stand forward, optional ones step back a little, the rest fade.
  The mark's two arcs close in as you go and meet on the result. Answers stay in the page; nothing is stored or sent.
*/
const ORDER = ['type', 'react', 'acne', 'concerns'];
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
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
  const answers = (fill) => ({
    type: one('type') || (fill ? 'normal' : undefined), react: one('react') || (fill ? 'no' : undefined),
    acne: one('acne') || (fill ? 'no' : undefined), concerns: [...form.querySelectorAll('input[name="concerns"]:checked')].map((x) => x.value),
  });

  // the stage answers: core forward, optional back a little, the rest faded (a step that changes gives a small lift)
  const stage = (states) => packs.forEach((li) => {
    const s = states[li.dataset.step] || 'off';
    if (li.dataset.state !== s && s === 'core') { li.classList.remove('is-pulse'); void li.offsetWidth; li.classList.add('is-pulse'); }
    li.dataset.state = s;
  });
  const live = () => {
    if (i < 0) return stage({ 1: 'core', 2: 'core', 3: 'core', 4: 'core' });
    const r = match(answers(true));
    if (r.guidance) return stage({});
    const st = {};
    Object.entries(r.picks).forEach(([k, v]) => { st[k] = v.level === 'core' ? 'core' : 'opt'; });
    // the serum waits for the last question (it is chosen by concern), so it isn't faded before it's been asked about
    if (i < 3 && !st[2]) st[2] = 'opt';
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
  };
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
    if (root.getBoundingClientRect().top < -40) root.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
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
  const row = (step, checked, opt) => {
    const d = P[step];
    const li = document.createElement('li');
    li.className = 'rf-step' + (opt ? ' rf-step--opt' : '');
    li.dataset.step = step;
    li.style.setProperty('--sku', `var(--c-step-${step})`);
    li.innerHTML = `<label><input type="checkbox" value="${step}" ${checked ? 'checked' : ''} ${d.available ? '' : 'disabled'}>
      <span class="rf-step__dot" aria-hidden="true">0${step}</span>
      <span><span class="rf-step__name">${d.title}</span><span class="rf-step__when">${d.am ? S.when_am : S.when_both}</span></span>
      <span class="rf-step__price">${fmt(d.price)}</span></label>`;
    return li;
  };
  const list = root.querySelector('[data-rf-steps]'), also = root.querySelector('[data-rf-also]');
  const result = (full) => {
    const r = full ? { guidance: false, sets: true, complete: null, picks: { 1: { level: 'core' }, 2: { level: 'core' }, 3: { level: 'core' }, 4: { level: 'core' } } } : match(answers(false));
    mark(1);
    back.hidden = false;
    progress.textContent = '';
    if (r.guidance) { show('guidance'); stage({}); root.querySelector('[data-screen="guidance"]').focus({ preventScroll: true }); return; }
    picks = r.picks; sets = r.sets; complete = r.complete;
    list.innerHTML = ''; also.innerHTML = '';
    [1, 2, 3, 4].forEach((s) => {
      const p = picks[s];
      if (!p || !P[s]?.id) return;
      (p.level === 'core' ? list : also).append(row(s, p.level === 'core' && P[s].available, p.level !== 'core'));
    });
    root.querySelector('[data-rf-also-title]').hidden = !also.children.length;
    show('result');
    update();
    root.querySelector('[data-screen="result"]').focus({ preventScroll: true });
    if (root.getBoundingClientRect().top < -40) root.scrollIntoView({ block: 'start', behavior: reduce.matches ? 'auto' : 'smooth' });
  };
  const update = () => {
    chosen = [...root.querySelectorAll('.rf-step input:checked')].map((x) => Number(x.value)).sort();
    const st = {};
    [1, 2, 3, 4].forEach((s) => { st[s] = chosen.includes(s) ? 'core' : picks?.[s] ? 'opt' : 'off'; });
    stage(st);
    const set = setFor(chosen);
    currentSet = set;
    const sum = chosen.reduce((t, s) => t + (P[s]?.price || 0), 0);
    root.querySelector('[data-rf-name]').textContent = set ? set.name : S.result;
    root.querySelector('[data-rf-total]').textContent = chosen.length ? fmt(set ? set.price : sum) : '';
    root.querySelector('[data-rf-was]').textContent = set && sum > set.price ? fmt(sum) : '';
    // when each step is used: the morning takes every chosen step; the night all but the sunscreen
    const dots = (arr) => `<i>${arr.map((s) => `<b style="--sku: var(--c-step-${s})">0${s}</b>`).join('')}</i>`;
    const am = chosen, pm = chosen.filter((s) => !P[s].am);
    root.querySelector('[data-rf-day]').innerHTML = chosen.length ? `<span>${root.dataset.am}${dots(am)}</span>${pm.length ? `<span>${root.dataset.pm}${dots(pm)}</span>` : ''}` : '';
    const note = root.querySelector('[data-rf-note]');
    note.hidden = !set;
    if (set) note.textContent = S.set_text.replace('__S__', set.name).replace('__P__', fmt(set.price)).replace('__Q__', fmt(sum));
    // the honest switch: the fourth step, only when the full set then costs less than adding it on its own
    const cBtn = root.querySelector('[data-rf-complete]');
    const full = setFor([1, 2, 3, 4]);
    const others = [1, 2, 3, 4].filter((x) => x !== complete);
    const ready = complete && full && others.every((x) => chosen.includes(x)) && !chosen.includes(complete);
    const single = complete ? P[complete]?.price || 0 : 0;
    const extra = ready ? full.price - others.reduce((t, x) => t + (P[x]?.price || 0), 0) : 0;
    cBtn.hidden = !(ready && extra > 0 && extra < single);
    if (!cBtn.hidden) cBtn.textContent = S.complete_text.replace('__P__', P[complete].title).replace('__S__', full.name).replace('__X__', fmt(extra)).replace('__Q__', fmt(single));
    const add = root.querySelector('[data-rf-add] .btn__label');
    root.querySelector('[data-rf-add]').disabled = !chosen.length;
    add.textContent = !chosen.length ? S.nothing : set ? S.add_set.replace('__S__', set.name) : chosen.length === 1 ? S.add_one : S.add_items.replace('__N__', chosen.length);
    root.querySelector('[data-rf-singles]').hidden = !set;
  };

  root.querySelector('[data-rf-start]').addEventListener('click', () => go(0));
  root.querySelectorAll('[data-rf-skip]').forEach((b) => b.addEventListener('click', () => result(true)));
  root.querySelectorAll('[data-rf-next]').forEach((b) => b.addEventListener('click', next));
  back.addEventListener('click', () => {
    const st = root.dataset.state;
    if (st === 'result' || st === 'guidance') go(ORDER.length - 1);
    else if (i > 0) go(i - 1);
    else intro();
  });
  root.querySelectorAll('[data-rf-change]').forEach((b) => b.addEventListener('click', () => go(0)));
  root.querySelector('[data-rf-restart]').addEventListener('click', () => { form.reset(); form.querySelectorAll('[data-rf-next][disabled], [data-rf-next]').forEach((b) => { b.disabled = !b.closest('.rf-q--multi'); }); intro(); });
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
    root._t = setTimeout(() => { if (input.checked) next(); }, reduce.matches ? 120 : 520);
  });
  form.addEventListener('submit', (e) => e.preventDefault());
  const buy = root.querySelector('product-form');
  root.querySelector('[data-rf-singles]').addEventListener('click', () => { forceSingles = true; });
  root.querySelector('[data-rf-add]').addEventListener('click', () => { forceSingles = false; });
  if (buy) buy.itemsOverride = () => (currentSet && !forceSingles ? [{ id: currentSet.id, quantity: 1 }] : chosen.map((s) => ({ id: P[s].id, quantity: 1 })));
  intro();
};

document.querySelectorAll('.rf').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('.rf').forEach(init));
