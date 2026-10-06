// Screenshot + console-error capture across viewports and locales.
// Usage: node qa/shots.js [path ...] [--full] [--vp=390,1440] [--loc=en,ar] [--out=dir]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const flags = Object.fromEntries(args.filter((a) => a.startsWith('--')).map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const paths = args.filter((a) => !a.startsWith('--'));
const BASE = process.env.BASE || 'http://localhost:4321';
const out = flags.out || path.resolve('qa/shots');
const vps = String(flags.vp || '390,1440').split(',').map(Number);
const locs = String(flags.loc || 'en').split(',');
const full = !!flags.full;
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const report = [];
for (const w of vps) {
  const h = w < 800 ? 844 : 900;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 800 ? 2 : 1, hasTouch: w < 800, isMobile: w < 800 });
  for (const loc of locs) {
    for (const p of paths.length ? paths : ['/']) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
      page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
      page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
      const url = BASE + (loc === 'ar' ? '/ar' + (p === '/' ? '' : p) : p);
      const res = await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      if (flags.scroll) { await page.evaluate((y) => window.scrollTo(0, Number(y)), flags.scroll); await page.waitForTimeout(700); }
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = `${loc}-${w}-${(p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home')}${flags.scroll ? '-s' + flags.scroll : ''}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: full });
      report.push({ url, status: res.status(), overflow, errors, shot: name });
      await page.close();
    }
  }
  await ctx.close();
}
await browser.close();
for (const r of report) console.log(`${r.status} ${r.url} overflowX=${r.overflow}px ${r.shot}${r.errors.length ? '\n   ' + r.errors.join('\n   ') : ''}`);
