#!/usr/bin/env node
// Contrast checker. WCAG 2.x ratio + APCA Lc, with an auto-fix suggestion.
// Usage:
//   node contrast.mjs <fg> <bg> [--size 16] [--bold] [--ui] [--fix] [--json]
//   node contrast.mjs --batch pairs.json      ([["#111","#fff"],["#777","#fff",{"size":14}]])
// Exit code 1 when a pair fails WCAG AA (handy in CI).
import { readFileSync } from 'node:fs';
import { parseColor, toHex, wcagRatio, apcaLc, fixContrast } from './lib/color.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const val = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const positional = args.filter((a, i) => !a.startsWith('--') && !(args[i - 1] || '').match(/^--(size|batch)$/));

function requirement({ size, bold, ui }) {
  if (ui) return { aa: 3, aaa: 3, kind: 'UI part / graphic' };
  // WCAG "large text": >= 24px, or >= 18.66px (14pt) and bold.
  const large = size >= 24 || (bold && size >= 18.66);
  return large ? { aa: 3, aaa: 4.5, kind: 'large text' } : { aa: 4.5, aaa: 7, kind: 'normal text' };
}
// Advisory APCA floors (from the APCA readability guidance: 75 body, 60 content, 45 large, 30 spot).
function apcaFloor({ size, bold, ui }) {
  if (ui) return 30;
  if (size >= 36) return 45;
  if (size >= 24 || (bold && size >= 18.66)) return 60;
  return 75;
}

function check(fgS, bgS, o = {}) {
  const fg = parseColor(fgS), bg = parseColor(bgS);
  if (!fg || !bg) return { error: `cannot parse "${!fg ? fgS : bgS}" (use #hex, rgb(), hsl())` };
  if (bg.a < 1) return { error: 'background must be opaque; composite it first' };
  const opts = { size: Number(o.size ?? 16), bold: !!o.bold, ui: !!o.ui };
  const req = requirement(opts);
  const ratio = wcagRatio(fg, bg), lc = apcaLc(fg, bg), floor = apcaFloor(opts);
  const res = {
    fg: toHex(fg), bg: toHex(bg), ratio: +ratio.toFixed(2), kind: req.kind,
    AA: ratio >= req.aa, AAA: ratio >= req.aaa, apcaLc: +lc.toFixed(1), apcaFloor: floor, apcaOk: Math.abs(lc) >= floor,
  };
  if (!res.AA || (o.fix && !res.AAA)) {
    const target = res.AA ? req.aaa : req.aa;
    const f = fixContrast(fg, bg, target);      // change the text colour
    const g = fixContrast(bg, fg, target, { cross: false }); // or change the background colour (never flips light/dark)
    res.fix = {
      target,
      ...(f && { text: { color: toHex(f), ratio: +wcagRatio(f, bg).toFixed(2) } }),
      ...(g && { background: { color: toHex(g), ratio: +wcagRatio(fg, g).toFixed(2) } }),
    };
  }
  return res;
}
const line = (r) => r.error ? `ERROR ${r.error}` :
  `${r.fg} on ${r.bg}  WCAG ${r.ratio}:1 (${r.kind})  AA ${r.AA ? 'pass' : 'FAIL'}  AAA ${r.AAA ? 'pass' : 'no'}  APCA Lc ${r.apcaLc} (advisory >=${r.apcaFloor}: ${r.apcaOk ? 'ok' : 'low'})` +
  (r.fix ? `\n  to reach ${r.fix.target}:1 -> ` + [r.fix.text && `change text to ${r.fix.text.color} (${r.fix.text.ratio}:1)`, r.fix.background && `or change background to ${r.fix.background.color} (${r.fix.background.ratio}:1)`].filter(Boolean).join(' ') : '');

let results = [];
if (val('batch')) {
  const pairs = JSON.parse(readFileSync(val('batch'), 'utf8'));
  results = pairs.map(([f, b, o]) => check(f, b, o));
} else if (positional.length >= 2) {
  results = [check(positional[0], positional[1], { size: val('size', 16), bold: flag('bold'), ui: flag('ui'), fix: flag('fix') })];
} else {
  console.error('Usage: contrast.mjs <fg> <bg> [--size 16] [--bold] [--ui] [--fix] [--json] | --batch file.json');
  process.exit(2);
}
if (flag('json')) console.log(JSON.stringify(results, null, 2)); else results.forEach((r) => console.log(line(r)));
process.exit(results.some((r) => r.error || !r.AA) ? 1 : 0);
