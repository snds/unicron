import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Command, CommandDialog, CommandInput, CommandList } from "./command"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./dialog"

// The strip a desktop app renders so its window stays draggable while a dialog is open (issue #7).
const strip = <div aria-hidden data-testid="drag-strip" className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />

const overlay = () => document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement
const popup = () => document.querySelector('[data-slot="dialog-content"]') as HTMLElement

function Subject({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent beforeContent={strip}>
        <DialogHeader>
          <DialogTitle>Delete thread?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

describe("DialogContent beforeContent", () => {
  it("renders the slot between the backdrop and the popup, in document order", () => {
    render(<Subject />)
    const slot = screen.getByTestId("drag-strip")
    expect(slot).toHaveAttribute("data-tauri-drag-region", "deep")
    // Backdrop → slot → popup: at the same z-index the later element paints on top.
    expect(overlay().compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(popup()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Outside the popup, so it is not part of the dialog's content.
    expect(popup().contains(slot)).toBe(false)
    expect(slot.parentElement).toBe(popup().parentElement)
  })

  it("a press on the slot does not dismiss; a press on the backdrop does", () => {
    const onOpenChange = vi.fn()
    render(<Subject onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByTestId("drag-strip"))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("renders nothing extra when the slot is empty", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Plain</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    // Between the backdrop and the popup there is only Base UI's own focus guard.
    const children = Array.from(popup().parentElement!.children)
    const between = children.slice(children.indexOf(overlay()) + 1, children.indexOf(popup()))
    expect(between.every((el) => el.hasAttribute("data-base-ui-focus-guard"))).toBe(true)
  })

  it("CommandDialog threads the slot through to its DialogContent", () => {
    render(
      <CommandDialog open beforeContent={strip}>
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    const slot = screen.getByTestId("drag-strip")
    expect(overlay().compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(popup()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(popup().contains(slot)).toBe(false)
  })
})
