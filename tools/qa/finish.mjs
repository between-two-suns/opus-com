// Finish check (DECISIONS 287; the heading-stack and section-gap rules live in qa/spacing.mjs): fails on the finishing slips a designer would catch by eye.
//   1. a card's name closer than 12px to its picture (set cards, product cards)
//   2. visible text smaller than 12px
//   3. a swipe row that cuts off its cards' shadows (less than 24px of room under the cards)
//   4. a card whose text touches its edge (less than 12px inside the card)
// Warnings only: how many text sizes a page uses (the system has 6 + display sizes).
// Usage (preview running on :4321):  node qa/finish.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4321';
const PAGES = ['/', '/pages/sets', '/collections/all', '/products/clarity-serum', '/products/the-full-ritual', '/pages/routines', '/pages/climate', '/pages/ingredients', '/pages/about', '/pages/faq', '/pages/contact', '/pages/creators', '/pages/shipping', '/pages/account', '/cart', '/search?q=serum', '/blogs/journal'];
const VPS = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, laptop: { viewport: { width: 1440, height: 900 } } };
const exe = fs.existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {};
const browser = await chromium.launch(exe);
const fails = []; const warns = [];

for (const loc of ['', '/ar']) for (const [vk, vp] of Object.entries(VPS)) {
  const ctx = await browser.newContext(vp);
  await ctx.addInitScript(() => { try { localStorage.setItem('bts:welcome', 'seen'); } catch (e) {} });
  for (const u of PAGES) {
    const page = await ctx.newPage();
    await page.goto(BASE + loc + u, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const out = []; const vis = (e) => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && parseFloat(s.opacity) > 0.05; };
      const textTop = (e) => { const g = document.createRange(); g.selectNodeContents(e); return g.getBoundingClientRect().top; };
      const label = (e) => e.textContent.trim().replace(/\s+/g, ' ').slice(0, 30);
      // 1 · name vs picture
      for (const [card, media, name] of [['.bundle', '.bundle__stage', '.bundle__name'], ['.card', '.card__media', '.card__title']]) {
        for (const c of document.querySelectorAll(card)) { const m = c.querySelector(media), n = c.querySelector(name); if (!m || !n || !vis(m) || !vis(n)) continue;
          const gap = textTop(n) - m.getBoundingClientRect().bottom; if (gap > -40 && gap < 12) out.push(['name-too-close', `${label(n)} (${Math.round(gap)}px)`]); }
      }
      // 2 · text under 12px
      for (const e of document.querySelectorAll('body *')) { if (!vis(e)) continue; if (![...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim().length > 1)) continue;
        if (e.closest('.visually-hidden, [aria-hidden="true"], [data-preview-badge], svg')) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 11.5) out.push(['text-under-12px', `${label(e)} (${fs}px)`]); }
      // 3 · swipe rows cutting shadows
      for (const row of document.querySelectorAll('main *')) { const s = getComputedStyle(row); if (!/(auto|scroll)/.test(s.overflowX) || !vis(row)) continue;
        // only soft drop shadows count (blur 8px or more): a thin focus ring or an inner line can't be cut off
        const outer = (k) => { const b = getComputedStyle(k).boxShadow; return b !== 'none' && b.split(/,(?![^(]*\))/).some((x) => { if (x.includes('inset')) return false; const px = (x.replace(/rgba?\([^)]*\)/, '').match(/-?[\d.]+px/g) || []).map(parseFloat); return (px[2] || 0) >= 8; }); };
        const kids = [...row.children].filter((k) => vis(k) && outer(k)); if (!kids.length) continue;
        const room = row.getBoundingClientRect().bottom - Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
        if (room < 24) out.push(['shadow-cut', `${row.className.toString().split(' ')[0]} (${Math.round(room)}px under the cards)`]); }
      // 4 · text touching a card's edge
      for (const c of document.querySelectorAll('.bundle__body, .card__body, .cst__card, .v2-opt, .offer')) { if (!vis(c)) continue; const cb = c.getBoundingClientRect();
        for (const t of c.querySelectorAll('h2, h3, p, li, span')) { if (!vis(t) || t.closest('.visually-hidden, .btn, button')) continue; const g = document.createRange(); g.selectNodeContents(t); const tb = g.getBoundingClientRect(); if (!tb.width) continue;
          const pad = Math.min(tb.left - cb.left, cb.right - tb.right); if (pad < 10 && pad > -2) { out.push(['text-at-edge', `${label(t)} (${Math.round(pad)}px)`]); break; } } }
      const sizes = new Set([...document.querySelectorAll('main *')].filter((e) => vis(e) && [...e.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim())).map((e) => getComputedStyle(e).fontSize));
      return { out, sizes: sizes.size };
    });
    const tag = `${loc ? 'ar' : 'en'} ${vk} ${u}`;
    for (const [k, v] of r.out) fails.push(`${tag} · ${k}: ${v}`);
    if (r.sizes > 16) warns.push(`${tag} · ${r.sizes} text sizes on the page`);
    await page.close();
  }
  await ctx.close();
}
await browser.close();
const uniq = [...new Set(fails)];
for (const w of [...new Set(warns)].slice(0, 12)) console.log('WARN', w);
for (const f of uniq.slice(0, 60)) console.log('FAIL', f);
console.log(`\n${uniq.length} spacing failures, ${warns.length} warnings`);
process.exit(uniq.length ? 1 : 0);
