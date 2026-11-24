import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"

import { TaskRow } from "./task-row"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("TaskRow (Figma 143:633)", () => {
  it("is a button named by its state, title and unread; a link with href", async () => {
    const onClick = vi.fn()
    const { rerender } = render(<TaskRow state="working" title="Back up before each deploy" time="now" unread onClick={onClick} />)
    const row = screen.getByRole("button", { name: "Working Back up before each deploy Unread" })
    expect(row).toHaveAccessibleDescription("now")
    await userEvent.click(row)
    expect(onClick).toHaveBeenCalled()
    rerender(<TaskRow state="done" title="Ship it" href="/tasks/1" />)
    expect(screen.getByRole("link", { name: "Done Ship it" })).toHaveAttribute("href", "/tasks/1")
  })

  it("draws the anatomy: 10 / 12 inside, 10 apart, an 8px corner, ui title, caption time and meta", () => {
    render(<TaskRow state="working" title="Back up" time="now" line="Step 2 of 4" meta="Claude Code · server · 12 min" />)
    const row = screen.getByRole("button")
    expect(classesOf(row)).toEqual(expect.arrayContaining(["px-3", "py-2.5", "gap-2.5", "rounded-lg", "hover:bg-surface-hover"]))
    expect(classesOf(row.querySelector('[data-slot="task-row-title"]')!)).toEqual(expect.arrayContaining(["type-ui", "text-text-body", "truncate"]))
    expect(classesOf(row.querySelector('[data-slot="task-row-time"]')!)).toEqual(expect.arrayContaining(["type-caption", "text-text-label"]))
    expect(classesOf(row.querySelector('[data-slot="task-row-line"]')!)).toEqual(expect.arrayContaining(["type-ui", "text-text-secondary"]))
    expect(classesOf(row.querySelector('[data-slot="task-row-meta"]')!)).toEqual(expect.arrayContaining(["type-caption", "text-text-label"]))
    expect(row.querySelector('[data-slot="status-orb"]')).toHaveAttribute("data-size", "xs")
  })

  it("selected is the 8% fill with the inset bar and a medium title, and says aria-current", () => {
    const { rerender } = render(<TaskRow state="working" title="Back up" selected />)
    const row = screen.getByRole("button")
    expect(row).toHaveAttribute("aria-current", "true")
    expect(row.className).toContain("aria-[current=true]:bg-surface-selected")
    expect(classesOf(row.querySelector('[data-slot="task-row-bar"]')!)).toEqual(expect.arrayContaining(["start-1.5", "inset-y-2", "w-0.5", "bg-primary-text"]))
    expect(row.querySelector('[data-slot="task-row-title"]')!.className).toContain("type-ui-emphasis")
    rerender(<TaskRow state="working" title="Back up" />)
    expect(row.querySelector('[data-slot="task-row-bar"]')).toBeNull()
    expect(row).not.toHaveAttribute("aria-current")
  })

  it("leaves out the parts it is not given", () => {
    render(<TaskRow state="idle" title="Back up" />)
    const row = screen.getByRole("button")
    for (const slot of ["task-row-time", "task-row-line", "task-row-meta", "task-row-helpers"]) expect(row.querySelector(`[data-slot="${slot}"]`)).toBeNull()
    // The unread slot keeps its 12px, so titles line up whether or not a row is unread.
    expect(row.querySelector('[data-slot="task-row-unread"]')!.children).toHaveLength(0)
  })
})
