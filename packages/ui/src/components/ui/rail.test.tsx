import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { NavMark, Rail, RailItem, formatNavCount, markKeyShortcuts, nameWithMark, railItemVariants, resolveNavMark, rovingTarget } from "./rail"

describe("the nav mark (contract 5.1b #7)", () => {
  it("writes counts as cross-app decisions §13 does: 07, 12, 248, 1,204; 99+ at an icon's corner", () => {
    expect(formatNavCount(7)).toBe("07")
    expect(formatNavCount(12)).toBe("12")
    expect(formatNavCount(248)).toBe("248")
    expect(formatNavCount(1204)).toBe("1,204")
    expect(formatNavCount(1204, { cap: true })).toBe("99+")
    expect(formatNavCount(99, { cap: true })).toBe("99")
  })

  it("reads a number, a count, a square and a key, and draws nothing for 0", () => {
    expect(resolveNavMark(12)).toMatchObject({ kind: "count", tone: "neutral", count: 12, words: "12" })
    expect(resolveNavMark({ count: 3, tone: "needs-you" })).toMatchObject({ kind: "count", tone: "needs-you", words: "3 waiting on you" })
    expect(resolveNavMark({ count: 1204, label: "1,204 notes" })?.words).toBe("1,204 notes")
    expect(resolveNavMark({ square: true, label: "Update ready" })).toMatchObject({ kind: "square", tone: "neutral", words: "Update ready" })
    expect(resolveNavMark({ keys: "/" })).toMatchObject({ kind: "keys", keys: "/", words: "" })
    expect(resolveNavMark(0)).toBeNull()
    expect(resolveNavMark(undefined)).toBeNull()
  })

  it("joins its words to a name", () => {
    expect(nameWithMark("Inbox", resolveNavMark(12))).toBe("Inbox, 12")
    expect(nameWithMark("Tasks", resolveNavMark({ count: 1, tone: "needs-you" }))).toBe("Tasks, 1 waiting on you")
    expect(nameWithMark("Search", resolveNavMark({ keys: "/" }))).toBe("Search")
    expect(nameWithMark("Work", null, "error")).toBe("Work, error")
  })

  it("is hidden from assistive tech, and a needs-you count is the yellow with its own ink", () => {
    const { container } = render(<NavMark mark={resolveNavMark({ count: 2, tone: "needs-you" })} placement="inline" className="text-text-label" />)
    const mark = container.querySelector('[data-slot="nav-mark"]')!
    expect(mark).toHaveAttribute("aria-hidden", "true")
    expect(mark).toHaveTextContent("02")
    expect(mark.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-folio", "bg-needs-you-fill", "text-needs-you-on-fill"]))
    expect(mark.className).not.toContain("text-text-label")
  })

  it("a square is a square: a fixed knob size, no radius; the needs-you square keeps an ink edge for stone", () => {
    const { container } = render(<NavMark mark={resolveNavMark({ square: true, tone: "needs-you", label: "Waiting" })} placement="corner" />)
    const mark = container.querySelector('[data-slot="nav-mark"]')!
    expect(mark.className.split(/\s+/)).toEqual(expect.arrayContaining(["size-(--c-nav-mark-square)", "bg-needs-you-fill", "inset-ring-needs-you-on-fill"]))
    expect(mark.className).not.toMatch(/rounded/)
  })

  it("a corner count caps at 99+ and is one overline line high", () => {
    const { container } = render(<NavMark mark={resolveNavMark(240)} placement="corner" />)
    const mark = container.querySelector('[data-slot="nav-mark"]')!
    expect(mark).toHaveTextContent("99+")
    expect(mark.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-overline", "h-(--c-nav-mark-badge-height)", "bg-foreground", "text-background"]))
  })

  it("a key hint is a Kbd after a label; on an icon there is no room, so it draws nothing there (the host's tooltip shows it)", () => {
    const { container } = render(<NavMark mark={resolveNavMark({ keys: "/" })} placement="inline" />)
    expect(container.querySelector('kbd[data-slot="kbd"]')).toHaveTextContent("/")
    const corner = render(<NavMark mark={resolveNavMark({ keys: "/" })} placement="corner" />)
    expect(corner.container.innerHTML).toBe("")
  })

  it("a key hint is said through aria-keyshortcuts, in its ARIA form when the drawn keys are not (contract 5.1c C2)", () => {
    expect(markKeyShortcuts(resolveNavMark({ keys: "/" }))).toBe("/")
    expect(markKeyShortcuts(resolveNavMark({ keys: "⌘K", shortcut: "Meta+K" }))).toBe("Meta+K")
    expect(markKeyShortcuts(resolveNavMark({ keys: "/" }), "Shift+Enter")).toBe("/ Shift+Enter")
    expect(markKeyShortcuts(resolveNavMark(12))).toBeUndefined()
    expect(markKeyShortcuts(null, false)).toBeUndefined()
  })

  it("roving targets wrap, and Home and End jump", () => {
    const items = [1, 2, 3].map(() => document.createElement("button"))
    expect(rovingTarget(items, items[0], "ArrowRight", "horizontal")).toBe(items[1])
    expect(rovingTarget(items, items[0], "ArrowLeft", "horizontal")).toBe(items[2])
    expect(rovingTarget(items, items[2], "ArrowDown", "vertical")).toBe(items[0])
    expect(rovingTarget(items, items[1], "End", "vertical")).toBe(items[2])
    expect(rovingTarget(items, items[1], "Home", "horizontal")).toBe(items[0])
    expect(rovingTarget(items, items[1], "ArrowDown", "horizontal")).toBeUndefined()
  })
})

describe("RailItem (Figma 44:106)", () => {
  it("is a button named by its label and its count, with the icon over the count", () => {
    render(<RailItem label="Tasks" icon="task" count={3} />)
    const item = screen.getByRole("button", { name: "Tasks, 3" })
    expect(item).toHaveAttribute("data-slot", "rail-item")
    expect(item).toHaveAttribute("data-state", "default")
    expect(item.querySelector('[data-slot="icon"]')).toHaveAttribute("aria-hidden", "true")
    expect(item.querySelector('[data-slot="nav-mark"]')).toHaveTextContent("03")
  })

  it("is 48 × 56 from its knobs, icon over count 4px apart, on the 2px corner", () => {
    const classes = railItemVariants().split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["w-(--c-rail-item-width)", "h-(--c-rail-item-height)", "flex-col", "gap-1", "rounded-sm"]))
  })

  it("active is the soft primary tile with the icon in primary text, and says aria-current", () => {
    render(<RailItem label="Tasks" icon="task" count={3} state="active" />)
    const item = screen.getByRole("button", { name: "Tasks, 3" })
    expect(item).toHaveAttribute("aria-current", "true")
    expect(item.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-primary-soft", "text-primary-text"]))
    // The count stays in label ink.
    expect(item.querySelector('[data-slot="nav-mark"]')!.className).toContain("text-muted-foreground")
  })

  it("live puts the icon and the count in the live ink, and says so", () => {
    render(<RailItem label="Tasks" icon="task" count={2} state="live" />)
    const item = screen.getByRole("button", { name: "Tasks, 2, live" })
    expect(item.className).toContain("text-secondary-live")
    expect(item.querySelector('[data-slot="nav-mark"]')!.className).toContain("text-secondary-live")
  })

  it("the count is optional", () => {
    render(<RailItem label="Files" icon="document" />)
    const item = screen.getByRole("button", { name: "Files" })
    expect(item.querySelector('[data-slot="nav-mark"]')).toBeNull()
  })

  it("hover and pressed are the contract's washes; the active tile keeps its fill", () => {
    expect(railItemVariants().split(/\s+/)).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    const active = railItemVariants({ state: "active" }).split(/\s+/)
    expect(active).toEqual(expect.arrayContaining(["hover:bg-primary-soft", "active:bg-primary-soft"]))
    expect(active).not.toContain("hover:bg-state-hover")
  })

  it("shows its label as a tooltip", async () => {
    const user = userEvent.setup()
    render(<RailItem label="Environments" icon="cloud" count={3} />)
    await user.tab()
    expect(await screen.findByText("Environments")).toBeInTheDocument()
  })
})

describe("Rail", () => {
  function setup() {
    const onClick = vi.fn()
    render(
      <Rail aria-label="Context">
        <RailItem label="Tasks" icon="task" count={2} state="live" onClick={onClick} />
        <RailItem label="Artifacts" icon="code" count={4} state="active" />
        <RailItem label="Environments" icon="cloud" count={3} />
      </Rail>
    )
    return { onClick, rail: screen.getByRole("toolbar", { name: "Context" }) }
  }

  it("is a vertical toolbar, 8px between items, one stop in the tab order (the active item)", async () => {
    const user = userEvent.setup()
    const { rail } = setup()
    expect(rail).toHaveAttribute("aria-orientation", "vertical")
    expect(rail.className.split(/\s+/)).toEqual(expect.arrayContaining(["flex-col", "gap-2"]))
    await user.tab()
    expect(screen.getByRole("button", { name: "Artifacts, 4" })).toHaveFocus()
    await user.tab()
    expect(rail).not.toContainElement(document.activeElement as HTMLElement)
  })

  it("the arrow keys move along it, wrapping, and Home and End jump", async () => {
    const user = userEvent.setup()
    setup()
    await user.tab()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("button", { name: "Environments, 3" })).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("button", { name: "Tasks, 2, live" })).toHaveFocus()
    await user.keyboard("{End}")
    expect(screen.getByRole("button", { name: "Environments, 3" })).toHaveFocus()
    await user.keyboard("{Home}{ArrowUp}")
    expect(screen.getByRole("button", { name: "Environments, 3" })).toHaveFocus()
  })

  it("an item still presses from the keyboard", async () => {
    const user = userEvent.setup()
    const { onClick } = setup()
    await user.tab()
    await user.keyboard("{ArrowUp}{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
