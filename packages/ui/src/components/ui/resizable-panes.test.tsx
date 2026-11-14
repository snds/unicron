import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ResizableHandle, ResizablePane, ResizablePanes, useResizablePaneRef, useResizablePanesLayout } from "./resizable-panes"

// jsdom has no layout, and the library measures the group to work out percentages.
function fakeLayout() {
  const box = { x: 0, y: 0, left: 0, top: 0, right: 1000, bottom: 500, width: 1000, height: 500, toJSON: () => ({}) }
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(box as DOMRect)
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(1000)
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(500)
}

const handle = () => screen.getByRole("separator", { name: "Resize the conversation" })

function Subject({ orientation, withGrip, disabled }: { orientation?: "horizontal" | "vertical"; withGrip?: boolean; disabled?: boolean }) {
  return (
    <ResizablePanes orientation={orientation} disabled={disabled}>
      <ResizablePane id="conversation" defaultSize="50%" minSize="20%">
        Conversation
      </ResizablePane>
      <ResizableHandle label="Resize the conversation" withGrip={withGrip} />
      <ResizablePane id="canvas" defaultSize="50%" minSize="20%">
        Canvas
      </ResizablePane>
    </ResizablePanes>
  )
}

describe("ResizablePanes", () => {
  beforeEach(fakeLayout)
  afterEach(() => vi.restoreAllMocks())

  it("renders its panes and marks every part", () => {
    render(<Subject />)
    expect(screen.getByText("Conversation").closest('[data-slot="resizable-pane"]')).not.toBeNull()
    expect(screen.getByText("Canvas").closest('[data-slot="resizable-panes"]')).not.toBeNull()
    expect(handle()).toHaveAttribute("data-slot", "resizable-handle")
  })

  it("names the handle and makes it a stop in the tab order", () => {
    render(<Subject />)
    expect(handle()).toHaveAttribute("tabindex", "0")
    expect(handle()).toHaveAttribute("aria-valuemin")
    expect(handle()).toHaveAttribute("aria-valuemax")
    expect(handle()).toHaveAttribute("aria-valuenow", "50")
  })

  it("moves with the arrow keys and stops at the minimum", () => {
    render(<Subject />)
    const now = () => Number(handle().getAttribute("aria-valuenow"))

    act(() => handle().focus())
    fireEvent.keyDown(handle(), { key: "ArrowLeft" })
    expect(now()).toBeLessThan(50)

    fireEvent.keyDown(handle(), { key: "Home" })
    expect(now()).toBe(20)

    fireEvent.keyDown(handle(), { key: "ArrowLeft" })
    expect(now()).toBe(20)
  })

  it("stacks when vertical: the handle runs across", () => {
    render(<Subject orientation="vertical" />)
    expect(handle()).toHaveAttribute("aria-orientation", "horizontal")
  })

  it("draws a grip only when asked", () => {
    const { rerender } = render(<Subject />)
    expect(document.querySelector('[data-slot="resizable-handle-grip"]')).toBeNull()

    rerender(<Subject withGrip />)
    expect(document.querySelector('[data-slot="resizable-handle-grip"]')).not.toBeNull()
  })

  it("won't move when disabled", () => {
    render(<Subject disabled />)
    fireEvent.keyDown(handle(), { key: "ArrowLeft" })
    expect(handle()).toHaveAttribute("aria-valuenow", "50")
  })

  it("collapses and expands a pane from code", () => {
    function FromCode() {
      const ref = useResizablePaneRef()
      return (
        <>
          <button type="button" onClick={() => ref.current?.collapse()}>
            Collapse
          </button>
          <ResizablePanes>
            <ResizablePane id="list" panelRef={ref} collapsible defaultSize="50%" minSize="20%">
              List
            </ResizablePane>
            <ResizableHandle label="Resize the conversation" />
            <ResizablePane id="detail" defaultSize="50%">
              Detail
            </ResizablePane>
          </ResizablePanes>
        </>
      )
    }
    render(<FromCode />)

    fireEvent.click(screen.getByRole("button", { name: "Collapse" }))

    expect(handle()).toHaveAttribute("aria-valuenow", "0")
  })

  it("remembers a layout between visits", () => {
    const saved = new Map<string, string>()
    const storage = { getItem: (key: string) => saved.get(key) ?? null, setItem: (key: string, value: string) => void saved.set(key, value) }
    function Saved() {
      const layout = useResizablePanesLayout({ id: "shell", storage })
      return (
        <ResizablePanes {...layout}>
          <ResizablePane id="conversation" defaultSize="50%" minSize="20%">
            Conversation
          </ResizablePane>
          <ResizableHandle label="Resize the conversation" />
          <ResizablePane id="canvas" defaultSize="50%" minSize="20%">
            Canvas
          </ResizablePane>
        </ResizablePanes>
      )
    }

    const first = render(<Saved />)
    fireEvent.keyDown(handle(), { key: "Home" })
    expect(handle()).toHaveAttribute("aria-valuenow", "20")
    first.unmount()

    render(<Saved />)
    expect(handle()).toHaveAttribute("aria-valuenow", "20")
  })
})

describe("ResizableHandle in the 2026-11 look", () => {
  beforeEach(fakeLayout)
  afterEach(() => vi.restoreAllMocks())

  it("is the 1px rule, ink under the pointer, dragged or focused; its grip is a square bar", () => {
    render(<Subject withGrip />)
    const cls = handle().className
    for (const name of ["bg-line-rule", "data-[separator=hover]:bg-(--c-resizable-active)", "data-[separator=active]:bg-(--c-resizable-active)", "focus-visible:bg-(--c-resizable-active)"]) expect(cls).toContain(name)
    expect(cls).not.toContain("outline-none")
    const grip = document.querySelector('[data-slot="resizable-handle-grip"]')!
    expect(grip.className).toContain("bg-(--c-resizable-grip)")
    expect(grip.className).not.toContain("rounded")
  })
})
