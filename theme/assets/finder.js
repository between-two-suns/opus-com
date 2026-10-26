/*
  Routines · the finder demo (DECISIONS 211, 215, 216, 219). Once started it takes the whole screen, like an app (close or
  the browser's back returns to the page). Three questions beside the four packs: how your skin feels by midday, what
  you'd like help with, then anything else we should know (choose any: breakouts, sensitive, prescription skincare, none). The packs move only for what has been answered. The matching
  rules are the skin check's (match() in skin-check.js, shared so the two never disagree). Every answer ends in a routine.
  The result: the set that holds exactly the suggested steps at its real price, each step with why it suits this visitor,
  one button (the bottom bar on phones). Answers stay in the page; nothing is stored or sent.
*/
const ORDER = ['type', 'concerns', 'more'];
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
  const packs = [...root.querySelectorAll('.rf-pack, .rf-mini img')];
  // demo of the small reacting packs in the phone's top bar: /pages/routines?view=finder&mini=1
  if (new URLSearchParams(location.search).has('mini')) root.classList.add('has-mini');
  const ar = document.documentElement.lang?.startsWith('ar');
  const progress = root.querySelector('[data-rf-progress]');
  const back = root.querySelector('[data-rf-back]');
  const hdrWrap = document.querySelector('.site-header-wrap')?.closest('.shopify-section');
  const hdr = () => hdrWrap && root.style.setProperty('--hdr', hdrWrap.offsetHeight + 'px');
  hdr(); if (hdrWrap && window.ResizeObserver) new ResizeObserver(hdr).observe(hdrWrap);
  const close = root.querySelector('[data-rf-close]');
  let pushed = false;
  let i = -1, picks = null, chosen = [], sets = true, complete = null, currentSet = null, forceSingles = false;

  const one = (n) => form.querySelector(`input[name="${n}"]:checked`)?.value;
  const all = (n) => [...form.querySelectorAll(`input[name="${n}"]:checked`)].map((x) => x.value);
  // the last question: breakouts and sensitivity feed the rules; prescription skincare is treated as sensitive skin
  const answers = () => {
    const more = all('more');
    return {
      type: one('type'),
      acne: more.includes('breakouts') ? 'yes' : 'no',
      react: more.includes('sensitive') || more.includes('rx') ? 'some' : 'no',
      rx: more.includes('rx'), sensitive: more.includes('sensitive'),
      concerns: all('concerns'),
    };
  };

  // the stage answers: suggested steps forward, optional ones back a little, a step that doesn't suit fades
  const stage = (states) => packs.forEach((li) => {
    const s = states[li.dataset.step] || 'off';
    if (li.dataset.state !== s && s === 'core') { li.classList.remove('is-pulse'); void li.offsetWidth; li.classList.add('is-pulse'); }
    li.dataset.state = s;
  });
  // nothing moves on an assumption: until the skin type is answered all four stand together
  const live = () => {
    if (i < 0 || !one('type')) return stage({ 1: 'core', 2: 'core', 3: 'core', 4: 'core' });
    const r = match(answers()), st = {};
    Object.entries(r.picks).forEach(([k, v]) => { st[k] = v.level === 'core' ? 'core' : 'opt'; });
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
    const open = name !== 'intro';
    root.classList.toggle('is-open', open);
    document.documentElement.classList.toggle('rf-open', open);
    close.hidden = !open;
    // the browser's back (or a phone's back swipe) closes the finder instead of leaving the page
    if (open && !pushed) { history.pushState({ rf: 1 }, ''); pushed = true; }
  };
  const copy = root.querySelector('.rf-copy');
  const top = () => { copy.scrollTop = 0; };
  const two = (x) => String(x).padStart(2, '0');
  const go = (n) => {
    // Next slides in from the right, Back from the left
    root.style.setProperty('--dx', n > i ? 1 : -1);
    i = n;
    const q = ORDER[n];
    show(q);
    back.hidden = true;
    progress.innerHTML = `<span class="rf-n" aria-hidden="true"><b>${two(n + 1)}</b>/${two(ORDER.length)}</span><span class="visually-hidden">${S.step_of.replace('__N__', n + 1).replace('__T__', ORDER.length)}</span>`;
    mark(n / ORDER.length);
    live();
    const fs = root.querySelector(`[data-screen="${q}"]`);
    (fs.querySelector('input:checked') || fs.querySelector('input'))?.focus({ preventScroll: true });
    top();
  };
  const intro = (refocus) => { i = -1; show('intro'); back.hidden = true; progress.textContent = ''; mark(0); live(); if (refocus) root.querySelector('[data-rf-start]').focus({ preventScroll: true }); };
  const leave = () => { if (pushed) history.back(); else intro(true); };
  window.addEventListener('popstate', () => { if (pushed) { pushed = false; intro(true); } });
  close.addEventListener('click', leave);
  root.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('is-open')) leave(); });
  const next = () => {
    const q = ORDER[i];
    if (!root.querySelector(`[data-screen="${q}"]`).classList.contains('rf-q--multi') && !one(q)) return;
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
    const p = picks[step] || {}, type = one('type');
    const fits = (p.fits || []).map((f) => (f === 'type' ? type && S.skin.replace('__T__', S.types[type]) : f === 'acne' ? S.breakouts : ''));
    const helps = [...fits, ...(p.concerns || []).map((c) => S.chips[c])].filter(Boolean);
    const li = document.createElement('li');
    li.className = 'rf-step' + (opt ? ' rf-step--opt' : '');
    li.dataset.step = step;
    li.style.setProperty('--sku', `var(--c-step-${step})`);
    li.innerHTML = `<label><input type="checkbox" value="${step}" ${checked ? 'checked' : ''} ${d.available ? '' : 'disabled'}>
      <span class="rf-step__img" aria-hidden="true"><img src="${d.img}" alt="" width="140" height="431" loading="lazy"></span>
      <span class="rf-step__txt"><span class="rf-step__name">${d.title}</span><span class="rf-step__when">${[d.am ? S.when_am : S.when_both, ...helps].join(' · ')}</span></span>
      <span class="rf-step__end"><span class="rf-step__price">${fmt(d.price)}</span><span class="rf-step__tog" aria-hidden="true" data-on="${root.dataset.remove}" data-off="${root.dataset.add}"></span></span></label>`;
    return li;
  };
  const list = root.querySelector('[data-rf-steps]'), also = root.querySelector('[data-rf-also]');
  const hero = root.querySelector('[data-rf-hero]'), why = root.querySelector('[data-rf-why]');
  let answered = null;
  // one sentence from the chosen steps and the visitor's answers, in routine order (wording from the pack benefits)
  const sentence = () => {
    const a = answered || {}, C = new Set(a.concerns || []);
    const oily = a.type === 'oily' || a.type === 'combination' || a.acne === 'yes';
    const dry = a.type === 'dry' || a.type === 'very_dry';
    const pick = { 1: oily ? '1_oil' : '1', 2: C.has('tone') || C.has('marks') ? '2_tone' : oily || C.has('oil') ? '2_oil' : '2_hydra', 3: C.has('barrier') ? '3_barrier' : C.has('dehydration') || dry ? '3_hydra' : '3', 4: '4' };
    const parts = chosen.map((s) => S.why[pick[s]]).filter(Boolean);
    if (!parts.length) return '';
    if (ar) return parts.map((x, k) => (k ? S.and + x : x)).join('، ') + '.';
    const t = parts.length > 1 ? parts.slice(0, -1).join(', ') + ` ${S.and} ` + parts.at(-1) : parts[0];
    return t[0].toUpperCase() + t.slice(1) + '.';
  };
  const result = (full) => {
    const a = answers();
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
    const forEl = root.querySelector('[data-rf-for]');
    // "Made for": the skin in one phrase ("Mildly dry, sensitive skin"); "Helps with": their goals
    const adj = [S.types[a.type], a.sensitive || a.rx ? S.adj_sensitive : '', a.acne === 'yes' ? S.adj_breakouts : ''].filter(Boolean);
    const skin = full || !a.type ? '' : S.skin.replace('__T__', ar ? adj.join(' و') : adj.join(', '));
    const goals = full ? [] : a.concerns.map((c) => S.chips[c]);
    forEl.hidden = !skin && !goals.length;
    forEl.innerHTML = (skin ? `<span><b>${forEl.dataset.label}</b>${skin}</span>` : '') + (goals.length ? `<span><b>${forEl.dataset.helps}</b>${goals.join(' · ')}</span>` : '');
    // "Before you start": the cautions that apply, in one line that opens
    const notes = { sensitive: !full && (a.sensitive || a.rx), rx: !full && a.rx };
    Object.entries(notes).forEach(([k, on]) => { root.querySelector(`[data-rf-note="${k}"]`).hidden = !on; });
    const before = root.querySelector('[data-rf-before]');
    before.hidden = !Object.values(notes).some(Boolean);
    before.open = false;
    // the chosen packs standing together (phones)
    hero.innerHTML = [1, 2, 3, 4].map((s, k) => `<img src="${P[s].img}" alt="" width="140" height="431" data-step="${s}" style="--h: ${P[s].h}; --k: ${k}">`).join('');
    answered = full ? null : a;
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
    why.textContent = sentence();
    hero.querySelectorAll('img').forEach((im) => { im.dataset.on = chosen.includes(Number(im.dataset.step)) ? '1' : '0'; });
    // the honest switch: the fourth step, only when the full set then costs less than adding it on its own
    const cBtn = root.querySelector('[data-rf-complete]');
    const fullSet = setFor([1, 2, 3, 4]);
    const others = [1, 2, 3, 4].filter((x) => x !== complete);
    const ready = complete && fullSet && others.every((x) => chosen.includes(x)) && !chosen.includes(complete);
    const single = complete ? P[complete]?.price || 0 : 0;
    const extra = ready ? fullSet.price - others.reduce((t, x) => t + (P[x]?.price || 0), 0) : 0;
    cBtn.hidden = !(ready && extra > 0 && extra < single);
    if (!cBtn.hidden) cBtn.textContent = S.complete_short.replace('__P__', P[complete].title).replace('__S__', fullSet.name).replace('__X__', fmt(extra));
    root.querySelectorAll('[data-rf-add]').forEach((b) => { b.disabled = !chosen.length; });
    txt('[data-rf-add] .btn__label', !chosen.length ? S.nothing : set ? S.add_set.replace('__S__', set.name) : chosen.length === 1 ? S.add_one : S.add_items.replace('__N__', chosen.length));
    root.querySelector('[data-rf-singles]').hidden = !set;
  };

  root.querySelector('[data-rf-start]').addEventListener('click', () => go(0));
  root.querySelectorAll('[data-rf-skip]').forEach((b) => b.addEventListener('click', () => result(true)));
  root.querySelectorAll('[data-rf-next]').forEach((b) => b.addEventListener('click', next));
  const prev = () => {
    if (root.dataset.state === 'result') go(ORDER.length - 1);
    else if (i > 0) go(i - 1);
    else leave();
  };
  back.addEventListener('click', prev);
  root.querySelectorAll('[data-rf-prev]').forEach((b) => b.addEventListener('click', prev));
  root.querySelectorAll('[data-rf-change]').forEach((b) => b.addEventListener('click', () => go(0)));
  root.querySelector('[data-rf-restart]').addEventListener('click', () => { form.reset(); form.querySelectorAll('[data-rf-next]').forEach((b) => { b.disabled = !b.closest('.rf-q--multi'); }); go(0); });
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
    // "None of these" stands alone
    if (e.target.name === 'more' && e.target.checked) form.querySelectorAll('input[name="more"]').forEach((x) => { if (x !== e.target && (x.value === 'none' || e.target.value === 'none')) x.checked = false; });
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
  const buy = root.querySelector('product-form');
  root.querySelector('[data-rf-singles]').addEventListener('click', () => { forceSingles = true; });
  root.querySelectorAll('[data-rf-add]').forEach((b) => b.addEventListener('click', () => { forceSingles = false; }));
  if (buy) buy.itemsOverride = () => (currentSet && !forceSingles ? [{ id: currentSet.id, quantity: 1 }] : chosen.map((s) => ({ id: P[s].id, quantity: 1 })));
  intro();
};

document.querySelectorAll('.rf').forEach(init);
document.addEventListener('shopify:section:load', (e) => e.target.querySelectorAll('.rf').forEach(init));
