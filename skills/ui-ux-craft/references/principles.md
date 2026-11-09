# Principles: what the two sources say, and where they disagree

Contents: the shared pattern · Windows 95 case study in brief · Apple HIG in brief · where they pull apart · limits of the evidence

## The shared pattern

1. **Start from tasks, not screens.** Win95 built its tests around the top 20 tasks from market research. Apple's accessibility guidance asks for simple, consistent interactions for common tasks.
2. **Make state and options visible.** Win95 beginners relied almost only on visible cues (menus, toolbars). A minimised window was "gone" to them until the Task Bar gave every open task a permanent button. Apple asks for more than one signal (not colour alone) and for labelled, perceivable controls.
3. **Scale with the person.** Win95's key insight: a usable system is easy to discover for beginners and also gives shortcuts to experts. Apple: support larger text, system settings, Increase Contrast, Reduce Motion, keyboard-only use.
4. **Consistency serves the user. It is not a goal.** Win95 first kept Windows 3.1 habits out of fear. Tests showed that over-focusing on consistency hurt. Apple pushes system components and semantic colours because they carry learned meaning. Both say: be consistent where it helps recognition; break it where tests show it hurts.
5. **Prove it.** Win95 ran 64 lab phases with 560 subjects and logged 699 usability statements. Apple points to Accessibility Inspector and testing with the real assistive features. You: run the scripts, then watch a person.

## Windows 95 case study in brief

Source: Kent Sullivan, "The Windows 95 User Interface: A Case Study in Usability Engineering", CHI '96 Design Briefing (the PDF supplied by the user).

- Team: about 12 designers plus about 12 developers. Goals: easier to learn for new users, easier to use for existing users. About 18 months to design and code the UI.
- Rejected the waterfall model. Used three phases: exploration, rapid prototyping, fine tuning. Prototypes (paper, Visual Basic, C) were tested immediately in the lab.
- Early surprises: two-pane File Cabinet confused beginners; a Programs folder on the desktop confused everyone; three Tray buttons (System, Find, Help) overlapped in purpose.
- Baseline study on Windows 3.1: beginners took over 9.5 minutes on average to find and open a program that was not already visible. Double-click was hard. Window management was poorly understood. 40% of intermediate users avoided running more than one program at a time because of trouble.
- Change of direction after an off-site retreat: focus on most-frequent tasks; stop over-weighting consistency with 3.1; make the UI scale.
- Spec process: the prototype and code became the "living spec". The team kept people informed with weekly staff meetings, emailed test schedules and results, a tracked issue database, and live demos.
- Dead end worth remembering: a separate "beginner shell" tested well at first, then failed because missing functions forced users out, learning did not transfer, and it looked unlike real programs.
- Five areas with three or more design iterations: Start menu, Task Bar, Open/Save dialogs, Printer setup wizard, Help Index tab.
- Final results (reported by the team): users finished top-20 tasks in about half the time of Windows 3.1 and were more satisfied in 20 of 21 categories; a 20-person field study found no major holes.
- Tracking: 699 usability statements (148 positive, 551 problems). Severity: 15% level 1, 43% level 2, 42% level 3. Resolution: 81% addressed, 8% somewhat, 11% not addressed.
- Conclusion: no detail of the initial design survived unchanged. Not getting it right the first time was accepted. The team wished for more time to iterate and re-test.

## Apple HIG in brief

Source: developer.apple.com/design/human-interface-guidelines (Color, Typography, Accessibility pages read directly while building this skill; copyright Apple). Numbers in this skill that come from those pages are marked "HIG".

- Colour: use semantic colours; avoid one colour with two meanings; supply light, dark, and increased-contrast variants; do not rely on colour alone; avoid hard-coding system colours.
- Typography: use a small number of typefaces; show hierarchy with weight, size and colour; avoid light weights; avoid tight leading on 3+ lines; layouts must adapt to all text sizes; keep truncation low at large sizes.
- Accessibility: support 200% text; contrast 4.5:1 / 3:1 by size and weight; default control sizes (iOS 44pt, macOS 28pt) with smaller minimums; padding between controls; simple gestures with alternatives; keyboard-only use; avoid timed dismissal; honour Reduce Motion.

See `apple-hig.md` for the numbers and for what carries over to the web.

## Where they pull apart

| Topic | Win95 says | Apple says | What to do |
|---|---|---|---|
| Familiar versus new | Familiarity alone did not help; it hid problems. | Use standard components and behaviour. | Use standard components for standard jobs. Test any new pattern with real tasks before you ship it. |
| Hidden features | Beginners ignored pop-up menus. | Context menus exist as shortcuts. | Context menus are shortcuts only, never the only path. |
| Beginner mode | A separate beginner UI failed. | Assistive Access is a system-level reduced UI. | One UI that scales beats two UIs. A reduced mode is fine when the system provides it and it maps to the same actions. |

## Limits of the evidence

- The Win95 numbers are the team's own, from a 1996 design briefing about mouse-driven desktops. Treat them as strong stories and sound method, not as laws. Copy the method (tasks, prototypes, test, log) and the reasons (visible, one click, always there), not the widgets.
- The paper's "half the time" result also relies on a vendor white paper (Usability Sciences Corporation, 1994), which the paper cites but this skill did not read.
- HIG is written for Apple platforms. Web targets differ (pointer types, text scaling, safe areas). `apple-hig.md` marks what transfers.
- WCAG contrast is a rough model. APCA is closer to perception for thin or large text but is not yet a legal standard. Use WCAG as the pass/fail floor and APCA as a second opinion (`contrast.mjs` prints both).
