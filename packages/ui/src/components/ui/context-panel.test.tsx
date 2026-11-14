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

function Workspace({ initial = "open", artifact, sheet }: { initial?: ContextPanelState; artifact?: React.ReactNode; sheet?: React.ReactNode }) {
  const [state, setState] = React.useState<ContextPanelState>(initial)
  const [value, setValue] = React.useState("tasks")
  return (
    <AppFrame>
      <AppFrameMain>
        <AppFrameColumn aria-label="Chat">The conversation</AppFrameColumn>
        <ContextPanel state={state} onStateChange={setState} tabs={TABS} value={value} onValueChange={setValue} artifact={artifact} sheet={sheet}>
          {`The ${value} panel`}
        </ContextPanel>
      </AppFrameMain>
    </AppFrame>
  )
}

describe("ContextPanel", () => {
  it("open: a tab strip with tab semantics, drawn as Filter Chips, and its panel", () => {
    setViewport(1440, 900)
    render(<Workspace />)
    const panel = screen.getByRole("complementary", { name: "Context" })
    expect(panel).toHaveAttribute("data-state", "open")
    expect(panel.className).toContain("w-[calc(var(--c-app-frame-context-panel)+--spacing(3))]")
    const list = screen.getByRole("tablist", { name: "Context" })
    const tabs = screen.getAllByRole("tab")
    expect(tabs.map((t) => t.textContent)).toEqual(["Tasks 03", "Artifacts 04", "Envs 03", "Files 06"])
    expect(list).toContainElement(tabs[0])
    // Active: inverted ink, square, the overline role (Figma 15:503); one tab stop.
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
    expect(tabs[0]).toHaveClass("bg-text-body", "text-surface-ground", "type-overline", "h-6")
    expect(tabs[0]).not.toHaveClass("rounded-sm")
    expect(tabs[0]).toHaveAttribute("tabindex", "0")
    expect(tabs[1]).toHaveAttribute("tabindex", "-1")
    const tabpanel = screen.getByRole("tabpanel", { name: "Tasks 03" })
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
    expect(screen.getByRole("tab", { name: "Envs 03" })).toHaveAttribute("aria-selected", "true")
  })

  it("expands from the rail with its own button", () => {
    setViewport(1440, 900)
    render(<Workspace initial="rail" />)
    fireEvent.click(screen.getByRole("button", { name: "Expand panel" }))
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
})
