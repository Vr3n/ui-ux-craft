# Apple HIG: verified numbers and how they carry to the web

Contents: what was read · text sizes · control sizes · contrast · colour rules · type styles · mapping to the web · not verified

## What was read
Read directly from developer.apple.com while building this skill (pages dated to Dec 2025 / Jun 2025 change logs): **Color**, **Typography**, **Accessibility**. Numbers below come from those pages. Other HIG pages (Layout, Motion, Materials, Components, Dark Mode) were not re-read in full; see the last section.

## Default and minimum text size (HIG Typography and Accessibility)
| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 17 pt | 11 pt |
| macOS | 13 pt | 10 pt |
| tvOS | 29 pt | 23 pt |
| visionOS | 17 pt | 12 pt |
| watchOS | 16 pt | 12 pt |

Thin custom fonts need bigger sizes than these. Offer at least 200% text enlargement (140% on watchOS).

## Default and minimum control size (HIG Accessibility)
| Platform | Default | Minimum |
|---|---|---|
| iOS, iPadOS | 44x44 pt | 28x28 pt |
| macOS | 28x28 pt | 20x20 pt |
| tvOS | 66x66 pt | 56x56 pt |
| visionOS | 60x60 pt | 28x28 pt |
| watchOS | 44x44 pt | 28x28 pt |

Many articles say "44pt minimum". Apple's own page says 44 is the **default** and 28 the **minimum** on iOS. This skill uses 44 as the touch target to aim for, 28 as the mouse default, and 24 CSS px as the hard floor (WCAG 2.2 AA 2.5.8). Padding: about 12 pt around controls with a bezel, about 24 pt around elements without one.

## Contrast (HIG Accessibility; based on WCAG AA)
| Text size | Weight | Minimum ratio |
|---|---|---|
| Up to 17 pt | all | 4.5:1 |
| 18 pt | all | 3:1 |
| any | bold | 3:1 |

Apple names both WCAG and APCA as acceptable measures and says Accessibility Inspector uses the WCAG AA values above. If your app does not meet the minimum by default, provide a higher-contrast scheme when Increase Contrast is on. Check light and dark separately.

## Colour rules (HIG Color)
- Do not use the same colour for different meanings.
- Colours must work in light, dark, and increased-contrast. Custom colours need variants for each.
- Do not rely on colour alone to tell objects apart, show interactivity, or carry essential information. Use labels or shapes too.
- Do not hard-code system colour values; they change between releases.
- Do not change the meaning of a semantic colour (do not use "separator" as a text colour, or "secondary label" as a background).
- Background levels: primary (whole view), secondary (groups inside it), tertiary (groups inside groups). Label levels: label, secondary, tertiary, quaternary, placeholder, separator, link.
- Glass (Liquid Glass): no colour of its own. Use colour sparingly on it; for primary actions colour the background, not the symbol or text; do not colour the background of many controls at once; avoid similar colours overlapping behind controls.
- Test in different lighting and on different displays. Colours look darker and more muted in bright light.
- Wide colour (Display P3) gives richer colour; keep sRGB variants where two P3 colours are hard to tell apart on sRGB.

## Type styles, iOS "Large" default size (HIG Typography)
| Style | Weight | Size | Leading | Emphasised |
|---|---|---|---|---|
| Large Title | Regular | 34 | 41 | Bold |
| Title 1 | Regular | 28 | 34 | Bold |
| Title 2 | Regular | 22 | 28 | Bold |
| Title 3 | Regular | 20 | 25 | Semibold |
| Headline | Semibold | 17 | 22 | Semibold |
| Body | Regular | 17 | 22 | Semibold |
| Callout | Regular | 16 | 21 | Semibold |
| Subhead | Regular | 15 | 20 | Semibold |
| Footnote | Regular | 13 | 18 | Semibold |
| Caption 1 | Regular | 12 | 16 | Semibold |
| Caption 2 | Regular | 11 | 13 | Semibold |

Other typography rules: minimise typefaces; prefer Regular, Medium, Semibold, Bold; prefer larger sizes with thin weights; keep primary content primary when text grows (not every label must grow); avoid truncation at large sizes; stack inline items when text gets large; reduce columns at large sizes.

## Accessibility behaviours worth copying (HIG Accessibility)
- Use simple gestures and offer a visible alternative for each.
- Support keyboard-only navigation. Do not override system shortcuts.
- Avoid time-boxed UI that auto-dismisses; prefer an explicit dismiss.
- No autoplay audio or video without controls. Allow opting out of flashing lights.
- Reduce Motion: tighten springs, track gestures, replace movement with fades, avoid blur transitions.
- For actions that are hard to recover from, ask for confirmation twice in the simplified Assistive Access mode. On the web: prefer Undo, or a confirmation that names the thing being deleted.

## Mapping to the web
| Apple idea | Web equivalent |
|---|---|
| Semantic system colours | CSS variables named by role (`--text`, `--surface`) |
| Dark Mode | `prefers-color-scheme` plus a `data-theme` override |
| Increase Contrast | `prefers-contrast: more` |
| Reduce Motion | `prefers-reduced-motion: reduce` |
| Dynamic Type | `rem` units, no fixed pixel line-heights for body, test at 200% text |
| Safe areas | `env(safe-area-inset-*)`, `viewport-fit=cover` |
| Text styles | Type tokens (`--text-lg`, `--text-lg-lh`) |
| SF Symbols | One consistent icon set with text labels |
| VoiceOver labels | Accessible names (`aria-label`, visible text, `alt`) |
| Full Keyboard Access | Everything reachable and visible with Tab, Enter, Space, Esc, arrows |

## Not verified in this build
Layout margins and safe areas, Motion durations, Materials, Components (buttons, sheets, navigation), and Dark Mode specifics were not read in full. If a task depends on those pages, fetch them: the HIG serves plain Markdown at `https://developer.apple.com/design/human-interface-guidelines/<page>.md` (for example `color.md`, `typography.md`).
