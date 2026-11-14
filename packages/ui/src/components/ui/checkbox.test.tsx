import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Checkbox } from "./checkbox"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("Checkbox", () => {
  it("is a checkbox named by its label, unchecked until pressed", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(<Checkbox aria-label="Sleeping bags" onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole("checkbox", { name: "Sleeping bags" })
    expect(box).toHaveAttribute("data-slot", "checkbox")
    expect(box).toHaveAttribute("aria-checked", "false")
    expect(box.querySelector('[data-slot="checkbox-indicator"]')).toBeNull()
    await user.click(box)
    expect(box).toHaveAttribute("aria-checked", "true")
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything())
  })

  it("checks with Space from the keyboard", async () => {
    const user = userEvent.setup()
    render(<Checkbox aria-label="Sleeping bags" />)
    await user.tab()
    const box = screen.getByRole("checkbox")
    expect(box).toHaveFocus()
    await user.keyboard(" ")
    expect(box).toHaveAttribute("aria-checked", "true")
    await user.keyboard(" ")
    expect(box).toHaveAttribute("aria-checked", "false")
  })

  it("takes its name from a label beside it, and checks when the label is pressed", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Checkbox id="bags" />
        <label htmlFor="bags">Sleeping bags</label>
      </>
    )
    const box = screen.getByRole("checkbox", { name: "Sleeping bags" })
    await user.click(screen.getByText("Sleeping bags"))
    expect(box).toHaveAttribute("aria-checked", "true")
  })

  it("draws its check as an inline SVG in the ground colour: no icon, no font", () => {
    render(<Checkbox aria-label="Sleeping bags" defaultChecked />)
    const box = screen.getByRole("checkbox")
    const mark = box.querySelector('svg[data-slot="checkbox-mark"]')!
    expect(mark).toHaveAttribute("aria-hidden", "true")
    expect(mark).toHaveAttribute("stroke", "currentColor")
    expect(mark.querySelector('path[data-mark="check"]')).toBeInTheDocument()
    expect(box.querySelector('[data-slot="icon"]')).toBeNull()
    expect(box.textContent).toBe("")
    expect(classesOf(box)).toEqual(expect.arrayContaining(["text-background", "data-checked:bg-foreground"]))
  })

  it("indeterminate says mixed and shows the dash instead of the check", () => {
    render(<Checkbox aria-label="Select all" indeterminate />)
    const box = screen.getByRole("checkbox")
    expect(box).toHaveAttribute("aria-checked", "mixed")
    expect(box).toHaveAttribute("data-indeterminate")
    expect(classesOf(box)).toContain("data-indeterminate:bg-foreground")
    const dash = box.querySelector('path[data-mark="indeterminate"]')!
    const check = box.querySelector('path[data-mark="check"]')!
    expect(dash.getAttribute("class")).toContain("group-data-indeterminate/checkbox:block")
    expect(check.getAttribute("class")).toContain("group-data-indeterminate/checkbox:hidden")
  })

  it("unchecked is a 16px square on the control radius: raised surface, an edge in the label ink, no fill of its own", () => {
    render(<Checkbox aria-label="Sleeping bags" />)
    const box = classesOf(screen.getByRole("checkbox"))
    expect(box).toEqual(expect.arrayContaining(["size-4", "rounded-lg", "data-unchecked:bg-surface-raised", "data-unchecked:rule-box"]))
    // The edge is the only thing that shows an empty box, so the rule takes the checkbox's edge
    // knob (the label ink, 3:1 or more), not the hairline.
    expect(box).toContain("data-unchecked:[--line-rule:var(--c-checkbox-edge)]")
    // The hairline belongs to the unchecked state only: on the ink fill it would draw a second edge.
    expect(box).not.toContain("rule-box")
    expect(box.some((c) => c.includes("bg-primary"))).toBe(false)
  })

  it("leaves the stylesheet's focus ring alone, and widens its touch target on a coarse pointer", () => {
    render(<Checkbox aria-label="Sleeping bags" />)
    const box = classesOf(screen.getByRole("checkbox"))
    expect(box).toContain("hit-area")
    expect(box.some((c) => /(^|:)outline-(none|hidden)$/.test(c) || c.startsWith("focus-visible:"))).toBe(false)
    // Invalid: a 2px inside edge in the critical fill, as an invalid field has.
    expect(box).toEqual(expect.arrayContaining(["aria-invalid:inset-ring-2", "aria-invalid:inset-ring-critical-fill"]))
  })

  it("disabled takes no press and says so", () => {
    const onCheckedChange = vi.fn()
    render(<Checkbox aria-label="Sleeping bags" disabled onCheckedChange={onCheckedChange} />)
    const box = screen.getByRole("checkbox")
    expect(box).toHaveAttribute("aria-disabled", "true")
    fireEvent.click(box)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(classesOf(box)).toEqual(expect.arrayContaining(["data-disabled:pointer-events-none", "data-disabled:opacity-50"]))
  })

  it("is a peer, so a label beside it can strike a done item through", () => {
    render(<Checkbox aria-label="Sleeping bags" />)
    expect(classesOf(screen.getByRole("checkbox"))).toContain("peer")
  })
})
