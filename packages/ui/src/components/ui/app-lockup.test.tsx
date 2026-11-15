import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AppLockup } from "./app-lockup"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("AppLockup (Figma 28:2297)", () => {
  it("is a 32px primary mark holding the initial, and the wordmark, 10px apart in the 48 control height", () => {
    const { container } = render(<AppLockup name="Vale" />)
    const root = container.querySelector('[data-slot="app-lockup"]')!
    expect(classesOf(root)).toEqual(expect.arrayContaining(["h-control", "gap-2.5", "items-center"]))
    const mark = root.querySelector('[data-slot="app-lockup-mark"]')!
    expect(mark).toHaveTextContent("V")
    expect(mark).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(mark)).toEqual(expect.arrayContaining(["size-(--c-app-lockup-mark)", "bg-primary-fill", "text-primary-on-fill", "type-subtitle", "rounded-sm"]))
    const name = root.querySelector('[data-slot="app-lockup-name"]')!
    expect(name).toHaveTextContent("Vale")
    expect(classesOf(name)).toEqual(expect.arrayContaining(["type-brand-wordmark", "text-text-body", "uppercase"]))
  })

  it("takes an initial of its own", () => {
    const { container } = render(<AppLockup name="Warpcore" initial="w" />)
    expect(container.querySelector('[data-slot="app-lockup-mark"]')).toHaveTextContent("W")
  })

  it("showName={false} hides the wordmark but keeps it as the name", () => {
    render(<AppLockup name="Lockdown" showName={false} render={<a href="/" />} />)
    const link = screen.getByRole("link", { name: "Lockdown" })
    expect(link.querySelector('[data-slot="app-lockup-name"]')!.className).toContain("sr-only")
  })

  it("a real mark takes the square instead of the placeholder", () => {
    const { container } = render(<AppLockup name="Synapse" mark={<svg data-testid="art" />} />)
    const mark = container.querySelector('[data-slot="app-lockup-mark"]')!
    expect(mark.querySelector('[data-testid="art"]')).not.toBeNull()
    expect(mark.className).not.toContain("bg-primary-fill")
    expect(mark).not.toHaveTextContent("S")
  })

  it("renders as a link home", () => {
    render(<AppLockup name="Vale" render={<a href="/" />} />)
    expect(screen.getByRole("link", { name: "Vale" })).toHaveAttribute("href", "/")
  })
})
