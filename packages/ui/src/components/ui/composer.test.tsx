import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Composer, ComposerQuote, composerCopy } from "./composer"

const field = () => screen.getByRole("textbox", { name: "Message" })
const type = (text: string) => fireEvent.change(field(), { target: { value: text } })
const enter = (init: KeyboardEventInit & { isComposing?: boolean; keyCode?: number } = {}) => fireEvent.keyDown(field(), { key: "Enter", ...init })

describe("Composer", () => {
  it("is Figma's 2.0 bar: raised, a line/field edge, 16px corners, the field over the tools row, a round 32px primary send with an up arrow", () => {
    const { container } = render(<Composer placeholder="Reply to Mira" />)
    const root = container.querySelector('[data-slot="composer"]')!
    expect(root.tagName).toBe("FORM")
    expect(root).toHaveAttribute("data-state", "empty")
    const box = container.querySelector('[data-slot="composer-box"]')!
    for (const c of ["bg-surface-raised", "inset-ring-line-field", "flex-col", "gap-2.5", "rounded-[calc(var(--radius-xl)*1.5)]", "pt-3", "pr-3", "pb-2.5", "pl-4"]) expect(box.className.split(" ")).toContain(c)
    // Focus draws Figma's 2px primary-fill inside border on the box, as a Text Field does.
    expect(box.className).toContain("has-[[data-slot=composer-field]:focus]:rule-box-emphasis")
    expect(field()).toHaveAttribute("placeholder", "Reply to Mira")
    expect(field().className).toContain("type-body")
    expect(field().className).toContain("placeholder:text-text-label")
    expect(field().className).toContain("max-h-[calc(var(--type-body-leading)*var(--c-composer-max-lines))]")
    const send = screen.getByRole("button", { name: composerCopy.send })
    expect(send.className).toContain("size-control-m")
    expect(send.className).toContain("bg-primary")
    expect(send.className).toContain("rounded-full")
    expect(send.querySelector('[data-icon-name="arrow--up"]')).toBeInTheDocument()
  })

  it("keeps Send off while the field is empty or only spaces: unavailable, and a press or Enter sends nothing", () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    const send = screen.getByRole("button", { name: "Send" })
    const off = () => {
      expect(send).toHaveAttribute("aria-disabled", "true")
      fireEvent.click(send)
      enter()
      fireEvent.submit(document.querySelector('[data-slot="composer"]')!)
      expect(onSend).not.toHaveBeenCalled()
    }
    off()
    type("   ")
    off()
    type("Run the full suite")
    expect(send).toBeEnabled()
    expect(send).not.toHaveAttribute("aria-disabled")
    expect(document.querySelector('[data-slot="composer"]')).toHaveAttribute("data-state", "typing")
  })

  it("an empty composer dims Send to 50% and keeps it focusable with aria-disabled; a press does nothing (Unicron 51)", () => {
    const onSend = vi.fn()
    const { unmount } = render(<Composer onSend={onSend} />)
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAttribute("data-idle")
    expect(send).toHaveAttribute("aria-disabled", "true")
    const cls = send.className.split(" ")
    // The button's own rule dims an aria-disabled control to 50%, and nothing lifts it any more.
    expect(cls).toContain("aria-disabled:not-aria-busy:opacity-50")
    expect(cls).not.toContain("aria-disabled:not-aria-busy:opacity-100")
    // It stays reachable, so focus is never lost to the page when the text is cleared under it.
    expect(send).not.toHaveAttribute("disabled")
    send.focus()
    expect(send).toHaveFocus()
    fireEvent.keyDown(send, { key: "Enter" })
    fireEvent.keyDown(send, { key: " " })
    fireEvent.click(send)
    expect(onSend).not.toHaveBeenCalled()
    unmount()

    const off = render(<Composer disabled />)
    const dimmed = screen.getByRole("button", { name: "Send" })
    expect(dimmed).toBeDisabled()
    expect(dimmed).not.toHaveAttribute("data-idle")
    expect(dimmed.className.split(" ")).not.toContain("aria-disabled:not-aria-busy:opacity-100")
    off.unmount()

    render(<Composer sendDisabled disabledReason="No models connected." />)
    const turnedOff = screen.getByRole("button", { name: "Send" })
    expect(turnedOff).not.toHaveAttribute("data-idle")
    expect(turnedOff.className.split(" ")).toContain("aria-disabled:not-aria-busy:opacity-50")
  })

  it("the field's text is 16px on a touch screen, as every field's, so iOS does not zoom into it", () => {
    render(<Composer />)
    expect(field().className.split(" ")).toEqual(expect.arrayContaining(["type-body", "pointer-coarse:text-(length:--size-field-text-touch)"]))
  })

  it("sends on Enter, makes a line on Shift+Enter, and clears itself when uncontrolled", () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type("Split the migration")
    enter({ shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()
    enter()
    expect(onSend).toHaveBeenCalledWith("Split the migration")
    expect(field()).toHaveValue("")
  })

  it("sends from the button too", () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type("Does an old app version still log in?")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(onSend).toHaveBeenCalledWith("Does an old app version still log in?")
  })

  it("never sends while an input method is composing", () => {
    const onSend = vi.fn()
    render(<Composer onSend={onSend} />)
    type("にほんご")
    enter({ isComposing: true })
    enter({ keyCode: 229 })
    expect(onSend).not.toHaveBeenCalled()
  })

  it("takes another send key: Cmd or Ctrl+Enter, or none at all", () => {
    const onSend = vi.fn()
    const { rerender } = render(<Composer onSend={onSend} sendKey="mod-enter" />)
    type("One")
    enter()
    expect(onSend).not.toHaveBeenCalled()
    enter({ ctrlKey: true })
    expect(onSend).toHaveBeenCalledWith("One")
    rerender(<Composer onSend={onSend} sendKey="none" />)
    type("Two")
    enter()
    enter({ metaKey: true })
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it("is controlled: it reports each change, sends the value, and leaves clearing to the host", () => {
    const onSend = vi.fn()
    const onValueChange = vi.fn()
    function Host() {
      const [value, setValue] = React.useState("Draft kept per chat")
      return (
        <Composer
          value={value}
          onValueChange={(v) => {
            onValueChange(v)
            setValue(v)
          }}
          onSend={onSend}
        />
      )
    }
    render(<Host />)
    expect(field()).toHaveValue("Draft kept per chat")
    type("Draft kept per chat, edited")
    expect(onValueChange).toHaveBeenLastCalledWith("Draft kept per chat, edited")
    enter()
    expect(onSend).toHaveBeenCalledWith("Draft kept per chat, edited")
    expect(field()).toHaveValue("Draft kept per chat, edited")
  })

  it("while sending, Send keeps its name, is busy, and does not send twice", () => {
    const onSend = vi.fn()
    render(<Composer defaultValue="Hi" sending onSend={onSend} />)
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAttribute("aria-busy", "true")
    expect(document.querySelector('[data-slot="composer"]')).toHaveAttribute("data-state", "sending")
    enter()
    fireEvent.click(send)
    expect(onSend).not.toHaveBeenCalled()
  })

  it("while a reply streams, the button is Stop; Enter does not send; stopping keeps its name, busy", () => {
    const onSend = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<Composer defaultValue="Next question" streaming onStop={onStop} onSend={onSend} />)
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull()
    const stop = screen.getByRole("button", { name: composerCopy.stop })
    expect(stop.querySelector('[data-icon-name="stop--filled--alt"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="composer"]')).toHaveAttribute("data-state", "streaming")
    enter()
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.click(stop)
    expect(onStop).toHaveBeenCalledTimes(1)
    rerender(<Composer defaultValue="Next question" streaming stopping onStop={onStop} onSend={onSend} />)
    expect(screen.getByRole("button", { name: "Stop" })).toHaveAttribute("aria-busy", "true")
  })

  it("while a reply streams with onQueue, typing makes the button a Send that queues, and Stop moves aside", () => {
    const onSend = vi.fn()
    const onQueue = vi.fn()
    const onStop = vi.fn()
    render(<Composer streaming onStop={onStop} onSend={onSend} onQueue={onQueue} />)
    // Empty: the button is Stop, as before.
    expect(screen.getByRole("button", { name: "Stop" })).toHaveAttribute("data-action", "stop")
    type("And then?")
    const queue = screen.getByRole("button", { name: composerCopy.queue })
    expect(queue).toHaveAttribute("data-action", "queue")
    const stop = screen.getByRole("button", { name: "Stop" })
    expect(stop).toHaveAttribute("data-slot", "composer-stop")
    fireEvent.click(stop)
    expect(onStop).toHaveBeenCalledTimes(1)
    enter()
    expect(onQueue).toHaveBeenCalledWith("And then?")
    expect(onSend).not.toHaveBeenCalled()
    expect(field()).toHaveValue("")
  })

  it("Option+Enter steers: the text goes into the reply in progress, and the queue button says how", () => {
    const onQueue = vi.fn()
    const onSteer = vi.fn()
    render(<Composer streaming onStop={() => {}} onQueue={onQueue} onSteer={onSteer} />)
    type("Use the newer API")
    expect(screen.getByRole("button", { name: composerCopy.queue })).toHaveAccessibleDescription(composerCopy.steerHint)
    enter({ altKey: true })
    expect(onSteer).toHaveBeenCalledWith("Use the newer API")
    expect(onQueue).not.toHaveBeenCalled()
    expect(field()).toHaveValue("")
  })

  // Stop, the waiting clock and Send are one DOM node. A host that ends the state inside the press
  // (the usual way) re-renders that node as the submit button before the browser runs the click's
  // own action, so the same press went on to submit the form: Stop sent the draft, and cancelling
  // a wait sent the message it was meant to hold back.
  it("pressing Stop does not send the draft when the host ends streaming in the handler", () => {
    const onSend = vi.fn()
    const onStop = vi.fn()
    function Host() {
      const [streaming, setStreaming] = React.useState(true)
      return (
        <Composer
          defaultValue="a draft typed while the reply streams"
          streaming={streaming}
          onStop={() => {
            onStop()
            setStreaming(false)
          }}
          onSend={onSend}
        />
      )
    }
    render(<Host />)
    fireEvent.click(screen.getByRole("button", { name: "Stop" }))
    expect(onStop).toHaveBeenCalledTimes(1)
    expect(onSend).not.toHaveBeenCalled()
    // The draft is still in the field, and the button is Send again, ready for a press of its own.
    expect(field()).toHaveValue("a draft typed while the reply streams")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(onSend).toHaveBeenCalledTimes(1)
  })

  it("cancelling a wait does not send the message when the host ends waiting in the handler", () => {
    const onSend = vi.fn()
    const onCancelWaiting = vi.fn()
    function Host() {
      const [waiting, setWaiting] = React.useState(true)
      return (
        <Composer
          defaultValue="Draw the new login flow."
          waiting={waiting}
          onCancelWaiting={() => {
            onCancelWaiting()
            setWaiting(false)
          }}
          onSend={onSend}
        />
      )
    }
    render(<Host />)
    fireEvent.click(screen.getByRole("button", { name: composerCopy.waiting }))
    expect(onCancelWaiting).toHaveBeenCalledTimes(1)
    expect(onSend).not.toHaveBeenCalled()
    expect(field()).toHaveValue("Draw the new login flow.")
  })

  it("moves focus to the field when Send turns into Stop under it", () => {
    const { rerender } = render(<Composer defaultValue="Hi" />)
    const send = screen.getByRole("button", { name: "Send" })
    send.focus()
    rerender(<Composer defaultValue="Hi" streaming />)
    expect(field()).toHaveFocus()
  })

  it("moves focus to the field when a reply ends by itself while focus is on Stop", () => {
    const { rerender } = render(<Composer streaming />)
    const stop = screen.getByRole("button", { name: composerCopy.stop })
    act(() => stop.focus())
    expect(stop).toHaveFocus()
    // The host ends the stream; nobody pressed anything. The button is a Send that cannot send.
    rerender(<Composer />)
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("aria-disabled", "true")
    expect(field()).toHaveFocus()
  })

  it("the same when a wait ends under the clock, and when the composer is disabled as the reply ends", () => {
    const { rerender, unmount } = render(<Composer waiting />)
    act(() => screen.getByRole("button", { name: composerCopy.waiting }).focus())
    rerender(<Composer />)
    expect(field()).toHaveFocus()
    unmount()

    const next = render(<Composer streaming sendDisabled disabledReason="No models connected." />)
    act(() => screen.getByRole("button", { name: composerCopy.stop }).focus())
    next.rerender(<Composer sendDisabled disabledReason="No models connected." />)
    expect(field()).toHaveFocus()
  })

  it("leaves focus alone when the reply ends and focus is elsewhere, or when Send can send", () => {
    const { rerender, unmount } = render(
      <>
        <button type="button">Elsewhere</button>
        <Composer streaming />
      </>
    )
    act(() => screen.getByRole("button", { name: "Elsewhere" }).focus())
    rerender(
      <>
        <button type="button">Elsewhere</button>
        <Composer />
      </>
    )
    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus()
    unmount()

    // A draft is waiting: Stop turns into a Send that works, and focus stays on it.
    const next = render(<Composer streaming defaultValue="And the tests?" />)
    act(() => screen.getByRole("button", { name: composerCopy.stop }).focus())
    next.rerender(<Composer defaultValue="And the tests?" />)
    expect(screen.getByRole("button", { name: "Send" })).toHaveFocus()
  })

  it("while waiting for the network, the button is a clock that cancels the wait", () => {
    const onCancelWaiting = vi.fn()
    render(<Composer defaultValue="Sends when you're back online." waiting onCancelWaiting={onCancelWaiting} status="Sends when you're back online." />)
    const wait = screen.getByRole("button", { name: composerCopy.waiting })
    expect(wait.querySelector('[data-icon-name="time"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="composer"]')).toHaveAttribute("data-state", "waiting")
    fireEvent.click(wait)
    expect(onCancelWaiting).toHaveBeenCalledTimes(1)
  })

  it("off with a reason: one visible line ties to the field and to Send, and both stay in the tab order", () => {
    render(<Composer disabled disabledReason="No models connected." defaultValue="Hello" />)
    const reason = screen.getByText("No models connected.")
    expect(field()).not.toBeDisabled()
    expect(field()).toHaveAttribute("aria-disabled", "true")
    expect(field()).toHaveAttribute("readonly")
    expect(field()).toHaveAccessibleDescription("No models connected.")
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAttribute("aria-disabled", "true")
    expect(send).toHaveAccessibleDescription("No models connected.")
    expect(reason.closest('[data-slot="composer-reason"]')!.className).toContain("type-caption")
  })

  it("off without a reason: the field is disabled and the box dims", () => {
    const { container } = render(<Composer disabled />)
    expect(field()).toBeDisabled()
    expect(container.querySelector('[data-slot="composer"]')).toHaveAttribute("data-disabled")
    expect(container.querySelector('[data-slot="composer-box"]')!.className).toContain("opacity-50")
  })

  it("can turn sending off alone: typing still works", () => {
    const onSend = vi.fn()
    render(<Composer sendDisabled disabledReason="No models connected." onSend={onSend} />)
    type("Ask anything")
    expect(field()).toHaveValue("Ask anything")
    enter()
    expect(onSend).not.toHaveBeenCalled()
    expect(screen.getByRole("button", { name: "Send" })).toHaveAttribute("aria-disabled", "true")
  })

  it("stacks the status strip, then the chips, then the box; the attach and a second action lead the tools row under the field", () => {
    const { container } = render(
      <Composer
        status={<p>Full test suite passed: 128 of 128</p>}
        chips={<span>snds/lockdown</span>}
        attach={<button type="button">Attach a file</button>}
        leadingAction={<button type="button">Expand</button>}
      />
    )
    const slots = [...container.querySelector('[data-slot="composer"]')!.children].map((el) => el.getAttribute("data-slot"))
    expect(slots).toEqual(["composer-status", "composer-chips", "composer-box"])
    expect(container.querySelector('[data-slot="composer-status"]')!.className).toContain("mb-4")
    expect(container.querySelector('[data-slot="composer-chips"]')!.className).toContain("mb-5")
    const box = container.querySelector('[data-slot="composer-box"]')!
    expect([...box.children].map((el) => el.getAttribute("data-slot"))).toEqual(["composer-field", "composer-tools"])
    const tools = container.querySelector('[data-slot="composer-tools"]')!
    expect(tools.firstElementChild).toHaveAttribute("data-slot", "composer-leading")
    expect(tools.lastElementChild).toHaveAttribute("data-slot", "composer-send")
    expect(screen.getByRole("button", { name: "Attach a file" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand" })).toBeInTheDocument()
  })

  it("has a one-line size that does not grow", () => {
    const { container } = render(<Composer size="line" />)
    expect(container.querySelector('[data-slot="composer"]')).toHaveAttribute("data-size", "line")
    expect(field().className).toContain("h-6")
    expect(field()).toHaveAttribute("rows", "1")
    // One row: the field beside its tools.
    expect(container.querySelector('[data-slot="composer-box"]')!.className).toContain("flex-row")
  })

  it("goes to one row on a phone on its side or with the keyboard up, where height is scarce", () => {
    const { container } = render(<Composer />)
    const box = container.querySelector('[data-slot="composer-box"]')!.className
    expect(box).toContain("short:flex-row")
    expect(box).toContain("group-data-[keyboard=open]/frame:flex-row")
    expect(field().className).toContain("short:flex-1")
  })

  it("takes the host's field name and passes field props and its ref through", () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Composer label="Reply to Mira" fieldRef={ref} fieldProps={{ name: "body", enterKeyHint: "send" }} />)
    const box = screen.getByRole("textbox", { name: "Reply to Mira" })
    expect(box).toHaveAttribute("name", "body")
    expect(box).toHaveAttribute("enterkeyhint", "send")
    expect(ref.current).toBe(box)
  })

  it("carries a reply's quote inside the box, over the field, with a × that takes it back", () => {
    const dismiss = vi.fn()
    render(<Composer quote={<ComposerQuote label="Replying to Claude" onDismiss={dismiss}>The QNAP TS-264 is faster</ComposerQuote>} />)
    const box = document.querySelector('[data-slot="composer-box"]')!
    const quote = screen.getByRole("group", { name: "Replying to Claude" })
    expect(box.contains(quote)).toBe(true)
    // At the top of the box, before the field.
    expect(quote.compareDocumentPosition(screen.getByRole("textbox")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText("The QNAP TS-264 is faster")).toHaveAttribute("title", "The QNAP TS-264 is faster")
    fireEvent.click(screen.getByRole("button", { name: "Cancel reply" }))
    expect(dismiss).toHaveBeenCalledOnce()
  })

  it("wraps for a quote only as a row: a wrapping column would size the quote to its text and run it out of the box", () => {
    const { rerender } = render(<Composer quote={<ComposerQuote>{"word ".repeat(100)}</ComposerQuote>} />)
    const box = () => document.querySelector('[data-slot="composer-box"]')!.className.split(" ")
    expect(box()).not.toContain("flex-wrap")
    expect(box()).toContain("short:flex-wrap")
    rerender(<Composer size="line" quote={<ComposerQuote>{"word ".repeat(100)}</ComposerQuote>} />)
    expect(box()).toContain("flex-wrap")
  })
})
