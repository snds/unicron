import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Separator } from "./separator"

describe("Separator", () => {
  it("is a horizontal separator by default: a 1px hairline in the rule colour", () => {
    render(<Separator />)
    const rule = screen.getByRole("separator")
    expect(rule).toHaveAttribute("data-slot", "separator")
    expect(rule).toHaveAttribute("data-orientation", "horizontal")
    expect(rule.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-border", "shrink-0", "data-horizontal:h-px", "data-horizontal:w-full"]))
  })

  it("vertical says so, and stretches to the row it divides", () => {
    render(<Separator orientation="vertical" />)
    const rule = screen.getByRole("separator")
    expect(rule).toHaveAttribute("aria-orientation", "vertical")
    expect(rule.className.split(/\s+/)).toEqual(expect.arrayContaining(["data-vertical:w-px", "data-vertical:self-stretch"]))
  })

  it("has no radius, shadow or second colour of its own", () => {
    render(<Separator />)
    const classes = screen.getByRole("separator").className.split(/\s+/)
    expect(classes.some((c) => /^(rounded|shadow)/.test(c))).toBe(false)
    expect(classes.filter((c) => c.startsWith("bg-"))).toEqual(["bg-border"])
  })
})
