import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"

describe("Collapsible", () => {
  it("opens and closes from its trigger, which says whether it is open", async () => {
    render(
      <Collapsible>
        <CollapsibleTrigger>Runs with</CollapsibleTrigger>
        <CollapsibleContent>Claude Code // vale-dev</CollapsibleContent>
      </Collapsible>
    )
    const trigger = screen.getByRole("button", { name: "Runs with" })
    expect(trigger).toHaveAttribute("aria-expanded", "false")
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("Claude Code // vale-dev")).toBeVisible()
  })

  it("opens on the motion-collapse recipe, or at once with animate={false}", () => {
    render(
      <>
        <Collapsible defaultOpen>
          <CollapsibleContent>Moves</CollapsibleContent>
        </Collapsible>
        <Collapsible defaultOpen>
          <CollapsibleContent animate={false}>Still</CollapsibleContent>
        </Collapsible>
      </>
    )
    expect(screen.getByText("Moves").className).toContain("motion-collapse")
    expect(screen.getByText("Still").className).not.toContain("motion-collapse")
  })
})
