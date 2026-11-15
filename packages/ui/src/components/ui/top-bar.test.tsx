import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FloatButton } from "./float-button"
import { TopBar } from "./top-bar"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("TopBar", () => {
  it("a 48 high row: the back float button (48, arrow--left) at the start, actions at the end 8px apart", async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const { container } = render(
      <TopBar
        onBack={onBack}
        actions={
          <>
            <FloatButton label="Edit" icon="edit" size="l" />
            <FloatButton label="More" icon="overflow-menu--horizontal" size="l" />
          </>
        }
      />
    )
    const bar = container.querySelector('[data-slot="top-bar"]')!
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["h-control", "grid", "items-center"]))
    const back = screen.getByRole("button", { name: "Back" })
    expect(back).toHaveAttribute("data-slot", "float-button")
    expect(back).toHaveAttribute("data-size", "l")
    expect(back.querySelector('[data-icon-name="arrow--left"]')).not.toBeNull()
    await user.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
    const actions = container.querySelector('[data-slot="top-bar-actions"]')!
    expect(classesOf(actions)).toEqual(expect.arrayContaining(["justify-end", "gap-2"]))
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument()
  })

  it("the small centred title is the subtitle role, cut before it reaches the ends; no title until asked", () => {
    const { container, rerender } = render(<TopBar onBack={() => {}} />)
    expect(container.querySelector('[data-slot="top-bar-title"]')).toBeNull()
    rerender(<TopBar onBack={() => {}} title="Migrate vault login to OPAQUE" />)
    const title = container.querySelector('[data-slot="top-bar-title"]')!
    expect(title.tagName).toBe("P")
    expect(classesOf(title)).toEqual(expect.arrayContaining(["type-subtitle", "truncate", "text-center", "text-text-body", "motion-pop"]))
  })

  it("the title can be the page's heading, and the back button can be named or replaced", () => {
    const { rerender } = render(<TopBar title="New message" titleAs="h1" onBack={() => {}} backLabel="Close" />)
    expect(screen.getByRole("heading", { level: 1, name: "New message" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument()
    rerender(<TopBar title="New message" start={<FloatButton label="Discard" icon="close" size="l" />} onBack={() => {}} />)
    expect(screen.getByRole("button", { name: "Discard" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Back" })).toBeNull()
  })
})
