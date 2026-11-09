---
name: ui-ux-craft
description: Design and build high-fidelity, accessible, genuinely usable interfaces, and review existing ones. Use for any UI or UX work - screens, components, forms, dashboards, landing pages, design systems, design tokens, dark mode, typography, spacing, colour, motion, contrast, touch targets, accessibility audits. Grounded in the Windows 95 usability-engineering case study (test real top tasks, iterate, track issues) and Apple's Human Interface Guidelines (clarity, hierarchy, accessibility), and ships scripts that check contrast, generate verified token sets, lint code, and audit a live page in a browser. Trigger even when the user only says "make it look better", "polish this", "modern UI", "it feels off", "is this accessible", or "review my design".
license: MIT
compatibility: Scripts need Node 18+. Only runtime-audit.mjs needs playwright and axe-core (run scripts/doctor.mjs to check).
---

# UI/UX Craft

Make interfaces that look calm and finished, and that people can use without thinking about the interface.

## The idea

Two sources agree on one pattern, and it drives everything below.

- The Windows 95 team copied what felt familiar from Windows 3.1. Lab tests showed it did not help. Beginners needed over 9 minutes to find and open a program. The team then re-centred on the top-20 user tasks, built many fast prototypes, tested each, and logged every problem until it was closed. No detail of the first design survived unchanged.
- Apple's HIG asks for the same base: clear hierarchy, consistent meaning, system-like behaviour, and accessibility as a floor, not a bonus.

So: **start from what people do (tasks), express it with a small consistent visual system (tokens), and prove it with checks and real tests.** A good look that fails a task is a failure. A usable screen that looks careless loses trust.

Details and caveats on both sources: `references/principles.md`.

## Workflow

Do these in order. Skip a step only if the user already has it.

1. **Name the tasks.** Write the 3-5 things a person must do on this screen, as "Person wants to ___ in ___ steps". Rank them by how often they happen. Design the top one first. If you cannot name them, ask one short question.
2. **Set the tokens.** If the project has tokens, use them. If not, generate a verified set and base layer:
   `node scripts/gen-tokens.mjs --brand "#hex" --out tokens.css` and copy `assets/base.css`. Never hard-code colours, sizes, or spacing in components.
3. **Build every state.** Each control: default, hover, focus-visible, active, disabled, loading, error. Each data view: empty, loading, error, partial, full. See `references/component-states.md`. Most "unpolished" UI is missing states, not missing style.
4. **Verify, cheapest first** (see "Scripts"). Fix errors, then re-run.
   `lint-ui.mjs` (static) -> `palette-audit.mjs` / `contrast.mjs` (colour) -> `runtime-audit.mjs` (real browser).
5. **Look at it.** Take screenshots at 375, 768, 1280 px in light and dark and open them. Tools miss ugliness: while testing this skill, every automated check passed on a page whose headings had no space above them. Check alignment, spacing rhythm, hierarchy (is the main thing obvious in 2 seconds?), and one-colour-one-meaning.
6. **Report honestly.** List what you built, which checks ran with results, and what is still unverified (screen reader pass, real-device touch, real users). Never say "accessible" from automated results alone; automated tools find only part of the problems.

## Rules with numbers

| Area | Rule | Source |
|---|---|---|
| Text contrast | Body text 4.5:1 minimum; aim for 7:1 on body. Large text (24px, or 18.66px bold) 3:1. | WCAG 2.x; Apple lists 4.5:1 up to 17pt, 3:1 at 18pt or bold |
| Non-text contrast | Control edges, icons that carry meaning, focus rings: 3:1 | WCAG 1.4.11 |
| Type size | Body 16px (Apple iOS default 17pt, macOS 13pt). Do not go under 12px. | HIG sizes; 12px floor is this skill's choice |
| Weight | Avoid weights 100-300, especially small. Use 400/500/600/700. | HIG: avoid Ultralight, Thin, Light |
| Hit target | 44x44 on touch, 28x28 for mouse as default. Hard floor 24x24. | HIG default sizes; WCAG 2.2 AA 2.5.8 |
| Spacing | ~12 px around bezeled controls, ~24 px around unbezeled ones. Use one grid (4px). | HIG accessibility page |
| Text scaling | Layout must survive 200% text. Do not truncate to fit. | HIG |
| Colour alone | Never the only signal. Add icon, text, or shape. | HIG, WCAG 1.4.1 |
| Dark mode | Ship light and dark for every colour. Check contrast in both. Respect Increase Contrast. | HIG color |
| Motion | Short, purposeful. Under `prefers-reduced-motion`, drop movement, keep simple fades. No auto-dismiss timers for important content. | HIG accessibility |
| Focus | Visible keyboard focus on every interactive element. Never `outline: none` without a replacement. | WCAG 2.4.7 |
| Gestures | Every gesture action also has a visible button. | HIG |
| Fonts | At most 2 families. Prefer the system stack for app UI. | HIG typography |
| Primary action | One per view. Colour used for the primary action is not reused for decoration. | HIG color, Win95 findings |

## Scripts

All run with plain Node. Use `--json` where offered when you need to parse results. Paths are relative to this skill folder.

| Command | Use it to | Needs |
|---|---|---|
| `node scripts/contrast.mjs <fg> <bg> [--size 16] [--bold] [--ui] [--fix]` | Check one pair (WCAG + APCA). `--fix` suggests a passing colour. | nothing |
| `node scripts/palette-audit.mjs tokens.css` | Check every text/background pair in light and dark from CSS variables or JSON. | nothing |
| `node scripts/gen-tokens.mjs --brand "#hex" [--ratio 1.2] [--grid 4]` | Make colour (light+dark), type scale, spacing, radius, shadow, motion, z-index, hit-size tokens. All pairs pre-verified. | nothing |
| `node scripts/lint-ui.mjs src [--grid 4]` | Static scan of CSS/HTML/JSX/Vue/Svelte for 18 common UX and a11y mistakes. | nothing |
| `node scripts/runtime-audit.mjs <url> --shots` | Real browser: axe rules, keyboard focus, target sizes, tiny text, overflow, reduced motion, light+dark at 3 widths, screenshots, colour-blind previews. | playwright, axe-core |
| `node scripts/lh-summary.mjs lh.json` | Shrink a Lighthouse JSON report to ~20 lines. | Lighthouse output |
| `node scripts/doctor.mjs` | See what is installed; get exact install commands. | nothing |
| `node scripts/selftest.mjs` | Prove the scripts still work (known contrast values, token round-trip). | nothing |

Third-party CLIs (Lighthouse, pa11y, axe CLI), their verified flags, and when to choose each: `references/tooling.md`.

## Read more only when needed

- Starting a design or choosing a look: `references/visual-system.md`
- Deciding flows, labels, navigation, feedback, forms: `references/usability-rules.md` (Windows 95 lessons turned into rules)
- Anything Apple-specific, or web-versus-native questions: `references/apple-hig.md`
- Building components: `references/component-states.md`
- Final review, or writing up problems: `references/review-checklist.md`
- Choosing or running tools: `references/tooling.md`

## Gotchas

- Do not copy an Apple or Windows widget just because it is famous. Copy the reason it worked (visible, one click, always there).
- Brand colour is rarely a good text colour. Generate `accent` (fills), `on-accent` (text on fills), and `accent-text` (links) as three separate tokens.
- `100vh` breaks on phones. Use `100dvh` with a fallback.
- Hover is not a feature on touch screens. Anything that appears only on hover must also be reachable by focus and tap.
- Placeholder text is not a label. Keep a visible label.
- Do not hide the only path to a function inside a right-click or long-press menu. The Win95 lab found beginners did not use pop-up menus even after training.
- If a check cannot run (no browser, no network), say so. Do not guess results.
