// Owned component (not generated): a data table: a header row of overlines, rows on hairlines, numbers in mono.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #31; no Figma frame, no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

export type TableProps = React.ComponentProps<"table"> & {
  /**
   * The header row stays in view while the table's own box scrolls (contract 5.1c C16). Give the
   * table a height to scroll in with `containerClassName` or a parent that bounds it.
   */
  stickyHeader?: boolean
  /** Classes for the box around the table, which scrolls sideways (and down, with a height). */
  containerClassName?: string
  /** The box's name, read when the box scrolls and takes focus; the table's own caption is better when there is one. */
  label?: string
}

/**
 * Table (contract 5.1b #31): Synapse's graph list, checks and scorecard; Warpcore's tables in
 * replies. Header cells are overlines in label ink; each body row sits under a hairline (an inset
 * shadow, so it adds no height); text cells are the body role; a `numeric` cell is mono with
 * tabular figures, aligned right. The table sits in a box that scrolls sideways and can be reached
 * with the keyboard to do so.
 */
/** True while the box is narrower (or shorter) than what it holds, so it scrolls. */
function useScrolls(ref: React.RefObject<HTMLElement | null>) {
  const [scrolls, setScrolls] = React.useState(false)
  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
    check()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [ref])
  return scrolls
}

function Table({ className, containerClassName, stickyHeader = false, label, ...props }: TableProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const scrolls = useScrolls(boxRef)
  return (
    <div
      ref={boxRef}
      data-slot="table-container"
      data-sticky-header={stickyHeader || undefined}
      data-scrolls={scrolls || undefined}
      // While the table is wider than its column, the box takes focus so a keyboard can scroll it.
      tabIndex={scrolls ? 0 : undefined}
      role={label ? "region" : undefined}
      aria-label={label}
      className={cn("group/table relative w-full overflow-x-auto overscroll-x-contain", stickyHeader && "overflow-y-auto", containerClassName)}
    >
      <table data-slot="table" className={cn("w-full caption-bottom border-collapse text-left", className)} {...props} />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn(className)} {...props} />
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return <tfoot data-slot="table-footer" className={cn("[&_td]:rule-t", className)} {...props} />
}

export type TableRowProps = React.ComponentProps<"tr"> & {
  /**
   * The row is the chosen one (contract 5.1c C16): primary-soft with the 2px primary edge on its
   * first cell, default text colours, and `aria-selected`.
   */
  selected?: boolean
}

function TableRow({ className, selected, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      data-selected={selected ? "true" : undefined}
      aria-selected={selected === undefined ? undefined : selected}
      className={cn(
        // A row's hairline is on top of each cell (a tr cannot carry an inset shadow in every
        // engine). A selected row: soft fill, and the edge on its first cell.
        "group/table-row [&>td]:rule-t data-selected:bg-primary-soft data-selected:[&>*:first-child]:edge-l",
        className
      )}
      {...props}
    />
  )
}

export type TableHeadProps = React.ComponentProps<"th"> & {
  /** A column of numbers: aligned right, like its cells. */
  numeric?: boolean
}

function TableHead({ className, numeric = false, scope = "col", ...props }: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      data-numeric={numeric || undefined}
      scope={scope}
      className={cn(
        // 8 + 16 + 8 = 32. On the ground, so a sticky header covers the rows under it.
        "h-8 px-3 py-2 align-bottom type-overline whitespace-nowrap text-muted-foreground group-data-sticky-header/table:sticky group-data-sticky-header/table:top-0 group-data-sticky-header/table:z-10 group-data-sticky-header/table:bg-background group-data-sticky-header/table:rule-b",
        numeric && "text-right",
        className
      )}
      {...props}
    />
  )
}

export type TableCellProps = React.ComponentProps<"td"> & {
  /** A number: mono with tabular figures, aligned right. */
  numeric?: boolean
}

function TableCell({ className, numeric = false, ...props }: TableCellProps) {
  return (
    <td
      data-slot="table-cell"
      data-numeric={numeric || undefined}
      className={cn(
        // 8 + 24 + 8 = 40 for a line of body text.
        "px-3 py-2 align-baseline",
        numeric ? "text-right type-code-inline whitespace-nowrap" : "type-body text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return <caption data-slot="table-caption" className={cn("mt-3 text-left type-caption text-support-foreground", className)} {...props} />
}

export { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption }
