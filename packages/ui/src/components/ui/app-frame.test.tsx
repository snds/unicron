import { readFileSync } from "node:fs"
import { join } from "node:path"
import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"
import {
  AppFrame,
  AppFrameColumn,
  AppFrameCompanion,
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFramePeek,
  AppFrameReading,
  AppFrameSidePanel,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameTopBar,
  FoldPanes,
  StatusItem,
  shrinkFor,
} from "./app-frame"
import { Accessory } from "./accessory"
import { NavItem, NavSection } from "./nav-item"
import { Input } from "./input"
import { Textarea } from "./textarea"
import { SHORT_HEIGHT } from "../use-viewport"

const css = readFileSync(join(__dirname, "../../styles/index.css"), "utf8")

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

describe("AppFrameCompanion (was AppFrameDetail)", () => {
  const stubFold = (matchesBook: boolean, sizes: number[]) => {
    window.matchMedia = ((query: string) => ({
      matches: matchesBook && query.includes("horizontal-viewport-segments"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia
    ;(window as unknown as { viewport?: { segments: { width: number }[] } }).viewport = { segments: sizes.map((width) => ({ width })) }
  }
  const mounts = vi.fn()
  function Content() {
    React.useEffect(() => {
      mounts()
    }, [])
    return <p>The content</p>
  }
  const show = (open: boolean, onOpenChange = () => {}) => (
    <AppFrame>
      <AppFrameMain>
        <AppFrameCompanion open={open} onOpenChange={onOpenChange} title="Details" detail={<p>The details</p>}>
          <Content />
        </AppFrameCompanion>
      </AppFrameMain>
    </AppFrame>
  )

  beforeEach(() => {
    mounts.mockClear()
    stubFold(false, [])
  })
  // The fold stub replaces matchMedia for the whole file: leave it flat for the tests after these.
  afterAll(() => stubFold(false, []))

  it("sits beside the content on a laptop, and goes when closed, leaving the content mounted", () => {
    setViewport(1440, 900)
    const { rerender } = render(show(false))
    expect(screen.queryByText("The details")).not.toBeInTheDocument()
    rerender(show(true))
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.getByRole("separator", { name: "Resize Details" })).toBeInTheDocument()
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    rerender(show(false))
    expect(screen.queryByText("The details")).not.toBeInTheDocument()
    expect(screen.getByText("The content")).toBeInTheDocument()
    expect(mounts).toHaveBeenCalledTimes(1)
  })

  it("closes from its own button", () => {
    setViewport(1440, 900)
    const onOpenChange = vi.fn()
    render(show(true, onOpenChange))
    fireEvent.click(screen.getByRole("button", { name: "Close Details" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it.each([
    ["a phone", 390, 844],
    ["a phone on its side", 844, 390],
    ["an iPad upright", 820, 1180],
  ])("slides over on %s", (_, width, height) => {
    setViewport(width, height)
    render(show(true))
    expect(screen.getByRole("dialog", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
  })

  it("takes the far side of a book-pose fold, whether or not it's open, with nothing to close", () => {
    stubFold(true, [330, 330])
    setViewport(669, 867)
    render(show(false))
    expect(screen.getByRole("complementary", { name: "Details" })).toHaveTextContent("The details")
    expect(screen.queryByRole("button", { name: "Close Details" })).not.toBeInTheDocument()
    expect(screen.queryByRole("separator")).not.toBeInTheDocument()
  })
})

describe("AppFrame", () => {
  it("says which shell it draws, and can be pinned to one", () => {
    setViewport(390, 844)
    const { rerender } = render(<AppFrame data-testid="frame" />)
    expect(screen.getByTestId("frame")).toHaveAttribute("data-layout", "phone")
    rerender(<AppFrame data-testid="frame" layout="expanded" />)
    expect(screen.getByTestId("frame")).toHaveAttribute("data-layout", "expanded")
  })

  it("is the screen's frame, or a contained box that leaves the page alone", () => {
    render(
      <>
        <AppFrame data-testid="screen" />
        <AppFrame data-testid="box" contained layout="phone" />
      </>
    )
    expect(screen.getByTestId("screen")).toHaveAttribute("data-slot", "app-frame")
    expect(screen.getByTestId("box")).toHaveAttribute("data-slot", "app-frame-contained")
    expect(screen.getByTestId("box").style.getPropertyValue("--viewport-page-height")).toBe("")
  })

  it("puts the page back if a rotation left it scrolled", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
    setViewport(844, 390)
    render(<AppFrame />)
    Object.defineProperty(window, "scrollY", { configurable: true, value: 72 })
    setViewport(390, 844)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 })
    scrollTo.mockRestore()
  })

  it("uses the measured height, because 100vh can run off the screen in a home-screen app", () => {
    setViewport(390, 793)
    render(<AppFrame data-testid="frame" />)
    expect(screen.getByTestId("frame").style.getPropertyValue("--viewport-page-height")).toBe("793px")
    expect(css).not.toMatch(/--app-frame-height:\s*100vh/)
  })

  it("says where the nav goes", () => {
    setViewport(844, 390)
    render(<AppFrame data-testid="frame" />)
    expect(screen.getByTestId("frame")).toHaveAttribute("data-nav", "rail")
  })

  it("has no keyboard state when no keyboard is up", () => {
    setViewport(390, 844)
    render(<AppFrame data-testid="frame" />)
    const frame = screen.getByTestId("frame")
    expect(frame).not.toHaveAttribute("data-keyboard")
    expect(frame).toHaveAttribute("data-room", "full")
  })
})

describe("list and detail (contract 5.2)", () => {
  const show = (open: boolean, onBack = () => {}) => (
    <AppFrame>
      <AppFrameStatusLine crumbs={[{ label: "Mail", href: "#mail" }, { label: "Inbox" }]} />
      <AppFrameMain>
        <AppFrameList aria-label="Inbox">The list</AppFrameList>
        <AppFrameDetail open={open} onBack={onBack} aria-label="Message">
          The message
        </AppFrameDetail>
      </AppFrameMain>
    </AppFrame>
  )
  // A column out of reach is hidden from assistive tech, so it has no role to find it by.
  const list = () => document.querySelector('[data-slot="app-frame-list"]') as HTMLElement
  const detail = () => document.querySelector('[data-slot="app-frame-detail"]') as HTMLElement

  it("stand side by side at the expanded width, the detail beside even with nothing open", () => {
    setViewport(1440, 900)
    render(show(false))
    expect(list()).toHaveAttribute("data-shown")
    expect(detail()).toHaveAttribute("data-shown")
    expect(list()).not.toHaveAttribute("inert")
    // The list is 432 (+12 to the rule) at 1280 and up; the detail fills and draws the rule.
    expect(list().className).toContain("w-[calc(var(--c-app-frame-list)+--spacing(3))]")
    expect(detail().className).toContain("[[data-column][data-shown]+&]:rule-l")
    expect(detail().className).toContain("[[data-column][data-shown]+&]:ps-6")
  })

  it("narrows the list to 320 in an expanded window under 1280 (Lockdown 4.0)", () => {
    setViewport(1180, 820)
    render(show(false))
    expect(list().className).toContain("w-[calc(var(--c-app-frame-list-compact)+--spacing(3))]")
  })

  it("keeps 16 of the page gutter past the content line on the last content column, so a row action that reaches past the row and its focus ring are not cut", () => {
    setViewport(1440, 900)
    render(show(false))
    // Taken with a negative margin and given back as padding: the content is as wide as before.
    expect(detail()).toHaveClass("last:-me-4", "last:pe-4")
    // A list is a side column: it keeps its own 12 to the rule and takes no more.
    expect(list()).not.toHaveClass("last:-me-4")
    expect(list()).not.toHaveClass("last:pe-4")
  })

  it("adds the same 16 to a narrow detail's width when it is the last column, so its content stays 534", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameMain>
          <AppFrameList size="fill" aria-label="Tasks">The list</AppFrameList>
          <AppFrameDetail size="narrow" aria-label="Task">The task</AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    expect(detail()).toHaveClass(
      "w-[calc(var(--c-app-frame-detail-narrow)+--spacing(6))]",
      "last:w-[calc(var(--c-app-frame-detail-narrow)+--spacing(10))]",
      "last:-me-4",
      "last:pe-4"
    )
  })

  it("a column that is not shown keeps no room (it is laid over the list, out of reach)", () => {
    setViewport(820, 1180)
    render(show(false))
    expect(detail()).not.toHaveAttribute("data-shown")
    expect(detail()).not.toHaveClass("last:-me-4")
  })

  it.each([
    ["medium", 820, 1180],
    ["a phone", 390, 844],
  ])("push the detail over the list at %s width, keeping the list mounted but out of reach", (_, w, h) => {
    setViewport(w, h)
    const { rerender } = render(show(false))
    expect(list()).toHaveAttribute("data-shown")
    expect(detail()).not.toHaveAttribute("data-shown")
    expect(detail()).toHaveAttribute("inert")
    rerender(show(true))
    expect(list()).not.toHaveAttribute("data-shown")
    expect(list()).toHaveAttribute("inert")
    expect(list()).toHaveTextContent("The list")
    expect(detail()).toHaveAttribute("data-shown")
    expect(detail()).toHaveAttribute("data-pushed")
  })

  it("puts the way back in the status line's leading slot at medium width (decisions §14)", () => {
    setViewport(820, 1180)
    const onBack = vi.fn()
    const { rerender } = render(show(false, onBack))
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
    rerender(show(true, onBack))
    fireEvent.click(screen.getByRole("button", { name: "Back" }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  // Warpcore has no status line: its top bar draws the same way back (contract 5.1b #4,
  // decisions §14). Without it a pushed detail at medium width had no way back at all.
  it("puts the way back in the top bar's leading slot at medium width, before the lockup", () => {
    setViewport(768, 1024)
    const onBack = vi.fn()
    const warpcore = (open: boolean, back?: false) => (
      <AppFrame>
        <AppFrameTopBar lockup={<span data-testid="lockup">Warpcore</span>} back={back} />
        <AppFrameMain>
          <AppFrameList aria-label="Tasks">The list</AppFrameList>
          <AppFrameDetail open={open} onBack={onBack} aria-label="Task">
            The task
          </AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    const { rerender } = render(warpcore(false))
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
    rerender(warpcore(true))
    const back = screen.getByRole("button", { name: "Back" })
    expect(back.closest('[data-slot="app-frame-top-bar-back"]')).not.toBeNull()
    // Before the lockup, in the bar.
    expect(back.compareDocumentPosition(screen.getByTestId("lockup")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    fireEvent.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
    // `back={false}` keeps the slot empty (an app that draws its own).
    rerender(warpcore(true, false))
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument()
  })

  it("hides the list for reading at length (focus) at the expanded width", () => {
    setViewport(1440, 900)
    render(
      <AppFrame focus>
        <AppFrameMain>
          <AppFrameList aria-label="Notes">The list</AppFrameList>
          <AppFrameDetail aria-label="Note">The note</AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    expect(document.querySelector('[data-slot="app-frame-list"]')).toHaveAttribute("inert")
    expect(screen.queryByRole("region", { name: "Notes" })).not.toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Note" })).toHaveAttribute("data-shown")
  })

  it("names the crumbs as a breadcrumb, every one a link but the last", () => {
    setViewport(1440, 900)
    render(show(false))
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(crumbs).toContainElement(screen.getByRole("link", { name: "Mail" }))
    expect(screen.getByText("Inbox")).toHaveAttribute("aria-current", "page")
    expect(screen.queryByRole("link", { name: "Inbox" })).not.toBeInTheDocument()
  })
})

describe("columns that are always the screen", () => {
  it("fills, and centres a reading column of 720 at most", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameMain>
          <AppFrameColumn reading aria-label="Chat">
            The conversation
          </AppFrameColumn>
        </AppFrameMain>
      </AppFrame>
    )
    const column = screen.getByRole("region", { name: "Chat" })
    expect(column).toHaveAttribute("data-shown")
    expect(column.querySelector('[data-slot="app-frame-reading"]')!.className).toContain("max-w-(--c-app-frame-reading)")
    // The only column is the last one: it keeps the room past the content line too.
    expect(column).toHaveClass("last:-me-4", "last:pe-4")
  })

  it("keeps the phone's 16 from the edges for content that is not a full-bleed row", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameInset data-testid="inset" />
        <AppFrameReading data-testid="reading" />
      </AppFrame>
    )
    expect(screen.getByTestId("inset")).toHaveClass("px-4")
    expect(screen.getByTestId("reading")).toHaveClass("px-4")
  })

  it("keeps the inset once: a page head or an inset inside one adds none", () => {
    setViewport(390, 844)
    render(
      <AppFrame>
        <AppFrameInset fill data-testid="outer">
          <AppFrameInset data-testid="inner" />
          <AppFramePageHead title="Steam" />
        </AppFrameInset>
      </AppFrame>
    )
    expect(screen.getByTestId("outer")).toHaveClass("px-4", "flex", "min-h-full", "flex-col")
    expect(screen.getByTestId("inner")).not.toHaveClass("px-4")
    expect(document.querySelector('[data-slot="app-frame-page-head"]')).not.toHaveClass("px-4")
  })

  // rules.md 5.4: never more space inside a group than between two. The head always added 32 under
  // itself on a desktop; in a stack that stacked on the stack's own gap (title to summary 64, the
  // other blocks 32 apart), and an app could only undo it with a class.
  describe("AppFramePageHead: the space under it is the frame's to set", () => {
    const head = () => document.querySelector('[data-slot="app-frame-page-head"]') as HTMLElement
    const classes = () => head().className.split(/\s+/)

    it("md (the default): 32 under it on a desktop, 16 on a phone", () => {
      setViewport(1440, 900)
      const { unmount } = render(
        <AppFrame>
          <AppFramePageHead title="Today" />
        </AppFrame>
      )
      expect(head()).toHaveAttribute("data-gap", "md")
      expect(classes()).toContain("pb-8")
      unmount()
      setViewport(390, 844)
      render(
        <AppFrame>
          <AppFramePageHead title="Today" />
        </AppFrame>
      )
      expect(classes()).toContain("pb-4")
      expect(classes()).not.toContain("pb-8")
    })

    it("none: no space, for a head that is one block of a stack; sm: 16", () => {
      setViewport(1440, 900)
      const { rerender } = render(
        <AppFrame>
          <AppFramePageHead title="Cabin for the 20th, confirmed" gap="none" />
        </AppFrame>
      )
      expect(head()).toHaveAttribute("data-gap", "none")
      expect(classes().some((c) => /^pb-/.test(c))).toBe(false)
      rerender(
        <AppFrame>
          <AppFramePageHead title="Steam" gap="sm" />
        </AppFrame>
      )
      expect(classes()).toContain("pb-4")
      expect(classes()).not.toContain("pb-8")
    })

    it("below: a chip row in the head's own group, 16 under the title; 28 over the list on a desktop, 16 on a phone", () => {
      setViewport(1440, 900)
      const { unmount } = render(
        <AppFrame>
          <AppFramePageHead title="Tasks" below={<div data-testid="chips">All 12</div>} />
        </AppFrame>
      )
      const slot = () => document.querySelector('[data-slot="app-frame-page-head-below"]') as HTMLElement
      expect(head()).toContainElement(screen.getByTestId("chips"))
      expect(slot()).toHaveClass("mt-4")
      expect(classes()).toContain("pb-7")
      expect(classes()).not.toContain("pb-8")
      unmount()
      setViewport(390, 844)
      render(
        <AppFrame>
          <AppFramePageHead title="Tasks" below={<div data-testid="chips">All 12</div>} />
        </AppFrame>
      )
      expect(slot()).toHaveClass("mt-4")
      // On a phone the head keeps the frame's 16 at its sides, and the chip row with it.
      expect(classes()).toEqual(expect.arrayContaining(["pb-4", "px-4"]))
    })
  })
})

describe("AppFramePeek (Synapse Y-03)", () => {
  it("lays over the content with no scrim, takes focus to its heading, and closes on Esc", () => {
    setViewport(1440, 900)
    const onOpenChange = vi.fn()
    render(
      <AppFrame>
        <AppFrameMain>
          <AppFrameColumn aria-label="Overview">The page</AppFrameColumn>
          <AppFramePeek open onOpenChange={onOpenChange} title="A knowledge note links to a missing file" overline="Check // K-14">
            The check
          </AppFramePeek>
        </AppFrameMain>
      </AppFrame>
    )
    const peek = screen.getByRole("complementary", { name: "A knowledge note links to a missing file" })
    expect(peek).not.toHaveAttribute("aria-modal")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(document.activeElement).toBe(screen.getByRole("heading", { name: "A knowledge note links to a missing file" }))
    // The page under it stays usable.
    expect(screen.getByRole("region", { name: "Overview" })).not.toHaveAttribute("inert")
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("closes from its own button", () => {
    setViewport(1440, 900)
    const onOpenChange = vi.fn()
    render(
      <AppFrame>
        <AppFrameMain>
          <AppFramePeek open onOpenChange={onOpenChange} title="Run 0412" />
        </AppFrameMain>
      </AppFrame>
    )
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe("AppFrameSidePanel", () => {
  // jsdom lays nothing out, so the detail measures 0 wide: no room for a column. The panel is a sheet.
  const panel = (open: boolean, onOpenChange: (open: boolean) => void = () => {}) => (
    <AppFrame>
      <AppFrameMain>
        <AppFrameDetail aria-label="Message">The message</AppFrameDetail>
        <AppFrameSidePanel open={open} onOpenChange={onOpenChange} title="Mira Chen">
          The sender
        </AppFrameSidePanel>
      </AppFrameMain>
    </AppFrame>
  )

  it("is a sheet from the side when the detail would keep less than 960 beside it, opened by a press", () => {
    setViewport(1440, 900)
    const { rerender } = render(panel(false))
    expect(screen.queryByRole("dialog", { name: "Mira Chen" })).not.toBeInTheDocument()
    // The app's button turns `open` on while the panel is a sheet: that is a press.
    rerender(panel(true))
    const sheet = screen.getByRole("dialog", { name: "Mira Chen" })
    expect(sheet).toHaveTextContent("The sender")
    // Its content keeps the sheet's inset: it sits in the SheetBody.
    expect(sheet.querySelector('[data-slot="sheet-body"] [data-slot="app-frame-side-panel"]')).toHaveTextContent("The sender")
    rerender(panel(false))
    expect(screen.queryByRole("dialog", { name: "Mira Chen" })).not.toBeInTheDocument()
  })

  it("a standing column that has no room does not open as a sheet by itself: `open` is handed back", () => {
    setViewport(1440, 900)
    const onOpenChange = vi.fn()
    // `open` from the start (a column that stands by default), with no room for it.
    const { rerender } = render(panel(true, onOpenChange))
    expect(screen.queryByRole("dialog", { name: "Mira Chen" })).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    // The app follows; a later press then opens the sheet.
    rerender(panel(false, onOpenChange))
    rerender(panel(true, onOpenChange))
    expect(screen.getByRole("dialog", { name: "Mira Chen" })).toBeInTheDocument()
    expect(onOpenChange).toHaveBeenCalledTimes(1)
  })

  it("starts closed on a phone too", () => {
    setViewport(390, 844)
    const onOpenChange = vi.fn()
    render(panel(true, onOpenChange))
    expect(screen.queryByRole("dialog", { name: "Mira Chen" })).not.toBeInTheDocument()
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })
})

describe("FoldPanes", () => {
  it("says how it splits", () => {
    render(<FoldPanes split="rows" data-testid="panes" />)
    expect(screen.getByTestId("panes")).toHaveAttribute("data-split", "rows")
  })
})

describe("the stylesheet", () => {
  it("draws the same line as the hook for a short screen", () => {
    expect(css).toContain("@custom-variant short (@media (orientation: landscape) and (max-height: 479.98px))")
    expect(SHORT_HEIGHT).toBe(480)
  })

  it("stops the page scrolling only under an AppFrame, so other pages keep theirs", () => {
    expect(css).toMatch(/:has\(\[data-slot="app-frame"\]\)/)
  })
})

// iOS zooms the whole page into a focused field under 16px, and doesn't zoom back out.
describe("text fields on touch", () => {
  it.each([
    ["Input", Input],
    ["Textarea", Textarea],
  ] as const)("%s only drops under 16px with a mouse", (_, Field) => {
    // 1.0: the value is the `ui` role (15px, Figma 32:48); on a touch screen it is the body size,
    // 16px, so iOS does not zoom into the field when it takes focus.
    render(<Field aria-label="field" />)
    const { className } = screen.getByLabelText("field")
    expect(className).toContain("type-ui")
    expect(className).toContain("pointer-coarse:text-(length:--type-body-size)")
    expect(className).not.toMatch(/(^|\s)md:text-sm/)
  })
})

describe("list + detail shrink order (contract 5.1c C8)", () => {
  const knobs = { sidebarWidth: 204, railWidth: 48, sidebarGap: 24, listMin: 320, gap: 24, detailMin: 480 }

  it("needs list 320 + gap 24 + detail 480 = 824 of content: the sidebar's rail first, then the detail pushed", () => {
    // 1440 and 1280: 48 gutters, the full sidebar, room to spare.
    expect(shrinkFor({ ...knobs, width: 1440, gutter: 48, sidebar: "full" })).toBe("none")
    expect(shrinkFor({ ...knobs, width: 1280, gutter: 48, sidebar: "full" })).toBe("none")
    // Under 1280 the gutters are 24: 1100 − 48 − 228 = 824 still fits; one less does not.
    expect(shrinkFor({ ...knobs, width: 1100, gutter: 24, sidebar: "full" })).toBe("none")
    expect(shrinkFor({ ...knobs, width: 1099, gutter: 24, sidebar: "full" })).toBe("rail")
    expect(shrinkFor({ ...knobs, width: 1024, gutter: 24, sidebar: "full" })).toBe("rail")
    // With the rail, 944 − 48 − 72 = 824 fits; narrower, the detail is pushed.
    expect(shrinkFor({ ...knobs, width: 944, gutter: 24, sidebar: "full" })).toBe("rail")
    expect(shrinkFor({ ...knobs, width: 943, gutter: 24, sidebar: "full" })).toBe("push")
    // Collapsed by choice it is already the rail: nothing to give up but the split.
    expect(shrinkFor({ ...knobs, width: 1000, gutter: 24, sidebar: "rail" })).toBe("none")
    expect(shrinkFor({ ...knobs, width: 943, gutter: 24, sidebar: "rail" })).toBe("push")
    // No sidebar (Warpcore's top bar): only the push is left.
    expect(shrinkFor({ ...knobs, width: 872, gutter: 24, sidebar: "none" })).toBe("none")
    expect(shrinkFor({ ...knobs, width: 871, gutter: 24, sidebar: "none" })).toBe("push")
  })

  it("follows the knobs: a wider least detail moves the lines", () => {
    expect(shrinkFor({ ...knobs, detailMin: 900, width: 1440, gutter: 48, sidebar: "full" })).toBe("rail")
    expect(shrinkFor({ ...knobs, detailMin: 1100, width: 1440, gutter: 48, sidebar: "full" })).toBe("push")
  })

  function Screen({ detail = true }: { detail?: boolean }) {
    return (
      <AppFrame>
        <AppFrameSidebar lockup={<span>Vale</span>}>
          <NavSection title="Mail">
            <NavItem href="#inbox" label="Inbox" icon="email" current />
          </NavSection>
        </AppFrameSidebar>
        <AppFrameMain>
          <AppFrameList aria-label="Inbox">The list</AppFrameList>
          {detail ? <AppFrameDetail aria-label="Message">The message</AppFrameDetail> : null}
        </AppFrameMain>
      </AppFrame>
    )
  }
  const sidebar = () => document.querySelector('nav[data-slot="app-frame-sidebar"]') as HTMLElement
  const frame = () => document.querySelector('[data-slot="app-frame"]') as HTMLElement

  it("in the frame: the full sidebar where there is room; its rail when the list and detail need it; expanding then lays it over as a drawer", () => {
    setViewport(1440, 900)
    const { unmount } = render(<Screen />)
    expect(frame()).not.toHaveAttribute("data-shrink")
    expect(sidebar()).toHaveAttribute("data-state", "expanded")
    unmount()

    setViewport(1050, 800)
    render(<Screen />)
    expect(frame()).toHaveAttribute("data-layout", "expanded")
    expect(frame()).toHaveAttribute("data-shrink", "rail")
    expect(sidebar()).toHaveAttribute("data-state", "rail")
    // The list and the detail still stand side by side.
    expect(document.querySelector('[data-slot="app-frame-detail"]')).toHaveAttribute("data-shown")
    expect(document.querySelector('[data-slot="app-frame-list"]')).toHaveAttribute("data-shown")
    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }))
    expect(screen.getByRole("dialog", { name: "Places" })).toBeInTheDocument()
  })

  it("a screen with no detail keeps the full sidebar at the same width", () => {
    setViewport(1050, 800)
    render(<Screen detail={false} />)
    expect(frame()).not.toHaveAttribute("data-shrink")
    expect(sidebar()).toHaveAttribute("data-state", "expanded")
  })

  it("comes back as the window widens", () => {
    setViewport(1050, 800)
    render(<Screen />)
    expect(sidebar()).toHaveAttribute("data-state", "rail")
    setViewport(1300, 800)
    expect(frame()).not.toHaveAttribute("data-shrink")
    expect(sidebar()).toHaveAttribute("data-state", "expanded")
  })
})

describe("one polite region per frame (contract 5.1c C7)", () => {
  it("status items and strips say their sentence in the frame's one region, not one each", async () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameStatusLine crumbs={[{ label: "Mail" }]}>
          <StatusItem tone="live" mark="square" text="Sending" countdown={8} announce="Sending. 10 seconds to undo." />
          <StatusItem text="Synced // 09:16" />
        </AppFrameStatusLine>
        <AppFrameMain>
          <AppFrameColumn>
            <Accessory tone="live" meta="Checking" title="Checking 2 accounts" />
          </AppFrameColumn>
        </AppFrameMain>
      </AppFrame>
    )
    const regions = document.querySelectorAll('[role="status"], [aria-live]')
    expect(regions).toHaveLength(1)
    const region = regions[0]
    expect(region).toHaveAttribute("data-slot", "app-frame-announcer")
    expect(region).toHaveAttribute("aria-live", "polite")
    expect(region.className).toContain("sr-only")
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0))
    })
    // The live item and the strip are news; the screen's quiet fact is not said on arrival.
    expect(region).toHaveTextContent("Sending. 10 seconds to undo. Checking 2 accounts")
    expect(region).not.toHaveTextContent("Synced")
  })

  it("a ticking countdown is hidden, and the sentence is said again only when it changes", async () => {
    setViewport(1440, 900)
    function Line({ left, announce }: { left: number; announce: string }) {
      return (
        <AppFrame>
          <AppFrameStatusLine>
            <StatusItem tone="live" text="Sending" countdown={left} announce={announce} />
          </AppFrameStatusLine>
        </AppFrame>
      )
    }
    const { rerender } = render(<Line left={10} announce="Sending. 10 seconds to undo." />)
    const tick = async () =>
      act(async () => {
        await new Promise((r) => setTimeout(r, 0))
      })
    await tick()
    const region = document.querySelector('[data-slot="app-frame-announcer"]')!
    expect(region).toHaveTextContent("Sending. 10 seconds to undo.")
    expect(document.querySelector('[data-slot="status-item-countdown"]')).toHaveAttribute("aria-hidden", "true")
    rerender(<Line left={9} announce="Sending. 10 seconds to undo." />)
    await tick()
    expect(region).toHaveTextContent(/^Sending\. 10 seconds to undo\.$/)
    rerender(<Line left={0} announce="Sent." />)
    await tick()
    expect(region).toHaveTextContent("Sent.")
  })
})
