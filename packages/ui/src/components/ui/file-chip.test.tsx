import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FileChip } from "./file-chip"

const slot = (container: HTMLElement, name: string) => container.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("FileChip (contract 5.1a, 5.1b #30)", () => {
  it("raised with a hairline; type tag in overline on the primary fill, name in ui, size in meta; 12 in and between, 44 tall", () => {
    const { container } = render(<FileChip name="Pine Hollow booking.pdf" type="PDF" size="84 KB" />)
    expect(slot(container, "file-chip").className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box"]))
    expect(slot(container, "file-chip-type").className.split(/\s+/)).toEqual(expect.arrayContaining(["type-overline", "bg-primary", "text-primary-foreground", "h-5"]))
    // The label role (14/20), as Vale Desktop / 01 draws the name: its chip is 276 wide.
    expect(slot(container, "file-chip-name").className.split(" ")).toContain("type-label")
    expect(slot(container, "file-chip-name").className.split(" ")).not.toContain("type-ui")
    expect(slot(container, "file-chip-size").className).toContain("type-meta")
    expect(slot(container, "file-chip-main").className.split(/\s+/)).toEqual(expect.arrayContaining(["gap-3", "py-3", "pl-3", "pr-3"]))
    // Not pressable: no control.
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
  })

  it("a link that opens the file, named by type, name and size", () => {
    render(<FileChip name="Pine Hollow booking.pdf" size="84 KB" href="/files/pine-hollow.pdf" />)
    const link = screen.getByRole("link", { name: "pdf Pine Hollow booking.pdf 84 KB" })
    expect(link).toHaveAttribute("href", "/files/pine-hollow.pdf")
    expect(link.className.split(/\s+/)).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
  })

  it("a button with onClick; the trailing action is its own control beside it", async () => {
    const onOpen = vi.fn()
    const onSave = vi.fn()
    const { container } = render(
      <FileChip name="Pine Hollow booking.pdf" size="84 KB" onClick={onOpen} action={<button onClick={onSave}>Save</button>} />
    )
    const open = screen.getByRole("button", { name: /Pine Hollow booking\.pdf/ })
    expect(open).not.toContainElement(screen.getByRole("button", { name: "Save" }))
    await userEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()
    await userEvent.click(open)
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(slot(container, "file-chip-main").className).toContain("pr-2")
  })

  it("busy: a spinner in place of the size, and aria-busy", () => {
    const { container } = render(<FileChip name="Pine Hollow booking.pdf" size="84 KB" busy href="#f" />)
    expect(screen.getByRole("link")).toHaveAttribute("aria-busy", "true")
    expect(slot(container, "file-chip-busy")).toBeInTheDocument()
    expect(slot(container, "file-chip-size")).toBeNull()
    expect(screen.getByRole("link")).toHaveAccessibleName(/Working on it/)
  })

  it("critical: the 2px critical edge, the tag in the critical fill, the reason in critical ink in place of the size", () => {
    const { container } = render(<FileChip name="Pine Hollow booking.pdf" size="84 KB" critical="Too big to send" />)
    const chip = slot(container, "file-chip")
    expect(chip).toHaveAttribute("data-critical")
    expect(chip.className.split(/\s+/)).toEqual(expect.arrayContaining(["rule-box-emphasis", "[--rule-color:var(--critical-fill)]"]))
    expect(slot(container, "file-chip-type").className).toContain("bg-critical-fill")
    expect(slot(container, "file-chip-critical")).toHaveTextContent("Too big to send")
    expect(slot(container, "file-chip-critical").className).toContain("text-critical-text")
    expect(slot(container, "file-chip-size")).toBeNull()
  })

  it("a thumbnail in place of the type tag; decorative, as the name says what it is", () => {
    const { container } = render(<FileChip name="cabin.jpg" thumbnail="/thumbs/cabin.jpg" size="1.2 MB" />)
    const img = slot(container, "file-chip-thumbnail")
    expect(img).toHaveAttribute("src", "/thumbs/cabin.jpg")
    expect(img).toHaveAttribute("alt", "")
    expect(slot(container, "file-chip-type")).toBeNull()
  })

  it("with no type the tag is the extension", () => {
    const { container } = render(<FileChip name="0042_opaque.sql" />)
    expect(slot(container, "file-chip-type")).toHaveTextContent("sql")
  })
})
