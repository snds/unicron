import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

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
