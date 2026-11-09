#!/usr/bin/env node
// Self-test for the dependency-free scripts. Run: node scripts/selftest.mjs
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseColor, wcagRatio, apcaLc, fixContrast, srgbToOklch, oklchToSrgb, toHex } from './lib/color.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const run = (script, args) => spawnSync('node', [join(here, script), ...args], { encoding: 'utf8' });
let n = 0; const t = (name, fn) => { fn(); n++; console.log(`ok  ${name}`); };
const c = (h) => parseColor(h);

t('WCAG ratio: black on white is 21', () => assert.ok(Math.abs(wcagRatio(c('#000'), c('#fff')) - 21) < 0.01));
t('WCAG ratio: #767676 on white is 4.54', () => assert.ok(Math.abs(wcagRatio(c('#767676'), c('#fff')) - 4.54) < 0.01));
t('WCAG ratio: #777 on white fails AA (4.48)', () => assert.ok(wcagRatio(c('#777'), c('#fff')) < 4.5));
t('APCA: black on white is about 106', () => assert.ok(Math.abs(apcaLc(c('#000'), c('#fff')) - 106.04) < 0.2));
t('APCA: light on dark is negative', () => assert.ok(apcaLc(c('#fff'), c('#0a84ff')) < 0));
t('parse: rgb(), hsl() and 3-digit hex agree', () => {
  assert.equal(toHex(c('rgb(255 0 0)')), '#FF0000'); assert.equal(toHex(c('hsl(0 100% 50%)')), '#FF0000'); assert.equal(toHex(c('#f00')), '#FF0000');
});
t('OKLCH round trip keeps the colour', () => { for (const h of ['#4f46e5', '#34c759', '#f5f5f7']) assert.equal(toHex(oklchToSrgb(srgbToOklch(c(h)))), h.toUpperCase()); });
t('fixContrast returns a passing colour', () => { const f = fixContrast(c('#999'), c('#fff'), 4.5); assert.ok(f && wcagRatio(f, c('#fff')) >= 4.5); });
t('contrast.mjs exit codes', () => { assert.equal(run('contrast.mjs', ['#000', '#fff']).status, 0); assert.equal(run('contrast.mjs', ['#999', '#fff']).status, 1); });

const dir = mkdtempSync(join(tmpdir(), 'uxc-'));
for (const brand of ['#4f46e5', '#facc15', '#ffffff']) {
  t(`gen-tokens + palette-audit agree for ${brand}`, () => {
    const css = join(dir, `t${brand.slice(1)}.css`);
    assert.equal(run('gen-tokens.mjs', ['--brand', brand, '--out', css]).status, 0);
    assert.equal(run('palette-audit.mjs', [css]).status, 0);
    assert.equal(run('lint-ui.mjs', [css]).status, 0);
  });
}
t('palette-audit catches a bad palette', () => {
  const css = join(dir, 'bad.css'); writeFileSync(css, ':root{--bg:#fff;--text:#111;--text-muted:#aaa}');
  assert.equal(run('palette-audit.mjs', [css]).status, 1);
});
t('lint-ui catches planted problems', () => {
  const bad = join(dir, 'bad'); execFileSync('mkdir', ['-p', bad]);
  writeFileSync(join(bad, 'a.html'), '<html><head><meta name="viewport" content="width=device-width, user-scalable=no"></head><body><div onclick="x()">go</div><img src="a.png"></body></html>');
  writeFileSync(join(bad, 'a.css'), '.b{outline:none;transition:all .2s;font-size:10px}');
  const r = run('lint-ui.mjs', [bad, '--json']); assert.equal(r.status, 1);
  const ids = JSON.parse(r.stdout).findings.map((f) => f.id);
  for (const id of ['click-on-div', 'img-no-alt', 'no-lang', 'zoom-blocked', 'no-focus-style', 'transition-all', 'tiny-text']) assert.ok(ids.includes(id), `missing ${id}`);
});
console.log(`\n${n} checks passed`);
