// Shared parts for the primitives area's views (a file starting with "_" is not a view).
//
// The components new in round 2 (TextField, SearchField, ChipField, InitialTile, EmptyState,
// RadioGroup, RadioRow, Toolbar, SplitButton) are not in @unicron/ui's index yet: the integrator
// adds their export lines. Until then the views take them from the package's source, here, in one
// place. Once index.ts exports them, this block becomes `export { … } from "@unicron/ui"` and no
// view changes.
import type { ReactNode } from "react"

export { TextField, SearchField } from "../../../../packages/ui/src/components/ui/text-field"
export { ChipField } from "../../../../packages/ui/src/components/ui/chip-field"
export { InitialTile } from "../../../../packages/ui/src/components/ui/initial-tile"
export { EmptyState, EmptyOverline } from "../../../../packages/ui/src/components/ui/empty"
export { RadioGroup, RadioGroupItem, RadioRow } from "../../../../packages/ui/src/components/ui/radio-group"
export { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from "../../../../packages/ui/src/components/ui/toolbar"
export { SplitButton } from "../../../../packages/ui/src/components/ui/split-button"

/** A labelled block of specimens: the overline names what it shows, as the other views do. */
export function Specimen({ label, children, column = false }: { label: string; children: ReactNode; column?: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={column ? "flex flex-col gap-4" : "flex flex-wrap items-start gap-6"}>{children}</div>
    </section>
  )
}

/**
 * The page every view in this area sits on: 24px in, 32 between blocks.
 *
 * `dark:antialiased` changes nothing you can see (the body is already antialiased). It is here
 * because tests/foundations.spec.ts ("a box takes its nearest ground") needs one plain `dark:`
 * rule in the compiled CSS to probe the variant, and the round-2 restyle removed the last one from
 * the primitives (InputGroupInput's `dark:bg-transparent`). Drop it once that check carries its
 * own probe (hand-off request to the styles owner).
 */
export function Page({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-8 p-6 max-sm:p-4 dark:antialiased">{children}</div>
}

/** A column as wide as Figma draws a field or a phone row (358 / 390). */
export function Column({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "flex w-full max-w-[--spacing(160)] flex-col gap-6" : "flex w-full max-w-[--spacing(90)] flex-col gap-6"}>{children}</div>
}
