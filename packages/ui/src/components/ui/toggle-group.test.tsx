import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Toggle } from "./toggle"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

describe("ToggleGroup", () => {
  it("one pressed of several: aria-pressed moves with the press", async () => {
    render(
      <ToggleGroup defaultValue={["system"]} aria-label="Theme">
        <ToggleGroupItem value="system">System</ToggleGroupItem>
        <ToggleGroupItem value="stone">Stone</ToggleGroupItem>
        <ToggleGroupItem value="graphite">Graphite</ToggleGroupItem>
      </ToggleGroup>
    )
    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(screen.getByRole("button", { name: "Stone" }))
    expect(screen.getByRole("button", { name: "Stone" })).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "false")
  })

  // Two hairline boxes side by side would draw a 2px seam. Joined, the group draws the one box and
  // each item after the first a rule on its leading side.
  it("joined outline items draw one edge between them, never two", () => {
    render(
      <ToggleGroup spacing={0} variant="outline" defaultValue={["day"]} aria-label="Range">
        <ToggleGroupItem value="day">Day</ToggleGroupItem>
        <ToggleGroupItem value="week">Week</ToggleGroupItem>
      </ToggleGroup>
    )
    const group = screen.getByRole("group", { name: "Range" })
    expect(group.className).toContain("data-[spacing=0]:data-[variant=outline]:rule-box")
    const week = screen.getByRole("button", { name: "Week" })
    expect(week.className).toContain("group-data-horizontal/toggle-group:not-first:rule-l")
    expect(week.className.split(" ")).not.toContain("rule-box")
  })

  it("apart, outline items keep their own hairline box", () => {
    render(
      <ToggleGroup variant="outline" aria-label="Tools">
        <ToggleGroupItem value="pen">Pen</ToggleGroupItem>
      </ToggleGroup>
    )
    expect(screen.getByRole("button", { name: "Pen" }).className.split(" ")).toContain("rule-box")
  })
})

describe("Toggle sizes", () => {
  it("are Button's heights, and under 44 take the touch target", () => {
    render(
      <>
        <Toggle aria-label="Bold">B</Toggle>
        <Toggle size="sm" aria-label="Italic">I</Toggle>
        <Toggle size="lg" aria-label="Pen">P</Toggle>
      </>
    )
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain("h-10")
    expect(screen.getByRole("button", { name: "Italic" }).className).toContain("h-8")
    expect(screen.getByRole("button", { name: "Pen" }).className).toContain("h-control")
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain("hit-area")
    expect(screen.getByRole("button", { name: "Pen" }).className).not.toContain("hit-area")
  })
})
