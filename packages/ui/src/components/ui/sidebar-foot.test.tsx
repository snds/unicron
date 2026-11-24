import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { SidebarFoot } from "./sidebar-foot"
import { TooltipProvider } from "./tooltip"

const wrap = (ui: React.ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>)

describe("SidebarFoot (Figma 178:4541)", () => {
  it("draws the status over the rule, then the tile, the name over its fact, and Settings", async () => {
    const onSettings = vi.fn()
    const { container } = wrap(
      <SidebarFoot status={{ icon: "renew", text: "Synced just now" }} account={{ name: "Sean", initials: "S", meta: "$1.20 today" }} settings={{ onClick: onSettings }} />
    )
    expect(screen.getByText("Synced just now").closest('[data-slot="sidebar-foot-status"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="sidebar-foot-account"]')).toHaveClass("rule-t")
    expect(screen.getByText("Sean")).toBeInTheDocument()
    expect(screen.getByText("$1.20 today")).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Settings" }))
    expect(onSettings).toHaveBeenCalledOnce()
  })

  it("fills the whole row while Settings is open, square to the edges, and says so", () => {
    const { container } = wrap(<SidebarFoot account={{ name: "Sean", initials: "S" }} settings={{ onClick: () => {}, current: true }} />)
    expect(container.querySelector('[data-slot="sidebar-foot"]')).toHaveAttribute("data-state", "current")
    expect(container.querySelector('[data-slot="sidebar-foot-account"]')).toHaveClass("bg-surface-selected")
    expect(screen.getByRole("button", { name: "Settings" })).toHaveAttribute("aria-current", "page")
  })

  it("makes the account a link when it goes somewhere, named by its words", () => {
    wrap(<SidebarFoot account={{ name: "Sean", initials: "S", meta: "$1.20 today", href: "/spend", label: "Spend, $1.20 today" }} />)
    expect(screen.getByRole("link", { name: "Spend, $1.20 today" })).toHaveAttribute("href", "/spend")
  })

  it("names an unlabeled account link by its words once, the tile unnamed beside them", () => {
    wrap(<SidebarFoot account={{ name: "Sean", initials: "S", meta: "$1.20 today", href: "/spend" }} />)
    expect(screen.getByRole("link", { name: "Sean $1.20 today" })).toBeInTheDocument()
    expect(screen.queryByRole("img", { name: "Sean" })).toBeNull()
  })

  it("draws the switch chevron only when a press opens something", async () => {
    const onClick = vi.fn()
    const { container, rerender } = wrap(<SidebarFoot account={{ name: "Sean", initials: "S" }} />)
    expect(screen.queryByRole("button")).toBeNull()
    rerender(<TooltipProvider><SidebarFoot account={{ name: "Sean", initials: "S", onClick, label: "Switch account" }} /></TooltipProvider>)
    await userEvent.click(screen.getByRole("button", { name: "Switch account" }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-slot="sidebar-foot-account"] svg')).not.toBeNull()
  })

  it("is the tile alone when collapsed, and the tile opens Settings", () => {
    const onClick = vi.fn()
    wrap(<SidebarFoot collapsed status={{ icon: "renew", text: "Synced" }} account={{ name: "Sean", initials: "S", meta: "$1.20 today" }} settings={{ onClick, current: true }} />)
    expect(screen.queryByText("Synced")).toBeNull()
    const button = screen.getByRole("button", { name: "Settings" })
    expect(button).toContainElement(screen.getByText("S"))
    expect(button).toHaveAttribute("aria-current", "page")
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it("links the rail's tile where the account goes when there is no Settings", () => {
    wrap(<SidebarFoot collapsed account={{ name: "Sean", initials: "S", href: "/spend", label: "Spend" }} />)
    expect(screen.getByRole("link", { name: "Spend" })).toHaveAttribute("href", "/spend")
  })
})
