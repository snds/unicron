---
"@unicron/ui": minor
---

The phone sheet's drag gets physics. AdaptiveSheetContent follows the grabber 1:1 down and resists past open (24px at most); let go, it reads the release speed, so a short flick dismisses it and carries through faster, a slow short drag settles back on the firm spring, and a re-grab mid-settle carries on from where it is. The fixed 120px dismiss distance is gone (it is now 30% of the sheet's height, or a flick). New `data-release` recipe and `@unicron/ui/motion` helpers: `releaseVelocity`, `shouldDismiss`, `releaseShare`, `DragSample`, `DISMISS_SHARE`, `FLICK_SPEED`, `RELEASE_WINDOW_MS`. New contract: sheet.
