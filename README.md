# JoGo Gr4 Division

A Grade 4 teaching app for long division before short division. V2 implements the approved coloured-tile concept in `design/v2-concept.png`.

## Open Locally

Open `index.html` in a browser.

Both modes now open with **48 ÷ 2**. Long division starts at Level 1: two-digit problems with no carrying and no remainder. Use **Teacher settings** to enter your own problem or choose a sample. Both `÷` and `/` are accepted. Divisors are whole numbers from 1 to 12.

The **Practice level** selector follows five stages: two-digit exact/no carrying → two-digit exact/with carrying → two-digit remainders → three-digit exact → three-digit remainders. Complete a sum to enable **Next problem**. At the end of a stage, **Next level** is a separate choice; the app never switches to a harder problem automatically. Teacher-selected levels and custom problems remain available. The final stage's **Practise again** repeats that stage.

Answer each **Divide → Multiply → Subtract → Bring down** prompt, press **Check**, then **Next**. Enter also checks/advances. **Reveal** fills only the current step; **Reset** starts the problem again. Completed working remains visible. **Working in words** expands the written steps. **Scratchpad** provides pencil, eraser, undo, redo and clear.

For **every step**, type in the outlined `?` boxes directly on the board **or** in the side panel. The next boxes appear in the correct position: quotient above the line, product after the minus sign, remainder below the subtraction rule, then the brought-down digit beside it. Multi-digit answers have one box per digit; typing moves to the next box. Both locations stay in sync and use Check/Enter validation. After Next, focus stays on the board if that was the learner's chosen input. Only the current answer is editable; completed working and future steps stay locked.

Colours follow division rounds: orange, green, yellow, blue (then lavender for a fifth round; the sequence repeats for longer problems). The divisor is coral and the final answer's remainder is purple. A brought-down digit keeps its source colour; an outline and named step also show the current task. Zero quotient digits and zero remainders are shown explicitly.

Both mode tabs are always visible. Short division retains its quotient/carry inputs and Check/Reveal controls. At narrower widths the teaching card sits below the working; long working can scroll vertically, and oversized boards scroll within their own panel.

After the initial sizing refinement, Mr Jo requested another 20% reduction in the division tiles and numerals across all viewports. At a 1024×768 landscape viewport, tiles are now about 43px with 32px numerals and the partial example's teaching controls fit onscreen. Portrait stacks the card below the board. Safari toolbars and the onscreen keyboard reduce available space; normal scrolling remains available.

Keep `index.html`, `styles.css` and `board.js` together. No install, account or network is needed to open the local app. Hosted offline installation additionally uses `sw.js`, the manifest and the existing icons. For a previously installed version, close old app tabs and reopen after its service-worker update has downloaded.

## Verify V2

On this Windows workstation, from `2026_Coding`:

```bash
node.exe Gr4_Division/qa/check-v2.cjs
```

The check uses the existing shared Playwright runtime and installed Edge, starts a temporary local server and closes it afterwards. Set `PLAYWRIGHT_RUNTIME` and `BROWSER_CHANNEL` to use an already installed alternate runtime/browser; no project dependencies are installed. Results are in `qa/results.json`, with captures in `screenshots/v2-*.png`.

21 browser scenarios and 120,012 arithmetic comparisons passed on 7 November 2026. Screenshots were inspected at desktop 1448×1086, iPad landscape 1024×768, portrait 768×1024 and mobile 390×844, plus the complete working, short-division screen and active subtraction input. Checks cover the five-level progression, all 20 long samples, four short samples, edge cases, column/arrow geometry, full sums completed through board inputs, multi-digit answer synchronisation, wrong answers, keyboard, simulated touch, scratchpad, local-file opening and offline reload. Real Safari/iPad use remains to be tried. No V2 publication or GitHub push has been performed.

## GitHub and online app

- Source repository: https://github.com/bajoseph01/gr4-division
- App address: https://bajoseph01.github.io/gr4-division/
- Classroom hub: https://mr-jo-apps.mrjhawk.chatgpt.site/

The existing repository's Pages deployment publishes `main`. Keep the runtime files, vocabulary helper, manifest and icons together. Before pushing a release, run the checks above, preserve unrelated remote changes, and verify the resulting online app. The older `long-division-web-app-v1/` project is retained independently.

Students can open the link in Safari on iPad, tap Share, then tap Add to Home Screen.
