import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { SummaryBlock, summaryBlockCopy } from "./summary-block"

const LINES = ["Two-bedroom cabin is booked for Nov 20 to 22.", "Check-in is after 3 PM. No chains needed.", "Mira asks you to bring the board games."]

describe("SummaryBlock", () => {
  it("is Figma's mark: a 2px live edge 16px clear of the text, a live overline, body lines 4px apart", () => {
    const { container } = render(<SummaryBlock overline="Summary // 03 points" lines={LINES} />)
    const region = screen.getByRole("region", { name: "Summary // 03 points" })
    expect(region).toHaveAttribute("data-state", "ready")
    expect(region.className).toContain("gap-4")
    const edge = container.querySelector('[data-slot="summary-block-edge"]')!
    for (const c of ["bg-secondary-live", "w-(--stroke-emphasis)", "self-stretch"]) expect(edge.className).toContain(c)
    expect(edge).toHaveAttribute("aria-hidden")
    const overline = container.querySelector('[data-slot="summary-block-overline"]')!
    expect(overline.className).toContain("type-overline")
    expect(overline.className).toContain("text-secondary-live")
    const list = screen.getByRole("list")
    expect(list.className).toContain("gap-1")
    const items = within(list).getAllByRole("listitem")
    expect(items.map((i) => i.textContent)).toEqual(LINES)
    expect(items[0].className).toContain("type-body")
    expect(items[0].className).toContain("text-text-body")
  })

  it("holds children, a footer, a caption and actions, in that order under the lines", () => {
    const { container } = render(
      <SummaryBlock
        overline="Replies // 03"
        footer="Newest 12 of 30 messages // qwen3.6:35b"
        caption="It can be wrong. Check what matters."
        actions={<button type="button">Copy</button>}
      >
        <button type="button">Sounds good, see you on the 20th.</button>
      </SummaryBlock>
    )
    const order = [...container.querySelectorAll("[data-slot^='summary-block-']")].map((el) => el.getAttribute("data-slot"))
    expect(order).toEqual([
      "summary-block-edge",
      "summary-block-overline",
      "summary-block-body",
      "summary-block-footer",
      "summary-block-caption",
      "summary-block-actions",
    ])
    expect(container.querySelector('[data-slot="summary-block-footer"]')!.className).toContain("type-overline")
    expect(container.querySelector('[data-slot="summary-block-caption"]')!.className).toContain("type-caption")
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument()
  })

  it("while loading: busy, a thinking orb before the overline, live bars where the lines go", () => {
    const { container } = render(<SummaryBlock overline="Summary" state="loading" lines={LINES} />)
    const region = screen.getByRole("region", { name: /Summary/ })
    expect(region).toHaveAttribute("aria-busy", "true")
    expect(screen.getByRole("img", { name: summaryBlockCopy.loading })).toHaveAttribute("data-state", "thinking")
    const bars = container.querySelectorAll('[data-slot="summary-block-loading"] > span')
    expect(bars).toHaveLength(3)
    expect(bars[0].firstElementChild!.className).toContain("bg-running-surface")
    // The lines wait until the model is done.
    expect(screen.queryByText(LINES[0])).toBeNull()
  })

  it("on error: one critical line, said once, and the actions", () => {
    render(
      <SummaryBlock overline="Summary" state="error" error="The model didn't answer." actions={<button type="button">Try again</button>} />
    )
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("The model didn't answer.")
    expect(alert.className).toContain("text-critical-text")
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument()
  })
})
