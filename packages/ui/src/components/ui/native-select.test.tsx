import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { NativeSelect, NativeSelectOption } from "./native-select"

describe("NativeSelect", () => {
  function Subject({ size, disabled }: { size?: "sm" | "default"; disabled?: boolean }) {
    return (
      <NativeSelect aria-label="Between words" size={size} disabled={disabled} defaultValue="dash">
        <NativeSelectOption value="dash">A dash</NativeSelectOption>
        <NativeSelectOption value="space">A space</NativeSelectOption>
      </NativeSelect>
    )
  }

  it("is the platform's select, named, in the Text Field box with a chevron", async () => {
    render(<Subject />)
    const select = screen.getByRole("combobox", { name: "Between words" })
    expect(select.className).toEqual(expect.stringContaining("bg-surface-raised"))
    for (const cls of ["rule-box", "h-control", "pl-4", "pr-11", "type-ui", "focus:rule-box-emphasis", "aria-invalid:rule-box-emphasis"]) expect(select.className).toContain(cls)
    expect(select.parentElement!.querySelector('[data-icon-name="chevron--down"]')).not.toBeNull()
    await userEvent.selectOptions(select, "space")
    expect(select).toHaveValue("space")
  })

  it("sm is 40 tall, for a row, and the 44px touch minimum on a coarse pointer", () => {
    render(<Subject size="sm" />)
    expect(screen.getByRole("combobox").className).toContain("data-[size=sm]:h-10")
    expect(screen.getByRole("combobox").className.split(" ")).toContain("data-[size=sm]:pointer-coarse:h-touch-min")
  })

  it("disabled dims the chevron with it", () => {
    render(<Subject disabled />)
    expect(screen.getByRole("combobox")).toBeDisabled()
    expect(screen.getByRole("combobox").parentElement!.querySelector('[data-slot="native-select-icon"]')!.getAttribute("class")).toContain("group-has-[select:disabled]/native-select:opacity-50")
  })
})
