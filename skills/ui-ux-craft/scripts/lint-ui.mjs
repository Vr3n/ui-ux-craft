#!/usr/bin/env node
// Fast static scan for common UI/UX/accessibility problems in CSS, HTML, JSX/TSX, Vue, Svelte.
// No dependencies. Cheap enough to run after every change.
// Usage: node lint-ui.mjs [dir-or-file ...] [--json] [--max 5] [--grid 4] [--warn-only]
// Exit code 1 when any "error" is found (unless --warn-only).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const val = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const targets = argv.filter((a, i) => !a.startsWith('--') && !['--max', '--grid'].includes(argv[i - 1]));
const MAX = Number(val('max', 5)), GRID = Number(val('grid', 0));
const EXT = new Set(['.css', '.scss', '.less', '.html', '.htm', '.jsx', '.tsx', '.vue', '.svelte', '.astro']);
const SKIP = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.turbo', '.cache', 'out']);

function* walk(p) {
  const st = statSync(p);
  if (st.isFile()) { if (EXT.has(extname(p))) yield p; return; }
  for (const e of readdirSync(p, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('.')) continue;
    yield* walk(join(p, e.name));
  }
}

const RULES = {
  'no-focus-style':   ['error', 'outline removed with no :focus-visible style in the same file. Keyboard users cannot see where they are.'],
  'tiny-text':        ['warn',  'Text under 12px is hard to read (Apple minimums: 11pt iOS, 10pt macOS; aim higher).'],
  'light-weight':     ['warn',  'Font weight 100-300 is thin and hard to read at small sizes (HIG: avoid Ultralight, Thin, Light).'],
  'transition-all':   ['warn',  '"transition: all" animates things you did not mean to and costs performance. List the properties.'],
  'click-on-div':     ['error', 'Click handler on div/span. It cannot be reached by keyboard. Use <button> or <a>.'],
  'img-no-alt':       ['error', '<img> without alt. Use alt="" for decoration, real text for meaning.'],
  'no-lang':          ['error', '<html> has no lang attribute. Screen readers pick the wrong voice.'],
  'no-viewport':      ['error', 'No <meta name="viewport">. Mobile layout will be wrong.'],
  'zoom-blocked':     ['error', 'Viewport blocks pinch-zoom (user-scalable=no or maximum-scale=1).'],
  'vh-unit':          ['warn',  '100vh is taller than the visible area on mobile browsers. Use 100dvh (with a vh fallback).'],
  'positive-tabindex':['warn',  'tabindex above 0 breaks natural tab order.'],
  'autoplay':         ['warn',  'Autoplay media. Give people control (HIG: avoid autoplay without controls).'],
  'hover-only':       ['warn',  ':hover styles with no :focus-visible in the same file. Keyboard users miss the feedback.'],
  'hardcoded-colors': ['info',  'Many literal colours outside token definitions. Move them into tokens (see gen-tokens.mjs).'],
  'no-reduced-motion':['warn',  'Animations exist but nothing handles prefers-reduced-motion.'],
  'z-index-chaos':    ['warn',  'Many different z-index values. Use a small layer scale (--z-dropdown, --z-modal ...).'],
  'off-grid':         ['info',  'Spacing value is not on the spacing grid.'],
  'color-only-error': ['info',  'Error/invalid state styled by colour only. Add an icon or text too.'],
};
const findings = {}; const add = (id, file, line, snippet) => { (findings[id] ||= []).push({ file, line, snippet: snippet.trim().slice(0, 110) }); };

let files = 0, hasAnim = false, hasReduced = false; const zvals = new Set(); const colorCount = {};
for (const t of targets.length ? targets : ['.']) {
  for (const f of walk(t)) {
    files++;
    const text = readFileSync(f, 'utf8'); const lines = text.split('\n');
    const isTokenFile = /token|theme|variables|colors?\.(css|scss)$/i.test(basename(f));
    const hasFocusVisible = /:focus-visible|:focus-within|focus-visible:|focus:ring|focus:outline|:focus\s*\{/.test(text);
    if (/@keyframes|animation\s*:|transition\s*:|animate-|transition-/.test(text)) hasAnim = true;
    if (/prefers-reduced-motion|motion-reduce:|motion-safe:/.test(text)) hasReduced = true;
    if (/:hover/.test(text) && !hasFocusVisible && /\.(css|scss|less)$/.test(f)) add('hover-only', f, 1, 'file has :hover but no :focus-visible');

    lines.forEach((ln, i) => {
      const n = i + 1;
      if (/outline\s*:\s*(none|0)\b/.test(ln) && !hasFocusVisible) add('no-focus-style', f, n, ln);
      let m;
      if ((m = ln.match(/font-size\s*:\s*([\d.]+)(px|rem|em)/))) { const px = m[2] === 'px' ? +m[1] : +m[1] * 16; if (px < 12) add('tiny-text', f, n, ln); }
      if (/text-\[(\d+)px\]/.test(ln) && +ln.match(/text-\[(\d+)px\]/)[1] < 12) add('tiny-text', f, n, ln);
      if (/font-weight\s*:\s*(100|200|300)\b/.test(ln) || /\bfont-(thin|extralight|light)\b/.test(ln)) add('light-weight', f, n, ln);
      if (/transition\s*:\s*all\b/.test(ln) || /\btransition-all\b/.test(ln)) add('transition-all', f, n, ln);
      if (/<(div|span)\b[^>]*\bon[Cc]lick\b/.test(ln) && !/role=["']button/.test(ln)) add('click-on-div', f, n, ln);
      if (/\b(100|[89]\d)vh\b/.test(ln) && /(height|min-height)\s*:/.test(ln) && !/dvh|svh/.test(ln)) add('vh-unit', f, n, ln);
      if (/tabindex=["']?[1-9]/i.test(ln)) add('positive-tabindex', f, n, ln);
      if (/<(video|audio)\b[^>]*\bautoplay\b/i.test(ln)) add('autoplay', f, n, ln);
      if (/z-index\s*:\s*(-?\d+)/.test(ln)) zvals.add(+ln.match(/z-index\s*:\s*(-?\d+)/)[1]);
      if (/(border|outline)(-color)?\s*:[^;]*\b(red|#f00|#ff0000|crimson)\b/i.test(ln) && !/icon|aria-|::before|::after/.test(ln)) add('color-only-error', f, n, ln);
      if (!isTokenFile && !/^\s*--[\w-]+\s*:/.test(ln) && !/var\(/.test(ln)) {
        const c = (ln.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length; if (c) colorCount[f] = (colorCount[f] || 0) + c;
      }
      if (GRID && (m = ln.match(/\b(padding|margin|gap|row-gap|column-gap|top|left|right|bottom)[\w-]*\s*:\s*([^;{}]+)/))) {
        for (const px of m[2].matchAll(/(-?[\d.]+)px/g)) { const v = Math.abs(+px[1]); if (v > 2 && v % GRID) { add('off-grid', f, n, ln); break; } }
      }
    });
    if (/\.(html|htm)$/.test(f)) {
      if (/<html\b/i.test(text) && !/<html\b[^>]*\blang=/i.test(text)) add('no-lang', f, 1, '<html> without lang');
      if (/<head\b/i.test(text) && !/<meta[^>]+name=["']viewport/i.test(text)) add('no-viewport', f, 1, 'no viewport meta');
    }
    for (const m of text.matchAll(/<meta[^>]+name=["']viewport["'][^>]*>/gi)) if (/user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(m[0])) add('zoom-blocked', f, text.slice(0, m.index).split('\n').length, m[0]);
    for (const m of text.matchAll(/<img\b[^>]*?>/gis)) if (!/\balt\s*=|\{\.\.\./.test(m[0])) add('img-no-alt', f, text.slice(0, m.index).split('\n').length, m[0].replace(/\s+/g, ' '));
  }
}
if (hasAnim && !hasReduced) add('no-reduced-motion', '(project)', 0, 'no prefers-reduced-motion anywhere');
if (zvals.size > 8) add('z-index-chaos', '(project)', 0, `${zvals.size} distinct z-index values: ${[...zvals].sort((a, b) => a - b).slice(0, 12).join(', ')}`);
const totalColors = Object.values(colorCount).reduce((a, b) => a + b, 0);
if (totalColors > 20) add('hardcoded-colors', '(project)', 0, `${totalColors} literal colours in ${Object.keys(colorCount).length} files; worst: ${Object.entries(colorCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} (${v})`).join(', ')}`);

const ids = Object.keys(findings).sort((a, b) => ['error', 'warn', 'info'].indexOf(RULES[a][0]) - ['error', 'warn', 'info'].indexOf(RULES[b][0]));
const errors = ids.filter((i) => RULES[i][0] === 'error').reduce((a, i) => a + findings[i].length, 0);
if (flag('json')) console.log(JSON.stringify({ files, findings: ids.map((id) => ({ id, severity: RULES[id][0], why: RULES[id][1], count: findings[id].length, examples: findings[id].slice(0, MAX) })) }, null, 2));
else {
  console.log(`Scanned ${files} files. ${ids.length ? `${ids.length} kinds of issue, ${errors} errors.` : 'No issues found.'}`);
  for (const id of ids) {
    const [sev, why] = RULES[id];
    console.log(`\n[${sev.toUpperCase()}] ${id} x${findings[id].length}: ${why}`);
    findings[id].slice(0, MAX).forEach((x) => console.log(`  ${x.file}${x.line ? ':' + x.line : ''}  ${x.snippet}`));
    if (findings[id].length > MAX) console.log(`  ... ${findings[id].length - MAX} more (use --max N)`);
  }
}
process.exit(errors && !flag('warn-only') ? 1 : 0);
