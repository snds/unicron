---
"@unicron/ui": minor
---

`DropdownMenu` takes the 2.0 library's Menu (Figma 76:415) and Menu Item (76:325). The panel is frosted by default: the new `surface-frost` utility draws the popover frost at 72% over a 24px backdrop blur, the popover shadow, and a 1px rule, and falls back to the solid popover surface when a person asks for reduced transparency. It has 8px corners and 4 inside. Rows are 32 tall (44 on touch), in the ui role and body ink, with the 5% hover fill; the current row takes the 8% selected fill. The keys at a row's end are plain meta-role text in label ink, no longer a Kbd. Rows sit 4 apart, not Figma's 2, to keep menus on the 4px grid. `AdaptiveMenu`'s sheet rows follow the same look.
