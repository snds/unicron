import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeAll, describe, expect, it, vi } from "vitest"

import { Command, CommandDialog, CommandInput, CommandItem, CommandItemAction, CommandList } from "./command"

// cmdk scrolls the highlighted item into view; jsdom has no layout.
beforeAll(() => {
  Element.prototype.scrollIntoView ??= function scrollIntoView() {}
})

const options = () => screen.queryAllByRole("option").map((o) => o.getAttribute("data-value"))
const search = (text: string) =>
  act(() => {
    fireEvent.change(screen.getByRole("combobox"), { target: { value: text } })
  })

function Items({ match }: { match?: "value" | "keywords" }) {
  return (
    <Command label="Items" match={match}>
      <CommandInput placeholder="Search" />
      <CommandList>
        <CommandItem value="itm_7f3a9" keywords={["GitHub", "octocat"]}>
          GitHub
        </CommandItem>
        <CommandItem value="itm_b2c4d" keywords={["Bank", "savings"]}>
          Bank
        </CommandItem>
        <CommandItem value="Settings">Settings</CommandItem>
      </CommandList>
    </Command>
  )
}

describe("CommandItem keywords and Command match", () => {
  it("by default a search matches an item's value and its keywords (cmdk's filter)", async () => {
    render(<Items />)
    await search("octo")
    expect(options()).toEqual(["itm_7f3a9"])
    await search("savings")
    expect(options()).toEqual(["itm_b2c4d"])
    // The id is part of what the default filter reads, so its letters match too.
    await search("7f3a")
    expect(options()).toEqual(["itm_7f3a9"])
  })

  it('match="keywords" finds an item with keywords by those alone, and one without by its value', async () => {
    render(<Items match="keywords" />)
    await search("7f3a")
    expect(options()).toEqual([])
    await search("itm")
    expect(options()).toEqual([])
    await search("git")
    expect(options()).toEqual(["itm_7f3a9"])
    await search("sett")
    expect(options()).toEqual(["Settings"])
  })

  it("a filter passed by the host wins over match", async () => {
    render(
      <Command label="Items" match="keywords" filter={(value) => (value === "itm_b2c4d" ? 1 : 0)}>
        <CommandInput />
        <CommandList>
          <CommandItem value="itm_7f3a9" keywords={["GitHub"]}>GitHub</CommandItem>
          <CommandItem value="itm_b2c4d" keywords={["Bank"]}>Bank</CommandItem>
        </CommandList>
      </Command>
    )
    await search("git")
    expect(options()).toEqual(["itm_b2c4d"])
  })
})

function Palette({ onSelect, onAction, onKeyDown, disabled }: { onSelect: (v: string) => void; onAction: (v: string) => void; onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>; disabled?: boolean }) {
  return (
    <Command label="Items" onKeyDown={onKeyDown}>
      <CommandInput />
      <CommandList>
        <CommandItem value="itm_1" keywords={["GitHub"]} onSelect={onSelect}>
          GitHub
          <CommandItemAction label="Copy password" icon="content_copy" onAction={() => onAction("itm_1")} disabled={disabled} />
        </CommandItem>
        <CommandItem value="itm_2" keywords={["Bank"]} onSelect={onSelect}>
          Bank
          <CommandItemAction label="Copy card number" icon="content_copy" onAction={() => onAction("itm_2")} />
        </CommandItem>
        <CommandItem value="Settings" onSelect={onSelect}>
          Settings
        </CommandItem>
      </CommandList>
    </Command>
  )
}

const press = (init: KeyboardEventInit & { key: string }) =>
  act(() => {
    fireEvent.keyDown(screen.getByRole("combobox"), init)
  })

describe("CommandItemAction", () => {
  it("a click runs the action and never selects the item; focus stays in the search field", () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(<Palette onSelect={onSelect} onAction={onAction} />)
    const input = screen.getByRole("combobox")
    input.focus()
    const button = document.querySelectorAll<HTMLElement>('[data-slot="command-item-action"]')[1]!
    // The press is held back, so the search field keeps focus.
    expect(fireEvent.pointerDown(button)).toBe(false)
    expect(fireEvent.mouseDown(button)).toBe(false)
    fireEvent.click(button)
    expect(onAction).toHaveBeenCalledWith("itm_2")
    expect(onSelect).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
  })

  it("⌘↵ / Ctrl+Enter runs the highlighted item's action; Enter still selects", async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(<Palette onSelect={onSelect} onAction={onAction} />)
    await press({ key: "Enter", ctrlKey: true })
    expect(onAction).toHaveBeenLastCalledWith("itm_1")
    await press({ key: "ArrowDown" })
    await press({ key: "Enter", metaKey: true })
    expect(onAction).toHaveBeenLastCalledWith("itm_2")
    expect(onSelect).not.toHaveBeenCalled()
    await press({ key: "Enter" })
    expect(onSelect).toHaveBeenCalledWith("itm_2")
    expect(onAction).toHaveBeenCalledTimes(2)
  })

  it("on an item without an action, Ctrl+Enter keeps cmdk's Enter (it selects), as before", async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(<Palette onSelect={onSelect} onAction={onAction} />)
    await press({ key: "End" })
    await press({ key: "Enter", ctrlKey: true })
    expect(onSelect).toHaveBeenCalledWith("Settings")
    expect(onAction).not.toHaveBeenCalled()
  })

  it("a host that handles the keys itself (preventDefault) is left to it", async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    const onKeyDown = vi.fn((e: React.KeyboardEvent) => e.preventDefault())
    render(<Palette onSelect={onSelect} onAction={onAction} onKeyDown={onKeyDown} />)
    await press({ key: "Enter", ctrlKey: true })
    expect(onKeyDown).toHaveBeenCalled()
    expect(onAction).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
  })

  it("a disabled action runs neither by click nor by key, and the keys don't fall through to select", async () => {
    const onSelect = vi.fn()
    const onAction = vi.fn()
    render(<Palette onSelect={onSelect} onAction={onAction} disabled />)
    fireEvent.click(document.querySelector<HTMLElement>('[data-slot="command-item-action"]')!)
    await press({ key: "Enter", ctrlKey: true })
    expect(onAction).not.toHaveBeenCalled()
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getAllByRole("option")[0]).not.toHaveAttribute("aria-keyshortcuts")
  })

  it("is announced with its item, and kept out of the tab order, the item's name and its search", async () => {
    render(<Palette onSelect={() => {}} onAction={() => {}} />)
    const [github] = screen.getAllByRole("option")
    expect(github).toHaveAccessibleName("GitHub")
    expect(github).toHaveAccessibleDescription("Copy password, Control Enter")
    expect(github).toHaveAttribute("aria-keyshortcuts", "Control+Enter")
    expect(github).toHaveAttribute("data-has-action", "true")
    const button = github!.querySelector('[data-slot="command-item-action"]')!
    // Drawn like an icon button but not one: nothing inside an option may take focus or act as a
    // control to assistive tech (axe's nested-interactive).
    expect(button.tagName).toBe("SPAN")
    expect(button).not.toHaveAttribute("tabindex")
    expect(github!.querySelector("button, [tabindex], a[href], input")).toBeNull()
    expect(button).toHaveAttribute("aria-hidden", "true")
    expect(button).toHaveAttribute("title", "Copy password (Ctrl+Enter)")
    // The description sits outside the item, so its words never join the item's text or search.
    const description = document.getElementById(github!.getAttribute("aria-describedby")!)!
    expect(github!.contains(description)).toBe(false)
    expect(description).not.toBeVisible()
    await search("copy")
    expect(options()).toEqual([])
  })
})

describe("CommandDialog size", () => {
  it("is sm by default and takes the dialog's sizes", () => {
    const { rerender } = render(
      <CommandDialog open>
        <Command><CommandList /></Command>
      </CommandDialog>
    )
    const content = () => document.querySelector('[data-slot="dialog-content"]') as HTMLElement
    expect(content().className).toContain("sm:max-w-sm")
    rerender(
      <CommandDialog open size="lg">
        <Command><CommandList /></Command>
      </CommandDialog>
    )
    expect(content().className).toContain("sm:max-w-lg")
  })
})
