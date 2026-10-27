// Spacing check (DECISIONS 243): run with the local preview up (node tools/preview/server.js), then
//   node qa/spacing.mjs            → laptop (1440) and phone (390), English (LOC=/ar node qa/spacing.mjs for Arabic)
// Fails on any heading stack (eyebrow → title → text) that isn't one --stack (14 px), or any gap between two
// sections that isn't one --section-y (about 101 px laptop, 56 px phone). Known exceptions are listed in SKIP with why.
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const LOC = process.env.LOC || ''; // LOC=/ar for Arabic
const PAGES = ['/', '/collections/all', '/pages/sets', '/products/clarity-serum', '/products/the-full-ritual', '/pages/about', '/pages/climate', '/pages/ingredients', '/pages/faq', '/pages/contact', '/pages/routines', '/pages/scan', '/pages/creators', '/blogs/journal', '/blogs/journal/how-to-layer-a-four-step-routine', '/search?q=serum'];
// Measured content edges that aren't real gaps: scroll stories (tall by design), sticky columns/bars measured away from
// their resting place, decorative images that overflow, arrow-link underlines, full-screen bands measured to their edge.
const SKIP = [/hero -> /, /routine -> template--bundles/, /sky -> /, /main -> template--(benefits|day)/, /builder -> template--faq/, /finder -> /,
  /bundles -> template--climate/];
const SKIP_STACK = [/ab-sky__/, /v2-ben__list/, /v2-pair__list/, /cluster/, /cst__steps/, /cst__agenda/, /^span\.$/, /ab-made__facts/, /cx__facts/, /cr-who/, /rf-row/, /a\.btn/, /a\.skc-link/, /ol\./, /ul\./, /dl\./, /div\./];
const b = await chromium.launch();
let fails = 0, checks = 0;
for (const w of [1440, 390]) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('bts:welcome', 'seen'); } catch (e) {} });
  const p = await ctx.newPage();
  for (const u of PAGES) {
    await p.goto(BASE + (u === '/' && LOC ? LOC : LOC + u), { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
    const r = await p.evaluate(() => {
      const vis = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && r.height > 0 && r.width > 0; };
      const name = (e) => (e.tagName.toLowerCase() + '.' + [...e.classList].slice(0, 2).join('.')).slice(0, 38);
      const sy = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--section-y')) || 0;
      const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;padding-top:var(--section-y);visibility:hidden'; document.body.append(probe);
      const secY = parseFloat(getComputedStyle(probe).paddingTop); probe.remove();
      const stacks = [];
      for (const eb of document.querySelectorAll('main .t-eyebrow')) {
        if (!vis(eb)) continue;
        let prev = eb, n = eb.nextElementSibling, k = 0;
        while (n && k < 2) { if (vis(n)) { stacks.push([name(n), Math.round(n.getBoundingClientRect().top - prev.getBoundingClientRect().bottom)]); prev = n; k++; } n = n.nextElementSibling; }
      }
      const secs = [...document.querySelectorAll('main > .shopify-section')].filter(vis);
      const ext = (s) => { let top = Infinity, bot = -Infinity;
        for (const e of s.querySelectorAll('*')) { if (!vis(e)) continue; const cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.position === 'absolute' || cs.position === 'sticky') continue;
          const bg = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== getComputedStyle(document.body).backgroundColor) || cs.backgroundImage !== 'none';
          const line = parseFloat(cs.borderBottomWidth) > 0; // an underlined link or a rule line is where the eye stops
          const text = [...e.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim());
          if (!(e.children.length === 0 || text || bg || line || ['IMG', 'BUTTON', 'INPUT', 'PICTURE'].includes(e.tagName))) continue;
          // clip to any scrolling or overflow-hidden parent: what it hides isn't seen
          let t0 = e.getBoundingClientRect().top, b0 = e.getBoundingClientRect().bottom;
          for (let a = e.parentElement; a && a !== s; a = a.parentElement) { const o = getComputedStyle(a); if (o.overflow !== 'visible' || o.overflowY !== 'visible') { const ar = a.getBoundingClientRect(); t0 = Math.max(t0, ar.top); b0 = Math.min(b0, ar.bottom); } }
          if (b0 <= t0) continue;
          top = Math.min(top, t0 + scrollY); bot = Math.max(bot, b0 + scrollY); }
        return [top, bot]; };
      const gaps = []; let prev = null;
      for (const s of secs) { const [t, bo] = ext(s); if (prev && isFinite(t)) gaps.push([prev.id.replace('shopify-section-', '') + ' -> ' + s.id.replace('shopify-section-', ''), Math.round(t - prev.b)]); if (isFinite(bo)) prev = { id: s.id, b: bo }; }
      return { stacks, gaps, secY };
    });
    for (const [n, g] of r.stacks) { if (SKIP_STACK.some((x) => x.test(n))) continue; checks++; if (Math.abs(g - 14) > 2) { fails++; console.log(`FAIL ${w} ${u} stack ${n}: ${g}px (want 14)`); } }
    for (const [n, g] of r.gaps) { if (SKIP.some((x) => x.test(n))) continue; checks++; if (Math.abs(g - r.secY) > 8) { fails++; console.log(`FAIL ${w} ${u} section ${n}: ${g}px (want ${Math.round(r.secY)})`); } }
  }
  await ctx.close();
}
await b.close();
console.log(`${checks - fails}/${checks} spacing checks passed`);
process.exit(fails ? 1 : 0);
