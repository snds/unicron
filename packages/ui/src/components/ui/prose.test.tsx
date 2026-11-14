import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import { compile } from "tailwindcss"
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

  it("blocks are 16 apart in the body role and 24 in the response role, as Vale draws a mail's paragraphs", () => {
    const { container, rerender } = render(<Prose>Text</Prose>)
    const classes = () => container.querySelector('[data-slot="prose"]')!.className.split(" ")
    expect(classes()).toContain("[&>*+*]:mt-4")
    expect(classes()).not.toContain("[&>*+*]:mt-6")
    rerender(<Prose variant="response">Text</Prose>)
    expect(classes()).toContain("[&>*+*]:mt-6")
    expect(classes()).not.toContain("[&>*+*]:mt-4")
    // A section still opens 32 after what precedes it, and its heading sits 8 over its first block.
    expect(classes()).toEqual(expect.arrayContaining(["[&>*+:is(h1,h2,h3,h4,h5,h6)]:mt-8", "[&>:is(h1,h2,h3,h4,h5,h6)+*]:mt-2"]))
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

describe("Prose response: bold and h4 at the reply's size, in the strong weight (contract 5.1c C20, Warpcore NA5)", () => {
  /** The CSS Tailwind writes for a set of classes. */
  async function cssFor(classes: string[]) {
    const utilities = readFileSync(createRequire(import.meta.url).resolve("tailwindcss/utilities.css"), "utf8")
    const tw = await compile('@import "tailwindcss/utilities";', {
      loadStylesheet: async (_id, base) => ({ path: "utilities.css", base, content: utilities }),
    })
    return tw.build(classes)
  }

  it("strong, b and h4 to h6 take only the strong weight: no size or leading of their own, so they keep the response role's 17/28", async () => {
    const { container } = render(
      <Prose variant="response">
        <h4>What changed</h4>
        <p>
          The <strong>login form</strong> now sends a <b>request ID</b>.
        </p>
      </Prose>
    )
    const root = container.querySelector('[data-slot="prose"]')!
    const classes = root.className.split(/\s+/)
    expect(classes).toContain("type-response")
    // Every rule that reaches h4, strong or b: the weight, the heading ink and the spacing.
    const rules = classes.filter((c) => /\b(h4|strong|b)\b/.test(c.split("]:")[0] ?? ""))
    expect(rules).toContain("[&_:is(h4,h5,h6,strong,b)]:[font-weight:var(--type-body-strong-weight)]")
    // None sets a type role, a size or a leading: they inherit the reply's.
    expect(rules.some((c) => /:(type-|text-\[length|leading-|\[font-size|\[line-height)/.test(c))).toBe(false)
    const css = await cssFor(rules)
    expect(css).toMatch(/:is\(h4, ?h5, ?h6, ?strong, ?b\)/)
    expect(css).toContain("font-weight: var(--type-body-strong-weight)")
    expect(css).not.toMatch(/font-size|line-height/)
  })

  it("is not a 24th type role: the 23 roles stay as Figma holds them", () => {
    const file = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/type.json"), "utf8"))
    const roles = Object.keys(file.type).filter((k) => !k.startsWith("$"))
    expect(roles).toHaveLength(23)
    expect(roles).toContain("response")
    expect(roles).toContain("body-strong")
    expect(JSON.stringify(file)).not.toMatch(/response-strong|responseStrong|response strong/i)
  })
})

