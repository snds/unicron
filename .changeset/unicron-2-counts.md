---
"@unicron/ui": minor
---

Counts are plain numbers, as the 2.0 library draws them: `formatCount` writes `7`, `12`, `146`, and `1,204` (1.x wrote `007`), and a capped mark stops at `99+` without a leading zero. The parts that joined words with " // " now use " · ": a NavSection's count, a SectionHeader index count, a ChatMessage's phase, and the countdown in an Accessory and a StatusItem. The status line's crumbs use " / ". StepsFolio reads `STEP 2 OF 7`.
