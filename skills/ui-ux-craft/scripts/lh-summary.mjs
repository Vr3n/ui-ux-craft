#!/usr/bin/env node
// Turns a big Lighthouse JSON report (150 KB+) into ~20 lines an agent can read cheaply.
// Make the report:
//   CHROME_PATH=/path/to/chrome npx lighthouse <url> --only-categories=accessibility,best-practices \
//     --output=json --output-path=lh.json --chrome-flags="--headless=new --no-sandbox" --quiet
// Then:  node lh-summary.mjs lh.json [--max 3]
// Exit code 1 if the accessibility score is below 100 or any audit fails.
import { readFileSync } from 'node:fs';
const argv = process.argv.slice(2);
const file = argv.find((a, i) => !a.startsWith('--') && argv[i - 1] !== '--max');
const MAX = Number((argv[argv.indexOf('--max') + 1]) || 3);
if (!file) { console.error('Usage: lh-summary.mjs <lighthouse.json> [--max 3]'); process.exit(2); }
const r = JSON.parse(readFileSync(file, 'utf8'));
const cats = Object.entries(r.categories).map(([k, v]) => `${k} ${Math.round((v.score ?? 0) * 100)}`).join(' | ');
console.log(`Lighthouse ${r.lighthouseVersion} on ${r.finalDisplayedUrl || r.finalUrl}\n${cats}`);
const fails = Object.values(r.audits).filter((a) => a.score === 0 || (a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'numeric'));
for (const a of fails) {
  const items = a.details?.items || [];
  console.log(`\nFAIL ${a.id} (${items.length} item${items.length === 1 ? '' : 's'}): ${a.title}`);
  for (const it of items.slice(0, MAX)) {
    const n = it.node || it.subItems?.items?.[0]?.node;
    const line = n ? `${n.selector || ''}  ${(n.explanation || n.snippet || '').replace(/\s+/g, ' ').slice(0, 140)}`
      : (it.description || it.url || it.source || JSON.stringify(it)).toString().slice(0, 140);
    console.log(`  ${line}`);
  }
}
if (!fails.length) console.log('\nNo failing audits in the requested categories.');
const acc = r.categories.accessibility?.score;
process.exit(fails.length || (acc !== undefined && acc < 1) ? 1 : 0);
