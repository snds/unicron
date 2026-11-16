---
"@unicron/ui": minor
---

Controls, chips, tabs and rows for 1.1 (decided 2026-11).

New API:

- `Progress`: `size` 4 or 8 on a segmented bar. 8 is Warpcore's Spend bar; 4 stays the default (Unicron 49).
- `FilterChip`, `TabsTrigger` and `TopTab`: `keepCase`. The label keeps its own case instead of the overline's capitals, for a label that is data, such as a person's name. `Chip` already keeps case: its value is in `caption` (Vale 8).
- `TabsTrigger`: `mark` (a count, a square or a key, as `TopTab` and the nav items take it). Its words join the tab's accessible name: "Requests, 2". Pass a count here, never as a hidden child (Lockdown 30).
- `SwipeRow` actions: `menuLabel`. The tile keeps its short word ("Fix"); the row's menu and the tile's accessible name use the full words ("Fix with Claude Code") (Synapse 21).
- `ListRow`: `statusMark` (`{ icon, label, tone }`, tone neutral, live, needs-you or critical). For a narrow column: the status is a 16px mark, and its word is said with the row, not drawn. It takes the place of `status` (Warpcore 18).
- `CodeDisplay`: `copy={false}` makes it display only: no copy on a click, Enter or the menu, no clipboard countdown, no Tab stop of its own (a concealed code still shows on Enter). For a row whose own button is the one copy, such as Lockdown's popup with `layout="compact"` (Lockdown 27).
- `swipeRowCrowdedTiles` (3): from this many tiles on a side, a full swipe needs more travel.

Changed behaviour:

- `RadioGroupItem` and `RadioRow`: the radio is round, a 16px circle with an 8px dot. It is the system's one round control, so one choice of many never looks like a checkbox (Unicron 41).
- `FloatButton` long press: from the keyboard it is Shift+F10 or the context-menu key (and a right click), no longer Shift+Enter, which means a new line in a text field. `floatButtonLongPressKeys` is now `"Shift+F10 ContextMenu"`. `ListRow` and `SwipeRow` already open their menus on the same keys. A Composer's Shift+Enter still makes a new line (Unicron 48).
- `Composer`: an empty composer's Send is dimmed to 50%. It stays `aria-disabled` and in the tab order; a press does nothing (Unicron 51).
- `FilterChip kind="trigger"`: while its picker is open it draws inverted ink, as Figma draws it, and still says `aria-expanded` (Unicron 50).
- `SwipeRow`: on a side with three tiles or more, a full swipe starts one tile past the open tiles (320 at 390), at most the row's width. Three 80px tiles already reached the 60% line (234 at 390), so opening the row ran its outermost action (Lockdown 18).
- Focus and invalid borders: a field's focus border (Input, Textarea, InputGroup, Select, TextField, Composer) reads `--line-focus`; its invalid border, and the invalid edge of Button, Switch, Checkbox and Radio, reads `--line-invalid`. These line roles (from @unicron/tokens) hold 3:1 on both grounds; the primary and critical fills measured 2.59:1 to 3.21:1 on graphite (Unicron 17).
- Pressed solids: Button default, destructive, ghost-destructive and needs-you, Switch on, the primary FloatButton and the primary swipe tile go to 85% when pressed (was 80%). Inverted ink (a current FloatButton, an on or open FilterChip) goes to 86%. The labels now hold Lc 75 on Vale and Lockdown stone and on graphite (Unicron 28).
- `FloatButton` neutral pressed lays the `state-pressed` role over the raised surface, instead of a hand-written 10% mix.
- `TabsTrigger`: the index is in the label ink, not the faint ink: it is read as part of the name (Unicron 25).
