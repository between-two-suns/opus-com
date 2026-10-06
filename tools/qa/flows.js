// Interaction tests: real browser, real clicks, mobile + desktop, EN + AR.
// Usage: node qa/flows.js   (BASE env overrides the preview URL)
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
const browser = await chromium.launch();
const count = (page) => page.$eval('[data-cart-count]', (e) => e.textContent.trim());

for (const loc of ['', '/ar']) {
  for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true }, { width: 1440, height: 900 }]) {
    const tag = `${loc || '/en'} ${vp.width}`;
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.isMobile, hasTouch: vp.hasTouch });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));

    // PDP add to bag
    await page.goto(`${BASE}${loc}/products/clarity-serum`, { waitUntil: 'networkidle' });
    await page.click('.pdp__atc');
    await page.waitForSelector('#CartDrawer[open]', { timeout: 4000 }).catch(() => {});
    ok(`${tag} PDP add opens drawer`, await page.$eval('#CartDrawer', (d) => d.open));
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

    // Forecast
    await page.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
    await page.locator('#forecast').scrollIntoViewIfNeeded();
    await page.click('[data-time-btn="pm"]');
    const included = await page.$$eval('.forecast__step [data-include]', (b) => b.filter((x) => x.checked).length);
    ok(`${tag} forecast PM excludes SPF`, included === 3, `included=${included}`);
    await page.click('[data-condition="ac"]');
    const keyShown = await page.$$eval('.forecast__step [data-key]:not([hidden])', (b) => b.length);
    ok(`${tag} forecast AC marks 2 key steps`, keyShown === 2, `key=${keyShown}`);
    ok(`${tag} forecast ambient state set`, (await page.$eval('#forecast', (f) => f.dataset.ac)) === 'true');
    const total = await page.$eval('[data-total]', (e) => e.textContent.trim());
    ok(`${tag} forecast total = sum of included`, /1,650\.00/.test(total), total);
    await page.click('[data-forecast-cta]');
    await page.waitForSelector('#CartDrawer[open]', { timeout: 4000 }).catch(() => {});
    const afterForecast = await page.$$eval('#CartDrawer .cart-line', (l) => l.length);
    ok(`${tag} forecast adds its routine`, afterForecast === 3, `lines=${afterForecast}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const before = Number(await count(page));
    await page.locator('.bundle-bar button[type="submit"]').first().click();
    await page.waitForTimeout(1000);
    const after = Number(await count(page));
    ok(`${tag} full-routine bundle adds 4`, after - before === 4, `${before}→${after}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Search modal + predictive
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.click('[data-open-dialog="SearchModal"]');
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
    const visible = await page.$$eval('#CollectionGrid > li', (l) => l.filter((x) => !x.hidden).length);
    ok(`${tag} concern filter (sun) narrows grid`, visible === 1, `visible=${visible}`);

    // Language switch round trip
    if (vp.width > 1000) {
      await page.goto(`${BASE}${loc}/products/clarity-serum`, { waitUntil: 'networkidle' });
      await page.click('#HeaderLang button');
      await page.waitForLoadState('networkidle');
      const dir = await page.evaluate(() => document.documentElement.dir);
      const path = new URL(page.url()).pathname;
      ok(`${tag} language switch keeps page`, path.endsWith('/products/clarity-serum') && dir === (loc ? 'ltr' : 'rtl'), `${path} dir=${dir}`);
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
    const sum = await rb.evaluate((el) => [...el.querySelectorAll('.builder__choice[aria-pressed="true"]')].reduce((t, b) => t + Number(b.dataset.price), 0));
    const shown = (await rb.locator('[data-total]').textContent()).replace(/[^\d]/g, '');
    ok(`${tag} builder total = sum of chosen`, Number(shown) === sum, `${shown} vs ${sum}`);
    const b0 = Number(await count(page));
    await rb.locator('[data-cta]').click();
    await page.waitForSelector('#CartDrawer[open]', { timeout: 4000 }).catch(() => {});
    ok(`${tag} builder adds chosen steps`, Number(await count(page)) - b0 === 3, `${b0}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const sets = await page.locator('.bundle').count();
    ok(`${tag} sets page lists 5 sets`, sets === 5, `sets=${sets}`);
    const duo = page.locator('.bundle[data-count="2"]').first();
    const b1 = Number(await count(page));
    await duo.locator('button[type="submit"]').click();
    await page.waitForSelector('#CartDrawer[open]', { timeout: 4000 }).catch(() => {});
    ok(`${tag} duo set adds 2`, Number(await count(page)) - b1 === 2, `${b1}→${await count(page)}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    ok(`${tag} no page errors`, errors.length === 0, errors.join(' | '));
    await ctx.close();
  }
}
await browser.close();
console.log(results.join('\n'));
const fails = results.filter((r) => r.startsWith('FAIL')).length;
console.log(`\n${results.length - fails}/${results.length} passed`);
process.exit(fails ? 1 : 0);
