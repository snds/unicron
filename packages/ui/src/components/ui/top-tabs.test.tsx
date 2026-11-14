import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { TopTab, TopTabs } from "./top-tabs"

const classesOf = (el: Element) => el.className.split(/\s+/)

function Warpcore() {
  return (
    <TopTabs label="Sections">
      <TopTab href="/chat" index="01" label="Chat" icon="chat" />
      <TopTab href="/docs" index="02" label="Docs" icon="document" />
      <TopTab href="/tasks" index="03" label="Tasks" icon="task" current mark={{ count: 1, tone: "needs-you" }} />
    </TopTabs>
  )
}

describe("TopTabs and TopTab (Figma 15:498)", () => {
  it("is a named nav of links; the current one says aria-current=page", () => {
    render(<Warpcore />)
    const nav = screen.getByRole("navigation", { name: "Sections" })
    expect(nav).toHaveAttribute("data-slot", "top-tabs")
    expect(within(nav).getAllByRole("link")).toHaveLength(3)
    expect(screen.getByRole("link", { name: "Tasks, 1 waiting on you" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: "Chat" })).not.toHaveAttribute("aria-current")
  })

  it("the name is the label (and the mark), not the index", () => {
    render(<Warpcore />)
    const chat = screen.getByRole("link", { name: "Chat" })
    expect(within(chat).getByText("01")).toHaveAttribute("aria-hidden", "true")
  })

  it("draws index, label and a 16px icon in the overline role, 6px apart, over a 2px indicator 6px down", () => {
    render(<Warpcore />)
    const chat = screen.getByRole("link", { name: "Chat" })
    const label = chat.querySelector('[data-slot="top-tab-label"]')!
    const index = chat.querySelector('[data-slot="top-tab-index"]')!
    expect(classesOf(label)).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
    expect(classesOf(index)).toEqual(expect.arrayContaining(["type-overline", "text-text-faint"]))
    expect(chat.querySelector('[data-slot="icon"]')).toHaveAttribute("width", "16")
    expect(classesOf(label.parentElement!)).toEqual(expect.arrayContaining(["gap-1.5"]))
    expect(classesOf(label.parentElement!.parentElement!)).toEqual(expect.arrayContaining(["flex-col", "gap-1.5"]))
    const indicator = chat.querySelector('[data-slot="top-tab-indicator"]')!
    expect(classesOf(indicator)).toEqual(expect.arrayContaining(["h-(--stroke-emphasis)", "w-full", "bg-transparent"]))
  })

  it("current: body ink and the 2px primary indicator, no radius on it", () => {
    render(<Warpcore />)
    const tasks = screen.getByRole("link", { name: "Tasks, 1 waiting on you" })
    expect(tasks.querySelector('[data-slot="top-tab-label"]')!.className).toContain("text-text-body")
    const indicator = tasks.querySelector('[data-slot="top-tab-indicator"]')!
    expect(indicator.className).toContain("bg-primary-fill")
    expect(indicator.className).not.toMatch(/rounded/)
    expect(tasks.querySelector('[data-slot="nav-mark"]')!.className).toContain("bg-needs-you-fill")
  })

  it("a 48px hit area from 12px of padding on every side; the contract's washes under hover and press", () => {
    render(<Warpcore />)
    const chat = screen.getByRole("link", { name: "Chat" })
    expect(classesOf(chat)).toEqual(expect.arrayContaining(["px-3", "py-3", "hover:bg-state-hover", "active:bg-state-pressed", "rounded-sm"]))
    // 12 + 4 + 12: the drawn tabs sit 28px apart, as the Warpcore desktop frames draw them (not 32).
    expect(classesOf(screen.getByRole("navigation"))).toContain("gap-1")
    expect(classesOf(screen.getByRole("navigation"))).not.toContain("gap-2")
  })

  it("the index and the icon are optional; Tab moves along the links", async () => {
    const user = userEvent.setup()
    render(
      <TopTabs label="Sections">
        <TopTab href="/a" label="Overview" />
        <TopTab href="/b" label="Skills" current />
      </TopTabs>
    )
    await user.tab()
    expect(screen.getByRole("link", { name: "Overview" })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole("link", { name: "Skills" })).toHaveFocus()
    expect(screen.getByRole("link", { name: "Overview" }).querySelector('[data-slot="icon"]')).toBeNull()
  })

  it("takes a router link as render", () => {
    render(<TopTab render={<a href="/spend" data-router="" />} label="Spend" />)
    expect(screen.getByRole("link", { name: "Spend" })).toHaveAttribute("data-router")
  })
})
