#!/usr/bin/env node
// Generate a complete, contrast-checked design-token file from one brand colour.
// Output: colour (light + dark), type scale, 4pt spacing, radius, elevation, motion, z-index, hit targets.
// Usage:
//   node gen-tokens.mjs --brand "#4f46e5" [--grid 4] [--base 16] [--ratio 1.2] [--radius 10]
//                       [--neutral-hue 265] [--neutral-chroma 0.012] [--format css|json] [--out tokens.css]
// Every text/background pair is verified before output. The script exits 1 if one cannot be made to pass.
import { writeFileSync } from 'node:fs';
import { parseColor, toHex, wcagRatio, srgbToOklch, oklchToSrgb, fixContrast } from './lib/color.mjs';

const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const brandIn = opt('brand');
if (!brandIn || !parseColor(brandIn)) { console.error('Usage: gen-tokens.mjs --brand "#4f46e5" [--grid 4] [--base 16] [--ratio 1.2] [--radius 10] [--format css|json] [--out file]'); process.exit(2); }
const grid = Number(opt('grid', 4)), base = Number(opt('base', 16)), ratio = Number(opt('ratio', 1.2)), radius = Number(opt('radius', 10));
const format = opt('format', 'css'), out = opt('out');

const brand = srgbToOklch(parseColor(brandIn));
const nH = Number(opt('neutral-hue', brand.H.toFixed(0))), nC = Number(opt('neutral-chroma', 0.012));
const mk = (L, C, H) => parseColor(toHex(oklchToSrgb({ L, C, H })));   // quantised to real 8-bit colour
const WHITE = parseColor('#ffffff'), INK = mk(0.2, nC, nH);
const failures = [], checks = [];

function ensure(c, bgs, target, label) {              // move colour (same side) until it passes on every bg
  let cur = c;
  for (let k = 0; k < 6; k++) {
    let changed = false;
    for (const b of bgs) {
      if (wcagRatio(cur, b) < target) { const f = fixContrast(cur, b, target, { cross: false }) ?? fixContrast(cur, b, target, { cross: true }); if (!f) { failures.push(`${label}: cannot reach ${target}:1`); return cur; } cur = f; changed = true; }
    }
    if (!changed) break;
  }
  return cur;
}
function makeFill(L, C, H, label) {                    // pick a readable "on" colour; darken the fill if neither works
  let fill = mk(L, C, H);
  if (wcagRatio(WHITE, fill) >= 4.5) return { fill, on: WHITE };
  if (wcagRatio(INK, fill) >= 4.5) return { fill, on: INK };
  const f = fixContrast(fill, WHITE, 4.5, { cross: false });
  if (!f) failures.push(`${label}: no readable text colour`);
  return { fill: f ?? fill, on: WHITE };
}
const shift = (c, dL) => { const o = srgbToOklch(c); return mk(Math.min(1, Math.max(0, o.L + dL)), o.C, o.H); };
const rec = (name, fg, bg, min) => { const r = wcagRatio(fg, bg); checks.push({ name, ratio: r, min }); if (r < min) failures.push(`${name} ${r.toFixed(2)}:1 < ${min}`); };

function buildTheme(dark) {
  const T = {};
  const bg = dark ? mk(0.17, nC, nH) : mk(0.985, nC, nH);
  const surface = dark ? mk(0.21, nC, nH) : WHITE;
  const raised = dark ? mk(0.25, nC, nH) : WHITE;
  const sunken = dark ? mk(0.14, nC, nH) : mk(0.962, nC, nH);
  const bgs = [bg, surface, raised, sunken];
  Object.assign(T, { bg, surface, 'surface-raised': raised, 'surface-sunken': sunken });

  T.text = ensure(dark ? mk(0.96, nC, nH) : INK, bgs, 7, 'text');
  T['text-muted'] = ensure(dark ? mk(0.74, nC, nH) : mk(0.45, nC, nH), bgs, 4.5, 'text-muted');
  T.border = dark ? mk(0.3, nC, nH) : mk(0.9, nC, nH);                                   // decorative hairline
  T['border-strong'] = ensure(dark ? mk(0.55, nC, nH) : mk(0.62, nC, nH), bgs, 3, 'border-strong'); // control edge, 3:1

  const acc = makeFill(brand.L, brand.C, brand.H, 'accent');
  T.accent = acc.fill; T['on-accent'] = acc.on;
  const onLight = acc.on === WHITE;
  const hov = shift(acc.fill, onLight ? -0.04 : 0.04), prs = shift(acc.fill, onLight ? -0.08 : 0.08);
  T['accent-hover'] = wcagRatio(acc.on, hov) >= 4.5 ? hov : acc.fill;
  T['accent-pressed'] = wcagRatio(acc.on, prs) >= 4.5 ? prs : T['accent-hover'];
  // Tinted backgrounds first, so every "-text" colour is checked against ALL of them (an independent audit caught this).
  const STATUS = [['success', 145, 0.72, 0.62, 0.17], ['warning', 80, 0.82, 0.8, 0.16], ['danger', 25, 0.68, 0.58, 0.2], ['info', 245, 0.7, 0.6, 0.15]];
  T['accent-bg'] = mk(dark ? 0.26 : 0.96, Math.min(brand.C, dark ? 0.06 : 0.04), brand.H);
  for (const [name, h] of STATUS) T[`${name}-bg`] = mk(dark ? 0.26 : 0.96, 0.035, h);
  const tints = ['accent-bg', ...STATUS.map(([n]) => `${n}-bg`)].map((k) => T[k]);
  const textBgs = [...bgs, ...tints];
  T['accent-text'] = ensure(acc.fill, textBgs, 4.5, 'accent-text');
  T['focus-ring'] = ensure(acc.fill, bgs, 3, 'focus-ring');
  for (const [name, h, Ld, Ll, c] of STATUS) {
    const f = makeFill(dark ? Ld : Ll, c, h, name);
    T[name] = f.fill; T[`on-${name}`] = f.on;
    T[`${name}-text`] = ensure(f.fill, textBgs, 4.5, `${name}-text`);
  }
  // record the pairs we guarantee
  for (const b of bgs) { rec(`text/${b === bg ? 'bg' : 'surface'}`, T.text, b, 7); rec('text-muted', T['text-muted'], b, 4.5); }
  rec('on-accent/accent', T['on-accent'], T.accent, 4.5); rec('accent-text/accent-bg', T['accent-text'], T['accent-bg'], 4.5);
  for (const b of bgs) { rec('border-strong', T['border-strong'], b, 3); rec('focus-ring', T['focus-ring'], b, 3); rec('accent-text', T['accent-text'], b, 4.5); }
  for (const n of ['success', 'warning', 'danger', 'info']) { rec(`on-${n}/${n}`, T[`on-${n}`], T[n], 4.5); for (const b of textBgs) { rec(`${n}-text`, T[`${n}-text`], b, 4.5); } }
  for (const b of tints) { rec('text/tint', T.text, b, 7); rec('text-muted/tint', T['text-muted'], b, 4.5); rec('accent-text/tint', T['accent-text'], b, 4.5); }
  return Object.fromEntries(Object.entries(T).map(([k, v]) => [k, toHex(v)]));
}
const light = buildTheme(false), dark = buildTheme(true);
const shadowRgb = (() => { const c = mk(0.2, 0.03, nH); return `${Math.round(c.r)} ${Math.round(c.g)} ${Math.round(c.b)}`; })();

// ---- scales ----
const rem = (px) => `${+(px / 16).toFixed(4)}rem`;
const sizes = Object.fromEntries([['xs', -2], ['sm', -1], ['base', 0], ['lg', 1], ['xl', 2], ['2xl', 3], ['3xl', 4], ['4xl', 5], ['5xl', 6]].map(([k, n]) => {
  const px = Math.max(12, Math.round(base * ratio ** n));
  const lhMul = px <= 18 ? 1.5 : px <= 28 ? 1.35 : px <= 40 ? 1.25 : 1.15;
  const lh = Math.max(grid, Math.round((px * lhMul) / grid) * grid);
  return [k, { size: px, lh }];
}));
const spaceSteps = [1, 2, 3, 4, 5, 6, 8, 10, 12, 16];
const space = Object.fromEntries(spaceSteps.map((n) => [n, n * grid]));
const radii = { sm: Math.round(radius * 0.6), md: radius, lg: Math.round(radius * 1.6), xl: Math.round(radius * 2.4) };

if (format === 'json') {
  const json = JSON.stringify({ brand: toHex(parseColor(brandIn)), light, dark, type: sizes, space, radius: radii }, null, 2);
  out ? writeFileSync(out, json) : console.log(json);
} else {
  const colorBlock = (t, indent) => Object.entries(t).map(([k, v]) => `${indent}--${k}: ${v};`).join('\n');
  const css = `/* ui-ux-craft tokens (generated) | brand ${toHex(parseColor(brandIn))} | ${grid}px grid | type ratio ${ratio}
   All text/background pairs below were checked: body text >= 7:1, muted/accent/status text >= 4.5:1, control edges + focus ring >= 3:1. */
:root {
  color-scheme: light dark;
  /* Colour (light) */
${colorBlock(light, '  ')}

  /* Type */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
${Object.entries(sizes).map(([k, v]) => `  --text-${k}: ${rem(v.size)}; --text-${k}-lh: ${rem(v.lh)};`).join('\n')}
  --weight-regular: 400; --weight-medium: 500; --weight-semibold: 600; --weight-bold: 700;
  --tracking-tight: -0.01em; --tracking-caps: 0.04em; --measure: 65ch;

  /* Space (${grid}px grid), radius, hit targets */
${Object.entries(space).map(([k, v]) => `  --space-${k}: ${rem(v)};`).join('\n')}
${Object.entries(radii).map(([k, v]) => `  --radius-${k}: ${rem(v)};`).join('\n')}
  --radius-full: 9999px;
  --target-touch: 2.75rem;    /* 44px: Apple default control size on iOS */
  --target-pointer: 1.75rem;  /* 28px: Apple default control size on macOS */
  --target-min: 1.5rem;       /* 24px: WCAG 2.2 AA floor */

  /* Elevation */
  --shadow-1: 0 1px 2px rgb(${shadowRgb} / 0.06), 0 1px 3px rgb(${shadowRgb} / 0.10);
  --shadow-2: 0 4px 8px -2px rgb(${shadowRgb} / 0.10), 0 2px 4px -2px rgb(${shadowRgb} / 0.06);
  --shadow-3: 0 12px 24px -4px rgb(${shadowRgb} / 0.14), 0 4px 8px -2px rgb(${shadowRgb} / 0.06);

  /* Motion */
  --dur-instant: 80ms; --dur-fast: 140ms; --dur-base: 220ms; --dur-slow: 360ms;
  --ease-standard: cubic-bezier(0.2, 0, 0, 1); --ease-out: cubic-bezier(0.16, 1, 0.3, 1); --ease-in: cubic-bezier(0.4, 0, 1, 1);

  /* Layers */
  --z-base: 0; --z-sticky: 100; --z-dropdown: 200; --z-overlay: 300; --z-modal: 400; --z-toast: 500;
}
:root[data-theme="light"] { color-scheme: light; }
:root[data-theme="dark"] { color-scheme: dark; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${colorBlock(dark, '    ')}
    --shadow-1: 0 1px 2px rgb(0 0 0 / 0.40), 0 1px 3px rgb(0 0 0 / 0.30);
    --shadow-2: 0 4px 8px -2px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.30);
    --shadow-3: 0 12px 24px -4px rgb(0 0 0 / 0.55), 0 4px 8px -2px rgb(0 0 0 / 0.35);
  }
}
:root[data-theme="dark"] {
${colorBlock(dark, '  ')}
  --shadow-1: 0 1px 2px rgb(0 0 0 / 0.40), 0 1px 3px rgb(0 0 0 / 0.30);
  --shadow-2: 0 4px 8px -2px rgb(0 0 0 / 0.45), 0 2px 4px -2px rgb(0 0 0 / 0.30);
  --shadow-3: 0 12px 24px -4px rgb(0 0 0 / 0.55), 0 4px 8px -2px rgb(0 0 0 / 0.35);
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-instant: 1ms; --dur-fast: 1ms; --dur-base: 1ms; --dur-slow: 1ms; }
}
`;
  out ? writeFileSync(out, css) : process.stdout.write(css);
}
const min = checks.reduce((a, c) => Math.min(a, c.ratio / c.min), Infinity);
console.error(`${checks.length} contrast pairs verified, ${failures.length} failures${failures.length ? ': ' + failures.join('; ') : ''}. Tightest pair is ${(min * 100 - 100).toFixed(1)}% above its minimum.`);
process.exit(failures.length ? 1 : 0);
