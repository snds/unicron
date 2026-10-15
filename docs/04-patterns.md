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
| **Filtering** | Narrow a large set | `Command` / search `InputGroup` → removable `Badge` chips (active filters) → `ButtonGroup` toolbar → results |

Escalation ladders: NativeSelect → Combobox (list grows past ~15); Tooltip → Popover (content
becomes interactive); toast → alert → banner → alert dialog (urgency rises).

## Promoting a candidate

1. Read the suggestion record. Check `nearestExisting`; if it scores high, it is a variant.
2. Write the pattern here: job, composition, the shape props that matter, and a do/don't line.
3. Add a playground section that renders it in light and dark.
4. If it earns a component (repeats in three products or needs its own behaviour), generate or
   write it in `packages/ui`, add it to [03-components.md](03-components.md), and let the next
   `ds:scan` count it as system usage.
