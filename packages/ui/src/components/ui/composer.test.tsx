import * as React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Composer, composerCopy } from "./composer"

const field = () => screen.getByRole("textbox", { name: "Message" })
const type = (text: string) => fireEvent.change(field(), { target: { value: text } })
const enter = (init: KeyboardEventInit & { isComposing?: boolean; keyCode?: number } = {}) => fireEvent.keyDown(field(), { key: "Enter", ...init })

describe("Composer", () => {
  it("is Figma's box: raised, a hairline, 48 tall, 16 in on the left and 4 on the right, a 40px primary send", () => {
    const { container } = render(<Composer placeholder="Reply to Mira" />)
    const root = container.querySelector('[data-slot="composer"]')!
    expect(root.tagName).toBe("FORM")
    expect(root).toHaveAttribute("data-state", "empty")
    const box = container.querySelector('[data-slot="composer-box"]')!
    for (const c of ["bg-surface-raised", "rule-box", "min-h-control", "pl-4", "pr-1", "py-1", "gap-2", "rounded-lg"]) expect(box.className).toContain(c)
    // Focus draws Figma's 2px primary-fill inside border on the box, as a Text Field does.
    expect(box.className).toContain("has-[[data-slot=composer-field]:focus]:rule-box-emphasis")
    expect(field()).toHaveAttribute("placeholder", "Reply to Mira")
    expect(field().className).toContain("type-ui")
    expect(field().className).toContain("placeholder:text-text-label")
    expect(field().className).toContain("max-h-[calc(var(--type-ui-leading)*var(--c-composer-max-lines)+--spacing(5))]")
    const send = screen.getByRole("button", { name: composerCopy.send })
    expect(send.className).toContain("size-10")
    expect(send.className).toContain("bg-primary")
    expect(send.querySelector('[data-icon-name="send--alt"]')).toBeInTheDocument()
  })

  it("keeps Send off while the field is empty or only spaces", () => {
    render(<Composer />)
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toBeDisabled()
    type("   ")
    expect(send).toBeDisabled()
    type("Run the full suite")
    expect(send).toBeEnabled()
    expect(document.querySelector('[data-slot="composer"]')).toHaveAttribute("data-state", "typing")
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

  it("moves focus to the field when Send turns into Stop under it", () => {
    const { rerender } = render(<Composer defaultValue="Hi" />)
    const send = screen.getByRole("button", { name: "Send" })
    send.focus()
    rerender(<Composer defaultValue="Hi" streaming />)
    expect(field()).toHaveFocus()
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

  it("stacks the status strip, then the chips, then the box; the attach and a second action lead the field", () => {
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
    expect([...box.children].map((el) => el.getAttribute("data-slot"))).toEqual(["composer-leading", "composer-field", "composer-send"])
    // With a leading button the box is 4px in on the left too, so the button sits like Send does.
    expect(box.className).toContain("pl-1")
    expect(screen.getByRole("button", { name: "Attach a file" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Expand" })).toBeInTheDocument()
  })

  it("has a one-line size that does not grow", () => {
    const { container } = render(<Composer size="line" />)
    expect(container.querySelector('[data-slot="composer"]')).toHaveAttribute("data-size", "line")
    expect(field().className).toContain("h-10")
    expect(field()).toHaveAttribute("rows", "1")
  })

  it("takes the host's field name and passes field props and its ref through", () => {
    const ref = React.createRef<HTMLTextAreaElement>()
    render(<Composer label="Reply to Mira" fieldRef={ref} fieldProps={{ name: "body", enterKeyHint: "send" }} />)
    const box = screen.getByRole("textbox", { name: "Reply to Mira" })
    expect(box).toHaveAttribute("name", "body")
    expect(box).toHaveAttribute("enterkeyhint", "send")
    expect(ref.current).toBe(box)
  })
})
