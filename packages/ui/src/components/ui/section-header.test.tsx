import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SectionHeader } from "./section-header"

const slot = (container: HTMLElement, name: string) => container.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("SectionHeader (Figma 32:60)", () => {
  it("is a heading of the overline title and the count; the rule is drawn, not read", () => {
    const { container } = render(<SectionHeader title="Mail // folders" count={12} />)
    const heading = screen.getByRole("heading", { level: 2, name: "Mail // folders 12" })
    expect(heading).toContainElement(slot(container, "section-header-title"))
    expect(slot(container, "section-header-title").className).toContain("type-overline")
    expect(slot(container, "section-header-title").className).toContain("text-muted-foreground")
    expect(slot(container, "section-header-count").className).toContain("type-meta")
    const rule = slot(container, "section-header-rule")
    expect(rule).toHaveAttribute("aria-hidden", "true")
    expect(rule.className.split(/\s+/)).toEqual(expect.arrayContaining(["h-(--stroke-rule)", "flex-1", "bg-line-rule"]))
  })

  it("32 tall, children centred, 12 between; Figma's 16 at the sides only when inset", () => {
    const { container, rerender } = render(<SectionHeader title="Activity" />)
    const classes = () => slot(container, "section-header").className.split(/\s+/)
    expect(classes()).toEqual(expect.arrayContaining(["h-8", "items-center", "gap-3"]))
    expect(classes()).not.toContain("px-4")
    rerender(<SectionHeader title="Activity" inset />)
    expect(classes()).toContain("px-4")
  })

  it("writes a number count as decisions §13 says; any other count as given", () => {
    const { rerender } = render(<SectionHeader title="Activity" count={6} />)
    expect(screen.getByRole("heading")).toHaveTextContent("Activity 06")
    rerender(<SectionHeader title="Knowledge" count={1204} />)
    expect(screen.getByRole("heading")).toHaveTextContent("Knowledge 1,204")
    rerender(<SectionHeader title="Failing checks" count="03 of 06" />)
    expect(screen.getByRole("heading")).toHaveTextContent("Failing checks 03 of 06")
  })

  it("takes a heading level", () => {
    render(<SectionHeader title="Activity" level={4} />)
    expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument()
  })

  it("puts the action after the rule, outside the heading", () => {
    const { container } = render(<SectionHeader title="Results" action={<button>Show all</button>} />)
    const action = slot(container, "section-header-action")
    expect(slot(container, "section-header-rule").compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole("heading")).not.toContainElement(screen.getByRole("button", { name: "Show all" }))
  })

  it("index: a letter header that stays in view on the ground", () => {
    const { container } = render(<SectionHeader variant="index" title="S" count={4} />)
    const header = slot(container, "section-header")
    expect(header).toHaveAttribute("data-variant", "index")
    expect(header.className.split(/\s+/)).toEqual(expect.arrayContaining(["sticky", "top-0", "bg-background"]))
    // A letter is drawn as Lockdown's Desktop / 01 draws it: the index role, `// 04`, no rule beside it.
    expect(slot(container, "section-header-title")).toHaveClass("type-number-index")
    expect(header).toHaveTextContent("S // 04")
    expect(container.querySelector('[data-slot="section-header-rule"]')).toBeNull()
    // 48 tall, the letter's line 4 above the bottom (its ink from 17 to 38), not centred.
    const cls = header.className.split(/\s+/)
    expect(cls).toEqual(expect.arrayContaining(["h-12", "items-end", "pb-1"]))
    expect(cls).not.toContain("items-center")
  })

  it("index: a longer title (a group of letters, Favorites) keeps the overline and the rule", () => {
    const { container } = render(<SectionHeader variant="index" title="A – P" count={146} />)
    expect(slot(container, "section-header-title")).toHaveClass("type-overline")
    expect(container.querySelector('[data-slot="section-header-rule"]')).not.toBeNull()
  })

  it("collapsible: the title is a disclosure button; shut, a summary line describes it; open, the panel shows", async () => {
    const onOpenChange = vi.fn()
    const { container } = render(
      <SectionHeader collapsible title="Runs with" summary="Coding // $2.00 cap // 06 files" onOpenChange={onOpenChange}>
        <p>Alias Coding</p>
      </SectionHeader>
    )
    const button = screen.getByRole("button", { name: "Runs with" })
    expect(screen.getByRole("heading")).toContainElement(button)
    expect(button).toHaveAttribute("aria-expanded", "false")
    expect(button).toHaveAccessibleDescription("Coding // $2.00 cap // 06 files")
    expect(slot(container, "section-header-summary").className).toContain("truncate")
    expect(screen.queryByText("Alias Coding")).toBeNull()
    await userEvent.click(button)
    expect(button).toHaveAttribute("aria-expanded", "true")
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(screen.getByText("Alias Coding")).toBeVisible()
    expect(slot(container, "section-header-summary")).toBeNull()
    expect(button.className).toContain("hit-area")
  })
})
