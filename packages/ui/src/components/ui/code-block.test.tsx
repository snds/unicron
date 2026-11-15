import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { COPIED_FOR_MS, CodeBlock, CopyButton, copyButtonCopy } from "./code-block"

const ARGS = `{ "repo": "snds/lockdown", "branch": "claude/opaque-login", "force": false }`

let writeText: ReturnType<typeof vi.fn>
beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve())
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
})
afterEach(() => {
  vi.useRealTimers()
})

describe("CodeBlock", () => {
  it("is a figure: a mono caps label and a copy button over the code, on a raised hairline box", () => {
    const { container } = render(<CodeBlock label="What the agent wrote // not checked" code={ARGS} />)
    const figure = screen.getByRole("figure", { name: "What the agent wrote // not checked" })
    for (const c of ["bg-surface-raised", "rule-box", "rounded-lg"]) expect(figure.className).toContain(c)
    const header = container.querySelector('[data-slot="code-block-header"]')!
    expect(header.tagName).toBe("FIGCAPTION")
    expect(header.className).toContain("rule-b")
    expect(header.querySelector(".type-overline")).toHaveTextContent("What the agent wrote // not checked")
    expect(screen.getByRole("button", { name: "Copy code" })).toBeInTheDocument()
  })

  it("shows the code as text, exactly, in the code role; it scrolls sideways and takes focus", () => {
    render(<CodeBlock label="src/auth.ts:42" code={"<script>alert(1)</script>\n  const x = 1"} />)
    const code = screen.getByRole("group", { name: "src/auth.ts:42" })
    expect(code.tagName).toBe("PRE")
    expect(code).toHaveAttribute("tabindex", "0")
    expect(code.className).toContain("type-code-inline")
    expect(code.className).toContain("overflow-x-auto")
    expect(code.className).toContain("whitespace-pre")
    expect(code.textContent).toBe("<script>alert(1)</script>\n  const x = 1")
    expect(code.querySelector("script")).toBeNull()
  })

  it("wraps long lines when asked, labels itself from the language, and can leave out copy", () => {
    const { rerender } = render(<CodeBlock language="shell" code="pnpm --filter @unicron/ui test" wrap copy={false} />)
    const code = screen.getByRole("group", { name: "shell" })
    expect(code.className).toContain("whitespace-pre-wrap")
    expect(screen.queryByRole("button")).toBeNull()
    rerender(<CodeBlock code="exit 1" copy={false} />)
    expect(screen.getByRole("group", { name: "Code" })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="code-block-header"]')).toBeNull()
  })

  it("copies the code with its button", async () => {
    render(<CodeBlock label="SSH key // ED25519" code="ssh-ed25519 AAAAC3Nz… mira@vale" />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy code" })))
    expect(writeText).toHaveBeenCalledWith("ssh-ed25519 AAAAC3Nz… mira@vale")
  })
})

describe("CopyButton", () => {
  it('shows "Copied" for two seconds, says it once, and raises no toast', async () => {
    vi.useFakeTimers()
    const onCopied = vi.fn()
    render(<CopyButton text="Login now runs a two-message handshake." onCopied={onCopied} />)
    const button = screen.getByRole("button", { name: copyButtonCopy.copy })
    expect(button.className).toContain("size-8")
    await act(async () => fireEvent.click(button))
    expect(onCopied).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: copyButtonCopy.copied })).toHaveAttribute("data-state", "copied")
    expect(screen.getByRole("button").querySelector('[data-icon-name="checkmark"]')).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
    act(() => vi.advanceTimersByTime(COPIED_FOR_MS))
    expect(screen.getByRole("button", { name: copyButtonCopy.copy })).toHaveAttribute("data-state", "idle")
    expect(screen.getByRole("status")).toHaveTextContent("")
    expect(COPIED_FOR_MS).toBe(2000)
  })

  it("reads the text at the moment of the press", async () => {
    const read = vi.fn(() => "the newest text")
    render(<CopyButton text={read} label="Copy reply" />)
    expect(read).not.toHaveBeenCalled()
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy reply" })))
    expect(read).toHaveBeenCalledTimes(1)
    expect(writeText).toHaveBeenCalledWith("the newest text")
  })

  it("says it could not copy when the clipboard refuses", async () => {
    writeText.mockImplementation(() => Promise.reject(new Error("denied")))
    const onCopyError = vi.fn()
    render(<CopyButton text="x" onCopyError={onCopyError} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy" })))
    expect(onCopyError).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: copyButtonCopy.failed })).toHaveAttribute("data-state", "failed")
  })
})
