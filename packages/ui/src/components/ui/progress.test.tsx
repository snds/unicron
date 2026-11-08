import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Progress, ProgressLabel, ProgressValue } from "./progress"

describe("Progress", () => {
  it("is a named progressbar with its values", () => {
    render(<Progress value={40} aria-label="Upload" />)
    const bar = screen.getByRole("progressbar", { name: "Upload" })
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(bar).toHaveAttribute("aria-valuemin", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "100")
    expect(bar).toHaveAttribute("data-variant", "bar")
  })

  it("takes a visible label and value", () => {
    render(
      <Progress value={3} max={7}>
        <ProgressLabel>Steps</ProgressLabel>
        <ProgressValue />
      </Progress>
    )
    expect(screen.getByRole("progressbar", { name: "Steps" })).toHaveAttribute("aria-valuenow", "3")
  })

  it("sizes from its knob and fills with primary, then success once complete", () => {
    const { container, rerender } = render(<Progress value={50} aria-label="Sync" />)
    const track = container.querySelector('[data-slot="progress-track"]')!
    const fill = container.querySelector('[data-slot="progress-indicator"]')!
    expect(track.className).toContain("h-(--c-progress-height)")
    expect(fill.className).toContain("bg-(--c-progress-fill)")
    expect(fill.className).toContain("group-data-complete/progress:group-data-[tone=default]/progress:bg-(--c-progress-complete)")
    rerender(<Progress value={100} aria-label="Sync" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-complete")
  })

  it("segmented: one cell per step, value cells filled, hidden from screen readers", () => {
    const { container } = render(<Progress variant="segmented" value={3} max={7} aria-label="Plan" />)
    const cells = container.querySelectorAll('[data-slot="progress-segment"]')
    expect(cells).toHaveLength(7)
    expect([...cells].filter((c) => c.hasAttribute("data-filled"))).toHaveLength(3)
    for (const cell of cells) expect(cell).toHaveAttribute("aria-hidden")
    expect(container.querySelector('[data-slot="progress-indicator"]')).toBeNull()
    expect(screen.getByRole("progressbar", { name: "Plan" })).toHaveAttribute("aria-valuenow", "3")
  })

  it("segmented clamps to its range", () => {
    const { container, rerender } = render(<Progress variant="segmented" value={9} max={4} aria-label="Plan" />)
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(4)
    rerender(<Progress variant="segmented" value={null} max={4} aria-label="Plan" />)
    expect(container.querySelectorAll('[data-filled]')).toHaveLength(0)
  })

  it("budget: warning past 70%, destructive past 90%, never success", () => {
    const level = (value: number) => {
      const { unmount } = render(<Progress tone="budget" value={value} aria-label="Spend" />)
      const l = screen.getByRole("progressbar").getAttribute("data-level")
      unmount()
      return l
    }
    expect(level(50)).toBe("ok")
    expect(level(70)).toBe("ok")
    expect(level(71)).toBe("warning")
    expect(level(91)).toBe("over")
    expect(level(100)).toBe("over")
  })

  it("indeterminate when value is null: the track pulses", () => {
    const { container } = render(<Progress value={null} aria-label="Loading" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-indeterminate")
    expect(container.querySelector('[data-slot="progress-track"]')!.className).toContain("group-data-indeterminate/progress:animate-pulse")
  })
})
