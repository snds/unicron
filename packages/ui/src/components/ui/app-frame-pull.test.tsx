import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppFrame, AppFrameColumn, AppFrameDetail, AppFrameList, AppFrameMain, pullOffsetFor } from "./app-frame"
import { Button } from "./button"

const originalMatchMedia = window.matchMedia

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

function reduceMotion() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes("prefers-reduced-motion: reduce"),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
}

function Phone({ onRefresh, layout = "phone" }: { onRefresh: () => unknown; layout?: "phone" | "expanded" }) {
  return (
    <AppFrame layout={layout}>
      <AppFrameMain>
        <AppFrameColumn onRefresh={onRefresh}>
          <p>Steam</p>
          {/* The plain path a pull always has beside it (decisions §8). */}
          <Button onClick={() => void onRefresh()}>Check again</Button>
        </AppFrameColumn>
      </AppFrameMain>
    </AppFrame>
  )
}

const column = () => document.querySelector('[data-slot="app-frame-column"]') as HTMLElement

/** A pull from the top: down by `dy` (after a first step of `first`), then let go. */
function pull(el: HTMLElement, dy: number, { dx = 0, lift = true, first = 12, id = 1 }: { dx?: number; lift?: boolean; first?: number; id?: number } = {}) {
  fireEvent.pointerDown(el, { button: 0, pointerId: id, isPrimary: true, clientX: 100, clientY: 200 })
  fireEvent.pointerMove(el, { pointerId: id, clientX: 100 + Math.sign(dx) * Math.min(Math.abs(dx), first), clientY: 200 + Math.sign(dy) * first })
  fireEvent.pointerMove(el, { pointerId: id, clientX: 100 + dx, clientY: 200 + dy })
  if (lift) fireEvent.pointerUp(el, { pointerId: id, clientX: 100 + dx, clientY: 200 + dy })
}

describe("pull to refresh (contract 5.1c C9)", () => {
  it("the content follows the finger with resistance, and never past the most", () => {
    expect(pullOffsetFor(0, 128, false)).toBe(0)
    expect(pullOffsetFor(-20, 128, false)).toBe(0)
    const at64 = pullOffsetFor(64, 128, false)
    expect(at64).toBeGreaterThan(30)
    expect(at64).toBeLessThan(64)
    expect(pullOffsetFor(400, 128, false)).toBeLessThanOrEqual(128)
    expect(pullOffsetFor(400, 128, false)).toBeGreaterThan(pullOffsetFor(200, 128, false))
    // Reduced motion: the list does not stretch.
    expect(pullOffsetFor(200, 128, true)).toBe(0)
  })

  it("at the top, the column takes the pull and keeps zoom; the browser keeps every other gesture", () => {
    render(<Phone onRefresh={() => {}} />)
    const el = column()
    expect(el).toHaveAttribute("data-pull-ready")
    expect(el.className).toContain("data-pull-ready:touch-pan-down")
    expect(el.className).toContain("data-pull-ready:touch-pan-x")
    expect(el.className).toContain("data-pull-ready:touch-pinch-zoom")
    el.scrollTop = 120
    fireEvent.scroll(el)
    expect(el).not.toHaveAttribute("data-pull-ready")
  })

  it("a pull past 64 runs onRefresh once, on the lift; the column says it is busy until the promise settles", async () => {
    let finish: () => void = () => {}
    const onRefresh = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    pull(el, 90, { lift: false })
    expect(el).toHaveAttribute("data-pull", "armed")
    expect(el.style.transform).toMatch(/^translateY\(\d+px\)$/)
    // The mark in the gap: past the line it is the renew glyph, hidden from assistive tech.
    const mark = document.querySelector('[data-slot="app-frame-pull-mark"]')!
    expect(mark).toHaveAttribute("data-state", "armed")
    expect(mark).toHaveAttribute("aria-hidden", "true")
    expect(mark.querySelector('[data-icon-name="renew"]')).not.toBeNull()
    expect(onRefresh).not.toHaveBeenCalled()
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 290 })
    expect(onRefresh).toHaveBeenCalledTimes(1)
    expect(el.style.transform).toBe("")
    expect(el).toHaveAttribute("data-pull-release")
    expect(el).toHaveAttribute("aria-busy", "true")
    // While it runs, another pull does nothing.
    pull(el, 90)
    expect(onRefresh).toHaveBeenCalledTimes(1)
    await act(async () => {
      finish()
      await Promise.resolve()
    })
    expect(el).not.toHaveAttribute("aria-busy")
  })

  it("a pull short of the line does nothing, and its mark is the down arrow until the line", () => {
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    pull(el, 50, { lift: false })
    expect(el).toHaveAttribute("data-pull", "pulling")
    expect(document.querySelector('[data-slot="app-frame-pull-mark"] [data-icon-name="arrow--down"]')).not.toBeNull()
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 250 })
    expect(onRefresh).not.toHaveBeenCalled()
    expect(document.querySelector('[data-slot="app-frame-pull-mark"]')).toBeNull()
  })

  it("does not fight scrolling: a first move up, a sideways move, or a column not at its top is not a pull", () => {
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    pull(el, -120)
    pull(el, 90, { dx: 120, id: 2 })
    el.scrollTop = 40
    fireEvent.scroll(el)
    pull(el, 120, { id: 3 })
    expect(onRefresh).not.toHaveBeenCalled()
    expect(el).not.toHaveAttribute("data-pull")
    expect(el.style.transform).toBe("")
  })

  it("does not fight the scroll-minimize: a pull leaves the column at its top and the chrome as it is", () => {
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    pull(el, 200, { lift: false })
    expect(el.scrollTop).toBe(0)
    expect(document.querySelector('[data-slot="app-frame"]')).not.toHaveAttribute("data-minimized")
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 400 })
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("under reduced motion the list does not stretch: the mark lays over the content's top instead", () => {
    reduceMotion()
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    pull(el, 90, { lift: false })
    expect(el.style.transform).toBe("")
    const mark = document.querySelector('[data-slot="app-frame-pull-mark"]')!
    expect(mark).toHaveAttribute("data-state", "armed")
    expect(mark.className).toContain("h-control")
    fireEvent.pointerUp(el, { pointerId: 1, clientX: 100, clientY: 290 })
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("WebKit's own bounce past the line runs it once, when the browser took the touch", () => {
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} />)
    const el = column()
    fireEvent.pointerDown(el, { button: 0, pointerId: 4, isPrimary: true, clientX: 100, clientY: 200 })
    fireEvent.pointerCancel(el, { pointerId: 4 })
    el.scrollTop = -30
    fireEvent.scroll(el)
    expect(onRefresh).not.toHaveBeenCalled()
    el.scrollTop = -70
    fireEvent.scroll(el)
    el.scrollTop = -90
    fireEvent.scroll(el)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("is the phone's only: a desktop column has no pull, and a keyboard user has the plain action", () => {
    const onRefresh = vi.fn()
    render(<Phone onRefresh={onRefresh} layout="expanded" />)
    const el = column()
    expect(el).not.toHaveAttribute("data-pull-ready")
    pull(el, 120)
    expect(onRefresh).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Check again" }))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it("the list and a pushed detail take it too, each on its own column while it shows", () => {
    const onList = vi.fn()
    const onDetail = vi.fn()
    const { rerender } = render(
      <AppFrame layout="phone">
        <AppFrameMain>
          <AppFrameList onRefresh={onList}>Inbox</AppFrameList>
          <AppFrameDetail onRefresh={onDetail}>Message</AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    const list = document.querySelector('[data-slot="app-frame-list"]') as HTMLElement
    pull(list, 90)
    expect(onList).toHaveBeenCalledTimes(1)
    rerender(
      <AppFrame layout="phone">
        <AppFrameMain>
          <AppFrameList onRefresh={onList}>Inbox</AppFrameList>
          <AppFrameDetail open onRefresh={onDetail}>
            Message
          </AppFrameDetail>
        </AppFrameMain>
      </AppFrame>
    )
    expect(list).not.toHaveAttribute("data-pull-ready")
    pull(document.querySelector('[data-slot="app-frame-detail"]') as HTMLElement, 90, { id: 9 })
    expect(onDetail).toHaveBeenCalledTimes(1)
    expect(onList).toHaveBeenCalledTimes(1)
  })
})
