import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { captionFor, classifyChar, LargeTypeView, nameChar, spellValue } from "./large-type-view"

const VALUE = "Tr4-9lO0_bZ2"
const secretOf = (v: string) => () => Promise.resolve(new TextEncoder().encode(v))
const canvas = () => document.querySelector('[data-slot="large-type-view-canvas"]') as HTMLElement
const groups = () => Array.from(document.querySelectorAll('[data-slot="large-type-view-group"]'))
const chars = () => Array.from(document.querySelectorAll('[data-slot="large-type-view-char"]')) as HTMLElement[]
const charOf = (ch: string) => chars().find((c) => c.firstElementChild?.textContent === ch) as HTMLElement
const captionOf = (ch: string) => charOf(ch).querySelector('[data-slot="large-type-view-caption"]')?.textContent ?? null

async function open(props: Partial<React.ComponentProps<typeof LargeTypeView>> = {}, value = VALUE) {
  const getSecret = vi.fn(secretOf(value))
  const utils = render(<LargeTypeView open getSecret={getSecret} title="Wi-Fi password · Home" {...props} />)
  await act(async () => {})
  return { ...utils, getSecret }
}

afterEach(() => {
  vi.useRealTimers()
})

describe("classification and captions (test 2)", () => {
  it("classifies digits, letters and symbols", () => {
    expect(classifyChar("4")).toBe("digit")
    expect(classifyChar("T")).toBe("letter")
    expect(classifyChar("-")).toBe("symbol")
  })
  it("auto names every symbol and every ambiguous glyph, and leaves e alone", () => {
    expect(captionFor("-", "auto")).toBe("dash")
    expect(captionFor("0", "auto")).toBe("zero")
    expect(captionFor("O", "auto")).toBe("capital O")
    expect(captionFor("l", "auto")).toBe("lowercase l")
    expect(captionFor("e", "auto")).toBeNull()
    expect(captionFor("e", "always")).toBe("lowercase e")
    expect(captionFor("e", "off")).toBeNull()
    expect(nameChar("o", false)).toBe("letter o")
  })
})

describe("groups (test 1)", () => {
  it("holds at most groupSize characters per group, for 3 and 4", async () => {
    const { unmount } = await open()
    expect(groups()).toHaveLength(4)
    for (const g of groups()) expect(g.querySelectorAll('[data-slot="large-type-view-char"]').length).toBeLessThanOrEqual(3)
    unmount()
    await open({ groupSize: 4 })
    expect(groups()).toHaveLength(3)
    for (const g of groups()) expect(g.querySelectorAll('[data-slot="large-type-view-char"]').length).toBeLessThanOrEqual(4)
  })

  it("marks each character with its class and captions the right ones in auto", async () => {
    await open({}, "Tr4-9lO0_bZ2e")
    expect(charOf("4")).toHaveAttribute("data-class", "digit")
    expect(charOf("T")).toHaveAttribute("data-class", "letter")
    expect(charOf("-")).toHaveAttribute("data-class", "symbol")
    expect(captionOf("-")).toBe("dash")
    expect(captionOf("_")).toBe("underscore")
    expect(captionOf("0")).toBe("zero")
    expect(captionOf("O")).toBe("capital O")
    expect(captionOf("l")).toBe("lowercase l")
    expect(captionOf("Z")).toBe("capital Z")
    expect(captionOf("e")).toBeNull()
    expect(captionOf("r")).toBeNull()
  })
})

describe("accessible name (test 3)", () => {
  it("spells the value per character with case and symbol names, pausing between groups", async () => {
    await open()
    expect(spellValue(VALUE, 3)).toBe("capital T, r, 4, pause, dash, 9, lowercase l, pause, capital O, zero, underscore, pause, b, capital Z, two")
    expect(canvas()).toHaveAttribute("aria-label", spellValue(VALUE, 3))
    expect(canvas()).not.toHaveAttribute("aria-live")
    expect(screen.getByRole("dialog", { name: "Wi-Fi password · Home" })).toBeInTheDocument()
  })
})

describe("lifetime (test 4)", () => {
  it("clears the value after lifetime, says so, and Show again re-runs the gate", async () => {
    vi.useFakeTimers()
    const gate = vi.fn().mockResolvedValue(false)
    const onExpire = vi.fn()
    const { getSecret } = await open({ lifetime: 120, gate, onExpire })
    expect(document.body.textContent).toContain("T")
    expect(chars().length).toBe(VALUE.length)

    act(() => {
      vi.advanceTimersByTime(90_000)
    })
    expect(document.querySelector('[data-slot="large-type-view-live"]')).toHaveTextContent("Hides in 30 seconds")
    act(() => {
      vi.advanceTimersByTime(30_000)
    })
    expect(chars()).toHaveLength(0)
    expect(document.body.textContent).not.toContain("9lO0")
    expect(onExpire).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-slot="large-type-view-live"]')).toHaveTextContent("Hidden.")

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Show again" }))
    })
    expect(gate).toHaveBeenCalledTimes(1)
    expect(getSecret).toHaveBeenCalledTimes(1)

    gate.mockResolvedValue(true)
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Show again" }))
    })
    expect(gate).toHaveBeenCalledTimes(2)
    expect(getSecret).toHaveBeenCalledTimes(2)
    expect(chars().length).toBe(VALUE.length)
  })
})

describe("blur (test 5)", () => {
  it("hides the value on window blur", async () => {
    await open()
    expect(chars().length).toBe(VALUE.length)
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })
    expect(chars()).toHaveLength(0)
    expect(screen.getByRole("button", { name: "Show again" })).toBeInTheDocument()
  })
})

describe("copy (test 6)", () => {
  it("C calls onCopy only when allowCopy", async () => {
    const onCopy = vi.fn()
    const { unmount } = await open({ onCopy })
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "c" })
    })
    expect(onCopy).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull()
    unmount()

    await open({ onCopy, allowCopy: true })
    await act(async () => {
      fireEvent.keyDown(screen.getByRole("dialog"), { key: "c" })
    })
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(new TextDecoder().decode(onCopy.mock.calls[0]?.[0] as Uint8Array)).toBe(VALUE)
  })
})

describe("hosts and variants", () => {
  it("calls the keep-awake and brightness hooks on open and releases them on close", async () => {
    const onKeepAwake = vi.fn()
    const onBrightness = vi.fn()
    const { rerender } = await open({ onKeepAwake, onBrightness })
    expect(onKeepAwake).toHaveBeenLastCalledWith(true)
    expect(onBrightness).toHaveBeenLastCalledWith(true)
    rerender(<LargeTypeView open={false} getSecret={secretOf(VALUE)} title="Wi-Fi password · Home" onKeepAwake={onKeepAwake} onBrightness={onBrightness} />)
    expect(onKeepAwake).toHaveBeenLastCalledWith(false)
    expect(onBrightness).toHaveBeenLastCalledWith(false)
  })

  it("print renders inline with every caption on, no timer and no controls", async () => {
    render(<LargeTypeView print getSecret={secretOf(VALUE)} title="Recovery kit" />)
    await act(async () => {})
    const page = document.querySelector('[data-slot="large-type-view"]') as HTMLElement
    expect(page).toHaveAttribute("data-variant", "print")
    expect(page.tagName).toBe("ARTICLE")
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(document.querySelector('[data-slot="large-type-view-timer"]')).toBeNull()
    expect(document.querySelector('[data-slot="large-type-view-controls"]')).toBeNull()
    for (const c of chars()) expect(c.querySelector('[data-slot="large-type-view-caption"]')).not.toBeNull()
  })

  it("the error state draws no characters", async () => {
    render(<LargeTypeView open getSecret={() => Promise.reject(new Error("no"))} title="Key" />)
    await act(async () => {})
    expect(chars()).toHaveLength(0)
    expect(screen.getByText("Couldn't read this value")).toBeInTheDocument()
  })
})
