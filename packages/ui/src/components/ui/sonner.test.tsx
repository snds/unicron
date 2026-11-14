import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { toast, toastDurations, Toaster, toasterVisibleToasts } from "./sonner"

const list = () => document.querySelector("[data-sonner-toaster]") as HTMLElement
const toasts = () => Array.from(document.querySelectorAll<HTMLElement>("[data-sonner-toast]"))

afterEach(() => {
  act(() => {
    toast.dismiss()
  })
  vi.useRealTimers()
})

async function settle() {
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0))
  })
}

describe("Toaster", () => {
  it("sits at the bottom left, offset from the frame's variables, or the knob without them", async () => {
    render(<Toaster />)
    act(() => {
      toast("Saved Steam")
    })
    await settle()
    expect(list()).toHaveAttribute("data-x-position", "left")
    expect(list()).toHaveAttribute("data-y-position", "bottom")
    expect(list().style.getPropertyValue("--offset-left")).toBe("var(--frame-toast-left, var(--c-toaster-offset))")
    expect(list().style.getPropertyValue("--offset-bottom")).toBe("var(--frame-toast-bottom, var(--c-toaster-offset))")
    expect(list().style.getPropertyValue("--mobile-offset-bottom")).toBe("var(--frame-toast-bottom, var(--c-toaster-offset-compact))")
    expect(list().style.getPropertyValue("--width")).toBe("var(--c-toaster-width)")
  })

  it("is announced politely", async () => {
    render(<Toaster />)
    act(() => {
      toast("Archived Budget for audits")
    })
    await settle()
    expect(document.querySelector("section[aria-live='polite']")).toContainElement(screen.getByText("Archived Budget for audits"))
  })

  it("each toast is solid and square: the raised surface, a 1px rule, the 2px corner; title ui-emphasis, body caption", async () => {
    render(<Toaster />)
    act(() => {
      toast("Copied the password for Steam", { description: "Clears in 30 s" })
    })
    await settle()
    const el = toasts()[0]!
    expect(el).toHaveAttribute("data-styled", "false")
    expect(el.className.split(" ")).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "rounded", "text-text-body"]))
    expect(el.className).not.toMatch(/shadow|blur|rounded-2xl/)
    expect(screen.getByText("Copied the password for Steam").className.split(" ")).toContain("type-ui-emphasis")
    expect(screen.getByText("Clears in 30 s").className.split(" ")).toEqual(expect.arrayContaining(["type-caption", "text-text-secondary"]))
  })

  it("shows three at most", async () => {
    render(<Toaster />)
    expect(toasterVisibleToasts).toBe(3)
    act(() => {
      toast("Archived Steam")
      toast("Archived Spotify")
      toast("Archived Stripe")
      toast("Archived Synology")
    })
    await settle()
    const shown = toasts().filter((el) => el.getAttribute("data-visible") === "true")
    expect(shown).toHaveLength(3)
  })

  it("only an error carries colour: its glyph in the critical ink", async () => {
    render(<Toaster />)
    act(() => {
      toast.error("Couldn't move Steam")
      toast.success("Saved Steam")
    })
    await settle()
    const [error, success] = ["Couldn't move Steam", "Saved Steam"].map((t) => screen.getByText(t).closest("[data-sonner-toast]") as HTMLElement)
    expect(error!.className).toContain("[&_[data-icon]]:text-critical-text")
    expect(success!.className).not.toContain("critical")
    expect(error!.querySelector('[data-icon-name="misuse--outline"]')).not.toBeNull()
  })
})

describe("toast()", () => {
  it("stays 4 s without an action and 6 s with one", async () => {
    expect(toastDurations).toEqual({ plain: 4000, action: 6000 })
    vi.useFakeTimers({ shouldAdvanceTime: true })
    render(<Toaster />)
    act(() => {
      toast("Unpinned Budget for audits")
      toast("Archived Budget for audits", { action: { label: "Undo", onClick: () => {} } })
    })
    await act(async () => {
      vi.advanceTimersByTime(4600)
    })
    expect(screen.queryByText("Unpinned Budget for audits")).toBeNull()
    expect(screen.getByText("Archived Budget for audits")).toBeInTheDocument()
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.queryByText("Archived Budget for audits")).toBeNull()
  })

  it("holds one action, a ghost button; pressing it runs it and dismisses the toast", async () => {
    const undo = vi.fn()
    render(<Toaster />)
    act(() => {
      toast("Moved Steam to Recently deleted", { action: { label: "Undo", onClick: undo } })
    })
    await settle()
    const button = screen.getByRole("button", { name: "Undo" })
    expect(button).toHaveAttribute("data-slot", "toast-action")
    expect(button).toHaveAttribute("data-variant", "ghost")
    expect(button.closest("[data-sonner-toast]")!.querySelectorAll("button")).toHaveLength(1)
    fireEvent.click(button)
    expect(undo).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(screen.queryByText("Moved Steam to Recently deleted")).toBeNull())
  })

  it("takeFocus moves focus to the action, and hands it back when the toast leaves", async () => {
    render(
      <>
        <ul aria-label="Chats" tabIndex={-1} data-testid="list" />
        <Toaster />
      </>
    )
    const listEl = screen.getByTestId("list")
    act(() => {
      toast("Archived Budget for audits", { action: { label: "Undo", onClick: () => {} }, takeFocus: true, returnFocus: () => listEl })
    })
    await settle()
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus())
    fireEvent.click(screen.getByRole("button", { name: "Undo" }))
    await vi.waitFor(() => expect(listEl).toHaveFocus())
  })

  it("without takeFocus, a toast never moves focus", async () => {
    render(
      <>
        <button type="button">Archive</button>
        <Toaster />
      </>
    )
    const archive = screen.getByRole("button", { name: "Archive" })
    archive.focus()
    act(() => {
      toast("Archived Budget for audits", { action: { label: "Undo", onClick: () => {} } })
    })
    await settle()
    expect(archive).toHaveFocus()
  })
})
