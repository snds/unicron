---
"@unicron/ui": minor
"@unicron/tokens": patch
---

Overlays move onto the motion recipes, in the 1.0 look (fade, or fade and an 8px step off the trigger; no zoom, no blur). They are transitions now rather than keyframes, so dismissing one mid-open turns round from where it is instead of restarting. Dialog and its dim fade in place, 200ms in and 120ms out (was 120ms both ways). Popover fades and steps off its trigger, 200ms in and 120ms out. Tooltip and the command palette fade, 120ms both ways. DropdownMenu and Select fade and step off the trigger in 120ms both ways, and stay still when opened or closed from the keyboard; Select animates for the first time. New recipes `motion-fade-fast`, `motion-anchor` and `motion-anchor-fast` (with `motion-fade` already there), and seven new entries in `motionContracts` (fade, anchor, dialog, popover, tooltip, menu, select). If you restyled these popups with `data-open:animate-in`, `fade-in-*` or `slide-in-from-*` classes, those no longer apply; use the recipes. Tokens: the descriptions of `--motion-fast` and `--motion-base` say what each is for now; no value changes.
