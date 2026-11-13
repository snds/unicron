import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
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

  it("checkable multiple: a menu of menu item checkboxes, one tab stop, the arrow keys move along it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <NavSection title="Calendars" count={3} checkable="multiple">
        <NavItem label="Personal" swatch={1} checked onCheckedChange={onChange} />
        <NavItem label="Work" swatch={2} checked={false} />
        <NavItem label="US holidays" swatch={3} checked={false} />
      </NavSection>
    )
    const menu = screen.getByRole("menu", { name: "Calendars, 3" })
    const items = within(menu).getAllByRole("menuitemcheckbox")
    expect(items.map((el) => el.getAttribute("aria-checked"))).toEqual(["true", "false", "false"])
    await user.tab()
    expect(items[0]).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(items[1]).toHaveFocus()
    await user.keyboard("{End}")
    expect(items[2]).toHaveFocus()
    await user.keyboard("{ArrowDown}")
    expect(items[0]).toHaveFocus()
    await user.keyboard(" ")
    expect(onChange).toHaveBeenCalledWith(false)
  })

  it("checkable single: menu item radios, and picking one asks for it", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <NavSection title="Accounts" checkable="single">
        <NavItem label="Personal" checked />
        <NavItem label="Work" checked={false} onCheckedChange={onChange} />
      </NavSection>
    )
    const radios = screen.getAllByRole("menuitemradio")
    expect(radios).toHaveLength(2)
    await user.click(radios[1])
    expect(onChange).toHaveBeenCalledWith(true)
  })
})
