// axe-core WCAG 2.2 AA scan across key routes, EN + AR, mobile + desktop.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
const BASE = process.env.BASE || 'http://localhost:4321';
const routes = ['/', '/collections/all', '/products/daily-reset-cleanser', '/pages/routines', '/pages/sets', '/pages/ingredients', '/pages/climate', '/pages/about', '/pages/faq', '/pages/contact', '/pages/scan', '/search?q=spf', '/cart', '/blogs/journal', '/blogs/journal/how-to-layer-a-four-step-routine', '/nope'];
const browser = await chromium.launch();
let total = 0;
const summary = {};
for (const loc of ['', '/ar']) for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 800 ? 844 : 900 } });
  for (const r of routes) {
    const page = await ctx.newPage();
    await page.goto(BASE + loc + r, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.querySelector('[data-preview-badge]')?.remove());
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    for (const v of res.violations) {
      const key = `${v.impact} ${v.id}`;
      summary[key] ||= { help: v.help, where: new Set(), nodes: [] };
      summary[key].where.add(`${loc || '/en'}${r}@${w}`);
      if (summary[key].nodes.length < 4) summary[key].nodes.push(v.nodes[0].target.join(' ') + ' :: ' + (v.nodes[0].failureSummary || '').split('\n').slice(1, 2).join(''));
      total += v.nodes.length;
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
for (const [k, v] of Object.entries(summary)) console.log(`\n${k} — ${v.help}\n  pages: ${[...v.where].slice(0, 6).join(', ')}${v.where.size > 6 ? ` (+${v.where.size - 6})` : ''}\n  ${v.nodes.join('\n  ')}`);
console.log(`\nTOTAL violation nodes: ${total}`);
