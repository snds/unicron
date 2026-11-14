import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppFrame, AppFrameMain, AppFrameSidebar, AppFrameStatusLine, AppFrameSwitcher, AppFrameTopBar, StatusItem, formatCountdown } from "./app-frame"
import { AppLockup } from "./app-lockup"
import { FloatButton } from "./float-button"
import { NavItem, NavSection } from "./nav-item"
import { TopTab, TopTabs } from "./top-tabs"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setViewport(1024, 768))

function Sidebar(props: Partial<React.ComponentProps<typeof AppFrameSidebar>>) {
  return (
    <AppFrame>
      <AppFrameSidebar
        lockup={<AppLockup name="Synapse" />}
        switcher={<AppFrameSwitcher overline="Workspace // 01 of 03" title="Personal" label="Switch workspace" />}
        action={{ label: "New skill", icon: "add" }}
        footer={<NavItem label="Settings" icon="settings" href="#settings" />}
        {...props}
      >
        <NavSection title="Workspace">
          <NavItem label="Overview" icon="dashboard" current href="#overview" />
          <NavItem label="Skills" icon="skill-level" count={145} href="#skills" />
        </NavSection>
      </AppFrameSidebar>
      <AppFrameMain />
    </AppFrame>
  )
}

describe("AppFrameSidebar", () => {
  it("draws the lockup, the switcher, the full-width primary, the sections and the pinned foot at the expanded width", () => {
    setViewport(1440, 900)
    render(<Sidebar />)
    const nav = screen.getByRole("navigation", { name: "Places" })
    expect(nav).toHaveAttribute("data-state", "expanded")
    expect(nav.className).toContain("w-(--c-app-frame-sidebar-width)")
    expect(screen.getByText("Synapse")).not.toHaveClass("sr-only")
    expect(screen.getByText("Personal")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Switch workspace" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "New skill" })).toHaveClass("w-full")
    expect(screen.getByRole("group", { name: "Workspace" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page")
    // The middle scrolls; the foot is pinned under it.
    const middle = nav.querySelector('[data-slot="app-frame-sidebar-middle"]')!
    expect(middle).toHaveClass("overflow-y-auto", "flex-1")
    expect(nav.querySelector('[data-slot="app-frame-sidebar-footer"]')).toContainElement(screen.getByRole("link", { name: "Settings" }))
  })

  it("collapses to its rail by choice: the mark, the primary as an icon, the items as rail items, the foot", () => {
    setViewport(1440, 900)
    const onCollapsedChange = vi.fn()
    const { rerender } = render(<Sidebar collapsed={false} onCollapsedChange={onCollapsedChange} />)
    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }))
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true)

    rerender(<Sidebar collapsed onCollapsedChange={onCollapsedChange} />)
    const nav = screen.getByRole("navigation", { name: "Places" })
    expect(nav).toHaveAttribute("data-state", "rail")
    expect(nav.className).toContain("w-(--c-app-frame-sidebar-rail)")
    expect(screen.getByText("Synapse")).toHaveClass("sr-only")
    // No switcher in the rail: the page head switches there (Synapse Y-01).
    expect(screen.queryByRole("button", { name: "Switch workspace" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "New skill" })).toHaveAttribute("data-slot", "float-button")
    // Every item draws as a rail item; its label is its name (and its tooltip), its count joins it.
    expect(screen.getByRole("link", { name: "Skills, 145" }).closest('[data-slot="nav-item"]')).toHaveAttribute("data-collapsed")
    expect(screen.getByRole("link", { name: "Settings" }).closest('[data-slot="nav-item"]')).toHaveAttribute("data-collapsed")
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(onCollapsedChange).toHaveBeenLastCalledWith(false)
  })

  it("toggles on ⌘\\ and Ctrl+\\", () => {
    setViewport(1440, 900)
    const onCollapsedChange = vi.fn()
    render(<Sidebar collapsed={false} onCollapsedChange={onCollapsedChange} />)
    fireEvent.keyDown(document, { key: "\\", metaKey: true })
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true)
    fireEvent.keyDown(document, { key: "\\", ctrlKey: true })
    expect(onCollapsedChange).toHaveBeenCalledTimes(2)
  })

  it("is its rail at medium width, and expanding lays the full sidebar over the content as a drawer", () => {
    setViewport(820, 1180)
    render(<Sidebar />)
    expect(screen.getByRole("navigation", { name: "Places" })).toHaveAttribute("data-state", "rail")
    const expand = screen.getByRole("button", { name: "Expand sidebar" })
    expect(expand).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(expand)
    const drawer = screen.getByRole("dialog", { name: "Places" })
    expect(drawer).toContainElement(screen.getByRole("button", { name: "Switch workspace" }))
    expect(document.querySelector('[data-slot="app-frame-sidebar-scrim"]')).toHaveClass("scrim-menu")
    // Esc closes it and focus comes back to the control that opened it.
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.queryByRole("dialog", { name: "Places" })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Expand sidebar" }))
  })

  // A browser refuses focus inside an inert box, and the rail is inert while the drawer shows.
  // The old code called focus() in the closing handler, before the rail was released, so focus fell
  // to the body in a real browser (jsdom does not enforce inert; the browser check in
  // tests/shell-frame.spec.ts holds this). Here: "Close sidebar" returns focus as Esc does.
  it("returns focus to the expand control when the drawer closes by its Close button", () => {
    setViewport(820, 1180)
    render(<Sidebar />)
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
    fireEvent.click(screen.getByRole("button", { name: "Close sidebar" }))
    expect(screen.queryByRole("dialog", { name: "Places" })).not.toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Expand sidebar" }))
  })

  it("keeps focus where the person put it when the app re-renders with a new onDrawerOpenChange", () => {
    setViewport(820, 1180)
    // An inline handler: a new function on every render of the app.
    const { rerender } = render(<Sidebar drawerOpen onDrawerOpenChange={() => {}} />)
    const drawer = screen.getByRole("dialog", { name: "Places" })
    const controls = drawer.querySelectorAll<HTMLElement>("a[href],button:not([disabled])")
    expect(controls.length).toBeGreaterThan(1)
    const last = controls[controls.length - 1]!
    last.focus()
    expect(document.activeElement).toBe(last)
    rerender(<Sidebar drawerOpen onDrawerOpenChange={() => {}} />)
    // Focus was pulled back to the drawer's first control on every such render.
    expect(document.activeElement).toBe(last)
  })

  it("closes the drawer on a press outside", () => {
    setViewport(820, 1180)
    render(<Sidebar />)
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
    fireEvent.pointerDown(document.querySelector('[data-slot="app-frame-sidebar-scrim"]')!)
    expect(screen.queryByRole("dialog", { name: "Places" })).not.toBeInTheDocument()
  })

  it("keeps clear of the macOS window buttons", () => {
    setViewport(1440, 900)
    render(<Sidebar leadingInset={{ start: 40 }} />)
    const row = screen.getByText("Synapse").closest('[data-slot="app-lockup"]')!.parentElement!
    expect(row.style.paddingInlineStart).toBe("40px")
  })

  it("draws nothing on a phone", () => {
    setViewport(390, 844)
    render(<Sidebar />)
    expect(screen.queryByRole("navigation", { name: "Places" })).not.toBeInTheDocument()
  })
})

describe("StatusItem (contract 5.1b #4)", () => {
  it("writes countdowns as decisions §13 does", () => {
    expect(formatCountdown(8)).toBe("08 S")
    // A part of a second still to go counts as a second: 59.2 left reads a full minute.
    expect(formatCountdown(59.2)).toBe("01:00")
    expect(formatCountdown(252)).toBe("04:12")
    expect(formatCountdown(0)).toBe("00 S")
  })

  it("draws the tone's ink, hides its countdown and bar from assistive tech, and says its sentence once", () => {
    render(<StatusItem tone="live" mark="square" text="Sending" countdown={8} progress={{ value: 2, max: 10 }} action={{ label: "Undo", onClick: () => {} }} announce="Sending. 10 seconds to undo." />)
    expect(document.querySelector('[data-slot="status-item-text"]')).toHaveClass("type-overline", "text-secondary-live")
    expect(document.querySelector('[data-slot="status-item-countdown"]')).toHaveAttribute("aria-hidden", "true")
    expect(document.querySelector('[data-slot="status-item-countdown"]')).toHaveTextContent("// 08 S")
    expect(document.querySelector('[data-slot="status-item-progress"]')).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByRole("status")).toHaveTextContent("Sending. 10 seconds to undo.")
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument()
  })

  it("is a button or a link when the item itself does something", () => {
    const onClick = vi.fn()
    const { rerender } = render(<StatusItem text="Checked // 15:37" label="Check again" onClick={onClick} />)
    const button = screen.getByRole("button", { name: "Check again" })
    expect(button).toHaveAccessibleDescription("Checked // 15:37")
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalled()
    rerender(<StatusItem text="Spend // $3.40 of $10.00" href="/spend" />)
    expect(screen.getByRole("link", { name: "Spend // $3.40 of $10.00" })).toHaveAttribute("href", "/spend")
  })

  it.each([
    ["neutral", "text-text-label"],
    ["warning", "text-warning"],
    ["critical", "text-critical-text"],
  ] as const)("%s ink is %s", (tone, ink) => {
    render(<StatusItem tone={tone} text="Spend // $8.20 of $10.00" />)
    expect(document.querySelector('[data-slot="status-item-text"]')).toHaveClass(ink)
  })
})

describe("AppFrameStatusLine", () => {
  it("holds a Badge after the crumbs and up to two items at the end, over a hairline", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameStatusLine crumbs={[{ label: "Personal", href: "#" }, { label: "Overview" }]} badge={<span>Sample</span>}>
          <StatusItem tone="live" mark="square" text="Checking // Personal" />
          <StatusItem text="Checked // 15:37" />
        </AppFrameStatusLine>
      </AppFrame>
    )
    const line = screen.getByRole("banner")
    expect(line).toHaveClass("rule-b", "h-16")
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toHaveTextContent("Personal // OverviewSample")
    expect(line.querySelectorAll('[data-slot="status-item"]')).toHaveLength(2)
  })

  it("draws nothing on a phone", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameStatusLine crumbs={[{ label: "Mail" }]} />
      </AppFrame>
    )
    expect(screen.queryByRole("banner")).not.toBeInTheDocument()
  })
})

describe("AppFrameTopBar (Warpcore)", () => {
  it("draws the lockup, the tabs, the status, the primary and the float buttons over a hairline", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameTopBar
          lockup={<AppLockup name="Warpcore" />}
          tabs={
            <TopTabs label="Sections">
              <TopTab label="Chat" index="01" icon="chat" href="#chat" />
              <TopTab label="Docs" index="02" icon="document" href="#docs" />
              <TopTab label="Tasks" index="03" icon="task" current href="#tasks" />
            </TopTabs>
          }
          status={<StatusItem text="Spend // $3.40 of $10.00" short="$3.40" href="/spend" />}
          action={{ label: "New task", icon: "add" }}
          actions={<FloatButton label="Settings" icon="settings" />}
        />
      </AppFrame>
    )
    const bar = screen.getByRole("banner")
    expect(bar).toHaveClass("rule-b", "h-16")
    expect(bar).toHaveAttribute("data-stage", "0")
    expect(screen.getByRole("navigation", { name: "Sections" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Tasks" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Spend // $3.40 of $10.00" })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="app-frame-top-bar-action"] [data-slot="button"]')).toHaveAccessibleName("New task")
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
  })

  it("gives up room in Warpcore's order when it overflows: short status, no wordmark, an icon primary, no numbers, icon tabs", () => {
    setViewport(700, 1000)
    // jsdom lays nothing out: make the bar overflow whatever it gives up, so it reaches the last step.
    const scrollWidth = vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(2000)
    const clientWidth = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(600)
    render(
      <AppFrame>
        <AppFrameTopBar
          lockup={<AppLockup name="Warpcore" />}
          tabs={
            <TopTabs label="Sections">
              <TopTab label="Tasks" index="03" icon="task" current href="#tasks" />
            </TopTabs>
          }
          status={<StatusItem text="Spend // $3.40 of $10.00" short="$3.40" href="/spend" />}
          action={{ label: "New task", icon: "add" }}
        />
      </AppFrame>
    )
    const bar = screen.getByRole("banner")
    expect(bar).toHaveAttribute("data-stage", "5")
    for (const flag of ["data-short-status", "data-no-wordmark", "data-icon-action", "data-no-index", "data-icon-tabs"]) expect(bar).toHaveAttribute(flag)
    // Each flag has its rule: the CSS hides the long forms, the status shows its short one and keeps its full name.
    expect(bar.className).toContain("[&[data-no-wordmark]_[data-slot=app-lockup-name]]:sr-only")
    expect(bar.className).toContain("[&[data-icon-action]_[data-slot=app-frame-top-bar-action]]:hidden")
    expect(bar.className).toContain("[&[data-no-index]_[data-slot=top-tab-index]]:hidden")
    expect(bar.className).toContain("[&[data-icon-tabs]_[data-slot=top-tab-label]]:sr-only")
    expect(document.querySelector('[data-slot="status-item-short"]')).toHaveClass("[[data-short-status]_&]:inline")
    expect(document.querySelector('[data-slot="status-item-text"]')).toHaveClass("[[data-short-status]_&]:hidden")
    expect(screen.getByRole("link", { name: "Spend // $3.40 of $10.00" })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="app-frame-top-bar-action-icon"] [data-slot="float-button"]')).toHaveAccessibleName("New task")
    scrollWidth.mockRestore()
    clientWidth.mockRestore()
  })

  it("keeps everything when it fits", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameTopBar lockup={<AppLockup name="Warpcore" />} action={{ label: "New task", icon: "add" }} />
      </AppFrame>
    )
    const bar = screen.getByRole("banner")
    expect(bar).toHaveAttribute("data-stage", "0")
    expect(bar).not.toHaveAttribute("data-short-status")
  })
})
