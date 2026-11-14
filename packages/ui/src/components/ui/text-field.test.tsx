import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { Icon } from "../icon"
import { Button } from "./button"
import { SearchField, TextField, textFieldMessageRows } from "./text-field"

const box = (el: HTMLElement) => el.closest('[data-slot="text-field-box"]') as HTMLElement
const root = (el: HTMLElement) => el.closest('[data-slot="text-field"]') as HTMLElement

describe("TextField", () => {
  it("names the control by its overline label and describes it by its helper", () => {
    render(<TextField label="Email" helper="Used for replies from this account." defaultValue="mira.chen@fastmail.com" />)
    const field = screen.getByRole("textbox", { name: "Email" })
    expect(field).toHaveValue("mira.chen@fastmail.com")
    expect(field).toHaveAccessibleDescription("Used for replies from this account.")
    const label = screen.getByText("Email")
    expect(label.className).toContain("type-overline")
    expect(label.className).toContain("text-muted-foreground")
    expect(screen.getByText("Used for replies from this account.").className).toContain("type-caption")
  })

  // Figma 32:48: raised, a 1px rule drawn inside (it adds no height), at least 48 tall, 16 in, the
  // value in the ui role; focus is the 2px primary inside border and no outer ring.
  it("draws Figma's box, and the 2px primary border while anything in it has focus", () => {
    render(<TextField label="Email" />)
    const field = screen.getByRole("textbox", { name: "Email" })
    const cls = box(field).className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "min-h-control", "px-4", "rounded-lg", "focus-within:rule-box-emphasis"]))
    expect(field.className).toContain("type-ui")
    expect(field.className).toContain("outline-none")
    expect(field.className).toContain("placeholder:text-muted-foreground")
  })

  it("an error turns the field critical, replaces the helper and is read with the control", () => {
    render(<TextField label="Email" helper="Used for replies from this account." error="That isn't an address." defaultValue="mira.chen@" />)
    const field = screen.getByRole("textbox", { name: "Email" })
    expect(field).toHaveAttribute("aria-invalid", "true")
    expect(field).toHaveAccessibleDescription("That isn't an address.")
    expect(screen.queryByText("Used for replies from this account.")).toBeNull()
    expect(screen.getByRole("alert")).toHaveTextContent("That isn't an address.")
    expect(root(field)).toHaveAttribute("data-invalid")
    expect(box(field).className).toContain("has-[[aria-invalid=true]]:[--rule-color:var(--critical-fill)]")
    expect(screen.getByText("Email").className).toContain("group-data-invalid/text-field:text-critical-text")
  })

  it("takes leading and trailing slots inside the box, 8px from the value", async () => {
    const onReveal = vi.fn()
    render(
      <TextField
        label="Password"
        type="password"
        leading={<Icon name="password" />}
        trailing={
          <Button variant="ghost" size="icon-sm" aria-label="Show password" onClick={onReveal}>
            <Icon name="view" />
          </Button>
        }
      />
    )
    const field = screen.getByLabelText("Password")
    expect(box(field).className).toContain("gap-2")
    expect(box(field).querySelector('[data-slot="text-field-leading"] svg')).not.toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Show password" }))
    expect(onReveal).toHaveBeenCalledTimes(1)
  })

  it("disabled is out of reach; disabled with a reason stays in the tab order and says why", async () => {
    const { rerender } = render(<TextField label="Relay" disabled defaultValue="relay.vale.dev" />)
    expect(screen.getByRole("textbox", { name: "Relay" })).toBeDisabled()

    rerender(<TextField label="Relay" disabled disabledReason="Turn on push to set a relay." defaultValue="relay.vale.dev" />)
    const field = screen.getByRole("textbox", { name: "Relay" })
    expect(field).not.toBeDisabled()
    expect(field).toHaveAttribute("aria-disabled", "true")
    expect(field).toHaveAttribute("readonly")
    expect(field).toHaveAccessibleDescription("Turn on push to set a relay.")
    await userEvent.tab()
    expect(field).toHaveFocus()
    await userEvent.type(field, "x")
    expect(field).toHaveValue("relay.vale.dev")
  })

  it("read-only keeps the value selectable and drops the fill", () => {
    render(<TextField label="Username" readOnly defaultValue="kestrel.04" />)
    const field = screen.getByRole("textbox", { name: "Username" })
    expect(field).toHaveAttribute("readonly")
    expect(root(field)).toHaveAttribute("data-readonly")
    expect(box(field).className).toContain("has-[[data-slot$=-control][readonly]:not([aria-disabled=true])]:bg-transparent")
  })

  it("multiline starts at 6 lines, a message field's height, and grows with its text", async () => {
    expect(textFieldMessageRows).toBe(6)
    render(<TextField multiline label="Message" />)
    const field = screen.getByRole("textbox", { name: "Message" })
    expect(field.tagName).toBe("TEXTAREA")
    expect(field).toHaveAttribute("rows", "6")
    expect(field.className).toContain("resize-none")
    expect(root(field)).toHaveAttribute("data-multiline")
    await userEvent.type(field, "Booked the two-bedroom.")
    expect(field).toHaveValue("Booked the two-bedroom.")
  })

  it("multiline takes its own least height", () => {
    render(<TextField multiline minRows={3} label="Note" />)
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveAttribute("rows", "3")
  })

  it("a field with no visible label takes aria-label", () => {
    render(<TextField aria-label="Subject" />)
    expect(screen.getByRole("textbox", { name: "Subject" })).toBeInTheDocument()
  })
})

describe("TextField type=number (contract 5.1b #34)", () => {
  function Length() {
    const [value, setValue] = useState<number | null>(20)
    return (
      <>
        <TextField type="number" label="Length" min={8} max={128} value={value} onValueChange={setValue} />
        <output data-testid="value">{String(value)}</output>
      </>
    )
  }

  it("steps with − and + and with the arrow keys, inside its range", async () => {
    render(<Length />)
    const field = screen.getByRole("textbox", { name: "Length" })
    expect(field).toHaveValue("20")
    await userEvent.click(screen.getByRole("button", { name: "Increase Length" }))
    expect(screen.getByTestId("value")).toHaveTextContent("21")
    await userEvent.click(screen.getByRole("button", { name: "Decrease Length" }))
    await userEvent.click(screen.getByRole("button", { name: "Decrease Length" }))
    expect(screen.getByTestId("value")).toHaveTextContent("19")

    field.focus()
    await userEvent.keyboard("{ArrowUp}")
    expect(screen.getByTestId("value")).toHaveTextContent("20")
    await userEvent.keyboard("{Home}")
    expect(screen.getByTestId("value")).toHaveTextContent("8")
    await userEvent.click(screen.getByRole("button", { name: "Decrease Length" }))
    expect(screen.getByTestId("value")).toHaveTextContent("8")
  })

  it("the steppers are the 32px ghost square, kept out of the tab order (the arrows step)", () => {
    render(<TextField type="number" label="Words" defaultValue={5} />)
    const plus = screen.getByRole("button", { name: "Increase Words" })
    expect(plus).toHaveAttribute("data-variant", "ghost")
    expect(plus).toHaveAttribute("data-size", "icon-sm")
    expect(plus).toHaveAttribute("tabindex", "-1")
  })
})

describe("SearchField (contract 5.1a)", () => {
  it("is a search box named Search, with the search icon before the words", () => {
    render(<SearchField />)
    const field = screen.getByRole("searchbox", { name: "Search" })
    expect(box(field).querySelector('[data-slot="text-field-leading"] [data-icon-name="search"]')).not.toBeNull()
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull()
  })

  it("shows a clear button once there are words; it empties the field and keeps focus there", async () => {
    const onValueChange = vi.fn()
    render(<SearchField onValueChange={onValueChange} />)
    const field = screen.getByRole("searchbox", { name: "Search" })
    await userEvent.type(field, "cabin")
    expect(onValueChange).toHaveBeenLastCalledWith("cabin")
    await userEvent.click(screen.getByRole("button", { name: "Clear search" }))
    expect(field).toHaveValue("")
    expect(field).toHaveFocus()
    expect(onValueChange).toHaveBeenLastCalledWith("")
  })

  it("Escape clears the words; with none, Escape goes on to the page", async () => {
    const onPageKey = vi.fn()
    render(
      <div onKeyDown={(event) => event.key === "Escape" && onPageKey()}>
        <SearchField defaultValue="dentist" />
      </div>
    )
    const field = screen.getByRole("searchbox", { name: "Search" })
    field.focus()
    await userEvent.keyboard("{Escape}")
    expect(field).toHaveValue("")
    expect(onPageKey).not.toHaveBeenCalled()
    await userEvent.keyboard("{Escape}")
    expect(onPageKey).toHaveBeenCalledTimes(1)
  })

  it("takes a visible label instead of the default name", () => {
    render(<SearchField label="Find a setting" />)
    expect(screen.getByRole("searchbox", { name: "Find a setting" })).toBeInTheDocument()
  })
})
