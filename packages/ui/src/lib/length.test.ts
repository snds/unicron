import { afterEach, describe, expect, it, vi } from "vitest"

import { joinIds } from "./ids"
import { readLength } from "./length"

afterEach(() => {
  vi.restoreAllMocks()
  document.documentElement.style.removeProperty("--knob")
  document.documentElement.style.removeProperty("font-size")
})

function knob(value: string, el: HTMLElement = document.documentElement) {
  el.style.setProperty("--knob", value)
}

describe("readLength: a length knob in pixels, one home for every part", () => {
  it("reads px as it is and rem against the root's font size", () => {
    const el = document.createElement("div")
    document.body.append(el)
    knob("24px", el)
    expect(readLength(el, "--knob", 1)).toBe(24)
    knob("1.5rem", el)
    expect(readLength(el, "--knob", 1)).toBe(24)
    document.documentElement.style.fontSize = "20px"
    expect(readLength(el, "--knob", 1)).toBe(30)
    el.remove()
  })

  it("null reads the page's root", () => {
    knob("0.5rem")
    expect(readLength(null, "--knob", 99)).toBe(8)
  })

  it("falls back when the knob is missing or is not a plain, non-negative px or rem number", () => {
    const el = document.createElement("div")
    document.body.append(el)
    expect(readLength(el, "--knob", 7)).toBe(7)
    for (const wrong of ["-24px", "1.5em", "24", "calc(1rem + 2px)", "1.2.3px", "px", "50%", ""]) {
      knob(wrong, el)
      expect(readLength(el, "--knob", 7)).toBe(7)
    }
    // A fallback of NaN says "not set" to a caller that tells the two apart.
    expect(readLength(el, "--missing", Number.NaN)).toBeNaN()
    el.remove()
  })

  it("falls back when the style cannot be read", () => {
    vi.spyOn(window, "getComputedStyle").mockImplementation(() => {
      throw new Error("no style")
    })
    expect(readLength(document.body, "--knob", 12)).toBe(12)
  })
})

describe("joinIds", () => {
  it("joins the ids that are there, and is undefined when none is", () => {
    expect(joinIds("a", undefined, false, null, "b")).toBe("a b")
    expect(joinIds(undefined, false, null, "")).toBeUndefined()
  })
})
