import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Badge, badgeVariants, type BadgeTone, type BadgeVariant } from "./badge"

const TONES: BadgeTone[] = ["neutral", "live", "needs-you", "critical", "warning", "success"]
const classesOf = (props?: Parameters<typeof badgeVariants>[0]) => badgeVariants(props).split(/\s+/)

describe("Badge", () => {
  it("is a span with its word as typed; the type role sets the capitals", () => {
    render(<Badge tone="live">Running</Badge>)
    const badge = screen.getByText("Running")
    expect(badge.tagName).toBe("SPAN")
    expect(badge).toHaveAttribute("data-slot", "badge")
    expect(badge).toHaveAttribute("data-tone", "live")
  })

  it("is mono caps in a 20px box on the control radius", () => {
    for (const tone of TONES) {
      const classes = classesOf({ tone })
      expect(classes).toEqual(expect.arrayContaining(["type-overline", "h-5", "px-1.5", "rounded-lg"]))
      expect(classes.some((c) => c === "rounded-full" || c === "rounded-4xl")).toBe(false)
      // No border: an edge is drawn inside the box.
      expect(classes.some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
    }
  })

  it("every tone names its own ink (the overline role would otherwise make it label grey)", () => {
    for (const tone of TONES) expect(classesOf({ tone }).filter((c) => c.startsWith("text-"))).toHaveLength(1)
  })

  it("neutral and live are a word in a hairline box, on no ground of their own", () => {
    expect(classesOf()).toEqual(expect.arrayContaining(["rule-box", "text-muted-foreground"]))
    expect(classesOf({ tone: "live" })).toEqual(expect.arrayContaining(["rule-box", "text-secondary-live"]))
    for (const tone of ["neutral", "live"] as const) expect(classesOf({ tone }).some((c) => c.startsWith("bg-"))).toBe(false)
  })

  it("needs-you is the one solid tone: the yellow with its ink, and its ring in that ink", () => {
    expect(classesOf({ tone: "needs-you" })).toEqual(
      expect.arrayContaining(["bg-needs-you-fill", "text-needs-you-on-fill", "focus-visible:outline-needs-you-on-fill"])
    )
    for (const tone of TONES.filter((t) => t !== "needs-you")) {
      expect(classesOf({ tone }).some((c) => /^bg-(primary|needs-you-fill|critical-fill|foreground)$/.test(c))).toBe(false)
    }
  })

  it("critical, warning and success sit on a soft ground", () => {
    expect(classesOf({ tone: "critical" })).toEqual(expect.arrayContaining(["bg-critical-soft", "text-foreground", "inset-ring", "inset-ring-critical-fill"]))
    expect(classesOf({ tone: "warning" })).toEqual(expect.arrayContaining(["bg-warning/15", "text-foreground", "inset-ring", "inset-ring-warning"]))
    expect(classesOf({ tone: "success" })).toEqual(expect.arrayContaining(["bg-success-surface", "text-success-foreground"]))
  })

  it("the names from before 1.0 still draw, each as a tone", () => {
    const expected: Record<BadgeVariant, BadgeTone> = {
      default: "neutral",
      secondary: "neutral",
      outline: "neutral",
      ghost: "neutral",
      link: "neutral",
      destructive: "critical",
    }
    for (const [variant, tone] of Object.entries(expected) as [BadgeVariant, BadgeTone][]) {
      expect(badgeVariants({ variant })).toBe(badgeVariants({ tone }))
    }
    render(<Badge variant="destructive">Clash</Badge>)
    expect(screen.getByText("Clash")).toHaveAttribute("data-tone", "critical")
  })

  it("tone wins over a legacy variant, and a caller's className is kept", () => {
    render(
      <Badge variant="destructive" tone="success" className="ml-2">
        Passing
      </Badge>
    )
    const badge = screen.getByText("Passing")
    expect(badge).toHaveAttribute("data-tone", "success")
    expect(badge.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-success-surface", "ml-2"]))
  })

  it("renders as a link when asked, and keeps the badge's classes", () => {
    render(
      <Badge tone="critical" render={<a href="#checks" />}>
        Failing
      </Badge>
    )
    const link = screen.getByRole("link", { name: "Failing" })
    expect(link).toHaveAttribute("data-slot", "badge")
    expect(link.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-overline", "bg-critical-soft", "focus-visible:outline-2"]))
  })
})
