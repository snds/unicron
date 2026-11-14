import { fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdaptiveMenuItem } from "./adaptive"
import { Badge } from "./badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu"
import { FieldRow, FieldRowAction, FieldRowValue, fieldRowVariants, useFieldRow } from "./field-row"
import { Kbd } from "./kbd"

const classesOf = (el: Element) => el.className.split(/\s+/)
const slot = (root: Element, name: string) => root.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("FieldRow (Figma 15:512)", () => {
  it("is a group named by its label, the value beside it in mono", () => {
    render(<FieldRow label="Username">kestrel.04</FieldRow>)
    const row = screen.getByRole("group", { name: "Username" })
    expect(row).toHaveAttribute("data-slot", "field-row")
    expect(row).toHaveAttribute("data-size", "default")
    expect(within(row).getByText("Username")).toHaveAttribute("data-slot", "field-row-label")
    expect(row).toHaveTextContent("kestrel.04")
    expect(classesOf(slot(row, "field-row-value-line"))).toEqual(expect.arrayContaining(["type-code-inline", "text-foreground"]))
  })

  it("pins the drawn sizes: 52 default, 64 display and stacked, no side padding, a top rule", () => {
    const at = (size: "default" | "display" | "stacked") => fieldRowVariants({ size }).split(/\s+/)
    expect(at("default")).toEqual(expect.arrayContaining(["items-baseline", "py-4", "gap-x-4", "flex-wrap"]))
    expect(at("display")).toEqual(expect.arrayContaining(["items-baseline", "py-3"]))
    expect(at("stacked")).toEqual(expect.arrayContaining(["items-center", "py-3"]))
    for (const size of ["default", "display", "stacked"] as const) expect(at(size).some((c) => /^p[xlr]-/.test(c))).toBe(false)
    render(<FieldRow label="Username">kestrel.04</FieldRow>)
    const row = screen.getByRole("group")
    expect(classesOf(row)).toContain("rule-t")
    // A stroke never adds height: the rule is an inset shadow, never a border.
    expect(classesOf(row).some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
  })

  it("holds the label in the 140px knob column, except stacked, where it sits above the value", () => {
    const { rerender } = render(<FieldRow label="Username">kestrel.04</FieldRow>)
    expect(classesOf(slot(document.body, "field-row-label"))).toEqual(
      expect.arrayContaining(["type-overline", "text-muted-foreground", "w-(--c-field-row-label-width)", "shrink-0"])
    )
    rerender(
      <FieldRow size="stacked" label="Username">
        kestrel.04
      </FieldRow>
    )
    const body = slot(document.body, "field-row-body")
    expect(body.firstElementChild).toHaveAttribute("data-slot", "field-row-label")
    expect(classesOf(body)).toEqual(expect.arrayContaining(["flex-col", "gap-1"]))
    expect(classesOf(slot(document.body, "field-row-label"))).not.toContain("w-(--c-field-row-label-width)")
  })

  it("display sets the value in code/display and its action in the live ink, as drawn", () => {
    render(
      <FieldRow size="display" label="Steam Guard" action={<FieldRowAction>Copy</FieldRowAction>}>
        R7K2N
      </FieldRow>
    )
    expect(classesOf(slot(document.body, "field-row-value-line"))).toContain("type-code-display")
    const action = slot(document.body, "field-row-action")
    expect(action).toHaveAttribute("data-tone", "live")
    expect(classesOf(action)).toContain("data-[tone=live]:[&>[data-slot=button]]:text-secondary-live")
  })

  it("rule moves to the bottom, both sides or none; inset adds the 16px of a phone row", () => {
    const { rerender } = render(
      <FieldRow label="Username" rule="bottom" inset>
        kestrel.04
      </FieldRow>
    )
    expect(classesOf(screen.getByRole("group"))).toEqual(expect.arrayContaining(["rule-b", "px-4"]))
    expect(classesOf(screen.getByRole("group"))).not.toContain("rule-t")
    rerender(
      <FieldRow label="Username" rule="both">
        kestrel.04
      </FieldRow>
    )
    expect(classesOf(screen.getByRole("group"))).toEqual(expect.arrayContaining(["rule-t", "rule-b"]))
    rerender(
      <FieldRow label="Username" rule="none">
        kestrel.04
      </FieldRow>
    )
    expect(classesOf(screen.getByRole("group")).some((c) => c.startsWith("rule-"))).toBe(false)
  })

  it("on a narrow row the meta and the actions move under the value together, at the right", () => {
    render(
      <FieldRow label="Quiet hours" meta="Only on this device" action={<FieldRowAction>Change</FieldRowAction>}>
        22:00 – 07:00
      </FieldRow>
    )
    const trailing = slot(document.body, "field-row-trailing")
    expect(classesOf(trailing)).toEqual(expect.arrayContaining(["ml-auto", "shrink-0"]))
    expect(trailing.children[0]).toHaveAttribute("data-slot", "field-row-meta")
    expect(trailing.children[1]).toHaveAttribute("data-slot", "field-row-actions")
    // The wrap is decided against 6rem of value, then the value takes what is left.
    expect(classesOf(slot(document.body, "field-row-body"))).toEqual(expect.arrayContaining(["basis-24", "grow", "min-w-0"]))
  })

  it("cuts a long value in the middle and keeps every character in the DOM", () => {
    render(<FieldRow label="Address">mira.chen.cabin-bookings@fastmail.com</FieldRow>)
    const value = slot(document.body, "field-row-value")
    expect(value).toHaveAttribute("data-truncate", "middle")
    // The end never paints over what is beside the value, however narrow it gets.
    expect(classesOf(value)).toContain("overflow-hidden")
    expect(value).toHaveTextContent("mira.chen.cabin-bookings@fastmail.com")
    const [head, tail] = Array.from(value.children)
    // The head shrinks with an ellipsis; the end never does. Neither wraps.
    expect(classesOf(head)).toEqual(expect.arrayContaining(["min-w-0", "overflow-hidden", "text-ellipsis", "whitespace-pre"]))
    expect(classesOf(tail)).toEqual(expect.arrayContaining(["shrink-0", "whitespace-pre"]))
    expect(tail.textContent).toBe("fastmail.com")
  })

  it("FieldRowValue keeps the end you ask for, or cuts the end, or wraps between words only", () => {
    const { rerender } = render(<FieldRowValue keepEnd={7}>store.steampowered.com</FieldRowValue>)
    expect(slot(document.body, "field-row-value").lastElementChild?.textContent).toBe("red.com")
    rerender(<FieldRowValue truncate="end">store.steampowered.com</FieldRowValue>)
    expect(classesOf(slot(document.body, "field-row-value"))).toContain("truncate")
    rerender(<FieldRowValue truncate="wrap">People I know</FieldRowValue>)
    const wrap = classesOf(slot(document.body, "field-row-value"))
    expect(wrap).toContain("break-normal")
    expect(wrap).not.toContain("break-all")
  })

  it("places a control in the value slot as it is, and lets it name itself by the row's label", () => {
    function Chips() {
      const row = useFieldRow()
      return <div role="radiogroup" aria-labelledby={row?.labelId} />
    }
    render(
      <FieldRow label="Theme">
        <Chips />
      </FieldRow>
    )
    expect(screen.getByRole("radiogroup", { name: "Theme" })).toBeInTheDocument()
    expect(slot(document.body, "field-row-value")).toBeNull()
  })

  it("a badge follows the value; a description is a caption that describes the row", () => {
    render(
      <FieldRow label="Your calendar" badge={<Badge tone="warning">Clash</Badge>} description="And 1 more at the same time.">
        Dentist 16:00–16:45
      </FieldRow>
    )
    const line = slot(document.body, "field-row-value-line")
    expect(line.lastElementChild).toHaveAttribute("data-slot", "field-row-badge")
    expect(within(line).getByText("Clash")).toBeInTheDocument()
    expect(screen.getByRole("group")).toHaveAccessibleDescription("And 1 more at the same time.")
    expect(classesOf(slot(document.body, "field-row-description"))).toEqual(expect.arrayContaining(["type-caption", "text-support-foreground"]))
  })

  it("a Kbd in the label keeps its case", () => {
    render(
      <FieldRow label={<>Quick access <Kbd>⌘K</Kbd></>}>Items, places and Lock, by name</FieldRow>
    )
    expect(classesOf(slot(document.body, "field-row-label"))).toContain("[&_[data-slot=kbd]]:normal-case")
    expect(screen.getByText("⌘K")).toHaveAttribute("data-slot", "kbd")
  })
})

describe("FieldRowAction", () => {
  it("is a ghost Button, size S, named by its word and described by the row's label", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <FieldRow label="Username" action={<FieldRowAction onClick={onClick}>Copy</FieldRowAction>}>
        kestrel.04
      </FieldRow>
    )
    const copy = screen.getByRole("button", { name: "Copy" })
    expect(copy).toHaveAttribute("data-variant", "ghost")
    expect(copy).toHaveAttribute("data-size", "sm")
    expect(copy).toHaveAccessibleDescription("Username")
    await user.click(copy)
    expect(onClick).toHaveBeenCalledTimes(1)
    await user.keyboard("{Enter}")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("does not make the row taller, and lines its word up with the row's right edge", () => {
    render(
      <FieldRow label="Website" action={<><FieldRowAction>Open</FieldRowAction><FieldRowAction>Copy</FieldRowAction></>}>
        store.steampowered.com
      </FieldRow>
    )
    const actions = document.querySelectorAll('[data-slot="field-row-action"]')
    expect(actions).toHaveLength(2)
    for (const action of actions) expect(classesOf(action)).toEqual(expect.arrayContaining(["-my-2", "last:-mr-3"]))
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Open", "Copy"])
  })

  it("an outlined button keeps its edge inside the row", () => {
    render(<FieldRowAction variant="secondary">Change</FieldRowAction>)
    expect(classesOf(slot(document.body, "field-row-action"))).not.toContain("last:-mr-3")
  })

  it("is the trigger of a menu", async () => {
    const user = userEvent.setup()
    render(
      <FieldRow
        label="Auto-lock"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger render={<FieldRowAction>Change</FieldRowAction>} />
            <DropdownMenuContent>
              <DropdownMenuItem>After 1 minute</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
        After 5 minutes
      </FieldRow>
    )
    const change = screen.getByRole("button", { name: "Change" })
    expect(change).toHaveAttribute("aria-haspopup", "menu")
    await user.click(change)
    expect(await screen.findByRole("menuitem", { name: "After 1 minute" })).toBeInTheDocument()
  })

  it("with href it is a link drawn as the same ghost button", () => {
    render(
      <FieldRow label="Website" action={<FieldRowAction href="https://store.steampowered.com">Open</FieldRowAction>}>
        store.steampowered.com
      </FieldRow>
    )
    const open = screen.getByRole("link", { name: "Open" })
    expect(open).toHaveAttribute("href", "https://store.steampowered.com")
    expect(open).toHaveAttribute("data-variant", "ghost")
    expect(classesOf(open)).toEqual(expect.arrayContaining(["type-overline", "h-8", "hover:bg-state-hover"]))
    expect(open).toHaveAccessibleDescription("Website")
  })
})

describe("FieldRow disabledReason (contract 5.1b #37)", () => {
  it("shows the reason, keeps the action focusable, disabled, and described by the reason", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(
      <FieldRow label="Sharing link" disabledReason="Needs the server. You're offline." action={<FieldRowAction onClick={onClick}>Copy</FieldRowAction>}>
        lockdown.app/s/7Hq2
      </FieldRow>
    )
    expect(screen.getByText("Needs the server. You're offline.")).toHaveAttribute("data-slot", "field-row-reason")
    const copy = screen.getByRole("button", { name: "Copy" })
    expect(copy).toHaveAttribute("aria-disabled", "true")
    expect(copy).toHaveAccessibleDescription("Needs the server. You're offline. Sharing link")
    await user.tab()
    expect(copy).toHaveFocus()
    fireEvent.click(copy)
    await user.keyboard("{Enter}")
    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole("group")).toHaveAttribute("data-disabled")
  })
})

describe("FieldRow menu: the trailing overflow button (contract 5.1c C18, Lockdown LA5)", () => {
  function Wifi({ onLarge, onHistory }: { onLarge?: () => void; onHistory?: () => void }) {
    return (
      <FieldRow
        label="Network"
        action={<FieldRowAction>Copy</FieldRowAction>}
        menu={
          <>
            <AdaptiveMenuItem icon="text--scale" onSelect={onLarge}>
              Show large type
            </AdaptiveMenuItem>
            <AdaptiveMenuItem icon="time" onSelect={onHistory}>
              History
            </AdaptiveMenuItem>
          </>
        }
      >
        PineHollow-Guest
      </FieldRow>
    )
  }

  it("is a real button, always shown, named for the row, after the text actions", () => {
    render(<Wifi />)
    const more = screen.getByRole("button", { name: "More actions for Network" })
    expect(more.tagName).toBe("BUTTON")
    expect(more).toHaveAttribute("data-overflow-menu")
    expect(more).toHaveAttribute("data-size", "icon-sm")
    expect(more.querySelector('[data-icon-name="overflow-menu--horizontal"]')).toBeInTheDocument()
    // Not a hover-only control: nothing hides it.
    expect(classesOf(more).filter((c) => ["hidden", "invisible", "opacity-0"].includes(c))).toEqual([])
    const actions = slot(screen.getByRole("group"), "field-row-actions")
    const buttons = within(actions).getAllByRole("button")
    expect(buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent)).toEqual(["Copy", "More actions for Network"])
    // A row's icon action: it keeps the row's height and sits flush with its end.
    expect(classesOf(more.parentElement!)).toEqual(expect.arrayContaining(["-my-2", "self-center", "last:-mr-2"]))
  })

  it("opens a menu named for the row on a desktop; picking a row runs the app's item and closes", async () => {
    const onLarge = vi.fn()
    render(<Wifi onLarge={onLarge} />)
    await userEvent.click(screen.getByRole("button", { name: "More actions for Network" }))
    const menu = await screen.findByRole("menu", { name: "More actions for Network" })
    expect(within(menu).getAllByRole("menuitem").map((i) => i.textContent)).toEqual(["Show large type", "History"])
    await userEvent.click(within(menu).getByRole("menuitem", { name: "Show large type" }))
    expect(onLarge).toHaveBeenCalledOnce()
    await vi.waitFor(() => expect(screen.queryByRole("menu")).toBeNull())
  })

  it("opens a sheet of rows on a phone", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 })
    window.dispatchEvent(new Event("resize"))
    try {
      render(<Wifi />)
      await userEvent.click(screen.getByRole("button", { name: "More actions for Network" }))
      const sheet = await screen.findByRole("dialog", { name: "More actions for Network" })
      expect(sheet).toHaveAttribute("data-slot", "sheet-content")
      expect(within(sheet).getByRole("button", { name: "History" })).toHaveAttribute("data-slot", "adaptive-menu-item")
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 })
      window.dispatchEvent(new Event("resize"))
    }
  })

  it("takes its own name, and stays usable in a row disabled with a reason", () => {
    render(
      <FieldRow label="Password" menuLabel="More for Steam's password" disabledReason="Unlock the vault to copy." action={<FieldRowAction>Copy</FieldRowAction>} menu={<AdaptiveMenuItem>History</AdaptiveMenuItem>}>
        ••••••••••••
      </FieldRow>
    )
    expect(screen.getByRole("button", { name: "Copy" })).toHaveAttribute("aria-disabled", "true")
    const more = screen.getByRole("button", { name: "More for Steam's password" })
    expect(more).not.toBeDisabled()
    expect(more.getAttribute("aria-disabled")).not.toBe("true")
  })

  it("draws nothing without a menu", () => {
    render(<FieldRow label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>kestrel.04</FieldRow>)
    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull()
  })
})

