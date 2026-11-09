import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { StatusOrb, statusOrbCopy, statusOrbStates } from "./status-orb"

const css = readFileSync(resolve(__dirname, "../../styles/index.css"), "utf8")
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))

describe("StatusOrb", () => {
  it("names every state from its own copy table; the host passes only the state", () => {
    for (const state of statusOrbStates) {
      const { unmount } = render(<StatusOrb state={state} tooltip={false} />)
      const orb = screen.getByRole("img", { name: statusOrbCopy[state] })
      expect(orb).toHaveAttribute("data-slot", "status-orb")
      expect(orb).toHaveAttribute("data-state", state)
      // No words on screen (a glyph's ligature is aria-hidden inside the icon).
      expect(orb.textContent).not.toContain(statusOrbCopy[state])
      unmount()
    }
  })

  it("keeps its words short: one or two words, in the name only", () => {
    for (const words of Object.values(statusOrbCopy)) expect(words.split(" ").length).toBeLessThanOrEqual(2)
  })

  it("draws queued, paused and stopped as still glyphs of their own, coloured from their own tokens", () => {
    const glyphs = { queued: "schedule", paused: "pause_circle", stopped: "stop_circle" } as const
    for (const [state, name] of Object.entries(glyphs)) {
      const { container, unmount } = render(<StatusOrb state={state as keyof typeof glyphs} tooltip={false} />)
      const glyph = container.querySelector('[data-slot="status-orb-glyph"]')
      expect(glyph).toBeInTheDocument()
      expect(glyph?.textContent).toContain(name)
      expect(container.querySelector('[data-slot="status-orb-halo"]')).toBeNull()
      expect(css).toContain(`[data-slot="status-orb"][data-state="${state}"] { color: var(--c-status-orb-${state}); }`)
      // Nothing waiting or over moves.
      expect(css).not.toMatch(new RegExp(String.raw`\[data-state="${state}"\][^{]*\{[^}]*animation`))
      unmount()
    }
  })

  it("tells stopped apart from failed and from idle, by shape and by name", () => {
    const names = new Set(statusOrbStates.map((state) => statusOrbCopy[state]))
    expect(names.size).toBe(statusOrbStates.length)
    const { container, rerender } = render(<StatusOrb state="stopped" tooltip={false} />)
    const stopped = container.querySelector('[data-slot="status-orb-glyph"]')?.textContent
    rerender(<StatusOrb state="failed" tooltip={false} />)
    expect(container.querySelector('[data-slot="status-orb-glyph"]')?.textContent).not.toBe(stopped)
    rerender(<StatusOrb state="idle" tooltip={false} />)
    expect(container.querySelector('[data-slot="status-orb-glyph"]')).toBeNull()
  })

  it("draws done and failed as glyphs, and the rest as a dot and a halo", () => {
    const { container, rerender } = render(<StatusOrb state="done" tooltip={false} />)
    expect(container.querySelector('[data-slot="status-orb-glyph"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="status-orb-dot"]')).toBeNull()
    rerender(<StatusOrb state="working" tooltip={false} />)
    expect(container.querySelector('[data-slot="status-orb-dot"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="status-orb-halo"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="status-orb-glyph"]')).toBeNull()
  })

  it("is still a named orb when it carries a tooltip, and adds no tab stop", () => {
    render(<StatusOrb state="needs-you" />)
    const orb = screen.getByRole("img", { name: "Needs you" })
    expect(orb).toHaveAttribute("data-state", "needs-you")
    expect(orb).not.toHaveAttribute("tabindex")
    expect(orb.tagName).toBe("SPAN")
  })

  it("takes words in another language", () => {
    render(<StatusOrb state="failed" label="Échec" tooltip={false} />)
    expect(screen.getByRole("img", { name: "Échec" })).toBeInTheDocument()
  })

  it("sizes from the component tokens", () => {
    render(<StatusOrb state="idle" size="xs" tooltip={false} />)
    expect(screen.getByRole("img")).toHaveAttribute("data-size", "xs")
    for (const size of ["xs", "sm", "md"]) expect(css).toContain(`var(--c-status-orb-size-${size})`)
  })

  it("tells states apart by shape and motion: a breathing halo, a turning ring with a gap, a pulsing ring, a hollow dot", () => {
    expect(css).toMatch(/\[data-state="thinking"\] > \[data-slot="status-orb-halo"\] \{[^}]*animation: status-orb-breathe var\(--motion-pulse\)/)
    expect(css).toMatch(/\[data-state="working"\] > \[data-slot="status-orb-halo"\] \{[^}]*border-top-color: transparent;[^}]*animation: spin var\(--motion-spin\)/)
    expect(css).toMatch(/\[data-state="needs-you"\] > \[data-slot="status-orb-halo"\] \{[^}]*animation: status-orb-ping var\(--motion-pulse\)/)
    expect(css).toMatch(/\[data-state="offline"\] > \[data-slot="status-orb-dot"\] \{[^}]*background: transparent;/)
  })

  it("holds still under reduced motion, with a dashed ring for working", () => {
    expect(reduced).toMatch(/\[data-slot="status-orb-halo"\] \{\s*animation: none;/)
    expect(reduced).toMatch(/\[data-state="working"\] > \[data-slot="status-orb-halo"\] \{\s*border-style: dashed;/)
  })
})
