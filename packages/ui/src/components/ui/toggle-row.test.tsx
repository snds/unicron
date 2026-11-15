import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Badge } from "./badge"
import { ToggleRow } from "./toggle-row"

const classesOf = (el: Element) => el.className.split(/\s+/)
const row = () => document.querySelector('[data-slot="toggle-row"]') as HTMLElement

describe("ToggleRow (Figma 32:54)", () => {
  it("is one switch, named by the label and described by the description", () => {
    render(<ToggleRow label="Lock after 5 minutes" description="Also locks when the screen sleeps." />)
    expect(screen.getAllByRole("switch")).toHaveLength(1)
    const control = screen.getByRole("switch", { name: "Lock after 5 minutes" })
    expect(control).toHaveAccessibleDescription("Also locks when the screen sleeps.")
    expect(control).toHaveAttribute("aria-checked", "false")
  })

  it("a press anywhere on the row turns it: the label, the description, the switch", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(<ToggleRow label="Lock after 5 minutes" description="Also locks when the screen sleeps." onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch")
    await user.click(screen.getByText("Lock after 5 minutes"))
    expect(control).toHaveAttribute("aria-checked", "true")
    await user.click(control)
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
    // The label is stretched over the row (its ::after covers it), so the padding and the
    // description reach it too.
    const label = screen.getByText("Lock after 5 minutes")
    expect(label.tagName).toBe("LABEL")
    expect(classesOf(label)).toEqual(expect.arrayContaining(["after:absolute", "after:inset-0", "cursor-pointer"]))
    expect(classesOf(row())).toContain("relative")
  })

  it("turns from the keyboard on the switch, the one tab stop", async () => {
    const user = userEvent.setup()
    render(<ToggleRow label="Undo send" defaultChecked />)
    await user.tab()
    const control = screen.getByRole("switch", { name: "Undo send" })
    expect(control).toHaveFocus()
    await user.keyboard(" ")
    expect(control).toHaveAttribute("aria-checked", "false")
    await user.tab()
    expect(document.body).toHaveFocus()
  })

  it("passes the Switch's props through: checked, name, id", async () => {
    const user = userEvent.setup()
    function Controlled() {
      return <ToggleRow id="touch-id" name="touchId" label="Touch ID" checked onCheckedChange={() => {}} />
    }
    render(<Controlled />)
    const control = screen.getByRole("switch", { name: "Touch ID" })
    expect(control).toHaveAttribute("aria-checked", "true")
    expect(document.getElementById("touch-id")).not.toBeNull()
    expect(document.querySelector('input[name="touchId"]')).not.toBeNull()
    await user.click(control)
    expect(control).toHaveAttribute("aria-checked", "true")
  })

  it("pins the drawn look: 12 / 16 rhythm, ui label, caption description, rule on top by default", () => {
    render(<ToggleRow label="Lock after 5 minutes" description="Also locks when the screen sleeps." />)
    expect(classesOf(row())).toEqual(expect.arrayContaining(["flex", "items-center", "gap-4", "py-3", "rule-t"]))
    expect(classesOf(row()).some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
    expect(classesOf(screen.getByText("Lock after 5 minutes"))).toEqual(expect.arrayContaining(["type-ui", "text-foreground"]))
    expect(classesOf(screen.getByText("Also locks when the screen sleeps."))).toEqual(expect.arrayContaining(["type-caption", "text-support-foreground"]))
  })

  it("rule bottom as Figma draws it, both, none; inset adds the 16px sides", () => {
    const { rerender } = render(<ToggleRow label="Lock after 5 minutes" rule="bottom" inset />)
    expect(classesOf(row())).toEqual(expect.arrayContaining(["rule-b", "px-4"]))
    expect(classesOf(row())).not.toContain("rule-t")
    rerender(<ToggleRow label="Lock after 5 minutes" rule="both" />)
    expect(classesOf(row())).toEqual(expect.arrayContaining(["rule-t", "rule-b"]))
    rerender(<ToggleRow label="Lock after 5 minutes" rule="none" />)
    expect(classesOf(row()).some((c) => c.startsWith("rule-"))).toBe(false)
  })

  it("takes the hover and pressed washes as the target, not when disabled", () => {
    const { rerender } = render(<ToggleRow label="Summaries" />)
    expect(classesOf(row())).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    rerender(<ToggleRow label="Summaries" disabled />)
    expect(classesOf(row())).not.toContain("hover:bg-state-hover")
  })

  it("disabled: the switch's own disabled, out of the tab order, the text dimmed", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(<ToggleRow label="Lockdown as passkey provider" disabled onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole("switch")
    expect(control).toHaveAttribute("aria-disabled", "true")
    await user.click(screen.getByText("Lockdown as passkey provider"))
    fireEvent.click(control)
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(row()).toHaveAttribute("data-disabled")
  })

  it("disabledReason: a visible line, the switch focusable, unavailable, described by it, and it does not turn", async () => {
    const onCheckedChange = vi.fn()
    const user = userEvent.setup()
    render(
      <ToggleRow
        label="Quick unlock"
        description="Unlock with Touch ID instead of the master password."
        disabledReason="Turn on Touch ID for this Mac in System Settings first."
        onCheckedChange={onCheckedChange}
      />
    )
    const control = screen.getByRole("switch", { name: "Quick unlock" })
    expect(screen.getByText("Turn on Touch ID for this Mac in System Settings first.")).toHaveAttribute("data-slot", "toggle-row-reason")
    expect(control).toHaveAttribute("aria-disabled", "true")
    expect(control).toHaveAccessibleDescription(
      "Unlock with Touch ID instead of the master password. Turn on Touch ID for this Mac in System Settings first."
    )
    await user.tab()
    expect(control).toHaveFocus()
    await user.keyboard(" ")
    await user.click(screen.getByText("Quick unlock"))
    expect(onCheckedChange).not.toHaveBeenCalled()
    expect(control).toHaveAttribute("aria-checked", "false")
    expect(classesOf(row())).toContain("[&_[data-slot=switch]]:opacity-50")
  })

  it("a badge and the meta slot sit outside the switch's name; the meta slot is above the stretched label", () => {
    render(<ToggleRow label="Let it run when an agent asks" badge={<Badge>Beta</Badge>} meta="Everywhere" />)
    expect(screen.getByRole("switch", { name: "Let it run when an agent asks" })).toBeInTheDocument()
    const meta = document.querySelector('[data-slot="toggle-row-meta"]') as HTMLElement
    expect(meta).toHaveTextContent("Everywhere")
    expect(classesOf(meta)).toEqual(expect.arrayContaining(["relative", "type-overline", "text-muted-foreground"]))
  })
})
