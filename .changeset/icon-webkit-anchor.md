---
"@unicron/ui": patch
---

Icon: icons show in WebKit (Safari and Mac app web views). The glyph is anchored at the left edge instead of centred with `text-anchor="middle"`, which WebKit measures before the ligature joins the letters, pushing the icon out of its box. No change in Chromium or Firefox.
