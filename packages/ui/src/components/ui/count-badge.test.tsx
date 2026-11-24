import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { CountBadge, countBadgeText } from "./count-badge"

describe("CountBadge", () => {
  it("shows plain digits, never zero-padded, and caps at 99+", () => {
    expect(countBadgeText(3)).toBe("3")
    expect(countBadgeText(42)).toBe("42")
    expect(countBadgeText(120)).toBe("99+")
    expect(countBadgeText(12, 9)).toBe("9+")
  })

  it("names its severity for the stylesheet, default unless told", () => {
    const { container, rerender } = render(<CountBadge count={2} />)
    const badge = container.querySelector('[data-slot="count-badge"]')!
    expect(badge).toHaveAttribute("data-severity", "default")
    expect(badge).toHaveAttribute("aria-hidden")
    rerender(<CountBadge count={2} severity="urgent" />)
    expect(container.querySelector('[data-slot="count-badge"]')).toHaveAttribute("data-severity", "urgent")
  })
})
