# Visual system: how to make it look finished

Contents: hierarchy · colour · type · space · shape and elevation · motion · icons and imagery · dark mode · finishing details · quick polish pass

Start from tokens. `node scripts/gen-tokens.mjs --brand "#hex"` gives you a verified starting set. Everything below explains why the set looks the way it does, so you can change it with judgment.

## Hierarchy first
- One focal point per view. Squint at a screenshot: the one thing you see should be the primary action or the main content.
- Make hierarchy with four levers, in this order: **space, size, weight, colour**. Reach for colour last. Apple's HIG says to use weight, size and colour to show hierarchy, and to keep it when text size changes.
- Three text levels are enough for most UI: primary (`--text`), secondary (`--text-muted`), and a heading level. If you need a fourth, the layout is probably too dense.
- Group by proximity. Space inside a group should be about half the space between groups or less. People read "close" as "related".

## Colour
- Build from neutrals tinted a little with the brand hue (chroma about 0.01 in OKLCH). Pure grey next to a coloured accent looks dead. Pure black text on pure white is harsher than needed; the generator uses near-ink (L 0.2) on a near-white page.
- One accent. Use it for the primary action, links, selection, and focus. If most of the screen is accent, nothing is.
- Three accent tokens, not one: `accent` (fills), `on-accent` (text on fills), `accent-text` (links and small text). A brand colour that works as a fill often fails as text.
- Status colours (success, warning, danger, info) each get: fill, on-fill, text-on-surface, and a tinted background. Pair every status colour with an icon or word.
- Same colour, same meaning. HIG: do not use the same colour for different things. If brand blue means "clickable", plain text must not be blue.
- Work in OKLCH when making ramps. Equal lightness steps look equal; HSL ramps do not. `scripts/lib/color.mjs` has the conversions.
- Wide-colour displays: Display P3 can be richer than sRGB. On the web, define sRGB first and add `@media (color-gamut: p3)` variants only for hero colours (HIG suggests sRGB as the safe base).

## Type
- System font stack for app UI (`system-ui`). HIG says to use the system fonts through APIs; do not embed SF. For a branded site, one display face plus the system or one text face. Maximum two families.
- Scale: ratio 1.2 for dense app UI, 1.25-1.333 for editorial or marketing. Generator default: 12, 13, 16, 19, 23, 28, 33, 40, 48 px.
- Body 16px, line height 1.5. Headings 1.15-1.35. Lines of 45-75 characters (`--measure: 65ch`). HIG: use loose leading for wide columns; avoid tight leading for 3+ lines.
- Weights 400, 500, 600, 700. Avoid 100-300 (HIG). Medium or semibold is the usual "emphasis" weight; bold is for headings.
- Numbers in tables and prices: `font-variant-numeric: tabular-nums`. Headings: `text-wrap: balance`. Paragraphs: `text-wrap: pretty`.
- All caps only for short labels, with `letter-spacing: 0.04em`.
- Use `rem` so user font-size settings work. Test with browser text at 200%.
- Apple's tracking tables (HIG) apply to SF fonts only. With a custom font, apply light negative tracking (about -0.01em) to large headings and judge by eye.

## Space
- One grid: 4px. Components use multiples of 4 (`--space-*`). Off-grid values are how screens start to look "almost right". `lint-ui.mjs --grid 4` finds them.
- Padding: controls 8-16px, cards 16-24px, sections 48-96px. More space around the primary region than around chrome.
- Align on a few edges. Pick left edges and keep them. Optical alignment beats mathematical alignment for icons next to text.
- Between controls: about 12px padding around bezeled controls, about 24px around unbezeled ones (HIG accessibility page).

## Shape and elevation
- One radius family. Nested rounded shapes: inner radius = outer radius - padding, so curves stay concentric.
- Layers: page, surface (cards), raised (menus, popovers), overlay (modals). Use `--surface*` tokens, not ad-hoc greys.
- Light mode: separate with a hairline border plus a soft, low-opacity, two-layer shadow tinted toward the page hue. Avoid single heavy black shadows.
- Dark mode: higher means lighter. Use surface lightness steps; shadows barely show.
- Borders: decorative borders can be quiet (`--border`). Borders that mark an input's edge must reach 3:1 (`--border-strong`).

## Motion
- Purpose first: show cause and effect, keep context, give feedback. If it does none, cut it.
- Durations: 80ms (micro feedback), 140ms (hover, press), 220ms (panels), 360ms (large moves). Faster for small, slower for large.
- Easing: ease-out for things entering, ease-in for things leaving, standard for moves.
- Animate `transform` and `opacity` only. Never `transition: all`.
- Reduce Motion (HIG): reduce automatic and repetitive animation; tighten springs; track gestures directly; replace x/y/z transitions with fades; avoid animating into blurs. The base layer sets durations to about zero; add fades back where a change would otherwise be invisible.
- Nothing flashes more than three times a second. No auto-dismiss for content people may need to re-read (HIG).

## Icons and imagery
- One icon set, one stroke weight, drawn on one grid (24px typical). Align icon and text weight. Icons with meaning get a text label or an accessible name.
- Do not rely on an icon alone when it is not universal (a house, a magnifier, a cross are fine; most others need a label).
- Images: set width and height (no layout jump), compress, give `alt`. Decorative images: `alt=""`.
- Glass and blur: HIG says glass has no colour of its own and shows what is behind it. Apply colour sparingly, only to the primary action, and avoid placing similar colours over it. On the web: check text contrast against the worst-case backdrop, not the average.

## Dark mode
- Do not invert. Re-pick each token: lower chroma slightly for large fills, lift text, lift accents used as text (`accent-text` is re-solved for dark).
- Check contrast in both modes. HIG says the same. `palette-audit.mjs` reads both.
- Keep brand recognisable: same hue, adjusted lightness.
- Support Increase Contrast: `@media (prefers-contrast: more)` strengthens borders and muted text (the base layer does this).
- Test with the OS setting, not only a toggle in your app. Provide a manual toggle too (`data-theme`).

## Finishing details that make it feel expensive
- Hover, pressed, focus-visible, disabled and loading states all look designed (see `component-states.md`).
- Skeletons or spinners with fixed layout, so nothing jumps.
- Empty states with one sentence and one action.
- Selection colour (`::selection`), caret colour, scrollbar gutter (`scrollbar-gutter: stable`).
- Consistent capitalisation and punctuation. Real copy, not lorem ipsum.
- Click and hover areas larger than the visible shape. Cursor matches the action.
- No horizontal scroll at 320px. No content under notches (`env(safe-area-inset-*)`).

## Quick polish pass (5 minutes)
1. Squint test: is the focal point obvious?
2. Count text sizes and weights on the screen. More than 4 sizes or 3 weights: merge.
3. Count colours. One accent plus neutrals plus status only.
4. Nudge all spacing onto the grid.
5. Add the missing states.
6. Screenshot light and dark at 375 and 1280. Fix whatever you flinch at.
7. Run the scripts.
