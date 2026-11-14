import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Spinner } from "./spinner"

const css = readFileSync(resolve(__dirname, "../../styles/index.css"), "utf8")
const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))

describe("Spinner", () => {
  it("is a status with a name a screen reader hears", () => {
    render(<Spinner />)
    const spinner = screen.getByRole("status", { name: "Loading" })
    expect(spinner).toHaveAttribute("data-slot", "spinner")
    expect(spinner).not.toHaveAttribute("aria-hidden")
  })

  // Generic loading never borrows the agent's "working" motion (rules 1.6, contract 3): the working
  // ring turns evenly on --motion-spin; the spinner turns once per --c-spinner-turn-duration and
  // eases in and out of each turn.
  it("turns on its own motion, not the agent's working ring", () => {
    render(<Spinner />)
    const cls = screen.getByRole("status").getAttribute("class") ?? ""
    expect(cls).toContain("animate-[spin_var(--c-spinner-turn-duration)_var(--motion-ease-move)_infinite]")
    expect(cls).not.toMatch(/(^|\s)animate-spin(\s|$)/)
    expect(cls).not.toContain("--motion-spin")
    expect(cls).not.toContain("linear")
  })

  // A spinner is not an icon: it is an arc of its own, so it needs no icon set and no font.
  it("is an SVG arc on the icons' grid, not an icon", () => {
    render(<Spinner />)
    const spinner = screen.getByRole("status", { name: "Loading" })
    expect(spinner.tagName.toLowerCase()).toBe("svg")
    expect(spinner).toHaveAttribute("viewBox", "0 0 32 32")
    expect(spinner).toHaveAttribute("stroke", "currentColor")
    expect(spinner).not.toHaveAttribute("data-icon-name")
    expect(spinner.querySelectorAll("path")).toHaveLength(1)
    expect(spinner.querySelector("text")).toBeNull()
    expect(spinner.getAttribute("class")).toContain("size-4")
  })

  it("takes a host's own words", () => {
    render(<Spinner label="Saving" />)
    expect(screen.getByRole("status", { name: "Saving" })).toBeInTheDocument()
  })
})

describe("motion tokens and reduced motion", () => {
  it("spins and pulses at the motion roles, not Tailwind's own rates", () => {
    expect(css).toMatch(/--animate-spin: spin var\(--motion-spin\) linear infinite;/)
    expect(css).toMatch(/--animate-pulse: pulse var\(--motion-pulse\)/)
  })

  it("has one system-wide reduced-motion layer, outside every @layer so it wins over utilities", () => {
    expect(reduced.length).toBeGreaterThan(0)
    const before = css.slice(0, css.indexOf("@media (prefers-reduced-motion: reduce)"))
    const opened = (before.match(/@layer [\w-]+ \{/g) ?? []).length
    const blockDepth = before.split("{").length - before.split("}").length
    expect(blockDepth, `${opened} @layer blocks before it; the reduced-motion layer must sit at the top level`).toBe(0)
  })

  it("stops every loop, with or without a variant in front, and stills the spinner at reduced opacity", () => {
    // Matched in the class attribute, so `group-data-indeterminate/progress:animate-pulse` stops
    // too (a rule on `.animate-pulse` would miss it).
    for (const loop of ["animate-spin", "animate-pulse", "animate-ping", "animate-bounce"]) expect(reduced).toContain(`[class*="${loop}"]`)
    expect(reduced).toMatch(/\[class\*="animate-bounce"\] \{\s*animation: none;/)
    expect(reduced).toMatch(/\[data-slot="spinner"\] \{\s*animation: none;\s*opacity: [\d.]+;/)
  })

  it("lets entrances and exits fade, without sliding, scaling or turning", () => {
    for (const axis of ["translate-x: 0", "translate-y: 0", "scale: 1", "rotate: 0"]) {
      expect(reduced).toContain(`--tw-enter-${axis};`)
      expect(reduced).toContain(`--tw-exit-${axis};`)
    }
    expect(reduced).toMatch(/transition-property: opacity, color/)
    expect(reduced).toContain("transition-duration: var(--motion-fast);")
  })
})
