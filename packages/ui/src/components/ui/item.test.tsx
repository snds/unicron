import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Item, ItemContent, ItemMain, ItemTitle } from "./item"

// 1.0: the contract's washes (state-hover, state-pressed) replace the muted fills, so pressed still
// differs from hover (6% and 10% of the ink).
const HOVER = "bg-state-hover"
const PRESSED = "bg-state-pressed"

describe("Item pressed state (VQA 2026-10-28)", () => {
  it("a row drawn as a button presses to a fill that differs from its hover", () => {
    render(
      <Item render={<button type="button" />}>
        <ItemContent>
          <ItemTitle>Inbox</ItemTitle>
        </ItemContent>
      </Item>
    )
    const classes = screen.getByRole("button").className.split(" ")
    expect(classes).toContain(`[a,button]:hover:${HOVER}`)
    expect(classes).toContain(`[a,button]:active:${PRESSED}`)
  })

  it("a row with an ItemMain presses when its main action does", () => {
    render(
      <Item>
        <ItemMain>
          <ItemTitle>Inbox</ItemTitle>
        </ItemMain>
      </Item>
    )
    const row = screen.getByRole("button").parentElement!
    expect(row.className.split(" ")).toContain(`has-[>[data-slot=item-main]:active]:${PRESSED}`)
  })
})
