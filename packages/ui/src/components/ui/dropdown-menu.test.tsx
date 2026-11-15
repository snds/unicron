import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Icon } from "../icon"

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuWidth,
} from "./dropdown-menu"

const content = () => document.querySelector('[data-slot="dropdown-menu-content"]') as HTMLElement

function Subject({ width }: { width?: DropdownMenuWidth }) {
  return (
    <DropdownMenu open>
      <DropdownMenuTrigger>Change</DropdownMenuTrigger>
      <DropdownMenuContent width={width}>
        <DropdownMenuItem>Follow the system setting</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenuContent width", () => {
  it("matches its trigger by default, as before, never below the menu min", () => {
    render(<Subject />)
    const cls = content().className.split(" ")
    expect(content()).toHaveAttribute("data-width", "trigger")
    expect(cls).toEqual(expect.arrayContaining(["w-(--anchor-width)", "min-w-(--c-menu-min-width)"]))
    expect(cls).not.toContain("w-max")
  })

  it("fit: as wide as its items, at least the trigger, up to the menu max", () => {
    render(<Subject width="fit" />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining([
        "w-max",
        "min-w-[max(var(--c-menu-min-width),var(--anchor-width))]",
        "max-w-[min(var(--c-menu-max-width),var(--available-width))]",
      ])
    )
    expect(cls).not.toContain("w-(--anchor-width)")
  })

  it("auto: as wide as its items, whatever the trigger, between the menu min and max", () => {
    render(<Subject width="auto" />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining(["w-max", "min-w-(--c-menu-min-width)", "max-w-[min(var(--c-menu-max-width),var(--available-width))]"])
    )
    expect(cls.some((c) => c.includes("--anchor-width"))).toBe(false)
  })

  it("a submenu sizes to its items by default (auto)", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Move to another project</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const sub = document.querySelector('[data-slot="dropdown-menu-sub-content"]') as HTMLElement
    expect(sub).toHaveAttribute("data-width", "auto")
  })
})

describe("DropdownMenuLabel", () => {
  it("on its own, at the top of a menu, draws a plain label instead of throwing", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Thread</DropdownMenuLabel>
          <DropdownMenuItem>Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const label = screen.getByText("Thread")
    expect(label).toHaveAttribute("data-slot", "dropdown-menu-label")
    expect(screen.getByRole("menuitem", { name: "Archive" })).toBeInTheDocument()
  })

  it("inside a group, names the group", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Options</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Thread</DropdownMenuLabel>
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByRole("group", { name: "Thread" })).toBeInTheDocument()
  })

  it("inside a radio group, names it too", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Density</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="compact">
            <DropdownMenuLabel>Density</DropdownMenuLabel>
            <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    expect(screen.getByRole("group", { name: "Density" })).toBeInTheDocument()
  })
})

describe("DropdownMenu in the 2026-11 look (quick create: Vale and Lockdown States 03)", () => {
  function QuickCreate({ scrim = true, onSelect }: { scrim?: boolean; onSelect?: (what: string) => void }) {
    return (
      <DropdownMenu open>
        <DropdownMenuTrigger>New message</DropdownMenuTrigger>
        <DropdownMenuContent width="auto" scrim={scrim}>
          <DropdownMenuLabel>Create // long press</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onSelect?.("message")}>
            <Icon name="edit" />
            New message
            <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Icon name="calendar" />
            New event
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Icon name="trash-can" />
            Delete draft
          </DropdownMenuItem>
          <DropdownMenuCheckboxItem checked>Show weekends</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  it("is solid and square: the raised surface, a 1px rule, the 2px corner, 8 inside and 4 between rows; no frost, no shadow", () => {
    render(<QuickCreate />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "rounded", "p-2", "gap-1", "flex-col"]))
    expect(cls.some((c) => /blur|shadow|backdrop|\/70|rounded-lg|zoom/.test(c))).toBe(false)
  })

  it("scrim dims the page with the menu scrim (quick create); a plain menu draws none", () => {
    const { unmount } = render(<QuickCreate />)
    const scrim = document.querySelector('[data-slot="dropdown-menu-scrim"]') as HTMLElement
    expect(scrim.className.split(" ")).toEqual(expect.arrayContaining(["scrim-menu", "fixed", "inset-0"]))
    unmount()
    render(<QuickCreate scrim={false} />)
    expect(document.querySelector('[data-slot="dropdown-menu-scrim"]')).toBeNull()
  })

  it("a section label is an overline in label ink", () => {
    render(<QuickCreate />)
    expect(screen.getByText("Create // long press").className.split(" ")).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
  })

  it("rows are Nav Items, as Figma draws them: the label role in secondary ink, 36 tall (44 on touch), a 20px glyph 10 from the words; the highlight on bg-accent in body ink", () => {
    render(<QuickCreate />)
    const row = screen.getByRole("menuitem", { name: /New message/ })
    expect(row.className.split(" ")).toEqual(
      expect.arrayContaining(["type-label", "text-text-secondary", "min-h-9", "pointer-coarse:min-h-touch-min", "gap-2.5", "px-2.5", "data-highlighted:bg-accent", "data-highlighted:text-text-body", "[&_svg:not([class*='size-'])]:size-5"])
    )
  })

  it("the keys sit in a Kbd at the row's end", () => {
    render(<QuickCreate />)
    const row = screen.getByRole("menuitem", { name: /New message/ })
    expect(row.querySelector('[data-slot="dropdown-menu-shortcut"] [data-slot="kbd"]')).toHaveTextContent("⌘N")
  })

  it("a destructive row reads in the critical ink, highlighted too", () => {
    render(<QuickCreate />)
    const row = screen.getByRole("menuitem", { name: /Delete draft/ })
    expect(row.className).toContain("data-[variant=destructive]:text-critical-text")
    expect(row.className).toContain("data-[variant=destructive]:data-highlighted:text-critical-text")
  })

  it("the current row takes the primary-soft tile and body ink, and says so", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Folders</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem current>Inbox</DropdownMenuItem>
          <DropdownMenuItem>Starred</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const inbox = screen.getByRole("menuitem", { name: "Inbox" })
    expect(inbox).toHaveAttribute("aria-current", "true")
    expect(inbox).toHaveAttribute("data-current", "")
    expect(inbox.className.split(" ")).toEqual(expect.arrayContaining(["data-current:bg-primary-soft", "data-current:text-text-body"]))
    const starred = screen.getByRole("menuitem", { name: "Starred" })
    expect(starred).not.toHaveAttribute("aria-current")
    expect(starred).not.toHaveAttribute("data-current")
  })

  it("a checkbox row says it is checked", () => {
    render(<QuickCreate />)
    expect(screen.getByRole("menuitemcheckbox", { name: "Show weekends" })).toHaveAttribute("aria-checked", "true")
  })

  it("a separator is a hairline, edge to edge", () => {
    render(<QuickCreate />)
    expect((document.querySelector('[data-slot="dropdown-menu-separator"]') as HTMLElement).className.split(" ")).toEqual(
      expect.arrayContaining(["bg-line-rule", "h-px", "-mx-2"])
    )
  })

  it("picking a row runs it from the keyboard", async () => {
    const onSelect = vi.fn()
    render(<QuickCreate onSelect={onSelect} />)
    const row = screen.getByRole("menuitem", { name: /New message/ })
    row.focus()
    fireEvent.click(row)
    expect(onSelect).toHaveBeenCalledWith("message")
  })
})
