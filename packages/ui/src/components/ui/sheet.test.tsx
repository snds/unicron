import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AdaptiveSheetContent, Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetHeaderActions, SheetTitle } from "./sheet"

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
        <Sheet open modal={false} disablePointerDismissal onOpenChange={onOpenChange}>
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

  it("keeps the header clear of the close button, and only when there is one", () => {
    const { rerender } = render(
      <Sheet open>
        <SheetContent>{header}</SheetContent>
      </Sheet>
    )
    expect(popup().className).toContain("[&>[data-slot=sheet-header]]:pr-12")
    rerender(
      <Sheet open>
        <SheetContent showCloseButton={false}>{header}</SheetContent>
      </Sheet>
    )
    expect(popup().className).not.toContain("[&>[data-slot=sheet-header]]:pr-12")
  })

  it("wraps long titles and puts footer actions in a row from sm up", () => {
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
    expect(document.querySelector('[data-slot="sheet-footer"]')?.className).toContain("sm:flex-row")
  })
})

// A sheet's own actions sat in the header's flow at a larger size than the close button, so the
// two icons didn't line up (snds/synapse UI review round 2, F16).
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
    expect(actions.className).toContain("top-3")
    expect(actions.className).toContain("right-11")
    const close = document.querySelector('[data-slot="sheet-close"]') as HTMLElement
    expect(close.className).toContain("top-3")
    expect(popup().className).toContain("has-[[data-slot=sheet-header-actions]]:[&>[data-slot=sheet-header]]:pr-20")
  })
})
