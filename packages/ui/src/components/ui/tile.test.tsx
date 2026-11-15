import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { swatchFillClasses, Tile, tileVariants } from "./tile"

const classesOf = (el: Element) => el.className.split(/\s+/)
const edge = () => document.querySelector('[data-slot="tile-edge"]') as HTMLElement | null

describe("Tile (contract 5.1b #33)", () => {
  it("is a raised panel with a hairline, 24 in, never a primary fill", () => {
    render(<Tile>Visa // personal</Tile>)
    const tile = screen.getByText("Visa // personal")
    expect(tile.tagName).toBe("DIV")
    expect(tile).toHaveAttribute("data-slot", "tile")
    expect(classesOf(tile)).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "p-6", "relative"]))
    expect(classesOf(tile).some((c) => c === "bg-primary" || c === "bg-primary-fill" || c.startsWith("border"))).toBe(false)
    expect(tileVariants({ size: "compact" }).split(/\s+/)).toContain("p-5")
  })

  it("draws a 4px primary top edge over the panel, adding no height", () => {
    render(<Tile>Visa // personal</Tile>)
    expect(edge()).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(edge()!)).toEqual(expect.arrayContaining(["absolute", "inset-x-0", "top-0", "h-1", "bg-primary-fill", "pointer-events-none"]))
  })

  it("the edge takes a swatch instead, or none", () => {
    const { rerender } = render(<Tile swatch="04">Cabin packing list</Tile>)
    expect(classesOf(edge()!)).toContain("bg-(--swatch-04)")
    expect(screen.getByText("Cabin packing list")).toHaveAttribute("data-edge", "swatch")
    rerender(<Tile edge="none">Board games to bring</Tile>)
    expect(edge()).toBeNull()
    expect(Object.keys(swatchFillClasses)).toHaveLength(12)
    for (const [id, cls] of Object.entries(swatchFillClasses)) expect(cls).toBe(`bg-(--swatch-${id})`)
  })

  it("with onClick it is a button; with href a link; selected is the 2px primary box and aria-current", async () => {
    const open = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Tile edge="none" onClick={open} selected>
        Cabin packing list
      </Tile>
    )
    const button = screen.getByRole("button", { name: "Cabin packing list" })
    expect(button).toHaveAttribute("type", "button")
    expect(button).toHaveAttribute("aria-current", "true")
    expect(classesOf(button)).toEqual(expect.arrayContaining(["rule-box-emphasis", "hover:bg-accent", "text-left"]))
    await user.tab()
    await user.keyboard("{Enter}")
    expect(open).toHaveBeenCalledTimes(1)
    rerender(<Tile href="#cabin">Cabin packing list</Tile>)
    expect(screen.getByRole("link", { name: "Cabin packing list" })).toHaveAttribute("href", "#cabin")
  })
})
