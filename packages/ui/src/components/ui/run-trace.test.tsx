import { act, fireEvent, render, screen, within } from "@testing-library/react"
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

  it("shows a step that waits on you, and the run's one line says so while live", () => {
    const waiting: RunStep[] = [steps[0], { id: "ask", label: "pnpm install", state: "needs-you", startedAt: T + 2_000 }]
    render(<RunTrace steps={waiting} live />)
    const step = document.querySelector<HTMLElement>('[data-slot="run-trace-step"][data-state="needs-you"]')!
    expect(step).toHaveTextContent("pnpm install")
    expect(within(step).getByRole("img", { name: "Needs you" })).toHaveAttribute("data-state", "needs-you")
    // The trigger names the step it's on, and its orb asks for you.
    const trigger = document.querySelector('[data-slot="run-trace-trigger"]')
    expect(trigger).toHaveTextContent("pnpm install")
    expect(trigger?.querySelector('[data-slot="status-orb"]')).toHaveAttribute("data-state", "needs-you")
  })

  it("draws a stopped step and a stopped run with the stop orb, not idle", () => {
    const stopped: RunStep[] = [steps[0], { id: "b", label: "Run tests", state: "stopped", startedAt: T + 2_000, endedAt: T + 3_000 }]
    render(<RunTrace steps={stopped} defaultOpen />)
    const step = document.querySelector<HTMLElement>('[data-slot="run-trace-step"][data-state="stopped"]')!
    expect(within(step).getByRole("img", { name: "Stopped" })).toHaveAttribute("data-state", "stopped")
    expect(document.querySelector('[data-slot="run-trace-trigger"] [data-slot="status-orb"]')).toHaveAttribute("data-state", "stopped")
  })

  it("puts marks between the steps they follow: before the first, after a step, and unplaced ones last", () => {
    render(
      <RunTrace
        steps={steps}
        defaultOpen
        marks={[
          { id: "1", after: "b", label: "Allowed once", icon: "checkmark" },
          { id: "0", label: "Picked up again" },
          { id: "2", after: "gone", label: "Paused for a game", icon: "pause" },
        ]}
      />
    )
    const rows = [...document.querySelectorAll('[data-slot="run-trace-steps"] > li')].map((li) => `${li.getAttribute("data-slot")}:${li.textContent}`)
    expect(rows.map((r) => r.split(":")[0])).toEqual([
      "run-trace-mark",
      "run-trace-step",
      "run-trace-step",
      "run-trace-mark",
      "run-trace-step",
      "run-trace-mark",
    ])
    expect(rows[3]).toContain("Allowed once")
    // A mark is words, not a control, and not a step: the count stays at three.
    expect(screen.getByRole("button", { name: /3 steps/ })).toBeInTheDocument()
    expect(document.querySelector('[data-slot="run-trace-mark"] button')).toBeNull()
  })

  it("shows reasoning in a short window that can be turned off", () => {
    render(<RunTrace steps={steps} defaultOpen reasoning={"First.\nSecond.\nThird.\nFourth."} />)
    expect(screen.getByText(/Fourth\./)).toHaveAttribute("data-slot", "run-trace-reasoning")
    fireEvent.click(screen.getByRole("button", { name: "Hide reasoning" }))
    expect(screen.queryByText(/Fourth\./)).toBeNull()
    expect(screen.getByRole("button", { name: "Show reasoning" })).toHaveAttribute("aria-pressed", "true")
  })

  it("fades old reasoning with a plain mask, not Tailwind's heavier mask utilities", () => {
    render(<RunTrace steps={steps} live reasoning={["one", "two", "three", "four"].join("\n")} />)
    const reasoning = document.querySelector('[data-slot="run-trace-reasoning"]')!
    expect(reasoning.className).toContain("[mask-image:linear-gradient(to_bottom,transparent,var(--foreground)_50%)]")
    expect(reasoning.className).not.toMatch(/mask-[tblrxy]-/)
  })
})

describe("RunTrace in the 2026-11 look", () => {
  it("draws the running step in the live colour, the rest in body ink, both in mono meta", () => {
    const live: RunStep[] = [steps[0], { id: "b", label: "Run tests", state: "running", startedAt: T + 2_000 }]
    render(<RunTrace steps={live} live />)
    const running = document.querySelector('[data-slot="run-trace-step"][data-state="running"] .type-meta')!
    expect(running.className).toContain("text-secondary-live")
    const done = document.querySelector('[data-slot="run-trace-step"][data-state="done"] .type-meta')!
    expect(done.className).toContain("text-text-body")
  })

  it("separates the one line's facts with //, says failures in critical ink, and takes the system focus ring", () => {
    render(<RunTrace steps={steps} />)
    const trigger = document.querySelector<HTMLElement>('[data-slot="run-trace-trigger"]')!
    expect(trigger).toHaveTextContent("12s // 3 steps // 1 failed")
    // The separators are hidden; the name stays the facts.
    expect(trigger).toHaveAccessibleName("Failed 12s 3 steps 1 failed")
    expect(screen.getByText("1 failed").className).toContain("text-critical-text")
    expect(trigger.className).not.toContain("outline-none")
    expect(trigger.className).toContain("hover:bg-state-hover")
  })
})
