import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Checkbox } from "./checkbox"
import { Field, FieldDescription, FieldDisabledReason, FieldError, FieldLabel, FieldLegend, FieldSet, useDisabledReason } from "./field"
import { Input } from "./input"
import { Label } from "./label"

describe("Label", () => {
  it("names a field in the overline; beside a choice it is the control type", () => {
    render(
      <>
        <Label htmlFor="a">Username</Label>
        <input id="a" />
        <Label htmlFor="b" variant="choice">
          Include crown jewels
        </Label>
        <input id="b" type="checkbox" />
      </>
    )
    expect(screen.getByText("Username").className).toContain("type-overline")
    expect(screen.getByText("Username").className).toContain("text-muted-foreground")
    expect(screen.getByText("Include crown jewels").className).toContain("type-ui")
    expect(screen.getByLabelText("Username")).toBeInTheDocument()
  })
})

describe("Field", () => {
  it("label, 4px, the control, 4px, the help: overline label, caption help", () => {
    render(
      <Field>
        <FieldLabel htmlFor="username">Username</FieldLabel>
        <Input id="username" aria-describedby="username-help" />
        <FieldDescription id="username-help">The one you sign in with.</FieldDescription>
      </Field>
    )
    const field = screen.getByRole("group")
    expect(field.className).toContain("gap-1")
    expect(screen.getByRole("textbox", { name: "Username" })).toHaveAccessibleDescription("The one you sign in with.")
    expect(screen.getByText("The one you sign in with.").className).toContain("type-caption")
    expect(screen.getByText("The one you sign in with.").className).toContain("group-data-[invalid=true]/field:text-critical-text")
  })

  it("beside a checkbox the label reads as the choice, in the control type", () => {
    render(
      <Field orientation="horizontal">
        <Checkbox id="jewels" />
        <FieldLabel htmlFor="jewels">Include crown jewels</FieldLabel>
      </Field>
    )
    const label = screen.getByText("Include crown jewels")
    expect(label.className).toContain("group-data-[orientation=horizontal]/field:type-ui")
    expect(label.className).toContain("group-data-[orientation=horizontal]/field:normal-case")
    expect(screen.getByRole("checkbox", { name: "Include crown jewels" })).toBeInTheDocument()
  })

  it("an error is an alert in the critical ink", () => {
    render(<FieldError errors={[{ message: "That isn't an address." }]} />)
    expect(screen.getByRole("alert")).toHaveTextContent("That isn't an address.")
    expect(screen.getByRole("alert").className).toContain("text-critical-text")
  })

  it("a fieldset's legend is the overline", () => {
    render(
      <FieldSet>
        <FieldLegend>Server</FieldLegend>
      </FieldSet>
    )
    expect(screen.getByText("Server").className).toContain("type-overline")
  })
})

describe("useDisabledReason (contract 5.1b #37)", () => {
  function Subject({ disabled, why }: { disabled?: boolean; why?: string }) {
    const reason = useDisabledReason(disabled, why, "hint")
    return (
      <>
        <span id="hint">Sends now.</span>
        <button type="button" aria-disabled={reason.active || undefined} aria-describedby={reason.describedBy}>
          Send
        </button>
        {reason.line}
      </>
    )
  }

  it("adds a visible line and points the control at it, only while disabled", () => {
    const { rerender } = render(<Subject why="Fix or remove the address in red." />)
    expect(screen.getByRole("button", { name: "Send" })).toHaveAccessibleDescription("Sends now.")
    expect(screen.queryByText("Fix or remove the address in red.")).toBeNull()

    rerender(<Subject disabled why="Fix or remove the address in red." />)
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAccessibleDescription("Sends now. Fix or remove the address in red.")
    expect(screen.getByText("Fix or remove the address in red.")).toHaveAttribute("data-slot", "disabled-reason")
    expect(screen.getByText("Fix or remove the address in red.").className).toContain("type-caption")
  })

  it("the line on its own is caption, secondary ink", () => {
    render(<FieldDisabledReason>Offline.</FieldDisabledReason>)
    expect(screen.getByText("Offline.").className).toContain("text-support-foreground")
  })
})
