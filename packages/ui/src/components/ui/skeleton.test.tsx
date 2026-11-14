import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Skeleton } from "./skeleton"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("Skeleton", () => {
  it('variant="row" is a full-width list row: two 12px bars 20px apart over a hairline, with no className', () => {
    const { container } = render(<Skeleton variant="row" />)
    const row = container.querySelector('[data-slot="skeleton"]')!
    expect(row).toHaveAttribute("data-variant", "row")
    expect(classesOf(row)).toEqual(expect.arrayContaining(["w-full", "flex-col", "gap-5", "py-4", "rule-b"]))
    const bars = row.querySelectorAll('[data-slot="skeleton-bar"]')
    expect(bars).toHaveLength(2)
    for (const bar of bars) {
      expect(classesOf(bar)).toEqual(expect.arrayContaining(["h-3", "bg-surface-raised", "animate-pulse"]))
      expect(classesOf(bar).some((c) => c.startsWith("rounded"))).toBe(false)
    }
    // The row itself is not a block of colour: only its bars are.
    expect(classesOf(row).some((c) => c.startsWith("bg-"))).toBe(false)
  })

  it("a row is never shorter than --c-skeleton-row-height, so an app's density knob still sizes it", () => {
    const { container } = render(<Skeleton variant="row" />)
    expect(classesOf(container.querySelector('[data-slot="skeleton"]')!)).toContain("min-h-(--c-skeleton-row-height)")
  })

  it("bar lengths alternate from one row to the next", () => {
    const { container } = render(
      <div>
        <Skeleton variant="row" />
        <Skeleton variant="row" />
      </div>
    )
    const [first, second] = container.querySelectorAll('[data-slot="skeleton-bar"]')
    expect(classesOf(first)).toEqual(expect.arrayContaining(["w-1/2", "group-even/skeleton:w-3/5"]))
    expect(classesOf(second)).toEqual(expect.arrayContaining(["w-3/4", "group-even/skeleton:w-1/2"]))
    expect(classesOf(container.querySelector('[data-slot="skeleton"]')!)).toContain("group/skeleton")
  })

  it("the default is one square bar sized by className, which still wins", () => {
    const { container } = render(<Skeleton className="h-3 w-32 rounded-full" data-row="" />)
    const bone = container.querySelector('[data-slot="skeleton"]')!
    expect(bone).toHaveAttribute("data-variant", "default")
    expect(bone).toHaveAttribute("data-row", "")
    expect(classesOf(bone)).toEqual(expect.arrayContaining(["bg-surface-raised", "animate-pulse", "h-3", "w-32", "rounded-full"]))
    expect(classesOf(bone)).not.toContain("rounded-none")
    expect(bone.className).not.toContain("--c-skeleton-row-height")
    expect(bone.querySelector('[data-slot="skeleton-bar"]')).toBeNull()
  })

  it("the default has square corners unless told otherwise", () => {
    const { container } = render(<Skeleton className="h-4 w-1/3" />)
    const bone = classesOf(container.querySelector('[data-slot="skeleton"]')!)
    expect(bone).toContain("rounded-none")
    expect(bone).not.toContain("rounded-md")
  })
})
