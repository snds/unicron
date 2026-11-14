import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { TabBar, TabBarItem, type TabBarProps } from "./tab-bar"

const classesOf = (el: Element) => el.className.split(/\s+/)

function Vale(props: Partial<TabBarProps> & { start?: string; onChange?: (v: string) => void }) {
  const { start = "mail", onChange, ...rest } = props
  const [value, setValue] = useState(start)
  return (
    <TabBar
      label="Sections"
      value={value}
      onValueChange={(v) => {
        setValue(v)
        onChange?.(v)
      }}
      {...rest}
    >
      <TabBarItem value="mail" icon="email" label="Mail" mark={12} />
      <TabBarItem value="calendar" icon="calendar" label="Calendar" />
      <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
      <TabBarItem value="notes" icon="notebook" label="Notes" />
    </TabBar>
  )
}

/** jsdom lays nothing out: give each tab a box along the bar, 70px wide from x 72. */
function layOut() {
  const items = screen.getAllByRole("tab")
  items.forEach((el, i) => {
    el.getBoundingClientRect = () => ({ left: 72 + i * 70, right: 72 + (i + 1) * 70, top: 760, bottom: 800, width: 70, height: 40, x: 72 + i * 70, y: 760, toJSON() {} }) as DOMRect
  })
  return items
}

describe("TabBar (Figma 20:1657)", () => {
  it("is a named tablist of icon-only tabs, each named by its section and its mark", () => {
    render(<Vale />)
    const bar = screen.getByRole("tablist", { name: "Sections" })
    expect(bar).toHaveAttribute("data-slot", "tab-bar")
    expect(bar).toHaveAttribute("aria-orientation", "horizontal")
    const mail = screen.getByRole("tab", { name: "Mail, 12", selected: true })
    expect(screen.getAllByRole("tab")).toHaveLength(4)
    expect(mail.querySelector('[data-slot="icon"]')).toHaveAttribute("aria-hidden", "true")
    expect(mail.querySelector('[data-slot="nav-mark"]')).toHaveTextContent("12")
  })

  it("draws as Figma does: 48 high, raised, a 1px rule inside, 4px padding and gap, 2px corner; tabs share the width", () => {
    render(<Vale />)
    const bar = screen.getByRole("tablist")
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["h-control", "bg-surface-raised", "rule-box", "p-1", "gap-1", "rounded-sm", "grow", "basis-0"]))
    const tab = screen.getByRole("tab", { name: "Calendar" })
    expect(classesOf(tab)).toEqual(expect.arrayContaining(["grow", "basis-0", "h-full", "hit-area", "text-text-label", "hover:bg-state-hover", "active:bg-state-pressed"]))
  })

  // Figma's Dock Tab (20:1656) and the phone frames of Warpcore, Lockdown, Synapse and Vale's
  // Calendar, Contacts and Notes draw the active icon in primary/text. Body ink is one override
  // (Vale's Mail tab), which contract 9.9 had taken for the rule.
  it("the active tab is the soft primary tile with the icon in primary-text, as Figma draws it", () => {
    render(<Vale />)
    const mail = screen.getByRole("tab", { name: "Mail, 12" })
    expect(mail).toHaveAttribute("data-active")
    expect(classesOf(mail)).toEqual(expect.arrayContaining(["bg-primary-soft", "text-primary-text"]))
    expect(classesOf(mail)).not.toContain("text-text-label")
    expect(classesOf(mail)).not.toContain("text-text-body")
  })

  it("a tap picks a section; a second tap on the active one calls onReselect", async () => {
    const user = userEvent.setup()
    const onReselect = vi.fn()
    const onChange = vi.fn()
    render(<Vale onReselect={onReselect} onChange={onChange} />)
    await user.click(screen.getByRole("tab", { name: "Notes" }))
    expect(onChange).toHaveBeenLastCalledWith("notes")
    expect(screen.getByRole("tab", { name: "Notes" })).toHaveAttribute("aria-selected", "true")
    await user.click(screen.getByRole("tab", { name: "Notes" }))
    expect(onReselect).toHaveBeenCalledWith("notes")
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it("is one stop in the tab order; the arrow keys move the selection, wrapping, and Home and End jump", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Vale onChange={onChange} />)
    await user.tab()
    expect(screen.getByRole("tab", { name: "Mail, 12" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Calendar", selected: true })).toHaveFocus()
    await user.keyboard("{ArrowLeft}{ArrowLeft}")
    expect(screen.getByRole("tab", { name: "Notes", selected: true })).toHaveFocus()
    await user.keyboard("{Home}")
    expect(screen.getByRole("tab", { name: "Mail, 12", selected: true })).toHaveFocus()
    expect(onChange.mock.calls.map(([v]) => v)).toEqual(["calendar", "mail", "notes", "mail"])
    await user.tab()
    expect(screen.getByRole("tablist")).not.toContainElement(document.activeElement as HTMLElement)
  })

  it("slide to scrub: the active tab follows the finger past the slop, and is picked on lift, without a click", () => {
    const onChange = vi.fn()
    render(<Vale onChange={onChange} />)
    const bar = screen.getByRole("tablist")
    layOut()
    fireEvent.pointerDown(bar, { button: 0, pointerId: 1, clientX: 100, clientY: 780 })
    // Inside the slop: still a tap.
    fireEvent.pointerMove(bar, { pointerId: 1, clientX: 104, clientY: 780 })
    expect(bar).not.toHaveAttribute("data-scrubbing")
    fireEvent.pointerMove(bar, { pointerId: 1, clientX: 180, clientY: 782 })
    expect(bar).toHaveAttribute("data-scrubbing")
    expect(screen.getByRole("tab", { name: "Calendar" })).toHaveAttribute("data-active")
    expect(screen.getByRole("tab", { name: "Mail, 12" })).not.toHaveAttribute("data-active")
    // Not picked yet: the selection is still Mail.
    expect(screen.getByRole("tab", { name: "Mail, 12" })).toHaveAttribute("aria-selected", "true")
    fireEvent.pointerMove(bar, { pointerId: 1, clientX: 300, clientY: 782 })
    expect(screen.getByRole("tab", { name: "Notes" })).toHaveAttribute("data-active")
    fireEvent.pointerUp(bar, { pointerId: 1, clientX: 300, clientY: 782 })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("notes")
    // The click the lift makes is swallowed.
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(bar).not.toHaveAttribute("data-scrubbing")
  })

  it("a scrub that is cancelled picks nothing", () => {
    const onChange = vi.fn()
    render(<Vale onChange={onChange} />)
    const bar = screen.getByRole("tablist")
    layOut()
    fireEvent.pointerDown(bar, { button: 0, pointerId: 1, clientX: 100, clientY: 780 })
    fireEvent.pointerMove(bar, { pointerId: 1, clientX: 250, clientY: 780 })
    fireEvent.pointerCancel(bar, { pointerId: 1 })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole("tab", { name: "Mail, 12" })).toHaveAttribute("data-active")
  })

  it("minimized shows only the active tab, 48 wide, on the state motion role; the others leave the tab order", () => {
    render(<Vale start="calendar" minimized />)
    const bar = screen.getByRole("tablist")
    expect(bar).toHaveAttribute("data-minimized")
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["grow-0", "basis-control", "gap-0", "duration-(--motion-state)", "ease-(--motion-ease-move)"]))
    expect(bar.className).toContain("transition-[flex-grow,flex-basis,gap]")
    const hidden = screen.getAllByRole("tab", { hidden: true }).filter((el) => el.hasAttribute("data-collapsed"))
    expect(hidden.map((el) => el.getAttribute("data-value"))).toEqual(["mail", "contacts", "notes"])
    for (const el of hidden) expect(classesOf(el)).toEqual(expect.arrayContaining(["invisible", "opacity-0", "grow-0"]))
    expect(screen.getByRole("tab", { name: "Calendar" })).not.toHaveAttribute("data-collapsed")
  })

  it("minimized: no scrub, and a tap on the one tab is a reselect (back to the top)", async () => {
    const user = userEvent.setup()
    const onReselect = vi.fn()
    const onChange = vi.fn()
    render(<Vale minimized onReselect={onReselect} onChange={onChange} />)
    const bar = screen.getByRole("tablist")
    fireEvent.pointerDown(bar, { button: 0, pointerId: 1, clientX: 100, clientY: 780 })
    fireEvent.pointerMove(bar, { pointerId: 1, clientX: 300, clientY: 780 })
    expect(bar).not.toHaveAttribute("data-scrubbing")
    fireEvent.pointerUp(bar, { pointerId: 1, clientX: 300, clientY: 780 })
    await user.click(screen.getByRole("tab", { name: "Mail, 12" }))
    expect(onReselect).toHaveBeenCalledWith("mail")
    expect(onChange).not.toHaveBeenCalled()
  })

  it("vertical: a 48px column of 40px tabs, the arrow keys go up and down", async () => {
    const user = userEvent.setup()
    render(<Vale orientation="vertical" />)
    const bar = screen.getByRole("tablist")
    expect(bar).toHaveAttribute("aria-orientation", "vertical")
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["w-control", "flex-col"]))
    expect(classesOf(screen.getByRole("tab", { name: "Notes" }))).toEqual(expect.arrayContaining(["h-10", "w-full"]))
    await user.tab()
    await user.keyboard("{ArrowDown}")
    expect(screen.getByRole("tab", { name: "Calendar", selected: true })).toHaveFocus()
  })

  it("draws nothing with fewer than two sections", () => {
    const { container } = render(
      <TabBar label="Sections" value="mail">
        <TabBarItem value="mail" icon="email" label="Mail" />
      </TabBar>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it("links: a nav of links with aria-current; a scrub follows the link it lands on", () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    render(
      <TabBar label="Sections" navigation="links" value="chat">
        <TabBarItem value="chat" icon="chat" label="Chat" href="/chat" />
        <TabBarItem value="docs" icon="document" label="Docs" href="/docs" />
        <TabBarItem value="tasks" icon="task" label="Tasks" href="/tasks" mark={{ count: 1, tone: "needs-you" }} onClick={onClick} />
      </TabBar>
    )
    const nav = screen.getByRole("navigation", { name: "Sections" })
    expect(nav).toHaveAttribute("data-slot", "tab-bar")
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Tasks, 1 waiting on you" })).toHaveAttribute("href", "/tasks")
    const links = screen.getAllByRole("link")
    links.forEach((el, i) => {
      el.getBoundingClientRect = () => ({ left: i * 80, right: (i + 1) * 80, top: 0, bottom: 40, width: 80, height: 40, x: i * 80, y: 0, toJSON() {} }) as DOMRect
    })
    fireEvent.pointerDown(nav, { button: 0, pointerId: 1, clientX: 10, clientY: 20 })
    act(() => {
      fireEvent.pointerMove(nav, { pointerId: 1, clientX: 200, clientY: 20 })
    })
    fireEvent.pointerUp(nav, { pointerId: 1, clientX: 200, clientY: 20 })
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
