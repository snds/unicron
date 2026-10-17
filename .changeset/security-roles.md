---
"@unicron/tokens": minor
---

Three tier 2 roles for the security components (Lockdown brief §5.7, specs under `docs/specs/security/`): `warning` / `warning-foreground` (amber; expiring codes, approval timers, the tolerated tier), `info` / `info-foreground` (blue; the verified tier, large-type digits), and `protected` / `protected-foreground` (an inverted neutral surface for the crown-jewel treatment). Each swaps in `.dark` and is exposed to Tailwind as `bg-warning`, `text-info-foreground`, and so on. Existing roles are unchanged.
