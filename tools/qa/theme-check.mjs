// Runs Shopify Theme Check (same engine as `shopify theme check`) against ../theme
import { themeCheckRun } from '@shopify/theme-check-node';
import path from 'node:path';
const root = path.resolve('../theme');
const res = await themeCheckRun(root, undefined, (m) => {});
const offenses = res.offenses || res;
const by = {};
for (const o of offenses) {
  const sev = ['error', 'warning', 'info'][o.severity] || o.severity;
  (by[sev] ||= []).push(`${o.check} ${path.relative(root, o.uri.replace('file://', ''))}:${(o.start?.line ?? 0) + 1} ${o.message}`);
}
for (const [sev, list] of Object.entries(by)) { console.log(`\n== ${sev.toUpperCase()} (${list.length})`); list.forEach((l) => console.log(l)); }
console.log(`\nTOTAL ${offenses.length}`);
