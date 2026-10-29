import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fireEvent, render, screen } from "@testing-library/react"
import type * as React from "react"
import { describe, expect, it, vi } from "vitest"

import { Command, CommandDialog, CommandInput, CommandList } from "./command"
import { Dialog, DialogAction, DialogActions, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./dialog"

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

describe("DialogContent size", () => {
  // Each size is a range between two tokens. The min is the fixed width the size had up to 0.15
  // (PR #14's mapping), pinned here so no dialog an app already has gets narrower.
  const tokens = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component.json"), "utf8")
  )
  it.each([
    ["xs", "16rem", "20rem"],
    ["sm", "24rem", "28rem"],
    ["md", "28rem", "36rem"],
    ["lg", "32rem", "42rem"],
    ["xl", "42rem", "56rem"],
    ["2xl", "48rem", "64rem"],
  ] as const)("%s fits its content between %s and %s", (size, min, max) => {
    render(
      <Dialog open>
        <DialogContent size={size}>
          <DialogTitle>Sized</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const cls = popup().className.split(" ")
    expect(popup()).toHaveAttribute("data-size", size)
    expect(cls).toContain(`sm:[--dialog-min-width:var(--c-dialog-${size}-min-width)]`)
    expect(cls).toContain(`sm:[--dialog-max-width:var(--c-dialog-${size}-max-width)]`)
    expect(cls).toContain("sm:w-max")
    expect(tokens.dialog[size]["min-width"].$value).toBe(min)
    expect(tokens.dialog[size]["max-width"].$value).toBe(max)
  })

  it("is sm by default", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Default</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(popup()).toHaveAttribute("data-size", "sm")
  })

  it("CommandDialog keeps a fixed width, the size's min, so it doesn't resize as results change", () => {
    render(
      <CommandDialog open size="lg">
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    const cls = popup().className.split(" ")
    expect(cls).toContain("sm:w-(--dialog-min-width)")
    expect(cls).not.toContain("sm:w-max")
  })
})

describe("Dialog closeOnOutsideClick", () => {
  function Editor(props: React.ComponentProps<typeof Dialog>) {
    return (
      <Dialog open {...props}>
        <DialogContent>
          <DialogTitle>Edit note</DialogTitle>
        </DialogContent>
      </Dialog>
    )
  }

  it("closes on a backdrop click by default", () => {
    const onOpenChange = vi.fn()
    render(<Editor onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("stays open on a backdrop click when turned off (unsaved work, a destructive step)", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick={false} onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("still closes on Escape when turned off", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick={false} onOpenChange={onOpenChange} />)
    fireEvent.keyDown(popup(), { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("Base UI's disablePointerDismissal, if passed, wins", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick disablePointerDismissal onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("CommandDialog passes it through", () => {
    const onOpenChange = vi.fn()
    render(
      <CommandDialog open closeOnOutsideClick={false} onOpenChange={onOpenChange}>
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("DialogFooter sticky", () => {
  const footer = () => document.querySelector('[data-slot="dialog-footer"]') as HTMLElement

  it("is not sticky by default", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Plain</DialogTitle>
          <DialogFooter>Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    expect(footer()).not.toHaveAttribute("data-sticky")
    expect(footer().className.split(" ")).not.toContain("sticky")
  })

  it("pins to the popup's bottom edge, over its padding, and is opaque", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Long</DialogTitle>
          <DialogFooter sticky>Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    const cls = footer().className.split(" ")
    expect(footer()).toHaveAttribute("data-sticky", "true")
    expect(cls).toEqual(expect.arrayContaining(["sticky", "-bottom-4", "bg-popover"]))
  })

  it("DialogActions takes it too", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Long</DialogTitle>
          <DialogActions sticky>
            <DialogAction>Save</DialogAction>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
    expect(footer()).toHaveAttribute("data-sticky", "true")
  })
})
