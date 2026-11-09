#!/usr/bin/env node
// Reports which UX tools are ready in the current project and prints the exact install commands for the rest.
// Usage: node doctor.mjs
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const req = createRequire(join(process.cwd(), 'x.js'));
const has = (m) => { try { req.resolve(m); return true; } catch { return false; } };
const bin = (n) => existsSync(join(process.cwd(), 'node_modules', '.bin', n)) || spawnSync(process.platform === 'win32' ? 'where' : 'which', [n]).status === 0;
let chromeOk = false;
try { const { chromium } = req('playwright'); chromeOk = existsSync(chromium.executablePath()); } catch {}
const major = Number(process.versions.node.split('.')[0]);
const rows = [
  ['Node 18+', major >= 18, `found ${process.versions.node}`],
  ['playwright (browser automation)', has('playwright'), 'npm i -D playwright'],
  ['Chromium for Playwright', chromeOk, 'npx playwright install chromium'],
  ['axe-core (accessibility rules)', has('axe-core'), 'npm i -D axe-core'],
  ['lighthouse CLI (optional)', bin('lighthouse'), 'npm i -D lighthouse   (needs Chrome)'],
  ['pa11y CLI (optional)', bin('pa11y'), 'npm i -D pa11y   (needs Chrome)'],
];
for (const [name, ok, hint] of rows) console.log(`${ok ? 'ok     ' : 'MISSING'} ${name}${ok ? '' : '  ->  ' + hint}`);
const core = rows.slice(0, 4).every((r) => r[1]);
console.log(core ? '\nReady: runtime-audit.mjs will work. The other scripts (contrast, palette-audit, gen-tokens, lint-ui) need nothing installed.'
  : '\nThe five dependency-free scripts work now (contrast, palette-audit, gen-tokens, lint-ui). Install the MISSING items above to enable runtime-audit.mjs.');
