---
"@unicron/ui": patch
---

`Toggle` and `ToggleGroupItem` draw the pressed state as the primary fill (`bg-primary text-primary-foreground`) instead of `bg-muted`, which measured about Lc 8 / 1.1:1 against the page (#6). The pressed item now measures Lc 96+ / 17:1 against the page and the unpressed item in both modes. `aria-pressed` and `data-[state=on]` are unchanged. The change lives in `tools/shadcn-material/overrides.json`, so `pnpm regen` keeps it. Consumers: screenshot baselines shift for pressed toggles; Synapse can drop its `data-pressed:bg-primary data-pressed:text-primary-foreground` override on severity filters.
