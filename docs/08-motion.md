# 08 · Motion

How things move in Unicron, and why. The values are in [02 · Tokens → Motion](02-tokens.md#motion).
The recipes are in [03 · Components → Motion recipes](03-components.md#motion-recipes). This page
ties them together: the rules, what each part does, how an app goes further, and how a new motion
gets added.

## The rules

1. **Mechanical by default.** Short, eased firmly to a stop. A press goes 1px into the page; a
   layer fades, or fades and moves one step off its trigger. Nothing zooms, blurs or glows.
2. **Transform and opacity.** Anything else needs a reason written into its contract. Four have
   one: a panel's height (the content below must move with it), a drawn stroke, a sliding
   indicator's length, and a strength rule's cell colours.
3. **400ms is the ceiling.** No default runs longer, staggers included. Loops (`spin`, `pulse`,
   `tick`) are not transitions and are exempt.
4. **No visible bounce on a control met many times a minute.** The springs a default may use
   overshoot under 3% (`firm`) or about 8% (`settle`, kept for things that arrive). The 20% `pop`
   spring is reachable only from the expressive stylesheet.
5. **Reduced motion loses movement, never information.** Every recipe says what is left: a
   surface still fades, a refusal still shows its colour and its words, a value is simply there.
6. **Interrupted, it turns round.** Entrances and exits are transitions on Base UI's
   `data-starting-style` / `data-ending-style`, so a layer closed mid-open reverses from where it
   is. One-shot animations (a shake, a burst, a rolling digit) start over.

## How often you meet it

The frequency decides how much motion a part may have.

| Met | Examples | At most |
|---|---|---|
| constant (many a minute, or by keyboard) | menu and command items, typing, list navigation | no motion; a menu opened from the keyboard does not animate |
| frequent (tens a day) | a button press, a switch, a checkbox, a tooltip, a menu opened by pointer | 100 to 200ms, no overshoot |
| occasional | a dialog, a sheet, a toast, a panel opening, a progress bar moving | up to `--motion-state`; the firm spring |
| rare | a success, a refusal, a first run | up to `--motion-move`; the emphasis curve; the expressive layer lives here |

## What each part does

Each row is a contract in `motionContracts` (`@unicron/ui/motion`). The playground's Motion view
(`?view=motion`) shows each one live, with a reduced switch and a 10× slow switch.

| Part | Moves | For how long | Under reduced motion |
|---|---|---|---|
| Button, IconButton, a lone Toggle | 1px down while held (`motion-push`); a popup trigger does not move | `--motion-press` down, `--motion-fast` back | colour only |
| Switch | the knob slides | `--motion-fast` | the knob is at its end at once |
| Checkbox | the mark fades | `--motion-fast` | the same |
| Tabs (line) | one indicator slides to the chosen tab | `--motion-base`, move curve | at once |
| Dialog | popup and dim fade in place | 200ms in, 120ms out | the same |
| Popover | fades and moves 8px off its trigger | 200ms in, 120ms out | fades in place |
| Tooltip, command palette, TruncatedText's full text | fade | 120ms both ways | the same |
| DropdownMenu, Select | fade and an 8px step; still from the keyboard | 120ms both ways | fades in place |
| AdaptiveSheet (phone) | slides from the bottom; drags 1:1, resists past open; let go, settles on the firm spring or carries out, faster for a flick | `--motion-base` in; the firm spring back; a share of `--motion-base` out | fades; a drag still follows the finger |
| Collapsible, RunTrace | height and opacity; the chevron turns | `--motion-state`, move curve | height at once, content fades |
| Progress | the fill scales from its start edge | `--motion-base`, move curve | at the new value at once |
| StatusOrb | halo breathes, ring turns, needs-you ring grows and fades | loops | still; working ring dashed |
| Toast | arrives, restacks, leaves | `--motion-base` in, `--motion-fast` out | fades; a swipe still works |
| RollingNumber | changed characters roll, up or down | `--motion-state`, move curve | at once |
| SecretField, CodeDisplay | the copy words fade; a shown value fades in; strength cells fill in turn; the next code fades in | `--motion-fast`; cells 50ms apart | the same, without the stagger |

Parts not in this table have no motion of their own beyond a hover or press colour.

## Going further in an app

- **Expressive moments.** Import `@unicron/ui/styles/motion-expressive.css` and put
  `data-motion="expressive"` where it should apply ([05 · Consuming → expressive
  motion](05-consuming.md#expressive-motion-opt-in)). A press scales and springs back, a dialog
  arrives on the emphasis curve, and `motion-burst` pops in a success mark.
- **A gesture of your own** (a swipe row, a card thrown away). Use the same rules the sheet uses:
  `releaseVelocity(samples)` for the speed of the last 100ms, `shouldDismiss({ offset, size,
  velocity })` for whether it goes, `releaseShare(velocity)` for how much of the exit's duration a
  flick takes, and `rubberBand(distance, max)` past a limit. The `data-release` recipe gives the
  motion. All from `@unicron/ui/motion`.
- **A physics library.** If an app needs layout animation or a gesture beyond this, it may add one
  (Motion, for example) and feed it the system's springs: `dist/tokens.json` keeps each spring's
  stiffness and damping, and `@unicron/tokens/spring` exports the solver the CSS curves are built
  from. `@unicron/ui` itself stays free of a motion library: if three or more of its parts come to
  need gesture physics, that is the time to revisit.
- **One box, another mode.** `data-motion="reduced"` puts everything inside on the reduced path
  whatever the user's setting (a preview, a test); `data-motion="off"` removes motion.

## Adding a motion

1. Start from a recipe in `packages/ui/src/styles/motion.css`. If none fits, add one there, built
   only from the motion roles, with its reduced form at the end of the file.
2. Put the recipe's class on the part. Never a duration, curve or tier 1 motion value in a
   component: `pnpm lint:tokens` refuses them.
3. Add a contract to `packages/ui/src/lib/motion/contracts.ts`: trigger, the properties it may
   move, its duration role, how often it is met, what happens when it is interrupted, and what is
   left under reduced motion. A component's contract names its moving parts (`surfaces`).
4. Add a card for it to the playground's Motion view (`apps/playground/src/motion.tsx`).
5. Run `pnpm --filter playground test:motion` after a build. Each contract is checked in a real
   browser: it moves only what it lists, for no longer than its role, never past 400ms, not at
   all under reduced motion, and a reversal carries on from where it was. Start, middle and end
   frames are saved with the results.
6. Say what moves in the part's line of [03 · Components](03-components.md), and in a changeset.

## What is left on purpose

- `tw-animate-css` is still imported by `@unicron/ui/styles`, though no system part uses it now,
  so an app's own `animate-in` classes keep working. It goes in the next major release.
- No ripple. It needs the pointer's position and adds nothing the expressive burst does not.
- The phone sheet stays on Base UI's Dialog, not its Drawer: Drawer would change the root every
  app writes (`<Sheet>`). Revisit when a second system part needs snap points.
