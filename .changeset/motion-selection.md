---
"@unicron/ui": minor
---

Motion for selection, in the 1.0 look. Button, IconButton and a lone Toggle press 1px into the page with a new `motion-push` recipe (a popup trigger does not move; a joined ToggleGroup's items change colour only). A Checkbox's mark fades in and out. The line Tabs get one indicator that slides to the chosen tab (`motion-indicator`, Base UI's `Tabs.Indicator`); the per-tab `::after` line now only shows on hover. New contracts: push, indicator, button-press, switch, checkbox, tabs.
