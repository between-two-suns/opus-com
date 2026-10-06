// Screenshots of interactive states (drawer, menu, forecast active, hero mid-scroll, mega menu).
import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const out = 'qa/shots';
const b = await chromium.launch();
for (const loc of ['', '/ar']) {
  const tag = loc ? 'ar' : 'en';
  const m = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await m.goto(`${BASE}${loc}/products/daily-reset-cleanser`, { waitUntil: 'networkidle' });
  await m.click('.pdp__atc'); await m.waitForSelector('#CartDrawer[open]'); await m.waitForTimeout(600);
  await m.screenshot({ path: `${out}/state-${tag}-drawer.png` });
  await m.keyboard.press('Escape'); await m.waitForTimeout(300);
  await m.click('[data-open-dialog="MenuDrawer"]'); await m.waitForTimeout(600);
  await m.screenshot({ path: `${out}/state-${tag}-menu.png` });
  await m.keyboard.press('Escape');
  await m.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
  await m.evaluate(() => window.scrollTo(0, 420)); await m.waitForTimeout(500);
  await m.screenshot({ path: `${out}/state-${tag}-hero-scroll.png` });
  await m.evaluate(() => document.querySelector('#forecast').scrollIntoView()); await m.waitForTimeout(300);
  await m.click('[data-condition="sun"]'); await m.click('[data-condition="ac"]'); await m.waitForTimeout(1000);
  await m.screenshot({ path: `${out}/state-${tag}-forecast.png` });
  await m.close();
  const d = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto(`${BASE}${loc}/`, { waitUntil: 'networkidle' });
  await d.click('[data-mega-toggle]'); await d.waitForTimeout(400);
  await d.screenshot({ path: `${out}/state-${tag}-mega.png` });
  await d.keyboard.press('Escape');
  await d.evaluate(() => document.querySelector('#forecast').scrollIntoView()); await d.waitForTimeout(300);
  await d.click('[data-condition="sun"]'); await d.click('[data-condition="humidity"]'); await d.waitForTimeout(1000);
  await d.screenshot({ path: `${out}/state-${tag}-forecast-desk.png` });
  await d.goto(`${BASE}${loc}/products/daily-barrier-moisturizing-cream`, { waitUntil: 'networkidle' });
  await d.evaluate(() => window.scrollTo(0, 700)); await d.waitForTimeout(700);
  await d.screenshot({ path: `${out}/state-${tag}-pdp-desk-scroll.png` });
  await d.close();
}
await b.close();
console.log('ok');
