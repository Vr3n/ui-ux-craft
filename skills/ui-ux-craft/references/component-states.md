# Component states and patterns

Contents: state matrix · button · text input and forms · links · selection controls · lists and tables · dialogs and sheets · toasts and banners · navigation · loading, empty, error · copy

Most "unpolished" UI is missing states. Build all of them before you call a component done.

## State matrix (every interactive element)
| State | What must be true |
|---|---|
| Default | Looks clickable (shape, fill, or underline). Passes contrast. |
| Hover | Subtle change (fill step or elevation). Never the only cue. Pointer devices only. |
| Focus-visible | 2px ring in `--focus-ring`, 2px offset, 3:1 against the surface. Shown for keyboard, not for mouse clicks. |
| Active / pressed | Darker fill step or 1px shift. Immediate (under 100ms). |
| Disabled | Lower emphasis, `cursor: not-allowed`, still readable. Explain why when it is not obvious. |
| Loading | Keep the button's width, show a spinner, block repeat clicks, announce with `aria-busy`. |
| Error | Border plus icon plus text message. Not colour alone. |
| Selected / current | Fill or weight change plus `aria-current` or `aria-selected`. |

## Button
- One primary per view. Secondary is outlined or tinted. Tertiary is text-only.
- Label with a verb and an object: "Save changes", not "OK" or "Submit".
- Minimum 44px tall on touch, 28px for mouse. Padding of 12-16px horizontal.
- Use `<button>`, never `<div onclick>`. Use `<a>` for navigation.
- Destructive buttons look different (danger colour) and are never the default focus in a confirm dialog.
- Show progress on long actions; do not disable silently.

## Text input and forms
- Visible label above the input. Placeholder is an example, not a label (and must reach 4.5:1 if used).
- Help text under the field, linked with `aria-describedby`. Errors replace or follow help text, linked the same way.
- Input edge uses `--border-strong` (3:1). Height at least 44px on touch.
- Right keyboard: `type`, `inputmode`, `autocomplete`. Let people paste. Do not block.
- Validate on blur for format, on submit for completeness. Never clear what the person typed. Keep error text specific: "Enter a date like 14/03/2026", not "Invalid input".
- One column. Group related fields. Mark optional fields, not required ones, when most are required.
- Put the primary action at the end of the form, aligned to the fields. Keep Cancel visibly less strong.
- Win95 lesson: order fields the way people think, and pre-fill the common case.

## Links
- Underline links inside body text. Colour alone is not enough (HIG: do not rely on colour alone; WCAG 1.4.1).
- Visited state is optional. Focus ring required.
- Link text makes sense alone ("Read the pricing guide", not "click here").

## Selection controls
- Checkbox for many-of-many, radio for one-of-few, switch for instant on/off, select or combobox for long lists.
- The whole row is clickable, not only the box. Label is a `<label>`.
- Switch changes apply immediately. If a Save is needed, use a checkbox.
- Indeterminate state for parent checkboxes.

## Lists and tables
- Row height at least 44px for tappable rows (common iOS practice, matching the 44pt default control size).
- Right-align numbers, use tabular figures, left-align text. Sticky header for long tables.
- Sorting and filtering show their state in the control itself.
- Row actions: visible on focus and on touch, not hover-only. Overflow menu for rare actions.
- Narrow screens: turn rows into cards or allow the table to scroll inside its own `overflow-x: auto` container, not the page.

## Dialogs and sheets
- Use sparingly. Prefer inline editing, Undo, or a sheet for rare, costly actions.
- Focus moves into the dialog, stays inside it, returns to the trigger on close. Esc closes. Backdrop click closes unless data would be lost.
- Title says what the dialog does. Primary button repeats the verb. Destructive confirm names the thing: "Delete 'Q3 report'".
- Prefer Undo over "Are you sure?" for reversible actions. For irreversible ones, confirm explicitly.
- Use `<dialog>` or a tested library. Set `aria-modal`, labelled by the title.

## Toasts and banners
- Toast: short, non-critical, confirms an action ("Saved"). Offer Undo when useful. Do not auto-dismiss important or error content (HIG warns against timed UI); if it does auto-dismiss, keep it visible long enough to read and pause on hover and focus.
- Banner or inline alert: persistent, for errors and warnings that need action. Icon plus text plus colour. Use `role="status"` for polite, `role="alert"` for urgent.

## Navigation
- Show where you are (`aria-current="page"`) and what is open (tabs with `aria-selected`).
- Keep primary navigation visible. Hamburger menus hide options; Win95 beginners relied on visible cues. On small screens, a bottom tab bar (3-5 items) beats a hidden drawer for top tasks.
- Breadcrumbs or a visible Back for deep hierarchies. Win95's Parent Folder icon failed because it looked like a file; make navigation controls look like controls.
- Skip link first in the tab order.

## Loading, empty, error
- **Loading**: skeleton that matches the final layout, or spinner after 300ms. Never a blank screen. Never a layout jump when content arrives.
- **Empty**: say what this place is for, why it is empty, and the one action to fill it.
- **Error**: say what happened, what it affects, what to do. Offer Retry. Keep the person's work.
- **Partial**: show what loaded and mark what did not.
- **Offline**: say so, and say what still works.

## Copy
- Use the user's words. Sentence case. Verbs on buttons.
- Say what will happen, not how the system works.
- Numbers with units. Dates in the user's format.
- One idea per sentence. Cut "please", "simply", "just".
