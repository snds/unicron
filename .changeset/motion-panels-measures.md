---
"@unicron/ui": minor
---

Motion for panels and measures. A Progress bar's fill now grows on `scale` from its start edge instead of animating `width` (`ProgressIndicator` takes an optional `share`, 0 to 1; without it Base UI's width is used as before). StatusOrb's needs-you ping is a growing, fading copy of its ring (`::after`, scale and opacity) instead of an animated `box-shadow`, and is not drawn under reduced motion. New contracts: collapsible, progress.
