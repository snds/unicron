import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import { Toggle } from "./toggle"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

// The pressed state is the primary fill (snds/unicron#6). These pin the classes the contrast
// check was run against, so a regen or a style edit that drops back to bg-muted fails here.
const PRESSED = ["aria-pressed:bg-primary", "aria-pressed:text-primary-foreground", "data-[state=on]:bg-primary", "data-[state=on]:text-primary-foreground"]

describe("Toggle pressed state", () => {
  it("keeps aria-pressed and draws pressed as the primary fill", async () => {
    const user = userEvent.setup()
    render(<Toggle aria-label="Bold">B</Toggle>)
    const button = screen.getByRole("button", { name: "Bold" })
    expect(button).toHaveAttribute("aria-pressed", "false")
    for (const cls of PRESSED) expect(button.className).toContain(cls)
    expect(button.className).not.toContain("aria-pressed:bg-muted")
    expect(button.className).not.toContain("data-[state=on]:bg-muted")

    await user.click(button)
    expect(button).toHaveAttribute("aria-pressed", "true")
  })

  it("applies the same treatment to ToggleGroupItem", () => {
    render(
      <ToggleGroup defaultValue={["left"]}>
        <ToggleGroupItem value="left" aria-label="Align left" />
        <ToggleGroupItem value="right" aria-label="Align right" />
      </ToggleGroup>
    )
    const left = screen.getByRole("button", { name: "Align left" })
    expect(left).toHaveAttribute("aria-pressed", "true")
    for (const cls of PRESSED) expect(left.className).toContain(cls)
    expect(screen.getByRole("button", { name: "Align right" })).toHaveAttribute("aria-pressed", "false")
  })
})
