import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from "./toolbar"

function Subject({ onArchive = () => {} }: { onArchive?: () => void }) {
  return (
    <>
      <button type="button">Before</button>
      <Toolbar aria-label="Message actions">
        <ToolbarGroup>
          <ToolbarButton label="Archive" icon="archive" onClick={onArchive} />
          <ToolbarToggle label="Snooze" icon="time" defaultPressed />
          <ToolbarButton label="Star" icon="star" />
        </ToolbarGroup>
        <ToolbarSeparator />
        <ToolbarButton label="Mark unread" />
      </Toolbar>
      <button type="button">After</button>
    </>
  )
}

describe("Toolbar (contract 5.1b #35)", () => {
  it("is a named toolbar of named buttons", () => {
    render(<Subject />)
    expect(screen.getByRole("toolbar", { name: "Message actions" })).toHaveAttribute("data-slot", "toolbar")
    for (const name of ["Archive", "Snooze", "Star", "Mark unread"]) expect(screen.getByRole("button", { name })).toBeInTheDocument()
    expect(screen.getByRole("separator")).toHaveAttribute("data-slot", "toolbar-separator")
  })

  it("is one Tab stop; the arrow keys, Home and End move along it", async () => {
    render(<Subject />)
    screen.getByRole("button", { name: "Before" }).focus()
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("button", { name: "Snooze" })).toHaveFocus()
    await userEvent.keyboard("{End}")
    expect(screen.getByRole("button", { name: "Mark unread" })).toHaveFocus()
    await userEvent.keyboard("{Home}")
    expect(screen.getByRole("button", { name: "Archive" })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole("button", { name: "After" })).toHaveFocus()
  })

  it("runs its actions; a toggle keeps aria-pressed and draws it as inverted ink", async () => {
    const onArchive = vi.fn()
    render(<Subject onArchive={onArchive} />)
    await userEvent.click(screen.getByRole("button", { name: "Archive" }))
    expect(onArchive).toHaveBeenCalledTimes(1)
    const snooze = screen.getByRole("button", { name: "Snooze" })
    expect(snooze).toHaveAttribute("aria-pressed", "true")
    expect(snooze.className).toContain("aria-pressed:bg-foreground")
    await userEvent.click(snooze)
    expect(snooze).toHaveAttribute("aria-pressed", "false")
  })

  it("its buttons are ghost: the 32px square for an icon, S for a word", () => {
    render(<Subject />)
    const archive = screen.getByRole("button", { name: "Archive" })
    expect(archive).toHaveAttribute("data-variant", "ghost")
    expect(archive).toHaveAttribute("data-size", "icon-sm")
    expect(screen.getByRole("button", { name: "Mark unread" })).toHaveAttribute("data-size", "sm")
  })

  it("size default is the 40px square", () => {
    render(
      <Toolbar aria-label="Format" size="default">
        <ToolbarToggle label="Bold" icon="text--bold" />
        <ToolbarButton label="Link" icon="link" />
      </Toolbar>
    )
    expect(screen.getByRole("button", { name: "Link" })).toHaveAttribute("data-size", "icon")
    expect(screen.getByRole("button", { name: "Bold" }).className).toContain("h-10")
  })
})

describe("ToolbarSeparator", () => {
  it("runs across the toolbar: upright in a row, flat in a column", () => {
    render(
      <>
        <Toolbar aria-label="Row">
          <ToolbarButton label="A" icon="add" />
          <ToolbarSeparator />
          <ToolbarButton label="B" icon="close" />
        </Toolbar>
        <Toolbar aria-label="Column" orientation="vertical">
          <ToolbarButton label="C" icon="add" />
          <ToolbarSeparator />
          <ToolbarButton label="D" icon="close" />
        </Toolbar>
      </>
    )
    const [row, column] = screen.getAllByRole("separator")
    expect(row).toHaveAttribute("aria-orientation", "vertical")
    expect(column).toHaveAttribute("aria-orientation", "horizontal")
  })
})
