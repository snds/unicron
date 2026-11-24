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

  // 2.0: every tab is Figma's Pill Tab (15:498). "No underline, no track, no accent, no inverted pill."
  it("is Figma's Pill Tab: 28 tall, a 6px corner, ui in secondary ink, an index in the label ink", () => {
    for (const variant of [undefined, "line"] as const) {
      const { unmount } = render(<Subject variant={variant} />)
      const tab = screen.getByRole("tab", { name: /Characters/ })
      for (const name of ["type-ui", "h-control-s", "rounded", "px-2.25", "py-1", "gap-1.5", "text-text-secondary", "[&_svg:not([class*='size-'])]:size-icon"]) expect(tab.className).toContain(name)
      const index = tab.querySelector('[data-slot="tabs-trigger-index"]')!
      expect(index.className).toContain("type-caption")
      expect(index.className).toContain("text-text-label")
      unmount()
    }
  })

  it("marks the chosen tab with the neutral 8% fill and body ink, never an underline, a track or the accent", () => {
    render(<Subject variant="line" />)
    const list = screen.getByRole("tablist")
    expect(list.className).not.toMatch(/rule-box|p-0\.5/)
    expect(list.querySelector('[data-slot="tabs-indicator"]')).toBeNull()
    const tab = screen.getByRole("tab", { name: /Characters/ })
    for (const name of ["data-active:type-ui-emphasis", "data-active:bg-surface-selected", "data-active:text-text-body", "not-data-active:hover:bg-surface-hover"]) expect(tab.className).toContain(name)
    expect(tab.className).not.toMatch(/after:|bg-primary|bg-foreground|text-background/)
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
    expect(drawn.className).toContain("type-caption")
    expect(drawn.className).toContain("text-text-label")
    expect(screen.getByRole("tab", { name: "Shared, 3 waiting on you" })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "People" }).querySelector('[data-slot="tabs-trigger-mark-words"]')).toBeNull()
  })

  it("keepCase keeps a person's name in its own case (Vale 8)", () => {
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
    expect(ana).toHaveClass("normal-case", "type-ui")
    expect(ana).toHaveAttribute("data-keep-case")
    expect(screen.getByRole("tab", { name: "All" })).not.toHaveClass("normal-case")
  })
})
