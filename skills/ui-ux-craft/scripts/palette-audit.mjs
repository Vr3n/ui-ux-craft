#!/usr/bin/env node
// Audit a colour palette (light + dark) for contrast. Reads CSS custom properties or a JSON file.
// Usage:
//   node palette-audit.mjs styles/tokens.css          (reads --custom-properties; dark = [data-theme=dark], .dark, or prefers-color-scheme: dark)
//   node palette-audit.mjs palette.json               ({"light":{...},"dark":{...},"pairs":[["text","bg","text"]]})
//   options: --json   --all (show passes too)
// Pair kinds: "text" needs 4.5:1, "large" needs 3:1, "ui" (borders of inputs, icons, focus rings) needs 3:1.
// Exit code 1 when any pair fails.
import { readFileSync } from 'node:fs';
import { parseColor, over, toHex, wcagRatio, fixContrast } from './lib/color.mjs';

const file = process.argv[2];
if (!file || file.startsWith('--')) { console.error('Usage: palette-audit.mjs <tokens.css|palette.json> [--json] [--all]'); process.exit(2); }
const asJson = process.argv.includes('--json'), showAll = process.argv.includes('--all');
const src = readFileSync(file, 'utf8');

// ---- read tokens ----
function blocks(css) {                       // returns [{selector, media, body}]
  const out = [];
  const walk = (text, media) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf('{', i);
      if (open < 0) break;
      const sel = text.slice(i, open).replace(/\/\*[\s\S]*?\*\//g, '').trim();
      let depth = 1, j = open + 1;
      while (j < text.length && depth) { if (text[j] === '{') depth++; else if (text[j] === '}') depth--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (sel.startsWith('@media') || sel.startsWith('@supports')) walk(body, sel); else out.push({ selector: sel, media: media || '', body });
      i = j;
    }
  };
  walk(css, '');
  return out;
}
function fromCss(css) {
  const themes = { light: {}, dark: {} };
  for (const b of blocks(css)) {
    const isDark = /dark/i.test(b.selector) || /prefers-color-scheme:\s*dark/i.test(b.media);
    const isLight = /^(:root|html|\*|body)$/.test(b.selector.trim()) || /light/i.test(b.selector);
    if (!isDark && !isLight && !/:root/.test(b.selector)) continue;
    const target = isDark ? themes.dark : themes.light;
    for (const m of b.body.matchAll(/--([\w-]+)\s*:\s*([^;]+?)\s*(?:;|$)/g)) {   // last declaration may omit the semicolon
      const value = m[2].trim();
      if (parseColor(value)) target[m[1]] = value;
    }
  }
  themes.dark = { ...themes.light, ...themes.dark };   // dark inherits what it does not override
  return themes;
}
let themes, userPairs = null;
if (file.endsWith('.json')) {
  const j = JSON.parse(src); themes = { light: j.light || {}, dark: j.dark ? { ...j.light, ...j.dark } : null }; userPairs = j.pairs || null;
  if (!themes.dark) delete themes.dark;
} else {
  themes = fromCss(src);
  if (!Object.keys(themes.dark).length || JSON.stringify(themes.dark) === JSON.stringify(themes.light)) delete themes.dark;
}

// ---- decide which pairs to test ----
const FG = /(^|-)(text|fg|foreground|ink|label|muted|subtle|secondary|tertiary|placeholder|link|heading|body|caption)(-|$)/;
const BG = /(^|-)(bg|background|surface|canvas|card|panel|page|base|elevated|raised)(-|$)/;
// Only borders that mark a control's edge need 3:1 (WCAG 1.4.11). Plain "border" is treated as decoration and skipped.
const UI = /(^|-)(border-strong|border-input|input-border|border-control|control-border|field-border|ring|focus|outline|icon)(-|$)/;
function inferPairs(tokens) {
  const names = Object.keys(tokens), pairs = [];
  const bgs = names.filter((n) => BG.test(n) && !FG.test(n) && !UI.test(n)).slice(0, 8);
  for (const n of names) {
    const on = n.match(/^(.*?)on-(.+)$/);          // e.g. color-on-accent pairs with color-accent
    if (on) {
      const partner = [`${on[1]}${on[2]}`, `${on[1]}${on[2]}-fill`, `${on[1]}${on[2]}-bg`, `${on[1]}bg-${on[2]}`].find((x) => names.includes(x));  // exact name wins
      if (partner) pairs.push([n, partner, 'text']);
      continue;
    }
    if (FG.test(n) && !BG.test(n)) bgs.forEach((b) => pairs.push([n, b, 'text']));
    else if (UI.test(n)) bgs.slice(0, 2).forEach((b) => pairs.push([n, b, 'ui']));
  }
  return pairs;
}

const need = { text: 4.5, large: 3, ui: 3 };
const report = { file, themes: {}, summary: { checked: 0, failed: 0 } };
for (const [theme, tokens] of Object.entries(themes)) {
  const pairs = userPairs || inferPairs(tokens);
  const rows = [];
  for (const [fn, bn, kind = 'text'] of pairs) {
    const f = parseColor(tokens[fn] ?? ''), b = parseColor(tokens[bn] ?? '');
    if (!f || !b) { rows.push({ fg: fn, bg: bn, kind, error: `missing token ${!f ? fn : bn}` }); continue; }
    const bg = over(b, { r: 255, g: 255, b: 255, a: 1 });   // flatten translucent backgrounds on white (approximation)
    const ratio = wcagRatio(f, bg), min = need[kind] ?? 4.5, pass = ratio >= min;
    const row = { fg: fn, fgHex: toHex(over(f, bg)), bg: bn, bgHex: toHex(bg), kind, ratio: +ratio.toFixed(2), min, pass };
    if (!pass) { const fix = fixContrast(f, bg, min); if (fix) row.suggest = toHex(fix); }
    rows.push(row);
  }
  report.themes[theme] = rows;
  report.summary.checked += rows.length; report.summary.failed += rows.filter((r) => r.error || !r.pass).length;
}
if (asJson) console.log(JSON.stringify(report, null, 2));
else {
  for (const [theme, rows] of Object.entries(report.themes)) {
    const bad = rows.filter((r) => r.error || !r.pass);
    console.log(`[${theme}] ${rows.length} pairs, ${bad.length} fail`);
    for (const r of showAll ? rows : bad) {
      console.log(r.error ? `  ERROR ${r.fg} / ${r.bg}: ${r.error}` :
        `  ${r.pass ? 'ok  ' : 'FAIL'} ${r.fg} ${r.fgHex} on ${r.bg} ${r.bgHex}  ${r.ratio}:1 (need ${r.min})${r.suggest ? `  -> try ${r.suggest}` : ''}`);
    }
  }
  if (!Object.keys(report.themes).length) console.log('No colour tokens found. Use --custom-properties with hex/rgb/hsl values.');
  else if (!report.summary.checked) console.log('Tokens found but no pairs could be inferred. Pass a JSON file with "pairs".');
}
process.exit(report.summary.failed ? 1 : 0);
