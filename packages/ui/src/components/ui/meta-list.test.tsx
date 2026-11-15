import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { MetaItem, MetaList } from "./meta-list"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("MetaList, MetaItem (the Vale message head)", () => {
  function Head() {
    return (
      <MetaList aria-label="Message details">
        <MetaItem label="From">Mira Chen</MetaItem>
        <MetaItem label="Received">09:14</MetaItem>
        <MetaItem label="Attached">01</MetaItem>
      </MetaList>
    )
  }

  it("is a description list: each label a term, each value its definition", () => {
    render(<Head />)
    const list = screen.getByLabelText("Message details")
    expect(list.tagName).toBe("DL")
    expect(within(list).getAllByRole("term").map((t) => t.textContent)).toEqual(["From", "Received", "Attached"])
    expect(within(list).getAllByRole("definition").map((d) => d.textContent)).toEqual(["Mira Chen", "09:14", "01"])
    // Each term is followed by its own value, in one group.
    for (const item of list.querySelectorAll('[data-slot="meta-item"]')) {
      expect(item.firstElementChild?.tagName).toBe("DT")
      expect(item.lastElementChild?.tagName).toBe("DD")
    }
  })

  it("lays the items out in columns that wrap, 32 apart, 16 between lines", () => {
    render(<Head />)
    expect(classesOf(screen.getByLabelText("Message details"))).toEqual(expect.arrayContaining(["flex", "flex-wrap", "gap-x-8", "gap-y-4"]))
  })

  it("sets a mono caps label 4px over the value, in the meta role and body ink", () => {
    render(<Head />)
    const item = screen.getByText("From").parentElement as HTMLElement
    expect(classesOf(item)).toEqual(expect.arrayContaining(["flex-col", "gap-1"]))
    expect(classesOf(screen.getByText("From"))).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground"]))
    expect(classesOf(screen.getByText("Mira Chen"))).toEqual(expect.arrayContaining(["type-meta", "text-foreground"]))
  })
})
