import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ListRow } from "./list-row"
import { SwipeAction, SwipeRow, type SwipeRowAction } from "./swipe-row"

// jsdom lays nothing out: the row is 390 wide (a phone), and the knobs fall back to their values:
// reveal 24, edge 24, tile 80, snap at half the tiles, full swipe at 60% of the row (234).
const WIDTH = 390
let rect: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  rect = vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
    () => ({ x: 0, y: 0, top: 0, left: 0, bottom: 92, right: WIDTH, width: WIDTH, height: 92, toJSON: () => ({}) }) as DOMRect
  )
})
afterEach(() => {
  rect.mockRestore()
})

const root = (container: HTMLElement) => container.querySelector('[data-slot="swipe-row"]') as HTMLElement
const content = (container: HTMLElement) => container.querySelector('[data-slot="swipe-row-content"]') as HTMLElement
const offsetOf = (container: HTMLElement) => {
  const match = /translateX\((-?[\d.]+)px\)/.exec(content(container).style.transform)
  return match ? Number(match[1]) : 0
}

/** A tap as a pointer makes it: down, up, then the click. */
function tap(el: HTMLElement) {
  fireEvent.pointerDown(el, { button: 0, pointerId: 2, isPrimary: true, clientX: 200, clientY: 40 })
  fireEvent.pointerUp(el, { pointerId: 2, clientX: 200, clientY: 40 })
  fireEvent.click(el)
}

/** A drag from `from` to `to` (client x), at y 40, in steps, then let go. */
function swipe(el: HTMLElement, from: number, to: number, { dy = 0, up = true }: { dy?: number; up?: boolean } = {}) {
  fireEvent.pointerDown(el, { button: 0, pointerId: 1, isPrimary: true, clientX: from, clientY: 40 })
  const steps = 8
  for (let i = 1; i <= steps; i++) {
    fireEvent.pointerMove(el, { pointerId: 1, clientX: from + ((to - from) * i) / steps, clientY: 40 + (dy * i) / steps })
  }
  if (up) fireEvent.pointerUp(el, { pointerId: 1, clientX: to, clientY: 40 + dy })
}

function vale(overrides: { archive?: Partial<SwipeRowAction>; read?: Partial<SwipeRowAction> } = {}) {
  const calls = { read: vi.fn(), flag: vi.fn(), snooze: vi.fn(), archive: vi.fn(), open: vi.fn() }
  const leading = { label: "Read", icon: "view", reversible: true, onAction: calls.read, ...overrides.read } as SwipeRowAction
  const trailing = [
    { label: "Flag", icon: "flag", reversible: true, onAction: calls.flag },
    { label: "Snooze", icon: "time", onAction: calls.snooze },
    { label: "Archive", icon: "archive", reversible: true, onAction: calls.archive, ...overrides.archive },
  ] as SwipeRowAction[]
  const utils = render(
    <SwipeRow leading={leading} trailing={trailing}>
      <ListRow layout="message" sender="Mira Chen" time="09:14" subject="Cabin for the 20th, confirmed" preview="Booked the two-bedroom." onClick={calls.open} />
    </SwipeRow>
  )
  return { ...utils, calls }
}

describe("SwipeRow (contract §6.4)", () => {
  it("lets a vertical drag scroll: touch-action pan-y, and a mostly-down drag never moves the row", () => {
    const { container, calls } = vale()
    expect(root(container).className).toContain("touch-pan-y")
    swipe(root(container), 300, 200, { dy: 140 })
    expect(offsetOf(container)).toBe(0)
    expect(calls.archive).not.toHaveBeenCalled()
  })

  it("under 24 px sideways nothing moves, and the press stays a tap on the row", () => {
    const { container, calls } = vale()
    swipe(root(container), 300, 280)
    expect(offsetOf(container)).toBe(0)
    fireEvent.click(screen.getByRole("button", { name: "Mira Chen Cabin for the 20th, confirmed" }))
    expect(calls.open).toHaveBeenCalledTimes(1)
  })

  it("moves without a jump once past 24 px: the reveal distance is taken off the travel", () => {
    const { container } = vale()
    swipe(root(container), 300, 250, { up: false })
    // 50 px of pointer travel, 24 of it the reveal: the row is 26 px open.
    expect(offsetOf(container)).toBe(-26)
    expect(root(container)).toHaveAttribute("data-dragging")
  })

  it("let go under half the actions' width (3 × 80 = 240, half 120), it closes; past half, it opens to 240", () => {
    const { container } = vale()
    swipe(root(container), 360, 360 - 24 - 100)
    expect(offsetOf(container)).toBe(0)
    expect(root(container)).not.toHaveAttribute("data-open")
    swipe(root(container), 360, 360 - 24 - 130)
    expect(offsetOf(container)).toBe(-240)
    expect(root(container)).toHaveAttribute("data-open", "trailing")
  })

  it("the tiles stretch to the row: 80 wide each, primary outermost, neutral inside it", () => {
    const { container } = vale()
    swipe(root(container), 360, 360 - 24 - 130)
    const tiles = [...container.querySelectorAll('[data-slot="swipe-row-trailing"] [data-slot="swipe-action"]')]
    expect(tiles.map((t) => t.getAttribute("data-tone"))).toEqual(["neutral", "neutral", "primary"])
    for (const tile of tiles) expect(tile.className).toContain("w-(--c-swipe-action-width)")
    expect(tiles[0].className).toContain("self-stretch")
    expect(tiles[2].className).toContain("flex-1")
    expect(container.querySelector('[data-slot="swipe-row-trailing"]')).toHaveStyle({ width: "240px" })
  })

  it("a full swipe past 60% of the row runs the outermost action when it is reversible, once, and closes", () => {
    const { container, calls } = vale()
    swipe(root(container), 380, 380 - 24 - 240)
    expect(calls.archive).toHaveBeenCalledTimes(1)
    expect(calls.flag).not.toHaveBeenCalled()
    expect(offsetOf(container)).toBe(0)
  })

  it("a full swipe never runs an action that is not reversible: the row opens and stops", () => {
    const { container, calls } = vale({ archive: { reversible: false } })
    swipe(root(container), 380, 0)
    expect(calls.archive).not.toHaveBeenCalled()
    expect(offsetOf(container)).toBe(-240)
    expect(root(container)).toHaveAttribute("data-open", "trailing")
  })

  it("past its furthest the row resists (rubberBand): never past the tiles plus half a tile", () => {
    const { container } = vale({ archive: { reversible: false } })
    swipe(root(container), 380, -600, { up: false })
    const travel = -offsetOf(container)
    expect(travel).toBeGreaterThan(240)
    expect(travel).toBeLessThan(240 + 40)
  })

  it("an action marked confirm is never run by a swipe, a tap or the menu: each only opens its review", async () => {
    const onReview = vi.fn()
    const onAction = vi.fn()
    const { container } = render(
      <SwipeRow trailing={[{ label: "Review", icon: "review", tone: "needs-you", confirm: true, onReview }]}>
        <ListRow title="Steam on a Windows PC" meta="Sign-in request" onClick={onAction} />
      </SwipeRow>
    )
    // Full swipe: review, not approve.
    swipe(root(container), 380, 380 - 24 - 260)
    expect(onReview).toHaveBeenCalledTimes(1)
    // Open, then tap the tile.
    swipe(root(container), 380, 380 - 24 - 60)
    expect(root(container)).toHaveAttribute("data-open", "trailing")
    const tile = container.querySelector('[data-slot="swipe-action"]') as HTMLElement
    expect(tile).toHaveAttribute("data-tone", "needs-you")
    tap(tile)
    expect(onReview).toHaveBeenCalledTimes(2)
    // The menu.
    await userEvent.click(screen.getByRole("button", { name: "More actions Steam on a Windows PC" }))
    await userEvent.click(await screen.findByRole("menuitem", { name: "Review" }))
    expect(onReview).toHaveBeenCalledTimes(3)
    expect(onAction).not.toHaveBeenCalled()
  })

  it("a right swipe starting inside 24 px of the screen's left edge is the system's: it never reaches the leading action", () => {
    const { container, calls } = vale()
    swipe(root(container), 10, 390)
    expect(offsetOf(container)).toBe(0)
    expect(calls.read).not.toHaveBeenCalled()
  })

  it("a right swipe clear of the edge reaches the one leading action: opens past half its width, runs on a full swipe", () => {
    const { container, calls } = vale()
    swipe(root(container), 40, 40 + 24 + 50)
    expect(offsetOf(container)).toBe(80)
    expect(root(container)).toHaveAttribute("data-open", "leading")
    expect(container.querySelector('[data-slot="swipe-row-leading"] [data-slot="swipe-action"]')).toHaveAttribute("data-tone", "primary")
    swipe(root(container), 40, 40 + 24 + 240)
    expect(calls.read).toHaveBeenCalledTimes(1)
    expect(offsetOf(container)).toBe(0)
  })

  it("an open row may be dragged back from the edge (only a swipe from rest is the system's)", () => {
    const { container } = vale()
    swipe(root(container), 360, 360 - 24 - 130)
    expect(offsetOf(container)).toBe(-240)
    swipe(root(container), 10, 10 + 24 + 200)
    expect(offsetOf(container)).toBe(0)
  })

  it("the click that ends a swipe is not a tap on the row; a tap on an open row closes it and does nothing else", () => {
    const { container, calls } = vale()
    const main = screen.getByRole("button", { name: "Mira Chen Cabin for the 20th, confirmed" })
    swipe(main, 360, 360 - 24 - 130)
    // The click a mouse sends right after its pointerup.
    fireEvent.click(main)
    expect(calls.open).not.toHaveBeenCalled()
    expect(offsetOf(container)).toBe(-240)
    tap(main)
    expect(calls.open).not.toHaveBeenCalled()
    expect(offsetOf(container)).toBe(0)
    tap(main)
    expect(calls.open).toHaveBeenCalledTimes(1)
  })

  it("a tap on a revealed tile runs it and closes the row", () => {
    const { container, calls } = vale()
    swipe(root(container), 360, 360 - 24 - 130)
    const flag = [...container.querySelectorAll('[data-slot="swipe-action"]')].find((t) => t.textContent === "Flag") as HTMLElement
    tap(flag)
    expect(calls.flag).toHaveBeenCalledTimes(1)
    expect(offsetOf(container)).toBe(0)
  })

  it("Escape and a press outside close an open row", () => {
    const { container } = vale()
    swipe(root(container), 360, 360 - 24 - 130)
    fireEvent.keyDown(root(container), { key: "Escape" })
    expect(offsetOf(container)).toBe(0)
    swipe(root(container), 360, 360 - 24 - 130)
    fireEvent.pointerDown(document.body)
    expect(offsetOf(container)).toBe(0)
  })

  it("a disabled action never runs: not by a full swipe, not by a tap", () => {
    const { container, calls } = vale({ archive: { disabled: true } })
    swipe(root(container), 380, 0)
    expect(calls.archive).not.toHaveBeenCalled()
    const archive = [...container.querySelectorAll('[data-slot="swipe-action"]')].find((t) => t.textContent === "Archive") as HTMLElement
    expect(archive).toBeDisabled()
  })

  it("settles on the spring-settle role, and snaps under reduced motion", () => {
    const { container, unmount } = vale()
    expect(content(container).className).toContain("ease-(--motion-spring-settle)")
    expect(content(container).className).toContain("duration-(--motion-spring-settle-duration)")
    unmount()
    const matchMedia = vi.spyOn(window, "matchMedia").mockImplementation(
      (query: string) =>
        ({ matches: query.includes("reduce"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList
    )
    const again = vale()
    expect(content(again.container).className).not.toContain("transition")
    matchMedia.mockRestore()
  })

  it("the tiles are out of the tab order and hidden from assistive tech: the row's menu is that path", async () => {
    const { container, calls } = vale()
    swipe(root(container), 360, 360 - 24 - 130)
    for (const tile of container.querySelectorAll('[data-slot="swipe-action"]')) expect(tile).toHaveAttribute("tabindex", "-1")
    expect(container.querySelector('[data-slot="swipe-row-trailing"]')).toHaveAttribute("aria-hidden", "true")
    fireEvent.keyDown(root(container), { key: "Escape" })
    // One menu button only: the ListRow's, holding every swipe action, leading first.
    const triggers = screen.getAllByRole("button", { name: /^More actions/ })
    expect(triggers).toHaveLength(1)
    await userEvent.click(triggers[0])
    const items = await screen.findAllByRole("menuitem")
    expect(items.map((i) => i.textContent)).toEqual(["Read", "Flag", "Snooze", "Archive"])
    await userEvent.click(items[3])
    expect(calls.archive).toHaveBeenCalledTimes(1)
  })

  it("with content that draws no menu, SwipeRow draws its own button, and Shift+F10 opens it", async () => {
    const onAction = vi.fn()
    render(
      <SwipeRow menuLabel="More for Stripe" trailing={[{ label: "Password", icon: "copy", onAction }]}>
        <p tabIndex={0}>Stripe</p>
      </SwipeRow>
    )
    expect(screen.getByRole("button", { name: "More for Stripe" })).toBeInTheDocument()
    act(() => {
      fireEvent.keyDown(screen.getByText("Stripe"), { key: "F10", shiftKey: true })
    })
    await userEvent.click(await screen.findByRole("menuitem", { name: "Password" }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("reports where it comes to rest", () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      <SwipeRow onOpenChange={onOpenChange} trailing={[{ label: "Pause", icon: "pause", reversible: true, onAction: () => undefined }]}>
        <ListRow title="Add baseline drift check" />
      </SwipeRow>
    )
    swipe(root(container), 360, 360 - 24 - 60)
    expect(onOpenChange).toHaveBeenLastCalledWith("trailing")
    fireEvent.keyDown(root(container), { key: "Escape" })
    expect(onOpenChange).toHaveBeenLastCalledWith(null)
  })
})

describe("SwipeAction (Figma 25:2042)", () => {
  it("an 80px tile, icon over an overline label, in three tones; neutral has a hairline on its left", () => {
    const { container } = render(
      <>
        <SwipeAction tone="primary" icon="archive" label="Archive" />
        <SwipeAction tone="neutral" icon="archive" label="Archive" />
        <SwipeAction tone="needs-you" icon="archive" label="Archive" />
      </>
    )
    const [primary, neutral, needsYou] = [...container.querySelectorAll('[data-slot="swipe-action"]')]
    for (const tile of [primary, neutral, needsYou]) {
      expect(tile.className.split(/\s+/)).toEqual(expect.arrayContaining(["w-(--c-swipe-action-width)", "flex-col", "gap-1.5", "type-overline"]))
      expect(tile.querySelector('[data-slot="icon"]')).toHaveAttribute("width", "20")
      expect(tile.className).not.toMatch(/rounded-(lg|md|sm)/)
    }
    expect(primary.className).toContain("bg-primary")
    expect(primary.className).toContain("text-primary-foreground")
    expect(neutral.className.split(/\s+/)).toEqual(expect.arrayContaining(["rule-l", "bg-surface-raised", "text-foreground"]))
    expect(needsYou.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-needs-you-fill", "text-needs-you-on-fill", "on-needs-you"]))
    expect(screen.getAllByRole("button", { name: "Archive" })).toHaveLength(3)
  })
})
