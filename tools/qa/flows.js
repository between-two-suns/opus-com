// Interaction tests: real browser, real clicks, mobile + desktop, EN + AR.
// Usage: node qa/flows.js   (BASE env overrides the preview URL)
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
const browser = await chromium.launch();
const count = (page) => page.$eval('[data-cart-count]', (e) => (e.dataset.count ?? e.textContent).trim());
// After an add the bag no longer opens by itself: a confirmation card appears and its View bag opens the full bag.
const openBag = async (page, timeout = 5000) => {
  await page.waitForSelector('.added:not([hidden]) [data-added-bag]', { timeout }).catch(() => {});
  if (await page.$eval('#CartDrawer', (d) => d.open).catch(() => false)) return;
  await page.locator('.added:not([hidden]) [data-added-bag]').click({ timeout }).catch(() => {});
  await page.waitForSelector('#CartDrawer[open]', { timeout }).catch(() => {});
};

for (const loc of ['', '/ar']) {
  for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 1440, height: 900 }]) {
    const tag = `${loc || '/en'} ${vp.width}`;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    // The welcome card has its own test below; keep it out of the way of the other flows.
    await ctx.addInitScript(() => { try { localStorage.setItem('bts:welcome', 'seen'); } catch (e) {} });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // PDP add to bag
    await page.goto(`${BASE}${loc}/products/clarity-serum`, { waitUntil: 'networkidle' });
    await page.click('.pdp__atc');
    await page.waitForSelector('.added:not([hidden])', { timeout: 5000 }).catch(() => {});
    ok(`${tag} PDP add shows the added card`, await page.$eval('.added', (c) => !c.hidden).catch(() => false));
    ok(`${tag} added card names the product`, /clarity|كلاريتي/i.test(await page.$eval('.added__name', (e) => e.textContent).catch(() => '')));
    ok(`${tag} added card shows routine progress`, (await page.$$('.added .cart-progress span.is-on')).length === 1);
    ok(`${tag} bag stays closed until asked`, !(await page.$eval('#CartDrawer', (d) => d.open)));
    await openBag(page);
    ok(`${tag} View bag opens drawer`, await page.$eval('#CartDrawer', (d) => d.open));
    ok(`${tag} added card hides when the bag opens`, await page.$eval('.added', (c) => c.hidden));
    const lines = await page.$$eval('#CartDrawer .cart-line', (l) => l.length);
    ok(`${tag} drawer shows 1 line`, lines === 1, `lines=${lines}`);
    ok(`${tag} header count updated`, (await count(page)) === '1', `count=${await count(page)}`);
    ok(`${tag} focus moved into drawer`, await page.evaluate(() => document.getElementById('CartDrawer').contains(document.activeElement)));
    const upsell = await page.$$eval('#CartDrawer .cart-upsell__item', (l) => l.length);
    ok(`${tag} routine upsell shows 3 missing steps`, upsell === 3, `upsell=${upsell}`);

    await page.click('#CartDrawer .cart-line [data-step="1"]');
    await page.waitForFunction(() => document.querySelector('[data-cart-count]').textContent.trim() === '2', null, { timeout: 4000 }).catch(() => {});
    ok(`${tag} qty + updates count`, (await count(page)) === '2');
    await page.click('#CartDrawer .cart-upsell__item button');
    await page.waitForFunction(() => document.querySelectorAll('#CartDrawer .cart-line').length === 2, null, { timeout: 4000 }).catch(() => {});
    ok(`${tag} upsell add works`, (await page.$$eval('#CartDrawer .cart-line', (l) => l.length)) === 2);
    await page.click('#CartDrawer .cart-line [data-line-remove]');
    await page.waitForFunction(() => document.querySelectorAll('#CartDrawer .cart-line').length === 1, null, { timeout: 4000 }).catch(() => {});
    ok(`${tag} remove line works`, (await page.$$eval('#CartDrawer .cart-line', (l) => l.length)) === 1);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    ok(`${tag} Escape closes drawer`, !(await page.$eval('#CartDrawer', (d) => d.open)));

    // Sticky ATC appears after scrolling past buy box
    await page.evaluate(() => window.scrollTo(0, document.getElementById(document.querySelector('sticky-atc').dataset.target).getBoundingClientRect().bottom + window.scrollY + 300));
    await page.waitForTimeout(600);
    ok(`${tag} sticky add-to-bag appears on scroll`, await page.$eval('sticky-atc', (s) => s.classList.contains('is-visible')));

    // Routines page = the routine finder (DECISIONS 222): three questions, full screen once started, the result adds its set
    await page.goto(`${BASE}${loc}/pages/routines`, { waitUntil: 'networkidle' });
    ok(`${tag} routines page has one h1`, (await page.$$('h1')).length === 1);
    await page.click('[data-rf-start]');
    await page.waitForTimeout(500);
    ok(`${tag} finder opens full screen`, await page.$eval('.rf', (r) => r.classList.contains('is-open') && document.documentElement.classList.contains('rf-open')));
    await page.click('[data-screen="type"] .rf-opt >> nth=0');
    await page.waitForTimeout(1000);
    ok(`${tag} finder moves on after a skin type`, (await page.$eval('.rf', (r) => r.dataset.state)) === 'concerns');
    await page.click('[data-screen="concerns"] .rf-opt >> nth=1');
    await page.click('[data-screen="concerns"] [data-rf-next]');
    await page.waitForTimeout(500);
    await page.click('[data-screen="more"] .rf-opt >> nth=3');
    await page.click('[data-screen="more"] [data-rf-next]');
    await page.waitForTimeout(800);
    const rfName = await page.$eval('[data-rf-name]', (e) => e.textContent.trim());
    ok(`${tag} oily skin gets The Full Ritual`, (await page.$$eval('[data-rf-steps] .rf-step', (l) => l.length)) === 4 && rfName.length > 0, rfName);
    const finderLines0 = Number(await count(page)) ? (await page.evaluate(() => fetch('/cart.js').then((r) => r.json()))).items.length : 0;
    await page.locator('[data-rf-add]:visible').first().click();
    await page.waitForTimeout(2500);
    const finderLines = (await page.evaluate(() => fetch('/cart.js').then((r) => r.json()))).items.length;
    ok(`${tag} finder adds its routine as one set`, finderLines === finderLines0 + 1, `lines ${finderLines0}→${finderLines}`);
    await page.click('[data-rf-close]');
    await page.waitForTimeout(600);
    ok(`${tag} close returns to the page`, await page.$eval('.rf', (r) => !r.classList.contains('is-open') && r.dataset.state === 'intro'));

    // Home: the orbs hero line-up is shoppable in step order, the main CTA goes to the Full Ritual, the sets section adds a set
    await page.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
    const panels = await page.$$eval('.hh-row .hh-b a', (a) => a.map((x) => new URL(x.href).pathname));
    ok(`${tag} hero has 4 shoppable packs in step order`, panels.length === 4 && panels[0].endsWith('/products/daily-reset-cleanser') && panels[3].endsWith('/products/daily-defense-sunscreen-spf-50'), panels.join(' '));
    ok(`${tag} hero buy CTA goes to the Full Ritual`, (await page.$eval('.hh-btn--main', (a) => new URL(a.href).pathname)).endsWith('/products/the-full-ritual'));
    ok(`${tag} hero h1 is the headline`, (await page.$$('h1')).length === 1 && (await page.$eval('h1', (h) => h.textContent.trim().length)) > 0);
    const before = Number(await count(page));
    await page.locator('.setsx button[type="submit"], .bundles button[type="submit"]').first().click();
    await page.waitForFunction((n) => Number(document.querySelector('[data-cart-count]').textContent.trim() || 0) === n + 1, before, { timeout: 5000 }).catch(() => {});
    const after = Number(await count(page));
    ok(`${tag} home set card adds 1 bundle`, after - before === 1, `${before}→${after}`);
    await openBag(page, 4000);
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Pinned routine day: dots move the stage, the centred step can be added
    const pinned = await page.$eval('.dayline__stage', (d) => getComputedStyle(d).position === 'sticky');
    ok(`${tag} routine day is pinned`, pinned);
    await page.locator('.dayline__dot[data-go="2"]').click();
    await page.waitForFunction(() => document.querySelector('.dayline__step[data-index="2"]')?.classList.contains('is-active'), null, { timeout: 5000 }).catch(() => {});
    ok(`${tag} routine dot 03 brings step 3 to centre`, await page.$eval('.dayline__step[data-index="2"]', (s) => s.classList.contains('is-active')));
    const d0 = Number(await count(page));
    await page.locator('.dayline__step.is-active button[type="submit"]').click();
    await page.waitForFunction((n) => Number(document.querySelector('[data-cart-count]').textContent.trim() || 0) === n + 1, d0, { timeout: 5000 }).catch(() => {});
    ok(`${tag} routine day adds the centred step`, Number(await count(page)) === d0 + 1, `${d0}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Set pages explain themselves; FAQs follow the product
    await page.goto(`${BASE}${loc}/products/the-full-ritual`, { waitUntil: 'networkidle' });
    ok(`${tag} set page lists its 4 products`, (await page.$$eval('.bi__item', (l) => l.length)) === 4);
    ok(`${tag} set page works out the saving`, /147/.test(await page.$eval('.bi__saved', (e) => e.textContent)));
    ok(`${tag} set page has no empty FAQ rows`, (await page.$$eval('.faq summary', (l) => l.filter((x) => !x.textContent.trim()).length)) === 0);
    ok(`${tag} set page has no routine strip`, (await page.$$('.routine-strip')).length === 0);
    await page.goto(`${BASE}${loc}/products/clarity-serum`, { waitUntil: 'networkidle' });
    const faqN = await page.$$eval('.faq summary', (l) => l.length);
    // product.json FAQ (DECISIONS 182): 12 questions; the serum shows the 7 that aren't SPF-only or set-only
    ok(`${tag} serum FAQ skips SPF-only and set-only questions`, faqN === 7, `n=${faqN}`);
    if (vp.isMobile) ok(`${tag} phone PDP shows the buy bar from the start`, await page.$eval('sticky-atc', (s) => s.classList.contains('is-visible')));
    await page.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });

    // Search modal + predictive
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.locator('[data-open-dialog="SearchModal"]:visible').first().click();
    await page.waitForTimeout(350);
    await page.keyboard.type(loc ? 'سيروم' : 'serum');
    await page.waitForSelector('.predictive__product', { timeout: 4000 }).catch(() => {});
    const preds = await page.$$eval('.predictive__product', (l) => l.length);
    ok(`${tag} predictive search returns product`, preds >= 1, `n=${preds}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    if (vp.isMobile) {
      await page.click('[data-open-dialog="MenuDrawer"]');
      await page.waitForTimeout(400);
      ok(`${tag} mobile menu opens`, await page.$eval('#MenuDrawer', (d) => d.open));
      await page.keyboard.press('Escape');
    } else {
      await page.click('[data-mega-toggle]');
      ok(`${tag} mega menu opens`, !(await page.$eval('#MegaShop', (m) => m.hidden)));
      await page.keyboard.press('Escape');
      ok(`${tag} mega closes on Escape`, await page.$eval('#MegaShop', (m) => m.hidden));
    }

    await page.goto(`${BASE}${loc}/collections/all?concern=sun`, { waitUntil: 'networkidle' });
    const grid = await page.$$eval('#CollectionGrid > li', (l) => l.map((x) => ({ hidden: x.hidden, c: (x.querySelector('[data-concerns]')?.dataset.concerns || '').split(' ') })));
    const vis = grid.filter((x) => !x.hidden);
    ok(`${tag} concern filter (sun) narrows grid to sun picks`, vis.length > 0 && vis.length < grid.length && vis.every((x) => x.c.includes('sun')), `visible=${vis.length}/${grid.length}`);

    // Language switch round trip
    if (vp.width > 1000) {
      await page.goto(`${BASE}${loc}/products/clarity-serum`, { waitUntil: 'networkidle' });
      await page.click('.header-lang [data-lang-link]');
      await page.waitForLoadState('networkidle');
      const dir = await page.evaluate(() => document.documentElement.dir);
      const path = new URL(page.url()).pathname;
      ok(`${tag} language switch keeps page`, path.endsWith('/products/clarity-serum') && dir === (loc ? 'ltr' : 'rtl'), `${path} dir=${dir}`);
    }

    // Climate switch: picking a condition lifts its steps and prices the add button
    await page.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
    const cs = page.locator('climate-switch');
    await cs.locator('.cs__opt[data-c="ac"]').click();
    ok(`${tag} climate switch marks AC pressed`, (await cs.locator('.cs__opt[data-c="ac"]').getAttribute('aria-pressed')) === 'true');
    const keys = await cs.locator('.cs__key:not([hidden])').evaluateAll((b) => b.map((x) => x.dataset.step).sort().join(','));
    ok(`${tag} climate switch lifts AC steps (2,3)`, keys === '2,3', keys);
    const c0 = Number(await count(page));
    await cs.locator('[data-cta]').click();
    await openBag(page, 5000);
    ok(`${tag} climate switch adds its 2 steps`, Number(await count(page)) - c0 === 2, `${c0}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    // Sun = treat + protect = Clear & Protect Duo, so the bundle is added instead of two singles.
    await cs.locator('.cs__opt[data-c="sun"]').click();
    ok(`${tag} climate switch notes the matching duo`, await cs.locator('[data-bundle-match]').isVisible());
    const c1 = Number(await count(page));
    await cs.locator('[data-cta]').click();
    await openBag(page, 5000);
    ok(`${tag} climate switch (sun) adds 1 duo`, Number(await count(page)) - c1 === 1, `${c1}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Product page: routine tabs + callouts; mobile dock hands over to the buy bar
    await page.goto(`${BASE}${loc}/products/daily-reset-cleanser`, { waitUntil: 'networkidle' });
    ok(`${tag} PDP routine tabs mark current step`, (await page.locator('.pdp-tabs__link[aria-current="page"] .pdp-tabs__num').textContent()).trim() === '01');
    ok(`${tag} PDP shows 3 label callouts`, (await page.locator('.callouts__item').count()) === 3);
    if (vp.isMobile) {
      ok(`${tag} dock visible on mobile`, await page.locator('#Dock').isVisible());
      await page.waitForTimeout(400);
      const buying = await page.evaluate(() => document.documentElement.classList.contains('is-buying'));
      ok(`${tag} buy bar replaces dock while Add is off screen`, buying && await page.locator('sticky-atc.is-visible').count() === 1);
    } else {
      ok(`${tag} dock hidden on desktop`, !(await page.locator('#Dock').isVisible()));
    }

    // Sets page: routine builder + curated sets
    await page.goto(`${BASE}${loc}/pages/sets`, { waitUntil: 'networkidle' });
    const rb = page.locator('routine-builder');
    ok(`${tag} builder CTA disabled when empty`, await rb.locator('[data-cta]').isDisabled());
    await rb.locator('.builder__choice[data-step="2"]').click();
    ok(`${tag} builder choice toggles aria-pressed`, (await rb.locator('.builder__choice[data-step="2"]').getAttribute('aria-pressed')) === 'true');
    ok(`${tag} builder bottle lands on shelf`, await rb.locator('[data-slot="2"]').evaluate((s) => s.classList.contains('is-in')));
    await rb.locator('[data-preset="1,2,3"]').click();
    const on = await rb.locator('.builder__meter li.is-on').count();
    ok(`${tag} builder preset selects 3`, on === 3, `on=${on}`);
    const want = await page.evaluate(() => Math.floor(window.BTS.matchBundle(['1', '2', '3']).price / 100));
    const shown = (await rb.locator('[data-total]').textContent()).replace(/[^\d]/g, '');
    ok(`${tag} builder total = matching Night Ritual price`, Number(shown) === want, `${shown} vs ${want}`);
    ok(`${tag} builder button fits its panel`, await rb.locator('[data-cta]').evaluate((b) => b.getBoundingClientRect().right <= b.closest('.builder__summary').getBoundingClientRect().right + 1));
    const b0 = Number(await count(page));
    await rb.locator('[data-cta]').click();
    await openBag(page, 4000);
    ok(`${tag} builder adds the matching bundle`, Number(await count(page)) - b0 === 1, `${b0}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const sets = await page.locator('.bundle').count();
    ok(`${tag} sets page lists 5 sets`, sets === 5, `sets=${sets}`);
    const duo = page.locator('.bundle[data-count="2"]').first();
    const b1 = Number(await count(page));
    await duo.locator('button[type="submit"]').click();
    await openBag(page, 4000);
    ok(`${tag} duo set adds 1 bundle`, Number(await count(page)) - b1 === 1, `${b1}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Prices: whole pounds, comma thousands, EGP before (EN) / ج.م after (AR)
    const setPrice = (await page.locator('.bundle .bundle__now').first().textContent()).trim();
    ok(`${tag} bundle price in EGP format`, loc ? /^1,699 ج\.م$/.test(setPrice) : /^EGP 1,699$/.test(setPrice), setPrice);

    // Quantity limit: a bundle stops at 3
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
    await page.goto(`${BASE}${loc}/products/the-clear-protect-trio`, { waitUntil: 'networkidle' });
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.BTS.Cart.add([{ id: window.BTS.bundles.find((b) => String(b.steps) === '1,2,4').id, quantity: 1 }]));
    }
    await page.waitForTimeout(500);
    ok(`${tag} bundle quantity capped at 3`, (await count(page)) === '3', `count=${await count(page)}`);

    // Upgrade: Clear & Protect Duo in the bag → offer the Clear & Protect Trio, swap on click
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));
    await page.goto(`${BASE}${loc}/products/clear-protect-duo`, { waitUntil: 'networkidle' });
    await page.click('.pdp__atc');
    await openBag(page, 4000);
    ok(`${tag} bag offers the Trio upgrade`, await page.locator('#CartDrawer .cart-upgrade').isVisible());
    await page.locator('#CartDrawer [data-upgrade-line]').click();
    await page.waitForFunction(() => !document.querySelector('#CartDrawer .cart-upgrade'), null, { timeout: 5000 }).catch(() => {});
    const upLines = await page.$$eval('#CartDrawer .cart-line', (l) => l.map((x) => x.textContent));
    ok(`${tag} upgrade swaps duo for the Trio`, upLines.length === 1 && (await count(page)) === '1', `lines=${upLines.length} count=${await count(page)}`);

    // A three-step set in the bag: switching to The Full Ritual beats adding the missing step alone
    await page.keyboard.press('Escape');
    await page.evaluate(async () => { await fetch('/cart/clear.js', { method: 'POST' }); await fetch('/cart/add.js', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: [{ id: BTS.bundles.find((x) => String(x.steps) === '1,2,3').id, quantity: 1 }] }) }); });
    await page.reload({ waitUntil: 'networkidle' });
    await page.evaluate(() => BTS.openDialog('CartDrawer'));
    await page.waitForTimeout(500);
    const swapText = await page.locator('#CartDrawer .cart-upsell__item--swap').textContent().catch(() => '');
    ok(`${tag} bag offers the Full Ritual switch for the Night Ritual`, /400/.test(swapText) && /499/.test(swapText), swapText.replace(/\s+/g, ' ').trim());
    ok(`${tag} no separate SPF suggestion beside the switch`, (await page.locator('#CartDrawer .cart-upsell__item[data-step="4"]:not(.cart-upsell__item--swap)').count()) === 0);
    await page.locator('#CartDrawer .cart-upsell__item--swap [data-upgrade-line]').click();
    await page.waitForFunction(() => !document.querySelector('#CartDrawer .cart-upsell__item--swap'), null, { timeout: 5000 }).catch(() => {});
    const swHandles = await page.evaluate(() => fetch('/cart.js').then((r) => r.json()).then((c) => c.items.map((i) => i.handle).join(',')));
    ok(`${tag} switch leaves just The Full Ritual`, swHandles === 'the-full-ritual', swHandles);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await page.evaluate(() => fetch('/cart/clear.js', { method: 'POST' }));

    ok(`${tag} no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();

    // Creators: required fields block an empty submit; a full one shows the thank-you and takes focus
    const cctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    await cctx.addInitScript(() => { try { localStorage.setItem('bts:welcome', 'seen'); } catch (e) {} });
    const cp = await cctx.newPage();
    const cerr = [];
    cp.on('pageerror', (e) => cerr.push(e.message));
    await cp.goto(`${BASE}${loc}/pages/creators`, { waitUntil: 'networkidle' });
    ok(`${tag} creators shows 4 reels`, (await cp.locator('.cr-reel').count()) === 4);
    await cp.locator('.cr-hero a[href="#CreatorApply"]').click();
    await cp.waitForTimeout(600);
    ok(`${tag} creators CTA jumps to the form`, await cp.locator('#CreatorApply').evaluate((el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }));
    ok(`${tag} creators empty form is invalid`, !(await cp.locator('#CreatorForm').evaluate((f) => f.checkValidity())));
    await cp.fill('#Cr-name', 'Test Creator');
    await cp.fill('#Cr-email', 'creator@example.com');
    await cp.fill('#Cr-handle', '@testcreator');
    await cp.locator('.cr-check').first().click();
    await cp.locator('.cr-consent input').check();
    await Promise.all([cp.waitForNavigation({ waitUntil: 'networkidle' }), cp.locator('#CreatorForm [type="submit"]').click()]);
    await cp.waitForTimeout(500);
    ok(`${tag} creators thank-you shown`, await cp.locator('[data-cr-done]').isVisible());
    ok(`${tag} creators thank-you takes focus`, await cp.evaluate(() => document.activeElement?.hasAttribute('data-cr-done')));
    ok(`${tag} creators no page errors`, cerr.length === 0, cerr.join(' | '));
    await cctx.close();

    // Welcome card (fresh visitor): shows without taking focus, closes, stays closed
    const wctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const w = await wctx.newPage();
    await w.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
    ok(`${tag} welcome card hidden on arrival`, await w.locator('welcome-offer').isHidden());
    await w.evaluate(() => document.querySelector('welcome-offer').tryShow());
    await w.waitForTimeout(700);
    ok(`${tag} welcome card shows`, await w.locator('welcome-offer .welcome__card').isVisible());
    ok(`${tag} welcome card doesn't steal focus`, await w.evaluate(() => !document.querySelector('welcome-offer').contains(document.activeElement)));
    await w.locator('[data-welcome-close]').click();
    await w.waitForTimeout(500);
    ok(`${tag} welcome card closes`, await w.locator('welcome-offer').isHidden());
    await w.reload({ waitUntil: 'networkidle' });
    await w.evaluate(() => document.querySelector('welcome-offer').tryShow());
    await w.waitForTimeout(300);
    ok(`${tag} welcome card shows once per visitor`, await w.locator('welcome-offer').isHidden());
    await w.goto(`${BASE}${loc}/?customer_posted=true`, { waitUntil: 'networkidle' });
    await w.waitForTimeout(600);
    ok(`${tag} welcome reveals code after sign-up`, (await w.locator('[data-welcome-code]').textContent()).trim() === 'WELCOME75');
    ok(`${tag} welcome success takes focus`, await w.evaluate(() => document.activeElement?.id === 'WelcomeTitle'));
    await wctx.close();
  }
}
await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
