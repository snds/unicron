import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Kbd, KbdGroup } from "./kbd"

describe("Kbd", () => {
  it("is a kbd element with its key as typed", () => {
    render(<Kbd>Esc</Kbd>)
    const key = screen.getByText("Esc")
    expect(key.tagName).toBe("KBD")
    expect(key).toHaveAttribute("data-slot", "kbd")
  })

  it("is mono in a 20px hairline box on the control radius, in the secondary ink", () => {
    render(<Kbd>Esc</Kbd>)
    const classes = screen.getByText("Esc").className.split(/\s+/)
    expect(classes).toEqual(
      expect.arrayContaining(["type-meta", "rule-box", "bg-surface-raised", "text-support-foreground", "h-5", "min-w-5", "rounded-lg"])
    )
    // As typed: a key's case can matter, so it never takes the caps of an overline.
    expect(classes).not.toContain("type-overline")
    expect(classes).not.toContain("uppercase")
  })

  it("inside a tooltip it takes the tooltip's own ink, on whatever surface that is", () => {
    render(<Kbd>E</Kbd>)
    const classes = screen.getByText("E").className.split(/\s+/)
    expect(classes).toEqual(
      expect.arrayContaining([
        "in-data-[slot=tooltip-content]:bg-transparent",
        "in-data-[slot=tooltip-content]:text-inherit",
        "in-data-[slot=tooltip-content]:inset-ring",
      ])
    )
  })

  it("a caller's className is kept", () => {
    render(<Kbd className="ml-1">E</Kbd>)
    expect(screen.getByText("E").className.split(/\s+/)).toContain("ml-1")
  })

  it("KbdGroup holds a run of keys", () => {
    const { container } = render(
      <KbdGroup>
        <Kbd>Shift</Kbd>
        <Kbd>Enter</Kbd>
      </KbdGroup>
    )
    const group = container.querySelector('[data-slot="kbd-group"]')!
    expect(group.tagName).toBe("KBD")
    expect(group.querySelectorAll('[data-slot="kbd"]')).toHaveLength(2)
  })
})
