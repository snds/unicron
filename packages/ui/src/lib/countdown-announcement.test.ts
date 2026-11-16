import { describe, expect, it } from "vitest"

import { countdownLeftWords, passedCountdownMark } from "./countdown-announcement"

describe("countdownLeftWords", () => {
  it("says the time left in words, whole seconds rounded up", () => {
    expect(countdownLeftWords(300)).toBe("5 minutes left")
    expect(countdownLeftWords(60)).toBe("1 minute left")
    expect(countdownLeftWords(90)).toBe("1 minute 30 seconds left")
    expect(countdownLeftWords(30)).toBe("30 seconds left")
    expect(countdownLeftWords(1)).toBe("1 second left")
    expect(countdownLeftWords(9.2)).toBe("10 seconds left")
    expect(countdownLeftWords(-3)).toBe("0 seconds left")
  })
})

describe("passedCountdownMark", () => {
  it("finds the mark a tick passed: from above it to at or below it", () => {
    expect(passedCountdownMark(301, 300, [300, 60])).toBe(300)
    expect(passedCountdownMark(300, 299, [300, 60])).toBeNull()
    expect(passedCountdownMark(61, 60, [300, 60])).toBe(60)
  })

  it("still says a mark a skipped tick jumped past, and two at once as the nearer one", () => {
    expect(passedCountdownMark(64, 57, [60, 30, 10])).toBe(60)
    expect(passedCountdownMark(64, 8, [60, 30, 10])).toBe(10)
  })

  it("says nothing on the first reading, while the time goes up (a restart), or without marks", () => {
    expect(passedCountdownMark(undefined, 60, [60])).toBeNull()
    expect(passedCountdownMark(10, 75, [60])).toBeNull()
    expect(passedCountdownMark(61, 60, [])).toBeNull()
    expect(passedCountdownMark(61, 60, undefined)).toBeNull()
  })

  it("compares whole seconds, as the visible countdown shows them", () => {
    // 60.4 shows as 61; 59.6 shows as 60: the mark is passed.
    expect(passedCountdownMark(60.4, 59.6, [60])).toBe(60)
    expect(passedCountdownMark(60.9, 60.2, [60])).toBeNull()
  })
})
