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
| **Master–detail** | Browse a set, inspect one | `Item` list or table (master) → `Sheet` / `AdaptiveSheetContent`, or `ResizablePanes` when both stay on screen (detail) → `ButtonGroup` toolbar |
| **Dashboard** | Show status at a glance | card grid → `Badge` / progress → `Skeleton` on load → `Empty` when there is nothing |
| **Wizard / multi-step** | Sequence a long task | stepper (position) → one form per step → progress → `Toaster` on completion |
| **The async triad** | Survive every data condition | `Skeleton` or `Spinner` (loading) → content → `Empty` (no data) → alert (error). Every data view needs all three. |
| **Confirmation** | Prevent costly mistakes | action → `Dialog` with a destructive `Button` (irreversible) *or* toast + undo (reversible); choose by reversibility |
| **Filtering** | Narrow a large set | `Command` / search `InputGroup` → removable `Chip`s (active filters, each with a `ChipRemove`) → `ButtonGroup` toolbar → results |

Escalation ladders: NativeSelect → Select (an option needs more than plain text) → Combobox (list grows past ~15); Tooltip → Popover (content
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
| 2026-10-17 | Dialog widths and scrolling (hand-raised; dsa counts them as `className` overrides) | Mailbird: about 20 `DialogContent` overrides, all `sm:max-w-{md,lg,2xl,3xl}`, two with `max-h-[calc(100dvh-2rem)] overflow-y-auto` | **Prop**: `DialogContent size`, and every dialog scrolls inside itself |
| 2026-10-17 | Rows with a main action and buttons of their own (hand-raised) | Mailbird ADR-0058: 3 rows kept as raw buttons (a booking link with Preview and Copy, the newsletter bundle with its menu, a meeting with Join), since a row that is one button can't hold others | **Part**: `ItemMain`, the row's main action with a target over the whole row |
| 2026-10-15 | `DropdownMenuItem` + `Icon` (`DropdownMenuRecipe`, 17×) | The standard composition | **Dismissed**: correct use |
| 2026-10-15 | One-off `Fab` (floating compose on phones) | 1 use | **Parked**: below the threshold. Revisit if a second product needs a floating action. |
| 2026-10-15 | Dialog footers that keep Delete, Cancel, and Save in one row on phones (`ActionDialog`, 4 dialogs) | Mailbird: 4 `flex-row` overrides on `DialogFooter`; 11 footers pair a dismiss with a confirm | **Component**: `DialogActions` + `DialogAction`. Decided by Sean: on phones, a row of icon buttons, laid out like Apple's sheet controls (not the glass look) |
| 2026-10-15 | Solid menus (`bg-popover` over the frosted default, 7 menus) | Mailbird: the menus with the most text | **Decided by Sean: glass.** Menus stay frosted, and the overrides go. |
| 2026-10-17 | One-time code rows (hand-raised; spec [code-display](specs/security/code-display.md)) | Lockdown brief §5.7: the Codes view, every Login detail with a code, and the palette's code rows need the same period maths, expiring cue, early next code and digit-by-digit label | **Component**: `CodeDisplay`. It has its own behavior: a code shown by default that expires on a clock, with a rollover announcement rule. |
| 2026-10-17 | Full-screen secret for reading across a room (hand-raised; spec [large-type-view](specs/security/large-type-view.md)) | Lockdown brief §5.7, §2.7 TV activation, D69 kit page: Wi-Fi passwords, activation codes, the Secret Key and recovery codes all need the same classification, grouping, captions and lifetime | **Component**: `LargeTypeView`. Not a SecretField variant: no field semantics, no edit mode; its job is transcription. |
| 2026-10-17 | The crown-jewel frame (hand-raised; spec [crown-jewel-treatment](specs/security/crown-jewel-treatment.md)) | Lockdown brief §2.9 point 5, §5.7: seed phrases, recovery codes and the master mailbox login need to look like one class everywhere and gate their use | **Component**: `CrownJewelSurface` + `CrownJewelMark` + `CrownJewelGate`. Not a Badge variant plus a class: the surface re-maps the semantic tier and flips children into gated mode through context. |
| 2026-10-17 | ApprovalSheet (from spec, first principles, Lockdown brief §5.7) | `docs/specs/security/approval-sheet.md`; Lockdown's device, agent, TV and contact approvals all reduce to one sheet | **Component**: `ApprovalSheet`. Owns the origin gate, number matching, arming delay, timeout that denies, retry limit, and the report action. DSA none |
| 2026-10-17 | RiskTierBadge (from spec, first principles, Lockdown brief §5.7) | `docs/specs/security/risk-tier-badge.md`; Lockdown bridges and agent grants, Mailbird plug-ins (D6) | **Component**: `RiskTierBadge`. Owns the closed vocabulary and its copy (`riskTierCopy`); word, icon and colour paired by construction. DSA none |
| 2026-10-17 | SecretField (from spec, first principles, Lockdown brief §5.7) | `docs/specs/security/secret-field.md`; replaces Lockdown desktop's placeholder `SecretField`; Mailbird locked notes and Synapse tokens next | **Component**: `SecretField`. Owns the one-shot handle, reveal lifetime, hide-on-blur, timed copy with a conditional clear, and the gate hook. DSA none |
| 2026-11-04 | `Popover` and a styled `Select` (hand-raised) | Warpcore W1 needs both for its chat and model picker, ahead of any local build; both were already next candidates in `03-components.md` | **Components**: generated with the transform ([#65](https://github.com/snds/unicron/pull/65)) |
| 2026-11-04 | `ResizablePanes` (hand-raised) | Warpcore's shell has fixed CSS grid slots waiting on it; the Warpcore plan expects list-detail use in Synapse and Lockdown too | **Component**: generated with the transform ([#66](https://github.com/snds/unicron/pull/66)) |
| 2026-11-05 | `AppFrame`, `AppFrameNav`, `FoldPanes`, `useViewport` and the `short:` and fold variants (hand-raised) | Warpcore on a real iPhone: turning it sideways left the top bar off screen and a gap below the tabs, because the page could scroll and a 14px field made iOS zoom. Nothing here is Warpcore's: Mailbird, Synapse and Lockdown fill the screen too | **Components**: they have their own behaviour, the page lock, keyboard tracking and fold layout; the checks live in one hook |
| 2026-11-13 | Solid menus, reversed (the 2026-10-15 "glass" decision) | Sean's 2026-11 design direction and the Figma components: overlays are solid `surface-raised` with a 1 px rule, no glass, no blur | **Reversed**: `DropdownMenu` and `Select` lists are solid `bg-popover`; dialog and sheet backdrops are the `surface-scrim` role at a knob (`scrim-dialog`, `scrim-sheet`), never blurred. A browser check fails on any `backdrop-blur` in the built stylesheet. |
| 2026-11-14 | Stone scrims at the role's own 64% (review finding: stone dimmed half as much as drawn) | Figma's stone frames dim 64% behind sheets, dialogs and menus alike (Vale Mobile / 05 and Desktop / 02, Lockdown Mobile / 11 and Desktop / 09, Warpcore Mobile / 03); the build multiplied the role's 64% by the graphite knobs (32%, 38%, 20%) | **Token**: `--c-scrim-sheet`, `-dialog`, `-menu` are per ground: 0.5 / 0.6 / 0.32 on graphite, 1 on stone. The 1.0 contract (§1.5) and rules.md §2.6 said "about 32 / 38 / 20"; Figma wins. If Sean prefers the lighter stone scrim, that is his decision to record. |
| 2026-11-14 | Menu rows are Nav Items (review finding) | Figma's two drawn menus (quick create, Vale and Lockdown States / 03; Vale Mobile / 05's folder sheet) are built from Nav Items: the label role (14/20 Medium) in `text-secondary`, the open row on `primary-soft` in body ink, a count at the end | **Component**: `DropdownMenuItem` and the `AdaptiveMenu` rows take the label role and secondary ink, body ink when highlighted, checked or `current`; `AdaptiveMenuItem` gains `count` and `current`. The drawn menu is also 4px taller than the built one (12 under the last row, not 8): left open, the Figma read-out gives a padding of 8. |
| 2026-11-14 | The active tab's icon is `primary-text` (review finding) | Figma's Dock Tab (20:1656) and 32 phone frames of Warpcore, Lockdown, Synapse and Vale's Calendar, Contacts and Notes; only Vale's Mail tab draws body ink | **Component**: `TabBarItem` active is `text-primary-text`, as `RailItem` active. Contract §9.9 had settled on body ink from the one override. |
| 2026-11-14 | A dialog's and a sheet's description is the caption note (review finding) | Figma draws the sentence under a review's rows in the caption role (Lockdown Desktop / 09: one line, 458 wide; Mobile / 11: two lines 20 apart); the parts drew it in the body role | **Prop**: `DialogDescription` and `SheetDescription` are caption by default; `size="body"` for a question whose sentence is its content (`AdaptiveDialog` and `ConfirmDialog` pass it). |
| 2026-11-14 | A popover's head has no close button unless asked for (review finding) | Figma's one popover (Warpcore cw-07) draws an overline over a 15/20 emphasis title, 36 tall, and no close; a popover closes on an outside press | **Default**: `PopoverHeader showCloseButton` is off; the title is `type-ui-emphasis`. `AdaptivePopover` keeps the close on its phone sheet. |
| 2026-11-14 | The Toaster loads a copy of sonner without its style tag (review finding) | Contract section 7: no run-time `<style>` tag (Lockdown's `style-src 'self'`). sonner injects one as its module loads | **Build step**: `vendor/sonner.js` (`scripts/build-sonner.mjs`, checked in `pnpm test`). Apps import `toast` from `@unicron/ui`; sonner's own `toast` does not reach the Toaster. |
| 2026-11-14 | One toast at a time on a phone (review finding) | Contract 5.1c C6 and 5.2: the bottom never holds three bars. Three toasts stacked in the strip's slot made four | **Behaviour**: in a phone frame the Toaster shows one toast; the rest wait and come in the order raised. Three in a column on a desktop. |
| 2026-11-14 | Proportional figures in the three sans number roles (review finding; **for Sean**) | Figma draws number-hero, number-metric and number-index with Geist's proportional figures (a Metric's "145" is 71px wide with a plain 1; 77px with tabular figures). Contract section 2 and the visual spec ask for tabular figures; rules.md 3.1 takes figure styles from Figma | **Type**: tabular figures stay on the mono roles only. A value that counts up in place can add `tabular-nums`. Sean may prefer tabular everywhere a number changes. |
| 2026-11-14 | The hero Metric's unit sits on the number's baseline (review finding; **for Sean**) | Figma bottom-aligns the two boxes (Lockdown Desktop / 07, Synapse Desktop / 01), which puts "/100" about 5px under the number's baseline. The decision record (section 10) aligns mixed sizes on the baseline, and outranks a drawn value | **Kept**: baseline. The label now sits directly on the number's line and the unit is 24 from the number, as drawn; the unit is 8px higher than drawn. `items-end` on the figure would match Figma to 1px. |
| 2026-11-14 | A CodeDisplay tile is 172, not Figma's 170 (review finding; **for Sean**) | Figma's tile sums to 170 (20 + 20 + 10 + 20 + 10 + 44 + 10 + 16 + 20), off the 4px grid; the decision record puts every component on it | **Knob**: `--c-code-tile-min-height` 10.75rem. The parts keep Figma's positions from the top; the 2px go under the bar. |
| 2026-11-14 | A code on an item is centred, with no hairline above (review finding; **for Sean**) | Lockdown Desktop / 01 draws the code row with no rule above it, the label hugging its words, the code centred between the label and the seconds, the bar 10 under it. The build had it left in the value column under a rule | **Layout**: `CodeDisplay layout="field"` as drawn; `rule="top"` adds the hairline. Left in the value column is one class away if Sean prefers the rows' alignment. |
| 2026-11-14 | An empty Composer's Send is full strength (review finding) | Figma's one drawn state of the Composer is the empty one, with a solid Send; every composer on a resting screen is in it. The build dimmed it to 50% | **State**: while only empty, Send is `aria-disabled` and does nothing, at full strength; a disabled composer still dims. |
| 2026-11-14 | A pressed link button takes the body ink (review finding) | Its pressed ink was `primary-text` at 80%: Lc 43 to 45 on graphite, under the label floor, and no contrast recipe measured it | **State**: `active:text-text-body active:underline`; two recipes hold it (`btn-link-press-ground`, `-raised`). |
| 2026-11-14 | An AgentPrompt's keys cannot answer by accident (review finding) | One plain key anywhere on the page answered the newest prompt, a standing grant included, with no delay; a `role="textbox"` did not count as typing | **Behaviour**: keys are inert for 500ms after a prompt starts listening (`--c-agent-prompt-arm-delay`); an option marked `standing` takes its key only with focus inside the prompt; text roles count as typing; each option says its key (`aria-keyshortcuts`); `listen={false}` is the off switch. |
| 2026-11-14 | The short-screen rule needs scarce height (review finding; **for Sean**) | "Narrow and under 1.6 times as tall as wide" put 430 × 667 and every width from 528 to 599 at 844 tall on the short-screen chrome | **Rule**: also under 600 tall. A folded Duo (382 × 580, 385 × 571) keeps the side rail. By size alone a small phone in a browser with both bars showing (375 × 553, 360 × 560) is the folded Duo, and still takes it. |
| 2026-11-14 | The bottom fade is fixed to the bottom row (review finding) | Figma fades from y 640 to 720 with the row at 760, the same with a status strip on the row (Vale Mobile / 01, Lockdown Mobile / 01). The build tied it to the top of the chrome | **Knob**: `--c-app-frame-scroll-edge-solid` (40): solid from 40 above the row, fading over the 80 above that. |
| 2026-11-14 | Counts in the demos read as decisions section 13 writes them (review finding; **for Sean**) | Figma writes three digits on every sidebar (`012`, `003`, `061`); decisions section 13 says two (`07`), three from 100. The demos mixed both on one screen | **Demos**: the hand-written lines follow section 13 (`Inbox // 12 unread`, `Health // 92`). Which form Sean wants is still his to say. |
| 2026-11-14 | A lean stylesheet entry (review finding) | `@unicron/ui/styles` scans every component: 38.3 kB gzip for any app, where 0.24 was 25.5 | **Entry**: `styles/lean.css` and `unicron-sources` ([consuming](05-consuming.md#a-smaller-stylesheet)). A whole app lands near 33 kB; Warpcore's 25 kB budget has to be set again on purpose. |
