import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Prose } from "./prose"

describe("Prose", () => {
  it("draws a note in the body role and a reply in the response role", () => {
    const { container, rerender } = render(<Prose>Text</Prose>)
    const root = container.querySelector('[data-slot="prose"]')!
    expect(root).toHaveAttribute("data-variant", "body")
    expect(root.className).toContain("type-body")
    rerender(<Prose variant="response">Text</Prose>)
    expect(root).toHaveAttribute("data-variant", "response")
    expect(root.className).toContain("type-response")
    expect(root.className).not.toMatch(/(^| )type-body( |$)/)
  })

  it("renders what the host hands it, elements and all", () => {
    render(
      <Prose variant="response">
        <h2>Rollback</h2>
        <p>
          Run <code>pnpm migrate:down</code>, then <a href="https://example.com/runbook">read the runbook</a>.
        </p>
        <ul>
          <li>Keep the old flow for 30 days.</li>
        </ul>
      </Prose>
    )
    expect(screen.getByRole("heading", { level: 2, name: "Rollback" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "read the runbook" })).toBeInTheDocument()
    expect(screen.getByText("pnpm migrate:down").tagName).toBe("CODE")
    expect(screen.getByRole("listitem")).toHaveTextContent("Keep the old flow for 30 days.")
  })

  it("styles every element from a type role, a colour role and the 4px scale", () => {
    const { container } = render(<Prose />)
    const c = container.querySelector('[data-slot="prose"]')!.className
    for (const rule of [
      // Headings: lead, subtitle; h4 to h6 and bold at the variant's size in the strong weight.
      "[&_h1]:type-lead",
      "[&_:is(h2,h3)]:type-subtitle",
      "[&_:is(h4,h5,h6,strong,b)]:[font-weight:var(--type-body-strong-weight)]",
      // Blocks 16 apart, sections 32.
      "[&>*+*]:mt-4",
      "[&>*+:is(h1,h2,h3,h4,h5,h6)]:mt-8",
      // Square list marks.
      "[&_ul]:list-[square]",
      // Links in the identity text colour, underlined.
      "[&_a]:text-primary-text",
      "[&_a]:underline",
      // Inline code in the mono code role, a raised hairline box.
      "[&_:not(pre)>code]:type-code-inline",
      "[&_:not(pre)>code]:rule-box",
      // Quotes behind a hairline, tables with overline heads over rule rows that scroll sideways.
      "[&_blockquote]:rule-l",
      "[&_th]:type-overline",
      "[&_td]:rule-b",
      "[&_table]:overflow-x-auto",
      "[&_hr]:bg-line-rule",
    ]) {
      expect(c).toContain(rule)
    }
    // No hand-picked size or weight.
    expect(c).not.toMatch(/(^| )text-(xs|sm|base|lg|xl)( |$)|font-(medium|semibold|bold)/)
  })
})
