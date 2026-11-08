import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { RunTrace, formatRunDuration, type RunStep } from "./run-trace"

const T = 1_700_000_000_000
const steps: RunStep[] = [
  { id: "a", label: "Read package.json", state: "done", startedAt: T, endedAt: T + 2_000 },
  { id: "b", label: "Run tests", state: "failed", startedAt: T + 2_000, endedAt: T + 9_000, detail: <p>exit 1</p> },
  { id: "c", label: "Fix import", state: "done", startedAt: T + 9_000, endedAt: T + 12_000 },
]

afterEach(() => vi.useRealTimers())

describe("Collapsible", () => {
  it("opens and closes its panel from the trigger", () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>More</CollapsibleTrigger>
        <CollapsibleContent>Hidden part</CollapsibleContent>
      </Collapsible>
    )
    const trigger = screen.getByRole("button", { name: "More" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Hidden part")).toBeVisible()
  })
})

describe("formatRunDuration", () => {
  it("is short", () => {
    expect(formatRunDuration(400)).toBe("<1s")
    expect(formatRunDuration(12_000)).toBe("12s")
    expect(formatRunDuration(65_000)).toBe("1m 05s")
    expect(formatRunDuration(3_720_000)).toBe("1h 02m")
  })
})

describe("RunTrace", () => {
  it("folds a finished run to one line: state, time, steps and failures", () => {
    render(<RunTrace steps={steps} />)
    const trigger = screen.getByRole("button", { name: "Failed 12s 3 steps 1 failed" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    expect(screen.queryByText("Read package.json")).toBeNull()
    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Read package.json")).toBeVisible()
  })

  it("lists each step with its state, label and time", () => {
    render(<RunTrace steps={steps} defaultOpen />)
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[1]).toHaveAttribute("data-state", "failed")
    expect(items[1]).toHaveTextContent("Run tests")
    expect(items[1]).toHaveTextContent("7s")
    expect(screen.getAllByRole("img", { name: "Done" })).toHaveLength(2)
    expect(items[1].querySelector('[data-slot="status-orb"]')).toHaveAccessibleName("Failed")
  })

  it("keeps detail out of the stream: a button that opens it", () => {
    render(<RunTrace steps={steps} defaultOpen />)
    expect(screen.queryByText("exit 1")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Details: Run tests" }))
    expect(screen.getByText("exit 1")).toBeInTheDocument()
  })

  it("is open while live, on the current step, and the time ticks", () => {
    vi.useFakeTimers()
    vi.setSystemTime(T + 5_000)
    const live: RunStep[] = [steps[0], { id: "b", label: "Run tests", state: "running", startedAt: T + 2_000 }]
    render(<RunTrace steps={live} live />)
    const trigger = screen.getByRole("button", { name: "Working Run tests 5s 2 steps" })
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    expect(trigger).toHaveAccessibleName("Working Run tests 8s 2 steps")
  })

  it("folds when the run ends, and tells the host", () => {
    const onOpenChange = vi.fn()
    const live: RunStep[] = [{ id: "a", label: "Think", state: "running", startedAt: T }]
    const { rerender } = render(<RunTrace steps={live} live onOpenChange={onOpenChange} />)
    expect(screen.getByRole("button", { name: /Working/ })).toHaveAttribute("aria-expanded", "true")
    rerender(<RunTrace steps={[{ ...live[0], state: "done", endedAt: T + 1_000 }]} onOpenChange={onOpenChange} />)
    expect(screen.getByRole("button", { name: "Done 1s 1 step" })).toHaveAttribute("aria-expanded", "false")
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
  })

  it("shows reasoning in a short window that can be turned off", () => {
    render(<RunTrace steps={steps} defaultOpen reasoning={"First.\nSecond.\nThird.\nFourth."} />)
    expect(screen.getByText(/Fourth\./)).toHaveAttribute("data-slot", "run-trace-reasoning")
    fireEvent.click(screen.getByRole("button", { name: "Hide reasoning" }))
    expect(screen.queryByText(/Fourth\./)).toBeNull()
    expect(screen.getByRole("button", { name: "Show reasoning" })).toHaveAttribute("aria-pressed", "true")
  })
})
