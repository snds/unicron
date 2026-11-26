import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ICON_TILE_SWATCHES, IconTile, iconTileSwatch } from "./icon-tile"

describe("IconTile (Warpcore IA canvas, project tiles)", () => {
  it("S is 22 on the 6px corner with a 14px glyph; M is 32 on the 8px corner with a 20px glyph", () => {
    const { container } = render(
      <>
        <IconTile icon="cube" />
        <IconTile icon="cube" size="m" />
      </>
    )
    const [s, m] = container.querySelectorAll('[data-slot="icon-tile"]')
    expect(s!.className).toContain("size-[22px]")
    expect(s!.className).toContain("rounded-md")
    expect(s!.querySelector("svg")).toHaveAttribute("width", "14")
    expect(m!.className).toContain("size-8")
    expect(m!.querySelector("svg")).toHaveAttribute("width", "20")
  })

  it("tints the square and the glyph from its swatch; without one it is neutral", () => {
    const { container } = render(
      <>
        <IconTile icon="cube" swatch={7} />
        <IconTile icon="cube" />
      </>
    )
    const [tinted, plain] = container.querySelectorAll('[data-slot="icon-tile"]')
    expect(tinted).toHaveAttribute("data-swatch", "07")
    expect(tinted!.className).toContain("var(--swatch-07)_16%")
    expect(plain).not.toHaveAttribute("data-swatch")
    expect(plain!.className).toContain("bg-surface-selected")
  })

  it("is decoration beside a name; with a label it is an image", () => {
    const { container, rerender } = render(<IconTile icon="cube" />)
    expect(container.querySelector('[data-slot="icon-tile"]')).toHaveAttribute("aria-hidden", "true")
    rerender(<IconTile icon="cube" label="Warpcore" />)
    expect(screen.getByRole("img", { name: "Warpcore" })).toBeInTheDocument()
  })

  it("offers the twelve swatches, and takes only those", () => {
    expect(ICON_TILE_SWATCHES).toHaveLength(12)
    expect(iconTileSwatch("03")).toBe("03")
    expect(iconTileSwatch(12)).toBe("12")
    expect(iconTileSwatch(13)).toBeNull()
    expect(iconTileSwatch(null)).toBeNull()
  })
})
