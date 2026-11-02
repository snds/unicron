---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Dialog footers stay edge to edge when a dialog's padding changes.

- **New token `--c-dialog-padding`** (1rem, the `p-4` the dialog always had). `DialogContent` pads by
  it. `DialogFooter` (and `DialogActions`) reaches out by it to the popup's edges, pads its buttons by
  it so they line up with the content, and a sticky footer pins by it.
- **Before**, the footer's bleed was fixed at `-mx-4 -mb-4`. A dialog with `p-6` got a footer that
  stopped 0.5rem short of each edge.
- **To change one dialog's padding**, set the variable: `className="[--c-dialog-padding:1.5rem]"`.
  Don't use `p-*` on `DialogContent`; the footer can't follow a class. To change every dialog,
  re-map the token in the app's extension layer.
- Nothing changes for a dialog that keeps the default padding.
