import { act, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { AppFrame, AppFrameFocus } from "./app-frame"
import { AppLockup } from "./app-lockup"
import { Button } from "./button"

function setViewport(width: number, height: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  Object.defineProperty(window, "innerHeight", { configurable: true, value: height })
  act(() => {
    window.dispatchEvent(new Event("resize"))
  })
}

afterEach(() => setViewport(1024, 768))

describe("AppFrameFocus (decisions §4)", () => {
  const show = (folio?: string) => (
    <AppFrame>
      <AppFrameFocus lockup={<AppLockup name="Lockdown" />} folio={folio}>
        <h1>Unlock Personal</h1>
        <Button block>Unlock</Button>
      </AppFrameFocus>
    </AppFrame>
  )

  it("is one centred column of 432 with the lockup at its top, and the page's main", () => {
    setViewport(1440, 900)
    render(show())
    const main = screen.getByRole("main")
    expect(main).toHaveAttribute("data-slot", "app-frame-focus")
    const column = main.querySelector('[data-slot="app-frame-focus-column"]')!
    expect(column.className).toContain("max-w-(--c-app-frame-focus)")
    expect(column).toHaveClass("mx-auto", "justify-center")
    expect(column.firstElementChild).toContainElement(screen.getByText("Lockdown"))
    expect(screen.getByRole("button", { name: "Unlock" })).toBeInTheDocument()
  })

  it("shows a folio for a flow of several steps, none for one", () => {
    setViewport(1440, 900)
    const { rerender } = render(show())
    expect(screen.queryByText(/Step/)).not.toBeInTheDocument()
    rerender(show("Step 01 // 04"))
    expect(screen.getByText("Step 01 // 04")).toHaveClass("type-folio")
  })

  it("is the screen's width on a phone, 16 from its sides", () => {
    setViewport(390, 844)
    render(show())
    expect(screen.getByRole("main")).toHaveClass("absolute", "inset-0")
    expect(screen.getByRole("main").firstElementChild).toHaveClass("px-4")
  })
})
