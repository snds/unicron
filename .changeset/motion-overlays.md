---
"@unicron/ui": minor
"@unicron/tokens": patch
---

Overlays move onto the motion recipes. Dialog and Popover now open in 200ms and close in 120ms (the dialog was 120ms both ways), as transitions, so dismissing one mid-open turns round from where it is instead of restarting; Popover grows from its trigger edge and no longer slides 8px. Tooltip and the command palette use the short pop, 120ms both ways. DropdownMenu and Select animate for the first time: the surface scales from 96% while its frosted-glass layer and content fade in 120ms, the blur holds throughout, and opening or closing from the keyboard stays instant. New recipes `motion-pop-fast`, `motion-pop-glass` and `motion-fade`, and five new entries in `motionContracts` (dialog, popover, tooltip, menu, select). If you restyled these popups with `data-open:animate-in` or `zoom-in-*` classes, those no longer apply; use the recipes. Tokens: the descriptions of `--motion-fast` and `--motion-base` say what each is for now; no value changes.
