import { describe, expect, it } from "vitest"

import { DISMISS_SHARE, FLICK_SPEED, releaseShare, releaseVelocity, shouldDismiss } from "./drag-release"

describe("releaseVelocity", () => {
  it("reads the last moment of the drag, not the whole of it", () => {
    // Slow for a second, then 40px in the last 50ms: 0.8 px/ms.
    const samples = [
      { t: 0, at: 0 },
      { t: 1000, at: 10 },
      { t: 1050, at: 50 },
    ]
    expect(releaseVelocity(samples)).toBeCloseTo(0.8)
  })

  it("is 0 with one sample, and negative for a drag back toward open", () => {
    expect(releaseVelocity([{ t: 0, at: 0 }])).toBe(0)
    expect(releaseVelocity([])).toBe(0)
    expect(releaseVelocity([{ t: 0, at: 40 }, { t: 40, at: 0 }])).toBeCloseTo(-1)
  })
})

describe("shouldDismiss", () => {
  it("goes past its share of the size, however slow", () => {
    expect(shouldDismiss({ offset: 400 * DISMISS_SHARE + 1, size: 400, velocity: 0 })).toBe(true)
    expect(shouldDismiss({ offset: 400 * DISMISS_SHARE - 1, size: 400, velocity: 0 })).toBe(false)
  })

  it("goes on a flick, however short", () => {
    expect(shouldDismiss({ offset: 10, size: 400, velocity: FLICK_SPEED + 0.1 })).toBe(true)
  })

  it("stays when flicked back toward open, or pulled up past it", () => {
    expect(shouldDismiss({ offset: 300, size: 400, velocity: -0.2 })).toBe(false)
    expect(shouldDismiss({ offset: -12, size: 400, velocity: 2 })).toBe(false)
  })
})

describe("releaseShare", () => {
  it("is the whole role for a let-go, and down to half for a fast flick", () => {
    expect(releaseShare(0)).toBe(1)
    expect(releaseShare(-3)).toBe(1)
    expect(releaseShare(0.5)).toBeCloseTo(1 / 1.5)
    expect(releaseShare(10)).toBe(0.5)
  })
})
