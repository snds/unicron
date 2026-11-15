import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { ChipField } from "./chip-field"

const box = () => document.querySelector('[data-slot="chip-field-box"]') as HTMLElement

describe("ChipField (contract 5.1b #24)", () => {
  it("is the Text Field box holding the values as chips, named by its label", () => {
    render(<ChipField label="Labels" helper="Press Enter after each." defaultValue={["trip", "family"]} />)
    const input = screen.getByRole("textbox", { name: "Labels" })
    expect(input).toHaveAccessibleDescription("Press Enter after each.")
    for (const name of ["bg-surface-raised", "rule-box", "min-h-control", "focus-within:rule-box-emphasis", "flex-wrap"]) expect(box().className).toContain(name)
    expect(screen.getByText("trip")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Remove family" })).toBeInTheDocument()
  })

  it("Enter, a comma or a semicolon adds what was typed; repeats are dropped", async () => {
    const onValueChange = vi.fn()
    render(<ChipField label="Tags" onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Tags" })
    await userEvent.type(input, "work{Enter}")
    expect(onValueChange).toHaveBeenLastCalledWith(["work"])
    await userEvent.type(input, "home,")
    expect(onValueChange).toHaveBeenLastCalledWith(["work", "home"])
    await userEvent.type(input, "work;")
    expect(onValueChange).toHaveBeenLastCalledWith(["work", "home"])
    expect(input).toHaveValue("")
    expect(screen.getByRole("status")).toHaveTextContent("Added home")
  })

  it("a paste splits on commas, semicolons and line breaks", async () => {
    const onValueChange = vi.fn()
    render(<ChipField label="Senders" onValueChange={onValueChange} />)
    const input = screen.getByRole("textbox", { name: "Senders" })
    input.focus()
    await userEvent.paste("mira@fastmail.com, theo@park.dev;\nledger.bank")
    expect(onValueChange).toHaveBeenLastCalledWith(["mira@fastmail.com", "theo@park.dev", "ledger.bank"])
  })

  it("Backspace in the empty input takes the last chip off; a chip's remove takes it", async () => {
    function Controlled() {
      const [values, setValues] = useState(["Mira Chen", "Theo Park"])
      return <ChipField label="To" value={values} onValueChange={setValues} />
    }
    render(<Controlled />)
    const input = screen.getByRole("textbox", { name: "To" })
    input.focus()
    await userEvent.keyboard("{Backspace}")
    expect(screen.queryByText("Theo Park")).toBeNull()
    expect(screen.getByRole("status")).toHaveTextContent("Removed Theo Park")
    await userEvent.click(screen.getByRole("button", { name: "Remove Mira Chen" }))
    expect(screen.queryByText("Mira Chen")).toBeNull()
  })

  it("a wrong value is a critical chip; the field says why", () => {
    render(<ChipField label="To" defaultValue={["mira.chen@", "theo@park.dev"]} isInvalid={(v) => !/^[^@]+@[^@]+\.[^@]+$/.test(v)} error="Fix or remove the address in red." />)
    expect(screen.getByText("mira.chen@").closest('[data-slot="chip"]')).toHaveAttribute("data-tone", "critical")
    expect(screen.getByText("theo@park.dev").closest('[data-slot="chip"]')).toHaveAttribute("data-tone", "neutral")
    expect(screen.getByRole("textbox", { name: "To" })).toHaveAttribute("aria-invalid", "true")
    expect(screen.getByRole("alert")).toHaveTextContent("Fix or remove the address in red.")
  })

  it("disabled with a reason stays focusable, shows the line and draws no removes", async () => {
    render(<ChipField label="Labels" defaultValue={["trip"]} disabled disabledReason="Labels sync from the server." />)
    const input = screen.getByRole("textbox", { name: "Labels" })
    expect(input).toHaveAttribute("aria-disabled", "true")
    expect(input).toHaveAccessibleDescription("Labels sync from the server.")
    expect(screen.queryByRole("button", { name: "Remove trip" })).toBeNull()
    await userEvent.tab()
    expect(input).toHaveFocus()
  })

  it("posts its values with a form under its name", () => {
    const { container } = render(<ChipField label="Tags" name="tags" defaultValue={["a", "b"]} />)
    expect(container.querySelector('input[type="hidden"][name="tags"]')).toHaveValue("a,b")
  })
})
