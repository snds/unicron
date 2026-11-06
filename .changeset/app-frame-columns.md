---
"@unicron/ui": minor
"@unicron/tokens": minor
---

`AppFrame` can now hold columns on the left: `AppFramePivot` and `AppFramePivotEnd` for top-level places, and `AppFrameSidebar` for a list beside the content. New tokens: `--c-app-frame-pivot-width` and `--c-app-frame-sidebar-width`. Existing frames are unchanged, because unused columns take no room.
