import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"

function Subject({ variant }: { variant?: "default" | "line" }) {
  return (
    <Tabs defaultValue="characters">
      <TabsList variant={variant} aria-label="Kind">
        <TabsTrigger value="characters" index="01">
          Characters
        </TabsTrigger>
        <TabsTrigger value="words" index="02">
          Words
        </TabsTrigger>
      </TabsList>
      <TabsContent value="characters">Length 20</TabsContent>
      <TabsContent value="words">Words 5</TabsContent>
    </Tabs>
  )
}

describe("Tabs", () => {
  it("are tabs, named, with their index read as part of the name", () => {
    render(<Subject variant="line" />)
    expect(screen.getByRole("tablist", { name: "Kind" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "01Characters" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Length 20")
  })

  it("the arrow keys move between tabs; Enter shows the tab's panel", async () => {
    render(<Subject variant="line" />)
    screen.getByRole("tab", { name: /Characters/ }).focus()
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: /Words/ })).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    expect(screen.getByRole("tab", { name: /Words/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Words 5")
  })

  // Figma 15:498 "Top Tab": overline labels in the label ink, ink once chosen, a 2px primary-fill
  // indicator under the chosen one. The index is read as part of the name, so it is the label ink,
  // not the faint ink (Unicron 25: text-faint is for disabled controls and decoration only).
  it("line is Figma's Top Tab: overline, a 2px primary indicator, an index in the label ink", () => {
    render(<Subject variant="line" />)
    const tab = screen.getByRole("tab", { name: /Characters/ })
    for (const name of ["type-overline", "text-muted-foreground", "data-active:text-foreground", "after:bg-primary-mark", "group-data-horizontal/tabs:after:h-0.5", "group-data-[variant=line]/tabs-list:data-active:after:opacity-100"]) expect(tab.className).toContain(name)
    expect(tab.querySelector('[data-slot="tabs-trigger-index"]')!.className).toContain("text-text-label")
    expect(tab.querySelector('[data-slot="tabs-trigger-index"]')!.className).not.toMatch(/faint/)
  })

  // The default is a square segmented control: a hairline box, the chosen segment in inverted ink.
  it("default is a square segmented control; the chosen segment is inverted ink", () => {
    render(<Subject />)
    const list = screen.getByRole("tablist")
    for (const name of ["rule-box", "rounded-lg", "p-0.5"]) expect(list.className).toContain(name)
    const tab = screen.getByRole("tab", { name: /Characters/ })
    expect(tab.className).toContain("group-data-[variant=default]/tabs-list:data-active:bg-foreground")
    expect(tab.className).toContain("group-data-[variant=default]/tabs-list:data-active:text-background")
    expect(tab.className).not.toMatch(/bg-primary(\s|$)/)
  })

  it("a tab under 44px takes the 44px touch target", () => {
    render(<Subject variant="line" />)
    expect(screen.getByRole("tab", { name: /Characters/ }).className).toContain("hit-area")
  })

  it("takes the stylesheet's one focus ring (no outline-none, no ring of its own)", () => {
    render(<Subject />)
    const tab = screen.getByRole("tab", { name: /Characters/ })
    expect(tab.className).not.toContain("outline-none")
    expect(tab.className).not.toMatch(/focus-visible:ring/)
  })

  it("a count is drawn after the label and said in the tab's name, never hidden (Lockdown 30)", () => {
    render(
      <Tabs defaultValue="requests">
        <TabsList variant="line" aria-label="Sharing">
          <TabsTrigger value="requests" mark={2}>
            Requests
          </TabsTrigger>
          <TabsTrigger value="shared" mark={{ count: 3, tone: "needs-you" }}>
            Shared
          </TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    const requests = screen.getByRole("tab", { name: "Requests, 2" })
    const drawn = requests.querySelector('[data-slot="nav-mark"]')!
    expect(drawn).toHaveTextContent("02")
    expect(drawn.className).toContain("type-overline")
    // The count takes the tab's own ink, so it reads on a chosen (inverted) segment too.
    expect(drawn.className).toContain("text-inherit")
    expect(screen.getByRole("tab", { name: "Shared, 3 waiting on you" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "People" }).querySelector('[data-slot="tabs-trigger-mark-words"]')).toBeNull()
  })

  it("keepCase keeps a person's name in its own case; other tabs keep the capitals (Vale 8)", () => {
    render(
      <Tabs defaultValue="ana">
        <TabsList aria-label="Team">
          <TabsTrigger value="ana" keepCase>
            Ana McKay
          </TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
    )
    const ana = screen.getByRole("tab", { name: "Ana McKay" })
    expect(ana).toHaveClass("normal-case", "type-overline")
    expect(ana).toHaveAttribute("data-keep-case")
    expect(screen.getByRole("tab", { name: "All" })).not.toHaveClass("normal-case")
  })
})
