---
"@unicron/ui": minor
---

`SheetContent backdrop={false}` leaves the dimming backdrop out, for a detail sheet beside a list. Pair it with `<Sheet modal={false} disablePointerDismissal>`: the list stays visible and clickable, picking another row changes what the sheet shows instead of closing it, and Escape or the close button still close it. The default is unchanged (backdrop drawn).
