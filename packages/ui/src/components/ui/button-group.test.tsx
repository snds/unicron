import { readFileSync } from "node:fs"
import { join } from "node:path"
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
  // showed a 2px seam (controls hand-off). Each part after the first draws no edge on the side it
  // shares with the one before, leaving the one 1px line, with no overlap: the group is as wide
  // and as tall as its parts (two 32px buttons in a column are 64, not 63).
  const FOLLOWING =
    "[&>[data-slot]:not([data-slot=button-group-separator])+[data-slot]:not([data-slot=button-group-separator],:focus,:focus-within,[aria-invalid=true],[data-popup-open],:has([aria-invalid=true]))]"

  it("joined outlined buttons share one 1px edge: each after the first drops the edge it shares, and nothing overlaps", () => {
    render(
      <ButtonGroup aria-label="Zoom">
        <Button variant="secondary">Out</Button>
        <Button variant="secondary">In</Button>
      </ButtonGroup>
    )
    const cls = screen.getByRole("group").className.split(" ")
    expect(cls).toContain(`${FOLLOWING}:join-l`)
    // No part steps back over its neighbour: a negative margin took a pixel off the group per joint.
    expect(cls.some((name) => /:-m[lt]-/.test(name))).toBe(false)
    expect(cls).not.toContain("border-l-0")
    expect(cls).toContain("*:focus-visible:z-10")
  })

  it("vertical drops the top edge", () => {
    render(
      <ButtonGroup orientation="vertical" aria-label="Order">
        <Button variant="secondary">Up</Button>
        <Button variant="secondary">Down</Button>
      </ButtonGroup>
    )
    const cls = screen.getByRole("group").className.split(" ")
    expect(cls).toContain(`${FOLLOWING}:join-t`)
    expect(cls.some((name) => /:-m[lt]-/.test(name))).toBe(false)
  })

  it("join-l and join-t redraw the two edges a part may have, three sides each, in the part's own ring colour", () => {
    const css = readFileSync(join(__dirname, "../../styles/index.css"), "utf8")
    for (const [name, missing] of [
      ["join-l", "inset var(--stroke-rule) 0 0 0"],
      ["join-t", "inset 0 var(--stroke-rule) 0 0"],
    ] as const) {
      const at = css.indexOf(`@utility ${name} {`)
      expect(at, name).toBeGreaterThan(-1)
      const body = css.slice(at, css.indexOf("\n}", at))
      expect(body).toContain("--tw-inset-ring-shadow:")
      expect(body).toContain("--rule-box:")
      expect(body).toContain("var(--tw-inset-ring-color, transparent)")
      // Three sides: the shared one is not drawn.
      expect(body.match(/inset /g)).toHaveLength(6)
      expect(body).not.toContain(`${missing} var(`)
    }
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
