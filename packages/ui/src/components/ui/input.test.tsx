import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Icon } from "../icon"
import { Input, fieldBoxVariants } from "./input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupTextarea } from "./input-group"
import { Textarea } from "./textarea"

const classes = (el: Element) => el.className.split(/\s+/)

// Every field draws Figma 32:48's box: raised, a 1px rule inside, the 2px corner, the ui role;
// the 2px primary border on focus and the critical one when invalid, and no outer ring.
const BOX = ["bg-surface-raised", "rule-box", "rounded-lg", "type-ui", "outline-none"]

describe("Input", () => {
  it("is the Text Field box, 48 tall and 16px in, with Figma's focus and error borders", () => {
    render(<Input aria-label="Email" />)
    const input = screen.getByRole("textbox", { name: "Email" })
    expect(classes(input)).toEqual(expect.arrayContaining([...BOX, "h-control", "px-4", "focus:rule-box-emphasis", "aria-invalid:rule-box-emphasis", "aria-invalid:[--rule-color:var(--critical-fill)]"]))
    // No ring of its own: the field draws its focus inside its box.
    expect(input.className).not.toMatch(/focus-visible:ring/)
    expect(input.className).not.toMatch(/(^|\s)border(\s|$)/)
  })

  it("keeps aria-invalid for the critical border", () => {
    render(<Input aria-label="Email" aria-invalid />)
    expect(screen.getByRole("textbox", { name: "Email" })).toHaveAttribute("aria-invalid", "true")
  })

  it("read-only drops the fill; disabled is half strength", () => {
    expect(fieldBoxVariants()).toContain("[&[readonly]:not([aria-disabled=true])]:bg-transparent")
    expect(fieldBoxVariants()).toContain("disabled:opacity-50")
  })
})

describe("Textarea", () => {
  it("is the same box, 12 / 16 in, at least 48 tall", () => {
    render(<Textarea aria-label="Note" />)
    const area = screen.getByRole("textbox", { name: "Note" })
    expect(classes(area)).toEqual(expect.arrayContaining([...BOX, "min-h-control", "px-4", "py-3"]))
  })
})

describe("InputGroup", () => {
  function Subject({ invalid }: { invalid?: boolean }) {
    return (
      <InputGroup>
        <InputGroupAddon>
          <Icon name="search" />
        </InputGroupAddon>
        <InputGroupInput aria-label="Search mail" aria-invalid={invalid} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="icon-xs" aria-label="Clear">
            <Icon name="close" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
  }

  it("the group is the box; the control inside has none of its own", () => {
    render(<Subject />)
    const control = screen.getByRole("textbox", { name: "Search mail" })
    const group = screen.getAllByRole("group")[0]!
    expect(group).toHaveAttribute("data-slot", "input-group")
    expect(classes(group)).toEqual(expect.arrayContaining([...BOX, "min-h-control", "focus-within:rule-box-emphasis", "has-[[aria-invalid=true]]:rule-box-emphasis"]))
    expect(control).toHaveAttribute("data-slot", "input-group-control")
    expect(control.className).not.toContain("rule-box")
    expect(control.className).toContain("bg-transparent")
  })

  it("an add-on press focuses the control; a button in one keeps its own press", async () => {
    render(<Subject />)
    await userEvent.click(screen.getByRole("textbox", { name: "Search mail" }).parentElement!.querySelector('[data-slot="input-group-addon"]')!)
    expect(screen.getByRole("textbox", { name: "Search mail" })).toHaveFocus()
  })

  it("its buttons are Button's own sizes: a word is S, an icon the 32px square", () => {
    render(
      <InputGroup>
        <InputGroupInput aria-label="Address" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton>Check</InputGroupButton>
          <InputGroupButton size="icon-sm" aria-label="Copy">
            <Icon name="copy" />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    )
    expect(screen.getByRole("button", { name: "Check" }).className).toContain("h-8")
    expect(screen.getByRole("button", { name: "Copy" }).className).toContain("size-8")
  })

  it("holds a textarea", () => {
    render(
      <InputGroup>
        <InputGroupTextarea aria-label="Reply" />
      </InputGroup>
    )
    expect(screen.getByRole("textbox", { name: "Reply" }).className).toContain("resize-none")
  })
})
