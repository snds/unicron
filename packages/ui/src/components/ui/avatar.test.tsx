import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { Avatar, AvatarBadge, AvatarFallback } from "./avatar"

describe("Avatar", () => {
  it("is square on the 2px corner with a 1px rule drawn over it (Figma 32:121)", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    )
    const avatar = container.querySelector('[data-slot="avatar"]')!
    expect(avatar.className).toContain("rounded-lg")
    expect(avatar.className).toContain("after:rule-box")
    expect(avatar.className).not.toContain("rounded-full")
    expect(screen.getByText("MC").className).toContain("type-ui-emphasis")
    expect(container.querySelector('[data-slot="avatar-badge"]')!.className).not.toContain("rounded-full")
  })
})
