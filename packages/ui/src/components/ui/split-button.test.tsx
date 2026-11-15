import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DropdownMenuItem } from "./dropdown-menu"
import { SplitButton } from "./split-button"

function Subject({ onSend = () => {}, onLater = () => {}, disabled, disabledReason }: { onSend?: () => void; onLater?: () => void; disabled?: boolean; disabledReason?: string }) {
  return (
    <SplitButton
      onClick={onSend}
      disabled={disabled}
      disabledReason={disabledReason}
      menuLabel="Send later"
      menu={
        <>
          <DropdownMenuItem onClick={onLater}>Tomorrow 08:00</DropdownMenuItem>
          <DropdownMenuItem>Pick date and time…</DropdownMenuItem>
        </>
      }
    >
      Send
    </SplitButton>
  )
}

describe("SplitButton (contract 5.1b #36)", () => {
  it("is one group: the primary action and a named chevron joined to it, 1px apart", () => {
    render(<Subject />)
    const group = screen.getByRole("group")
    expect(group).toHaveAttribute("data-slot", "split-button")
    expect(group.className).toContain("gap-px")
    const send = screen.getByRole("button", { name: "Send" })
    const later = screen.getByRole("button", { name: "Send later" })
    expect(send).toHaveAttribute("data-variant", "default")
    expect(later).toHaveAttribute("data-variant", "default")
    expect(later).toHaveAttribute("data-size", "icon")
    expect(later).toHaveAttribute("aria-haspopup", "menu")
  })

  it("the action runs on its own; the chevron opens the menu by keyboard", async () => {
    const onSend = vi.fn()
    const onLater = vi.fn()
    render(<Subject onSend={onSend} onLater={onLater} />)
    await userEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(onSend).toHaveBeenCalledTimes(1)
    screen.getByRole("button", { name: "Send later" }).focus()
    await userEvent.keyboard("{Enter}")
    expect(await screen.findByRole("menuitem", { name: "Tomorrow 08:00" })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("menuitem", { name: "Tomorrow 08:00" }))
    expect(onLater).toHaveBeenCalledTimes(1)
  })

  it("disabled with a reason: the action stays focusable and says why; the chevron is off too", () => {
    render(<Subject disabled disabledReason="Fix or remove the address in red." />)
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAttribute("aria-disabled", "true")
    expect(send).toHaveAccessibleDescription("Fix or remove the address in red.")
    expect(screen.getByRole("button", { name: "Send later" })).toBeDisabled()
  })
})
