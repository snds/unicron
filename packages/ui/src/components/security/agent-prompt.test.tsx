import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AGENT_PROMPT_REPLY, AgentPrompt, agentPromptKeys, agentPromptLayout, formatPromptCountdown } from "./agent-prompt"

const key = (k: string, target: Element = document.body) =>
  fireEvent.keyDown(target, { key: k })

describe("AgentPrompt", () => {
  it("owns its title words, and is a region named by them", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}}>Run pnpm install in the sandbox</AgentPrompt>)
    expect(screen.getByRole("region", { name: "Allow?" })).toHaveAttribute("data-kind", "permission")
    expect(screen.getByText("Run pnpm install in the sandbox")).toBeInTheDocument()
  })

  it("draws two or three short options as buttons: the safe one solid in the yellow's ink, the rest text", () => {
    const onAnswer = vi.fn()
    const { container } = render(<AgentPrompt kind="permission" onAnswer={onAnswer} />)
    expect(container.querySelector('[data-layout="buttons"]')).toBeInTheDocument()
    // Cross-app decisions §2: the safe answer (Deny) is the one solid button, and comes first.
    const deny = screen.getByRole("button", { name: /Deny/ })
    expect(deny).toHaveAttribute("data-variant", "needs-you")
    expect(deny).toHaveAttribute("data-safe")
    expect(deny.className).toContain("bg-needs-you-on-fill")
    // The other option is a text button on the yellow: no fill, no edge.
    const allow = screen.getByRole("button", { name: /Allow once/ })
    expect(allow).toHaveAttribute("data-variant", "needs-you-text")
    expect(allow.className).not.toMatch(/(^| )bg-needs-you-on-fill( |$)/)
    expect(deny.compareDocumentPosition(allow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
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
    // Each row is a button whose title and detail wrap; nothing is cut.
    const title = rows.querySelector('[data-slot="agent-prompt-option-title"]')!
    expect(title.className).toContain("break-words")
    expect(title.className).not.toMatch(/truncate|line-clamp-\d/)
    expect(screen.getByRole("button", { name: /Patch it/ })).toHaveTextContent("The smallest change that fixes the test")
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

  it("shows key hints only with a fine pointer, each the key of its meaning", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}} />)
    const kbd = screen.getByRole("button", { name: /Allow once/ }).querySelector('[data-slot="kbd"]')!
    expect(kbd.textContent).toBe("Y")
    expect(kbd.className).toContain("hidden")
    expect(kbd.className).toContain("pointer-fine:inline-flex")
    expect(screen.getByRole("button", { name: /Deny/ }).querySelector('[data-slot="kbd"]')!.textContent).toBe("N")
  })

  describe("deadline", () => {
    afterEach(() => vi.useRealTimers())
    const T = 1_700_000_000_000

    it("counts down to the safe answer: the time on screen, the safe answer in the name", () => {
      vi.useFakeTimers({ now: T })
      render(<AgentPrompt kind="permission" expiresAt={T + 65_000} safeAnswer="deny" onAnswer={() => {}} />)
      const timer = screen.getByRole("timer")
      // Cross-app decisions §13: MM:SS with a leading zero.
      expect(timer).toHaveTextContent("01:05")
      expect(timer).toHaveAccessibleName("Deny in 01:05")
      act(() => vi.advanceTimersByTime(5_000))
      expect(screen.getByRole("timer")).toHaveTextContent("01:00")
      // Under a minute: NN S.
      act(() => vi.advanceTimersByTime(15_000))
      expect(screen.getByRole("timer")).toHaveTextContent("45 S")
      expect(screen.getByRole("timer")).toHaveAccessibleName("Deny in 45 S")
    })

    it("answers itself with the safe answer, once, and marks it", () => {
      vi.useFakeTimers({ now: T })
      const onAnswer = vi.fn()
      render(<AgentPrompt kind="permission" expiresAt={T + 2_000} safeAnswer="deny" onAnswer={onAnswer} />)
      act(() => vi.advanceTimersByTime(3_000))
      expect(onAnswer).toHaveBeenCalledTimes(1)
      expect(onAnswer).toHaveBeenCalledWith("deny")
      const region = screen.getByRole("region")
      expect(region).toHaveAttribute("data-expired")
      expect(region).toHaveAttribute("data-answered")
      expect(screen.getByRole("button", { name: /Deny/ })).toHaveAttribute("aria-pressed", "true")
      expect(screen.getByRole("timer")).toHaveAccessibleName("Timed out")
      act(() => vi.advanceTimersByTime(3_000))
      expect(onAnswer).toHaveBeenCalledTimes(1)
    })

    it("lets a host whose server answers on its own take the expiry instead", () => {
      vi.useFakeTimers({ now: T })
      const onAnswer = vi.fn()
      const onExpire = vi.fn()
      render(<AgentPrompt kind="permission" expiresAt={T + 1_000} safeAnswer="deny" onAnswer={onAnswer} onExpire={onExpire} />)
      act(() => vi.advanceTimersByTime(2_000))
      expect(onExpire).toHaveBeenCalledTimes(1)
      expect(onAnswer).not.toHaveBeenCalled()
    })

    it("draws no timer without a safe answer, and none once answered", () => {
      const { rerender } = render(<AgentPrompt kind="permission" expiresAt={Date.now() + 60_000} onAnswer={() => {}} />)
      expect(screen.queryByRole("timer")).toBeNull()
      rerender(<AgentPrompt kind="permission" expiresAt={Date.now() + 60_000} safeAnswer="deny" answer="allow" onAnswer={() => {}} />)
      expect(screen.queryByRole("timer")).toBeNull()
    })
  })

  describe("reply", () => {
    it("takes words: Enter sends them, Shift+Enter doesn't", () => {
      const onAnswer = vi.fn()
      render(<AgentPrompt kind="reply" options={[{ id: "deny", label: "Deny" }]} onAnswer={onAnswer}>Which branch?</AgentPrompt>)
      expect(screen.getByRole("region", { name: "Reply" })).toHaveAttribute("data-kind", "reply")
      const field = screen.getByRole("textbox", { name: "Your answer" })
      expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled()
      fireEvent.change(field, { target: { value: "  main  " } })
      fireEvent.keyDown(field, { key: "Enter", shiftKey: true })
      expect(onAnswer).not.toHaveBeenCalled()
      fireEvent.keyDown(field, { key: "Enter" })
      expect(onAnswer).toHaveBeenCalledWith(AGENT_PROMPT_REPLY, "main")
    })

    it("keeps its other ways out as options, and typing never answers them by key", () => {
      const onAnswer = vi.fn()
      render(<AgentPrompt kind="reply" options={[{ id: "deny", label: "Deny" }]} onAnswer={onAnswer} />)
      const field = screen.getByRole("textbox", { name: "Your answer" })
      key("1", field)
      key("n", field)
      expect(onAnswer).not.toHaveBeenCalled()
      key("1")
      expect(onAnswer).toHaveBeenCalledWith("deny")
    })

    it("once sent, keeps the words, read-only, and the send button checked", () => {
      render(<AgentPrompt kind="reply" answer={AGENT_PROMPT_REPLY} onAnswer={() => {}} />)
      expect(screen.getByRole("textbox", { name: "Your answer" })).toHaveAttribute("readonly")
      expect(screen.getByRole("button", { name: /Send/ })).toHaveAttribute("aria-pressed", "true")
    })
  })

  describe("sending and failed", () => {
    it("while sending, the chosen option spins, the rest can't be picked, and the edge still waits", () => {
      const onAnswer = vi.fn()
      render(<AgentPrompt kind="permission" answer="allow" pending onAnswer={onAnswer} />)
      const region = screen.getByRole("region")
      expect(region).toHaveAttribute("data-pending")
      expect(region).not.toHaveAttribute("data-answered")
      expect(screen.getByRole("status", { name: "Sending" })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /Deny/ })).toBeDisabled()
      key("n")
      expect(onAnswer).not.toHaveBeenCalled()
    })

    it("says why sending failed, and can be answered again", () => {
      const onAnswer = vi.fn()
      render(<AgentPrompt kind="permission" error="Couldn't send. Try again." onAnswer={onAnswer} />)
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't send. Try again.")
      fireEvent.click(screen.getByRole("button", { name: /Allow/ }))
      expect(onAnswer).toHaveBeenCalledWith("allow")
    })
  })
})

describe("AgentPrompt in the needs-you look (2026-11)", () => {
  it("is the yellow field while it waits, with the yellow's ink and its focus ring", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}}>Run pnpm install in the sandbox</AgentPrompt>)
    const region = screen.getByRole("region", { name: "Allow?" })
    expect(region.className).toContain("bg-needs-you-fill")
    expect(region.className).toContain("text-needs-you-on-fill")
    // Controls inside draw their focus ring in the yellow's ink.
    expect(region.className).toContain("on-needs-you")
    // The title is a mono caps overline.
    expect(region.querySelector("h3")!.className).toContain("type-overline")
  })

  it("turns quiet once answered: the raised surface, a hairline, no yellow", () => {
    render(<AgentPrompt kind="permission" answer="deny" onAnswer={() => {}} />)
    const region = screen.getByRole("region")
    expect(region.className).not.toContain("bg-needs-you-fill")
    expect(region.className).toContain("bg-surface-raised")
    expect(region.className).toContain("rule-box")
    expect(screen.getByRole("button", { name: /Deny/ })).toHaveAttribute("data-variant", "secondary")
  })

  it("moves focus to the safe answer when it arrives and nothing else has focus", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}} />)
    expect(screen.getByRole("button", { name: /Deny/ })).toHaveFocus()
  })

  it("leaves focus where it is when the person is busy elsewhere, or when told not to move it", () => {
    const { unmount } = render(
      <>
        <input aria-label="Message" autoFocus />
        <AgentPrompt kind="permission" onAnswer={() => {}} />
      </>
    )
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveFocus()
    unmount()
    render(<AgentPrompt kind="permission" autoFocus={false} onAnswer={() => {}} />)
    expect(screen.getByRole("button", { name: /Deny/ })).not.toHaveFocus()
  })

  it("marks the host's safe option solid, wherever it sits, and keys by meaning, not by place", () => {
    const onAnswer = vi.fn()
    render(
      <AgentPrompt
        kind="permission"
        onAnswer={onAnswer}
        options={[
          { id: "deny", label: "Deny", safe: true },
          { id: "once", label: "Allow once" },
          { id: "always", label: "Always for Lockdown", key: "3" },
        ]}
      />
    )
    expect(screen.getByRole("button", { name: /^Deny/ })).toHaveAttribute("data-variant", "needs-you")
    expect(screen.getByRole("button", { name: /Allow once/ })).toHaveAttribute("data-variant", "needs-you-text")
    // Y allows once and N denies, though Deny is first on screen.
    key("y")
    expect(onAnswer).toHaveBeenLastCalledWith("once")
    key("n")
    expect(onAnswer).toHaveBeenLastCalledWith("deny")
  })

  it("takes the safe option from safeAnswer too, and makes it the solid one", () => {
    render(
      <AgentPrompt
        kind="choice"
        safeAnswer="skip"
        onAnswer={() => {}}
        options={[
          { id: "run", label: "Run it" },
          { id: "skip", label: "Skip" },
        ]}
      />
    )
    expect(screen.getByRole("button", { name: /Skip/ })).toHaveAttribute("data-variant", "needs-you")
    expect(screen.getByRole("button", { name: /Run it/ })).toHaveAttribute("data-variant", "needs-you-text")
  })

  it("names itself from the host's overline, and says when more wait", () => {
    render(<AgentPrompt kind="reply" overline="Question" more={1} onAnswer={() => {}} />)
    const region = screen.getByRole("region", { name: "Question" })
    expect(region).toHaveTextContent("// +1")
  })

  it("keeps an open question's send button solid, with the host's word, and focuses the field", () => {
    render(<AgentPrompt kind="reply" sendLabel="Reply" options={[{ id: "deny", label: "Deny" }]} onAnswer={() => {}} />)
    expect(screen.getByRole("button", { name: /Reply/ })).toHaveAttribute("data-variant", "needs-you")
    expect(screen.getByRole("button", { name: /Deny/ })).toHaveAttribute("data-variant", "needs-you-text")
    expect(screen.getByRole("textbox", { name: "Your answer" })).toHaveFocus()
  })

  it("keeps a long question in six lines of the body role, scrolling inside", () => {
    const { container } = render(<AgentPrompt kind="permission" onAnswer={() => {}}>Run pnpm install</AgentPrompt>)
    const body = container.querySelector('[data-slot="agent-prompt-body"]')!
    expect(body.className).toContain("type-body")
    expect(body.className).toContain("max-h-[calc(var(--type-body-leading)*6)]")
    expect(body.className).toContain("overflow-y-auto")
  })

  it("says a failed send in the yellow's ink, with a warning glyph", () => {
    render(<AgentPrompt kind="permission" error="That call is no longer waiting." onAnswer={() => {}} />)
    const alert = screen.getByRole("alert")
    expect(alert.className).toContain("text-needs-you-on-fill")
    expect(alert.querySelector('[data-icon-name="warning--alt"]')).toBeInTheDocument()
  })
})

describe("formatPromptCountdown", () => {
  it("writes MM:SS with a leading zero, then NN S under a minute (decisions §13)", () => {
    expect(formatPromptCountdown(28 * 60_000 + 14_000)).toBe("28:14")
    expect(formatPromptCountdown(65_000)).toBe("01:05")
    expect(formatPromptCountdown(60_000)).toBe("01:00")
    expect(formatPromptCountdown(45_000)).toBe("45 S")
    expect(formatPromptCountdown(4_200)).toBe("05 S")
    expect(formatPromptCountdown(0)).toBe("00 S")
  })
})

describe("AgentPrompt keys by meaning (contract 5.1c C15, Warpcore NA4)", () => {
  const warpcore = [
    { id: "deny", label: "Deny", safe: true },
    { id: "once", label: "Allow once" },
    { id: "always", label: "Always for Lockdown", key: "3" },
  ]

  it("each option names its key: Y allows once, N denies, 3 allows always, wherever they sit", () => {
    const onAnswer = vi.fn()
    // Always first on screen, Deny last: the keys follow the meaning, not the order.
    const { unmount } = render(<AgentPrompt kind="permission" onAnswer={onAnswer} options={[warpcore[2], warpcore[1], warpcore[0]]} />)
    key("3")
    expect(onAnswer).toHaveBeenLastCalledWith("always")
    key("y")
    expect(onAnswer).toHaveBeenLastCalledWith("once")
    key("n")
    expect(onAnswer).toHaveBeenLastCalledWith("deny")
    unmount()
  })

  it("a digit an option claims answers that option, never the one in that place", () => {
    const onAnswer = vi.fn()
    render(<AgentPrompt kind="permission" onAnswer={onAnswer} options={[warpcore[2], warpcore[0], warpcore[1]]} />)
    // "1" would be Always by place; no option claims 1, and every option has a key by meaning, so 1 does nothing.
    key("1")
    expect(onAnswer).not.toHaveBeenCalled()
    key("2")
    expect(onAnswer).not.toHaveBeenCalled()
    key("3")
    expect(onAnswer).toHaveBeenCalledWith("always")
  })

  it("agentPromptKeys: own keys first; yes and no by meaning; place only for options with no key, never a claimed digit", () => {
    expect(agentPromptKeys(warpcore, "permission", "deny")).toEqual(["n", "y", "3"])
    expect(agentPromptKeys([warpcore[2], warpcore[1], warpcore[0]], "permission", "deny")).toEqual(["3", "y", "n"])
    // A choice: numbered by place, except a digit another option claims.
    const choice = [
      { id: "a", label: "Patch it" },
      { id: "b", label: "Rewrite it", key: "1" },
      { id: "c", label: "Leave it" },
    ]
    expect(agentPromptKeys(choice, "choice")).toEqual([undefined, "1", "3"])
    expect(agentPromptKeys([{ id: "a", label: "A" }, { id: "b", label: "B" }], "choice")).toEqual(["1", "2"])
  })

  it("shows each option's own key as its hint", () => {
    render(<AgentPrompt kind="permission" onAnswer={() => {}} options={warpcore} />)
    const hint = (name: RegExp) => screen.getByRole("button", { name }).querySelector('[data-slot="kbd"]')?.textContent
    expect(hint(/^Deny/)).toBe("N")
    expect(hint(/Allow once/)).toBe("Y")
    expect(hint(/Always for Lockdown/)).toBe("3")
  })
})

describe("AgentPrompt layout=\"inline\" (contract 5.1c C15)", () => {
  const phone = () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 })
    window.dispatchEvent(new Event("resize"))
  }
  afterEach(() => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 })
    window.dispatchEvent(new Event("resize"))
  })

  it("by default a phone gets an Answer button and a sheet", async () => {
    phone()
    render(<AgentPrompt kind="permission" onAnswer={() => {}} />)
    // The newest prompt's sheet opens by itself, so the page under it is hidden from the tree.
    expect(document.querySelector('[data-slot="agent-prompt"]')).toHaveAttribute("data-layout", "sheet")
    expect(document.querySelector('[data-slot="agent-prompt-sheet"]')).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Answer", hidden: true })).toBeInTheDocument()
  })

  it("inline: on a phone the options show in place, with no Answer button and no sheet", () => {
    phone()
    const onAnswer = vi.fn()
    render(<AgentPrompt kind="permission" layout="inline" onAnswer={onAnswer} options={[{ id: "deny", label: "Deny", safe: true }, { id: "once", label: "Allow once" }, { id: "always", label: "Always for Lockdown", key: "3" }]} />)
    expect(screen.getByRole("region")).toHaveAttribute("data-layout", "inline")
    expect(screen.queryByRole("button", { name: "Answer" })).toBeNull()
    expect(document.querySelector('[data-slot="agent-prompt-sheet"]')).toBeNull()
    // In place, on the yellow: the safe answer solid, the rest text.
    expect(screen.getByRole("button", { name: /^Deny/ })).toHaveAttribute("data-variant", "needs-you")
    expect(screen.getByRole("button", { name: /Allow once/ })).toHaveAttribute("data-variant", "needs-you-text")
    fireEvent.click(screen.getByRole("button", { name: /Always for Lockdown/ }))
    expect(onAnswer).toHaveBeenCalledWith("always")
  })

  it("inline on a phone: the safe answer takes focus on arrival; a reply's field does not (no keyboard springs up)", async () => {
    phone()
    const { unmount } = render(<AgentPrompt kind="permission" layout="inline" onAnswer={() => {}} />)
    await vi.waitFor(() => expect(screen.getByRole("button", { name: /^Deny/ })).toHaveFocus())
    unmount()
    ;(document.activeElement as HTMLElement | null)?.blur()
    render(<AgentPrompt kind="reply" layout="inline" onAnswer={() => {}} />)
    await act(async () => {})
    expect(screen.getByRole("textbox", { name: "Your answer" })).not.toHaveFocus()
  })

  it("on a desktop inline and the default draw alike", () => {
    render(<AgentPrompt kind="continue" layout="inline" onAnswer={() => {}} />)
    expect(screen.getByRole("region")).toHaveAttribute("data-layout", "inline")
    expect(screen.queryByRole("button", { name: "Answer" })).toBeNull()
  })
})

