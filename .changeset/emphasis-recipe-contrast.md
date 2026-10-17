---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Contrast is now checked the way Emphasis Engine checks it: every pair a component paints, through its own opacity (`bg-input/30`, `ring-ring/50`, `hover:bg-primary/80`, `bg-destructive/10`), held to its element kind's floor, APCA first. Reading text Lc 75 (APCA Bronze, under 16px); a label on a fill or tint Lc 60; solids Lc 30; control borders and focus 3:1 as drawn. `scripts/contrast.mjs` measures 101 recipes (73 gated, 28 reported) with no waivers left.

What moves, so every recipe passes:

- `--input` (control borders): `neutral.450` light (new step, 3.4:1), `white-alpha.35` dark (new step, 3.1:1). Was `neutral.200` / 15% white, about 1.3:1 and 1.5:1. Field and switch edges get visibly stronger.
- `--muted-foreground` dark: `neutral.200` (Lc 86 on every surface). `neutral.300` read Lc 74 on `--muted` and `--accent`, under Bronze for the 12px `Kbd` and secondary text on selected rows.
- `--destructive`: `red.600` light (new, Lc 84 as text, 73 on its 10% tint), `red.300` dark (new, Lc 76 as text, 70 on its 20% tint). Was Lc 47-70.
- `--warning` light: `amber.400` (label Lc 71, was 59). `--info` dark: `blue.500` with white `--info-foreground` (Lc 72, was 52).
- Components, one job per role: inactive tabs use `text-muted-foreground` in both modes (light used `text-foreground/60`, Lc 69); disabled fields fill with `bg-muted` instead of `bg-input/50`; the command palette's search field fills with `bg-muted`; the button-group divider is `bg-border`.

The four contrast waivers from 0.3 are gone: their pairs pass. Expect screenshot baselines to shift for field borders, destructive text, dark muted text and status fills.
