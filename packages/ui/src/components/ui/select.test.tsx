import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

const items = { general: "General", code: "Code", vision: "Vision" }
const content = () => document.querySelector('[data-slot="select-content"]') as HTMLElement

function Subject({
  width,
  defaultValue,
  disabled,
  invalid,
  onValueChange,
}: {
  width?: "trigger" | "fit" | "auto"
  defaultValue?: string
  disabled?: boolean
  invalid?: boolean
  onValueChange?: (value: string | null) => void
}) {
  return (
    <>
      <label htmlFor="alias">Model</label>
      <Select items={items} defaultValue={defaultValue} disabled={disabled} onValueChange={onValueChange}>
        <SelectTrigger id="alias" aria-invalid={invalid}>
          <SelectValue placeholder="Choose a model" />
        </SelectTrigger>
        <SelectContent width={width}>
          <SelectGroup>
            <SelectLabel>Aliases</SelectLabel>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="code">Code</SelectItem>
          </SelectGroup>
          <SelectSeparator />
          <SelectItem value="vision" disabled>
            Vision
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  )
}

const trigger = () => screen.getByRole("combobox", { name: "Model" })

// By keyboard: Base UI closes the list on a mouse-up outside the trigger, and every box in jsdom is
// empty, so a simulated click opens and closes it. Pointers are checked in the playground.
const openList = async () => {
  trigger().focus()
  await userEvent.keyboard("{ArrowDown}")
}

describe("Select", () => {
  it("takes its name from a label pointing at the trigger", () => {
    render(<Subject />)
    expect(trigger()).toHaveAttribute("data-slot", "select-trigger")
  })

  it("shows the placeholder, then an option's label rather than its value", async () => {
    render(<Subject />)
    expect(trigger()).toHaveTextContent("Choose a model")

    await openList()
    await userEvent.click(screen.getByRole("option", { name: "General" }))

    expect(trigger()).toHaveTextContent("General")
    expect(trigger()).not.toHaveTextContent("general")
  })

  it("shows the label for a default value before the list has opened", () => {
    render(<Subject defaultValue="code" />)
    expect(trigger()).toHaveTextContent("Code")
  })

  it("reports the chosen value", async () => {
    const onValueChange = vi.fn()
    render(<Subject onValueChange={onValueChange} />)

    await openList()
    await userEvent.click(screen.getByRole("option", { name: "Code" }))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange.mock.calls[0]?.[0]).toBe("code")
  })

  it("works from the keyboard and returns focus to the trigger", async () => {
    render(<Subject />)
    trigger().focus()

    await userEvent.keyboard("{ArrowDown}")
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(trigger()).toHaveFocus()
    expect(trigger()).toHaveTextContent("Choose a model")
  })

  it("marks the chosen option selected", async () => {
    render(<Subject defaultValue="code" />)
    await openList()
    expect(screen.getByRole("option", { name: "Code" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("option", { name: "General" })).toHaveAttribute("aria-selected", "false")
  })

  it("names a group by its label", async () => {
    render(<Subject />)
    await openList()
    expect(screen.getByRole("group", { name: "Aliases" })).toBeInTheDocument()
  })

  it("does not choose a disabled option", async () => {
    const onValueChange = vi.fn()
    render(<Subject onValueChange={onValueChange} />)
    await openList()

    const vision = screen.getByRole("option", { name: "Vision" })
    expect(vision).toHaveAttribute("aria-disabled", "true")
    await userEvent.click(vision)
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it("won't open when disabled", async () => {
    render(<Subject disabled />)
    expect(trigger()).toBeDisabled()

    await openList()

    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("carries aria-invalid onto the trigger, where the 2px critical border keys on it", () => {
    render(<Subject invalid />)
    expect(trigger()).toHaveAttribute("aria-invalid", "true")
    // 1.0: Figma's error field (32:48): a 2px inside border in critical-fill, no outer ring.
    expect(trigger().className).toContain("aria-invalid:rule-box-emphasis")
    expect(trigger().className).toContain("aria-invalid:[--rule-color:var(--critical-fill)]")
  })

  it("renders a label outside a group without throwing", async () => {
    render(
      <Select defaultOpen>
        <SelectTrigger aria-label="Model">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectLabel>Aliases</SelectLabel>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>
    )
    expect(screen.getByText("Aliases")).toHaveAttribute("data-slot", "select-label")
  })
})

describe("SelectContent width", () => {
  const open = async (width?: "trigger" | "fit" | "auto") => {
    render(<Subject width={width} />)
    await openList()
    return content().className.split(" ")
  }

  it("fits its items by default: at least the trigger, up to the menu max", async () => {
    const cls = await open()
    expect(content()).toHaveAttribute("data-width", "fit")
    expect(cls).toEqual(expect.arrayContaining(["w-max", "min-w-[max(var(--c-menu-min-width),var(--anchor-width))]"]))
    expect(cls).not.toContain("w-(--anchor-width)")
  })

  it("trigger: exactly as wide as its trigger", async () => {
    const cls = await open("trigger")
    expect(cls).toEqual(expect.arrayContaining(["w-(--anchor-width)", "min-w-(--c-menu-min-width)"]))
  })

  it("is a solid menu surface, never frosted glass (contract 1.5: no blur)", async () => {
    const cls = await open()
    expect(cls).toContain("bg-popover")
    expect(cls).not.toContain("bg-popover/70")
    expect(cls.some((name) => name.includes("backdrop-blur"))).toBe(false)
  })
})
