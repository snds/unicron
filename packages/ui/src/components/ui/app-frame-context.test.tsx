import * as React from "react"
import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppFrame, AppFrameAccessory, AppFrameBottomRow, AppFrameList, AppFrameMain, AppFramePageHead, AppFrameTopRow } from "./app-frame"
import { MINIMIZE_RESTORE_AT, frameLayoutFor, nextMinimized, useScrollMinimize } from "./app-frame-context"
import { AppLockup } from "./app-lockup"
import { FloatButton } from "./float-button"
import { TabBar, TabBarItem } from "./tab-bar"
import { classifyViewport } from "../use-viewport"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

/** jsdom does no layout: give an element a scroll position the test controls. */
function mockScroll(el: Element) {
  let top = 0
  Object.defineProperty(el, "scrollTop", { configurable: true, get: () => top, set: (v: number) => (top = v) })
  return (to: number) =>
    act(() => {
      top = to
      el.dispatchEvent(new Event("scroll"))
    })
}

const at = (width: number, height: number) =>
  frameLayoutFor(classifyViewport({ width, height, visualHeight: height, visualOffsetTop: 0, typing: false, fold: null }, null))

describe("the shell a width picks (contract 5.2)", () => {
  it.each([
    ["an iPhone", 390, 844, "phone"],
    ["a small iPhone", 375, 667, "phone"],
    ["an Android cover screen", 344, 882, "phone"],
    ["599 wide and tall", 599, 1100, "phone"],
    ["600 wide", 600, 900, "medium"],
    ["an iPhone Duo open", 669, 867, "medium"],
    ["an iPad upright", 820, 1180, "medium"],
    ["1023 wide", 1023, 900, "medium"],
    ["1024 wide", 1024, 768, "expanded"],
    ["an iPad on its side", 1180, 820, "expanded"],
    ["a laptop", 1440, 900, "expanded"],
    ["an ultrawide", 3440, 1440, "expanded"],
  ])("%s (%i × %i) gets the %s shell", (_, w, h, layout) => expect(at(w, h)).toBe(layout))

  it.each([
    ["an iPhone on its side", 844, 390],
    ["a large iPhone on its side", 956, 440],
    ["a small iPhone on its side", 667, 375],
    ["an iPhone Duo folded", 382, 580],
    ["an iPhone Duo folded, on its side", 594, 368],
    ["two windows on an iPhone Duo", 385, 571],
  ])("%s is short, so the bottom row stands at the trailing edge (Warpcore U-03)", (_, w, h) => expect(at(w, h)).toBe("rail"))

  it("keeps the desktop shell in a short window at the expanded width", () => {
    expect(at(1440, 460)).toBe("expanded")
  })
})

describe("the scroll-minimize state machine", () => {
  it("minimizes once past the line, not at it", () => {
    expect(nextMinimized(false, 0, 64)).toBe(false)
    expect(nextMinimized(false, 64, 64)).toBe(false)
    expect(nextMinimized(false, 65, 64)).toBe(true)
  })

  it("stays minimized on the way back up, until the top", () => {
    expect(nextMinimized(true, 64, 64)).toBe(true)
    expect(nextMinimized(true, 10, 64)).toBe(true)
    expect(nextMinimized(true, MINIMIZE_RESTORE_AT + 1, 64)).toBe(true)
    expect(nextMinimized(true, MINIMIZE_RESTORE_AT, 64)).toBe(false)
    expect(nextMinimized(true, 0, 64)).toBe(false)
  })

  it("treats iOS's rubber band past the top as the top", () => {
    expect(nextMinimized(true, -30, 64)).toBe(false)
  })
})

describe("useScrollMinimize", () => {
  function Probe({ threshold, enabled }: { threshold?: number; enabled?: boolean }) {
    const [el, setEl] = React.useState<HTMLDivElement | null>(null)
    const minimized = useScrollMinimize(el, { threshold, enabled })
    return (
      <div ref={setEl} data-testid="scroller" data-minimized={minimized ? "" : undefined}>
        content
      </div>
    )
  }

  it("follows a scroller past the threshold and back to the top", () => {
    const { rerender } = render(<Probe threshold={64} />)
    const scroller = screen.getByTestId("scroller")
    const scrollTo = mockScroll(scroller)
    rerender(<Probe threshold={64} />)
    scrollTo(40)
    expect(scroller).not.toHaveAttribute("data-minimized")
    scrollTo(120)
    expect(scroller).toHaveAttribute("data-minimized")
    scrollTo(30)
    expect(scroller).toHaveAttribute("data-minimized")
    scrollTo(0)
    expect(scroller).not.toHaveAttribute("data-minimized")
  })

  it("falls back to the knob's 64px without the stylesheet", () => {
    render(<Probe />)
    const scroller = screen.getByTestId("scroller")
    const scrollTo = mockScroll(scroller)
    scrollTo(64)
    expect(scroller).not.toHaveAttribute("data-minimized")
    scrollTo(65)
    expect(scroller).toHaveAttribute("data-minimized")
  })

  it("is off when disabled", () => {
    render(<Probe threshold={10} enabled={false} />)
    const scroller = screen.getByTestId("scroller")
    mockScroll(scroller)(200)
    expect(scroller).not.toHaveAttribute("data-minimized")
  })
})

describe("the phone's chrome on scroll (rules.md 6.5)", () => {
  afterEach(() => setViewport(1024, 768))

  function Inbox() {
    return (
      <AppFrame data-testid="frame">
        <AppFrameTopRow lockup={<AppLockup name="Vale" />} title="Inbox" actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
        <AppFrameMain>
          <AppFrameList aria-label="Inbox">
            <AppFramePageHead overline="Inbox // 012 unread" title="Today" />
            <p>Rows</p>
          </AppFrameList>
        </AppFrameMain>
        <AppFrameAccessory tone="live" meta="Syncing // Personal + Work" title="Checking 2 accounts" />
        <AppFrameBottomRow
          start={<FloatButton label="Search" icon="search" size="l" />}
          tabs={
            <TabBar label="Sections" value="mail">
              <TabBarItem value="mail" icon="email" label="Mail" />
              <TabBarItem value="calendar" icon="calendar" label="Calendar" />
              <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
              <TabBarItem value="notes" icon="notebook" label="Notes" />
            </TabBar>
          }
          end={<FloatButton label="New message" icon="edit" kind="primary" size="l" />}
        />
      </AppFrame>
    )
  }

  function bottomBars(container: HTMLElement) {
    const dock = container.querySelector('[data-slot="app-frame-bottom-row"]')!
    const above = dock.querySelector('[data-slot="app-frame-strip"]')!
    const row = dock.querySelector('[data-slot="app-frame-bottom-row-bar"]')!
    return { above, row, bars: (above.children.length > 0 ? 1 : 0) + 1 }
  }

  it("minimizes past the threshold and comes back at the top, never with more than two bars at the bottom", () => {
    setViewport(390, 844)
    const { container, rerender } = render(<Inbox />)
    const frame = screen.getByTestId("frame")
    const list = container.querySelector('[data-slot="app-frame-list"]')!
    const scrollTo = mockScroll(list)
    rerender(<Inbox />)

    // At rest: the wordmark, no small title, no hairline; the strip above the row, the whole tab bar.
    expect(frame).toHaveAttribute("data-layout", "phone")
    expect(frame).not.toHaveAttribute("data-minimized")
    expect(screen.getByText("Vale")).not.toHaveClass("sr-only")
    expect(container.querySelector('[data-slot="app-frame-top-row-title"]')).toBeNull()
    expect(container.querySelector('[data-slot="app-frame-top-row"]')).not.toHaveClass("rule-b")
    let { above, row, bars } = bottomBars(container)
    expect(above.querySelector('[data-slot="accessory"]')).not.toHaveAttribute("data-compact")
    expect(row.querySelector('[data-slot="tab-bar"]')).not.toHaveAttribute("data-minimized")
    expect(bars).toBe(2)

    scrollTo(200)
    expect(frame).toHaveAttribute("data-minimized")
    // The wordmark hides (the name stays the lockup's), the small title shows, a hairline appears.
    expect(screen.getByText("Vale")).toHaveClass("sr-only")
    expect(container.querySelector('[data-slot="app-frame-top-row-title"]')).toHaveTextContent("Inbox")
    expect(container.querySelector('[data-slot="app-frame-top-row"]')).toHaveClass("rule-b")
    // The tab bar shrinks to the active tab and the strip joins the row, compact: one bar.
    ;({ above, row, bars } = bottomBars(container))
    expect(row.querySelector('[data-slot="tab-bar"]')).toHaveAttribute("data-minimized")
    expect(above.children).toHaveLength(0)
    expect(row.querySelector('[data-slot="accessory"]')).toHaveAttribute("data-compact")
    expect(bars).toBe(1)
    expect(screen.getByRole("tab", { name: "Mail" })).toBeInTheDocument()

    // A little way back up: still minimized. At the top: back as it was.
    scrollTo(20)
    expect(frame).toHaveAttribute("data-minimized")
    scrollTo(0)
    expect(frame).not.toHaveAttribute("data-minimized")
    expect(screen.getByText("Vale")).not.toHaveClass("sr-only")
    ;({ above, bars } = bottomBars(container))
    expect(above.querySelector('[data-slot="accessory"]')).toBeInTheDocument()
    expect(bars).toBe(2)
  })

  it("takes the small title from the page head when the row names none", () => {
    setViewport(390, 844)
    render(
      <AppFrame minimized>
        <AppFrameTopRow lockup={<AppLockup name="Warpcore" />} />
        <AppFrameMain>
          <AppFrameList>
            <AppFramePageHead title="Tasks" />
          </AppFrameList>
        </AppFrameMain>
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-top-row-title"]')).toHaveTextContent("Tasks")
    // The page head in the content stays the page's one h1.
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("makes the small title the switcher when the page head is one (decisions §7)", () => {
    setViewport(390, 844)
    const onClick = vi.fn()
    render(
      <AppFrame minimized>
        <AppFrameTopRow lockup={<AppLockup name="Synapse" />} />
        <AppFrameMain>
          <AppFrameList>
            <AppFramePageHead title="Overview" overline="Personal // Workspace health" switcher={{ label: "Switch workspace", onClick }} />
          </AppFrameList>
        </AppFrameMain>
      </AppFrame>
    )
    const small = document.querySelector('[data-slot="app-frame-top-row-title"]') as HTMLElement
    expect(small.tagName).toBe("BUTTON")
    expect(small).toHaveAccessibleName("Overview, Switch workspace")
    act(() => small.click())
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not minimize on a desktop", () => {
    setViewport(1440, 900)
    const { container } = render(<Inbox />)
    mockScroll(container.querySelector('[data-slot="app-frame-list"]')!)(400)
    expect(screen.getByTestId("frame")).not.toHaveAttribute("data-minimized")
    expect(container.querySelector('[data-slot="app-frame-top-row"]')).toBeNull()
    expect(container.querySelector('[data-slot="app-frame-bottom-row"]')).toBeNull()
  })
})
