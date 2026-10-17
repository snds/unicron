---
"@unicron/ui": patch
---

`IconButton`: `disabled` now disables the control itself (the default `Button`, or whatever `render` passes), not only its tooltip. Base UI's `TooltipTrigger` reads `disabled` as "don't open the tooltip" and never sets it on the element, so a disabled `IconButton` used to stay clickable and was drawn enabled.
