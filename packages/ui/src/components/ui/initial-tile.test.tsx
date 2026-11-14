import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { InitialTile } from "./initial-tile"

describe("InitialTile (Figma 32:121)", () => {
  it("shows the initials in a raised square with a 1px rule: M 40 in ui/emphasis by default", () => {
    const { container } = render(<InitialTile initials="MC" />)
    const tile = container.querySelector('[data-slot="initial-tile"]')!
    expect(tile).toHaveTextContent("MC")
    expect(tile).toHaveAttribute("data-size", "m")
    for (const name of ["size-10", "type-ui-emphasis", "bg-surface-raised", "rounded-lg", "after:rule-box"]) expect(tile.className).toContain(name)
  })

  it("S is 24 in the overline, L is 64 in lead", () => {
    const { container } = render(
      <>
        <InitialTile initials="TP" size="s" />
        <InitialTile initials="MC" size="l" />
      </>
    )
    const [s, l] = container.querySelectorAll('[data-slot="initial-tile"]')
    expect(s!.className).toContain("size-6")
    expect(s!.className).toContain("type-overline")
    expect(l!.className).toContain("size-16")
    expect(l!.className).toContain("type-lead")
  })

  it("is decoration beside a name; on its own it is an image with the person's name", () => {
    const { container, rerender } = render(<InitialTile initials="MC" />)
    expect(container.querySelector('[data-slot="initial-tile"]')).toHaveAttribute("aria-hidden", "true")
    rerender(<InitialTile initials="MC" name="Mira Chen" />)
    expect(screen.getByRole("img", { name: "Mira Chen" })).toBeInTheDocument()
  })

  it("with a photo, the initials stand in until it loads", () => {
    const { container } = render(<InitialTile initials="MC" src="/mira.jpg" size="s" />)
    // jsdom never loads the image, so the initials are what shows.
    expect(container.querySelector('[data-slot="initial-tile-initials"]')).toHaveTextContent("MC")
  })
})
