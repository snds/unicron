import { render, screen } from "@testing-library/react"
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

  it("draws the switch chevron only when a press opens something", async () => {
    const onClick = vi.fn()
    const { container, rerender } = wrap(<SidebarFoot account={{ name: "Sean", initials: "S" }} />)
    expect(screen.queryByRole("button")).toBeNull()
    rerender(<TooltipProvider><SidebarFoot account={{ name: "Sean", initials: "S", onClick, label: "Switch account" }} /></TooltipProvider>)
    await userEvent.click(screen.getByRole("button", { name: "Switch account" }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(container.querySelector('[data-slot="sidebar-foot-account"] svg')).not.toBeNull()
  })

  it("is the tile alone when collapsed", () => {
    wrap(<SidebarFoot collapsed status={{ icon: "renew", text: "Synced" }} account={{ name: "Sean", initials: "S", meta: "$1.20 today" }} settings={{ onClick: () => {} }} />)
    expect(screen.queryByText("Synced")).toBeNull()
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull()
    expect(screen.getByText("S")).toBeInTheDocument()
  })
})
