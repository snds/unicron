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
  /**
   * Rows can be chosen, one at a time (contract 5.1c C16, Synapse SNA2): the table is a `grid`,
   * each body row says `aria-selected`, and the keyboard reaches the rows with one Tab stop (the
   * chosen row, else the last one focused, else the first). ↑ ↓ move between rows, Home and End go
   * to the first and the last, Enter or Space choose the focused row: they press it, so the row's
   * own `onClick` is where the host chooses. Moving never chooses by itself, so a row that opens a
   * detail only opens one on purpose.
   */
  selectable?: boolean
}

type TableSection = "head" | "body" | "foot"
/** Which part of the table a row sits in: only body rows can be chosen. */
const TableSectionContext = React.createContext<TableSection>("body")

interface RowEntry {
  id: string
  element: HTMLTableRowElement | null
  selected: boolean
}

interface TableSelection {
  /** The row that takes the Tab stop. */
  tabStop: string | null
  register: (entry: RowEntry) => () => void
  setActive: (id: string) => void
}
const TableSelectionContext = React.createContext<TableSelection | null>(null)

/** The rows, in the page's order, so the Tab stop and the arrow keys follow what the person sees. */
function byPosition(a: RowEntry, b: RowEntry) {
  return a.element && b.element && a.element.compareDocumentPosition(b.element) & Node.DOCUMENT_POSITION_PRECEDING ? 1 : -1
}

function useTableSelection(on: boolean): TableSelection | null {
  const [rows, setRows] = React.useState<RowEntry[]>([])
  const [active, setActive] = React.useState<string | null>(null)
  const register = React.useCallback((entry: RowEntry) => {
    setRows((list) => [...list.filter((r) => r.id !== entry.id), entry].sort(byPosition))
    return () => setRows((list) => list.filter((r) => r.id !== entry.id))
  }, [])
  const chosen = rows.find((r) => r.selected)?.id
  const tabStop = (active !== null && rows.some((r) => r.id === active) ? active : null) ?? chosen ?? rows[0]?.id ?? null
  return React.useMemo(() => (on ? { tabStop, register, setActive } : null), [on, tabStop, register])
}

const ROW_KEYS = ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " "]

/** Arrow keys between a selectable table's body rows; Enter and Space press the focused one. */
function onRowKeys(event: React.KeyboardEvent<HTMLTableElement>) {
  const row = (event.target as HTMLElement).closest?.<HTMLTableRowElement>('tr[data-selectable]')
  // Only a row itself: a control inside a cell keeps its own keys.
  if (!row || row !== event.target || !ROW_KEYS.includes(event.key)) return
  event.preventDefault()
  if (event.key === "Enter" || event.key === " ") {
    row.click()
    return
  }
  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLTableRowElement>("tr[data-selectable]"))
  const at = rows.indexOf(row)
  const to = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? Math.min(at + 1, rows.length - 1) : Math.max(at - 1, 0)
  rows[to]?.focus()
  rows[to]?.scrollIntoView?.({ block: "nearest" })
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

function Table({ className, containerClassName, stickyHeader = false, label, selectable = false, onKeyDown, ...props }: TableProps) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const scrolls = useScrolls(boxRef)
  const selection = useTableSelection(selectable)
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
      <TableSelectionContext.Provider value={selection}>
        <table
          data-slot="table"
          data-selectable={selectable || undefined}
          // A table whose rows can be chosen is a grid: that is where `aria-selected` on a row means something.
          role={selectable ? "grid" : undefined}
          className={cn("w-full caption-bottom border-collapse text-left", className)}
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (selectable && !event.defaultPrevented) onRowKeys(event)
          }}
          {...props}
        />
      </TableSelectionContext.Provider>
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <TableSectionContext.Provider value="head">
      <thead data-slot="table-header" className={cn(className)} {...props} />
    </TableSectionContext.Provider>
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <TableSectionContext.Provider value="foot">
      <tfoot data-slot="table-footer" className={cn("[&_td]:rule-t", className)} {...props} />
    </TableSectionContext.Provider>
  )
}

export type TableRowProps = React.ComponentProps<"tr"> & {
  /**
   * The row is the chosen one (contract 5.1c C16): primary-soft with the 2px primary edge on its
   * first cell, default text colours, and `aria-selected`.
   */
  selected?: boolean
}

function TableRow({ className, selected, onFocus, ref, ...props }: TableRowProps) {
  const section = React.useContext(TableSectionContext)
  const selection = React.useContext(TableSelectionContext)
  // In a selectable table, a body row is one of the choices.
  const choice = selection !== null && section === "body"
  const id = React.useId()
  const own = React.useRef<HTMLTableRowElement | null>(null)
  const register = choice ? selection.register : undefined
  React.useLayoutEffect(
    () => (register ? register({ id, element: own.current, selected: Boolean(selected) }) : undefined),
    [register, id, selected]
  )
  const setRef = React.useCallback(
    (node: HTMLTableRowElement | null) => {
      own.current = node
      if (typeof ref === "function") ref(node)
      else if (ref) ref.current = node
    },
    [ref]
  )
  return (
    <tr
      ref={setRef}
      data-slot="table-row"
      data-selected={selected ? "true" : undefined}
      data-selectable={choice || undefined}
      aria-selected={choice ? Boolean(selected) : selected === undefined ? undefined : selected}
      tabIndex={choice ? (selection.tabStop === id ? 0 : -1) : undefined}
      onFocus={(event) => {
        onFocus?.(event)
        if (choice && event.target === event.currentTarget) selection.setActive(id)
      }}
      className={cn(
        // A row's hairline is on top of each cell (a tr cannot carry an inset shadow in every
        // engine). A selected row: soft fill, and the edge on its first cell.
        "group/table-row [&>td]:rule-t data-selected:bg-primary-soft data-selected:[&>*:first-child]:edge-l",
        // A row that can be chosen: the whole row is the target, with the contract's washes; the
        // keyboard ring sits inside the row, so the box's edge never clips it.
        choice &&
          "cursor-pointer hover:bg-[image:linear-gradient(var(--state-hover),var(--state-hover))] active:bg-[image:linear-gradient(var(--state-pressed),var(--state-pressed))] focus-visible:outline-offset-[calc(var(--stroke-emphasis)*-1)]",
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
