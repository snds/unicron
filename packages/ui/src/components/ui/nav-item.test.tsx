import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState, type ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { NavItem, NavSection } from "./nav-item"

const classesOf = (el: Element) => el.className.split(/\s+/)
const rowOf = (el: Element) => el.closest('[data-slot="nav-item"]')!

describe("NavItem (Figma 15:487)", () => {
  it("is a link to its place, named by its label and its count; the index is not read out", () => {
    render(<NavItem href="/mail" label="Mail" index="01" icon="email" count={12} />)
    const link = screen.getByRole("link", { name: "Mail, 12" })
    expect(link).toHaveAttribute("href", "/mail")
    expect(link).toHaveAttribute("data-slot", "nav-item-main")
    expect(within(link).getByText("01")).toHaveAttribute("aria-hidden", "true")
    expect(within(link).getByText("12")).toHaveAttribute("aria-hidden", "true")
  })

  it("draws the drawn anatomy: 8 / 10 padding, 10 apart, label in the label role, folio index and count, 20px icon", () => {
    render(<NavItem href="/mail" label="Mail" index="01" icon="email" count={12} />)
    const link = screen.getByRole("link")
    expect(classesOf(link)).toEqual(expect.arrayContaining(["gap-2.5", "py-2", "pe-2.5", "rounded-sm"]))
    expect(link.className).toContain("ps-[calc(--spacing(2.5)")
    expect(classesOf(link.querySelector('[data-slot="nav-item-label"]')!)).toEqual(expect.arrayContaining(["type-label", "text-text-secondary", "truncate"]))
    expect(classesOf(link.querySelector('[data-slot="nav-item-index"]')!)).toEqual(expect.arrayContaining(["type-folio", "text-text-faint"]))
    expect(classesOf(link.querySelector('[data-slot="nav-mark"]')!)).toEqual(expect.arrayContaining(["type-folio", "text-text-label"]))
    expect(link.querySelector('[data-slot="icon"]')).toHaveAttribute("width", "20")
    // The icon takes the row's secondary ink.
    expect(classesOf(link)).toContain("text-text-secondary")
  })

  it("current is the soft primary tile with every part in body ink, and aria-current=page", () => {
    render(<NavItem href="/inbox" label="Inbox" icon="email" count={12} current />)
    const link = screen.getByRole("link", { name: "Inbox, 12" })
    expect(link).toHaveAttribute("aria-current", "page")
    const row = rowOf(link)
    expect(row).toHaveAttribute("data-current")
    expect(classesOf(row)).toEqual(expect.arrayContaining(["data-current:bg-primary-soft", "hover:bg-state-hover"]))
    expect(link.querySelector('[data-slot="nav-item-label"]')!.className).toContain("text-text-body")
    expect(link.querySelector('[data-slot="nav-mark"]')!.className).toContain("text-text-body")
    expect(classesOf(link)).toContain("text-text-body")
  })

  it("is a button when it has no address, and runs onClick", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<NavItem label="Settings" icon="settings" onClick={onClick} />)
    const button = screen.getByRole("button", { name: "Settings" })
    expect(button).toHaveAttribute("type", "button")
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("takes a router link as render", () => {
    render(<NavItem render={<a href="/notes" data-router="" />} label="Notes" icon="notebook" />)
    expect(screen.getByRole("link", { name: "Notes" })).toHaveAttribute("data-router")
  })

  it("a needs-you count is the yellow, and says it waits", () => {
    render(<NavItem href="/sharing" label="Sharing" icon="user--multiple" mark={{ count: 2, tone: "needs-you" }} />)
    const link = screen.getByRole("link", { name: "Sharing, 2 waiting on you" })
    expect(classesOf(link.querySelector('[data-slot="nav-mark"]')!)).toEqual(expect.arrayContaining(["bg-needs-you-fill", "text-needs-you-on-fill"]))
  })

  it("a square mark says what it means; a key hint is a Kbd and aria-keyshortcuts", () => {
    render(
      <>
        <NavItem href="/settings" label="Settings" icon="settings" mark={{ square: true, label: "Update ready" }} />
        <NavItem href="/search" label="Search" icon="search" mark={{ keys: "/" }} />
      </>
    )
    expect(screen.getByRole("link", { name: "Settings, Update ready" })).toBeInTheDocument()
    const search = screen.getByRole("link", { name: "Search" })
    expect(search).toHaveAttribute("aria-keyshortcuts", "/")
    expect(search.querySelector('[data-slot="kbd"]')).toHaveTextContent("/")
  })

  it("tone critical draws critical ink and a glyph, and says so in the name", () => {
    render(<NavItem href="/work" label="Work" icon="document" tone="critical" />)
    const link = screen.getByRole("link", { name: "Work, error" })
    expect(classesOf(link)).toContain("text-critical-text")
    expect(link.querySelector('[data-icon-name="warning--alt"]')).not.toBeNull()
    expect(link.querySelector('[data-slot="nav-item-label"]')!.className).toContain("text-critical-text")
  })

  it("a description is a second line, read as the item's description", () => {
    render(<NavItem href="/family" label="Family" icon="user--multiple" description="Shared by Mira Chen" />)
    const link = screen.getByRole("link", { name: "Family" })
    expect(link).toHaveAccessibleDescription("Shared by Mira Chen")
    expect(classesOf(screen.getByText("Shared by Mira Chen"))).toEqual(expect.arrayContaining(["type-caption", "text-text-label"]))
  })

  it("disabled stays in the tab order with its reason, and does nothing", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<NavItem label="Sharing" icon="user--multiple" disabled description="Sharing needs a connection." onClick={onClick} />)
    const button = screen.getByRole("button", { name: "Sharing" })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).toHaveAccessibleDescription("Sharing needs a connection.")
    await user.tab()
    expect(button).toHaveFocus()
    await user.keyboard("{Enter}")
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(classesOf(rowOf(button))).toContain("opacity-50")
  })

  it("level steps in by the indent knob", () => {
    render(<NavItem href="/receipts" label="Receipts" icon="folder" level={2} />)
    const link = screen.getByRole("link", { name: "Receipts" })
    expect(link.style.getPropertyValue("--nav-item-level")).toBe("2")
    expect(link.className).toContain("var(--c-nav-item-indent)")
  })

  it("expanded with a place to go: the item goes there, and a chevron button opens and closes", async () => {
    const user = userEvent.setup()
    function Tree() {
      const [open, setOpen] = useState(false)
      return <NavItem href="/folders" label="Folders" icon="folder" expanded={open} onExpandedChange={setOpen} />
    }
    render(<Tree />)
    expect(screen.getByRole("link", { name: "Folders" })).not.toHaveAttribute("aria-expanded")
    const toggle = screen.getByRole("button", { name: "Expand Folders" })
    expect(toggle).toHaveAttribute("aria-expanded", "false")
    await user.click(toggle)
    expect(screen.getByRole("button", { name: "Collapse Folders" })).toHaveAttribute("aria-expanded", "true")
  })

  it("expanded with nowhere to go: the whole item is the disclosure", async () => {
    const user = userEvent.setup()
    function More() {
      const [open, setOpen] = useState(false)
      return <NavItem label="More" icon="overflow-menu--horizontal" expanded={open} onExpandedChange={setOpen} />
    }
    render(<More />)
    const button = screen.getByRole("button", { name: "More" })
    expect(button).toHaveAttribute("aria-expanded", "false")
    await user.click(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(screen.queryByRole("button", { name: /Expand|Collapse/ })).toBeNull()
    // A chevron shows which way it opens.
    const chevron = button.querySelector('[data-slot="nav-item-chevron"]')!
    expect(chevron).toHaveAttribute("aria-hidden", "true")
    expect(chevron.className).not.toContain("-rotate-90")
  })

  it("a trailing action is its own button beside the item; with a mouse it shows over the count", () => {
    render(
      <NavItem
        href="/work"
        label="Work"
        icon="folder"
        count={31}
        action={
          <Button variant="ghost" size="icon-sm" aria-label="Edit Work">
            E
          </Button>
        }
      />
    )
    const action = screen.getByRole("button", { name: "Edit Work" })
    const link = screen.getByRole("link", { name: "Work, 31" })
    expect(link).not.toContainElement(action)
    const slot = action.closest('[data-slot="nav-item-action"]')!
    expect(classesOf(slot)).toEqual(expect.arrayContaining(["pointer-fine:opacity-0", "pointer-fine:group-hover/nav-item:opacity-100", "pointer-fine:group-focus-within/nav-item:opacity-100"]))
    expect(classesOf(link.querySelector('[data-slot="nav-item-count"]')!)).toContain("pointer-fine:group-hover/nav-item:invisible")
  })

  it("a swatch is an 8px square of the swatch role in the icon's place", () => {
    render(<NavItem label="Personal" swatch={3} onClick={() => {}} />)
    const swatch = screen.getByRole("button", { name: "Personal" }).querySelector('[data-slot="nav-item-swatch"] > span')!
    expect(classesOf(swatch)).toEqual(expect.arrayContaining(["size-2", "bg-(--swatch-03)"]))
  })

  it("checked outside a checkable section is a checkbox", async () => {
    const user = userEvent.setup()
    function Calendar() {
      const [shown, setShown] = useState(true)
      return <NavItem label="US holidays" icon="flag" checked={shown} onCheckedChange={setShown} />
    }
    render(<Calendar />)
    const box = screen.getByRole("checkbox", { name: "US holidays" })
    expect(box).toHaveAttribute("aria-checked", "true")
    await user.click(box)
    expect(box).toHaveAttribute("aria-checked", "false")
    // Space toggles it from the keyboard, as a checkbox does.
    await user.keyboard(" ")
    expect(box).toHaveAttribute("aria-checked", "true")
    expect(box.querySelector('[data-slot="nav-item-check"]')).toHaveAttribute("data-checked")
  })
})

describe("NavSection", () => {
  it("names its group with an overline heading and its count, and lists its items", () => {
    render(
      <NavSection title="Apps" count={4}>
        <NavItem href="/mail" label="Mail" icon="email" count={12} current />
        <NavItem href="/calendar" label="Calendar" icon="calendar" count={3} />
      </NavSection>
    )
    const group = screen.getByRole("group", { name: "Apps, 4" })
    const heading = within(group).getByText("Apps")
    expect(classesOf(heading)).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
    expect(heading).toHaveTextContent("Apps // 04")
    const list = within(group).getByRole("list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(2)
    expect(classesOf(list)).toEqual(expect.arrayContaining(["flex-col", "gap-1"]))
  })

  it("takes a trailing action beside the heading", () => {
    render(
      <NavSection
        title="Vaults"
        count={2}
        action={
          <Button variant="ghost" size="icon-sm" aria-label="New vault">
            +
          </Button>
        }
      >
        <NavItem href="/v/personal" label="Personal" icon="user--avatar" count={231} />
      </NavSection>
    )
    expect(screen.getByRole("button", { name: "New vault" }).closest('[data-slot="nav-section-action"]')).not.toBeNull()
  })

  it("collapsed: items draw as rail items (icon over count) named by label and count, the heading kept for assistive tech", () => {
    render(
      <NavSection title="Mail // folders" collapsed>
        <NavItem href="/inbox" label="Inbox" icon="email" count={12} current />
        <NavItem href="/starred" label="Starred" icon="star" count={4} />
      </NavSection>
    )
    const group = screen.getByRole("group", { name: "Mail // folders" })
    expect(group).toHaveAttribute("data-collapsed")
    expect(group.querySelector('[data-slot="nav-section-head"]')!.className).toContain("sr-only")
    const inbox = screen.getByRole("link", { name: "Inbox, 12" })
    expect(inbox).toHaveAttribute("aria-current", "page")
    expect(classesOf(inbox)).toEqual(expect.arrayContaining(["w-(--c-rail-item-width)", "h-(--c-rail-item-height)", "bg-primary-soft"]))
    expect(inbox.querySelector('[data-slot="nav-mark"]')).toHaveTextContent("12")
    expect(inbox.querySelector('[data-slot="nav-item-label"]')).toBeNull()
  })

  it("checkable multiple: real checkboxes in a named group of a list, each a stop in the tab order; Space toggles (contract 5.1c C3)", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <nav aria-label="Vale">
        <NavSection title="Calendars" count={3} checkable="multiple">
          <NavItem label="Personal" swatch={1} checked onCheckedChange={onChange} />
          <NavItem label="Work" swatch={2} checked={false} />
          <NavItem label="US holidays" swatch={3} checked={false} />
        </NavSection>
      </nav>
    )
    // No menu roles inside a nav.
    expect(screen.queryByRole("menu")).toBeNull()
    expect(screen.queryAllByRole("menuitemcheckbox")).toHaveLength(0)
    const group = screen.getByRole("group", { name: "Calendars, 3" })
    const list = within(group).getByRole("list")
    expect(within(list).getAllByRole("listitem")).toHaveLength(3)
    const boxes = within(list).getAllByRole("checkbox")
    expect(boxes.map((el) => el.getAttribute("aria-checked"))).toEqual(["true", "false", "false"])
    expect(boxes[0]).toHaveAccessibleName("Personal")
    // Each checkbox is its own stop, as checkboxes are.
    await user.tab()
    expect(boxes[0]).toHaveFocus()
    await user.tab()
    expect(boxes[1]).toHaveFocus()
    await user.tab({ shift: true })
    expect(boxes[0]).toHaveFocus()
    await user.keyboard(" ")
    expect(onChange).toHaveBeenCalledWith(false)
    // The arrow keys are not the checkboxes' (a screen reader reads on with them).
    await user.keyboard("{ArrowDown}")
    expect(boxes[0]).toHaveFocus()
  })

  it("checkable single: a radio group named by the heading; one tab stop; the arrow keys move the choice; the look is kept (contract 5.1c C3)", async () => {
    const user = userEvent.setup()
    function Accounts() {
      const [account, setAccount] = useState("all")
      return (
        <nav aria-label="Vale">
          <NavSection title="Accounts" count={2} checkable="single">
            {["all", "personal", "work"].map((id) => (
              <NavItem key={id} label={id === "all" ? "All" : id[0].toUpperCase() + id.slice(1)} checked={account === id} onCheckedChange={() => setAccount(id)} />
            ))}
          </NavSection>
        </nav>
      )
    }
    render(<Accounts />)
    expect(screen.queryAllByRole("menuitemradio")).toHaveLength(0)
    const group = screen.getByRole("radiogroup", { name: "Accounts, 2" })
    // The list items step back, so the group owns its radios.
    expect(within(group).queryAllByRole("listitem")).toHaveLength(0)
    const radios = within(group).getAllByRole("radio")
    expect(radios.map((el) => el.getAttribute("aria-checked"))).toEqual(["true", "false", "false"])
    expect(radios.map((el) => el.tabIndex)).toEqual([0, -1, -1])
    // The look: a square box before the label, a square in the square when on.
    expect(radios[0].querySelector('[data-slot="nav-item-check"] > span')).not.toBeNull()
    await user.tab()
    expect(radios[0]).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(radios[1]).toHaveFocus()
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
    expect(radios[0]).toHaveAttribute("aria-checked", "false")
    await user.keyboard("{End}")
    expect(radios[2]).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{ArrowDown}")
    expect(radios[0]).toHaveFocus()
    expect(radios[0]).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{ArrowLeft}")
    expect(radios[2]).toHaveFocus()
    // Tab leaves the group: one stop.
    expect(radios.map((el) => el.tabIndex)).toEqual([-1, -1, 0])
    // A press picks it too.
    await user.click(radios[1])
    expect(radios[1]).toHaveAttribute("aria-checked", "true")
  })
})

describe("NavSection tree (contract 5.1c C4)", () => {
  type Node = { id: string; label: string; children?: Node[] }
  const folders: Node[] = [
    { id: "agents", label: "Agents", children: [{ id: "review", label: "Review" }, { id: "release", label: "Release", children: [{ id: "notes", label: "Notes" }] }] },
    { id: "skills", label: "Skills" },
    { id: "rules", label: "Rules", children: [{ id: "style", label: "Style" }] },
  ]

  function Tree({ onOpen, places = true, initial = [] as string[] }: { onOpen?: (id: string) => void; places?: boolean; initial?: string[] }) {
    const [open, setOpen] = useState<string[]>(initial)
    const rows: ReactNode[] = []
    const walk = (nodes: Node[], level: number) => {
      for (const node of nodes) {
        const branch = Boolean(node.children)
        const expanded = branch ? open.includes(node.id) : undefined
        rows.push(
          <NavItem
            key={node.id}
            label={node.label}
            icon={branch ? "folder" : "document"}
            level={level}
            current={node.id === "skills"}
            expanded={expanded}
            onExpandedChange={(to) => setOpen((ids) => (to ? [...ids, node.id] : ids.filter((id) => id !== node.id)))}
            onClick={places ? () => onOpen?.(node.id) : undefined}
          />
        )
        if (branch && expanded) walk(node.children!, level + 1)
      }
    }
    walk(folders, 0)
    return (
      <nav aria-label="Synapse">
        <NavSection title="Workspace" tree>
          {rows}
        </NavSection>
      </nav>
    )
  }

  const item = (name: string) => screen.getByRole("treeitem", { name })

  it("is a tree named by its heading, of tree items with their level and open state; one tab stop on the current place", async () => {
    const user = userEvent.setup()
    render(<Tree initial={["agents"]} />)
    const tree = screen.getByRole("tree", { name: "Workspace" })
    expect(screen.queryByRole("group", { name: "Workspace" })).toBeNull()
    expect(within(tree).queryAllByRole("listitem")).toHaveLength(0)
    const items = within(tree).getAllByRole("treeitem")
    expect(items.map((el) => el.getAttribute("aria-level"))).toEqual(["1", "2", "2", "1", "1"])
    expect(item("Agents")).toHaveAttribute("aria-expanded", "true")
    expect(item("Release")).toHaveAttribute("aria-expanded", "false")
    expect(item("Skills")).not.toHaveAttribute("aria-expanded")
    expect(item("Skills")).toHaveAttribute("aria-current", "page")
    expect(items.filter((el) => el.tabIndex === 0)).toEqual([item("Skills")])
    // The chevron is the pointer's: no button inside a tree item's row, nothing extra in the tab order.
    expect(within(tree).queryAllByRole("button")).toHaveLength(0)
    await user.tab()
    expect(item("Skills")).toHaveFocus()
  })

  it("↑ and ↓ move without opening, and stop at the ends; Home and End jump", async () => {
    const user = userEvent.setup()
    render(<Tree initial={["agents"]} />)
    item("Agents").focus()
    await user.keyboard("{ArrowDown}")
    expect(item("Review")).toHaveFocus()
    await user.keyboard("{ArrowDown}{ArrowDown}")
    expect(item("Skills")).toHaveFocus()
    await user.keyboard("{End}")
    expect(item("Rules")).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(item("Rules")).toHaveFocus()
    await user.keyboard("{Home}")
    expect(item("Agents")).toHaveFocus()
    await user.keyboard("{ArrowUp}")
    expect(item("Agents")).toHaveFocus()
    expect(item("Agents").tabIndex).toBe(0)
  })

  it("→ opens a closed item, then goes to its first child; on a leaf it does nothing", async () => {
    const user = userEvent.setup()
    render(<Tree />)
    item("Rules").focus()
    await user.keyboard("{ArrowRight}")
    expect(item("Rules")).toHaveAttribute("aria-expanded", "true")
    expect(item("Rules")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(item("Style")).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(item("Style")).toHaveFocus()
  })

  it("← closes an open item, or goes to the parent", async () => {
    const user = userEvent.setup()
    render(<Tree initial={["agents", "release"]} />)
    item("Notes").focus()
    await user.keyboard("{ArrowLeft}")
    expect(item("Release")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(item("Release")).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByRole("treeitem", { name: "Notes" })).toBeNull()
    await user.keyboard("{ArrowLeft}")
    expect(item("Agents")).toHaveFocus()
    await user.keyboard("{ArrowLeft}")
    expect(item("Agents")).toHaveAttribute("aria-expanded", "false")
    // At the top level with nothing open, ← stays put.
    await user.keyboard("{ArrowLeft}")
    expect(item("Agents")).toHaveFocus()
  })

  it("Enter opens the item's place; an item with no place opens and closes on Enter", async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const { unmount } = render(<Tree onOpen={onOpen} />)
    item("Skills").focus()
    await user.keyboard("{Enter}")
    expect(onOpen).toHaveBeenCalledWith("skills")
    unmount()
    render(<Tree places={false} />)
    item("Agents").focus()
    await user.keyboard("{Enter}")
    expect(item("Agents")).toHaveAttribute("aria-expanded", "true")
  })

  it("the pointer still opens and closes an item with a place from its chevron", async () => {
    const user = userEvent.setup()
    render(<Tree />)
    const row = item("Agents").closest('[data-slot="nav-item"]')!
    const chevron = row.querySelector('[data-slot="nav-item-disclosure"]')!
    expect(chevron).toHaveAttribute("aria-hidden", "true")
    await user.click(chevron)
    expect(item("Agents")).toHaveAttribute("aria-expanded", "true")
  })

  it("without tree a section of nested items stays a list of links", () => {
    render(
      <NavSection title="Folders">
        <NavItem href="/receipts" label="Receipts" icon="folder" expanded onExpandedChange={() => {}} />
        <NavItem href="/receipts/2026" label="2026" icon="folder" level={1} />
      </NavSection>
    )
    expect(screen.queryByRole("tree")).toBeNull()
    expect(screen.getByRole("list")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "2026" })).not.toHaveAttribute("aria-level")
    expect(screen.getByRole("button", { name: "Collapse Receipts" })).toHaveAttribute("aria-expanded", "true")
  })
})
