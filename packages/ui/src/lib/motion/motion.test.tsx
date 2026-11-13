import type * as React from "react"
import { act, fireEvent, render, renderHook, screen } from "@testing-library/react"

import { CheckDraw } from "../../components/check-draw"
import { motionContracts, rubberBand, useShake, withViewTransition } from "./index"

describe("rubberBand", () => {
  it("starts at the given share of the pointer's speed and never passes the limit", () => {
    expect(rubberBand(0, 24)).toBe(0)
    expect(rubberBand(1, 24, 0.5)).toBeCloseTo(0.49, 1)
    expect(rubberBand(10_000, 24)).toBeLessThanOrEqual(24)
    expect(rubberBand(10_000, 24)).toBeGreaterThan(23.9)
  })
  it("gives less for each further pixel, and mirrors for a negative distance", () => {
    const steps = [10, 20, 30, 40].map((d) => rubberBand(d, 24))
    for (let i = 1; i < steps.length; i++) expect(steps[i]!).toBeGreaterThan(steps[i - 1]!)
    expect(steps[1]! - steps[0]!).toBeGreaterThan(steps[3]! - steps[2]!)
    expect(rubberBand(-30, 24)).toBeCloseTo(-rubberBand(30, 24))
  })
  it("returns 0 for a limit that is not positive", () => {
    expect(rubberBand(50, 0)).toBe(0)
    expect(rubberBand(Number.NaN, 24)).toBe(0)
  })
})

/** jsdom fires no animation events through React, so hand the hook's own handler an event. */
function ended(animationName: string, own = true) {
  const el = document.createElement("div")
  return { target: own ? el : document.createElement("span"), currentTarget: el, animationName } as unknown as React.AnimationEvent
}

describe("useShake", () => {
  function Field() {
    const shake = useShake()
    return (
      <div>
        <div data-testid="field" {...shake.props} />
        <button onClick={shake.shake}>refuse</button>
        <output>{String(shake.shaking)}</output>
      </div>
    )
  }

  it("is still until asked, then flips between the two names so every refusal restarts it", () => {
    render(<Field />)
    const field = screen.getByTestId("field")
    expect(field).not.toHaveAttribute("data-shake")
    fireEvent.click(screen.getByText("refuse"))
    expect(field).toHaveAttribute("data-shake", "a")
    expect(screen.getByRole("status")).toHaveTextContent("true")
    fireEvent.click(screen.getByText("refuse"))
    expect(field).toHaveAttribute("data-shake", "b")
    fireEvent.click(screen.getByText("refuse"))
    expect(field).toHaveAttribute("data-shake", "a")
  })

  it("clears when its own animation ends, and ignores a child's or any other", () => {
    const { result } = renderHook(() => useShake())
    act(() => result.current.shake())
    act(() => result.current.props.onAnimationEnd(ended("pulse")))
    expect(result.current.props["data-shake"]).toBe("a")
    act(() => result.current.props.onAnimationEnd(ended("motion-shake-a", false)))
    expect(result.current.shaking).toBe(true)
    act(() => result.current.props.onAnimationEnd(ended("motion-shake-a")))
    expect(result.current.props["data-shake"]).toBeUndefined()
    expect(result.current.shaking).toBe(false)
  })

  it("keeps the same shake function between renders", () => {
    const { result, rerender } = renderHook(() => useShake())
    const first = result.current.shake
    act(() => first())
    rerender()
    expect(result.current.shake).toBe(first)
  })
})

describe("withViewTransition", () => {
  it("just makes the change where the browser has no View Transitions (jsdom)", async () => {
    const update = vi.fn()
    await withViewTransition(update)
    expect(update).toHaveBeenCalledOnce()
    expect(document.documentElement).not.toHaveAttribute("data-motion-transition")
  })

  it("marks the root for the length of the transition, so only ours runs on the motion roles", async () => {
    let finish!: () => void
    const doc = document as unknown as { startViewTransition?: (update: () => void) => { finished: Promise<void> } }
    doc.startViewTransition = (update: () => void) => {
      update()
      return { finished: new Promise<void>((resolve) => (finish = resolve)) }
    }
    try {
      const update = vi.fn()
      const done = withViewTransition(update)
      expect(update).toHaveBeenCalledOnce()
      expect(document.documentElement).toHaveAttribute("data-motion-transition")
      finish()
      await done
      expect(document.documentElement).not.toHaveAttribute("data-motion-transition")
    } finally {
      delete doc.startViewTransition
    }
  })
})

describe("motionContracts", () => {
  const TRANSFORM_AND_OPACITY = new Set(["opacity", "scale", "translate", "rotate", "transform"])
  const COLOUR = new Set(["color", "background-color", "border-color", "box-shadow"])

  it("has unique ids", () => {
    const ids = motionContracts.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("animates transform and opacity, or says why not", () => {
    for (const contract of motionContracts) {
      const other = contract.properties.filter((p) => !TRANSFORM_AND_OPACITY.has(p) && !COLOUR.has(p))
      if (other.length) expect("exception" in contract && contract.exception, `${contract.id}: ${other.join(", ")}`).toBeTruthy()
    }
  })

  it("never moves under reduced motion, and never animates more than it does in full", () => {
    for (const contract of motionContracts) {
      expect(contract.reduced.length, contract.id).toBeGreaterThan(0)
      for (const p of contract.reducedProperties) {
        expect(["scale", "translate", "rotate", "transform", "height", "width"], `${contract.id}: ${p}`).not.toContain(p)
        expect(contract.properties as readonly string[], `${contract.id}: ${p}`).toContain(p)
      }
    }
  })

  it("gives no bounce to anything met often", () => {
    for (const contract of motionContracts) {
      const frequency: string = contract.frequency
      if (frequency === "constant" || frequency === "frequent") {
        expect(contract.easing.join(" "), contract.id).not.toMatch(/spring|emphasis/)
      }
    }
  })
})

describe("CheckDraw", () => {
  it("is a decorative path of length 1 on the draw recipe", () => {
    const { container } = render(<CheckDraw />)
    const svg = container.querySelector('[data-slot="check-draw"]')!
    expect(svg).toHaveAttribute("aria-hidden", "true")
    const path = svg.querySelector("path")!
    expect(path).toHaveClass("motion-draw")
    expect(path).toHaveAttribute("pathLength", "1")
  })
})
