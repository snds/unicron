---
"@unicron/ui": minor
"@unicron/tokens": minor
---

`AppFrame` no longer runs off the screen in a home-screen app: it measures the page rather than trusting `100vh`. `AppFrameNav` is now a floating glass capsule of icons, like the bars in iOS 27, and a pill at the foot of the right edge when height is scarce, as on iPhone Duo. `AppFrameNavItem`'s `label` is now for screen readers only. New: `useViewport().navPlacement` and `pageHeight`, the `nav-rail:` variant, `bleed` on `AppFrameMain`, `--c-app-frame-nav-gap` and `--c-app-frame-nav-item-width`.
