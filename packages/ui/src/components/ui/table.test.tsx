import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table"

function Areas({ selected, sticky }: { selected?: string; sticky?: boolean }) {
  return (
    <Table stickyHeader={sticky} label={sticky ? "Areas" : undefined}>
      <TableCaption>Workspace // Personal</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Area</TableHead>
          <TableHead numeric>Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {[
          ["Skills", "145"],
          ["Knowledge", "1,204"],
        ].map(([area, count]) => (
          <TableRow key={area} selected={selected === undefined ? undefined : selected === area}>
            <TableCell>{area}</TableCell>
            <TableCell numeric>{count}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

describe("Table (contract 5.1b #31)", () => {
  it("a real table: column headers in overline label ink, 32 tall", () => {
    render(<Areas />)
    const table = screen.getByRole("table", { name: "Workspace // Personal" })
    const head = within(table).getByRole("columnheader", { name: "Area" })
    expect(head).toHaveAttribute("scope", "col")
    expect(head.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground", "h-8"]))
  })

  it("each body row sits under a hairline (an inset shadow on its cells); text in the body role", () => {
    render(<Areas />)
    const row = screen.getByRole("row", { name: /Skills/ })
    expect(row.className).toContain("[&>td]:rule-t")
    const cell = within(row).getByRole("cell", { name: "Skills" })
    expect(cell.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-body", "px-3", "py-2"]))
  })

  it("numbers: mono with tabular figures (code-inline), right aligned, head and cell alike", () => {
    render(<Areas />)
    const cell = screen.getByRole("cell", { name: "1,204" })
    expect(cell.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-code-inline", "text-right"]))
    expect(screen.getByRole("columnheader", { name: "Count" }).className).toContain("text-right")
  })

  it("a selected row: primary-soft, the 2px edge on its first cell, aria-selected", () => {
    render(<Areas selected="Knowledge" />)
    const row = screen.getByRole("row", { name: /Knowledge/ })
    expect(row).toHaveAttribute("aria-selected", "true")
    expect(row).toHaveAttribute("data-selected", "true")
    expect(row.className).toContain("data-selected:bg-primary-soft")
    expect(row.className).toContain("data-selected:[&>*:first-child]:edge-l")
    expect(screen.getByRole("row", { name: /Skills/ })).toHaveAttribute("aria-selected", "false")
  })

  it("the box scrolls sideways; with a sticky header it is a named region and its head stays in view", () => {
    const { container } = render(<Areas sticky />)
    const box = container.querySelector('[data-slot="table-container"]') as HTMLElement
    expect(box.className).toContain("overflow-x-auto")
    expect(screen.getByRole("region", { name: "Areas" })).toBe(box)
    expect(box).toHaveAttribute("data-sticky-header")
    expect(screen.getByRole("columnheader", { name: "Area" }).className).toContain("group-data-sticky-header/table:sticky")
  })

  it("the box takes focus only while it scrolls", () => {
    const { container } = render(<Areas />)
    const box = container.querySelector('[data-slot="table-container"]') as HTMLElement
    // jsdom lays nothing out, so nothing overflows.
    expect(box).not.toHaveAttribute("tabindex")
  })
})
