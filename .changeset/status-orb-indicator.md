---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Add `StatusOrb` (idle, thinking, working, needs-you, done, failed, offline; told apart by shape and motion as well as colour, its words in the tooltip and name) and an `indicator` prop on `AppFrameNavItem` and `Item` (`{ kind: "attention" | "unread", count }`: a dot on the rail, the pivot and rows, a count badge on the bottom bar). New `--c-status-orb-*` and `--c-indicator-*` knobs.
