import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Accessory } from "./accessory"

const classesOf = (el: Element) => el.className.split(/\s+/)
const stripOf = (container: HTMLElement) => container.querySelector('[data-slot="accessory"]')!

describe("Accessory (Figma 20:1713)", () => {
  it("draws the strip as Figma does: 48 high, 4px / 16px padding, 12px gap, the 2px corner", () => {
    const { container } = render(<Accessory meta="SEA-48 // Running 04:12" title="Add baseline drift check" />)
    const strip = stripOf(container)
    expect(strip).toHaveAttribute("data-tone", "neutral")
    expect(classesOf(strip)).toEqual(expect.arrayContaining(["h-control", "px-4", "py-1", "gap-3", "rounded-sm", "rule-box", "bg-surface-raised"]))
  })

  it("meta is the overline and title the ui role, one line each, cut with an ellipsis; neutral inks as drawn", () => {
    const { container } = render(<Accessory meta="SEA-48 // Running 04:12" title="Add baseline drift check" />)
    const meta = container.querySelector('[data-slot="accessory-meta"]')!
    const title = container.querySelector('[data-slot="accessory-title"]')!
    expect(classesOf(meta)).toEqual(expect.arrayContaining(["type-overline", "truncate", "text-text-label"]))
    expect(classesOf(title)).toEqual(expect.arrayContaining(["type-ui", "truncate", "text-text-body"]))
  })

  it("live: the 8px square live mark first, the meta in the live ink", () => {
    const { container } = render(<Accessory tone="live" meta="SEA-48 // Running 04:12" title="Add baseline drift check" />)
    const mark = container.querySelector('[data-slot="accessory-live-mark"]')!
    expect(mark).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(mark)).toEqual(expect.arrayContaining(["size-(--c-accessory-live-mark)", "bg-secondary-live"]))
    expect(mark.className).not.toMatch(/rounded/)
    expect(container.querySelector('[data-slot="accessory-meta"]')!.className).toContain("text-secondary-live")
  })

  it("needs-you: the yellow with no border, its own ink, and the solid dark action", () => {
    const { container } = render(
      <Accessory tone="needs-you" meta="Lockdown // Sign-in request" title="Steam on a Windows PC" action={{ label: "Review" }} />
    )
    const strip = stripOf(container)
    expect(classesOf(strip)).toEqual(expect.arrayContaining(["bg-needs-you-fill", "on-needs-you"]))
    expect(classesOf(strip)).not.toContain("rule-box")
    expect(container.querySelector('[data-slot="accessory-meta"]')!.className).toContain("text-needs-you-on-fill")
    const action = screen.getByRole("button", { name: "Review" })
    expect(action).toHaveAttribute("data-variant", "needs-you")
    expect(action).toHaveAttribute("data-size", "sm")
  })

  it("an action is a secondary Button size S, beside the text, never inside it", () => {
    const onClick = vi.fn()
    render(<Accessory meta="SEA-48" title="Add baseline drift check" action={{ label: "Review diff", onClick }} onOpen={() => {}} />)
    const action = screen.getByRole("button", { name: "Review diff" })
    expect(action).toHaveAttribute("data-variant", "secondary")
    expect(action).toHaveAttribute("data-size", "sm")
    const open = screen.getByRole("button", { name: /Add baseline drift check/ })
    expect(open).not.toContainElement(action)
    fireEvent.click(action)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("takes any node as its action", () => {
    render(<Accessory title="Full test suite passed" action={<a href="/report">Open report</a>} />)
    expect(screen.getByRole("link", { name: "Open report" })).toBeInTheDocument()
  })

  it("the text area is one button that opens the strip's place, described by openLabel", async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<Accessory tone="live" meta="Sending // 08 s" title="Cabin for the 20th" onOpen={onOpen} openLabel="Open the Outbox" />)
    const open = screen.getByRole("button", { name: /Cabin for the 20th/ })
    expect(open).toHaveAttribute("data-slot", "accessory-open")
    expect(open).toHaveAccessibleDescription("Open the Outbox")
    await user.click(open)
    await user.keyboard("{Enter}")
    expect(onOpen).toHaveBeenCalledTimes(2)
  })

  it("a swipe up opens it too, and the lift's click is swallowed", () => {
    const onOpen = vi.fn()
    const { container } = render(<Accessory tone="live" title="Cabin for the 20th" onOpen={onOpen} />)
    const strip = stripOf(container)
    expect(classesOf(strip)).toContain("touch-none")
    fireEvent.pointerDown(strip, { button: 0, pointerId: 1, clientX: 100, clientY: 700 })
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 104, clientY: 660 })
    expect(onOpen).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole("button", { name: /Cabin/ }))
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("a swipe that lifts past the strip still counts", () => {
    const onOpen = vi.fn()
    const { container } = render(<Accessory tone="live" title="Cabin for the 20th" onOpen={onOpen} />)
    fireEvent.pointerDown(stripOf(container), { button: 0, pointerId: 7, clientX: 100, clientY: 700 })
    fireEvent.pointerUp(document.body, { pointerId: 7, clientX: 102, clientY: 600 })
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("a short or sideways move is not a swipe", () => {
    const onSwipeUp = vi.fn()
    const { container } = render(<Accessory title="Cabin for the 20th" onSwipeUp={onSwipeUp} />)
    const strip = stripOf(container)
    fireEvent.pointerDown(strip, { button: 0, pointerId: 1, clientX: 100, clientY: 700 })
    fireEvent.pointerUp(strip, { pointerId: 1, clientX: 100, clientY: 690 })
    fireEvent.pointerDown(strip, { button: 0, pointerId: 2, clientX: 100, clientY: 700 })
    fireEvent.pointerUp(strip, { pointerId: 2, clientX: 200, clientY: 660 })
    expect(onSwipeUp).not.toHaveBeenCalled()
    // With no onOpen, the swipe's action is also the text area's press: its keyboard path.
    fireEvent.click(screen.getByRole("button", { name: /Cabin/ }))
    expect(onSwipeUp).toHaveBeenCalledTimes(1)
  })

  it("onDismiss puts a close button at the end, except on needs-you", () => {
    const onDismiss = vi.fn()
    const { rerender } = render(<Accessory tone="live" title="Full test suite passed" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
    rerender(<Accessory tone="needs-you" title="Steam on a Windows PC" onDismiss={onDismiss} />)
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull()
  })

  it("critical: the critical Banner at strip size: soft ground, critical edge, the glyph in critical text, body title, secondary meta", () => {
    const { container } = render(<Accessory tone="critical" meta="Spend // Paused" title="$10.00 of $10.00 used" />)
    const strip = stripOf(container)
    expect(classesOf(strip)).toEqual(expect.arrayContaining(["bg-critical-soft", "inset-ring", "inset-ring-critical-fill"]))
    expect(strip.querySelector('[data-slot="accessory-glyph"]')!.className).toContain("text-critical-text")
    expect(strip.querySelector('[data-slot="accessory-glyph"] [data-icon-name="warning--alt"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="accessory-meta"]')!.className).toContain("text-text-secondary")
    expect(container.querySelector('[data-slot="accessory-title"]')!.className).toContain("text-text-body")
  })

  it("compact: an action shows only as its glyph, named by its label, or not at all", () => {
    const { rerender } = render(<Accessory compact tone="live" meta="Tasks // 03 running" title="SEA-48 running" action={{ label: "Open", icon: "launch" }} />)
    const glyph = screen.getByRole("button", { name: "Open" })
    expect(glyph).toHaveAttribute("data-size", "icon-sm")
    rerender(<Accessory compact tone="live" meta="Tasks // 03 running" title="SEA-48 running" action={{ label: "Open" }} />)
    expect(screen.queryByRole("button", { name: "Open" })).toBeNull()
  })

  it("progress is a segmented bar along the bottom, hidden from assistive tech; one polite region says the news", () => {
    const { container } = render(
      <Accessory tone="live" meta="Sending // 08 s" title="Cabin for the 20th" progress={{ value: 8, max: 10 }} announce="Sending. 10 seconds to undo." />
    )
    const bar = container.querySelector('[data-slot="accessory-progress"]')!
    expect(bar).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["absolute", "inset-x-4", "bottom-0.5"]))
    expect(bar.querySelector('[data-slot="progress"]')).toHaveAttribute("data-variant", "segmented")
    expect(bar.querySelectorAll('[data-slot="progress-segment"]')).toHaveLength(10)
    const status = within(stripOf(container) as HTMLElement).getByRole("status")
    expect(status).toHaveTextContent("Sending. 10 seconds to undo.")
    expect(status).not.toHaveTextContent("08")
  })

  it("the status region says the title when no announcement is given", () => {
    render(<Accessory tone="live" meta="SEA-48 // Running 04:12" title="Add baseline drift check" />)
    expect(screen.getByRole("status")).toHaveTextContent("Add baseline drift check")
  })

  it("never puts a button inside a button: the text area and every action are siblings (contract 5.1c C5)", () => {
    const cases = [
      <Accessory key="a" tone="live" meta="Sending" countdown={8} title="Board games for the cabin" onOpen={() => {}} action={{ label: "Undo", onClick: () => {} }} onDismiss={() => {}} />,
      <Accessory key="b" tone="live" title="Board games for the cabin" onOpen={() => {}} action={<button type="button">Undo</button>} />,
      <Accessory key="c" compact tone="live" title="Board games for the cabin" onOpen={() => {}} action={{ label: "Undo", icon: "undo", onClick: () => {} }} />,
      <Accessory key="d" tone="needs-you" title="Chrome on Windows" onOpen={() => {}} action={{ label: "Review", onClick: () => {} }} onDismiss={() => {}} />,
      <Accessory key="e" tone="critical" title="Spend paused" onSwipeUp={() => {}} action={{ label: "Resume", onClick: () => {} }} />,
    ]
    for (const strip of cases) {
      const { container, unmount } = render(strip)
      for (const button of Array.from(container.querySelectorAll("button"))) {
        expect(button.parentElement!.closest("button")).toBeNull()
        expect(button.querySelector("button")).toBeNull()
      }
      unmount()
    }
  })

  it("the text area is one button that opens the strip's place; the action is the sibling beside it, and a miss on it opens nothing", async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    const onUndo = vi.fn()
    render(<Accessory tone="live" meta="Sending" title="Board games for the cabin" onOpen={onOpen} openLabel="Open the Outbox" action={{ label: "Undo", onClick: onUndo }} />)
    const open = screen.getByRole("button", { name: /Board games for the cabin/ })
    expect(open).toHaveAccessibleDescription("Open the Outbox")
    const undo = screen.getByRole("button", { name: "Undo" })
    expect(open.contains(undo)).toBe(false)
    expect(undo.closest('[data-slot="accessory-action"]')!.parentElement).toBe(open.parentElement)
    await user.click(undo)
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
    await user.click(open)
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it("a needs-you strip still has no dismiss, even when asked", () => {
    render(<Accessory tone="needs-you" title="Chrome on Windows" onDismiss={() => {}} action={{ label: "Review" }} />)
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull()
  })

  it("a countdown follows the meta as decisions §13 writes it, hidden from assistive tech; the open button's name does not tick (contract 5.1c C7)", () => {
    const { container, rerender } = render(<Accessory tone="live" meta="Sending" countdown={8} title="Board games for the cabin" onOpen={() => {}} announce="Sending. 10 seconds to undo." />)
    const countdown = container.querySelector('[data-slot="accessory-countdown"]')!
    expect(countdown).toHaveTextContent("// 08 S")
    expect(countdown).toHaveAttribute("aria-hidden", "true")
    const open = screen.getByRole("button", { name: /Board games/ })
    expect(open.textContent).toContain("08 S")
    expect(open).not.toHaveAccessibleName(/08/)
    rerender(<Accessory tone="live" meta="Sending" countdown={7} title="Board games for the cabin" onOpen={() => {}} announce="Sending. 10 seconds to undo." />)
    expect(screen.getByRole("status")).toHaveTextContent("Sending. 10 seconds to undo.")
    expect(screen.getByRole("status")).not.toHaveTextContent("07")
  })
})
