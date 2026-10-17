# 04 · Patterns

A pattern is a composition of two or more primitives that does one recognisable job. unicron
does not ship patterns as code yet; it ships the catalogue and the process by which patterns get
promoted.

## Where pattern candidates come from

`pnpm ds:patterns` scans every `*.tsx` under `apps/**/src` and `packages/**/src` and writes
suggestion records to `.dsa/patterns.json`. A record is raised when an arrangement of two or more
components repeats three or more times across two or more hosts (files by default). Each record
has an anatomy (slot tree), the occurrences, a tier and a confidence:

- **pattern** — root is a system component and the subtree spans two or more families
- **variant** — root and children are one family ("a Dialog used as a form")
- **compound-component** — two or three nodes in one family
- **snowflake** — below the thresholds; reported only with `--all`

Nothing is created automatically. A person reads the record, decides whether it is a pattern, a
variant of something that exists, or a genuine one-off, and either promotes it (name it, document
it here, give it a playground entry) or dismisses it. Dismissed candidates that keep reappearing
are a signal in themselves.

## Starting catalogue

The seven goal-driven patterns every product needs (framework 09 §7). Name the job first, then
assemble from primitives; climb an escalation ladder only on evidence.

| Pattern | Job | Composition from `@unicron/ui` |
|---|---|---|
| **Form / data entry** | Collect and validate values | `FieldSet` → `Field` + `Input` / `NativeSelect` / `Checkbox` / `Switch` → one primary `Button` → `FieldError` inline |
| **Master–detail** | Browse a set, inspect one | `Item` list or table (master) → `Sheet` / `AdaptiveSheetContent` or a panel (detail) → `ButtonGroup` toolbar |
| **Dashboard** | Show status at a glance | card grid → `Badge` / progress → `Skeleton` on load → `Empty` when there is nothing |
| **Wizard / multi-step** | Sequence a long task | stepper (position) → one form per step → progress → `Toaster` on completion |
| **The async triad** | Survive every data condition | `Skeleton` or `Spinner` (loading) → content → `Empty` (no data) → alert (error). Every data view needs all three. |
| **Confirmation** | Prevent costly mistakes | action → `Dialog` with a destructive `Button` (irreversible) *or* toast + undo (reversible); choose by reversibility |
| **Filtering** | Narrow a large set | `Command` / search `InputGroup` → removable `Chip`s (active filters, each with a `ChipRemove`) → `ButtonGroup` toolbar → results |

Escalation ladders: NativeSelect → Combobox (list grows past ~15); Tooltip → Popover (content
becomes interactive); toast → alert → banner → alert dialog (urgency rises).

## Promoting a candidate

1. Read the suggestion record. Check `nearestExisting`; if it scores high, it is a variant.
2. Write the pattern here: job, composition, the shape props that matter, and a do/don't line.
3. Add a playground section that renders it in light and dark.
4. If it earns a component (repeats in three products or needs its own behaviour), generate or
   write it in `packages/ui`, add it to [03-components.md](03-components.md), and let the next
   `ds:scan` count it as system usage.

## Promotion log

| Date | Candidate (dsa record) | Evidence | Decision |
|---|---|---|---|
| 2026-10-15 | Tooltip-wrapped icon button (`ToolButton`, `TooltipRecipe`) | Mailbird: 13 tooltip triggers, rebuilt as 3 local wrappers (`ToolbarButton`, `ToolButton`, `Mark`) | **Component**: `IconButton`. It has its own behavior: one label is both the accessible name and the tooltip. |
| 2026-10-15 | Pill chips (`Fab5`, filter rows) | Mailbird: 18 `rounded-full` overrides on Button, in 3 filter rows (splits, smart groups, note folders) | **Variant**: `Button shape="pill"` |
| 2026-10-15 | Muted and destructive ghost buttons | Mailbird: 11 `ghost` + muted ink, 5 `ghost` + destructive ink (dialog-footer Delete) | **Variants**: `ghost-muted`, `ghost-destructive` |
| 2026-10-15 | Muted / destructive icons | Mailbird: 30+ `text-muted-foreground` and 2 `text-destructive` on a standalone Icon | **Prop**: `Icon tone` |
| 2026-10-15 | Full-screen phone sheet | Mailbird: the same 4-class override on 3 bottom sheets (composer, editor frame, event) | **Prop**: `SheetContent fullscreen` |
| 2026-10-15 | `DialogHeader` → title + description (19× / 18 files) | The standard composition, used as designed | **Dismissed**: correct use, nothing to promote |
| 2026-10-17 | Rows drawn as plain `<button>`s (hand-raised; dsa can't see raw elements) | Mailbird ADR-0057: 11 icon + title + hint rows (settings, provider choices, contact history, booking links) that couldn't use `Item`, which only had hover as a link | **States**: `Item` as a button gets hover, `data-selected`, and `disabled` |
| 2026-10-17 | Text actions inside a sentence (hand-raised) | Mailbird: 6 plain `<button>`s, plus 2 `variant="link"` Buttons overriding `h-auto p-0` / `px-0` | **Size**: `Button size="inline"` |
| 2026-10-17 | Chips with a × or a main action (hand-raised) | Mailbird: 5 different hand-drawn ×s (two full-height segments, one bare icon, two round 20px targets), and 3 split chips in Notes | **Component**: `Chip` + `ChipAction` + `ChipRemove`. It has its own anatomy: a value with up to two actions. |
| 2026-10-15 | `DropdownMenuItem` + `Icon` (`DropdownMenuRecipe`, 17×) | The standard composition | **Dismissed**: correct use |
| 2026-10-15 | One-off `Fab` (floating compose on phones) | 1 use | **Parked**: below the threshold. Revisit if a second product needs a floating action. |
| 2026-10-15 | Dialog footers that keep Delete, Cancel, and Save in one row on phones (`ActionDialog`, 4 dialogs) | Mailbird: 4 `flex-row` overrides on `DialogFooter`; 11 footers pair a dismiss with a confirm | **Component**: `DialogActions` + `DialogAction`. Decided by Sean: on phones, a row of icon buttons, laid out like Apple's sheet controls (not the glass look) |
| 2026-10-15 | Solid menus (`bg-popover` over the frosted default, 7 menus) | Mailbird: the menus with the most text | **Decided by Sean: glass.** Menus stay frosted, and the overrides go. |
| 2026-10-17 | One-time code rows (hand-raised; spec [code-display](specs/security/code-display.md)) | Lockdown brief §5.7: the Codes view, every Login detail with a code, and the palette's code rows need the same period maths, expiring cue, early next code and digit-by-digit label | **Component**: `CodeDisplay`. It has its own behavior: a code shown by default that expires on a clock, with a rollover announcement rule. |
| 2026-10-17 | Full-screen secret for reading across a room (hand-raised; spec [large-type-view](specs/security/large-type-view.md)) | Lockdown brief §5.7, §2.7 TV activation, D69 kit page: Wi-Fi passwords, activation codes, the Secret Key and recovery codes all need the same classification, grouping, captions and lifetime | **Component**: `LargeTypeView`. Not a SecretField variant: no field semantics, no edit mode; its job is transcription. |
| 2026-10-17 | The crown-jewel frame (hand-raised; spec [crown-jewel-treatment](specs/security/crown-jewel-treatment.md)) | Lockdown brief §2.9 point 5, §5.7: seed phrases, recovery codes and the master mailbox login need to look like one class everywhere and gate their use | **Component**: `CrownJewelSurface` + `CrownJewelMark` + `CrownJewelGate`. Not a Badge variant plus a class: the surface re-maps the semantic tier and flips children into gated mode through context. |
