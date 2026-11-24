import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AskRow } from "./ask-row"

describe("AskRow (Figma 216:787)", () => {
  const choices = [{ label: "Keep for a week", recommended: true }, { label: "Delete now" }, { label: "Keep it" }]

  it("offers the session's choices in one click, the recommended one primary", async () => {
    const onChoose = vi.fn()
    render(<AskRow question="Keep the old token file for a week?" source="Sign-in helper · Codex" choices={choices} onChoose={onChoose} />)
    expect(screen.getByRole("group", { name: "Keep the old token file for a week?" })).toHaveAttribute("data-state", "choices")
    expect(screen.getByRole("img", { name: "Needs you" })).toBeInTheDocument()
    const primary = screen.getByRole("button", { name: "Keep for a week" })
    expect(primary.className).toContain("bg-primary")
    expect(screen.getByRole("button", { name: "Delete now" }).className).toContain("inset-ring")
    await userEvent.click(screen.getByRole("button", { name: "Delete now" }))
    expect(onChoose).toHaveBeenCalledWith("Delete now")
  })

  it("is open-ended without choices: one Reply button", async () => {
    const onReply = vi.fn()
    render(<AskRow question="What should the release notes say?" replyLabel="Reply in Warpcore" onReply={onReply} />)
    await userEvent.click(screen.getByRole("button", { name: "Reply in Warpcore" }))
    expect(onReply).toHaveBeenCalled()
  })

  it("once answered, shows the answer with Done and Undo, and moves focus to Undo", () => {
    const { rerender } = render(<AskRow question="Keep it?" choices={choices} onUndo={() => {}} />)
    rerender(<AskRow question="Keep it?" choices={choices} answer="Keep for a week" onUndo={() => {}} />)
    expect(screen.getByText("Answered “Keep for a week”")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Done" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Undo" })).toHaveFocus()
    expect(screen.queryByRole("button", { name: "Delete now" })).toBeNull()
  })

  it("opens its session from the icon on the right, named for the app", async () => {
    const onOpen = vi.fn()
    render(<AskRow question="Keep it?" choices={choices} openLabel="Open in Warpcore" onOpen={onOpen} />)
    await userEvent.click(screen.getByRole("button", { name: "Open in Warpcore" }))
    expect(onOpen).toHaveBeenCalled()
  })
})
