import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AppFrame, AppFrameAccessory, AppFrameBottomRow, AppFrameDetail, AppFrameList, AppFrameMain, AppFramePageHead, AppFrameScrollEdge, AppFrameTopRow } from "./app-frame"
import { AppLockup } from "./app-lockup"
import { FloatButton } from "./float-button"
import { Input } from "./input"
import { TabBar, TabBarItem } from "./tab-bar"
import { Textarea } from "./textarea"
import { TopBar } from "./top-bar"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

const originalMatchMedia = window.matchMedia

/** A touch keyboard up over a focused field: iOS keeps the page's height and shrinks the visual viewport. */
function openKeyboard(field: HTMLElement, visibleHeight: number) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("pointer: coarse"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: { height: visibleHeight, offsetTop: 0, scale: 1, addEventListener() {}, removeEventListener() {} },
  })
  act(() => {
    field.focus()
    document.dispatchEvent(new FocusEvent("focusin"))
  })
}

afterEach(() => {
  window.matchMedia = originalMatchMedia
  Object.defineProperty(window, "visualViewport", { configurable: true, value: undefined })
  ;(document.activeElement as HTMLElement | null)?.blur?.()
  setViewport(1024, 768)
})

const tabs = (
  <TabBar label="Sections" value="items">
    <TabBarItem value="items" icon="password" label="Items" />
    <TabBarItem value="codes" icon="time" label="Codes" />
    <TabBarItem value="health" icon="checkmark--outline" label="Health" />
  </TabBar>
)

describe("AppFrameTopRow", () => {
  it("floats at the top with the lockup at the start and the buttons at the end, 48 high", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameTopRow lockup={<AppLockup name="Lockdown" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
      </AppFrame>
    )
    const row = document.querySelector('[data-slot="app-frame-top-row"]')!
    expect(row).toHaveClass("absolute", "top-0", "z-20", "px-4")
    expect(row.querySelector('[data-slot="app-frame-top-row-bar"]')).toHaveClass("h-control")
    // The solid ground under it is the row's own, so the scrolled hairline (an inset shadow) shows.
    expect(row).toHaveClass("bg-surface-ground")
    expect(screen.getByRole("button", { name: "Settings" })).toBeInTheDocument()
  })

  it("gives a pushed screen's TopBar the page head's title once the head has scrolled away", () => {
    setViewport(390, 844)
    const show = (minimized: boolean) => (
      <AppFrame minimized={minimized}>
        <AppFrameTopRow>
          <TopBar onBack={() => {}} />
        </AppFrameTopRow>
        <AppFrameMain>
          <AppFrameList />
          <AppFrameDetail open>
            <AppFramePageHead title="Steam" />
          </AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    const { rerender } = render(show(false))
    expect(document.querySelector('[data-slot="top-bar-title"]')).toBeNull()
    rerender(show(true))
    expect(document.querySelector('[data-slot="top-bar-title"]')).toHaveTextContent("Steam")
  })

  it("draws nothing on a desktop", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameTopRow lockup={<AppLockup name="Vale" />} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-top-row"]')).toBeNull()
  })
})

describe("AppFrameBottomRow", () => {
  it("lays out search, the tab bar filling, and create, over the bottom scroll edge", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameBottomRow start={<FloatButton label="Search" icon="search" size="l" />} tabs={tabs} end={<FloatButton label="New item" icon="add" kind="primary" size="l" />} />
      </AppFrame>
    )
    const dock = document.querySelector('[data-slot="app-frame-bottom-row"]')!
    expect(dock).toHaveAttribute("data-variant", "tabs")
    const bar = dock.querySelector('[data-slot="app-frame-bottom-row-bar"]')!
    // The end sits in its own slot, held at the trailing edge (`ms-auto`): the create button does
    // not move while the tab bar and the strip trade room.
    expect([...bar.children].map((el) => el.getAttribute("data-slot"))).toEqual(["float-button", "tab-bar", "app-frame-bottom-row-strip", "app-frame-bottom-row-end"])
    const end = bar.querySelector('[data-slot="app-frame-bottom-row-end"]')!
    expect(end.className.split(/\s+/)).toEqual(expect.arrayContaining(["ms-auto", "shrink-0"]))
    expect(end).toContainElement(screen.getByRole("button", { name: "New item" }))
    // The strip's slot is always in the row at no width, and trades room with the tab bar on the
    // state role: the bar's first frame is its old width (the browser check samples the frames).
    const strip = bar.querySelector('[data-slot="app-frame-bottom-row-strip"]')!
    expect(strip.className.split(/\s+/)).toEqual(
      expect.arrayContaining(["grow-0", "basis-0", "-ms-2", "has-[>*]:grow", "has-[>*]:ms-0", "transition-[flex-grow,margin]", "duration-(--motion-state)", "ease-(--motion-ease-move)"])
    )
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute("aria-orientation", "horizontal")
    // A masked fill of the ground, never a blur, written for WebKit too.
    const edge = dock.querySelector('[data-slot="app-frame-scroll-edge"]')!
    expect(edge).toHaveAttribute("data-edge", "bottom")
    expect(edge).toHaveAttribute("aria-hidden", "true")
    expect(edge.className).toContain("bg-surface-ground")
    expect(edge.className).toContain("[mask-image:linear-gradient(to_bottom,transparent,black_var(--c-app-frame-scroll-edge))]")
    expect(edge.className).toContain("[-webkit-mask-image:")
    expect(edge.className).not.toMatch(/blur/)
  })

  it("has a detail form: start, fill and end, no tab bar (contract 5.1b #2)", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameBottomRow
          variant="detail"
          start={<FloatButton label="Edit" icon="edit" size="l" />}
          fill={<p>Reply to Mira</p>}
          end={<FloatButton label="Copy password" icon="copy" kind="primary" size="l" extended />}
        />
      </AppFrame>
    )
    const dock = document.querySelector('[data-slot="app-frame-bottom-row"]')!
    expect(dock).toHaveAttribute("data-variant", "detail")
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    const fill = dock.querySelector('[data-slot="app-frame-bottom-row-fill"]')!
    expect(fill).toHaveTextContent("Reply to Mira")
    // The slot fills the row and stretches what it holds: a Composer's root hugs otherwise, and
    // stopped two thirds across the row (the browser check measures its right edge).
    expect(fill.className.split(/\s+/)).toEqual(expect.arrayContaining(["flex", "min-w-0", "flex-1", "[&>*]:min-w-0", "[&>*]:flex-1"]))
    expect(screen.getByRole("button", { name: "Copy password" })).toHaveTextContent("Copy password")
  })

  it("steps aside with its strip while a keyboard is up, so a focused field is not under it; a detail row stays on the keyboard", () => {
    setViewport(390, 844)
    const { rerender } = render(
      <AppFrame>
        <Input aria-label="Search items" />
        <AppFrameAccessory tone="needs-you" meta="Sign-in request // 00:40 ago" title="Steam on a Windows PC" />
        <AppFrameBottomRow start={<FloatButton label="Search" icon="search" size="l" />} tabs={tabs} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-bottom-row"]')).not.toBeNull()
    openKeyboard(screen.getByRole("textbox", { name: "Search items" }), 480)
    const frame = document.querySelector('[data-slot="app-frame"]')!
    expect(frame).toHaveAttribute("data-keyboard", "open")
    expect(document.querySelector('[data-slot="app-frame-bottom-row"]')).toBeNull()
    expect(document.querySelector('[data-slot="accessory"]')).toBeNull()

    rerender(
      <AppFrame>
        <Input aria-label="Search items" />
        <AppFrameBottomRow variant="detail" fill={<Textarea aria-label="Reply" />} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-bottom-row"][data-variant="detail"]')).not.toBeNull()
  })

  it("on a short screen stands its buttons and a vertical tab bar in the trailing column (Warpcore U-03)", () => {
    setViewport(844, 390)
    render(
      <AppFrame>
        <AppFrameTopRow actions={<FloatButton label="Settings" icon="settings" size="l" />} />
        <AppFrameMain>
          <AppFrameList aria-label="Items" />
        </AppFrameMain>
        <AppFrameAccessory tone="live" meta="Unlocking" title="Decrypting 248 items" />
        <AppFrameBottomRow start={<FloatButton label="Search" icon="search" size="l" />} tabs={tabs} end={<FloatButton label="New item" icon="add" kind="primary" size="l" />} />
      </AppFrame>
    )
    const frame = document.querySelector('[data-slot="app-frame"]')!
    expect(frame).toHaveAttribute("data-layout", "rail")
    const column = document.querySelector('[data-slot="app-frame-rail"]')!
    const top = column.querySelector('[data-slot="app-frame-rail-top"]')!
    const bottom = column.querySelector('[data-slot="app-frame-rail-bottom"]')!
    expect(top).toContainElement(screen.getByRole("button", { name: "Settings" }))
    expect([...bottom.children].map((el) => el.getAttribute("data-slot"))).toEqual(["float-button", "tab-bar", "float-button"])
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute("aria-orientation", "vertical")
    // The content keeps clear of the column; the strip is compact at the foot of the content.
    expect(screen.getByRole("region", { name: "Items" })).toHaveClass("pe-20")
    expect(document.querySelector('[data-slot="accessory"]')).toHaveAttribute("data-compact")
  })
})

describe("a tab bar in the app's own component", () => {
  // Apps wrap their tab bar (ValeTabs); the row's state reaches it through context, not props.
  function Sections() {
    return tabs
  }

  it("still shrinks when the page has scrolled, and turns vertical on a short screen", () => {
    setViewport(390, 844)
    const { rerender } = render(
      <AppFrame minimized>
        <AppFrameBottomRow tabs={<Sections />} />
      </AppFrame>
    )
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute("data-minimized")
    setViewport(844, 390)
    rerender(
      <AppFrame>
        <AppFrameBottomRow tabs={<Sections />} />
      </AppFrame>
    )
    expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute("aria-orientation", "vertical")
  })

  it("keeps a value the app sets itself", () => {
    setViewport(390, 844)
    render(
      <AppFrame minimized>
        <AppFrameBottomRow
          tabs={
            <TabBar label="Sections" value="items" minimized={false}>
              <TabBarItem value="items" icon="password" label="Items" />
              <TabBarItem value="codes" icon="time" label="Codes" />
            </TabBar>
          }
        />
      </AppFrame>
    )
    expect(screen.getByRole("tablist", { name: "Sections" })).not.toHaveAttribute("data-minimized")
  })
})

describe("AppFrameAccessory", () => {
  it("floats alone at the foot when the screen has no bottom row", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameAccessory tone="live" meta="Sending // 08 S" title="Board games for the cabin" />
      </AppFrame>
    )
    const strip = document.querySelector('[data-slot="app-frame-strip"]')!
    expect(strip).toHaveClass("absolute", "bottom-0", "px-4")
    expect(strip.querySelector('[data-slot="accessory"]')).not.toHaveAttribute("data-compact")
  })

  it("shows one strip at a time in the slot", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameAccessory tone="needs-you" meta="Awaiting your review // 02" title="Visual QA harness" />
        <AppFrameAccessory tone="live" meta="Checking // Personal" title="218 checks // 41 done" />
        <AppFrameBottomRow tabs={tabs} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-strip"]')!.className).toContain("[&>*:not(:first-child)]:hidden")
  })

  it("waits for the scroll when it is the place strip", () => {
    setViewport(390, 844)
    const { rerender } = render(
      <AppFrame>
        <AppFrameAccessory scrolledOnly meta="Inbox // 012 unread" title="Cabin for the 20th" />
        <AppFrameBottomRow tabs={tabs} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="accessory"]')).toBeNull()
    rerender(
      <AppFrame minimized>
        <AppFrameAccessory scrolledOnly meta="Inbox // 012 unread" title="Cabin for the 20th" />
        <AppFrameBottomRow tabs={tabs} />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="accessory"]')).toHaveAttribute("data-compact")
  })

  it("draws nothing on a desktop, where live status is the status line's", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameAccessory tone="live" meta="Syncing" title="Checking 2 accounts" />
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="accessory"]')).toBeNull()
  })
})

describe("AppFrameScrollEdge", () => {
  it("is decoration: hidden from assistive tech and takes no presses", () => {
    render(<AppFrameScrollEdge edge="bottom" data-testid="edge" />)
    expect(screen.getByTestId("edge")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByTestId("edge")).toHaveClass("pointer-events-none")
  })
})
