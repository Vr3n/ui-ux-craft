# Tooling: free CLI tools an agent can run

Contents: what to run when · our scripts · third-party CLIs with verified flags · colour libraries · what tools cannot find · token-economy tips · CI

Versions checked on npm in Nov 2026: axe-core 4.14.0, @axe-core/cli 4.14.0, pa11y 10.0.0, lighthouse 13.6.0, playwright 1.65.0, stylelint 18.0.0, culori 4.0.2, apca-w3 0.1.9, skills 1.7.6.

## What to run when
| Moment | Run | Time |
|---|---|---|
| After editing styles | `lint-ui.mjs src` | seconds |
| After changing colours | `palette-audit.mjs tokens.css`, `contrast.mjs` for single pairs | instant |
| Before showing a screen | `runtime-audit.mjs <url> --shots` | 20-60 s |
| Before release / in CI | `runtime-audit.mjs` plus Lighthouse or pa11y | 1-2 min |
| Picking a palette | `gen-tokens.mjs --brand` then `palette-audit.mjs` | instant |

## Our scripts (in `scripts/`)
- `contrast.mjs` - WCAG 2.x ratio and APCA Lc for one pair or a batch. Exits 1 on AA failure. `--fix` suggests a text colour or a background colour that passes without flipping light/dark.
- `palette-audit.mjs` - reads CSS custom properties (`:root` = light; `[data-theme=dark]`, `.dark`, or `prefers-color-scheme: dark` = dark) or JSON. Infers text/background, `on-*`, and control-edge pairs. Decorative `--border` is not checked; `--border-strong`, `--focus-ring`, `--icon*` are held to 3:1.
- `gen-tokens.mjs` - one brand colour in, a complete token CSS or JSON out, with every pair verified (it exits 1 if it cannot satisfy one).
- `lint-ui.mjs` - 18 static rules; `--grid 4` adds off-grid spacing.
- `runtime-audit.mjs` - Playwright + axe-core. Reports axe failures (WCAG 2.0 to 2.2 AA and best-practice tags), keyboard focus visibility (Tabs through up to 40 elements), target sizes (under 24px = error, under 44px on touch widths = warning), text under 12px, sideways overflow, zoom-blocking viewport, whether animations ignore Reduce Motion, console errors. `--shots` saves full-page screenshots; `--vision protanopia,deuteranopia,tritanopia,achromatopsia` saves colour-blindness previews through Chromium's vision-deficiency emulation.
- `lh-summary.mjs` - shrinks Lighthouse JSON to about 20 lines.
- `doctor.mjs`, `selftest.mjs` - environment check and script self-test.

Verified in this build: all of the above ran in a sandbox with real Chromium; `runtime-audit.mjs` returned 0 failures on a page built from the generated tokens and 9 rule failures plus the other planted problems on a deliberately broken page.

## Third-party CLIs
All three need a Chrome or Chromium. If Playwright is installed, its browser works for all of them.

### Lighthouse (accessibility + best practices score and failing audits)
```
CHROME_PATH=/path/to/chrome npx lighthouse http://localhost:3000 \
  --only-categories=accessibility,best-practices --output=json --output-path=lh.json \
  --chrome-flags="--headless=new --no-sandbox" --quiet
node scripts/lh-summary.mjs lh.json
```
Flags checked with `--help`: `--only-categories` (accessibility, best-practices, performance, seo, agentic-browsing), `--output` (json, html, csv), `--output-path` (or `stdout`), `--chrome-flags`, `--quiet`, `--preset`, `--form-factor`. Ran end to end in this build. `--no-sandbox` is for containers and CI only.

### pa11y (WCAG check with the htmlcs or axe runner)
```
npx pa11y http://localhost:3000 --runner axe --reporter json --config pa11y.json
```
`pa11y.json` when Chrome is not found automatically: `{"chromeLaunchConfig":{"executablePath":"/path/to/chrome","args":["--no-sandbox"]}}`. Flags checked: `--standard` (WCAG2A, WCAG2AA, WCAG2AAA), `--reporter` (cli, csv, json), `--runner` (htmlcs, axe), `--threshold`, `--ignore`. Exit code 2 when issues exceed the threshold. Ran with the axe runner in this build.

### axe CLI
```
npx @axe-core/cli http://localhost:3000 --tags wcag2a,wcag2aa --exit
```
Flags checked: `--rules`, `--tags`, `--save`, `--stdout`, `--exit` (exit 1 on failure), `--chrome-path`, `--chromedriver-path`. It drives Chrome through chromedriver, so versions must match. Not run in this build (no matching chromedriver); prefer `runtime-audit.mjs`, which uses the same axe-core engine through Playwright.

### Playwright
Browser automation for anything custom: `npm i -D playwright && npx playwright install chromium`. Useful options: `colorScheme: 'dark'`, `reducedMotion: 'reduce'`, `hasTouch`, `isMobile`, and a CDP session with `Emulation.setEmulatedVisionDeficiency`.

### Stylelint (optional)
`npm i -D stylelint` for CSS syntax rules and conventions. Add a rule set only if the team wants it enforced; `lint-ui.mjs` covers the UX-specific smells.

## Colour libraries (for custom scripts)
- `culori` (4.0.2): parse, convert, OKLCH, `wcagContrast`. Our `lib/color.mjs` was checked against it (lightness and chroma matched to 1e-7).
- `apca-w3` (0.1.9): reference APCA. Our APCA values matched it to three decimals on seven test pairs.

## What tools cannot find
Automated rules typically cover only part of the problems. They cannot tell you whether labels make sense, whether the flow is logical, whether focus order matches the visual order, whether alt text describes the right thing, or how a screen reader reads the page. They also miss "ugly" and "confusing". Keep the human steps in `review-checklist.md`.
Apple's native tools for Apple apps: Xcode Accessibility Inspector (checks contrast values and sizes), and testing with VoiceOver, Voice Control, and Full Keyboard Access on a real device.

## Token-economy tips for agents
- Prefer our summaries to raw JSON. A Lighthouse report is 150 KB; `lh-summary.mjs` is 20 lines.
- Run cheap checks first. Do not start a browser to find a missing `alt` that `lint-ui.mjs` finds in a second.
- Read `references/` files only when the task needs them. `SKILL.md` has the rules that matter most.
- Re-run only the failing script after a fix.
- Use `--json` and read only `failed`/`summary` fields when parsing.

## CI sketch
```
npm i -D playwright axe-core && npx playwright install --with-deps chromium
node .claude/skills/ui-ux-craft/scripts/lint-ui.mjs src
node .claude/skills/ui-ux-craft/scripts/palette-audit.mjs src/styles/tokens.css
npm run build && npx serve -l 4173 dist & npx wait-on http://localhost:4173
node .claude/skills/ui-ux-craft/scripts/runtime-audit.mjs http://localhost:4173 --out ux-report
```
(`serve` and `wait-on` are example helpers, not requirements.) The path shown is where `npx skills add -a claude-code` placed the skill in a test project; other agents use their own folder.
