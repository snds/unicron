---
"@unicron/ui": minor
---

Adds `ResizablePanes`, `ResizablePane` and `ResizableHandle`, for panes a person can drag to resize.

- `ResizableHandle` needs a `label`, its screen reader name. `withGrip` adds a visible grip for touch.
- `useResizablePanesLayout` remembers a layout between visits, and `useResizablePaneRef` collapses or resizes a pane from code.
- Adds one dependency, `react-resizable-panels`.
