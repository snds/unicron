import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppFrame, AppFrameBottomRow, AppFrameMain } from "./app-frame"
import { TabBar, TabBarItem } from "./tab-bar"
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

  it("write counts as decisions §13 does: two digits, capped at 99+", () => {
    expect(indicatorCount(7)).toBe("07")
    expect(indicatorCount(12)).toBe("12")
    expect(indicatorCount(99)).toBe("99")
    expect(indicatorCount(140)).toBe("99+")
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
    expect(mark.textContent).toBe("01")
  })

  it("is a dot without a count, and nothing when nothing is wanted", () => {
    const { container, rerender } = render(<IndicatorMark indicator={{ kind: "attention" }} shape="badge" />)
    expect(container.querySelector('[data-slot="indicator"]')).toHaveAttribute("data-shape", "dot")
    rerender(<IndicatorMark indicator={{ kind: "unread", count: 0 }} />)
    expect(container.querySelector('[data-slot="indicator"]')).toBeNull()
  })
})

// AppFrameNavItem (the floating capsule's place) is gone in 1.0: a top-level place is a TabBarItem
// in the phone's bottom row, and its count or waiting state is the shared `mark` (rail.tsx), whose
// words join the name the same way. These two keep the old checks on the part that replaced it.
describe("a place's mark in the frame's tab bar (was AppFrameNavItem indicator)", () => {
  it("adds the count and the meaning to the item's name", () => {
    render(
      <AppFrame layout="phone">
        <AppFrameMain />
        <AppFrameBottomRow
          tabs={
            <TabBar label="Places" value="home">
              <TabBarItem value="chat" icon="chat" label="Conversations" mark={{ count: 2, tone: "needs-you" }} />
              <TabBarItem value="home" icon="home" label="Home" />
            </TabBar>
          }
        />
      </AppFrame>
    )
    expect(screen.getByRole("tab", { name: "Conversations, 2 waiting on you" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Home" })).toBeInTheDocument()
  })

  it("draws a count at the icon's corner, capped where it would not fit", () => {
    render(
      <AppFrame layout="phone">
        <AppFrameMain />
        <AppFrameBottomRow
          tabs={
            <TabBar label="Places" value="home">
              <TabBarItem value="chat" icon="chat" label="Conversations" mark={{ count: 140, label: "140 unread" }} />
              <TabBarItem value="home" icon="home" label="Home" />
            </TabBar>
          }
        />
      </AppFrame>
    )
    const tab = screen.getByRole("tab", { name: "Conversations, 140 unread" })
    expect(tab.querySelector('[data-slot="nav-mark"]')?.textContent).toBe("99+")
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

describe("IndicatorMark in the 2026-11 look", () => {
  const knobs = JSON.parse(readFileSync(resolve(__dirname, "../../../../tokens/tokens/component/chat.json"), "utf8")).indicator

  it("is an ink square for unread and the yellow square for attention, with an ink outline", () => {
    expect(knobs.unread.$value).toBe("{text-body}")
    expect(knobs.attention.$value).toBe("{needs-you-fill}")
    expect(knobs["attention-edge"].$value).toBe("{needs-you-on-fill}")
    expect(knobs["dot-size"].$value).toBe("0.375rem")
    const { container, rerender } = render(<IndicatorMark indicator={{ kind: "attention" }} />)
    const dot = container.querySelector('[data-slot="indicator"]')!
    expect(dot.className).toContain("ring-(--c-indicator-attention-edge)")
    rerender(<IndicatorMark indicator={{ kind: "unread" }} />)
    expect(container.querySelector('[data-slot="indicator"]')!.className).not.toContain("ring-")
  })

  it("counts on the same fills, in mono, the attention badge outlined inside in ink", () => {
    expect(knobs["unread-badge-bg"].$value).toBe("{text-body}")
    expect(knobs["unread-badge-ink"].$value).toBe("{surface-ground}")
    expect(knobs["attention-badge-bg"].$value).toBe("{needs-you-fill}")
    expect(knobs["attention-badge-ink"].$value).toBe("{needs-you-on-fill}")
    const { container } = render(<IndicatorMark indicator={{ kind: "attention", count: 3 }} shape="badge" />)
    const badge = container.querySelector('[data-slot="indicator"]')!
    expect(badge.textContent).toBe("03")
    expect(badge.className).toContain("inset-ring-(--c-indicator-attention-edge)")
    expect(badge.className).toContain("[font-family:var(--type-overline-family)]")
  })
})
