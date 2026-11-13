import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppFrame, AppFrameMain, AppFrameNav, AppFrameNavItem } from "./app-frame"
import { IndicatorMark, indicatorCount, indicatorLabel, indicatorsOf } from "./indicator"
import { Item, ItemContent, ItemTitle } from "./item"
import { Button } from "./button"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"

describe("indicator words", () => {
  it("carry the count and the meaning", () => {
    expect(indicatorLabel({ kind: "attention", count: 2 })).toBe("2 waiting for you")
    expect(indicatorLabel({ kind: "unread", count: 5 })).toBe("5 unread")
    expect(indicatorLabel({ kind: "attention" })).toBe("Waiting for you")
    expect(indicatorLabel({ kind: "unread", count: 0 })).toBe("")
    expect(indicatorLabel(undefined)).toBe("")
  })

  it("put attention first, and say both kinds", () => {
    const both = [{ kind: "unread", count: 5 }, { kind: "attention", count: 1 }] as const
    expect(indicatorsOf(both).map((i) => i.kind)).toEqual(["attention", "unread"])
    expect(indicatorLabel(both)).toBe("1 waiting for you, 5 unread")
  })

  it("cap the badge at 9+", () => {
    expect(indicatorCount(9)).toBe("9")
    expect(indicatorCount(12)).toBe("9+")
  })
})

describe("IndicatorMark", () => {
  it("draws only the winning kind, hidden from screen readers", () => {
    const { container } = render(
      <IndicatorMark indicator={[{ kind: "unread", count: 3 }, { kind: "attention", count: 1 }]} shape="badge" />
    )
    const mark = container.querySelector('[data-slot="indicator"]')!
    expect(mark).toHaveAttribute("data-kind", "attention")
    expect(mark).toHaveAttribute("data-shape", "badge")
    expect(mark).toHaveAttribute("aria-hidden")
    expect(mark.textContent).toBe("1")
  })

  it("is a dot without a count, and nothing when nothing is wanted", () => {
    const { container, rerender } = render(<IndicatorMark indicator={{ kind: "attention" }} shape="badge" />)
    expect(container.querySelector('[data-slot="indicator"]')).toHaveAttribute("data-shape", "dot")
    rerender(<IndicatorMark indicator={{ kind: "unread", count: 0 }} />)
    expect(container.querySelector('[data-slot="indicator"]')).toBeNull()
  })
})

describe("AppFrameNavItem indicator", () => {
  it("adds the count and the meaning to the item's name", () => {
    render(
      <AppFrame>
        <AppFrameMain />
        <AppFrameNav aria-label="Places">
          <AppFrameNavItem icon="chat" label="Conversations" indicator={{ kind: "attention", count: 2 }} />
          <AppFrameNavItem icon="home" label="Home" />
        </AppFrameNav>
      </AppFrame>
    )
    expect(screen.getByRole("button", { name: "Conversations, 2 waiting for you" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Home" })).toBeInTheDocument()
  })

  it("has a count badge for the bar and a dot for the rail and the pivot", () => {
    render(
      <AppFrame>
        <AppFrameMain />
        <AppFrameNav aria-label="Places">
          <AppFrameNavItem icon="chat" label="Conversations" indicator={{ kind: "unread", count: 14 }} />
        </AppFrameNav>
      </AppFrame>
    )
    const button = screen.getByRole("button", { name: "Conversations, 14 unread" })
    const badge = button.querySelector('[data-shape="badge"]')!
    const dot = button.querySelector('[data-shape="dot"]')!
    expect(badge.textContent).toBe("9+")
    expect(badge.className).toContain("nav-rail:hidden")
    expect(badge.className).toContain("in-data-[slot=app-frame-pivot]:hidden")
    expect(dot.className).toContain("nav-rail:inline-block")
    expect(dot.className).toContain("in-data-[slot=app-frame-pivot]:inline-block")
  })
})

describe("Item indicator", () => {
  it("adds a trailing dot and says it", () => {
    const { container } = render(
      <Item render={<button type="button" />} indicator={{ kind: "unread" }}>
        <ItemContent>
          <ItemTitle>Weekly plan</ItemTitle>
        </ItemContent>
      </Item>
    )
    expect(screen.getByRole("button", { name: "Weekly plan Unread" })).toBeInTheDocument()
    const dot = container.querySelector('[data-slot="indicator"]')!
    expect(dot).toHaveAttribute("data-kind", "unread")
    expect(dot.previousElementSibling).toHaveAttribute("data-slot", "item-content")
  })

  it("changes nothing without one", () => {
    const { container } = render(<Item>Row</Item>)
    expect(container.querySelector('[data-slot="indicator"]')).toBeNull()
    expect(container.querySelector('[data-slot="item"]')?.textContent).toBe("Row")
  })
})

describe("indicator on a control", () => {
  it("marks a Button in its corner and adds the words after its text", () => {
    render(<Button indicator={{ kind: "attention", count: 2 }}>Tasks</Button>)
    const button = screen.getByRole("button", { name: "Tasks, 2 waiting for you" })
    expect(button.className).toContain("relative")
    const mark = button.querySelector('[data-slot="indicator"]')!
    expect(mark).toHaveAttribute("data-kind", "attention")
    expect(mark).toHaveAttribute("data-placement", "corner")
    expect(mark).toHaveAttribute("aria-hidden")
  })

  it("joins an aria-label rather than adding words a label would hide", () => {
    render(
      <Button size="icon" aria-label="Open" indicator={{ kind: "unread" }}>
        <Icon name="chat" />
      </Button>
    )
    const button = screen.getByRole("button", { name: "Open, Unread" })
    expect(button.querySelector(".sr-only")).toBeNull()
  })

  it("puts it on an IconButton: the name carries it, the tooltip stays the label", () => {
    render(<IconButton icon="chat" label="Open conversation" indicator={{ kind: "unread", count: 3 }} />)
    const button = screen.getByRole("button", { name: "Open conversation, 3 unread" })
    expect(button.className).toContain("relative")
    expect(button.querySelector('[data-slot="indicator"]')).toHaveAttribute("data-kind", "unread")
  })

  it("puts it on a ToggleGroupItem, with its aria-label", () => {
    render(
      <ToggleGroup>
        <ToggleGroupItem value="tasks" aria-label="Tasks" indicator={{ kind: "attention", count: 1 }}>
          <Icon name="task" />
        </ToggleGroupItem>
      </ToggleGroup>
    )
    const item = screen.getByRole("button", { name: "Tasks, 1 waiting for you" })
    expect(item.querySelector('[data-slot="indicator"]')).toBeInTheDocument()
  })

  it("changes nothing without one, or with a count of 0", () => {
    const { rerender } = render(<Button>Tasks</Button>)
    let button = screen.getByRole("button", { name: "Tasks" })
    expect(button.className).not.toContain("relative")
    expect(button.querySelector('[data-slot="indicator"]')).toBeNull()
    rerender(<Button indicator={{ kind: "attention", count: 0 }}>Tasks</Button>)
    button = screen.getByRole("button", { name: "Tasks" })
    expect(button.querySelector('[data-slot="indicator"]')).toBeNull()
  })
})
