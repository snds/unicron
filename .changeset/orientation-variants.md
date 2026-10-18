---
"@unicron/ui": patch
---

Orientation styles work again. The generated components style orientation with `data-horizontal:` and `data-vertical:`, as shadcn's own stylesheet defines them, but Unicron's stylesheet never defined those variants and Base UI only sets `data-orientation`. So those classes matched nothing: a line tab's active marker, a separator's 1px size, the scroll area's bars, the button group's separator and the field description's balance all drew at zero size or not at all. `styles/index.css` now maps both to `data-orientation`, exactly as shadcn does, and a test pins it. Line tabs also preview the marker at 40% on hover, so hover reads as more than a text color change. Expect screenshot baselines to shift where these appear.
