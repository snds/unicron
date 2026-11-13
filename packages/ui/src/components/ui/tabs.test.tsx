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
  // indicator under the chosen one, the index in the faint ink.
  it("line is Figma's Top Tab: overline, a 2px primary indicator, a faint index", () => {
    render(<Subject variant="line" />)
    const tab = screen.getByRole("tab", { name: /Characters/ })
    for (const name of ["type-overline", "text-muted-foreground", "data-active:text-foreground", "after:bg-primary-fill", "group-data-horizontal/tabs:after:h-0.5", "group-data-[variant=line]/tabs-list:data-active:after:opacity-100"]) expect(tab.className).toContain(name)
    expect(tab.querySelector('[data-slot="tabs-trigger-index"]')!.className).toContain("text-faint-foreground")
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

  it("takes the stylesheet's one focus ring (no outline-none, no ring of its own)", () => {
    render(<Subject />)
    const tab = screen.getByRole("tab", { name: /Characters/ })
    expect(tab.className).not.toContain("outline-none")
    expect(tab.className).not.toMatch(/focus-visible:ring/)
  })
})
