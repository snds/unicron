import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useState } from "react"

import { AppFrame, AppFrameAccessory, AppFrameBottomRow, AppFrameColumn, AppFrameMain, toastPlacementFor, stripStateFor } from "./app-frame"
import { Button } from "./button"
import { toast, toastDurations, Toaster, toasterVisibleToasts, waitingToasts } from "./sonner"
import { TabBar, TabBarItem } from "./tab-bar"

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
    expect(list().style.getPropertyValue("--offset-top")).toBe("var(--frame-toast-top, var(--c-toaster-offset))")
    expect(list().style.getPropertyValue("--mobile-offset-top")).toBe("var(--frame-toast-top, var(--c-toaster-offset-compact))")
    // On a phone the frame gives the strip's width (5.1c C6); elsewhere the knob.
    expect(list().style.getPropertyValue("--width")).toBe("var(--frame-toast-width, var(--c-toaster-width))")
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

describe("the phone's status-strip slot (contract 5.1c C6)", () => {
  it("places a toast by the strip's state: the slot, under the top row, or waiting; content on a desktop", () => {
    expect(toastPlacementFor(false, "needs-you")).toBe("content")
    expect(toastPlacementFor(true, "none")).toBe("strip")
    expect(toastPlacementFor(true, "live")).toBe("strip")
    expect(toastPlacementFor(true, "live-action")).toBe("wait")
    expect(toastPlacementFor(true, "needs-you")).toBe("top")
    // A strip's state from its tone and its action: critical is held like needs-you.
    expect(stripStateFor("live", true)).toBe("live-action")
    expect(stripStateFor("live", false)).toBe("live")
    expect(stripStateFor("neutral", false)).toBe("live")
    expect(stripStateFor("needs-you", true)).toBe("needs-you")
    expect(stripStateFor("critical", true)).toBe("needs-you")
  })

  const tabs = (
    <TabBar label="Sections" value="mail">
      <TabBarItem value="mail" icon="email" label="Mail" />
      <TabBarItem value="calendar" icon="calendar" label="Calendar" />
    </TabBar>
  )

  type Strip = "none" | "sending" | "syncing" | "sign-in"

  function Phone({ strip }: { strip: Strip }) {
    return (
      <AppFrame layout="phone">
        <AppFrameMain>
          <AppFrameColumn>Inbox</AppFrameColumn>
        </AppFrameMain>
        {strip === "sending" ? (
          <AppFrameAccessory tone="live" meta="Sending" countdown={8} title="Board games for the cabin" action={{ label: "Undo", onClick: () => {} }} />
        ) : strip === "syncing" ? (
          <AppFrameAccessory tone="live" meta="Syncing // Personal + Work" title="Checking 2 accounts" />
        ) : strip === "sign-in" ? (
          <AppFrameAccessory tone="needs-you" meta="Sign-in request // 01" title="Chrome on Windows" action={<Button variant="needs-you" size="sm">Review</Button>} />
        ) : null}
        <AppFrameBottomRow tabs={tabs} />
        <Toaster />
      </AppFrame>
    )
  }

  const frame = () => document.querySelector('[data-slot="app-frame"]') as HTMLElement
  const accessory = () => document.querySelector('[data-slot="accessory"]') as HTMLElement

  it("with no strip, a toast takes the strip's slot above the bottom row; the frame gives the place", async () => {
    render(<Phone strip="none" />)
    act(() => {
      toast("Archived Budget for audits")
    })
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "bottom")
    // The frame says where: 16 from the sides, as wide as the strip, the bottom over the row's bar.
    expect(frame().style.getPropertyValue("--frame-toast-left")).toMatch(/px$/)
    expect(frame().style.getPropertyValue("--frame-toast-bottom")).toMatch(/px$/)
    expect(frame().style.getPropertyValue("--frame-toast-width")).toMatch(/px$/)
    expect(frame()).not.toHaveAttribute("data-strip")
  })

  it("a live strip without an action gives way for the toast's time, then comes back", async () => {
    render(<Phone strip="syncing" />)
    expect(frame()).toHaveAttribute("data-strip", "live")
    expect(accessory()).not.toHaveAttribute("data-yield")
    act(() => {
      toast("Archived Budget for audits")
    })
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "bottom")
    expect(accessory()).toHaveAttribute("data-yield")
    expect(accessory()).toHaveClass("invisible")
    expect(accessory()).toHaveAttribute("aria-hidden", "true")
    act(() => {
      toast.dismiss()
    })
    await settle()
    await settle()
    expect(accessory()).not.toHaveAttribute("data-yield")
    expect(accessory()).not.toHaveClass("invisible")
  })

  it("a live strip with an action (undo send) is never covered: the toast waits until it ends", async () => {
    function Sending() {
      const [sending, setSending] = useState(true)
      return (
        <>
          <Phone strip={sending ? "sending" : "none"} />
          <button type="button" onClick={() => setSending(false)}>
            End the window
          </button>
        </>
      )
    }
    render(<Sending />)
    expect(frame()).toHaveAttribute("data-strip", "live-action")
    act(() => {
      toast("Archived Budget for audits")
    })
    await settle()
    expect(toasts()).toHaveLength(0)
    expect(waitingToasts()).toBe(1)
    expect(accessory()).not.toHaveAttribute("data-yield")
    fireEvent.click(screen.getByRole("button", { name: "End the window" }))
    await settle()
    expect(waitingToasts()).toBe(0)
    expect(toasts()).toHaveLength(1)
    expect(screen.getByText("Archived Budget for audits")).toBeInTheDocument()
    expect(list()).toHaveAttribute("data-y-position", "bottom")
  })

  it("toasts already up when an undo-send strip arrives move under the top row; none covers it", async () => {
    function Later() {
      const [sending, setSending] = useState(false)
      return (
        <>
          <Phone strip={sending ? "sending" : "none"} />
          <button type="button" onClick={() => setSending(true)}>
            Send
          </button>
        </>
      )
    }
    render(<Later />)
    act(() => {
      toast("Archived Budget for audits")
    })
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "bottom")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "top")
  })

  it("a needs-you strip never gives way: the toast sits under the top row", async () => {
    render(<Phone strip="sign-in" />)
    expect(frame()).toHaveAttribute("data-strip", "needs-you")
    act(() => {
      toast("Copied the password for Steam")
    })
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "top")
    expect(accessory()).not.toHaveAttribute("data-yield")
    expect(frame().style.getPropertyValue("--frame-toast-top")).toMatch(/px$/)
  })

  it("dismissing a waiting toast takes it out of the queue", async () => {
    render(<Phone strip="sending" />)
    let id: string | number = ""
    act(() => {
      id = toast("Archived Budget for audits")
    })
    expect(waitingToasts()).toBe(1)
    act(() => {
      toast.dismiss(id)
    })
    expect(waitingToasts()).toBe(0)
  })

  it("on a desktop the place is unchanged: the bottom left of the content, three at most", async () => {
    render(
      <AppFrame layout="expanded">
        <AppFrameMain>
          <AppFrameColumn>Overview</AppFrameColumn>
        </AppFrameMain>
        <Toaster />
      </AppFrame>
    )
    act(() => {
      for (let i = 1; i <= 4; i++) toast(`Saved ${i}`)
    })
    await settle()
    expect(list()).toHaveAttribute("data-y-position", "bottom")
    expect(list()).toHaveAttribute("data-x-position", "left")
    expect(frame().style.getPropertyValue("--frame-toast-left")).toMatch(/px$/)
    expect(frame().style.getPropertyValue("--frame-toast-width")).toBe("")
    // A desktop frame keeps the toast's own width even in a window sonner treats as a phone.
    expect(toasts()[0].className.split(/\s+/)).toContain("w-(--width)!")
    expect(toasts().filter((t) => t.getAttribute("data-visible") === "true").length).toBeLessThanOrEqual(toasterVisibleToasts)
  })
})
