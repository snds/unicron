import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { RadioGroup, RadioGroupItem, RadioRow } from "./radio-group"

describe("RadioGroup and RadioRow (contract 5.1b #23)", () => {
  function Images({ onValueChange }: { onValueChange?: (value: unknown) => void }) {
    return (
      <RadioGroup aria-label="Remote images" defaultValue="ask" onValueChange={onValueChange}>
        <RadioRow value="ask" label="Ask" description="Blocked until you load them, message by message." />
        <RadioRow value="contacts" label="From contacts" description="Loaded for people in your contacts; asked for everyone else." />
        <RadioRow value="always" label="Always" description="Every message loads its images." />
      </RadioGroup>
    )
  }

  it("is a named radiogroup; each row's radio is named by its label and described by its sentence", () => {
    render(<Images />)
    expect(screen.getByRole("radiogroup", { name: "Remote images" })).toBeInTheDocument()
    const ask = screen.getByRole("radio", { name: "Ask" })
    expect(ask).toHaveAttribute("aria-checked", "true")
    expect(ask).toHaveAccessibleDescription("Blocked until you load them, message by message.")
  })

  it("the whole row takes the press; the arrow keys move the choice", async () => {
    const onValueChange = vi.fn()
    render(<Images onValueChange={onValueChange} />)
    await userEvent.click(screen.getByText("Loaded for people in your contacts; asked for everyone else."))
    expect(screen.getByRole("radio", { name: "From contacts" })).toHaveAttribute("aria-checked", "true")
    expect(onValueChange.mock.calls.at(-1)?.[0]).toBe("contacts")
    screen.getByRole("radio", { name: "From contacts" }).focus()
    await userEvent.keyboard("{ArrowDown}")
    expect(screen.getByRole("radio", { name: "Always" })).toHaveAttribute("aria-checked", "true")
  })

  it("a row: rule on top, 12 / 16 in, label in ui, sentence in caption; rows stack with no gap", () => {
    render(<Images />)
    const row = screen.getByText("Ask").closest('[data-slot="radio-row"]')!
    for (const name of ["rule-t", "px-4", "py-3", "hover:bg-state-hover"]) expect(row.className).toContain(name)
    expect(screen.getByText("Ask").className).toContain("type-ui")
    expect(screen.getByText(/Blocked until/).className).toContain("type-caption")
    expect(screen.getByRole("radiogroup").className).toContain("has-[>[data-slot=radio-row]]:gap-0")
  })

  // Round: the one round control (Unicron 41), so an empty radio never looks like an empty checkbox.
  // Chosen shows an 8px ink dot inside. The empty edge is the label ink (held to 3:1), not the hairline.
  it("the radio is a 16px circle with a label-ink edge; chosen, an ink dot inside", () => {
    render(
      <RadioGroup aria-label="Keep which?" defaultValue="mine">
        <RadioGroupItem value="mine" aria-label="Mine" />
        <RadioGroupItem value="disk" aria-label="The disk's" />
      </RadioGroup>
    )
    const mine = screen.getByRole("radio", { name: "Mine" })
    for (const name of ["size-4", "rounded-full", "rule-box", "[--line-rule:var(--c-radio-edge)]", "data-checked:[--line-rule:var(--c-radio-mark)]", "hit-area"]) expect(mine.className).toContain(name)
    const dot = mine.querySelector('[data-slot="radio-group-indicator"]')!
    for (const name of ["size-2", "rounded-full", "bg-(--c-radio-mark)"]) expect(dot.className).toContain(name)
    // Never the 2px corner of the square controls.
    expect(mine.className).not.toContain("rounded-lg")
  })

  it("a disabled row cannot be chosen", async () => {
    render(
      <RadioGroup aria-label="Model runs" defaultValue="off">
        <RadioRow value="off" label="Off" />
        <RadioRow value="claude" label="Claude, with your API key" disabled />
      </RadioGroup>
    )
    await userEvent.click(screen.getByText("Claude, with your API key"))
    expect(screen.getByRole("radio", { name: "Off" })).toHaveAttribute("aria-checked", "true")
  })

  it("a RadioRow leads with the same round radio (ConfirmDialog's series choice uses it)", () => {
    render(
      <RadioGroup aria-label="Delete which events?" defaultValue="this">
        <RadioRow value="this" label="This event" description="Only Wed 11.18." />
      </RadioGroup>
    )
    const radio = screen.getByRole("radio", { name: "This event" })
    expect(radio).toHaveAttribute("data-slot", "radio-group-item")
    expect(radio.className).toContain("rounded-full")
  })
})
