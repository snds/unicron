import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AppFrame, AppFrameMain } from "./app-frame"
import { Input } from "./input"
import { SettingsFrame, type SettingsSection } from "./settings-frame"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setViewport(1024, 768))

const FEW: SettingsSection[] = [
  { value: "accounts", label: "Accounts", icon: "user--avatar", description: "Where your mail comes from." },
  { value: "mail", label: "Mail", icon: "email", description: "Summaries, undo send and who notifies you." },
  { value: "calendar", label: "Calendar", icon: "calendar" },
]

const MANY: SettingsSection[] = [
  { value: "profile", label: "Profile", group: "You" },
  { value: "personas", label: "Personas", group: "You" },
  { value: "agents", label: "Agents", group: "You" },
  { value: "workspace", label: "Workspace", group: "Workspace" },
  { value: "rules", label: "Rules", group: "Workspace" },
  { value: "harnesses", label: "Harnesses", group: "Workspace" },
  { value: "appearance", label: "Appearance", group: "This Mac" },
  { value: "device", label: "Device and security", group: "This Mac" },
  { value: "shortcuts", label: "Shortcuts and gestures", group: "This Mac" },
  { value: "about", label: "About", group: "About", mark: { square: true, label: "Update ready" } },
]

function Settings({ sections = FEW, initial = null }: { sections?: SettingsSection[]; initial?: string | null }) {
  const [value, setValue] = React.useState<string | null>(initial)
  return (
    <AppFrame>
      <AppFrameMain>
        <SettingsFrame
          sections={sections}
          value={value}
          onValueChange={setValue}
          search={<Input aria-label="Find a setting" />}
          overview={<p>Accounts 02</p>}
        >
          {`Rows of ${value ?? "the first section"}`}
        </SettingsFrame>
      </AppFrameMain>
    </AppFrame>
  )
}

describe("SettingsFrame (decisions §5)", () => {
  it("puts the section list beside one content column on a desktop, the first section open", () => {
    setViewport(1440, 900)
    render(<Settings />)
    const nav = screen.getByRole("navigation", { name: "Settings sections" })
    expect(nav.className).toContain("w-(--c-app-frame-settings-list)")
    expect(screen.getByRole("button", { name: "Accounts" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("heading", { level: 2, name: "Accounts" })).toBeInTheDocument()
    expect(screen.getByText("Where your mail comes from.")).toHaveClass("type-body")
    expect(screen.getByText("Rows of the first section").closest('[data-slot="settings-frame-content"]')!.className).toContain("max-w-(--c-app-frame-reading)")
    fireEvent.click(screen.getByRole("button", { name: "Mail" }))
    expect(screen.getByRole("button", { name: "Mail" })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("heading", { level: 2, name: "Mail" })).toBeInTheDocument()
    // The phone's overview rows are a phone's only.
    expect(screen.queryByText("Accounts 02")).not.toBeInTheDocument()
  })

  it("groups the sections under overlines past seven, and offers Find a setting from ten", () => {
    setViewport(1440, 900)
    const { rerender } = render(<Settings />)
    expect(screen.queryByRole("group")).not.toBeInTheDocument()
    expect(screen.queryByRole("textbox", { name: "Find a setting" })).not.toBeInTheDocument()
    rerender(<Settings sections={MANY} />)
    expect(screen.getAllByRole("group").map((g) => g.getAttribute("aria-labelledby") && g.textContent?.split(/(?=[A-Z])/)[0])).toHaveLength(4)
    expect(screen.getByRole("group", { name: "This Mac" })).toBeInTheDocument()
    expect(screen.getByRole("textbox", { name: "Find a setting" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "About, Update ready" })).toBeInTheDocument()
  })

  it("on a phone shows the drawn rows first, then every section; a section pushes and comes back", () => {
    setViewport(390, 844)
    render(<Settings />)
    expect(screen.getByText("Accounts 02")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Accounts" })).not.toHaveAttribute("aria-current")
    expect(document.querySelector('[data-slot="app-frame-detail"]')).not.toHaveAttribute("data-shown")
    fireEvent.click(screen.getByRole("button", { name: "Mail" }))
    expect(document.querySelector('[data-slot="app-frame-detail"]')).toHaveAttribute("data-pushed")
    expect(document.querySelector('[data-slot="app-frame-list"]')).toHaveAttribute("inert")
    expect(screen.getByRole("heading", { level: 2, name: "Mail" })).toBeInTheDocument()
  })
})
