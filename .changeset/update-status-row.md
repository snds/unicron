---
"@unicron/ui": minor
---

Add `UpdateStatusRow` and `AutoCheckSwitch`, the updates part of an app's Settings → About: pass the update kit's `UpdateStatus`, the app's name and callbacks (`onCheck`, `onRestart`, `onReload`, `onCheckedChange`), and drop your own section. Also exports `updateLine(status, appName)` for a menu or palette, `canCheckForUpdates`, `updateWords` and the `UpdateStatus` types.
