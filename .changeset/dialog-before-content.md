---
"@unicron/ui": minor
---

`DialogContent`, `SheetContent`, `AdaptiveSheetContent` and `CommandDialog` take `beforeContent`, a slot rendered in the portal between the backdrop and the popup. A desktop app with the native title bar hidden puts its window drag strip there (`<div aria-hidden className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />`), so the window still moves while a dialog, sheet or the command palette is open; a press on the strip does not dismiss. The popups now read `--c-dialog-titlebar-inset` (0px by default, so nothing moves): a dialog centres in the area below it, a side or top sheet starts under it (docs/05-consuming.md → Desktop title bar).
