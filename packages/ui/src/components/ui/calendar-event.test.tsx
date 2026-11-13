import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Icon } from "../icon"
import { CalendarEvent, calendarEventVariants } from "./calendar-event"

const classesOf = (el: Element) => el.className.split(/\s+/)
const part = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("CalendarEvent (Figma 32:116)", () => {
  it("is a button named by its time, title and place, in reading order", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<CalendarEvent time="16:30 – 17:15" title="Dentist" place="Sierra Dental, Roseville" onClick={onClick} />)
    const event = screen.getByRole("button", { name: "16:30 – 17:15 Dentist Sierra Dental, Roseville" })
    expect(event).toHaveAttribute("type", "button")
    expect(event).toHaveAttribute("data-slot", "calendar-event")
    await user.tab()
    expect(event).toHaveFocus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("is a link with href", () => {
    render(<CalendarEvent href="#dentist" time="Wed 11.18 // 16:30 – 17:15" title="Dentist" />)
    expect(screen.getByRole("link", { name: "Wed 11.18 // 16:30 – 17:15 Dentist" })).toHaveAttribute("href", "#dentist")
  })

  it("pins the drawn anatomy: no left padding, 8 / 12, 12 gap, the 2px bar inside the padding, no radius", () => {
    const classes = calendarEventVariants({ look: "neutral", compact: false }).split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["gap-3", "py-2", "pr-3", "items-stretch", "text-left"]))
    expect(classes.some((c) => c.startsWith("pl-") || c.startsWith("rounded"))).toBe(false)
    render(<CalendarEvent time="16:30 – 17:15" title="Dentist" place="Sierra Dental, Roseville" />)
    const bar = part("calendar-event-bar")
    expect(bar).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(bar)).toEqual(expect.arrayContaining(["w-0.5", "self-stretch", "bg-line-rule"]))
    expect(classesOf(part("calendar-event-text"))).toEqual(expect.arrayContaining(["flex-col", "gap-0.5"]))
    expect(classesOf(part("calendar-event-time"))).toEqual(expect.arrayContaining(["type-meta", "text-muted-foreground"]))
    expect(classesOf(part("calendar-event-title"))).toEqual(expect.arrayContaining(["type-ui-emphasis", "text-foreground"]))
    expect(classesOf(part("calendar-event-place"))).toEqual(expect.arrayContaining(["type-caption", "text-support-foreground"]))
  })

  it("tones: primary is primary-soft with the primary bar; neutral is raised with a rule bar", () => {
    expect(calendarEventVariants({ look: "primary" }).split(/\s+/)).toContain("bg-primary-soft")
    expect(calendarEventVariants({ look: "neutral" }).split(/\s+/)).toContain("bg-surface-raised")
    render(<CalendarEvent tone="primary" time="13:00 – 13:20" title="Call Pine Hollow about late check-in" />)
    expect(part("calendar-event")).toHaveAttribute("data-tone", "primary")
    expect(classesOf(part("calendar-event-bar"))).toContain("bg-primary-fill")
  })

  it("selected looks like the primary tone and says aria-current", () => {
    render(<CalendarEvent selected time="10:00 – 10:30" title="Unicron design review" />)
    const event = screen.getByRole("button")
    expect(event).toHaveAttribute("aria-current", "true")
    expect(event).toHaveAttribute("data-selected")
    expect(classesOf(event)).toContain("bg-primary-soft")
    expect(classesOf(part("calendar-event-bar"))).toContain("bg-primary-fill")
  })

  it("swatch colours the bar only, never the fill or the text", () => {
    render(<CalendarEvent swatch="03" time="All day" title="Veterans Day" place="US holidays" />)
    expect(classesOf(part("calendar-event-bar"))).toContain("bg-(--swatch-03)")
    expect(classesOf(screen.getByRole("button"))).toContain("bg-surface-raised")
    expect(screen.getByRole("button").innerHTML).not.toMatch(/text-\(--swatch/)
  })

  it("compact: one line, title first, then time; no place; a 44px target on touch", () => {
    render(<CalendarEvent compact time="10:00" title="Warpcore planning" place="Video call" />)
    const event = screen.getByRole("button", { name: "Warpcore planning 10:00" })
    expect(event).toHaveAttribute("data-compact")
    expect(classesOf(event)).toEqual(expect.arrayContaining(["hit-area", "py-0.5", "pr-2", "gap-2"]))
    const text = part("calendar-event-text")
    expect(text.firstElementChild).toHaveAttribute("data-slot", "calendar-event-title")
    expect(classesOf(part("calendar-event-title"))).toContain("truncate")
    expect(part("calendar-event-place")).toBeNull()
  })

  it("a mark sits at the end of the first line and says what it is", () => {
    render(<CalendarEvent time="10:00 – 10:30" title="Unicron design review" mark={<Icon name="video" size="sm" label="Has a call" />} />)
    expect(screen.getByRole("img", { name: "Has a call" })).toBeInTheDocument()
    expect(classesOf(part("calendar-event-mark"))).toContain("ml-auto")
    expect(screen.getByRole("button", { name: /Has a call/ })).toBeInTheDocument()
  })

  it("takes the washes over its fill, and the disabled look", () => {
    const classes = calendarEventVariants().split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["hover:after:bg-state-hover", "active:after:bg-state-pressed", "disabled:opacity-50"]))
    render(<CalendarEvent disabled time="09:00 – 10:30" title="Soccer carpool" />)
    expect(screen.getByRole("button")).toBeDisabled()
  })
})
