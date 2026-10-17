import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CodeDisplay, CodeDisplayList, groupCode, spellCode } from "./code-display"

const base = { issuer: "GitHub", account: "sean", code: "482917", next: "330558", period: 30, expiresAt: 1000 }
const at = (secondsLeft: number) => ({ ...base, now: 1000 - secondsLeft })
const root = () => document.querySelector('[data-slot="code-display"]') as HTMLElement
const live = () => document.querySelector('[data-slot="code-display-live"]') as HTMLElement

afterEach(() => {
  vi.useRealTimers()
})

describe("grouping and spelling", () => {
  it("groups 6 as 3+3, 8 as 4+4, Steam 5 as one group", () => {
    expect(groupCode("482917")).toEqual(["482", "917"])
    expect(groupCode("48291733")).toEqual(["4829", "1733"])
    expect(groupCode("BCDFG")).toEqual(["BCDFG"])
  })
  it("spells one character at a time with a comma at the group break", () => {
    expect(spellCode("482917")).toBe("4 8 2, 9 1 7")
    expect(spellCode("BCDFG")).toBe("B C D F G")
  })
})

describe("CodeDisplay thresholds (test 1)", () => {
  it("shows next at 10 s, expiring at 5 s, and rolls over at 0", () => {
    const { rerender } = render(<CodeDisplay {...at(11)} />)
    expect(document.querySelector('[data-slot="code-display-next"]')).toBeNull()
    expect(root()).toHaveAttribute("data-state", "default")

    rerender(<CodeDisplay {...at(10)} />)
    expect(document.querySelector('[data-slot="code-display-next"]')).toBeInTheDocument()
    expect(root()).toHaveAttribute("data-state", "default")

    rerender(<CodeDisplay {...at(5)} />)
    expect(root()).toHaveAttribute("data-state", "expiring")

    // Rollover: the host hands over the next code as the current one, with a fresh period.
    rerender(<CodeDisplay {...base} code="330558" next="771234" now={1000} expiresAt={1030} />)
    const groups = within(root()).getAllByText(/^(330|558)$/)
    expect(groups.map((g) => g.textContent)).toEqual(["330", "558"])
    expect(document.querySelector('[data-slot="code-display-next"]')).toBeNull()
    expect(root()).toHaveAttribute("data-state", "default")
  })

  it("calls onHaptic once when the code enters the expiring state", () => {
    const onHaptic = vi.fn()
    const { rerender } = render(<CodeDisplay {...at(6)} onHaptic={onHaptic} />)
    expect(onHaptic).not.toHaveBeenCalled()
    rerender(<CodeDisplay {...at(5)} onHaptic={onHaptic} />)
    rerender(<CodeDisplay {...at(4)} onHaptic={onHaptic} />)
    rerender(<CodeDisplay {...at(1)} onHaptic={onHaptic} />)
    expect(onHaptic).toHaveBeenCalledTimes(1)
  })
})

describe("copy (test 2)", () => {
  it("copies the current code at 4 s and the next code at 2 s, and says so", async () => {
    const onCopy = vi.fn()
    const { rerender } = render(<CodeDisplay {...at(4)} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    })
    expect(onCopy).toHaveBeenLastCalledWith("482917", "code")
    expect(live()).toHaveTextContent("Copied. Clipboard clears in 30 seconds.")

    rerender(<CodeDisplay {...at(2)} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy the next code" }))
    })
    expect(onCopy).toHaveBeenLastCalledWith("330558", "next")
    expect(live()).toHaveTextContent("Copied the next code. Clipboard clears in 30 seconds.")
    expect(root()).toHaveAttribute("data-copied", "next")
  })

  it("Enter on the row copies; the countdown runs on the copy control and clears once", async () => {
    vi.useFakeTimers()
    const onCopy = vi.fn()
    const onClear = vi.fn()
    render(<CodeDisplay {...at(20)} clipboardTimer={10} onCopy={onCopy} onClipboardClear={onClear} />)
    await act(async () => {
      fireEvent.keyDown(root(), { key: "Enter" })
    })
    expect(onCopy).toHaveBeenCalledWith("482917", "code")
    const copyButton = screen.getByRole("button", { name: "Copy code" })
    expect(copyButton).toHaveTextContent("10")
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onClear).toHaveBeenCalledTimes(1)
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(onClear).toHaveBeenCalledTimes(1)
  })
})

describe("accessible label (test 3)", () => {
  it("spells each digit, never the contiguous code, and says the seconds left", () => {
    render(<CodeDisplay {...at(18)} />)
    const label = root().getAttribute("aria-label") ?? ""
    expect(label).toBe("Code for GitHub, sean: 4 8 2, 9 1 7. 18 seconds left.")
    expect(label).not.toContain("482917")
  })

  it("refreshes the label on rollover and at the expiring threshold, not every second", () => {
    const { rerender } = render(<CodeDisplay {...at(18)} />)
    rerender(<CodeDisplay {...at(17)} />)
    expect(root().getAttribute("aria-label")).toContain("18 seconds left")
    rerender(<CodeDisplay {...at(5)} />)
    expect(root().getAttribute("aria-label")).toContain("5 seconds left")
  })
})

describe("rollover announcements in a list (test 4)", () => {
  const list = (step: number) => (
    <CodeDisplayList>
      {Array.from({ length: 10 }, (_, i) => (
        <CodeDisplay key={i} issuer={`Issuer${i}`} code={String(100000 + step * 1000 + i)} next={String(200000 + i)} period={30} expiresAt={1000 + step * 30} now={990 + step * 30} />
      ))}
    </CodeDisplayList>
  )

  it("stays silent with none focused, and announces only the focused one", () => {
    const { rerender } = render(list(0))
    rerender(list(1))
    expect(live()).toHaveTextContent("")

    const third = document.querySelectorAll('[data-slot="code-display"]')[3] as HTMLElement
    act(() => third.focus())
    fireEvent.focus(third)
    rerender(list(2))
    expect(live()).toHaveTextContent("New code for Issuer3: 1 0 2, 0 0 3")
    expect(live().textContent).not.toContain("Issuer4")
    expect(document.querySelectorAll('[data-slot="code-display-live"]')).toHaveLength(1)
  })
})

describe("HOTP (test 5)", () => {
  it("draws no ring; Next code calls onAdvance once per activation and is disabled while pending", async () => {
    let resolve!: () => void
    const onAdvance = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    render(<CodeDisplay variant="hotp" issuer="Router" counter={41} code="482917" onAdvance={onAdvance} />)
    expect(document.querySelector('[data-slot="code-display-timer"]')).toBeNull()
    expect(root().getAttribute("aria-label")).not.toContain("seconds left")
    const button = screen.getByRole("button", { name: "Next code" })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(onAdvance).toHaveBeenCalledTimes(1)
    expect(button).toBeDisabled()
    await act(async () => {
      fireEvent.click(button)
    })
    expect(onAdvance).toHaveBeenCalledTimes(1)
    await act(async () => {
      resolve()
    })
    expect(button).not.toBeDisabled()
  })
})

describe("host contract: copy by id, HOTP advance", () => {
  it("a host that copies by id may ignore the value and act on which alone", async () => {
    const copiedById: string[] = []
    const onCopy = async (_value: string, which: "code" | "next") => {
      copiedById.push(which)
    }
    const { rerender } = render(<CodeDisplay {...at(20)} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    })
    rerender(<CodeDisplay {...at(2)} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy the next code" }))
    })
    expect(copiedById).toEqual(["code", "next"])
    expect(root()).toHaveAttribute("data-copied", "next")
  })

  it("a rejected onCopy starts no countdown and says nothing", async () => {
    const onCopy = vi.fn(() => Promise.reject(new Error("clipboard busy")))
    render(<CodeDisplay {...at(20)} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy code" }))
    })
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(root()).not.toHaveAttribute("data-copied")
    expect(live()).toHaveTextContent("")
  })

  it("HOTP: copy waits while an advance is pending, so the code copied is the code drawn", async () => {
    let resolve!: () => void
    const onAdvance = vi.fn(() => new Promise<void>((r) => (resolve = r)))
    const onCopy = vi.fn()
    const { rerender } = render(<CodeDisplay variant="hotp" issuer="Router" counter={41} code="482917" onAdvance={onAdvance} onCopy={onCopy} />)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Next code" }))
    })
    const copy = screen.getByRole("button", { name: "Copy code" })
    await act(async () => {
      fireEvent.click(copy)
    })
    await act(async () => {
      fireEvent.keyDown(root(), { key: "Enter" })
    })
    expect(onCopy).not.toHaveBeenCalled()
    rerender(<CodeDisplay variant="hotp" issuer="Router" counter={42} code="105263" onAdvance={onAdvance} onCopy={onCopy} />)
    await act(async () => {
      resolve()
    })
    await act(async () => {
      fireEvent.click(copy)
    })
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onCopy).toHaveBeenCalledWith("105263", "code")
  })
})

describe("states", () => {
  it("concealed shows dots and the first Enter reveals for this code", () => {
    render(<CodeDisplay {...at(20)} concealed />)
    expect(root()).toHaveAttribute("data-state", "concealed")
    expect(root().getAttribute("aria-label")).toContain("hidden")
    expect(within(root()).queryByText("482")).toBeNull()
    fireEvent.keyDown(root(), { key: "Enter" })
    expect(root()).toHaveAttribute("data-state", "default")
    expect(within(root()).getByText("482")).toBeInTheDocument()
  })

  it("shows the clock notice past ±15 s with Fix clock", () => {
    const onFixClock = vi.fn()
    const { rerender } = render(<CodeDisplay {...at(20)} skewSeconds={10} onFixClock={onFixClock} />)
    expect(document.querySelector('[data-slot="code-display-notice"]')).toBeNull()
    rerender(<CodeDisplay {...at(20)} skewSeconds={-42} onFixClock={onFixClock} />)
    expect(screen.getByText(/Clock is off by 42 s/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Fix clock" }))
    expect(onFixClock).toHaveBeenCalledTimes(1)
  })

  it("error draws no digits; loading draws skeletons", () => {
    const { rerender } = render(<CodeDisplay {...at(20)} error="unsupported algorithm" />)
    expect(root()).toHaveAttribute("data-state", "error")
    expect(screen.getByText(/Can't make a code: unsupported algorithm/)).toBeInTheDocument()
    expect(within(root()).queryByText("482")).toBeNull()
    rerender(<CodeDisplay {...at(20)} loading />)
    expect(root()).toHaveAttribute("data-state", "loading")
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)
  })

  it("Steam renders five uppercase characters as one group; 8 digits as 4+4", () => {
    const { rerender } = render(<CodeDisplay variant="steam" code="bcdfg" period={30} expiresAt={1000} now={980} />)
    expect(within(root()).getByText("BCDFG")).toBeInTheDocument()
    rerender(<CodeDisplay digits={8} code="48291733" period={30} expiresAt={1000} now={980} />)
    expect(within(root()).getByText("4829")).toBeInTheDocument()
    expect(within(root()).getByText("1733")).toBeInTheDocument()
  })

  it("reduced motion skips the rollover crossfade", () => {
    const original = window.matchMedia
    window.matchMedia = ((q: string) => ({ ...original(q), matches: q.includes("reduced-motion") })) as typeof window.matchMedia
    try {
      const { rerender } = render(<CodeDisplay {...at(20)} />)
      rerender(<CodeDisplay {...base} code="330558" next="771234" now={1000} expiresAt={1030} />)
      expect(document.querySelector('[data-slot="code-display-code"]')).not.toHaveAttribute("data-rolling")
    } finally {
      window.matchMedia = original
    }
    const { rerender } = render(<CodeDisplay {...at(20)} issuer="Motion" />)
    rerender(<CodeDisplay {...base} issuer="Motion" code="330558" next="771234" now={1000} expiresAt={1030} />)
    const codes = document.querySelectorAll('[data-slot="code-display-code"]')
    expect(codes[codes.length - 1]).toHaveAttribute("data-rolling", "true")
  })
})
