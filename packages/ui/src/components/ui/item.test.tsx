import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMain, ItemTitle } from "./item"

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

describe("Item as the generic row (2026-11)", () => {
  it("draws a rule on top, inside it, and sits edge to edge with the next row", () => {
    render(
      <ItemGroup>
        <Item>
          <ItemContent>
            <ItemTitle>Inbox</ItemTitle>
            <ItemDescription>New mail lands here.</ItemDescription>
          </ItemContent>
        </Item>
      </ItemGroup>
    )
    const row = screen.getByText("Inbox").closest('[data-slot="item"]')!
    expect(row.className.split(" ")).toEqual(expect.arrayContaining(["rule-t", "px-4", "py-3"]))
    expect(screen.getByRole("list").className).not.toMatch(/(^|\s)gap-\d/)
    expect(screen.getByText("Inbox").className).toContain("type-ui")
    expect(screen.getByText("New mail lands here.").className).toContain("type-caption")
  })

  it("selected is the soft primary fill with the 2px edge, never a solid primary", () => {
    render(
      <Item data-selected="true" render={<button type="button" />}>
        <ItemContent>
          <ItemTitle>Cabin for the 20th, confirmed</ItemTitle>
        </ItemContent>
      </Item>
    )
    const cls = screen.getByRole("button").className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["data-[selected=true]:bg-primary-soft", "data-[selected=true]:edge-l"]))
    expect(cls.some((name) => /(^|:)bg-primary$/.test(name))).toBe(false)
  })

  it("its focus ring is drawn just inside it", () => {
    render(<Item render={<button type="button" />}>Drafts</Item>)
    expect(screen.getByRole("button", { name: "Drafts" }).className).toContain("focus-visible:-outline-offset-2")
  })
})
