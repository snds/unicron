---
"@unicron/ui": minor
---

`DialogContent` takes `size` (`sm` default, `md`, `lg`, `xl`, `2xl`) for how wide it grows from `sm` up, and every dialog now scrolls inside itself when it's taller than the screen (`max-h-[calc(100dvh-2rem)] overflow-y-auto`). `ItemMain` is a row's main action when the row also has buttons of its own: it holds the media and content, its target covers the whole row (hover and focus ring included), and `ItemActions` stay on top as separate controls.
