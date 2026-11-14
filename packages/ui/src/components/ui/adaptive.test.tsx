import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  AdaptiveDialog,
  AdaptiveMenu,
  AdaptiveMenuCheckboxItem,
  AdaptiveMenuGroup,
  AdaptiveMenuItem,
  AdaptiveMenuRadioGroup,
  AdaptiveMenuRadioItem,
  AdaptiveMenuSeparator,
  AdaptivePopover,
  OverflowMenu,
  overflowMenuLabel,
  textOfNode,
  type AdaptivePresentation,
} from "./adaptive"
import { Button } from "./button"

const content = () => document.querySelector('[data-adaptive]') as HTMLElement | null

/** The window's width, as useViewport reads it. */
function screenWidth(width: number) {
  const original = window.innerWidth
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  window.dispatchEvent(new Event("resize"))
  return () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: original })
    window.dispatchEvent(new Event("resize"))
  }
}

let restore: (() => void) | undefined
afterEach(() => {
  restore?.()
  restore = undefined
})

function NewEvent({ presentation, onOpenChange }: { presentation?: AdaptivePresentation; onOpenChange?: (open: boolean) => void }) {
  return (
    <AdaptiveDialog
      defaultOpen
      onOpenChange={onOpenChange}
      presentation={presentation}
      overline="New event // personal"
      title="Cabin trip"
      description="Sat Nov 20 to Mon Nov 22."
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button>Save event</Button>
        </>
      }
    >
      <label>
        Title
        <input defaultValue="Cabin trip" />
      </label>
    </AdaptiveDialog>
  )
}

describe("AdaptiveDialog", () => {
  it("is a dialog on a desktop: form size, the overline and title in its header, the actions in its footer", () => {
    restore = screenWidth(1440)
    render(<NewEvent />)
    const dialog = screen.getByRole("dialog", { name: "Cabin trip" })
    expect(dialog).toHaveAttribute("data-slot", "dialog-content")
    expect(dialog).toHaveAttribute("data-size", "form")
    expect(dialog).toHaveAccessibleDescription("Sat Nov 20 to Mon Nov 22.")
    expect(screen.getByText("New event // personal")).toHaveAttribute("data-slot", "dialog-overline")
    expect(document.querySelector('[data-slot="dialog-footer"]')).toContainElement(screen.getByRole("button", { name: "Save event" }))
  })

  it("is a bottom sheet on a phone (the compact width class), with the Sheet Header", () => {
    restore = screenWidth(390)
    render(<NewEvent />)
    const sheet = screen.getByRole("dialog", { name: "Cabin trip" })
    expect(sheet).toHaveAttribute("data-slot", "sheet-content")
    expect(sheet).toHaveAttribute("data-side", "bottom")
    expect(screen.getByText("New event // personal")).toHaveAttribute("data-slot", "sheet-overline")
    expect(document.querySelector('[data-slot="sheet-footer"]')).toContainElement(screen.getByRole("button", { name: "Save event" }))
    expect(sheet.querySelector('[data-slot="sheet-grabber"]')).not.toBeNull()
  })

  it("presentation fixes the form whatever the screen", () => {
    restore = screenWidth(1440)
    render(<NewEvent presentation="sheet" />)
    expect(content()).toHaveAttribute("data-slot", "sheet-content")
  })

  it("closes from its close button in either form, and says so", async () => {
    for (const presentation of ["desktop", "sheet"] as const) {
      const onOpenChange = vi.fn()
      const { unmount } = render(<NewEvent presentation={presentation} onOpenChange={onOpenChange} />)
      fireEvent.click(screen.getByRole("button", { name: "Close" }))
      expect(onOpenChange).toHaveBeenCalledWith(false)
      unmount()
    }
  })

  it("opens from its trigger", async () => {
    render(
      <AdaptiveDialog presentation="desktop" title="Rename" trigger={<Button>Rename</Button>}>
        <input aria-label="Name" />
      </AdaptiveDialog>
    )
    expect(screen.queryByRole("dialog")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Rename" }))
    expect(screen.getByRole("dialog", { name: "Rename" })).toBeInTheDocument()
  })
})

function Folders({ presentation, onPick }: { presentation?: AdaptivePresentation; onPick?: (what: string) => void }) {
  return (
    <AdaptiveMenu presentation={presentation} defaultOpen overline="Mail // personal" title="Folders" trigger={<Button>Folders</Button>}>
      <AdaptiveMenuItem icon="email" onSelect={() => onPick?.("Inbox")} shortcut="G I">
        Inbox
      </AdaptiveMenuItem>
      <AdaptiveMenuItem icon="star" onSelect={() => onPick?.("Starred")}>
        Starred
      </AdaptiveMenuItem>
      <AdaptiveMenuSeparator />
      <AdaptiveMenuGroup label="Accounts // 02">
        <AdaptiveMenuItem icon="user--avatar">Personal</AdaptiveMenuItem>
      </AdaptiveMenuGroup>
      <AdaptiveMenuItem icon="trash-can" variant="destructive">
        Empty trash
      </AdaptiveMenuItem>
    </AdaptiveMenu>
  )
}

describe("AdaptiveMenu", () => {
  it("is a DropdownMenu on a desktop, named by its title, its overline as the first line", () => {
    render(<Folders presentation="desktop" />)
    const menu = screen.getByRole("menu", { name: "Folders" })
    expect(menu).toHaveAttribute("data-slot", "dropdown-menu-content")
    expect(screen.getByText("Mail // personal")).toHaveAttribute("data-slot", "dropdown-menu-label")
    expect(screen.getByRole("menuitem", { name: /Inbox/ }).querySelector('[data-slot="kbd"]')).toHaveTextContent("G I")
    expect(screen.getByRole("group", { name: "Accounts // 02" })).toBeInTheDocument()
  })

  it("is a sheet of rows on a phone: the Sheet Header, buttons, no keys", () => {
    restore = screenWidth(390)
    render(<Folders />)
    expect(screen.getByRole("dialog", { name: "Folders" })).toHaveAttribute("data-slot", "sheet-content")
    const inbox = screen.getByRole("button", { name: "Inbox" })
    expect(inbox).toHaveAttribute("data-slot", "adaptive-menu-item")
    expect(inbox.querySelector('[data-slot="kbd"]')).toBeNull()
    expect(inbox.className.split(" ")).toEqual(expect.arrayContaining(["type-label", "text-text-secondary", "pointer-coarse:min-h-touch-min", "hover:bg-accent", "hover:text-text-body"]))
    expect(screen.getByRole("group", { name: "Accounts // 02" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Empty trash" }).className).toContain("text-critical-text")
  })

  it("a row takes a count and a current state, as Vale 05's folder sheet draws its Nav Items", () => {
    for (const presentation of ["desktop", "sheet"] as const) {
      const { unmount } = render(
        <AdaptiveMenu defaultOpen presentation={presentation} title="Folders" trigger={<Button>Folders</Button>}>
          <AdaptiveMenuItem icon="email" count={12} current>
            Inbox
          </AdaptiveMenuItem>
          <AdaptiveMenuItem icon="star" count={4}>
            Starred
          </AdaptiveMenuItem>
          <AdaptiveMenuItem icon="send--alt" count={0}>
            Sent
          </AdaptiveMenuItem>
        </AdaptiveMenu>
      )
      const role = presentation === "sheet" ? "button" : "menuitem"
      // The count is said after the words, once, in plain digits.
      const inbox = screen.getByRole(role, { name: "Inbox, 12" })
      expect(inbox).toHaveAttribute("aria-current", "true")
      expect(inbox).toHaveAttribute("data-current", "")
      expect(inbox.className.split(" ")).toEqual(expect.arrayContaining(["data-current:bg-primary-soft", "data-current:text-text-body"]))
      const count = inbox.querySelector('[data-slot="adaptive-menu-item-count"]') as HTMLElement
      expect(count).toHaveTextContent("12")
      expect(count).toHaveAttribute("aria-hidden", "true")
      expect(count.className.split(" ")).toEqual(expect.arrayContaining(["type-folio", "text-text-body", "ms-auto"]))
      const starred = screen.getByRole(role, { name: "Starred, 4" })
      expect(starred).not.toHaveAttribute("aria-current")
      expect(starred.querySelector('[data-slot="adaptive-menu-item-count"]')).toHaveTextContent("04")
      expect(starred.querySelector('[data-slot="adaptive-menu-item-count"]')!.className).toContain("text-text-label")
      // Zero shows nothing and says nothing.
      expect(screen.getByRole(role, { name: "Sent" }).querySelector('[data-slot="adaptive-menu-item-count"]')).toBeNull()
      unmount()
    }
  })

  it("picking a row runs it and closes, in either form", async () => {
    for (const presentation of ["desktop", "sheet"] as const) {
      const onPick = vi.fn()
      const { unmount } = render(<Folders presentation={presentation} onPick={onPick} />)
      const row = presentation === "sheet" ? screen.getByRole("button", { name: "Starred" }) : screen.getByRole("menuitem", { name: /Starred/ })
      fireEvent.click(row)
      expect(onPick).toHaveBeenCalledWith("Starred")
      await vi.waitFor(() => expect(screen.queryByText("Starred")).toBeNull())
      unmount()
    }
  })

  it("arrow keys move between a sheet's rows, Home and End to the ends", async () => {
    render(<Folders presentation="sheet" />)
    const inbox = screen.getByRole("button", { name: "Inbox" })
    act(() => inbox.focus())
    fireEvent.keyDown(inbox, { key: "ArrowDown" })
    expect(screen.getByRole("button", { name: "Starred" })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: "End" })
    expect(screen.getByRole("button", { name: "Empty trash" })).toHaveFocus()
    fireEvent.keyDown(document.activeElement!, { key: "ArrowDown" })
    expect(inbox).toHaveFocus()
    fireEvent.keyDown(inbox, { key: "ArrowUp" })
    expect(screen.getByRole("button", { name: "Empty trash" })).toHaveFocus()
  })

  it("radio rows: one of a few, checked on the picked one, and picking closes", async () => {
    function Sort({ presentation }: { presentation: AdaptivePresentation }) {
      const [value, setValue] = React.useState("title")
      return (
        <>
          <output>{value}</output>
          <AdaptiveMenu presentation={presentation} defaultOpen title="Sort" trigger={<Button>Sort</Button>}>
            <AdaptiveMenuRadioGroup label="Sort by" value={value} onValueChange={setValue}>
              <AdaptiveMenuRadioItem value="title">Title</AdaptiveMenuRadioItem>
              <AdaptiveMenuRadioItem value="changed">Recently changed</AdaptiveMenuRadioItem>
            </AdaptiveMenuRadioGroup>
          </AdaptiveMenu>
        </>
      )
    }
    const { unmount } = render(<Sort presentation="sheet" />)
    expect(screen.getByRole("radio", { name: /Title/ })).toHaveAttribute("aria-checked", "true")
    expect(screen.getByRole("radiogroup", { name: "Sort by" })).toBeInTheDocument()
    fireEvent.click(screen.getByRole("radio", { name: /Recently changed/ }))
    expect(screen.getByRole("status")).toHaveTextContent("changed")
    unmount()
    render(<Sort presentation="desktop" />)
    expect(screen.getByRole("menuitemradio", { name: "Title" })).toHaveAttribute("aria-checked", "true")
  })

  it("checkbox rows toggle and keep the menu open", () => {
    function Calendars() {
      const [on, setOn] = React.useState(true)
      return (
        <AdaptiveMenu presentation="sheet" defaultOpen title="Calendars" trigger={<Button>Calendars</Button>}>
          <AdaptiveMenuCheckboxItem checked={on} onCheckedChange={setOn}>
            Family
          </AdaptiveMenuCheckboxItem>
        </AdaptiveMenu>
      )
    }
    render(<Calendars />)
    const row = screen.getByRole("checkbox", { name: /Family/ })
    expect(row).toHaveAttribute("aria-checked", "true")
    fireEvent.click(row)
    expect(screen.getByRole("checkbox", { name: /Family/ })).toHaveAttribute("aria-checked", "false")
  })

  it("the desktop menu can dim the page with the menu scrim (quick create)", () => {
    render(
      <AdaptiveMenu presentation="desktop" defaultOpen scrim title="Create" trigger={<Button>New message</Button>}>
        <AdaptiveMenuItem icon="edit">New message</AdaptiveMenuItem>
      </AdaptiveMenu>
    )
    expect(document.querySelector('[data-slot="dropdown-menu-scrim"]')).not.toBeNull()
  })

  it("a part outside an AdaptiveMenu says so", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<AdaptiveMenuItem>Inbox</AdaptiveMenuItem>)).toThrow("AdaptiveMenuItem must be inside an AdaptiveMenu.")
    error.mockRestore()
  })
})

describe("AdaptivePopover", () => {
  function Legend({ presentation }: { presentation?: AdaptivePresentation }) {
    return (
      <AdaptivePopover presentation={presentation} defaultOpen overline="Graph // 04 kinds" title="Legend" trigger={<Button>Legend</Button>}>
        <p>Skills, checks, harnesses and notes.</p>
      </AdaptivePopover>
    )
  }

  it("is a popover with a PopoverHeader on a desktop", () => {
    render(<Legend presentation="desktop" />)
    const popover = screen.getByRole("dialog", { name: "Legend" })
    expect(popover).toHaveAttribute("data-slot", "popover-content")
    expect(screen.getByText("Graph // 04 kinds")).toHaveAttribute("data-slot", "popover-overline")
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("data-size", "m")
  })

  it("is a bottom sheet with the Sheet Header on a phone", () => {
    restore = screenWidth(390)
    render(<Legend />)
    const sheet = screen.getByRole("dialog", { name: "Legend" })
    expect(sheet).toHaveAttribute("data-slot", "sheet-content")
    expect(screen.getByText("Graph // 04 kinds")).toHaveAttribute("data-slot", "sheet-overline")
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("data-size", "l")
  })
})

describe("OverflowMenu (contract 5.1c C18)", () => {
  it("a ghost icon button S named by its label, always shown, that opens an AdaptiveMenu titled the same", async () => {
    const onPick = vi.fn()
    render(
      <OverflowMenu label="More actions for Steam">
        <AdaptiveMenuItem onSelect={onPick}>Open item</AdaptiveMenuItem>
      </OverflowMenu>
    )
    const button = screen.getByRole("button", { name: "More actions for Steam" })
    expect(button).toHaveAttribute("data-variant", "ghost")
    expect(button).toHaveAttribute("data-size", "icon-sm")
    expect(button.querySelector('[data-icon-name="overflow-menu--horizontal"]')).toBeInTheDocument()
    await userEvent.click(button)
    await userEvent.click(await screen.findByRole("menuitem", { name: "Open item" }))
    expect(onPick).toHaveBeenCalledOnce()
  })

  it("is a sheet on a phone, titled by its label", async () => {
    restore = screenWidth(390)
    render(
      <OverflowMenu label="More actions for Steam">
        <AdaptiveMenuItem>Open item</AdaptiveMenuItem>
      </OverflowMenu>
    )
    await userEvent.click(screen.getByRole("button", { name: "More actions for Steam" }))
    expect(await screen.findByRole("dialog", { name: "More actions for Steam" })).toHaveAttribute("data-slot", "sheet-content")
  })

  it("names: More actions for {subject}, from a label's words", () => {
    expect(overflowMenuLabel("Password")).toBe("More actions for Password")
    expect(overflowMenuLabel()).toBe("More actions")
    expect(textOfNode(<>Find a setting</>)).toBe("Find a setting")
    expect(textOfNode(["One-time ", <span key="a">code</span>])).toBe("One-time code")
    expect(textOfNode(null)).toBe("")
  })
})

describe("AdaptiveDialog notice (contract 5.1c C19)", () => {
  it("passes its notice line to the dialog and to the phone's sheet", () => {
    const { unmount } = render(
      <AdaptiveDialog defaultOpen presentation="desktop" title="Edit Steam" notice={<p data-testid="line">Sign-in request</p>} />
    )
    expect(document.querySelector('[data-slot="dialog-notice"]')).toContainElement(screen.getByTestId("line"))
    unmount()
    render(<AdaptiveDialog defaultOpen presentation="sheet" title="Edit Steam" notice={<p data-testid="line">Sign-in request</p>} />)
    expect(document.querySelector('[data-slot="sheet-notice"]')).toContainElement(screen.getByTestId("line"))
  })
})

