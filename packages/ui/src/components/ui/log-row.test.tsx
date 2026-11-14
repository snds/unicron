import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { LogRow } from "./log-row"

describe("LogRow", () => {
  it("a mono time in the meta role, then the words in the ui role; 40 tall, on one baseline, 16 apart", () => {
    const { container } = render(<LogRow time="14:20">Opened harness/visual-qa</LogRow>)
    const row = container.querySelector('[data-slot="log-row"]') as HTMLElement
    expect(row.tagName).toBe("DIV")
    expect(row.className.split(/\s+/)).toEqual(expect.arrayContaining(["min-h-10", "py-2.5", "items-baseline", "gap-4"]))
    const time = container.querySelector('[data-slot="log-row-time"]') as HTMLElement
    // The meta role whole (12/20): no line height of its own. The pixel its line reaches under
    // the words' on a shared baseline comes off its margin, so the row stays 40.
    expect(time.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-meta", "text-muted-foreground", "-mb-px"]))
    expect(time.className).not.toMatch(/leading-/)
    const text = container.querySelector('[data-slot="log-row-text"]') as HTMLElement
    expect(text.className).toContain("type-ui")
    // Wraps, never cut.
    expect(text.className).not.toContain("truncate")
  })

  it("a machine-readable time is a time element", () => {
    const { container } = render(
      <LogRow time="14:21" dateTime="2026-11-12T14:21">
        Read harness/visual-qa/config.ts
      </LogRow>
    )
    expect(container.querySelector("time")).toHaveAttribute("datetime", "2026-11-12T14:21")
  })

  it("as a link the whole line is the link, named time then words, with the washes", () => {
    render(
      <LogRow href="#k-14" time="13:40">
        Check K-14 started failing
      </LogRow>
    )
    const link = screen.getByRole("link", { name: "13:40 Check K-14 started failing" })
    expect(link).toHaveAttribute("href", "#k-14")
    expect(link).toHaveAttribute("data-linked")
    expect(link.className.split(/\s+/)).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    expect(link.className).not.toContain("outline-none")
  })

  it("a list item with render, and a router link with render and link", () => {
    const { container, rerender } = render(
      <ol>
        <LogRow render={<li />} time="14:23">
          Added 9 tests
        </LogRow>
      </ol>
    )
    expect(screen.getByRole("listitem")).toHaveAttribute("data-slot", "log-row")
    expect(container.querySelector('[data-slot="log-row"]')!.className).not.toContain("hover:bg-state-hover")
    rerender(
      <LogRow render={<a href="/router/codex" />} link time="09:02">
        Codex connected
      </LogRow>
    )
    expect(screen.getByRole("link", { name: "09:02 Codex connected" }).className).toContain("hover:bg-state-hover")
  })
})
