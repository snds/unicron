---
"@unicron/ui": minor
"@unicron/tokens": minor
---

The 2.0 sidebar. `AppFrameSidebar flush` is 240 wide on the sunken ground, edge to edge, and the frame drops its page gutters beside it. Its top row holds the lockup and the primary as an icon button; `windowButtons` adds the Mac row (the window buttons' room and Hide sidebar) over a 36 row. Collapsed it is a 56 rail. New `SidebarFoot` (Figma 178:4541): a status line, an edge-to-edge rule, and the account row with Settings, filled while Settings is open. `TitleRow` takes the frame's header area. New tokens: `--c-app-frame-sidebar-flush-width` (15rem) and `--c-app-frame-sidebar-flush-rail` (3.5rem). The 1.x sidebar stays the default until 3.0.
