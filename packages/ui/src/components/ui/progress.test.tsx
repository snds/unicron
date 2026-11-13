import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Progress, ProgressLabel, ProgressValue, progressDefaultSegments } from "./progress"

const classesOf = (el: Element) => el.className.split(/\s+/)
const cells = (container: HTMLElement) => [...container.querySelectorAll('[data-slot="progress-segment"]')]
const lit = (container: HTMLElement) => cells(container).filter((c) => c.hasAttribute("data-filled"))

describe("Progress", () => {
  it("is a named progressbar with its values", () => {
    render(<Progress value={40} aria-label="Upload" />)
    const bar = screen.getByRole("progressbar", { name: "Upload" })
    expect(bar).toHaveAttribute("aria-valuenow", "40")
    expect(bar).toHaveAttribute("aria-valuemin", "0")
    expect(bar).toHaveAttribute("aria-valuemax", "100")
    expect(bar).toHaveAttribute("data-variant", "bar")
  })

  it("takes a visible label and value, set in type roles", () => {
    const { container } = render(
      <Progress value={3} max={7}>
        <ProgressLabel>Steps</ProgressLabel>
        <ProgressValue />
      </Progress>
    )
    expect(screen.getByRole("progressbar", { name: "Steps" })).toHaveAttribute("aria-valuenow", "3")
    expect(classesOf(container.querySelector('[data-slot="progress-label"]')!)).toContain("type-label")
    expect(classesOf(container.querySelector('[data-slot="progress-value"]')!)).toContain("type-meta")
  })

  it("a bar is square, sizes from its knob, fills with primary, then success once complete", () => {
    const { container, rerender } = render(<Progress value={50} aria-label="Sync" />)
    const track = container.querySelector('[data-slot="progress-track"]')!
    const fill = container.querySelector('[data-slot="progress-indicator"]')!
    expect(classesOf(track)).toEqual(expect.arrayContaining(["h-(--c-progress-height)", "rounded-none", "bg-(--c-progress-track)"]))
    expect(classesOf(track)).not.toContain("rounded-full")
    expect(classesOf(fill)).toEqual(
      expect.arrayContaining(["bg-(--c-progress-fill)", "group-data-[fill=complete]/progress:group-data-complete/progress:bg-(--c-progress-complete)"])
    )
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-fill", "complete")
    rerender(<Progress value={100} aria-label="Sync" />)
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-complete")
  })

  it("segmented: 32 cells by default, lit by the value's share, hidden from screen readers", () => {
    const { container } = render(<Progress variant="segmented" value={19} max={32} aria-label="SEA-48" />)
    expect(progressDefaultSegments).toBe(32)
    expect(cells(container)).toHaveLength(32)
    expect(lit(container)).toHaveLength(19)
    // Lit from the start: the first 19, then 13 empty.
    expect(cells(container).findIndex((c) => !c.hasAttribute("data-filled"))).toBe(19)
    for (const cell of cells(container)) expect(cell).toHaveAttribute("aria-hidden")
    expect(container.querySelector('[data-slot="progress-indicator"]')).toBeNull()
    expect(screen.getByRole("progressbar", { name: "SEA-48" })).toHaveAttribute("aria-valuenow", "19")
  })

  it("segmented cells are 4px tall, 2px apart and square; lit is the live colour, empty the hairline colour", () => {
    const { container } = render(<Progress variant="segmented" value={19} max={32} aria-label="SEA-48" />)
    const track = classesOf(container.querySelector('[data-slot="progress-track"]')!)
    expect(track).toEqual(
      expect.arrayContaining(["h-(--c-progress-height)", "group-data-[variant=segmented]/progress:gap-(--c-progress-segment-gap)"])
    )
    expect(screen.getByRole("progressbar")).toHaveAttribute("data-fill", "live")
    const [first] = lit(container)
    const last = cells(container).at(-1)!
    expect(classesOf(first)).toEqual(expect.arrayContaining(["flex-1", "h-full", "group-data-[fill=live]/progress:bg-(--c-progress-tone-live)"]))
    expect(classesOf(last)).toContain("bg-(--c-progress-track)")
    expect(classesOf(last)).not.toContain("bg-(--c-progress-fill)")
    for (const cell of [first, last]) expect(classesOf(cell).some((c) => c.startsWith("rounded"))).toBe(false)
  })

  it("segmented takes a real value: any range, any cell count, rounded down", () => {
    const count = (props: { value: number | null; min?: number; max?: number; segments?: number }) => {
      const { container, unmount } = render(<Progress variant="segmented" aria-label="Spend" {...props} />)
      const n = [cells(container).length, lit(container).length]
      unmount()
      return n
    }
    // $3.40 of $10.00 on 32 cells: 10.88, so 10.
    expect(count({ value: 3.4, max: 10 })).toEqual([32, 10])
    // 18 of 30 seconds on a 30-cell countdown.
    expect(count({ value: 18, max: 30, segments: 30 })).toEqual([30, 18])
    // 212 of 218 checks on 44 cells: 42.8, so 42 (never "done" before it is).
    expect(count({ value: 212, max: 218, segments: 44 })).toEqual([44, 42])
    expect(count({ value: 218, max: 218, segments: 44 })).toEqual([44, 44])
    // One cell per step of a checklist.
    expect(count({ value: 3, max: 7, segments: 7 })).toEqual([7, 3])
    // A share that floats just under a whole cell still lights it.
    expect(count({ value: 0.3, max: 1, segments: 10 })).toEqual([10, 3])
    expect(count({ value: 15, min: 10, max: 20, segments: 10 })).toEqual([10, 5])
  })

  it("segmented clamps to its range, and lights nothing while indeterminate", () => {
    const { container, rerender } = render(<Progress variant="segmented" value={9} max={4} segments={4} aria-label="Plan" />)
    expect(lit(container)).toHaveLength(4)
    rerender(<Progress variant="segmented" value={null} max={4} segments={4} aria-label="Plan" />)
    expect(lit(container)).toHaveLength(0)
    rerender(<Progress variant="segmented" value={2} max={4} segments={0} aria-label="Plan" />)
    expect(cells(container)).toHaveLength(0)
  })

  it("tones: primary and live on either variant, critical for a countdown about to run out", () => {
    const fillOf = (props: Pick<React.ComponentProps<typeof Progress>, "variant" | "tone">) => {
      const { unmount } = render(<Progress aria-label="Tone" value={5} max={30} {...props} />)
      const fill = screen.getByRole("progressbar").getAttribute("data-fill")
      unmount()
      return fill
    }
    expect(fillOf({})).toBe("complete")
    expect(fillOf({ variant: "segmented" })).toBe("live")
    expect(fillOf({ tone: "primary" })).toBe("primary")
    expect(fillOf({ variant: "segmented", tone: "primary" })).toBe("primary")
    expect(fillOf({ tone: "live" })).toBe("live")
    expect(fillOf({ variant: "segmented", tone: "critical" })).toBe("critical")
    expect(fillOf({ tone: "critical" })).toBe("critical")
  })

  it("the critical fill is its own knob on a lit cell and on a bar", () => {
    const { container, rerender } = render(<Progress variant="segmented" tone="critical" value={4} max={30} segments={30} aria-label="Fastmail code" />)
    expect(lit(container)).toHaveLength(4)
    expect(classesOf(lit(container)[0])).toContain("group-data-[fill=critical]/progress:bg-(--c-progress-tone-critical)")
    expect(screen.getByRole("progressbar", { name: "Fastmail code" })).toHaveAttribute("data-tone", "critical")
    rerender(<Progress tone="critical" value={4} max={30} aria-label="Fastmail code" />)
    expect(classesOf(container.querySelector('[data-slot="progress-indicator"]')!)).toContain(
      "group-data-[fill=critical]/progress:bg-(--c-progress-tone-critical)"
    )
  })

  it("only a default bar turns success: a full segmented countdown stays the live colour", () => {
    render(<Progress variant="segmented" value={30} max={30} segments={30} aria-label="Steam code" />)
    const bar = screen.getByRole("progressbar")
    expect(bar).toHaveAttribute("data-complete")
    expect(bar).toHaveAttribute("data-fill", "live")
  })

  it("budget: warning past 70%, destructive past 90%, never success", () => {
    const level = (value: number) => {
      const { unmount } = render(<Progress tone="budget" value={value} aria-label="Spend" />)
      const bar = screen.getByRole("progressbar")
      const l = bar.getAttribute("data-level")
      expect(bar).toHaveAttribute("data-fill", "budget")
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
