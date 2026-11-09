#!/usr/bin/env node
// Browser audit of a running page: axe-core rules, keyboard focus visibility, touch-target size,
// tiny text, horizontal overflow, reduced-motion behaviour, console errors, screenshots,
// and colour-blindness previews. Checks light + dark at several widths.
//
// Needs (in your project):  npm i -D playwright axe-core  &&  npx playwright install chromium
// Usage: node runtime-audit.mjs <url> [--out ./ux-report] [--widths 375,768,1280] [--shots]
//                               [--vision protanopia,deuteranopia,tritanopia,achromatopsia] [--wait 500] [--no-axe]
// Prints a short summary, writes <out>/report.json. Exit 1 if serious problems are found.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const val = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? argv[i + 1] : d; };
const flag = (n) => argv.includes(`--${n}`);
const url = argv.find((a, i) => !a.startsWith('--') && !['--out', '--widths', '--vision', '--wait'].includes(argv[i - 1]));
if (!url) { console.error('Usage: runtime-audit.mjs <url> [--out dir] [--widths 375,768,1280] [--shots] [--vision list] [--wait ms] [--no-axe]'); process.exit(2); }
const out = val('out', './ux-report'), widths = val('widths', '375,768,1280').split(',').map(Number), wait = Number(val('wait', 500));
const vision = val('vision', '') === 'all' ? ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] : val('vision', '').split(',').filter(Boolean);
mkdirSync(out, { recursive: true });

const req = createRequire(join(process.cwd(), 'x.js'));
let chromium, axeSource = null;
try { ({ chromium } = req('playwright')); } catch { console.error('Missing "playwright". Run: npm i -D playwright && npx playwright install chromium'); process.exit(2); }
if (!flag('no-axe')) { try { axeSource = readFileSync(req.resolve('axe-core/axe.min.js'), 'utf8'); } catch { console.error('Missing "axe-core". Run: npm i -D axe-core (or pass --no-axe)'); process.exit(2); } }

// ---- runs inside the page ----
function inPageChecks({ touch }) {
  const short = (el) => {
    if (el.id) return `${el.tagName.toLowerCase()}#${el.id}`;
    const cls = (el.className && typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '');
    const txt = (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 24);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`;
  };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const res = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, smallTargets: [], tinyText: [], title: !!document.title.trim(), lang: !!document.documentElement.lang, h1: document.querySelectorAll('h1').length, zoomBlocked: false };
  const vp = document.querySelector('meta[name=viewport]'); if (vp && /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/i.test(vp.content)) res.zoomBlocked = true;
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=tab],[role=checkbox],[role=switch],[tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el)) continue;
    const s = getComputedStyle(el);
    if (el.tagName === 'A' && s.display === 'inline' && el.closest('p,li,span,td,dd,blockquote')) continue;   // inline links in text are exempt (WCAG 2.5.8)
    const r = el.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 24 || h < 24) res.smallTargets.push({ el: short(el), w, h, level: 'error' });                    // WCAG 2.2 AA floor
    else if (touch && (w < 44 || h < 44)) res.smallTargets.push({ el: short(el), w, h, level: 'warn' });     // Apple default control size on touch
  }
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode; if (!n.textContent.trim()) continue;
    const el = n.parentElement; if (!el || seen.has(el) || !visible(el)) continue; seen.add(el);
    const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 12) res.tinyText.push({ el: short(el), px: fs });
  }
  res.tinyText = res.tinyText.slice(0, 15); res.smallTargets = res.smallTargets.slice(0, 40);
  return res;
}
function tagFocusables() {
  const sel = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])';
  const base = {}; let i = 0;
  for (const el of document.querySelectorAll(sel)) {
    const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
    if (el.disabled || r.width === 0 || r.height === 0 || s.visibility === 'hidden') continue;
    el.setAttribute('data-uxa', String(i));
    base[i] = { boxShadow: s.boxShadow, bg: s.backgroundColor, border: s.borderTopColor + s.borderTopWidth, deco: s.textDecorationLine, name: (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 20) + '"') };
    i++;
  }
  window.__uxaBase = base; return i;
}
function readActive() {
  const el = document.activeElement; if (!el || !el.dataset || el.dataset.uxa === undefined) return null;
  const b = window.__uxaBase[el.dataset.uxa]; const s = getComputedStyle(el);
  const outline = s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  const changed = s.boxShadow !== b.boxShadow || s.backgroundColor !== b.bg || (s.borderTopColor + s.borderTopWidth) !== b.border || s.textDecorationLine !== b.deco;
  return { id: el.dataset.uxa, name: b.name, ok: outline || changed };
}

const browser = await chromium.launch();
const report = { url, when: new Date().toISOString(), axe: {}, custom: [], focus: null, motion: null, consoleErrors: [], files: [] };
const impactRank = { critical: 4, serious: 3, moderate: 2, minor: 1 };
let consoleSeen = new Set(); let okRuns = 0;

for (const width of widths) {
  for (const scheme of ['light', 'dark']) {
    const tag = `${width}-${scheme}`;
    const ctx = await browser.newContext({ viewport: { width, height: width < 500 ? 800 : 900 }, colorScheme: scheme, hasTouch: width <= 768, isMobile: width < 500 });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') consoleSeen.add(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => consoleSeen.add(String(e).slice(0, 160)));
    try { await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }); } catch (e) { console.error(`[${tag}] could not load ${url}: ${e.message.split('\n')[0]}`); await ctx.close(); continue; }
    await page.waitForTimeout(wait); okRuns++;

    if (axeSource) {
      await page.addScriptTag({ content: axeSource });
      const v = await page.evaluate(async () => {
        const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        return r.violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, url: x.helpUrl, count: x.nodes.length, nodes: x.nodes.slice(0, 3).map((n) => ({ target: n.target.join(' '), why: (n.failureSummary || '').split('\n').slice(1, 3).join(' ').slice(0, 180) })) }));
      });
      for (const x of v) { const k = x.id; const prev = report.axe[k]; if (!prev || x.count > prev.count) report.axe[k] = { ...x, seenIn: [...(prev?.seenIn || []), tag] }; else prev.seenIn.push(tag); }
    }
    const c = await page.evaluate(inPageChecks, { touch: width <= 768 }); report.custom.push({ tag, ...c });

    if (flag('shots')) { const f = join(out, `${tag}.png`); await page.screenshot({ path: f, fullPage: true }); report.files.push(f); }

    if (width === Math.max(...widths) && scheme === 'light') {
      const n = await page.evaluate(tagFocusables); const missing = []; const reachedSet = new Set();
      await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); window.scrollTo(0, 0); });
      for (let i = 0; i < Math.min(n + 2, 40); i++) { await page.keyboard.press('Tab'); const a = await page.evaluate(readActive); if (a) { reachedSet.add(a.id); if (!a.ok) missing.push(a.name); } }
      report.focus = { focusable: n, reachedByTab: reachedSet.size, noVisibleFocus: [...new Set(missing)].slice(0, 15) };
      // reduced motion comparison
      const count = (p) => p.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);
      const normal = await count(page);
      const ctx2 = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' }); const p2 = await ctx2.newPage();
      await p2.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {}); await p2.waitForTimeout(wait);
      const reduced = await count(p2); report.motion = { running: normal, runningWithReduceMotion: reduced }; await ctx2.close();
      for (const type of vision) { const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setEmulatedVisionDeficiency', { type }); const f = join(out, `vision-${type}.png`); await page.screenshot({ path: f }); report.files.push(f); }
    }
    await ctx.close();
  }
}
await browser.close();
if (!okRuns) { console.error(`No page could be loaded from ${url}. Is the dev server running?`); process.exit(2); }
report.consoleErrors = [...consoleSeen].slice(0, 10);
writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2));

// ---- summary ----
const ax = Object.values(report.axe).sort((a, b) => impactRank[b.impact] - impactRank[a.impact]);
const serious = ax.filter((x) => impactRank[x.impact] >= 3);
const L = [];
L.push(`UX audit ${url}  widths ${widths.join('/')}  light+dark`);
L.push(axeSource ? `axe: ${ax.length} rule failures (${serious.length} serious/critical)` : 'axe: skipped');
for (const x of ax.slice(0, 8)) L.push(`  [${x.impact}] ${x.id} x${x.count} ${x.nodes[0]?.target || ''}  ${x.url}`);
const over = report.custom.filter((c) => c.overflowX).map((c) => c.tag);
if (over.length) L.push(`OVERFLOW sideways scroll at: ${over.join(', ')}`);
if (report.custom.some((c) => c.zoomBlocked)) L.push('ZOOM BLOCKED by viewport meta');
const smallErr = report.custom.flatMap((c) => c.smallTargets.filter((t) => t.level === 'error').map((t) => ({ ...t, tag: c.tag })));
const smallWarn = report.custom.flatMap((c) => c.smallTargets.filter((t) => t.level === 'warn').map((t) => ({ ...t, tag: c.tag })));
if (smallErr.length) { L.push(`TARGETS under 24px (WCAG 2.2 AA): ${smallErr.length}`); smallErr.slice(0, 5).forEach((t) => L.push(`  ${t.el} ${t.w}x${t.h} @${t.tag}`)); }
if (smallWarn.length) { L.push(`TARGETS under 44px on touch widths (Apple default): ${smallWarn.length}`); smallWarn.slice(0, 3).forEach((t) => L.push(`  ${t.el} ${t.w}x${t.h} @${t.tag}`)); }
const tiny = report.custom.flatMap((c) => c.tinyText); if (tiny.length) L.push(`TEXT under 12px: ${tiny.length} e.g. ${tiny[0].el} ${tiny[0].px}px`);
if (report.focus) { L.push(`FOCUS: ${report.focus.reachedByTab}/${report.focus.focusable} focusable elements reached by Tab; ${report.focus.noVisibleFocus.length} with no visible focus style`); report.focus.noVisibleFocus.slice(0, 5).forEach((n) => L.push(`  ${n}`)); }
if (report.motion && report.motion.runningWithReduceMotion > 0 && report.motion.runningWithReduceMotion >= report.motion.running) L.push(`MOTION: ${report.motion.runningWithReduceMotion} animations still run with prefers-reduced-motion: reduce`);
if (!report.custom.every((c) => c.lang)) L.push('MISSING <html lang>'); if (!report.custom.every((c) => c.title)) L.push('MISSING <title>');
if (report.consoleErrors.length) L.push(`CONSOLE errors: ${report.consoleErrors.length} e.g. ${report.consoleErrors[0]}`);
L.push(`Report: ${join(out, 'report.json')}${report.files.length ? `  Images: ${report.files.length} in ${out}` : ''}`);
console.log(L.join('\n'));
process.exit(serious.length || over.length || smallErr.length || report.custom.some((c) => c.zoomBlocked) ? 1 : 0);
