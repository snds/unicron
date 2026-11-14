import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { middleCut, TruncatedText, TRUNCATION_MARK } from "./truncated-text"

/** jsdom has no layout: give every element the box sizes a browser would measure. */
function layout(sizes: { clientWidth?: number; scrollWidth?: number; clientHeight?: number; scrollHeight?: number }) {
  const spies = Object.entries(sizes).map(([key, value]) => vi.spyOn(HTMLElement.prototype, key as "clientWidth", "get").mockReturnValue(value))
  return () => spies.forEach((spy) => spy.mockRestore())
}

/** A canvas whose text is 8px a character, so a middle cut can be measured. */
function canvas() {
  const fake = { font: "", measureText: (s: string) => ({ width: Array.from(s).length * 8 }) }
  return vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(fake as unknown as CanvasRenderingContext2D)
}

const root = () => document.querySelector('[data-slot="truncated-text"]') as HTMLElement
const tip = () => document.querySelector('[data-slot="truncated-text-full"]') as HTMLElement | null

let restore: (() => void) | undefined
afterEach(() => {
  restore?.()
  restore = undefined
  vi.restoreAllMocks()
})

describe("middleCut", () => {
  const within = (n: number) => (s: string) => Array.from(s).length <= n

  it("returns the text whole when it fits", () => {
    expect(middleCut("spotify.com", within(20))).toBe("spotify.com")
  })

  it("keeps the start and the end, the end never shorter, around one ellipsis", () => {
    const cut = middleCut("~/code/synapse/apps/desktop/src/app.tsx", within(20))
    expect(Array.from(cut)).toHaveLength(20)
    expect(cut).toBe(`~/code/sy${TRUNCATION_MARK}rc/app.tsx`)
  })

  it("is the mark alone when nothing else fits", () => {
    expect(middleCut("store.steampowered.com", within(1))).toBe(TRUNCATION_MARK)
  })

  it("asks the measure O(log n) times", () => {
    const fits = vi.fn(within(30))
    middleCut("x".repeat(1000), fits)
    expect(fits.mock.calls.length).toBeLessThan(14)
  })
})

describe("TruncatedText", () => {
  it("text that fits is plain text: no tab stop, no tooltip", async () => {
    restore = layout({ clientWidth: 200, scrollWidth: 200 })
    render(<TruncatedText>Steam</TruncatedText>)
    expect(root()).toHaveTextContent("Steam")
    expect(root()).not.toHaveAttribute("tabindex")
    expect(root()).not.toHaveAttribute("data-truncated")
    await act(async () => {
      fireEvent.focus(root())
      fireEvent.mouseEnter(root())
    })
    expect(tip()).toBeNull()
  })

  it("one line, cut at the end by CSS (truncate) unless told otherwise", () => {
    restore = layout({ clientWidth: 200, scrollWidth: 200 })
    render(<TruncatedText>Steam</TruncatedText>)
    expect(root()).toHaveAttribute("data-cut", "end")
    expect(root().className.split(" ")).toEqual(expect.arrayContaining(["truncate", "block", "min-w-0"]))
  })

  it("when it is cut it joins the tab order, and focus shows the whole text in a tooltip", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    expect(root()).toHaveAttribute("data-truncated")
    expect(root()).toHaveAttribute("tabindex", "0")
    // Read whole by assistive tech: the DOM text is the full text.
    expect(root()).toHaveTextContent("Your November statement is ready to download")
    await act(async () => {
      root().focus()
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(tip()).toHaveTextContent("Your November statement is ready to download")
    expect(tip()!.className).toContain("type-caption")
  })

  it("hover shows the whole text too", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      fireEvent.pointerEnter(root(), { pointerType: "mouse" })
      fireEvent.mouseEnter(root())
      fireEvent.mouseMove(root())
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
  })

  it("lines clamps at that many lines, and asks the box's height whether it is cut", () => {
    restore = layout({ clientWidth: 200, scrollWidth: 200, clientHeight: 40, scrollHeight: 80 })
    render(<TruncatedText lines={2}>Two-bedroom cabin is booked for Nov 20 to 22. Check-in is after 3 PM.</TruncatedText>)
    expect(root()).toHaveAttribute("data-lines", "2")
    expect(root().className.split(" ")).toContain("line-clamp-(--truncated-text-lines)")
    expect(root().style.getPropertyValue("--truncated-text-lines")).toBe("2")
    expect(root()).toHaveAttribute("data-truncated")
  })

  it("a middle cut draws the start and the end, and reads the whole text", () => {
    restore = layout({ clientWidth: 160, scrollWidth: 400 })
    canvas()
    render(<TruncatedText cut="middle">~/code/synapse/apps/desktop/src/app.tsx</TruncatedText>)
    const visible = document.querySelector('[data-slot="truncated-text-visible"]') as HTMLElement
    expect(visible).toHaveAttribute("aria-hidden")
    expect(visible.textContent).toBe(`~/code/sy${TRUNCATION_MARK}rc/app.tsx`)
    expect(screen.getByText("~/code/synapse/apps/desktop/src/app.tsx")).toHaveClass("sr-only")
    expect(root()).toHaveAttribute("data-truncated")
    expect(root()).toHaveAttribute("tabindex", "0")
  })

  it("a middle cut that fits draws the text once", () => {
    restore = layout({ clientWidth: 400, scrollWidth: 400 })
    canvas()
    render(<TruncatedText cut="middle">spotify.com</TruncatedText>)
    expect(document.querySelector('[data-slot="truncated-text-visible"]')).toBeNull()
    expect(root()).toHaveTextContent(/^spotify\.com$/)
    expect(root()).not.toHaveAttribute("tabindex")
  })

  it("draws as another element with render", () => {
    restore = layout({ clientWidth: 200, scrollWidth: 200 })
    render(<TruncatedText render={<h3 />}>Cabin for the 20th, confirmed</TruncatedText>)
    expect(screen.getByRole("heading", { name: "Cabin for the 20th, confirmed" })).toHaveAttribute("data-slot", "truncated-text")
  })
})
