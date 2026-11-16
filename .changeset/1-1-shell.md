---
"@unicron/ui": minor
---

The frame, its bars, layers, toasts and live announcements for 1.1 (decided 2026-11).

New API:

- `Accessory`, `StatusItem` and `AgentPrompt`: `announceAt`, a list of seconds left at which the countdown is said once ("Chrome on Windows, 1 minute left"), never each tick (WCAG 2.2.1). Each app sets its own: Warpcore `[300, 60]`, Synapse `[60, 30, 10]`. `AgentPrompt` defaults to `[60]`; the status parts to none (Unicron 33).
- `AgentPrompt`: `details`, a slot between the question and the options for what the call carries, such as a `CodeBlock` of its arguments. It is not capped, and it is in the phone's sheet too (Synapse 18).
- `AppFrameSwitcher`: `accounts`, `value`, `onValueChange`, `accountsLabel` and `add`. The chevron opens the accounts as a menu of radio items: the arrow keys only move, and Enter, Space or a click switches, so passing over an account never loads it (Unicron 73). `menu` still takes a menu of your own.
- `PopoverContent`: `width`, `default` (320) or `wide` (420, Figma's one drawn popover, Warpcore's environment picker). `wide` reads `--c-popover-width-wide` from @unicron/tokens (Unicron 60).

Changed behaviour:

- `AppFrame`: in a development build it warns once when no `data-theme` is set on the root (or on a box around the frame): the core's generic default theme is then in use. See docs/05-consuming.md (Unicron 4).
- Phone chrome: it comes back on any scroll up, as Safari's bar does, not only at the top. It minimizes again on a scroll down past the line. The rubber band below the end of a page does not count as a scroll up (Unicron 68).
- Toasts on a phone: a strip that shows (a needs-you request, offline, a sync) stays shown, and the toast stacks 8 above it. Toasts no longer sit under the top row, where they covered the page head and the switcher. A strip with an action (undo send) is still never covered: new toasts wait. `toastPlacementFor` returns `above-strip` for a strip that shows; `top` stays in its type, unused, until 2.0 (Synapse 10, Vale 15).
- Desktop sidebar: from 1024 to 1099 px it is its rail on every screen, not only on a list + detail screen, so it no longer changes width from one section to the next. Expanding it opens the drawer, as at medium width (Unicron 74).
- `TabBar` vertical (the short screen's trailing column): every tab is 44 tall (`size/touch-min`), never squeezed. When the tabs do not fit (four tabs at 667 × 320) the bar scrolls, a slide along it scrolls it, and the create button under it stays on screen (Unicron 29, 64).
- `TabBar` minimized: keyboard focus coming in expands it until focus leaves, and the arrow keys work again. A tap on the one tab still goes back to the top (Unicron 65).
- `Banner tone="critical"`: it cannot be dismissed. It draws no close button even when `onDismiss` is passed, and a development build warns once. Info, success and warning banners keep theirs (Unicron 62).
- `Accessory tone="critical"` is deprecated and goes in 2.0: a status strip is never critical. Show something broken that the person can fix as a critical `Banner` at the top of its section. It still draws as before, with a development warning (Unicron 67).
- Sheets: only the sheet that drags draws a grabber, `AdaptiveSheetContent` on a phone. A plain bottom `SheetContent`, and the phone sheets of `AdaptiveDialog`, `AdaptivePopover` and `AdaptiveMenu`, have none; their header starts 16 from the top and the close button sits 16 from the top, as on a side sheet (Unicron 54, Lockdown 29).
- `NeedsYou size="compact"`: its action is 40 high, 44 on a coarse pointer, whatever size the Button asks for. It is said to a screen reader each time it appears (Unicron 88).
- `AgentPrompt`: the countdown says what happens at zero: `QUESTION // DENIES IN 28:14` (the timer's name is "Denies in 28:14"). Once time runs out it says the core's "Timed out" in every app (Unicron 92, Synapse 18).
- `SecretField`: inside an `AppFrame`, a copy's "Copied. Clipboard clears in 30 seconds." and "Clipboard cleared." are said through the frame's one polite region, not the field's own, so they never talk over a status line or a strip (Unicron 33).
- `NavItem`: the index is in the label ink, not the faint ink: it is read as part of the row (Unicron 25). Measured on the ground: 4.83 to 8.50 to 1 (Lc 60.4 to 68.6), was 2.17 to 2.82 to 1.
- `AppFrameSidebar` primary: quick create (`onLongPress`) answers Shift+F10 and the context-menu key as well as a right click, and says so in `aria-keyshortcuts` (Unicron 48).

Docs (for docs/03-components.md, docs/04-patterns.md and the contract):

- Contract C6, toasts on a phone: no strip, the toast takes the strip's slot above the bottom row; a strip that shows (needs-you, offline, a sync) stays, and the toast stacks 8 above it; a strip with an action is never covered and toasts wait. Never under the top row.
- rules.md 6.5 (lane D): the chrome minimizes on a scroll down past 64 and comes back on any scroll up, and at the top.
- Countdown announcements: `announceAt` (seconds left) on Accessory, StatusItem and AgentPrompt; each mark said once, through the frame's one region inside an AppFrame. Warpcore 300 and 60; Synapse 60, 30 and 10.
- Banner: critical never dismisses; info, success and warning may.
- Accessory: `critical` deprecated; a broken thing is a critical Banner.
- Sheet grabber: only on the draggable adaptive sheet.
- Popover widths: 320 by default, 420 `wide`.
- Sidebar at 1024 to 1099: its rail, every screen.
- Account switcher: a menu of radio items; arrows move, Enter or Space switches.
- Vertical tab bar: 44 tabs, scrolls when short. Minimized bar: expands for keyboard focus.
- NeedsYou compact action: 40, 44 on touch; announced each time it appears.
- AgentPrompt: `details` slot; countdown words `DENIES IN 28:14`; "Timed out".
- AppFrame: development warning without `data-theme`.
- docs/specs/security/agent-prompt.md: the `details` slot between body and options (uncapped); the countdown's visible words and name ("Denies in 28:14"); `announceAt` (default 60) and its sentence ("1 minute left. Then it denies.").
- docs/specs/security/secret-field.md: inside an AppFrame the copy countdown's two sentences go to the frame's one polite region; the field's own region keeps the rest.
