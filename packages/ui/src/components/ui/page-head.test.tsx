import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Badge } from "./badge"
import { Button } from "./button"
import { PageHead } from "./page-head"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("PageHead", () => {
  it("is the page's h1, with the overline above it in label ink, 4px apart", () => {
    const { container } = render(<PageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" />)
    const heading = screen.getByRole("heading", { level: 1, name: "Today" })
    expect(classesOf(heading)).toEqual(expect.arrayContaining(["type-display-compact", "text-text-body"]))
    const overline = container.querySelector('[data-slot="page-head-overline"] > span')!
    expect(overline).toHaveTextContent("Inbox // 012 unread")
    expect(classesOf(overline)).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
    expect(classesOf(container.querySelector('[data-slot="page-head-main"]')!)).toEqual(expect.arrayContaining(["flex-col", "gap-1"]))
  })

  it("the side meta and the count sit on the title's baseline in the folio role", () => {
    const { container } = render(<PageHead overline="Personal vault // 6 types" title="Items" count={248} />)
    const count = container.querySelector('[data-slot="page-head-count"]')!
    expect(count).toHaveTextContent("248")
    expect(classesOf(count)).toEqual(expect.arrayContaining(["type-folio", "text-text-label"]))
    expect(classesOf(count.parentElement!)).toEqual(expect.arrayContaining(["items-baseline", "gap-x-3"]))
    // The count is beside the heading, not in its name.
    expect(screen.getByRole("heading", { name: "Items" })).not.toContainElement(count as HTMLElement)
  })

  it("counts follow cross-app decisions §13; a string is shown as given", () => {
    const { container, rerender } = render(<PageHead title="Harnesses" count={9} />)
    expect(container.querySelector('[data-slot="page-head-count"]')).toHaveTextContent("09")
    rerender(<PageHead title="Tasks" count="/012" />)
    expect(container.querySelector('[data-slot="page-head-count"]')).toHaveTextContent("/012")
  })

  it("sizes: lg is display with the count in code/display, md display/compact, sm title", () => {
    const { container, rerender } = render(<PageHead size="lg" overline="Tasks // 03 running // 01 waiting on you" title="Tasks" count="/012" />)
    expect(screen.getByRole("heading").className).toContain("type-display")
    expect(container.querySelector('[data-slot="page-head-count"]')!.className).toContain("type-code-display")
    rerender(<PageHead size="md" title="Tasks" count="/012" />)
    expect(screen.getByRole("heading").className).toContain("type-display-compact")
    expect(container.querySelector('[data-slot="page-head-count"]')!.className).toContain("type-folio")
    rerender(<PageHead size="sm" title="Migrate vault login to OPAQUE" />)
    expect(classesOf(screen.getByRole("heading"))).toContain("type-title")
  })

  it("meta can sit on its own line under the title (a desktop detail head)", () => {
    const { container } = render(<PageHead size="lg" overline="Login // passkey + code // Steam Guard" title="Steam" meta="store.steampowered.com // added 2024.03.11" metaPosition="below" />)
    const meta = container.querySelector('[data-slot="page-head-meta"]')!
    expect(meta.parentElement).toHaveAttribute("data-slot", "page-head-main")
    expect(classesOf(meta)).toEqual(expect.arrayContaining(["type-folio", "text-text-label"]))
  })

  // Lockdown Desktop / 01: overline at y 96, the display title's 68px line from 112, the meta line
  // from 180: nothing between the three. The phone frames (md, sm) keep 4.
  it("lg sets the overline and the meta line directly on the title's line box; md and sm keep 4 between them", () => {
    const { container, rerender } = render(<PageHead size="lg" overline="Login" title="Steam" meta="store.steampowered.com" metaPosition="below" />)
    const main = () => classesOf(container.querySelector('[data-slot="page-head-main"]')!)
    expect(main()).toContain("gap-0")
    expect(main()).not.toContain("gap-1")
    for (const size of ["md", "sm"] as const) {
      rerender(<PageHead size={size} overline="Inbox // 012 unread" title="Today" />)
      expect(main()).toContain("gap-1")
    }
  })

  it("meta as a button, above the switcher", async () => {
    const user = userEvent.setup()
    const onMetaClick = vi.fn()
    render(<PageHead title="Today" meta="THU 11.12" onMetaClick={onMetaClick} metaLabel="Go to today" switcher={{ label: "Switch account" }} />)
    const meta = screen.getByRole("button", { name: "Go to today" })
    expect(classesOf(meta)).toEqual(expect.arrayContaining(["type-folio", "relative", "z-10", "hit-area"]))
    await user.click(meta)
    expect(onMetaClick).toHaveBeenCalledTimes(1)
  })

  it("a status Badge after the title, and actions at the end", () => {
    const { container } = render(
      <PageHead
        title="Personal"
        status={<Badge>Read-only</Badge>}
        actions={
          <Button size="sm" variant="secondary" data-testid="check">
            Check again
          </Button>
        }
      />
    )
    expect(container.querySelector('[data-slot="page-head-status"]')).toHaveTextContent("Read-only")
    const actions = container.querySelector('[data-slot="page-head-actions"]')!
    expect(within(actions as HTMLElement).getByTestId("check")).toBeInTheDocument()
    expect(classesOf(container.querySelector('[data-slot="page-head"]')!)).toEqual(expect.arrayContaining(["flex-wrap", "items-end"]))
  })

  it("switcher: the whole head is one button named by the title and what it does, a chevron after the overline", async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    const { container } = render(<PageHead overline="Workspace // 01 of 03" title="Personal" switcher={{ label: "Switch workspace", onClick, "aria-haspopup": "menu" }} />)
    const button = screen.getByRole("button", { name: "Personal, Switch workspace" })
    expect(button).toHaveAttribute("aria-haspopup", "menu")
    expect(classesOf(button)).toEqual(expect.arrayContaining(["absolute", "hover:bg-state-hover"]))
    expect(container.querySelector('[data-slot="page-head-overline"] [data-slot="page-head-chevron"]')).not.toBeNull()
    // The heading stays a heading.
    expect(screen.getByRole("heading", { level: 1, name: "Personal" })).toBeInTheDocument()
    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("a sideways swipe on the switcher steps the account; one from the left edge is left to the system", () => {
    const onSwipe = vi.fn()
    const onClick = vi.fn()
    render(<PageHead title="Personal" switcher={{ label: "Switch vault", onSwipe, onClick }} />)
    const button = screen.getByRole("button", { name: "Personal, Switch vault" })
    expect(button).toHaveAttribute("aria-keyshortcuts", "ArrowLeft ArrowRight")
    fireEvent.pointerDown(button, { button: 0, pointerId: 1, clientX: 200, clientY: 140 })
    // Lifted past the head: still a swipe.
    fireEvent.pointerUp(document.body, { pointerId: 1, clientX: 100, clientY: 150 })
    expect(onSwipe).toHaveBeenLastCalledWith("next")
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    fireEvent.pointerDown(button, { button: 0, pointerId: 2, clientX: 100, clientY: 140 })
    fireEvent.pointerUp(button, { pointerId: 2, clientX: 220, clientY: 140 })
    expect(onSwipe).toHaveBeenLastCalledWith("previous")
    // From the edge: the system's back gesture.
    fireEvent.pointerDown(button, { button: 0, pointerId: 3, clientX: 10, clientY: 140 })
    fireEvent.pointerUp(button, { pointerId: 3, clientX: 200, clientY: 140 })
    expect(onSwipe).toHaveBeenCalledTimes(2)
  })

  it("the arrow keys step the account from the keyboard", async () => {
    const user = userEvent.setup()
    const onSwipe = vi.fn()
    render(<PageHead title="Personal" switcher={{ label: "Switch vault", onSwipe }} />)
    await user.tab()
    await user.keyboard("{ArrowRight}{ArrowLeft}")
    expect(onSwipe.mock.calls.map(([d]) => d)).toEqual(["next", "previous"])
  })

  it("collapsed: one small centred title in the subtitle role, 48 high, still the h1, arriving on motion-pop", () => {
    const { container } = render(<PageHead overline="Inbox // 012 unread" title="Inbox" meta="THU 11.12" collapsed />)
    const root = container.querySelector('[data-slot="page-head"]')!
    expect(root).toHaveAttribute("data-collapsed")
    expect(classesOf(root)).toEqual(expect.arrayContaining(["h-control", "justify-center"]))
    const heading = screen.getByRole("heading", { level: 1, name: "Inbox" })
    expect(heading.className).toContain("motion-pop")
    expect(heading.querySelector(".type-subtitle")).not.toBeNull()
    expect(container.querySelector('[data-slot="page-head-overline"]')).toBeNull()
    expect(container.querySelector('[data-slot="page-head-meta"]')).toBeNull()
  })

  it("collapsed with a switcher: the small title stays a button", () => {
    render(<PageHead title="Personal" switcher={{ label: "Switch workspace" }} collapsed />)
    const button = screen.getByRole("button", { name: "Personal, Switch workspace" })
    expect(screen.getByRole("heading", { level: 1 })).toContainElement(button)
    expect(button.querySelector('[data-slot="page-head-chevron"]')).not.toBeNull()
  })
})
