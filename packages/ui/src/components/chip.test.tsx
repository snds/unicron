import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Chip, ChipAction, ChipRemove } from "./chip"

describe("Chip", () => {
  it("is square on the 2px corner and 24 tall, the value as written in caption", () => {
    render(<Chip variant="secondary">Mira Chen</Chip>)
    const chip = screen.getByText("Mira Chen")
    for (const name of ["h-6", "rounded-lg", "type-caption", "rule-box", "bg-surface-raised"]) expect(chip.className).toContain(name)
    expect(chip.className).not.toContain("rounded-full")
  })

  // The controls hand-off: the remove was Button size icon-xs (32) inside a 28px chip. It is now the
  // chip's own height, a 24px square, and widens to 44 on a coarse pointer.
  it("its remove is a named 24px square, 44 to a finger, and removes", async () => {
    const onRemove = vi.fn()
    render(
      <Chip variant="outline">
        <span>trip</span>
        <ChipRemove label="Remove tag trip" onClick={onRemove} />
      </Chip>
    )
    const remove = screen.getByRole("button", { name: "Remove tag trip" })
    expect(remove).toHaveAttribute("data-slot", "chip-remove")
    for (const name of ["size-6", "hit-area"]) expect(remove.className).toContain(name)
    expect(remove.className).not.toContain("size-8")
    await userEvent.click(remove)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it("tone critical is ink on the soft critical ground inside a critical edge", () => {
    render(<Chip tone="critical">mira.chen@</Chip>)
    const chip = screen.getByText("mira.chen@")
    expect(chip).toHaveAttribute("data-tone", "critical")
    for (const name of ["bg-critical-soft", "inset-ring-critical-fill"]) expect(chip.className).toContain(name)
  })

  it("a main action fills the chip and draws its ring inside it", () => {
    render(
      <Chip variant="outline">
        <ChipAction>
          <span>Design crit</span>
        </ChipAction>
      </Chip>
    )
    const action = screen.getByRole("button", { name: "Design crit" })
    expect(action.className).toContain("focus-visible:-outline-offset-2")
    expect(action.className).toContain("hover:bg-state-hover")
    // `outline-none` beside `outline-2` draws no ring in Tailwind 4 (it sets the style the width
    // reads): the stylesheet's own :focus-visible rule must be left to draw it.
    expect(action.className.split(/\s+/)).not.toContain("outline-none")
  })

  it("the remove button keeps the stylesheet's focus ring, drawn inside the chip", () => {
    render(
      <Chip variant="secondary">
        #trip <ChipRemove label="Remove tag trip" />
      </Chip>
    )
    const remove = screen.getByRole("button", { name: "Remove tag trip" })
    expect(remove.className).toContain("focus-visible:-outline-offset-2")
    expect(remove.className.split(/\s+/)).not.toContain("outline-none")
  })
})
