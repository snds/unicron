import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { TooltipProvider } from "./tooltip"
import { TitleRow } from "./title-row"

const wrap = (ui: React.ReactElement) => render(<TooltipProvider>{ui}</TooltipProvider>)

describe("TitleRow (Figma 192:589)", () => {
  it("is 48 tall over a hairline, with the breadcrumb: a parent link, a chevron, the current page", () => {
    const { container } = wrap(<TitleRow parent={{ label: "Projects", href: "/projects" }} current="Warpcore" />)
    const header = container.querySelector('[data-slot="title-row"]')!
    expect(header.className).toContain("h-12")
    expect(header.className).toContain("rule-b")
    const nav = screen.getByRole("navigation", { name: "Breadcrumb" })
    expect(nav).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute("href", "/projects")
    expect(screen.getByText("Warpcore")).toHaveAttribute("aria-current", "page")
    expect(container.querySelector('[data-slot="title-row-rule"]')).toBeNull()
  })

  it("draws the Settings label with a rule, and the parent is a marker, not a link", () => {
    const { container } = wrap(<TitleRow kind="settings" parent={{ label: "Settings", href: "/settings" }} current="Accounts" />)
    expect(container.querySelector('[data-slot="title-row-rule"]')).not.toBeNull()
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.getByText("Settings").tagName).toBe("SPAN")
  })

  it("leaves room for the window buttons only when asked", () => {
    const { container, rerender } = wrap(<TitleRow current="Home" />)
    expect(container.querySelector('[data-slot="title-row-window-buttons"]')).toBeNull()
    rerender(<TooltipProvider><TitleRow current="Home" windowButtons /></TooltipProvider>)
    expect(container.querySelector('[data-slot="title-row-window-buttons"]')).not.toBeNull()
  })

  it("toggles the sidebar and the panel, says pressed, and carries ⌘. and the needs-you dot", async () => {
    const onSidebar = vi.fn()
    const onPanel = vi.fn()
    wrap(
      <TitleRow
        current="Home"
        sidebarToggle={{ label: "Hide sidebar", onClick: onSidebar, pressed: true }}
        panelToggle={{ label: "Hide panel", onClick: onPanel, pressed: false, needsYou: true }}
      />,
    )
    const sidebar = screen.getByRole("button", { name: "Hide sidebar" })
    expect(sidebar).toHaveAttribute("aria-pressed", "true")
    await userEvent.click(sidebar)
    expect(onSidebar).toHaveBeenCalled()
    const panel = screen.getByRole("button", { name: /Hide panel/ })
    expect(panel).toHaveAttribute("aria-keyshortcuts", "Meta+Period")
    expect(panel).toHaveAttribute("aria-pressed", "false")
    expect(panel.querySelector('[data-kind="attention"]')).not.toBeNull()
    await userEvent.click(panel)
    expect(onPanel).toHaveBeenCalled()
  })
})
