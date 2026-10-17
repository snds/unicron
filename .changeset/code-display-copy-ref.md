---
"@unicron/ui": minor
---

`CodeDisplay` gains SecretField's copy reference. Additive: a host that resolves `onCopy` with nothing and passes `onClipboardClear()` keeps working.

- `onCopy` may resolve with `{ hash }` (`CodeDisplayCopyRef`, the same shape as `SecretFieldCopyRef`). The component keeps it for that copy; a later copy restarts the countdown and supersedes it.
- `clipboardHolds?(hash)`, the same signature as `SecretFieldHost.clipboardHolds`, is asked at the countdown's end. `false` (or a rejection) skips the clear and ends the countdown without "Cleared".
- `onClipboardClear(ref?)` receives the reference of the copy whose countdown ended and may resolve `true` (cleared) or `false` (left the clipboard alone).
- "Cleared" (check, sr-only word, tooltip, and the live region's "Clipboard cleared.") is said only when `clipboardHolds` answered yes or `onClipboardClear` resolved `true`. A host whose `onClipboardClear` returns nothing and passes no `clipboardHolds` now sees the countdown end without "Cleared"; resolve `true` when your clear ran to keep the word.
- `codeDisplayAnnouncements` exports the live-region texts. In a `CodeDisplayList` each row's reference reaches its own callbacks through the one shared live region.
