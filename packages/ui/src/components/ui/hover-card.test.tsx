import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { HoverCardTitle } from "./hover-card"
import { NavItem } from "./nav-item"

describe("HoverCard on a NavItem", () => {
  it("opens a short card when a pointer rests on the row, and the row still goes to its place", async () => {
    render(
      <NavItem
        label="Warpcore"
        href="/p/warpcore"
        hoverCard={
          <>
            <HoverCardTitle>Warpcore</HoverCardTitle>
            <p>2 running · 1 needs you</p>
          </>
        }
      />
    )
    const link = screen.getByRole("link", { name: /Warpcore/ })
    expect(link).toHaveAttribute("href", "/p/warpcore")
    fireEvent.pointerEnter(link, { pointerType: "mouse" })
    fireEvent.mouseEnter(link)
    fireEvent.mouseMove(link)
    await waitFor(() => expect(screen.getByText("2 running · 1 needs you")).toBeInTheDocument(), { timeout: 2000 })
  })

  it("draws no card without one", () => {
    render(<NavItem label="Home" href="/" />)
  })
})
