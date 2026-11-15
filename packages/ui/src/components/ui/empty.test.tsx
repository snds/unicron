import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { Empty, EmptyContent, EmptyDescription, EmptyState, EmptyTitle } from "./empty"

describe("EmptyState (Figma 32:64)", () => {
  it("overline, title, body and one secondary action, left aligned", async () => {
    const onAction = vi.fn()
    const { container } = render(
      <EmptyState
        overline="Inbox // 000 unread"
        title="Nothing left today."
        body="New mail lands here. Snoozed messages come back at 8:00 AM."
        actionLabel="Open snoozed"
        onAction={onAction}
      />
    )
    const root = container.querySelector('[data-slot="empty"]')!
    for (const name of ["items-start", "text-left", "gap-3", "px-4", "py-8"]) expect(root.className).toContain(name)
    expect(screen.getByText("Inbox // 000 unread").className).toContain("type-overline")
    expect(screen.getByText("Nothing left today.").className).toContain("type-title")
    expect(screen.getByText(/New mail lands here/).className).toContain("type-body")
    const action = screen.getByRole("button", { name: "Open snoozed" })
    expect(action).toHaveAttribute("data-variant", "secondary")
    await userEvent.click(action)
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(container.querySelector("img, [data-slot=empty-icon]")).toBeNull()
  })

  it("tone critical: the overline turns critical and leads with the warning icon", () => {
    const { container } = render(<EmptyState tone="critical" overline="Tasks // 00" title="Can't reach Warpcore." body="The server didn't answer." actionLabel="Try again" />)
    expect(container.querySelector('[data-slot="empty"]')).toHaveAttribute("data-tone", "critical")
    const overline = screen.getByText("Tasks // 00")
    expect(overline.className).toContain("group-data-[tone=critical]/empty:text-critical-text")
    expect(overline.querySelector('[data-icon-name="warning--alt"]')).not.toBeNull()
  })

  it("takes its action as a node", () => {
    render(<EmptyState title="Nothing open." action={<Button variant="secondary">New note</Button>} />)
    expect(screen.getByRole("button", { name: "New note" })).toBeInTheDocument()
  })

  it("sm sets the title one size down, for a pane", () => {
    render(
      <Empty size="sm">
        <EmptyTitle>Nothing open.</EmptyTitle>
        <EmptyDescription>Pick a message to see it here.</EmptyDescription>
        <EmptyContent />
      </Empty>
    )
    expect(screen.getByText("Nothing open.").className).toContain("group-data-[size=sm]/empty:type-subtitle")
  })
})
