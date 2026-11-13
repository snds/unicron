import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover"

function Subject() {
  return (
    <>
      <Popover>
        <PopoverTrigger>Model details</PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Route</PopoverTitle>
            <PopoverDescription>Local first, Claude as a fallback.</PopoverDescription>
          </PopoverHeader>
          <PopoverClose>Done</PopoverClose>
        </PopoverContent>
      </Popover>
      <button type="button">Outside</button>
    </>
  )
}

describe("Popover", () => {
  it("is closed until its trigger is pressed", async () => {
    render(<Subject />)
    expect(screen.queryByRole("dialog")).toBeNull()
    expect(screen.getByRole("button", { name: "Model details" })).toHaveAttribute("aria-expanded", "false")

    await userEvent.click(screen.getByRole("button", { name: "Model details" }))

    expect(screen.getByRole("button", { name: "Model details" })).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("is named and described by its title and description", async () => {
    render(<Subject />)
    await userEvent.click(screen.getByRole("button", { name: "Model details" }))

    expect(screen.getByRole("dialog", { name: "Route" })).toHaveAccessibleDescription("Local first, Claude as a fallback.")
  })

  it("sizes from the token, capped by the space on screen", async () => {
    render(<Subject />)
    await userEvent.click(screen.getByRole("button", { name: "Model details" }))

    const cls = (document.querySelector('[data-slot="popover-content"]') as HTMLElement).className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining(["w-(--c-popover-width)", "max-w-(--available-width)", "max-h-(--available-height)", "overflow-y-auto"])
    )
    expect(cls).not.toContain("w-72")
  })

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Subject />)
    const trigger = screen.getByRole("button", { name: "Model details" })
    await userEvent.click(trigger)
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await userEvent.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it("closes from PopoverClose", async () => {
    render(<Subject />)
    await userEvent.click(screen.getByRole("button", { name: "Model details" }))

    await userEvent.click(screen.getByRole("button", { name: "Done" }))

    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("closes on a press outside", async () => {
    render(<Subject />)
    await userEvent.click(screen.getByRole("button", { name: "Model details" }))

    await userEvent.click(screen.getByRole("button", { name: "Outside" }))

    expect(screen.queryByRole("dialog")).toBeNull()
  })
})

describe("Popover in the 2026-11 look", () => {
  function Picker({ scrim, showCloseButton }: { scrim?: boolean; showCloseButton?: boolean }) {
    return (
      <Popover defaultOpen>
        <PopoverTrigger>Who answers</PopoverTrigger>
        <PopoverContent scrim={scrim}>
          <PopoverHeader overline="Who answers // 03" title="Pick a model" showCloseButton={showCloseButton} />
          <label>
            Search models
            <input />
          </label>
        </PopoverContent>
      </Popover>
    )
  }
  const content = () => document.querySelector('[data-slot="popover-content"]') as HTMLElement

  it("is solid and square: the raised surface, a 1px rule, the 2px corner, no shadow or blur", () => {
    render(<Picker />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "rounded", "p-4"]))
    expect(cls.some((c) => /shadow|blur|ring-|zoom|rounded-(lg|xl)/.test(c))).toBe(false)
  })

  it("PopoverHeader: an overline, a title that names the popover, and a FloatButton M that closes it", async () => {
    render(<Picker />)
    expect(screen.getByRole("dialog", { name: "Pick a model" })).toBeInTheDocument()
    expect(screen.getByText("Who answers // 03").className.split(" ")).toEqual(expect.arrayContaining(["type-overline", "text-text-label"]))
    expect(screen.getByRole("heading", { name: "Pick a model" }).className.split(" ")).toContain("type-subtitle")
    const close = screen.getByRole("button", { name: "Close" })
    expect(close).toHaveAttribute("data-size", "m")
    await userEvent.click(close)
    expect(screen.queryByRole("dialog")).toBeNull()
  })

  it("starts focus on its first control, never on the header's close button", async () => {
    render(<Picker />)
    await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Search models" })).toHaveFocus())
  })

  it("showCloseButton={false} leaves the close out", () => {
    render(<Picker showCloseButton={false} />)
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })

  it("scrim dims the page behind with the menu scrim, never opaque or blurred", () => {
    const { unmount } = render(<Picker />)
    expect(document.querySelector('[data-slot="popover-scrim"]')).toBeNull()
    unmount()
    render(<Picker scrim />)
    const scrim = document.querySelector('[data-slot="popover-scrim"]') as HTMLElement
    expect(scrim.className.split(" ")).toEqual(expect.arrayContaining(["scrim-menu", "fixed", "inset-0"]))
    expect(scrim.className).not.toContain("blur")
  })

  it("the width comes from its knob: 20rem, so the header's close fits beside the words", () => {
    const tokens = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component/overlays.json"), "utf8"))
    expect(tokens.popover.width.$value).toBe("20rem")
  })
})
