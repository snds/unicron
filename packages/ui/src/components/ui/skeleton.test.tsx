import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Skeleton } from "./skeleton"

describe("Skeleton", () => {
  it('variant="row" is a full-width list row sized by --c-skeleton-row-height, with no className', () => {
    const { container } = render(<Skeleton variant="row" />)
    const row = container.querySelector('[data-slot="skeleton"]')!
    expect(row).toHaveAttribute("data-variant", "row")
    expect(row.className).toContain("h-(--c-skeleton-row-height)")
    expect(row.className).toContain("w-full")
    expect(row.className).toContain("animate-pulse")
  })

  it("the default is unchanged: sized by className, which still wins", () => {
    const { container } = render(<Skeleton className="h-3 w-32 rounded-full" data-row="" />)
    const bone = container.querySelector('[data-slot="skeleton"]')!
    expect(bone).toHaveAttribute("data-variant", "default")
    expect(bone).toHaveAttribute("data-row", "")
    expect(bone.className.split(" ")).toEqual(expect.arrayContaining(["bg-muted", "animate-pulse", "h-3", "w-32", "rounded-full"]))
    expect(bone.className).not.toContain("rounded-md")
    expect(bone.className).not.toContain("--c-skeleton-row-height")
  })
})
