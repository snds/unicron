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
  AppFramePeek,
  AppFrameReading,
  AppFrameSidePanel,
  AppFrameStatusLine,
  FoldPanes,
} from "./app-frame"
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
  it("is a sheet from the side when the detail would keep less than 960 beside it", () => {
    setViewport(1440, 900)
    render(
      <AppFrame>
        <AppFrameMain>
          <AppFrameDetail aria-label="Message">The message</AppFrameDetail>
          <AppFrameSidePanel open onOpenChange={() => {}} title="Mira Chen">
            The sender
          </AppFrameSidePanel>
        </AppFrameMain>
      </AppFrame>
    )
    // jsdom lays nothing out, so the detail measures 0 wide: no room for a column.
    expect(screen.getByRole("dialog", { name: "Mira Chen" })).toHaveTextContent("The sender")
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
    render(<Field aria-label="field" />)
    const { className } = screen.getByLabelText("field")
    expect(className).toContain("text-base")
    expect(className).toContain("pointer-fine:md:text-sm")
    expect(className).not.toMatch(/(^|\s)md:text-sm/)
  })
})
