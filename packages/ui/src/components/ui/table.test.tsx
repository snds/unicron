import * as React from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

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

const FILES = [
  ["knowledge/decisions/memory-tiers.md", "decision", "06"],
  ["skills/close-out/SKILL.md", "skill", "14"],
  ["frameworks/13-domain-rigor-stack.md", "framework", "31"],
] as const

/** Synapse's graph list: a selectable table; a row selects its node (Y-15). */
function GraphList({ onPick, initial }: { onPick?: (file: string) => void; initial?: string }) {
  const [selected, setSelected] = React.useState<string | undefined>(initial)
  return (
    <Table selectable stickyHeader label="Files">
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Type</TableHead>
          <TableHead numeric>Links in</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {FILES.map(([file, type, links]) => (
          <TableRow
            key={file}
            selected={selected === file}
            onClick={() => {
              setSelected(file)
              onPick?.(file)
            }}
          >
            <TableCell>{file}</TableCell>
            <TableCell>{type}</TableCell>
            <TableCell numeric>{links}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

describe("Table selection and the header in view (contract 5.1c C16, Synapse SNA2)", () => {
  const rows = () => within(screen.getAllByRole("rowgroup")[1]).getAllByRole("row")

  it("a selectable table is a grid; every body row says whether it is chosen, the header row says nothing", () => {
    render(<GraphList initial="skills/close-out/SKILL.md" />)
    expect(screen.getByRole("grid")).toHaveAttribute("data-selectable")
    const [first, second, third] = rows()
    expect(first).toHaveAttribute("aria-selected", "false")
    expect(second).toHaveAttribute("aria-selected", "true")
    expect(third).toHaveAttribute("aria-selected", "false")
    const head = within(screen.getAllByRole("rowgroup")[0]).getByRole("row")
    expect(head).not.toHaveAttribute("aria-selected")
    expect(head).not.toHaveAttribute("tabindex")
    // The chosen row: primary-soft and the 2px edge on its first cell.
    expect(second).toHaveAttribute("data-selected", "true")
    expect(second.className).toContain("data-selected:bg-primary-soft")
    expect(second.className).toContain("data-selected:[&>*:first-child]:edge-l")
  })

  it("one Tab stop: the chosen row, else the first", () => {
    const { unmount } = render(<GraphList initial="frameworks/13-domain-rigor-stack.md" />)
    expect(rows().map((r) => r.getAttribute("tabindex"))).toEqual(["-1", "-1", "0"])
    unmount()
    render(<GraphList />)
    expect(rows().map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"])
  })

  it("a press on a row chooses it", async () => {
    const onPick = vi.fn()
    render(<GraphList onPick={onPick} />)
    await userEvent.click(within(rows()[2]).getByText("frameworks/13-domain-rigor-stack.md"))
    expect(onPick).toHaveBeenCalledWith("frameworks/13-domain-rigor-stack.md")
    expect(rows()[2]).toHaveAttribute("aria-selected", "true")
  })

  it("by keyboard alone: ↓ ↑ Home End move between rows without choosing; Enter or Space chooses", async () => {
    const onPick = vi.fn()
    render(<GraphList onPick={onPick} />)
    await userEvent.tab()
    expect(rows()[0]).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(rows()[1]).toHaveFocus()
    expect(onPick).not.toHaveBeenCalled()
    // The Tab stop follows focus.
    expect(rows()[1]).toHaveAttribute("tabindex", "0")
    expect(rows()[0]).toHaveAttribute("tabindex", "-1")
    await userEvent.keyboard("{End}")
    expect(rows()[2]).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(rows()[2]).toHaveFocus()
    await userEvent.keyboard("{Home}")
    expect(rows()[0]).toHaveFocus()
    await userEvent.keyboard("{ArrowUp}")
    expect(rows()[0]).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(onPick).toHaveBeenLastCalledWith("knowledge/decisions/memory-tiers.md")
    await userEvent.keyboard("{ArrowDown}")
    await userEvent.keyboard(" ")
    expect(onPick).toHaveBeenLastCalledWith("skills/close-out/SKILL.md")
    expect(rows()[1]).toHaveAttribute("aria-selected", "true")
  })

  it("a control inside a cell keeps its own keys", () => {
    const onPick = vi.fn()
    render(
      <Table selectable>
        <TableBody>
          <TableRow onClick={onPick}>
            <TableCell>
              <input aria-label="Rename" />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    const input = screen.getByRole("textbox", { name: "Rename" })
    fireEvent.keyDown(input, { key: " " })
    fireEvent.keyDown(input, { key: "Enter" })
    expect(onPick).not.toHaveBeenCalled()
  })

  it("a chosen row takes the washes and an inset focus ring", () => {
    render(<GraphList />)
    const cls = rows()[0].className
    expect(cls).toContain("cursor-pointer")
    expect(cls).toContain("hover:bg-[image:linear-gradient(var(--state-hover),var(--state-hover))]")
    expect(cls).toContain("focus-visible:outline-offset-[calc(var(--stroke-emphasis)*-1)]")
  })

  it("the header row stays in view inside the table's own scroll: sticky heads on the ground, over the rows", () => {
    const { container } = render(<GraphList />)
    const box = container.querySelector('[data-slot="table-container"]') as HTMLElement
    expect(box.className).toContain("overflow-y-auto")
    expect(box).toHaveAttribute("data-sticky-header")
    for (const head of screen.getAllByRole("columnheader")) {
      expect(head.className.split(/\s+/)).toEqual(
        expect.arrayContaining([
          "group-data-sticky-header/table:sticky",
          "group-data-sticky-header/table:top-0",
          "group-data-sticky-header/table:z-10",
          "group-data-sticky-header/table:bg-background",
        ])
      )
    }
  })

  it("a table that is not selectable stays a table: no grid, no Tab stops on rows", () => {
    render(<Areas selected="Skills" />)
    expect(screen.queryByRole("grid")).toBeNull()
    expect(screen.getByRole("table")).toBeInTheDocument()
    for (const row of screen.getAllByRole("row")) expect(row).not.toHaveAttribute("tabindex")
  })
})

