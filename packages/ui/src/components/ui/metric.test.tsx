import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Badge } from "./badge"
import { Metric } from "./metric"

const classesOf = (el: Element) => el.className.split(/\s+/)
const part = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("Metric (Figma 15:513)", () => {
  it("reads label, number, change in order, under a 2px ink rule drawn inside the box", () => {
    render(<Metric label="Skills" value="145" delta="+3 this week" />)
    const metric = part("metric")
    expect(metric.tagName).toBe("DIV")
    expect(metric).toHaveTextContent("Skills 145 +3 this week")
    expect(metric).toHaveAttribute("data-size", "default")
    expect(classesOf(metric)).toEqual(
      expect.arrayContaining(["flex-col", "gap-2", "pt-3", "shadow-[inset_0_var(--stroke-emphasis)_0_0_var(--text-body)]"])
    )
    expect(classesOf(metric).some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
  })

  it("label and delta are mono caps in label ink; the value is number/metric in body ink", () => {
    render(<Metric label="Skills" value="145" delta="+3 this week" />)
    expect(classesOf(part("metric-label"))).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground"]))
    expect(classesOf(part("metric-value"))).toEqual(expect.arrayContaining(["type-number-metric", "text-foreground"]))
    expect(classesOf(part("metric-delta"))).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground"]))
  })

  it("delta tones: up and down add a named caret and body ink; live takes the live ink", () => {
    const { rerender } = render(<Metric label="Tasks run" value="38" delta="+6 this week" tone="up" />)
    expect(screen.getByRole("img", { name: "Up" })).toHaveAttribute("data-icon-name", "caret--up")
    expect(classesOf(part("metric-delta"))).toContain("text-foreground")
    rerender(<Metric label="Avg per task" value="$1.10" delta="−$0.14" tone="down" />)
    expect(screen.getByRole("img", { name: "Down" })).toHaveAttribute("data-icon-name", "caret--down")
    rerender(<Metric label="Knowledge" value="1,204" delta="+12 today" tone="live" />)
    expect(classesOf(part("metric-delta"))).toContain("text-secondary-live")
    expect(screen.queryByRole("img")).toBeNull()
  })

  it("as a link it is one link named by its text, with the washes of a control", async () => {
    const onClick = vi.fn((event: React.MouseEvent) => event.preventDefault())
    const user = userEvent.setup()
    render(<Metric href="#skills" label="Skills" value="145" delta="+3 this week" onClick={onClick} />)
    const link = screen.getByRole("link", { name: "Skills 145 +3 this week" })
    expect(link).toHaveAttribute("href", "#skills")
    expect(classesOf(link)).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    await user.tab()
    expect(link).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("render makes it a router link", () => {
    render(<Metric render={<a href="/checks" data-router="" />} label="Checks" value="218" />)
    expect(screen.getByRole("link")).toHaveAttribute("data-router")
  })

  it("hero: number/hero with what it is out of, no rule; primary/display when asked", () => {
    render(<Metric size="hero" valueTone="primary" label="Health // personal + family" value="92" unit="/100" />)
    const metric = part("metric")
    expect(metric).toHaveAttribute("data-size", "hero")
    expect(classesOf(metric).some((c) => c.startsWith("shadow-"))).toBe(false)
    expect(classesOf(part("metric-value"))).toEqual(expect.arrayContaining(["type-number-hero", "text-primary-display"]))
    expect(classesOf(part("metric-unit"))).toEqual(expect.arrayContaining(["type-code-display", "text-muted-foreground"]))
    expect(classesOf(part("metric-figure"))).toContain("items-baseline")
  })

  it("hero: the label sits directly on the number's line box and the unit is 24 from the number, as the two drawn heroes space them", () => {
    render(<Metric size="hero" valueTone="primary" label="Health // personal + family" value="92" unit="/100">
      <div role="progressbar" aria-label="92 of 100" />
    </Metric>)
    const root = classesOf(part("metric"))
    expect(root).toContain("gap-0")
    expect(root).not.toContain("gap-2")
    const figure = classesOf(part("metric-figure"))
    expect(figure).toContain("gap-x-6")
    expect(figure).not.toContain("gap-x-4")
    // 16 under the number, with no gap of the stack's own to add to it.
    expect(classesOf(part("metric-extra"))).toContain("pt-4")
  })

  it("hero: the delta is the meta role beside the number, a badge follows it, children sit under it", () => {
    render(
      <Metric size="hero" label="Spend // Friday 11.13" value="$8.60" delta="of $10.00 today" badge={<Badge tone="warning">Near cap</Badge>}>
        <div role="progressbar" aria-label="$8.60 of $10.00 today" />
      </Metric>
    )
    expect(classesOf(part("metric-value"))).toContain("text-foreground")
    expect(classesOf(part("metric-delta"))).toContain("type-meta")
    expect(part("metric-figure").lastElementChild).toHaveAttribute("data-slot", "metric-badge")
    expect(part("metric-extra")).toContainElement(screen.getByRole("progressbar"))
  })
})
