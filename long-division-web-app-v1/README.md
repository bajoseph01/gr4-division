# Long Division Web App v1.1

A single-file classroom web app for Grade 4 long division practice.

## Purpose

This app recreates Mr Jo's long-division worksheet style as an interactive browser tool. It is designed for:

- interactive whiteboard teaching
- printable worksheet generation
- iPad/home practice
- self-marking of final answers
- guided teacher modelling of the long-division step loop

## v1.1 focus

This branch is the next logical step after v1. It keeps the worksheet look, but makes the modes more meaningful.

### Added / improved

- Teacher board mode now focuses on one problem at a time.
- Teacher controls now include Previous, Next, and Reveal next step.
- Student practice mode hides answer/reveal/generation controls to reduce temptation and visual clutter.
- Quotient slots now align to the correct dividend digit place.
- Empty leading quotient places are locked, so learners do not type quotient digits too far left.
- Worked-step cards now model Divide, Multiply, Subtract, Bring down, and Stop.
- Print mode keeps the six-question worksheet layout.
- Code was expanded into clearer sections for easier future editing.

## Features

- Teacher board mode
- Student practice mode
- Printable preview mode
- Classic worksheet set
- Random generated sets
- Green, Orange and Red difficulty levels
- Exact and remainder questions
- Revealable worked steps
- Final-answer marking
- Print-friendly A4 landscape layout
- Local score saving on the device

## How to run

Open:

```text
long-division-web-app-v1/index.html
```

in any modern browser.

No installation is required.

## Manual test checklist before merging

Use the classic worksheet set and check:

1. Teacher board mode shows only one large problem.
2. Previous / Next moves through all six questions.
3. Reveal next step exposes the worked-step cards one at a time.
4. `248 ÷ 4` shows the quotient as blank, 6, 2 above the dividend digits.
5. Student practice mode hides Show answers, Generate set, Previous, Next, and Reveal next step.
6. Mark answers accepts the final answer and colours correct/incorrect entries.
7. Print worksheet returns to the six-panel A4 landscape worksheet layout.

## Next build ideas

- Replace the free workpad with structured answer boxes for each step.
- Add true step-by-step marking, not only final-answer marking.
- Add a printable memo view.
- Add teacher-controlled reveal for the full worked solution on the long-division bracket itself.
- Add a saved class results dashboard.
- Add more operations: multiplication, subtraction with borrowing, fractions.
- Add a separate learner login/version later if needed.
