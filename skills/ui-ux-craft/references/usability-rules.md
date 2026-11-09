# Usability rules from the Windows 95 case study

Each rule: the finding, the rule for today, how to test it. Use the "top task first" habit for all of them.

Contents: 1 Tasks first · 2 Show, do not hide · 3 One click, big target · 4 Always show state · 5 Order and simplify forms · 6 Wizards for rare multi-step jobs · 7 Search that matches how people think · 8 Scale, do not split · 9 Prototype is the spec · 10 Track every problem

## 1. Tasks first
- Finding: the team collected the top 20 tasks (from market research and support data) and compared Windows 3.1 and 95 on exactly those. Starting a program was task number one, and it was the worst.
- Rule: before layout, list tasks and rank them. The top task gets the most visible, shortest path. Put its entry point where a first-time visitor looks first.
- Test: ask someone to do the top task without help. Time it. Count wrong turns. A first-time person who needs more than a few seconds for the top task means the screen fails.

## 2. Show, do not hide
- Finding: beginners and many intermediates used only what they could see: menu bars and toolbars. They did not use pop-up (context) menus, even after training.
- Rule: every important action has a visible control. Right-click, long-press, swipe, keyboard shortcuts, and hover are accelerators only.
- Test: remove all shortcuts mentally. Can the task still be done from visible controls? Search the UI for actions that live only in hidden menus.

## 3. One click, big target
- Finding: beginners failed at double-click. They missed things that opened only by double-click. The Start menu kept the good parts of the failed beginner shell: single-click, high visibility, menu-based.
- Rule: one click or tap for the main action. No double-click, no drag, no hold for required steps. Target size: 44x44 touch, 28x28 mouse default (HIG).
- Test: `runtime-audit.mjs` reports small targets. Then try it on a phone with a thumb.

## 4. Always show state
- Finding: minimised windows were "gone" to beginners; they launched many copies of a program. The Task Bar fixed it: one permanent entry per open task, always on top of other windows. A first idea (make minimised windows look like larger "plates") did not help at all.
- Rule: if something is open, running, saved, selected, filtered, loading or failed, show that in a stable place that does not move. Cosmetic changes to hidden state do not fix a hidden-state problem.
- Test: ask "what is the system doing right now, and what can I do next?" Answer from the screen alone.

## 5. Order and simplify forms and dialogs
- Finding: the Windows 3.1 Open/Save dialog had fields in an illogical order and a complicated selection method. The redesign (tested through several Visual Basic prototypes) gave one clear path: where to look, the list, the name, the type, then Open.
- Rule: fields follow the order people think in. One column on narrow screens. Labels above inputs. Defaults pre-filled for the common case. Group related fields.
- Test: tab through the form. Does the order match the task? Does each field show an example or hint without replacing its label?

## 6. Wizards for rare multi-step jobs
- Finding: printer setup was the top support call generator. The old dialog hid the target in one long list and needed tunnelling down 4-5 levels. Wizards tested very well for jobs that are multi-step and infrequent.
- Rule: use a step-by-step flow for rare, complex, error-costly jobs (setup, import, migration). Use a plain page for frequent jobs. One decision per step, visible progress, Back always available.
- Test: can a first-time person finish without help? Are errors caught in the step where they happen?

## 7. Search and help that match how people think
- Finding: the old Help Search dialog had two lists and two buttons. People did not realise they had to choose from the first list, then the second. The new Index had one list; when a keyword had several topics, a pop-up appeared and users noticed it.
- Rule: one input, one results list. If a choice is needed, show it where the eyes already are. Name things with the words users use.
- Test: give three task phrases in user words ("change printer", not "device configuration") and see whether search finds them.

## 8. Scale, do not split
- Finding: a separate beginner shell failed: missing functions forced people out; what they learned did not transfer; it was unlike real applications.
- Rule: one interface with a gentle ramp. Beginners see clear, labelled paths. Experienced people get shortcuts, bulk actions, and keyboard access on the same screen.
- Test: can a beginner and an expert both finish the top task on the same screen, each in their own way?

## 9. Prototype is the spec
- Finding: the written spec went stale as tests changed the design. The team let prototypes and code act as the living spec, and found it needed less work and drew richer feedback ("the reviewer has to imagine less").
- Rule: keep a clickable prototype or the running app as the source of truth. Keep the written note short: goals, tasks, decisions, open issues.
- Test: can a new teammate understand the intended behaviour by using it?

## 10. Track every problem to closure
- Finding: a relational database logged each problem, its severity, owner, and resolution. Reports every couple of weeks, sorted by owner. A fix counted only when it was tested with users. Unresolved items rolled into the next version's database.
- Rule: use the severity scale and issue template in `review-checklist.md`. Never leave a problem as a loose chat message.
- Test: every issue has an owner, a severity, and a status.
