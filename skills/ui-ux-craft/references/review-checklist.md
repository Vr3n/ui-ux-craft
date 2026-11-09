# Review checklist, severity scale, and issue log

Contents: how to review · checklist · severity · issue template · resolution categories · report format

## How to review
1. Run the scripts first (`lint-ui`, `palette-audit`, `runtime-audit`). Do not spend human attention on what a script can find.
2. Open screenshots at 375, 768, 1280 px, light and dark.
3. Do the top task start to finish, using only the keyboard, then only a thumb-sized pointer (or a phone).
4. Write each problem as an issue (template below). Fix the severity 1 and 2 problems before polishing.

## Checklist
**Tasks and flow**
- [ ] Top 3 tasks written down. Top task takes the fewest, most visible steps.
- [ ] Every important action has a visible control.
- [ ] No required double-click, drag, long-press, or hover.
- [ ] State is always visible: where I am, what is open, what is saved, what is running.

**Visual**
- [ ] One focal point. Hierarchy survives the squint test.
- [ ] Spacing on the grid. Groups are clear by proximity.
- [ ] At most 4 text sizes, 3 weights, 2 font families, 1 accent.
- [ ] Colours come from tokens. No literal hex in components.
- [ ] Radii and shadows come from tokens. Nested radii are concentric.

**States**
- [ ] Every control has hover, focus-visible, active, disabled, loading, error.
- [ ] Every data view has empty, loading, error, partial.
- [ ] Forms keep input after an error and say how to fix it.

**Accessibility**
- [ ] Text 4.5:1 (3:1 large). Non-text 3:1. Both themes.
- [ ] Keyboard: every control reachable, order sensible, focus visible, no traps.
- [ ] Targets 44px touch / 28px mouse, never under 24px.
- [ ] Text scales to 200% without loss. No horizontal scroll at 320px.
- [ ] Colour is never the only signal.
- [ ] Reduced motion honoured. No auto-dismiss of important content. No autoplay.
- [ ] Headings in order, one `h1`, landmarks, `lang`, `title`, alt text, labels.
- [ ] Not verified by automation (needs a person): screen reader pass, real-device touch, cognitive load, content quality.

**Responsive**
- [ ] 320, 375, 768, 1280, 1920 px all look intended.
- [ ] Safe areas respected. `100dvh` not `100vh`.
- [ ] Touch and pointer both work (`pointer: coarse` changes sizes).

## Severity scale (from the Windows 95 case study)
| Level | Meaning |
|---|---|
| 1 | Person cannot continue the task. Fix before release. |
| 2 | Person completes the task only with considerable difficulty. Fix before release unless there is a strong reason. |
| 3 | Minor difficulty. Fix when you can; batch these. |

In Win95's database, 15% of problems were level 1, 43% level 2, 42% level 3. If your own list has no level 1 or 2 items, your testing is probably too gentle.

## Issue template
```
ID:            UX-014
Result/Problem: Two of five testers tried to paste the copied file into its source folder; nothing happened.
Recommendation: Allow it, and rename the copy slightly to avoid conflict.
Area:          Explorer / file transfer
Severity:      2
Owner:         <designer or developer>
Evidence:      test session 6, task "copy a file"; screenshot link
Status:        Open | Planned | Addressed | Somewhat | Not addressed | Undecided
```
Keep the log in one place (spreadsheet, issue tracker, or a `ux-issues.md`). Review it every week or two, grouped by owner. A fix counts as closed only after it is tested with a person.

## Resolution categories (Win95)
- **Addressed**: fixed and tested successfully.
- **Planned**: fix designed, waiting to be built.
- **Undecided**: unsure whether to fix, or whether a fix is feasible.
- **Somewhat**: fixed and tested; results satisfactory but some issues remain.
- **Not addressed**: will not fix (often a technical or schedule limit).

Before release, nothing should stay Planned or Undecided. Roll Somewhat and Not addressed items into the next version's list.

## Report format (what to hand back)
1. What was built or reviewed (one line).
2. Checks run and results (script names, counts, pass/fail).
3. Issues found, by severity, each with the fix or the next step.
4. What is not verified (screen reader, devices, real users).
