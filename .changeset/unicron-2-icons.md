---
"@unicron/ui": minor
---

Icons draw Material Symbols Rounded (outlined, weight 400), as the 2.0 Figma library does. The names do not change: every curated name keeps its 1.x Carbon spelling, and `src/icons/drawings.json` maps it to the Material file that draws it (the 2.0 noun map included: an agent is `smart_toy`, a skill `school`, a tool `build`, a tag `label`). The drawings come from `@material-symbols/svg-400` at build time, scaled onto the same 32 grid, so `registerIcons` glyphs and every size rule still work. `CARBON_ICONS_VERSION` is now `MATERIAL_SYMBOLS_VERSION`.
