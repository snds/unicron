---
"@unicron/ui": minor
"@unicron/tokens": minor
---

`Dialog` takes the 2.0 Dialog (Figma 76:139). The popup sits on the popover surface under the dialog's edge shadow (the new `surface-dialog` utility), with 12px corners. The header and footer are bands of their own, each with a rule that runs edge to edge. The header has 20 above and 16 under the title, the footer has 16 above and below its actions, and the actions sit 12 apart. The title takes the title role (20/28 semibold). The `dialog.padding-top` knob is now 1.25rem: 20 above, below, and between the bands. A sticky footer pins on the popover surface.
