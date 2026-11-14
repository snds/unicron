---
name: unicron
version: 1.0.0
description: Industrial Spec. The shared look of Vale, Warpcore, Lockdown and Synapse. Square, flat and ink-first; a Swiss grid, Geist and Geist Mono, hairline rules; one identity colour per app, one live colour, one yellow for "this needs you".
themes:
  apps: [warpcore, vale, lockdown, synapse]
  default: warpcore
  grounds: { graphite: dark, stone: light }
colors:
  # The default app (warpcore). Each app sets the same 28 slots in packages/tokens/tokens/themes/<app>.json.
  graphite:
    surface-ground: "#18191D"
    surface-raised: "#212125"
    line-rule: "#313238"
    line-grid-dot: "#393A40"
    text-body: "#EFF0F3"
    text-secondary: "#D3D4D8"
    text-label: "#B2B4BA"
    text-faint: "#5F6066"
    primary-fill: "#5146EE"
    primary-on-fill: "#FFFFFF"
    primary-text: "#A1AEFF"
    primary-soft: "#1F2343"
    primary-display: "#888EFF"
    secondary-live: "#1EC5E4"
  stone:
    surface-ground: "#EFF0F5"
    surface-raised: "#F7F8FD"
    line-rule: "#D1D2D9"
    line-grid-dot: "#BCBDC4"
    text-body: "#151618"
    text-secondary: "#3C3D40"
    text-label: "#67696E"
    text-faint: "#A3A4AB"
    primary-fill: "#4837E0"
    primary-on-fill: "#FFFFFF"
    primary-text: "#4E4DCD"
    primary-soft: "#D5DDFF"
    primary-display: "#4837E0"
    secondary-live: "#007491"
  # The same in every app.
  needs-you: { fill: "#EDE54A", on-fill: "#1C1C1C" }
  critical:
    graphite: { fill: "#BE2323", on-fill: "#FFFFFF", text: "#FF978A", soft: "#3E1F1B" }
    stone: { fill: "#B7191C", on-fill: "#FFFFFF", text: "#B6322D", soft: "#FFD9D3" }
  scrim: { graphite: "#000000", stone: "rgb(20 22 24 / 0.64)" }
typography:
  sans: '"Geist Variable", Geist, ui-sans-serif, system-ui, sans-serif'
  mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace'
  roles: 23
rounded:
  base: 0.125rem
  every-step: 0.125rem
  round: 999px
spacing:
  unit: 0.25rem
size:
  control: 3rem
  touch-min: 2.75rem
stroke:
  rule: 1px
  emphasis: 2px
motion:
  fast: 120ms
  base: 200ms
  ease: cubic-bezier(0.2, 0, 0, 1)
iconography:
  family: IBM Carbon (inline SVG, 32 px art)
  sizes: { md: 20px, sm: 16px }
---

# unicron: the look

This file says what the four apps look like and why. Values live in
[`@unicron/tokens`](docs/02-tokens.md), parts in [`@unicron/ui`](docs/03-components.md). Where
this file and Figma disagree, Figma's `Unicron / Components` page and Sean's decisions win, and
this file is wrong.

## The look: Industrial Spec

A part catalogue, a datasheet, an equipment label, on a Swiss grid.

- **Structure and type carry it.** Large type, small mono labels, hairline rules, space. There is
  no decoration to fall back on.
- **Square.** One corner, 2px. Marks are squares.
- **Flat.** A surface is a fill and a 1px rule. No shadow lifts it.
- **Ink first.** Text and outlines are ink. Colour is rare, so it means something when it shows.
- **Mono caps labels, with `//` between facts:** `INBOX // 12 UNREAD`. Type them in sentence
  case; the type role sets the capitals.
- **Real data.** Every label, code, number and mark on a screen is real and relevant: task
  `SEA-48`, item `03`, a real name as it is written (Steam, not STEAM). No lorem, no decorative
  codes. A label shows real data or it does not appear.
- **Content is the focal point.** In a product, the open message or the password's details is what
  the screen is for. Headings and chrome stay quiet.

The anatomy of the small parts came from shadcn/ui on Base UI. That is a guide to how a part is
built, not to how it looks.

## Colour

**One system, four apps.** Each app declares two colours. Its neutrals are tinted by the first.

| App | Primary: its identity | Secondary: live work |
|---|---|---|
| Warpcore | blue-violet (hue 277) | plasma cyan (215) |
| Vale | Japanese indigo (228) | fog teal (165) |
| Lockdown | signal green (152) | steel blue (245) |
| Synapse | magenta (352) | synaptic teal (195) |

Lockdown's steel blue is a proposal Sean has not confirmed. Two pairs sit close and are watched:
Lockdown's green beside `success`, and Synapse's magenta beside `critical`.

**Two axes,** set on `<html>` (or any box). A component never sets either.

- **App:** `data-theme="warpcore" | "vale" | "lockdown" | "synapse"`. With none, Warpcore's.
- **Ground:** graphite (dark, the `dark` class) or stone (light). Both come from the same roles.

So Figma's mode `vale / graphite` is `<html data-theme="vale" class="dark">`.

**The roles**

- **Surfaces and lines.** `surface-ground` is the page. `surface-raised` is a field, a menu, a
  dialog, a bubble. `line-rule` is every hairline. `surface-scrim` dims the page behind a layer.
- **Text, three levels and a faint.** `text-body` for reading and titles; `text-secondary` for
  the lines that explain; `text-label` for labels, meta, overlines and placeholders; `text-faint`
  for an index number, and never as the only way to read something.
- **Primary is identity.** `primary-fill` with `primary-on-fill` is the one solid action.
  `primary-text` is identity-coloured words. `primary-soft` is a selected row. `primary-display`
  is identity at 36px and up.
- **Secondary is live.** `secondary-live` marks work happening now: an agent, a sync, the lit
  part of a progress bar. Nothing else.
- **Needs you** is one yellow, the same in every app and on both grounds, with dark ink on it.
- **Critical** is the error set, the same in every app: fill, on-fill, text, soft.
- **Swatches,** `swatch-01` to `swatch-12`, are a person's own colours for a calendar, a note or
  a label. A swatch is a bar, an edge or a square beside a name. It is never a status and never a
  fill behind text.
- `success`, `warning` and `info` keep their own ramps. The shadcn names (`background`,
  `foreground`, `muted`, `border`, `ring`, …) still work; each is an alias of a role above.

**Contrast is solved, then measured.** Text is held to APCA: body Lc 90, secondary 75, labels and
coloured text 60, large display 45, text on a fill 75. Every pair a component paints is measured
in all 8 modes. A miss that is Figma's own value is a named exception, reported for a decision,
never hidden ([02 · Tokens → Contrast](docs/02-tokens.md#contrast)).

## Type

Geist for words. Geist Mono for labels, numbers and code. Every text is one of 23 roles
(`type-<role>`), never a hand-picked size.

`display` 72/68 · `display-compact` 48/48 · `title` 32/36 · `lead` 24/32 · `subtitle` 18/28 ·
`body` 16/24 · `body-strong` · `response` 17/28 · `ui` 15/20 · `ui-emphasis` · `label` 14/20 ·
`caption` 13/20 · `overline` mono 11/16 caps · `folio` mono 12/20 · `meta` mono 12/20 ·
`code-inline` mono 15/20 · `code-display` mono 36/40 · `number-hero` 168/148 · `number-metric`
44/44 · `number-index` 28/32 · `number-count` mono 24/28 · `brand-wordmark` 13/16 · `icon-glyph`.

- Every line height is a multiple of 4.
- `overline` is the only role with a case. The mono roles use tabular figures; the three sans
  number roles use proportional figures.
- Sizes that share a line sit on one baseline.
- `response` is for what a model wrote, and for a mail's body. `body` is the app's own voice.
- A button's label is `overline`. A control's value is `ui`. A line that explains is `caption`.
- The four names from before 1.0 are aliases: `type-page-title` → title, `type-section-title` →
  subtitle, `type-group-title` → label, `type-support` → caption. `type-measure` caps prose at 72ch.

## Icons

IBM Carbon, drawn as inline SVG from a curated, typed set.

- 20px by default. 16px only inside a compact control (a button, a top tab, a chip, inline meta),
  and the control sets that itself.
- An icon takes the ink of the text around it. A current item does not fill its icon.
- An icon alone is never the only name of a control.
- **No sparkle icons.** What a model wrote is marked by a live-coloured edge and an overline.
- An app registers its own glyph only where Carbon has none.

## Layout and grid

- **4px.** Space is a multiple of 4. A component's box is a multiple of 4 tall. Inside a
  component, 2, 6, 10 and 14 are allowed.
- **Reading text sits on the grid.** Body size and larger, outside controls. Labels, meta, control
  text and anything centred against a control are exempt: vertical centring wins there.
- **Strokes never add height.** A rule is drawn inside its box (`rule-t`, `rule-box`, `edge-l`),
  so a row is the same height with or without one.
- **Group by space.** The space inside a group is clearly smaller than the space between two
  groups: 1 to 2 or wider (16 inside, 32 between).
- **Rules and space, not cards.** A list is rows under hairlines. A panel is a column with a
  rule. A raised surface is for things that sit on the page: a field, a bubble, a layer.
- **Flush left.** Text and rows start at one edge. A reading column is 720 wide at most.
- **Sizes.** A control is 48 tall at most (`size-control`). Nothing a finger presses is under 44
  (`size-touch-min`): a smaller control widens its target, not its drawing.
- **Width classes.** Compact (under 600) is the phone chrome. Medium (600 to 1023) is the desktop
  shell with one content column. Expanded (1024 and up) puts list and detail side by side.

## Chrome

The patterns are Apple's floating chrome. The look is this system's: solid, square, no glass.

**Phone.** Content is full bleed under two floating rows.

- **Top row:** the app's lockup at the left (a mark and a wordmark), one or two float buttons at
  the right.
- **Bottom row:** search at the left, an icon-only tab bar in the middle, and the app's create
  action at the right, in thumb reach. That button is the screen's primary fill.
- **Status strip:** one line above the bottom row for what is live or waiting: an undo, a running
  task, a sign-in request.
- **Scrolled:** the large title becomes a small centred one, the wordmark hides, the tab bar
  shrinks to its active tab, and the strip moves into the bottom row. There are never more than
  two bars at the foot.
- **Scroll edge:** content fades into the ground under the chrome. It is a masked fill of the
  ground, the one gradient in the system. It is not a blur.

**Desktop.** Vale, Lockdown and Synapse have a sidebar: the lockup, sections of nav items under
mono caps headings, a foot. It sits on the page's own ground, set apart by space, with a status
line across the top of the content. Warpcore has a top bar: the lockup, numbered top tabs, a
status and one action. Either way the content is columns with rules between them.

**Layers** (a dialog, a sheet, a menu, a popover, a toast) are the raised surface with a 1px
rule. Behind a layer the page dims through `surface-scrim`: on graphite 50% behind a sheet, 60%
behind a dialog, 32% behind a menu; on stone the role's own 64% for all three. A scrim is never
opaque. On a phone a dialog, a menu and a popover become a bottom sheet.

## Gestures

- **A row swipes.** Left shows its actions; the outermost is the primary-filled one, and a full
  swipe runs it. Right runs one leading action.
- **The chrome answers too.** Slide along the tab bar to move between sections. Scroll minimizes
  the chrome. Hold the create button for quick create. Swipe up on the status strip to open what
  it is about. Swipe the page head sideways to change account, vault or workspace. Pull down to
  refresh.

**Safety**

- An approval never happens on a swipe. A sign-in or a merge opens a review first.
- A full swipe runs only an action that can be undone.
- A needs-you strip cannot be swiped away.
- A swipe from the screen's left edge belongs to the system's way back.
- **Every gesture has a key or a press.** No action is reachable by a gesture alone.

## States

Figma draws no states. These are the system's own, and they are still Sean's to confirm.

- **Hover:** a 6% ink wash on a neutral part; a solid fill goes to 90%.
- **Pressed:** a 10% wash; a solid goes to 80%.
- **Focus:** one 2px ink ring, 2px clear, on every control. A field shows a 2px inside border in
  the identity colour instead. On the yellow the ring takes the yellow's ink.
- **Selected, current:** `primary-soft` with a 2px identity edge. Text keeps its inks.
- **On** (a pressed toggle, a chosen segment, an active filter chip): inverted ink.
- **Disabled:** 50%. When the reason is one the person can fix, the control says it in a line
  underneath and stays reachable.
- **Loading:** a spinner where the icon was; the label stays. The "agent is working" motion is
  reserved for agents: generic loading never borrows it.
- **Error:** the critical set, with words. A field shows a 2px critical inside border.

Motion is mechanical: short, eased firmly to a stop, on the motion roles
([motion](docs/02-tokens.md#motion)). Animate opacity and transform. Everything stills under
reduced motion.

## Emphasis

1. **One solid primary on a screen:** its one main action. With a layer open, count the layer.
2. **The identity colour is for three things:** that action, identity text, and selection. Keep
   it under a tenth of the screen.
3. **Selection is never solid.** It is the soft tint and a 2px edge.
4. **The live colour appears only on live or agent work.**
5. **The yellow means "this needs you", and nothing else.** At most one block or strip on a
   screen. One solid action inside it; a second action is text only. No other solid primary
   shape within 96px of it in the content.
6. **Colour never carries a meaning alone.** A status has a word, a shape or a glyph beside it.
7. **Do not let three heavy shapes compete:** a primary button, a yellow block and a solid
   anything else.

## Banned

- Glass, blur, frosted surfaces, `backdrop-blur`. Apple's patterns, not Liquid Glass.
- Gradients as decoration. The scroll edge is the one gradient.
- Shadows on surfaces, and glow.
- Sparkle icons and glowing orbs.
- Round controls and pills. `rounded-full` is not a control shape.
- A solid primary for selection, or more than one solid primary on a screen.
- The yellow for anything but "this needs you".
- Fake data: lorem, invented codes, decorative barcodes.
- Stock photography. An empty state is words and one action.
- Three bars at the foot of a phone.
- A colour, a px value or a motion value written into a component. A `--g-*` value in a
  component. A `className` on a system part to make a new part.

## Role list (tier 2)

Figma's roles: `surface-ground` `surface-raised` `surface-scrim` `line-rule` `line-grid-dot`
`text-body` `text-secondary` `text-label` `text-faint` `primary-fill` `primary-on-fill`
`primary-text` `primary-soft` `primary-display` `secondary-live` `needs-you-fill` `needs-you-on-fill`
`critical-fill` `critical-on-fill` `critical-text` `critical-soft`.

States and diff: `state-hover` `state-pressed` `diff-added` `diff-removed`.

Swatches: `swatch-01` `swatch-02` `swatch-03` `swatch-04` `swatch-05` `swatch-06` `swatch-07`
`swatch-08` `swatch-09` `swatch-10` `swatch-11` `swatch-12`.

Aliases (the shadcn contract): `background` `foreground` `card` `card-foreground` `popover`
`popover-foreground` `primary` `primary-foreground` `secondary` `secondary-foreground` `muted`
`muted-foreground` `muted-foreground-on-fill` `support-foreground` `faint-foreground` `accent`
`accent-foreground` `destructive` `border` `input` `ring` `protected` `protected-foreground`
`sidebar` `sidebar-foreground` `sidebar-primary` `sidebar-primary-foreground` `sidebar-accent`
`sidebar-accent-foreground` `sidebar-border` `sidebar-ring`.

Status: `success` `success-foreground` `success-surface` `warning` `warning-foreground` `info`
`info-foreground` `attention` `attention-foreground` `attention-surface` `running`
`running-foreground` `running-surface`.

Sizes: `--size-control` `--size-touch-min`. Strokes: `--stroke-rule` `--stroke-emphasis`.
Radius: `--radius`. Fonts: `font-sans` `font-mono` `font-heading` (an alias of sans).

Motion: `--motion-press` `--motion-fast` `--motion-base` `--motion-state` `--motion-move`
`--motion-tick` `--motion-spin` `--motion-pulse`; the curves `--motion-ease` `--motion-ease-enter`
`--motion-ease-exit` `--motion-ease-move` `--motion-ease-emphasis` `--motion-ease-pulse`; the
springs `--motion-spring-settle` `--motion-spring-firm`, each with a `-duration`;
`--motion-stagger` `--motion-stagger-max` `--motion-press-depth` `--motion-press-depth-small`.
