import { chromium } from 'playwright';
const [,, url, sel, out, w='390'] = process.argv;
const b = await chromium.launch(); const W=Number(w);
const p = await b.newPage({ viewport: { width: W, height: W<800?844:900 }, deviceScaleFactor: W<800?2:1 });
await p.goto(url, { waitUntil: 'networkidle' });
await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.waitForTimeout(900);
await p.evaluate((s) => document.querySelector(s).scrollIntoView({block:'start'}), sel); await p.waitForTimeout(700);
await p.screenshot({ path: out }); await b.close();
