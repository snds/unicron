---
"@unicron/ui": minor
"@unicron/tokens": minor
---

Adds what an app needs to fit every screen: phones on their side, tablets, foldables and the iPhone Duo. `AppFrame` (the outermost box: page lock, safe areas, keyboard), `AppFrameNav` (a tab bar that becomes a rail on a short screen), `FoldPanes`, `useViewport`, the `short:`, `fold-book:`, `fold-tabletop:`, `standalone:`, `frame-tight:` and `frame-minimal:` variants, an `ultrawide:` breakpoint, and `--c-app-frame-*` tokens. See docs/05-consuming.md, "Fit every screen". Every app gets these without changing anything: `Input`, `Textarea`, `NativeSelect` and `CommandInput` stay at 16px on touch, so iOS no longer zooms into them on a tablet or a phone on its side (their text is 14px only with a mouse now). `Textarea` and `Empty` tighten up on a short screen, side and bottom `Sheet`s keep clear of the notch, and a finger beside a `ResizableHandle` grabs it even when the pane under it scrolls.
