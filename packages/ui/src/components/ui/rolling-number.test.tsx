import { render } from "@testing-library/react"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { RollingNumber } from "./rolling-number"

const css = readFileSync(resolve(__dirname, "../../styles/motion.css"), "utf8")

const cells = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>('[data-slot="rolling-number-cell"]')]
const rolling = (root: HTMLElement) => root.querySelectorAll(".motion-roll-in").length

describe("RollingNumber", () => {
  it("reads the whole value once, and hides the rolling characters", () => {
    const { container } = render(<RollingNumber value={1234} locales="en-US" />)
    const root = container.querySelector<HTMLElement>('[data-slot="rolling-number"]')!
    expect(root.querySelector(".sr-only")).toHaveTextContent("1,234")
    expect(root.querySelector("[aria-hidden]")).toHaveTextContent("1,234")
    expect(root.className).toContain("tabular-nums")
  })

  it("does not roll on first render", () => {
    const { container } = render(<RollingNumber value={42} />)
    expect(rolling(container)).toBe(0)
    expect(container.querySelector(".motion-roll-out")).toBeNull()
  })

  it("rolls only the characters that changed, upward when the value grows", () => {
    const { container, rerender } = render(<RollingNumber value={129} locales="en-US" />)
    rerender(<RollingNumber value={130} locales="en-US" />)
    const root = container.querySelector<HTMLElement>('[data-slot="rolling-number"]')!
    expect(root).toHaveAttribute("data-direction", "up")
    // 129 → 130: the tens and the ones change; the hundreds hold still.
    const [hundreds, tens, ones] = cells(root)
    expect(hundreds!.querySelector(".motion-roll-in")).toBeNull()
    expect(tens!.querySelector(".motion-roll-in")).toHaveTextContent("3")
    expect(tens!.querySelector(".motion-roll-out")).toHaveTextContent("2")
    expect(ones!.querySelector(".motion-roll-in")).toHaveTextContent("0")
  })

  it("rolls downward when the value shrinks, and a lost character leaves", () => {
    const { container, rerender } = render(<RollingNumber value={100} />)
    rerender(<RollingNumber value={99} />)
    const root = container.querySelector<HTMLElement>('[data-slot="rolling-number"]')!
    expect(root).toHaveAttribute("data-direction", "down")
    expect(root.querySelector(".sr-only")).toHaveTextContent("99")
    expect([...root.querySelectorAll(".motion-roll-out")].map((el) => el.textContent)).toEqual(["1", "0", "0"])
  })

  it("rolls on --motion-state and the move curve, and not at all under reduced motion", () => {
    expect(css).toMatch(/\.motion-roll-in \{\s*animation: motion-roll-in var\(--motion-state\) var\(--motion-ease-move\)/)
    expect(css).toMatch(/\.motion-roll-out \{[^}]*opacity: 0;[^}]*animation: motion-roll-out var\(--motion-state\)/)
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"))
    expect(reduced).toMatch(/\.motion-roll-in,\s*\.motion-roll-out,[^{]*\{\s*animation: none;/)
  })
})
