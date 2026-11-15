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

  it("the badge is the body ink, as the unread mark, and never the solid primary fill (rules 2.5.1)", () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
        <AvatarBadge />
      </Avatar>
    )
    const badge = container.querySelector('[data-slot="avatar-badge"]')!
    const cls = badge.className.split(" ")
    expect(badge).toHaveAttribute("data-tone", "neutral")
    expect(cls).toEqual(expect.arrayContaining(["bg-text-body", "text-surface-ground", "ring-background"]))
    expect(cls.some((name) => /(^|:)bg-primary(-fill)?$/.test(name))).toBe(false)
  })

  it('tone="live" takes secondary-live, for presence', () => {
    const { container } = render(
      <Avatar>
        <AvatarFallback>MC</AvatarFallback>
        <AvatarBadge tone="live" />
      </Avatar>
    )
    const badge = container.querySelector('[data-slot="avatar-badge"]')!
    expect(badge).toHaveAttribute("data-tone", "live")
    expect(badge.className.split(" ")).toContain("bg-secondary-live")
    expect(badge.className.split(" ")).not.toContain("bg-text-body")
  })
})
