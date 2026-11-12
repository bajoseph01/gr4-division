# Collapsible step help — 12 November 2026

Added Hide/Show step help beside the problem heading. Collapsing expands the board to full width and keeps Check/Next, Reveal, Reset, feedback and tools below it. In-progress answers are preserved. Keyboard focus returns to the board while help is hidden. Service-worker cache advanced to v25.

Verified in Chromium at 1448×1086, 1024×768, 768×1024 and 390×844: collapse/expand, retained answer, wrong-answer feedback, completing 48 ÷ 2 entirely through board input and Enter, next problem, switching modes, keyboard toggle and no horizontal overflow. Inspected collapsed iPad screenshot.

Existing check-v2.cjs passed its first 19 scenarios, including 120,012 arithmetic comparisons, all samples, board/side synchronization, responsive layout/arrow geometry, scratchpad, simulated touch and offline caching. The local-file scenario was blocked by this environment’s Chromium policy (ERR_BLOCKED_BY_ADMINISTRATOR); real iPad/Safari was not tested.
