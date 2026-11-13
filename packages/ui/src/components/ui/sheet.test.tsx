import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  AdaptiveSheetContent,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetHeaderActions,
  SheetOverline,
  SheetTitle,
} from "./sheet"

// The strip a desktop app renders so its window stays draggable while a sheet is open (issue #7).
const strip = <div aria-hidden data-testid="drag-strip" className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />

const overlay = () => document.querySelector('[data-slot="sheet-overlay"]') as HTMLElement
const popup = () => document.querySelector('[data-slot="sheet-content"]') as HTMLElement

const header = (
  <SheetHeader>
    <SheetTitle>Details</SheetTitle>
    <SheetDescription>A side panel for secondary content.</SheetDescription>
  </SheetHeader>
)

function expectBetweenBackdropAndPopup() {
  const slot = screen.getByTestId("drag-strip")
  expect(overlay().compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(slot.compareDocumentPosition(popup()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  expect(popup().contains(slot)).toBe(false)
  expect(slot.parentElement).toBe(popup().parentElement)
}

describe("SheetContent beforeContent", () => {
  it("renders the slot between the backdrop and the popup, in document order", () => {
    render(
      <Sheet open>
        <SheetContent beforeContent={strip}>{header}</SheetContent>
      </Sheet>
    )
    expectBetweenBackdropAndPopup()
  })

  it("a press on the slot does not dismiss; a press on the backdrop does", () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent beforeContent={strip}>{header}</SheetContent>
      </Sheet>
    )
    fireEvent.click(screen.getByTestId("drag-strip"))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("AdaptiveSheetContent takes the same slot", () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <AdaptiveSheetContent beforeContent={strip}>{header}</AdaptiveSheetContent>
      </Sheet>
    )
    expectBetweenBackdropAndPopup()
    fireEvent.click(screen.getByTestId("drag-strip"))
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("SheetContent backdrop", () => {
  it("draws the backdrop by default", () => {
    render(
      <Sheet open>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    expect(overlay()).not.toBeNull()
  })

  it("a detail sheet beside a list leaves it out, and a press outside keeps it open", () => {
    const onOpenChange = vi.fn()
    render(
      <>
        <button type="button">Another row</button>
        <Sheet open modal={false} closeOnOutsideClick={false} onOpenChange={onOpenChange}>
          <SheetContent backdrop={false}>{header}</SheetContent>
        </Sheet>
      </>
    )
    expect(overlay()).toBeNull()
    expect(popup()).not.toBeNull()
    fireEvent.pointerDown(screen.getByText("Another row"))
    fireEvent.click(screen.getByText("Another row"))
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("SheetContent size and anatomy", () => {
  it("is sm by default and takes the dialog's sizes", () => {
    const { rerender } = render(
      <Sheet open>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    expect(popup().className).toContain("data-[side=right]:sm:max-w-sm")
    rerender(
      <Sheet open>
        <SheetContent size="xl">{header}</SheetContent>
      </Sheet>
    )
    expect(popup().className).toContain("data-[side=right]:sm:max-w-2xl")
    expect(popup().className).not.toContain("data-[side=right]:sm:max-w-sm")
  })

  it("keeps the header clear of the close button (16 + 48 + 12), and only when there is one", () => {
    const { rerender } = render(
      <Sheet open>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    const headerEl = () => document.querySelector('[data-slot="sheet-header"]') as HTMLElement
    expect(headerEl().className.split(" ")).toContain("pr-19")
    rerender(
      <Sheet open>
        <SheetContent showCloseButton={false}>{header}</SheetContent>
      </Sheet>
    )
    expect(headerEl().className.split(" ")).not.toContain("pr-19")
  })

  it("wraps long titles; footer actions sit at the right of a side sheet and share the width of a bottom one", () => {
    render(
      <Sheet open>
        <SheetContent>
          {header}
          <SheetFooter>
            <button type="button">Accept</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
    expect(document.querySelector('[data-slot="sheet-title"]')?.className).toContain("break-words")
    const footer = document.querySelector('[data-slot="sheet-footer"]') as HTMLElement
    expect(footer.className.split(" ")).toEqual(
      expect.arrayContaining(["flex", "justify-end", "gap-4", "in-data-[side=bottom]:*:flex-auto", "in-data-[side=adaptive]:max-sm:*:flex-auto"])
    )
  })
})

// A sheet's own actions sat in the header's flow at a larger size than the close button, so the
// two icons didn't line up (snds/synapse UI review round 2, F16). Since 2026-11 both are 48.
describe("SheetHeaderActions", () => {
  it("sits beside the close button at its top, and the header keeps clear of both", () => {
    render(
      <Sheet open>
        <SheetContent>
          <SheetHeaderActions data-testid="actions" />
          {header}
        </SheetContent>
      </Sheet>
    )
    const actions = screen.getByTestId("actions")
    expect(actions.getAttribute("data-slot")).toBe("sheet-header-actions")
    const cls = actions.className.split(" ")
    // 16 + the 48 close + 8 from the right; the close's own top (16, or 20 under a grabber).
    expect(cls).toEqual(expect.arrayContaining(["top-4", "right-18", "in-data-[side=bottom]:top-5"]))
    const anchor = (document.querySelector('[data-slot="sheet-close"]') as HTMLElement).parentElement as HTMLElement
    expect(anchor.className.split(" ")).toEqual(expect.arrayContaining(["top-4", "right-4", "in-data-[side=bottom]:top-5"]))
    expect((document.querySelector('[data-slot="sheet-header"]') as HTMLElement).className).toContain(
      "in-[[data-slot=sheet-content]:has([data-slot=sheet-header-actions])]:pr-33"
    )
  })
})

describe("Sheet closeOnOutsideClick", () => {
  it("closes on a backdrop click by default", () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("stays open on a backdrop click when turned off", () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open closeOnOutsideClick={false} onOpenChange={onOpenChange}>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("SheetFooter sticky", () => {
  const footer = () => document.querySelector('[data-slot="sheet-footer"]') as HTMLElement

  it("is not sticky by default", () => {
    render(
      <Sheet open>
        <SheetContent>
          {header}
          <SheetFooter>Done</SheetFooter>
        </SheetContent>
      </Sheet>
    )
    expect(footer()).not.toHaveAttribute("data-sticky")
    expect(footer().className.split(" ")).not.toContain("sticky")
  })

  it("pins to the bottom of what scrolls around it, and is opaque", () => {
    render(
      <Sheet open>
        <AdaptiveSheetContent>
          {header}
          <SheetFooter sticky>Done</SheetFooter>
        </AdaptiveSheetContent>
      </Sheet>
    )
    expect(footer()).toHaveAttribute("data-sticky", "true")
    expect(footer().className.split(" ")).toEqual(expect.arrayContaining(["sticky", "bottom-0", "bg-surface-raised", "rule-t"]))
  })
})

describe("Sheet in the 2026-11 look (Figma 32:122 Sheet Header; Vale 05, Lockdown 11)", () => {
  function Review({ side = "bottom", height, onOpenChange }: { side?: "bottom" | "right"; height?: "content" | "full"; onOpenChange?: (open: boolean) => void }) {
    return (
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent side={side} height={height}>
          <SheetHeader>
            <SheetOverline>Lockdown // sign-in request</SheetOverline>
            <SheetTitle>Review sign-in</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <p>Not you? Deny, and Lockdown locks this login until you change the password.</p>
          </SheetBody>
          <SheetFooter>
            <button type="button">Deny</button>
            <button type="button">Approve with Face ID</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )
  }

  it("is solid and square: the raised surface Figma's sheets are drawn in, a rule on the edge that faces the page, no shadow", () => {
    render(<Review />)
    const cls = popup().className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-surface-raised", "data-[side=bottom]:rule-t", "data-[side=right]:rule-l"]))
    expect(cls.some((c) => /shadow|blur|rounded/.test(c))).toBe(false)
    expect(overlay().className.split(" ")).toContain("scrim-sheet")
  })

  it("a bottom sheet draws the 36 x 4 grabber in line-grid-dot, hidden from assistive tech, 8 from the top", () => {
    render(<Review />)
    const grabber = popup().querySelector('[data-slot="sheet-grabber"]') as HTMLElement
    expect(grabber).toHaveAttribute("aria-hidden")
    expect((grabber.firstElementChild as HTMLElement).className.split(" ")).toEqual(expect.arrayContaining(["h-1", "w-9", "bg-(--c-sheet-handle)"]))
    expect(popup().className.split(" ")).toContain("data-[side=bottom]:pt-2")
    // It is decoration here: only AdaptiveSheetContent drags.
    expect(grabber).not.toHaveAttribute("data-draggable")
  })

  it("a side sheet has no grabber", () => {
    render(<Review side="right" />)
    expect(popup().querySelector('[data-slot="sheet-grabber"]')).toBeNull()
  })

  it("the header is the overline over a lead title, 48 tall, beside a neutral FloatButton L that closes it", () => {
    const onOpenChange = vi.fn()
    render(<Review onOpenChange={onOpenChange} />)
    expect(screen.getByRole("dialog", { name: "Review sign-in" })).toBeInTheDocument()
    const headerEl = document.querySelector('[data-slot="sheet-header"]') as HTMLElement
    expect(headerEl.className.split(" ")).toEqual(expect.arrayContaining(["min-h-control", "flex-col", "justify-center", "px-4"]))
    expect(screen.getByText("Lockdown // sign-in request").className.split(" ")).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
    expect(screen.getByRole("heading", { name: "Review sign-in" }).className.split(" ")).toContain("type-lead")
    const close = screen.getByRole("button", { name: "Close" })
    expect(close).toHaveAttribute("data-size", "l")
    expect(close).toHaveAttribute("data-kind", "neutral")
    fireEvent.click(close)
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("starts focus in the content; the close button is last in the tab order", async () => {
    render(<Review />)
    const close = screen.getByRole("button", { name: "Close" })
    const approve = screen.getByRole("button", { name: "Approve with Face ID" })
    expect(approve.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Deny" })).toHaveFocus())
  })

  it("two heights: content (hugs, up to the screen less 48) and full", () => {
    const { rerender } = render(<Review />)
    expect(popup()).toHaveAttribute("data-height", "content")
    expect(popup().className.split(" ")).toContain("data-[side=bottom]:max-h-(--c-sheet-compact-height)")
    rerender(<Review height="full" />)
    expect(popup()).toHaveAttribute("data-height", "full")
    expect(popup().className.split(" ")).toContain("data-[side=bottom]:h-[calc(100dvh-var(--c-dialog-titlebar-inset))]")
  })

  it("the body pads 16 at the sides and scrolls", () => {
    render(<Review />)
    const body = document.querySelector('[data-slot="sheet-body"]') as HTMLElement
    expect(body.className.split(" ")).toEqual(expect.arrayContaining(["px-4", "overflow-y-auto", "min-h-0", "flex-1"]))
  })
})

describe("AdaptiveSheetContent (2026-11)", () => {
  it("keeps its two forms: a bottom sheet below sm with a grabber that drags, a panel on the right from sm up", () => {
    render(
      <Sheet open>
        <AdaptiveSheetContent>{header}</AdaptiveSheetContent>
      </Sheet>
    )
    const cls = popup().className.split(" ")
    expect(popup()).toHaveAttribute("data-side", "adaptive")
    expect(cls).toEqual(
      expect.arrayContaining(["max-sm:bottom-0", "max-sm:rule-t", "sm:right-0", "sm:rule-l", "sm:w-(--c-sheet-regular-width)", "bg-surface-raised"])
    )
    const grabber = popup().querySelector('[data-slot="sheet-grabber"]') as HTMLElement
    expect(grabber).toHaveAttribute("data-draggable")
    expect(grabber.className.split(" ")).toContain("sm:hidden")
  })

  it("a drag down past 120px on the grabber dismisses it; a short one springs back", () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange}>
        <AdaptiveSheetContent>{header}</AdaptiveSheetContent>
      </Sheet>
    )
    const grabber = popup().querySelector('[data-slot="sheet-grabber"]') as HTMLElement
    // jsdom has no layout: give the sheet a height, so 30% of it is 120.
    Object.defineProperty(popup(), "offsetHeight", { configurable: true, value: 400 })
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(grabber, { clientY: 140, pointerId: 1 })
    fireEvent.pointerUp(grabber, { clientY: 140, pointerId: 1 })
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.pointerDown(grabber, { clientY: 100, pointerId: 1 })
    fireEvent.pointerMove(grabber, { clientY: 260, pointerId: 1 })
    fireEvent.pointerUp(grabber, { clientY: 260, pointerId: 1 })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("hugs its content on a phone by default, or takes the whole screen", () => {
    const { rerender } = render(
      <Sheet open>
        <AdaptiveSheetContent>{header}</AdaptiveSheetContent>
      </Sheet>
    )
    expect(popup().className.split(" ")).toContain("max-sm:max-h-(--c-sheet-compact-height)")
    rerender(
      <Sheet open>
        <AdaptiveSheetContent height="full">{header}</AdaptiveSheetContent>
      </Sheet>
    )
    expect(popup().className.split(" ")).toContain("max-sm:h-[calc(100dvh-var(--c-dialog-titlebar-inset))]")
  })

  it("closes from the FloatButton L at the top right in both forms", () => {
    render(
      <Sheet open>
        <AdaptiveSheetContent>{header}</AdaptiveSheetContent>
      </Sheet>
    )
    const close = screen.getByRole("button", { name: "Close" })
    expect(close).toHaveAttribute("data-size", "l")
    expect(close.parentElement!.className.split(" ")).toEqual(expect.arrayContaining(["top-4", "right-4", "in-data-[side=adaptive]:max-sm:top-5"]))
  })
})
