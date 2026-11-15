import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ChatMessage, ChatMessageMetaButton, chatMessageCopy } from "./chat-message"

describe("ChatMessage", () => {
  it("draws the person's message right aligned, in a raised bubble that hugs its text up to 300px", () => {
    const { container } = render(
      <ChatMessage role="user" meta="You // 14:02">
        Why did the OPAQUE migration touch the client SDK?
      </ChatMessage>
    )
    const article = screen.getByRole("article")
    expect(article).toHaveAttribute("data-role", "user")
    expect(article.className).toContain("items-end")
    expect(article.className).toContain("gap-1")
    const bubble = container.querySelector('[data-slot="chat-message-bubble"]')!
    for (const c of ["bg-surface-raised", "rule-box", "px-4", "py-3", "type-body", "text-text-body", "w-fit", "max-w-(--c-chat-bubble-max)", "rounded-lg"]) {
      expect(bubble.className).toContain(c)
    }
    expect(bubble).toHaveTextContent("Why did the OPAQUE migration touch the client SDK?")
    const meta = container.querySelector('[data-slot="chat-message-meta"]')!
    expect(meta).toHaveTextContent("You // 14:02")
    expect(meta.className).toContain("type-overline")
    expect(meta.className).toContain("text-text-label")
  })

  it("draws an agent's reply with no bubble, across the column, in the response role, its meta live", () => {
    const { container } = render(
      <ChatMessage role="agent" meta="Claude Code // 14:03">
        Login now runs a two-message handshake.
      </ChatMessage>
    )
    expect(container.querySelector('[data-slot="chat-message-bubble"]')).toBeNull()
    const body = container.querySelector('[data-slot="chat-message-body"]')!
    expect(body.className).toContain("type-response")
    expect(body.className).toContain("w-full")
    expect(screen.getByRole("article").className).toContain("items-start")
    expect(container.querySelector('[data-slot="chat-message-meta"]')!.className).toContain("text-secondary-live")
  })

  it("while streaming: an orb and the phase join the meta, a live square follows the text, the body is busy", () => {
    const { container } = render(
      <ChatMessage role="agent" meta="General" phase="writing" state="streaming">
        Yes, for 30 days.
      </ChatMessage>
    )
    const meta = container.querySelector('[data-slot="chat-message-meta"]')!
    expect(meta).toHaveTextContent("General // writing")
    const orb = meta.querySelector('[data-slot="status-orb"]')!
    expect(orb).toHaveAttribute("data-state", "working")
    expect(orb).toHaveAttribute("aria-hidden")
    expect(container.querySelector('[data-slot="chat-message-caret"]')!.className).toContain("bg-secondary-live")
    expect(container.querySelector('[data-slot="chat-message-body"]')).toHaveAttribute("aria-busy", "true")
  })

  it("shows the phase alone before any meta, and drops it once the reply is done", () => {
    const { container, rerender } = render(<ChatMessage role="agent" phase="waiting" state="streaming" />)
    expect(container.querySelector('[data-slot="chat-message-meta"]')).toHaveTextContent(/^waiting$/)
    rerender(<ChatMessage role="agent" meta="General // 14:03" phase="waiting" state="done" />)
    expect(container.querySelector('[data-slot="chat-message-phase"]')).toBeNull()
    expect(container.querySelector('[data-slot="chat-message-caret"]')).toBeNull()
  })

  it("says once that a reply finished, and never re-reads its text", () => {
    const { rerender } = render(
      <ChatMessage role="agent" meta="General" phase="writing" state="streaming">
        Yes
      </ChatMessage>
    )
    const status = screen.getByRole("status")
    expect(status).toHaveTextContent("")
    rerender(
      <ChatMessage role="agent" meta="General" phase="writing" state="streaming">
        Yes, for 30 days.
      </ChatMessage>
    )
    expect(status).toHaveTextContent("")
    rerender(
      <ChatMessage role="agent" meta="General // 14:05" state="done">
        Yes, for 30 days.
      </ChatMessage>
    )
    expect(status).toHaveTextContent(chatMessageCopy.finished)
    expect(status).not.toHaveTextContent("30 days")
  })

  it("on error: a critical line in the server's words and the retry slot, said once", () => {
    const { container, rerender } = render(<ChatMessage role="user" meta="You // 14:05">Does an old app version still log in?</ChatMessage>)
    rerender(
      <ChatMessage role="user" meta="You // 14:05" state="error" error="No reply came. The model timed out." retry={<button type="button">Try again</button>}>
        Does an old app version still log in?
      </ChatMessage>
    )
    const error = container.querySelector('[data-slot="chat-message-error"]')!
    expect(error.querySelector("p")!.className).toContain("text-critical-text")
    expect(error).toHaveTextContent("No reply came. The model timed out.")
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("No reply came. The model timed out.")
  })

  it("marks how a reply ended after its text", () => {
    const { container } = render(
      <ChatMessage role="agent" meta="General // 14:03" endMarks={["cut off", "stopped"]}>
        Partial answer
      </ChatMessage>
    )
    const end = container.querySelector('[data-slot="chat-message-end"]')!
    expect(end).toHaveTextContent("// cut off // stopped")
    expect(end.className).toContain("type-overline")
  })

  it("puts actions under the message: hidden from a fine pointer until hover or focus, always on touch", () => {
    const { container } = render(
      <ChatMessage role="agent" meta="General // 14:03" actions={<button type="button">Copy</button>}>
        Done.
      </ChatMessage>
    )
    const actions = container.querySelector('[data-slot="chat-message-actions"]')!
    for (const c of ["pointer-fine:opacity-0", "group-hover/message:opacity-100", "group-focus-within/message:opacity-100"]) expect(actions.className).toContain(c)
    expect(screen.getByRole("article").className).toContain("group/message")
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument()
  })

  it("lets a part of the meta be a button, in the overline's own ink", () => {
    render(
      <ChatMessage
        role="agent"
        meta={
          <>
            <ChatMessageMetaButton aria-label="Answered by General. Show details.">General</ChatMessageMetaButton>
            {" // 14:03 // cloud"}
          </>
        }
      >
        Done.
      </ChatMessage>
    )
    const button = screen.getByRole("button", { name: "Answered by General. Show details." })
    expect(button).toHaveAttribute("type", "button")
    expect(button.className).toContain("type-overline")
    expect(button.className).toContain("text-inherit")
    expect(button.className).toContain("hit-area")
    expect(button.closest('[data-slot="chat-message-meta"]')).toHaveTextContent("General // 14:03 // cloud")
  })
})
