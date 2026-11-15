import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Item, ItemContent, ItemDescription, ItemGroup, ItemMain, ItemSeparator, ItemTitle } from "./item"

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

describe("ItemGroup is a list whose rows are its items", () => {
  it("a plain row is the list item; a link or a button keeps its role inside a list-item box", () => {
    render(
      <ItemGroup>
        <Item>Personal</Item>
        <Item render={<a href="#drafts" />}>Drafts</Item>
        <Item render={<button type="button" />}>Sent</Item>
        <Item>
          <ItemMain>Archive</ItemMain>
        </Item>
      </ItemGroup>
    )
    const list = screen.getByRole("list")
    const items = screen.getAllByRole("listitem")
    expect(items).toHaveLength(4)
    // Every child of the list is a list item: nothing the list may not own.
    expect(Array.from(list.children).every((child) => child.getAttribute("role") === "listitem")).toBe(true)
    expect(items[0]).toHaveAttribute("data-slot", "item")
    expect(items[1]).toHaveAttribute("data-slot", "item-listitem")
    expect(items[1]).toContainElement(screen.getByRole("link", { name: "Drafts" }))
    expect(screen.getByRole("link", { name: "Drafts" })).toHaveAttribute("data-slot", "item")
    expect(items[2]).toContainElement(screen.getByRole("button", { name: "Sent" }))
    // A row whose ItemMain covers it is a plain box: it is the item, the button is inside it.
    expect(items[3]).toHaveAttribute("data-slot", "item")
  })

  it("the box around a link fills the list's width, so the row is as wide as before", () => {
    render(
      <ItemGroup>
        <Item render={<a href="#drafts" />}>Drafts</Item>
      </ItemGroup>
    )
    expect(screen.getByRole("listitem").className.split(" ")).toEqual(expect.arrayContaining(["flex", "w-full", "min-w-0"]))
  })

  it("outside a group a row has no list role and no box", () => {
    const { container } = render(<Item render={<a href="#drafts" />}>Drafts</Item>)
    expect(screen.queryByRole("listitem")).toBeNull()
    expect(container.firstElementChild).toBe(screen.getByRole("link", { name: "Drafts" }))
  })

  it("a separator between rows is decoration there: the list owns list items only", () => {
    render(
      <ItemGroup>
        <Item>Personal</Item>
        <ItemSeparator />
        <Item>Work</Item>
      </ItemGroup>
    )
    expect(screen.queryByRole("separator")).toBeNull()
    const hairline = document.querySelector('[data-slot="item-separator"]') as HTMLElement
    expect(hairline).toHaveAttribute("role", "none")
    expect(hairline).not.toHaveAttribute("aria-orientation")
  })

  it("a row that is the control is never under the 44px touch minimum on a coarse pointer", () => {
    render(
      <Item size="sm" render={<a href="#drafts" />}>
        Drafts
      </Item>
    )
    expect(screen.getByRole("link", { name: "Drafts" }).className.split(" ")).toEqual(
      expect.arrayContaining(["[a,button]:pointer-coarse:min-h-touch-min", "has-[>[data-slot=item-main]]:pointer-coarse:min-h-touch-min"])
    )
  })
})
