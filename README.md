# ui-ux-craft

A skill for AI coding agents. It helps them build interfaces that look finished **and** are easy to use.

It works with Claude Code, Cursor, Codex, and other agents that read `SKILL.md` skills.

## What problem does it solve?

AI tools often make screens that look fine in a screenshot but fail real people. Text is too pale. Buttons are too small. Keyboard users cannot see where they are. Dark mode is broken. Nobody tested the main task.

This skill gives the agent three things:

1. **Rules** that come from real evidence: Microsoft's Windows 95 usability study and Apple's Human Interface Guidelines.
2. **Tools** that check the work: contrast, spacing, accessibility, and a real browser test.
3. **A routine**: name the user's tasks, build with tokens, build every state, check, look, report.

## Who is it for?

- **Designers** - get tokens and checks that match your intent, and a shared language with developers.
- **Design engineers** - a fast loop: generate tokens, build, run the scripts, look at screenshots.
- **Developers** - rules with numbers, not opinions.
- **Product and QA** - a clear review checklist and a way to log and rank problems.

## Install

You need Node.js 18 or newer.

```bash
npx skills add YOUR-GITHUB-USERNAME/ui-ux-craft
```

Useful options of the same command:

```bash
npx skills add YOUR-GITHUB-USERNAME/ui-ux-craft --list          # see what is in the repo
npx skills add YOUR-GITHUB-USERNAME/ui-ux-craft -g              # install for all your projects
npx skills add YOUR-GITHUB-USERNAME/ui-ux-craft -a claude-code  # choose an agent
```

To test from a local copy: `npx skills add . --list` inside this folder.

(The command is `skills`, with an s. It is the open "skills" CLI. It copies the skill into the folder your agent reads.)

No npm? Copy the folder `skills/ui-ux-craft` into your agent's skills folder by hand.

## Use it

Just ask in normal words. Examples:

- "Build a settings page for our app. Use the ui-ux-craft skill."
- "This dashboard feels off. Polish it."
- "Is this form accessible? Check it and fix what you can."
- "Make a design token file from our brand colour #4f46e5, light and dark."

## What is inside

```
skills/ui-ux-craft/
  SKILL.md           the short instructions the agent always reads
  references/        deeper notes, read only when needed
  scripts/           tools the agent can run
  assets/base.css    a small starter style layer
```

### The tools, in plain words

| Tool | What it does |
|---|---|
| `contrast.mjs` | Tells you if two colours are easy enough to read together. Can suggest a fix. |
| `palette-audit.mjs` | Checks all the colour pairs in a stylesheet, light and dark. |
| `gen-tokens.mjs` | Makes a full style kit from one brand colour: colours, text sizes, spacing, shadows, motion. Every colour pair is already checked. |
| `lint-ui.mjs` | Scans your code for 18 common mistakes (no focus outline, tiny text, missing alt text, and more). |
| `runtime-audit.mjs` | Opens your page in a real browser. Tests accessibility rules, keyboard focus, button sizes, light and dark, three screen widths. Saves screenshots, and previews for colour-blind users. |
| `lh-summary.mjs` | Turns a big Lighthouse report into a short list. |
| `doctor.mjs` | Shows what is installed and what to install. |
| `selftest.mjs` | Proves the tools still work. |

Only `runtime-audit.mjs` needs extra installs: `npm i -D playwright axe-core` and `npx playwright install chromium`.

## Words you may meet

- **Token**: a named design value, like `--text` or `--space-4`. Change it once, it changes everywhere.
- **Contrast ratio**: how different two colours are in brightness. Higher is easier to read. Body text needs at least 4.5 to 1.
- **WCAG**: the web accessibility rules. **APCA**: a newer way to measure contrast, closer to how eyes work.
- **Focus ring**: the outline that shows which item the keyboard is on.
- **Hit target**: the area you can tap or click. Apple's default on iPhone is 44 by 44 points.
- **State**: how a control looks in a moment: normal, hover, pressed, disabled, loading, error.
- **Dark mode**: a second colour set for low light. It is not just inverted colours.
- **Reduced motion**: a system setting for people who get sick from animation. Apps should calm down.

## What it does not do

- It does not replace testing with real people. The Windows 95 team's main lesson is to test, change, and test again.
- Automated checks find only part of the accessibility problems. A screen reader pass is still needed.
- Apple's guidelines are for Apple apps. The skill marks what carries over to the web.
- Some HIG pages (layout, motion, materials, components) were not read in full. See `references/apple-hig.md`.

## Where the rules come from

- Kent Sullivan, "The Windows 95 User Interface: A Case Study in Usability Engineering", CHI '96.
- Apple Human Interface Guidelines: Color, Typography, Accessibility (developer.apple.com/design/human-interface-guidelines).
- WCAG 2.x (W3C), and APCA (Myndex), as second opinions on contrast.

## Develop

```bash
node skills/ui-ux-craft/scripts/selftest.mjs
```

CI runs the same command on Node 18, 20 and 22.

## License

MIT. See `LICENSE`.
