import { describe, expect, it } from "vitest"

import { buttonVariants } from "./button"

// A link drawn as a button takes buttonVariants' classes straight into className, with no merge of
// its own. Unmerged, the base's border-transparent and the outline's border-border both landed,
// and the transparent one won in light mode: the link had no edge beside a real button.
describe("buttonVariants", () => {
  it("merges its classes, so the variant's border colour is the only one", () => {
    const classes = buttonVariants({ variant: "outline" }).split(/\s+/)
    expect(classes).toContain("border-border")
    expect(classes).not.toContain("border-transparent")
  })

  it("keeps a caller's class over the variant's", () => {
    const classes = buttonVariants({ variant: "outline", className: "border-input" }).split(/\s+/)
    expect(classes).toContain("border-input")
    expect(classes).not.toContain("border-border")
  })
})
