import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Button } from "./button"
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button-group"

describe("ButtonGroup", () => {
  it("is a group of joined buttons", () => {
    render(
      <ButtonGroup aria-label="Zoom">
        <Button variant="secondary">Out</Button>
        <Button variant="secondary">In</Button>
      </ButtonGroup>
    )
    expect(screen.getByRole("group", { name: "Zoom" })).toHaveAttribute("data-slot", "button-group")
  })

  // An outlined Button draws its 1px edge inside its box (an inset ring), so two side by side
  // showed a 2px seam (controls hand-off). Each part after the first now steps back over the
  // one before by the rule's width, leaving the one 1px line.
  it("joined outlined buttons share one 1px edge: each after the first steps back by the rule", () => {
    render(
      <ButtonGroup aria-label="Zoom">
        <Button variant="secondary">Out</Button>
        <Button variant="secondary">In</Button>
      </ButtonGroup>
    )
    const cls = screen.getByRole("group").className
    expect(cls).toContain("[&>[data-slot]:not([data-slot=button-group-separator])+[data-slot]:not([data-slot=button-group-separator])]:-ml-(--stroke-rule)")
    expect(cls).not.toContain("border-l-0")
    expect(cls).toContain("*:focus-visible:z-10")
  })

  it("vertical steps back on top", () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Order">
        <Button variant="secondary">Up</Button>
        <Button variant="secondary">Down</Button>
      </ButtonGroup>
    )
    expect(screen.getByRole("group").className).toContain("[&>[data-slot]:not([data-slot=button-group-separator])+[data-slot]:not([data-slot=button-group-separator])]:-mt-(--stroke-rule)")
  })

  it("text and separators are in the new look", () => {
    render(
      <ButtonGroup aria-label="Port">
        <ButtonGroupText>Port</ButtonGroupText>
        <ButtonGroupSeparator />
        <Button variant="secondary">8080</Button>
      </ButtonGroup>
    )
    expect(screen.getByText("Port").className).toContain("type-overline")
    expect(screen.getByText("Port").className).toContain("rule-box")
  })
})
