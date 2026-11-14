import { render, screen } from "@testing-library/react"

import { DigitGroups, digitGroupSize, splitDigitGroups, spellDigitGroups } from "./digit-groups"

describe("DigitGroups: where a code breaks", () => {
  it("keeps a code's own breaks (spaces, dashes, dots)", () => {
    expect(splitDigitGroups("7KQ2M-9XH4P")).toEqual(["7KQ2M", "9XH4P"])
    expect(splitDigitGroups("3F9A C21E 77B0")).toEqual(["3F9A", "C21E", "77B0"])
    expect(splitDigitGroups(" 482 913 ")).toEqual(["482", "913"])
  })

  it("cuts a code with none: threes up to twelve, then fives or fours where they divide it", () => {
    expect(digitGroupSize(6)).toBe(3)
    expect(digitGroupSize(9)).toBe(3)
    expect(digitGroupSize(8)).toBe(4)
    expect(digitGroupSize(60)).toBe(5)
    expect(digitGroupSize(16)).toBe(4)
    expect(digitGroupSize(7)).toBe(3)
    expect(splitDigitGroups("482913")).toEqual(["482", "913"])
    expect(splitDigitGroups("4829", 2)).toEqual(["48", "29"])
    expect(splitDigitGroups("")).toEqual([])
  })

  it("is spoken one character at a time, with a pause at each group", () => {
    expect(spellDigitGroups(["482", "913"])).toBe("4 8 2, 9 1 3")
  })
})

describe("DigitGroups: what it draws", () => {
  it("draws the groups for the eye and spells them for a screen reader, with the label first", () => {
    const { container } = render(<DigitGroups value="482913" label="Pairing code" />)
    const groups = container.querySelectorAll('[data-slot="digit-groups-group"]')
    expect(Array.from(groups, (g) => g.textContent)).toEqual(["482", "913"])
    for (const g of groups) expect(g).toHaveAttribute("aria-hidden")
    expect(screen.getByText("Pairing code: 4 8 2, 9 1 3")).toHaveClass("sr-only")
  })

  it("takes the type role of its size, in mono with a slashed zero", () => {
    const root = (size: "sm" | "md" | "lg") => {
      const { container, unmount } = render(<DigitGroups value="019552" size={size} />)
      const cls = container.querySelector('[data-slot="digit-groups"]')!.className
      unmount()
      return cls
    }
    expect(root("sm")).toContain("type-code-inline")
    expect(root("md")).toContain("type-number-count")
    expect(root("lg")).toContain("type-code-display")
    expect(root("md")).toContain("[font-feature-settings:'zero']")
    expect(root("md")).toContain("gap-x-(--c-digit-groups-gap)")
  })
})
