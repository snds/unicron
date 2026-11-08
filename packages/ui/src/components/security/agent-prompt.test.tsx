import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { AgentPrompt, agentPromptLayout } from "./agent-prompt"

const key = (k: string, target: Element = document.body) =>
  fireEvent.keyDown(target, { key: k })

describe("AgentPrompt", () => {
  it("owns its title words, and is a region named by them", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}}>Run pnpm install in the sandbox</AgentPrompt>)
    expect(screen.getByRole("region", { name: "Allow?" })).toHaveAttribute("data-kind", "permission")
    expect(screen.getByText("Run pnpm install in the sandbox")).toBeInTheDocument()
  })

  it("draws two or three short options as buttons, the first primary", () => {
    const onAnswer = vi.fn()
    const { container } = render(<AgentPrompt kind="permission" onAnswer={onAnswer} />)
    expect(container.querySelector('[data-layout="buttons"]')).toBeInTheDocument()
    const allow = screen.getByRole("button", { name: /Allow/ })
    expect(allow.className).toContain("bg-primary")
    expect(screen.getByRole("button", { name: /Deny/ }).className).toContain("border-border bg-background")
    fireEvent.click(allow)
    expect(onAnswer).toHaveBeenCalledWith("allow")
  })

  it("turns long or detailed options into numbered rows that never truncate", () => {
    expect(agentPromptLayout([{ id: "a", label: "Yes" }, { id: "b", label: "No" }])).toBe("buttons")
    expect(agentPromptLayout([{ id: "a", label: "A" }, { id: "b", label: "B" }, { id: "c", label: "C" }, { id: "d", label: "D" }])).toBe("rows")
    expect(agentPromptLayout([{ id: "a", label: "Rewrite the whole module from scratch" }])).toBe("rows")
    expect(agentPromptLayout([{ id: "a", label: "Patch", detail: "Smallest change" }])).toBe("rows")
    const { container } = render(
      <AgentPrompt
        kind="choice"
        onAnswer={() => {}}
        options={[
          { id: "patch", label: "Patch it", detail: "The smallest change that fixes the test" },
          { id: "rewrite", label: "Rewrite the module" },
        ]}
      />
    )
    const rows = container.querySelector('[data-layout="rows"]')!
    expect(rows.tagName).toBe("OL")
    expect(rows.querySelector('[data-slot="item-title"]')!.className).toContain("line-clamp-none")
    expect(screen.getByRole("region", { name: "Choose" })).toBeInTheDocument()
  })

  it("answers Y and N, and 1-9, when focus isn't in a text field", () => {
    const onAnswer = vi.fn()
    render(
      <>
        <input aria-label="Message" />
        <AgentPrompt kind="continue" onAnswer={onAnswer} />
      </>
    )
    key("y", screen.getByRole("textbox"))
    expect(onAnswer).not.toHaveBeenCalled()
    key("n")
    expect(onAnswer).toHaveBeenLastCalledWith("stop")
  })

  it("1-9 pick choices; Y and N mean nothing to a choice", () => {
    const onAnswer = vi.fn()
    render(
      <AgentPrompt
        kind="choice"
        onAnswer={onAnswer}
        options={[
          { id: "a", label: "First" },
          { id: "b", label: "Second" },
        ]}
      />
    )
    key("y")
    expect(onAnswer).not.toHaveBeenCalled()
    key("2")
    expect(onAnswer).toHaveBeenCalledWith("b")
  })

  it("only the newest prompt listens", () => {
    const older = vi.fn()
    const newer = vi.fn()
    render(
      <>
        <AgentPrompt kind="permission" onAnswer={older} />
        <AgentPrompt kind="permission" onAnswer={newer} />
      </>
    )
    key("y")
    expect(newer).toHaveBeenCalledWith("allow")
    expect(older).not.toHaveBeenCalled()
  })

  it("an older prompt re-rendering with new options doesn't take the keys", () => {
    const older = vi.fn()
    const newer = vi.fn()
    const opts = () => [{ id: "a", label: "A" }, { id: "b", label: "B" }]
    const { rerender } = render(
      <>
        <AgentPrompt kind="choice" options={opts()} onAnswer={older} />
        <AgentPrompt kind="choice" options={opts()} onAnswer={newer} />
      </>
    )
    rerender(
      <>
        <AgentPrompt kind="choice" options={opts()} onAnswer={older} />
        <AgentPrompt kind="choice" options={opts()} onAnswer={newer} />
      </>
    )
    key("1")
    expect(newer).toHaveBeenCalledWith("a")
    expect(older).not.toHaveBeenCalled()
  })

  it("ignores keys with a modifier, and when told not to listen", () => {
    const onAnswer = vi.fn()
    const { rerender } = render(<AgentPrompt kind="permission" onAnswer={onAnswer} />)
    fireEvent.keyDown(document.body, { key: "y", metaKey: true })
    expect(onAnswer).not.toHaveBeenCalled()
    rerender(<AgentPrompt kind="permission" onAnswer={onAnswer} listen={false} />)
    key("y")
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it("once answered, marks the answer, disables the rest and stops listening", () => {
    const onAnswer = vi.fn()
    render(<AgentPrompt kind="permission" onAnswer={onAnswer} answer="deny" />)
    expect(screen.getByRole("region")).toHaveAttribute("data-answered")
    expect(screen.getByRole("button", { name: /Deny/ })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: /Allow/ })).toBeDisabled()
    key("y")
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('says "Waiting for you" once, politely', () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}} />)
    expect(screen.getByRole("status")).toHaveTextContent("Waiting for you")
  })

  it("shows its risk tier", () => {
    render(<AgentPrompt kind="permission" tier="tolerated" verified onAnswer={() => {}} />)
    expect(screen.getByText("Use with care")).toBeInTheDocument()
  })

  it("shows key hints only with a fine pointer", () => {
    const { container } = render(<AgentPrompt kind="permission" onAnswer={() => {}} />)
    const kbd = container.querySelector('[data-slot="kbd"]')!
    expect(kbd.textContent).toBe("Y")
    expect(kbd.className).toContain("hidden")
    expect(kbd.className).toContain("pointer-fine:inline-flex")
  })
})
