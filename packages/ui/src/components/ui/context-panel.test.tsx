import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { AppFrame, AppFrameColumn, AppFrameMain } from "./app-frame"
import { ContextPanel, type ContextPanelState, type ContextPanelTab } from "./context-panel"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setViewport(1024, 768))

const TABS: ContextPanelTab[] = [
  { value: "tasks", label: "Tasks", icon: "task", count: 3, live: true },
  { value: "artifacts", label: "Artifacts", icon: "code", count: 4 },
  { value: "envs", label: "Envs", icon: "cloud", count: 3 },
  { value: "files", label: "Files", icon: "document", count: 6 },
]

function Workspace({ initial = "open", artifact, sheet, composer }: { initial?: ContextPanelState; artifact?: React.ReactNode; sheet?: React.ReactNode; composer?: React.ReactNode }) {
  const [state, setState] = React.useState<ContextPanelState>(initial)
  const [value, setValue] = React.useState("tasks")
  return (
    <AppFrame>
      <AppFrameMain>
        <AppFrameColumn aria-label="Chat">The conversation</AppFrameColumn>
        <ContextPanel state={state} onStateChange={setState} tabs={TABS} value={value} onValueChange={setValue} artifact={artifact} sheet={sheet} composer={composer}>
          {`The ${value} panel`}
        </ContextPanel>
      </AppFrameMain>
    </AppFrame>
  )
}

describe("ContextPanel", () => {
  it("open: the 2.0 Right Panel, pill tabs with tab semantics, and its panel", () => {
    setViewport(1440, 900)
    render(<Workspace />)
    const panel = screen.getByRole("complementary", { name: "Context" })
    expect(panel).toHaveAttribute("data-state", "open")
    expect(panel).toHaveClass("w-(--c-app-frame-context-panel)", "bg-surface-ground")
    const list = screen.getByRole("tablist", { name: "Context" })
    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((t) => t.textContent)).toEqual(["Tasks 3", "Artifacts 4", "Envs 3", "Files 6"])
    expect(list).toContainElement(tabs[0])
    // One line that scrolls sideways, never wrapping under three-digit counts (Unicron 13).
    expect(list).toHaveClass("flex-nowrap", "overflow-x-auto", "no-scrollbar")
    expect(list).not.toHaveClass("flex-wrap")
    // Active: the Pill Tab's 8% selected fill in body ink (Figma 15:498); one tab stop.
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[0]).toHaveClass("bg-surface-selected", "text-text-body", "type-ui-emphasis", "h-control-s", "rounded")
    expect(tabs[1]).toHaveClass("text-text-secondary", "hover:bg-surface-hover")
    expect(tabs[0]).toHaveAttribute("tabindex", "0")
    expect(tabs[1]).toHaveAttribute("tabindex", "-1")
    const tabpanel = screen.getByRole("tabpanel", { name: "Tasks 3" })
    expect(tabs[0]).toHaveAttribute("aria-controls", tabpanel.id)
    expect(tabpanel).toHaveTextContent("The tasks panel")
  })

  it("moves with the arrow keys, Home and End, and the panel follows", () => {
    setViewport(1440, 900)
    render(<Workspace />)
    const tabs = () => screen.getAllByRole("tab")
    act(() => tabs()[0].focus())
    fireEvent.keyDown(tabs()[0], { key: "ArrowRight" })
    expect(tabs()[1]).toHaveAttribute("aria-selected", "true")
    expect(document.activeElement).toBe(tabs()[1])
    expect(screen.getByRole("tabpanel")).toHaveTextContent("The artifacts panel")
    fireEvent.keyDown(tabs()[1], { key: "End" })
    expect(tabs()[3]).toHaveAttribute("aria-selected", "true")
    fireEvent.keyDown(tabs()[3], { key: "ArrowRight" })
    expect(tabs()[0]).toHaveAttribute("aria-selected", "true")
    fireEvent.keyDown(tabs()[0], { key: "ArrowLeft" })
    expect(tabs()[3]).toHaveAttribute("aria-selected", "true")
    fireEvent.keyDown(tabs()[3], { key: "Home" })
    expect(tabs()[0]).toHaveAttribute("aria-selected", "true")
  })

  it("collapses to a rail of icons and counts, and a rail item opens the panel at its tab", () => {
    setViewport(1440, 900)
    render(<Workspace />)
    fireEvent.click(screen.getByRole("button", { name: "Collapse panel" }))
    const rail = screen.getByRole("complementary", { name: "Context" })
    expect(rail).toHaveAttribute("data-state", "rail")
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    expect(screen.getByRole("toolbar", { name: "Context" })).toBeInTheDocument()
    // A count joins the name; something running is live (Figma's Rail Item "Alert").
    const tasks = screen.getByRole("button", { name: "Tasks, 3, live" })
    expect(tasks).toHaveAttribute("data-state", "live")
    expect(screen.getByRole("button", { name: "Files, 6" })).toHaveAttribute("data-state", "default")
    fireEvent.click(screen.getByRole("button", { name: "Envs, 3" }))
    expect(screen.getByRole("complementary", { name: "Context" })).toHaveAttribute("data-state", "open")
    expect(screen.getByRole("tab", { name: "Envs 3" })).toHaveAttribute("aria-selected", "true")
  })

  it("after a collapse or an expand by its own controls, focus goes to the counterpart, never to the page's body", () => {
    setViewport(1440, 900)
    render(<Workspace />)
    const collapse = screen.getByRole("button", { name: "Collapse panel" })
    act(() => collapse.focus())
    fireEvent.click(collapse)
    // The panel was swapped for its rail: the pressed control is gone. Focus is on Expand.
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Expand panel" }))
    // A rail item opens the panel at its tab, and focus lands on that tab.
    const envs = screen.getByRole("button", { name: "Envs, 3" })
    act(() => envs.focus())
    fireEvent.click(envs)
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Envs 3" }))
    // And Expand itself: the chosen tab again.
    fireEvent.click(screen.getByRole("button", { name: "Collapse panel" }))
    fireEvent.click(screen.getByRole("button", { name: "Expand panel" }))
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Envs 3" }))
  })

  it("a state the app changes by itself moves no focus", () => {
    setViewport(1440, 900)
    function Driven() {
      const [state, setState] = React.useState<ContextPanelState>("open")
      return (
        <AppFrame>
          <AppFrameMain>
            <AppFrameColumn aria-label="Chat">
              <button type="button" onClick={() => setState("rail")}>
                Focus the chat
              </button>
            </AppFrameColumn>
            <ContextPanel state={state} onStateChange={setState} tabs={TABS} value="tasks" onValueChange={() => {}}>
              The tasks panel
            </ContextPanel>
          </AppFrameMain>
        </AppFrame>
      )
    }
    render(<Driven />)
    const chat = screen.getByRole("button", { name: "Focus the chat" })
    act(() => chat.focus())
    fireEvent.click(chat)
    expect(screen.getByRole("complementary", { name: "Context" })).toHaveAttribute("data-state", "rail")
    expect(document.activeElement).toBe(chat)
  })

  it("starts on the columns' line: no space of its own above its head or its rail (Figma cw-01, cw-04)", () => {
    setViewport(1440, 900)
    const { unmount } = render(<Workspace />)
    expect(screen.getByRole("complementary", { name: "Context" }).className).not.toMatch(/(^|\s)pt-/)
    unmount()
    render(<Workspace initial="rail" />)
    expect(screen.getByRole("complementary", { name: "Context" }).className).not.toMatch(/(^|\s)pt-/)
  })

  it("expands from the rail with its own button", () => {
    setViewport(1440, 900)
    render(<Workspace initial="rail" />)
    // Expand is a tile of the rail, the same shape as the tabs under it, and the first stop of its arrow keys.
    const expand = screen.getByRole("button", { name: "Expand panel" })
    expect(expand).toHaveAttribute("data-slot", "rail-item")
    expect(screen.getByRole("toolbar").querySelector('[data-slot="rail-item"]')).toBe(expand)
    fireEvent.click(expand)
    expect(screen.getByRole("complementary", { name: "Context" })).toHaveAttribute("data-state", "open")
  })

  it("hidden: draws nothing, and the conversation takes the room", () => {
    setViewport(1440, 900)
    render(<Workspace initial="hidden" />)
    expect(screen.queryByRole("complementary", { name: "Context" })).not.toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Chat" })).toBeInTheDocument()
  })

  it("gives its place to an artifact open beside the chat", () => {
    setViewport(1440, 900)
    render(<Workspace artifact={<p>Login flow</p>} />)
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()
    const artifact = screen.getByRole("region", { name: "Context" })
    expect(artifact).toHaveTextContent("Login flow")
    expect(artifact.className).toContain("w-[calc(var(--c-app-frame-beside)+--spacing(6))]")
  })

  it.each([
    ["a phone", 390, 844],
    ["medium width", 820, 1180],
  ])("on %s offers the same content as the sheet the app passes", (_, w, h) => {
    setViewport(w, h)
    render(<Workspace sheet={<div role="dialog" aria-label="Context sheet" />} />)
    expect(screen.queryByRole("complementary", { name: "Context" })).not.toBeInTheDocument()
    expect(screen.getByRole("dialog", { name: "Context sheet" })).toBeInTheDocument()
  })

  it("asks for the state; it does not keep it", () => {
    setViewport(1440, 900)
    const onStateChange = vi.fn()
    render(
      <AppFrame>
        <AppFrameMain>
          <ContextPanel state="open" onStateChange={onStateChange} tabs={TABS} value="tasks" onValueChange={() => {}} />
        </AppFrameMain>
      </AppFrame>
    )
    fireEvent.click(screen.getByRole("button", { name: "Collapse panel" }))
    expect(onStateChange).toHaveBeenCalledWith("rail")
    expect(screen.getByRole("complementary", { name: "Context" })).toHaveAttribute("data-state", "open")
  })

  it("docks a composer under the body when the panel can be asked, and draws no dock without one", () => {
    setViewport(1440, 900)
    const { unmount } = render(<Workspace composer={<textarea aria-label="Ask" />} />)
    const panel = screen.getByRole("complementary", { name: "Context" })
    const dock = panel.querySelector('[data-slot="context-panel-dock"]')!
    expect(dock).toContainElement(screen.getByRole("textbox", { name: "Ask" }))
    expect(dock).toHaveClass("px-3", "pt-2", "pb-3")
    expect(panel.lastElementChild).toBe(dock)
    unmount()
    render(<Workspace />)
    expect(document.querySelector('[data-slot="context-panel-dock"]')).toBeNull()
  })
})
