# 07 · Migrating an app to 1.0

1.0 changes the look of everything at once: the 2026-11 design direction ("Industrial Spec").
This is what an app does to move from any 0.x, in the order to do it. Each step leaves the app
building, so you can stop and look after any of them.

**The short version**

1. Bump both packages to 1.0.0, and set `data-theme` on `<html>`.
2. Run `npx unicron-codemod icons <src>` once, then fix what `tsc` reports.
3. Find where your code used `primary` to mean "the strongest ink", and where it used `secondary`
   or `muted` as a hover fill.
4. Check your app's own token layer against the role table.
5. Move type, radius, and removed props and knobs.
6. Rebuild the shell on the new frame parts.
7. Check the list at the end, on both grounds.

Nothing changes for an app until it edits its two tarball URLs (or npm versions) and its
`@unicron/tokens` override ([05 · Consuming → Install](05-consuming.md#1-install)). An app that is
several minors behind also crosses what changed in between; the two `CHANGELOG.md` files list it.

---

## 1. Set the theme

1.0 has two axes. Set both on `<html>`, in the app's HTML, not in CSS:

```html
<html data-theme="vale" class="dark">   <!-- Vale on graphite (dark) -->
<html data-theme="vale">                <!-- Vale on stone (light) -->
```

- **`data-theme`** is new: `warpcore`, `vale`, `lockdown` or `synapse`. It picks the app's
  identity colour, its live colour and its tinted neutrals. With no attribute an app gets
  Warpcore's values.
- **The ground** is what it was: the `dark` class is graphite, no class (or `light`) is stone.
  Whatever toggled `dark` before still works.
- A component never sets either.

**Your app-extension layer.** If your layer has roles that differ by ground, a plain `.dark`
selector is no longer enough: a `data-theme` box inside a dark page would stay on the light
values. Copy the two ground selectors from `@unicron/tokens/examples/app-extension.css` as they
are. A role that only points at core roles can be declared once, on
`:root, .light, .dark, [data-theme]`.

**The old ramps are not themed.** `--g-neutral-*`, `--g-blue-*` and the rest still exist and hold
the values they had. A surface or an ink your layer builds on them will not follow the app's tint.
Point it at a role instead (`--surface-raised`, `--text-label`, `--line-rule`).

## 2. Run the icon codemod

Icons are IBM Carbon now, drawn as inline SVG. The Material Symbols font is gone, and so are the
props that drove it.

1. Dry run, and read the report:

   ```sh
   npx unicron-codemod icons src --dry
   ```

2. Run it once without `--dry`. It rewrites known Material names on `name=` and `icon=`
   attributes and `icon:` and `iconName:` properties. It lists what it could not map and never
   guesses. Where `fill` marked a state and Carbon has a filled form, it writes that name
   (`name={pinned ? "pin--filled" : "pin"}`).
3. **Do not run it twice.** Some words are names in both sets with different drawings (`error`,
   `warning`, `pin`, `send`, `stop`, `timer`, `history`, `badge`, `category`). The codemod
   refuses a second pass on a tree that already has Carbon names.
4. Run `tsc`. `IconName` no longer accepts a Material name, and `Icon` lost `fill`, `weight`,
   `grade` and `opticalSize`, so the compiler names each one that is left. Where `fill` was the
   only cue for a state, keep the cue: pick the `--filled` name, or show the state another way.
5. **Names that arrive as data** (a server sends them, a saved template stores them) are out of
   the codemod's reach. Change names a server or a build step writes at their source. Translate
   stored names once, when they are read, with `iconFromMaterial()`, and call it *before*
   `isIconName()`: a few Material names are also Carbon names with a different drawing.
6. Eight Material names have no Carbon match: `forward`, `person_off`, `unsubscribe`,
   `waving_hand`, `format_color_reset`, `foundation`, `timer_off` and `progress_activity`. The
   last is `<Spinner />`. For the others, pick another glyph or register your own with
   `registerIcons` ([05 · Consuming → Icons](05-consuming.md#4a-icons-carbon)).
7. Remove the `material-symbols` dependency, any import of its CSS, and any `--c-icon-*` use.
   `IconButton` lost `fill`. `Spinner` takes svg props, not Icon props.
8. A test that read an icon's text (the ligature) reads `data-icon-name` instead.

The full map, with a note for each choice, is `node_modules/@unicron/ui/codemod/MAPPING.md`.

## 3. `primary` and `secondary` changed meaning

No name was removed, so nothing fails to compile. The colours change the day you bump. Search
your own code for these.

| You wrote | It meant | It now is | Write instead |
|---|---|---|---|
| `bg-primary`, `text-primary`, `border-primary` | the strongest ink (near-black) | the app's identity colour, for the one primary action | `bg-foreground`, `text-foreground` for ink |
| `text-primary-foreground` | text on that ink | text on the identity fill | `text-background` on an ink fill |
| `bg-secondary`, `bg-muted` | a grey fill, darker than a card | `surface-raised`, the same colour as `card` and `popover` | `bg-surface-raised`; for a hover, see below |
| `hover:bg-muted`, `hover:bg-secondary` | a hover fill | no change you can see on a raised surface | `hover:bg-state-hover` (a wash) or `hover:bg-accent` (opaque) |
| `<Button variant="secondary">` | a grey filled button | the ink outline | keep it; it is the second action now |
| `<Button variant="destructive">` | a tinted button | the solid critical fill | keep it for the one action a dialog confirms; `ghost-destructive` for a quiet one |
| a pressed `Toggle`, a checked `Checkbox` | the primary colour | inverted ink | nothing; do not restyle it back |

**Three different "secondary"s.** Keep them apart:

- `bg-secondary` and `text-secondary-foreground` are the old shadcn fill, now an alias of
  `surface-raised`.
- `text-text-secondary` is the secondary **text**: the lines that explain.
- `secondary-live` (`text-secondary-live`, `bg-secondary-live`) is each app's second colour. It
  marks work happening now: an agent, a sync, the lit part of a progress bar. Nothing else.

**The rule to carry.** The identity colour is for the screen's one primary action, for identity
text and for selection (`primary-soft` with a 2px `primary-fill` edge, never a solid). Live work
is `secondary-live`. Only "this needs you" is the yellow (`needs-you-fill`).

## 4. The role table

Every role name from before 1.0 still exists and still makes its Tailwind class. Each now points
at a role named as in Figma. If your layer aliased a core role, this is what it now gets.

| Role from before 1.0 | Was | Is now |
|---|---|---|
| `background` | white / near-black | `surface-ground` (tinted by the app) |
| `foreground`, `card-foreground`, `popover-foreground`, `accent-foreground`, `secondary-foreground` | near-black / near-white | `text-body` |
| `card`, `popover`, `muted`, `secondary` | white, white, grey, grey | `surface-raised`, one colour |
| `accent` | a grey fill | 8% of `text-body` in `surface-raised`: the opaque hover and highlight fill |
| `support-foreground` | a mid grey | `text-secondary` |
| `muted-foreground`, `muted-foreground-on-fill` | two greys | `text-label`, one ink |
| `primary` / `primary-foreground` | the strongest ink / its text | `primary-fill` / `primary-on-fill` |
| `border` | a light grey | `line-rule`, the hairline |
| `input` | a mid grey that held 3:1 | `line-rule`. A field's resting border is a hairline; its focus and error borders are the ones held to 3:1 |
| `ring` | the strongest ink | `text-body`. Focus is one solid 2px ring, 2px clear |
| `destructive` | a red text step | `critical-text` |
| `attention`, `attention-foreground`, `attention-surface` | amber | the needs-you yellow; the text and the wash stay a readable amber on stone |
| `running`, `running-foreground`, `running-surface` | blue | `secondary-live`, and a 14% wash of it |
| `warning`, `info` | bright fills with dark text | re-picked so text on them holds: darker on stone under a white label, lighter on graphite under a dark one |
| `success*` | green | unchanged |
| `protected` / `protected-foreground` | near-black / near-white | `text-body` / `surface-ground` |
| `sidebar` | a grey panel | `surface-ground`: the sidebar sits on the page, set apart by space |
| `sidebar-foreground` | the foreground | `text-secondary` |
| `sidebar-accent` / `sidebar-accent-foreground` | the accent | `primary-soft` / `text-body` |
| `sidebar-border`, `sidebar-ring`, `sidebar-primary*` | as their core names | `line-rule`, `ring`, `primary*` |

New roles, all Tailwind colours under their own names (`bg-surface-ground`, `text-text-label`,
`border-line-rule`): `surface-ground`, `surface-raised`, `surface-scrim`, `line-rule`,
`line-grid-dot`, `text-body`, `text-secondary`, `text-label`, `text-faint`, `primary-fill`,
`primary-on-fill`, `primary-text`, `primary-soft`, `primary-display`, `secondary-live`,
`needs-you-fill`, `needs-you-on-fill`, `critical-fill`, `critical-on-fill`, `critical-text`,
`critical-soft`, `state-hover`, `state-pressed`, `diff-added`, `diff-removed`, `faint-foreground`,
and `swatch-01` to `swatch-12` (a person's own colour for a calendar, a note or a label).

**If your app has its own status roles** (Lockdown's `--attention`, `--danger` and `--secure`;
Synapse's washes from `--g-hue-*`), re-point them: `needs-you-*` for "waits on you", `critical-*`
for an error, `secondary-live` for live work.

Reference: [02 · Tokens → Roles](02-tokens.md#roles-tier-2).

## 5. Type utilities

The fonts are Geist and Geist Mono (section 10), and every text size is one of 23 type roles
(`type-<role>`). The eight utilities from before 1.0 still exist. Four are deprecated aliases;
four keep their names and take new values.

| Before 1.0 | Was | Now | Is |
|---|---|---|---|
| `type-page-title` | 20/28 | alias of `type-title` | 32/36 bold |
| `type-section-title` | 16/24 | alias of `type-subtitle` | 18/28 |
| `type-group-title` | 14/20 | alias of `type-label` | 14/20 |
| `type-support` | 13/20 | alias of `type-caption` | 13/20 |
| `type-body` | 14/22 | `type-body` | 16/24 |
| `type-body-strong` | 14/20 | `type-body-strong` | 16/24, medium |
| `type-meta` | 12/16 | `type-meta` | 12/20, Geist Mono |
| `type-overline` | 11/16, tracked 0.06em | `type-overline` | 11/16, Geist Mono, capitals, tracked 0.04em |

What to do:

- **Move off the four aliases** when you touch a file: write `type-title`, `type-subtitle`,
  `type-label`, `type-caption`. A page title that should not grow to 32px wants `type-lead`
  (24/32) or `type-subtitle`.
- **Body text went from 14 to 16.** Every screen re-flows. A row or a box with a fixed height that
  assumed 14px text will clip.
- **Control text is `type-ui`** (15/20), and a label on a button is `type-overline` (mono caps).
  A line that explains is `type-caption`.
- **The size variables changed.** `--type-page-*`, `--type-section-*`, `--type-group-*` and
  `--type-support-*` are gone. Each role now has five: `--type-<role>-family`, `-weight`, `-size`,
  `-leading` and `-tracking`.
- **`type-overline` and `type-meta` set the label ink.** A colour on a parent does not reach
  them; put the colour class on the same element.
- **Figures.** The mono roles use tabular figures. The three sans number roles (`type-number-hero`,
  `-metric`, `-index`) use proportional figures, as Figma draws them; add `tabular-nums` to a
  value that counts up in place.

Reference: [02 · Tokens → Type roles](02-tokens.md#type-roles).

## 6. Radius

`--radius` went from 10px to 2px, and every step from `rounded-xs` to `rounded-4xl` (and the bare
`rounded`) is that one 2px corner. So `rounded-lg` in your code already draws 2px; nothing to
change there.

- **`rounded-full` is not a control shape any more.** It still draws a circle, so search for it.
  A pill that filtered a list is a `FilterChip`. A round avatar is a square `InitialTile` or
  `Avatar`. A dot (unread, live, a status) is a square.
- **A hard-coded radius** (`rounded-[10px]`, `border-radius: 10px`) is now wrong. Use `rounded`.
- **No shadows, no glass.** Surfaces are flat: a 1px rule, not a shadow. Remove `shadow-*` and
  `backdrop-blur-*` from app surfaces that sit beside system ones, or they will look like the old
  system.

## 7. Removed and changed props and knobs

`tsc` finds the removed props. The knobs it cannot see.

**Props**

| Part | Before 1.0 | Now |
|---|---|---|
| `Icon` | `fill`, `weight`, `grade`, `opticalSize` | removed (step 2) |
| `IconButton` | `fill` | removed |
| `Spinner` | Icon's props | svg props and `label` |
| `Button` | `shape="pill"` | accepted, draws the 2px corner. `size="xs"` draws `sm`; `icon-xs` draws `icon-sm` |
| `Button` sizes | `default` 32, `sm` 28, `lg` 36, `icon` 32 | 40, 32, 48, 40. Labels are mono caps. An edge is an inset ring, so a `border-*` class on a Button does nothing |
| `Badge` | `variant` | `tone` (neutral, live, needs-you, critical, warning, success). `variant` is deprecated; `data-variant` became `data-tone` |
| `Switch` | `size="sm"` | accepted; there is one size, 44 × 24 |
| `Progress variant="segmented"` | one cell per step of `max` | `segments` cells, 32 by default. For a checklist pass `segments={max}` |
| `Skeleton variant="row"` | one 40px block | two bars over a hairline, 76 tall |
| `DialogContent size` | `xs`, `sm` (default), `md`, `lg`, `xl`, `2xl` | `question` 480, `review` 560, `form` 640 (default), `compose` 720, `viewer` 960, `full`. The old names map to the nearest, and each is wider than it was. A dialog with no `size` goes from about 400 to 640 |
| `DialogAction` | icon buttons on a phone | words at every width |
| `SheetContent` | `fullscreen` | `height="full"` (`fullscreen` is a deprecated alias) |
| `SheetHeader` | padded 16 all round | 48 tall, 16 at the sides only. What follows it goes in `SheetBody`, which carries the 16px sides and scrolls. A bottom sheet always draws a grabber, and hugs its content |
| `Textarea` | grew with its text in Chromium | as tall as `rows`. For growth use `TextField multiline` |
| `Label`, `FieldLabel` | sentence text | a mono caps overline above a field. As running text it needs `variant="choice"` |
| `Tabs` | a pill on a grey track | default is a square segmented control; `variant="line"` is the Top Tab look |
| `CodeDisplay` | `density` | `layout` (field, row, tile, compact). It is no longer an `Item` |
| `ApprovalSheet` | `matching: { mode, digits, … }` | `matching` is a union (enter, choose, compare, none). `ApprovalDenyReason` gains `mismatch` |
| `AgentPrompt` | Allow, Deny; keys 1 and 2 by place | Deny, Allow once (the safe answer first); keys by meaning (N and Y). `formatPromptCountdown` returns `01:05` and `45 S` |
| `IndicatorMark` | counts `7`, `9+` | `07`, `99+`; unread is ink, not blue |
| `toast` | from `sonner` | from `@unicron/ui` (section 9) |
| `AppFrameMain` | `bleed` | removed: a phone is always full bleed (section 8) |

**Looks that changed, with nothing to rename.** Check any place your layout leaned on the old
size or shape.

- Fields are 48 tall (were 32), with a 2px inside border on focus. A `ring-*` class an app adds to
  a field no longer pairs with anything.
- `Chip` is 24 tall and square; its remove is a 24px button. `Avatar` is square, and an
  `AvatarGroup` no longer overlaps. `AvatarBadge` is ink (`tone="live"` for presence).
- `Item` rows draw a rule on top and sit edge to edge; a selected one is `primary-soft` with an
  edge. `Empty` is left aligned, with a 32px title (`size="sm"` in a pane).
- Menu rows are 36 tall (44 on touch) in the label role; menu labels are overlines; the panel is
  solid. `Tooltip` has no arrow. A popover is 20rem wide with 16 of padding.
- A horizontal `Separator` adds no height. Joined parts of a `ButtonGroup` share one 1px edge.
- `Spinner` turns once a second with an ease, not at an even rate. `StatusOrb`'s running states
  are the app's live colour; its marks are squares. `RunTrace` writes `//` where it wrote `·`.
- `SecretField` shows word actions ("Show", "Copy") and its countdown as words, and lays out as a
  Field Row. `CodeDisplay`'s code is its own copy control. `ApprovalSheet` is a centred 560
  dialog on a desktop and a sheet under 600; its timer reads `01:40 left`. `LargeTypeView` is a
  viewer with a Done button. `UpdateStatusRow` and `AutoCheckSwitch` are a Field Row and a Toggle
  Row; the switch's default name is "Check for updates automatically".
- `@unicron/ui` has one new dependency, `qrcode-generator` 2.0.4 (for `QrCode`). It shows up in
  your lockfile.

**Knobs that are gone** (an app that re-mapped one in its layer can delete the line)

- Icons: `--c-icon-fill`, `--c-icon-wght`, `--c-icon-grad`, `--c-icon-opsz`,
  `--c-crown-jewel-icon-fill`, `--c-crown-jewel-icon-wght`.
- Dialog and sheet: `--c-dialog-{xs,sm,md,lg,xl,2xl}-{min,max}-width` (now
  `--c-dialog-{question,review,form,compose,viewer}-{min,max}-width`), `--c-sheet-close-size`,
  `--c-sheet-compact-radius`.
- Frame: `--c-app-frame-header-height`, `--c-app-frame-nav-item-width`,
  `--c-app-frame-pivot-width`.
- Security: `--c-secret-field-copy-track`, `--c-secret-field-copy-progress`,
  `--c-code-size-{detail,list,compact}`, `--c-code-letter-spacing`, `--c-code-ring-*`,
  `--c-code-next-ink`, `--c-approval-digit-size`, `--c-approval-timer-*`, `--c-risk-tier-*-ink`,
  `--c-risk-tier-*-bg`, `--c-agent-prompt-edge*`, `--c-large-type-caption-size`.

**Knobs whose value moved**

| Knob | Was | Is |
|---|---|---|
| `--c-dialog-padding` | 1rem | 1.5rem |
| `--c-popover-width` | 18rem | 20rem |
| `--c-sheet-compact-height` | 75dvh | `calc(100% - 3rem)`: a bottom sheet hugs its content |
| `--c-sheet-handle` | a mix of the muted ink | `line-grid-dot` |
| `--c-app-frame-sidebar-width` | 18rem (the list beside the content) | 12.75rem (the navigation column) |
| `--c-progress-fill` | `primary` | `secondary-live` |
| `--c-indicator-dot-size` | 0.5rem | 0.375rem |
| `--c-code-group-gap` | 0.75em | 0.3em |

**Your app's own knobs for things the system now does** can go too, once you use the system's
part: Vale's `--c-nav-*`, `--c-nav-icon-fill-*` and `--c-event-*`; anything that styled an
app-built nav item, page header, list row or calendar event.

## 8. Renamed frame parts

The frame was restructured. Two names kept their word and changed their job, so read this table
before you compile.

| 0.x | 1.0 | Note |
|---|---|---|
| `AppFrameDetail` (a companion pane: `open`, `onOpenChange`, `title`, `detail`, `id`) | **`AppFrameCompanion`**, same props | `AppFrameDetail` is now the detail column of a list + detail (`open`, `onBack`, `size`). `tsc` catches it: `onOpenChange` and `detail` no longer exist there |
| `AppFrameSidebar` (the list beside the content) | **`AppFrameList`** | `AppFrameSidebar` is now the navigation column (204 wide) |
| `AppFrameHeader` | `AppFrameStatusLine` (an app with a sidebar), `AppFrameTopBar` (Warpcore), `AppFrameTopRow` (a phone) | removed |
| `AppFrameNav`, `AppFrameNavItem`, `AppFrameNavEnd` (the floating capsule) | `AppFrameBottomRow` with a `TabBar` of `TabBarItem`s. `indicator` becomes `mark`. What `AppFrameNavEnd` held goes to `AppFrameTopRow actions` | deprecated: they still compile, as a plain row of float buttons, not floating and not frosted, and will be removed |
| `AppFramePivot`, `AppFramePivotEnd` | `AppFrameSidebar` (it shows as its rail when narrow) or `AppFrameTopBar` | removed |
| `AppFrameMain bleed` | nothing: a phone is always full bleed, and the columns pad by the measured chrome | prop removed |
| `--app-frame-nav-clearance`, `--app-frame-nav-clearance-end` | `--app-frame-top-clear`, `--app-frame-bottom-clear` | set by the frame; the columns already pad by them |
| `useViewport().widthClass`: `medium` from 640, `expanded` from 768 | `compact` under 600, `medium` 600 to 1023, `expanded` from 1024 | code keyed on `expanded` moves 768 to 1023 into `medium`; `detailPlacement` is `sheet` there |

Unchanged: `AppFrame` (the root), `AppFrameMain`, `FoldPanes`, the shape of `useViewport`, the
page lock, the safe areas and the keyboard handling. The parts of the frame are no longer
subpaths (`@unicron/ui/app-frame-desktop`): import them from `@unicron/ui` or
`@unicron/ui/app-frame`.

## 9. The new shells

An app writes **one tree of frame parts**. Each part draws itself only where it belongs: the
phone chrome under 600, the desktop shell from 600, list and detail side by side from 1024. So an
app writes no shell CSS and no media query, and puts no `className` on a system component to lay
it out.

```tsx
<AppFrame>
  {/* Desktop: the navigation column. At medium width it shows as its rail. */}
  <AppFrameSidebar lockup={<AppLockup name="Vale" />} footer={<NavItem label="Settings" icon="settings" href="/settings" />}>
    <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="/search" />
    <NavSection title="Mail // folders">
      <NavItem label="Inbox" icon="email" count={12} current href="/inbox" />
      <NavItem label="Drafts" icon="edit" count={2} href="/drafts" />
    </NavSection>
  </AppFrameSidebar>
  <AppFrameStatusLine crumbs={[{ label: "Mail", href: "/mail" }, { label: "Inbox" }]} />

  {/* Phone: the floating top row. */}
  <AppFrameTopRow lockup={<AppLockup name="Vale" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />

  <AppFrameMain>
    <AppFrameList aria-label="Inbox">
      <AppFramePageHead overline="Inbox // 12 unread" title="Today" />
      {/* ListRows */}
    </AppFrameList>
    <AppFrameDetail open={picked !== null} onBack={() => setPicked(null)} aria-label="Message">
      {/* the open message */}
    </AppFrameDetail>
  </AppFrameMain>

  {/* Phone: the status strip, then the bottom row. */}
  <AppFrameAccessory tone="live" meta="Sending // 08 S" title="Board games for the cabin" action={{ label: "Undo", onClick: undo }} />
  <AppFrameBottomRow
    start={<FloatButton label="Search" icon="search" size="l" />}
    tabs={
      <TabBar label="Sections" value={section} onValueChange={setSection}>
        <TabBarItem value="mail" icon="email" label="Mail" />
        <TabBarItem value="calendar" icon="calendar" label="Calendar" />
      </TabBar>
    }
    end={<FloatButton label="New message" icon="edit" kind="primary" size="l" />}
  />

  <Toaster />
</AppFrame>
```

- **Phone.** Content is full bleed under two floating rows. The top row holds the app's lockup and
  one or two float buttons. The bottom row holds search, an icon-only tab bar, and the app's
  create action (the one primary fill). The status strip sits above the bottom row. When the page
  scrolls, the chrome minimizes by itself.
- **Desktop with a sidebar** (Vale, Lockdown, Synapse): `AppFrameSidebar` and `AppFrameStatusLine`.
- **Desktop with a top bar** (Warpcore): `AppFrameTopBar` with `TopTabs`, in place of both.
- **A pushed phone screen** uses `AppFrameTopRow` with a `TopBar` inside, and
  `AppFrameBottomRow variant="detail"` (a composer in `fill`, no tab bar).
- **Sign-in, unlock, first run:** `AppFrameFocus` as the frame's only child.
- **Settings:** `SettingsFrame`.
- **Replace what you built yourself** with the system's part: your nav items (`NavItem`), page
  headers (`PageHead`), list rows (`ListRow`, with `SwipeRow` for swipes), field rows
  (`FieldRow`, `ToggleRow`), filter rows (`FilterChipGroup`), empty states (`EmptyState`),
  banners (`Banner`), the "waits on you" block (`NeedsYou`).
- **Layers on a phone** come from `AdaptiveDialog`, `AdaptiveMenu` and `AdaptivePopover`, not from
  your own media queries.
- **Toasts.** Put the `Toaster` inside the `AppFrame`, and import `toast` from `@unicron/ui`. The
  Toaster no longer hears `toast` from `sonner`, and importing `sonner` yourself brings back a
  `<style>` tag that a strict policy refuses.
- **Counts** are written `12`, not `012`: pass the number, not a string.

Reference: [03 · Components → The frame](03-components.md#the-frame).

## 10. Fonts

Inter is gone. The system is set in **Geist** (words) and **Geist Mono** (labels, numbers, code).

- `@unicron/ui/styles` imports both, from `@fontsource-variable/geist` and
  `@fontsource-variable/geist-mono`. They are dependencies of `@unicron/ui`, so they install with
  it. Your bundler ships them as files, so `font-src 'self'` holds.
- Remove `@fontsource-variable/inter` if your app added it, any `@import` of it, and any
  `font-family` that names Inter.
- `font-sans` and `font-mono` follow by themselves. `font-mono` used to be the system's mono
  stack; it is Geist Mono now, with a slashed zero.
- A page with no Tailwind (an extension frame) links `@unicron/tokens/plain.css` and loads the
  font files from its own origin.
- The stylesheet grew: about 249 kB (38 kB gzip) for `@unicron/ui/styles`, from 157 kB (25.5 kB).
  An app with a CSS budget can use the lean entry
  ([05 · Consuming → A smaller stylesheet](05-consuming.md#a-smaller-stylesheet)); it gets a
  whole app to about 33 kB gzip, not back to 25.

## 11. What to check afterwards

**It builds**

- [ ] `tsc` is clean, and the codemod's report has no unmapped name left.
- [ ] No `material-symbols`, `@fontsource-variable/inter` or `sonner` import is left in the app.
- [ ] Your `dsa ratchet` passes. The counts should fall as your own nav items, rows and headers
      give way to the system's parts; lower the baseline when they do.

**It looks right, on both grounds, in your theme**

- [ ] `data-theme` is on `<html>`. Open the app on graphite and on stone.
- [ ] One solid primary on each screen. Nothing else uses the identity colour as a fill.
- [ ] No leftover ink buttons that should be the outline, and none of your own surfaces still on
      `--g-neutral-*`.
- [ ] No round controls, no shadows, no blur.
- [ ] Rows and boxes with a fixed height still hold their text at 16px.
- [ ] Dialogs are the width you meant: check each one that had no `size`.
- [ ] Every screenshot test moved. Review the new pictures, then accept them.

**It behaves right**

- [ ] On a phone: the bottom row never holds more than two bars; the chrome minimizes on scroll
      and comes back at the top; a field does not zoom the page.
- [ ] At 600 to 1023 wide: the sidebar is its rail; a detail is pushed and has a way back.
- [ ] Every icon-only control has a name. Every gesture has a key or a press.
- [ ] Focus shows as one 2px ring everywhere (a field shows a 2px inside border).
- [ ] A toast shows, with its one action, where the frame puts it.
- [ ] Tests that looked for `animate-spin` on a spinner look for `data-slot="spinner"`; tests
      that asked for a `BUTTON` tag on a list row ask for the `button` role.

**For a strict policy (Lockdown's web vault)**

- [ ] The page gets no `<style>` tag from the system: nothing imports `sonner`.
- [ ] Fonts load from the app's own origin.
- [ ] Stored icon names go through `iconFromMaterial()` when they are read.
