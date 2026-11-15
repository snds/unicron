---
"@unicron/ui": patch
---

TruncatedText: a tap on cut text now shows all of it and keeps it shown. The tap's own focus opened the tooltip a moment before the press landed, so the press read as "put it away" and closed it in the same tap; the closing fade hid this. A second tap still puts it away.
