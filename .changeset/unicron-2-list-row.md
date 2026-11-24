---
"@unicron/ui": minor
"@unicron/tokens": patch
---

`ListRow` takes the 2.0 library's List Row (Figma 9:181). Rows have no dividers; they sit inset in their list with 8px corners. Selected is the 8% fill (surface/selected) with the 2px inset bar, replacing primary-soft and the edge. Inline rows are 56 tall (label meta) or 60 (plain), padded 8 / 10 with 12 between columns; the title is ui-emphasis, and the meta and status are in the meta role in label ink, no longer overline caps. A message is 84 tall, padded 10 / 12: a round unread dot in info/fill, the time as a caption, and the preview cut at one line by default (was two). `tone="live"` is retired (it now colours the status in the working ink); put a working `StatusOrb` in `leading` instead. The account and time are joined by " · ".
