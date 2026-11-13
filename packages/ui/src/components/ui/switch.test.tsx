import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Switch } from "./switch"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("Switch (Figma 32:53, Toggle)", () => {
  it("is a switch named by its label, off until turned on", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(<Switch aria-label="Lock after 5 minutes" onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch", { name: "Lock after 5 minutes" })
    expect(control).toHaveAttribute("data-slot", "switch")
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(control).toHaveAttribute("data-unchecked")
    await user.click(control)
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(control).toHaveAttribute("data-checked")
    expect(onCheckedChange).toHaveBeenLastCalledWith(true, expect.anything())
  })

  it("turns with Space and with Enter from the keyboard", async () => {
    const user = userEvent.setup()
    render(<Switch aria-label="Lock after 5 minutes" />)
    await user.tab()
    const control = screen.getByRole("switch")
    expect(control).toHaveFocus()
    await user.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "true")
    await user.keyboard("{Enter}")
    expect(control).toHaveAttribute("aria-checked", "false")
  })

  it("takes its name from a label beside it, and turns when the label is pressed", async () => {
    const user = userEvent.setup()
    render(
      <>
        <Switch id="lock" defaultChecked />
        <label htmlFor="lock">Lock after 5 minutes</label>
      </>
    )
    const control = screen.getByRole("switch", { name: "Lock after 5 minutes" })
    expect(control).toHaveAttribute("aria-checked", "true")
    await user.click(screen.getByText("Lock after 5 minutes"))
    expect(control).toHaveAttribute("aria-checked", "false")
  })

  it("disabled takes no press and says so", () => {
    const onCheckedChange = vi.fn()
    render(<Switch aria-label="Lock after 5 minutes" disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch")
    expect(control).toHaveAttribute("aria-disabled", "true")
    expect(control).toHaveAttribute("data-disabled")
    fireEvent.click(control)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(classesOf(control)).toEqual(expect.arrayContaining(["data-disabled:pointer-events-none", "data-disabled:opacity-50"]))
  })

  it("the track is 44 × 24 with 4px of padding on the control radius", () => {
    render(<Switch aria-label="Lock after 5 minutes" />)
    const track = classesOf(screen.getByRole("switch"))
    expect(track).toEqual(expect.arrayContaining(["h-6", "w-11", "p-1", "rounded-lg"]))
    expect(track).not.toContain("rounded-full")
  })

  it("on is the primary fill; off is the raised surface with a hairline", () => {
    render(<Switch aria-label="Lock after 5 minutes" />)
    const track = classesOf(screen.getByRole("switch"))
    expect(track).toEqual(expect.arrayContaining(["data-checked:bg-primary", "data-unchecked:bg-surface-raised", "data-unchecked:rule-box"]))
  })

  it("the knob is a 16px square that travels 20px on a motion role", () => {
    const { container } = render(<Switch aria-label="Lock after 5 minutes" />)
    const knob = classesOf(container.querySelector('[data-slot="switch-thumb"]')!)
    expect(knob).toEqual(
      expect.arrayContaining([
        "size-4",
        "rounded-none",
        "data-unchecked:translate-x-0",
        "data-checked:translate-x-5",
        "data-checked:bg-primary-foreground",
        "data-unchecked:bg-muted-foreground",
        "transition-transform",
        "duration-(--motion-fast)",
      ])
    )
    expect(knob.some((c) => c.startsWith("rounded-") && c !== "rounded-none")).toBe(false)
  })

  it("draws the shared focus ring, and widens its touch target on a coarse pointer", () => {
    render(<Switch aria-label="Lock after 5 minutes" />)
    const track = classesOf(screen.getByRole("switch"))
    expect(track).toEqual(expect.arrayContaining(["focus-visible:outline-2", "focus-visible:outline-offset-2", "focus-visible:outline-ring", "hit-area"]))
    expect(track).not.toContain("outline-none")
  })

  it("size=\"sm\" is still accepted and draws the one size", () => {
    render(<Switch aria-label="Lock after 5 minutes" size="sm" />)
    expect(classesOf(screen.getByRole("switch"))).toEqual(expect.arrayContaining(["h-6", "w-11"]))
  })

  it("submits with a form under its name", () => {
    const { container } = render(
      <form>
        <Switch name="lock" defaultChecked aria-label="Lock after 5 minutes" />
      </form>
    )
    expect(new FormData(container.querySelector("form")!).get("lock")).toBe("on")
  })
})
