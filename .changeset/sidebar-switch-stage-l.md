---
"@unicron/ui": patch
---

Switch, sidebar and switcher fixes from Synapse's Stage L review.

- **Switch:** an off switch is now edged in `line-field` (`--input`, 3:1 on both grounds) instead of the `line-rule` hairline. On a raised row, such as a settings card, the off track had disappeared and only the knob showed, as a bare square.
- **AppFrameSidebar:** the collapse control (and the drawer's close control) moved from the foot to the end of the lockup's row, so the foot's item (Settings) takes the foot's full width and its current fill reaches the sidebar's edge. The scrolling middle now fades its last 32px into the ground and pads its end by the same 32, so a long list scrolls instead of cutting a row's words in half.
- **AppFrameSwitcher:** the chevron is a ghost icon button on the title's line (32), not a bordered 48px float button, so it reads as part of the name it opens and no longer pushes the sidebar's middle down. Its name and menu are unchanged.
