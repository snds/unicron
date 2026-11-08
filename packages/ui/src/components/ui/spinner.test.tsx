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
    expect(spinner.getAttribute("class")).toContain("animate-spin")
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

  it("stops every loop and stills the spinner at reduced opacity", () => {
    for (const loop of [".animate-spin", ".animate-pulse", ".animate-ping", ".animate-bounce"]) expect(reduced).toContain(loop)
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
