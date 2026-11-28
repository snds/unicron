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

  it("on a phone the landing is group cards: each row says its state, a control row flips in place, the foot closes it (2.10)", () => {
    setViewport(390, 844)
    const sections: SettingsSection[] = [
      { value: "models", label: "Models", icon: "machine-learning-model", group: "Agents", detail: "2 connected" },
      { value: "auto", label: "Update automatically", group: "This device", control: <input type="checkbox" aria-label="Update automatically" /> },
      { value: "about", label: "About", group: "Warpcore", mark: { square: true, label: "Update ready" } },
    ]
    function Landing() {
      const [value, setValue] = React.useState<string | null>(null)
      return (
        <AppFrame>
          <AppFrameMain>
            <SettingsFrame sections={sections} value={value} onValueChange={setValue} foot={<button>Sign out</button>}>
              rows
            </SettingsFrame>
          </AppFrameMain>
        </AppFrame>
      )
    }
    render(<Landing />)
    const cards = document.querySelectorAll('[data-slot="settings-landing-group"]')
    expect(cards).toHaveLength(3)
    expect(cards[0]!.className).toEqual(expect.stringContaining("rounded-xl"))
    expect(cards[0]!.className).not.toMatch(/rule-|divide-/)
    expect(screen.getByRole("heading", { level: 2, name: "Agents" })).toHaveClass("type-overline")
    const models = screen.getByRole("button", { name: /^Models/ })
    // The accessible name is the row's visible words, its state included (axe label-content-name-mismatch).
    expect(models).not.toHaveAttribute("aria-label")
    expect(models).toHaveAccessibleName(/Models\s*2 connected/)
    expect(models.querySelector('[data-slot="settings-landing-detail"]')).toHaveTextContent("2 connected")
    expect(screen.getByRole("button", { name: /^About, Update ready$/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Update automatically" })).toBeNull()
    expect(screen.getByRole("checkbox", { name: "Update automatically" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign out" }).closest('[data-slot="settings-landing-foot"]')).not.toBeNull()
    fireEvent.click(models)
    expect(document.querySelector('[data-slot="app-frame-detail"]')).toHaveAttribute("data-pushed")
  })

  it("on a desktop a control row is not a section of the list", () => {
    setViewport(1440, 900)
    render(<Settings sections={[...FEW, { value: "auto", label: "Update automatically", control: <input type="checkbox" aria-label="Update automatically" /> }]} />)
    expect(screen.queryByRole("button", { name: "Update automatically" })).toBeNull()
    expect(screen.queryByRole("checkbox")).toBeNull()
  })

  it("groups a short list once every section names its group (2.12)", () => {
    setViewport(1440, 900)
    render(<Settings sections={FEW.map((s, i) => ({ ...s, group: i ? "Mail" : "You" }))} />)
    expect(screen.getByRole("group", { name: "You" })).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "Mail" })).toBeInTheDocument()
  })

  it("opens an unlisted section by value, with no row for it, on a desktop and a phone (2.12)", () => {
    setViewport(1440, 900)
    const sections: SettingsSection[] = [{ value: "profile", label: "Profile", listed: false }, ...FEW]
    const { unmount } = render(<Settings sections={sections} />)
    // The first listed section shows when none is asked for, not the unlisted one.
    expect(screen.getByRole("heading", { level: 2, name: "Accounts" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull()
    unmount()
    render(<Settings sections={sections} initial="profile" />)
    expect(screen.getByRole("heading", { level: 2, name: "Profile" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull()
    setViewport(390, 844)
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull()
  })
})
