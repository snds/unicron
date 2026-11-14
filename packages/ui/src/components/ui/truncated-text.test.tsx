import { readFileSync } from "node:fs"
import { resolve } from "node:path"
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

describe("TruncatedText: the full text at the pointer's spot (contract 5.1c C17, Synapse SNA3)", () => {
  const positioner = () => document.querySelector("[data-anchor]") as HTMLElement | null
  const translate = () => /translate\(([-\d.]+)px, ([-\d.]+)px\)/.exec(positioner()?.getAttribute("style") ?? "")?.slice(1).map(Number)

  it("opened by the pointer: it sits at the spot where the pointer was, its start at the pointer, and stays put as the pointer moves", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      fireEvent.pointerEnter(root(), { pointerType: "mouse", clientX: 100, clientY: 50 })
      fireEvent.pointerMove(root(), { pointerType: "mouse", clientX: 140, clientY: 52 })
      fireEvent.mouseEnter(root())
      fireEvent.mouseMove(root(), { clientX: 140, clientY: 52 })
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(positioner()).toHaveAttribute("data-anchor", "pointer")
    // Above the spot (the default side), 4 clear of it; its start at the pointer's x.
    await vi.waitFor(() => expect(translate()).toEqual([140, 48]))
    await act(async () => {
      fireEvent.pointerMove(root(), { pointerType: "mouse", clientX: 300, clientY: 60 })
      fireEvent.mouseMove(root(), { clientX: 300, clientY: 60 })
      await new Promise((r) => setTimeout(r, 20))
    })
    expect(translate()).toEqual([140, 48])
  })

  it("opened by keyboard focus: from the element itself", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      root().focus()
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(positioner()).toHaveAttribute("data-anchor", "element")
    // Reachable, and read whole: the focused element's text is the whole text.
    expect(document.activeElement).toBe(root())
    expect(root()).toHaveTextContent("Your November statement is ready to download")
  })

  it("a touch never opens it at a finger's spot", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      fireEvent.pointerEnter(root(), { pointerType: "touch", clientX: 100, clientY: 50 })
      root().focus()
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(positioner()).toHaveAttribute("data-anchor", "element")
  })

  /** A tap as a finger makes it: pointer down and up of type touch, then the click. */
  async function tapOn(el: HTMLElement) {
    await act(async () => {
      fireEvent.pointerDown(el, { pointerType: "touch", button: 0, clientX: 60, clientY: 10 })
      fireEvent.pointerUp(el, { pointerType: "touch", clientX: 60, clientY: 10 })
      fireEvent.click(el)
    })
  }

  it("on a touch screen a tap on cut text opens all of it, from the element; a second tap puts it away", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    expect(tip()).toBeNull()
    await tapOn(root())
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(tip()).toHaveTextContent("Your November statement is ready to download")
    expect(positioner()).toHaveAttribute("data-anchor", "element")
    await tapOn(root())
    await vi.waitFor(() => expect(tip()).toBeNull())
  })

  // In a browser a tap also focuses the text, and that focus opens the tooltip a moment before
  // the press lands. The press must not then read as "open already, so put it away": the full
  // text was only ever seen leaving (found when the popup lost its 120ms exit keyframes).
  it("a tap whose own focus opened it first still leaves it open, and the next tap puts it away", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      root().focus()
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    await tapOn(root())
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(tip()).not.toBeNull()
    expect(tip()).toHaveTextContent("Your November statement is ready to download")
    await tapOn(root())
    await vi.waitFor(() => expect(tip()).toBeNull())
  })

  it("opened by a tap, it closes on a tap anywhere else and when the page scrolls", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(
      <div>
        <TruncatedText>Your November statement is ready to download</TruncatedText>
        <p>Elsewhere</p>
      </div>
    )
    await tapOn(root())
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    await act(async () => {
      fireEvent.pointerDown(screen.getByText("Elsewhere"), { pointerType: "touch" })
    })
    await vi.waitFor(() => expect(tip()).toBeNull())
    await tapOn(root())
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    await act(async () => {
      fireEvent.scroll(document)
    })
    await vi.waitFor(() => expect(tip()).toBeNull())
  })

  it("a tap on text that fits opens nothing, and a mouse click is not a tap", async () => {
    restore = layout({ clientWidth: 300, scrollWidth: 300 })
    const { unmount } = render(<TruncatedText>Inbox</TruncatedText>)
    await tapOn(root())
    expect(tip()).toBeNull()
    unmount()
    restore()
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      fireEvent.pointerDown(root(), { pointerType: "mouse", button: 0 })
      fireEvent.pointerUp(root(), { pointerType: "mouse" })
      fireEvent.click(root())
      await new Promise((r) => setTimeout(r, 20))
    })
    expect(tip()).toBeNull()
  })

  it("wraps between the two knobs, never wider than the room on screen, and reads from the start of the line", async () => {
    restore = layout({ clientWidth: 120, scrollWidth: 300 })
    render(<TruncatedText>Your November statement is ready to download</TruncatedText>)
    await act(async () => {
      root().focus()
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    const cls = tip()!.className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining([
        "w-max",
        "min-w-[min(var(--c-truncated-text-min-width),var(--available-width,100vw))]",
        "max-w-[min(var(--c-truncated-text-max-width),var(--available-width,100vw))]",
        "text-start",
        "whitespace-normal",
        "wrap-break-word",
        // The Tooltip's own look.
        "bg-text-body",
        "text-surface-ground",
        "type-caption",
      ])
    )
    const tokens = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component/overlays.json"), "utf8")
    )
    expect(tokens["truncated-text"]["min-width"].$value).toBe("12rem")
    expect(tokens["truncated-text"]["max-width"].$value).toBe("22rem")
  })
})

