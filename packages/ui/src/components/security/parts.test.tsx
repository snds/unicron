import { fireEvent, render, screen } from "@testing-library/react"

import { ReviewFrame, TextAction, formatCountdown, rowClasses } from "./parts"

describe("formatCountdown: the cross-app words (decisions §13)", () => {
  it("is NN S under a minute and MM:SS from it, with a leading zero (the one shared helper)", () => {
    expect(formatCountdown(4)).toBe("04 S")
    expect(formatCountdown(18.2)).toBe("19 S")
    expect(formatCountdown(59)).toBe("59 S")
    expect(formatCountdown(60)).toBe("01:00")
    expect(formatCountdown(100)).toBe("01:40")
    expect(formatCountdown(600)).toBe("10:00")
    expect(formatCountdown(-3)).toBe("00 S")
  })
})

describe("TextAction: Field Row's bare word", () => {
  it("is a real button in the overline role that takes a touch across 44px", () => {
    const onClick = vi.fn()
    render(<TextAction onClick={onClick}>Copy</TextAction>)
    const b = screen.getByRole("button", { name: "Copy" })
    expect(b).toHaveClass("type-overline", "hit-area", "hover:bg-state-hover", "active:bg-state-pressed")
    // No outline-none: the stylesheet's one focus ring shows on it.
    expect(b.className).not.toContain("outline-none")
    fireEvent.click(b)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})

describe("rowClasses: the Field Row sizes", () => {
  it("default keeps the 140 label column on the value's baseline; stacked puts the label over it", () => {
    // The shared Field Row's own knob: one label column for every row that draws the look.
    expect(rowClasses("default").label).toContain("w-(--c-field-row-label-width)")
    expect(rowClasses("default").inner).toContain("items-baseline")
    expect(rowClasses("stacked").body).toContain("flex-col")
    expect(rowClasses("auto").inner).toContain("@max-lg/row:items-center")
    expect(rowClasses("auto").root).toContain("rule-t")
  })
})

/** Sets the window's width, as the adaptive layers read it (`useViewport`). Returns the undo. */
function screenWidth(width: number) {
  const before = window.innerWidth
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width })
  window.dispatchEvent(new Event("resize"))
  return () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: before })
    window.dispatchEvent(new Event("resize"))
  }
}

describe("ReviewFrame: a sheet on a phone, a dialog wider", () => {
  let restore: (() => void) | undefined
  afterEach(() => {
    restore?.()
    restore = undefined
  })

  it("is a modal dialog named by its title, with the overline and a close float button", () => {
    restore = screenWidth(1024)
    const onOpenChange = vi.fn()
    render(
      <ReviewFrame open onOpenChange={onOpenChange} overline="Sign-in request" title="Steam on a Windows PC" footer={<span>footer</span>}>
        <p>body</p>
      </ReviewFrame>
    )
    const dialog = screen.getByRole("dialog", { name: "Steam on a Windows PC" })
    expect(dialog).toHaveAttribute("data-size", "review")
    expect(dialog).toHaveAttribute("data-form", "dialog")
    // The shared Dialog's own size and margin (contract 5.1c C10: the screen less 48), not a copy.
    expect(dialog.className).toContain("data-[form=dialog]:w-[min(var(--c-dialog-review-min-width),calc(100%-2*var(--c-dialog-margin)))]")
    expect(dialog.className).toContain("data-[form=dialog]:max-h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]")
    expect(dialog.className).not.toMatch(/c-review-(question-|viewer-)?width|(^|\s)(max-)?sm:/)
    expect(dialog.className).toContain("bg-surface-raised")
    // No blur, no shadow: the scrim and a hairline set it apart.
    expect(dialog.className).not.toMatch(/blur|shadow/)
    expect(document.querySelector('[data-slot="review-scrim"]')!.className).toContain("scrim-dialog")
    expect(screen.getByText("Sign-in request")).toHaveClass("type-overline")
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("without a close control when asked, and full screen on a phone for a viewer", () => {
    render(
      <ReviewFrame open onOpenChange={() => {}} title="Wi-Fi password · Home" size="viewer" fullscreenOnPhone showClose={false}>
        <p>body</p>
      </ReviewFrame>
    )
    const dialog = screen.getByRole("dialog", { name: "Wi-Fi password · Home" })
    expect(dialog.className).toContain("data-[form=sheet]:h-dvh")
    expect(document.querySelector('[data-slot="review-grabber"]')).toBeNull()
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })

  // Every adaptive layer is a sheet in the compact width class (under 600) and its desktop form
  // from there. The frame used a CSS breakpoint at 640, so at 600 to 639 it alone was a sheet.
  it("switches form where the adaptive layers do: a sheet under 600, a dialog from 600", () => {
    for (const [width, form, scrim, close] of [
      [390, "sheet", "scrim-sheet", "size-control"],
      [599, "sheet", "scrim-sheet", "size-control"],
      [600, "dialog", "scrim-dialog", "size-touch-min"],
      [639, "dialog", "scrim-dialog", "size-touch-min"],
    ] as const) {
      restore?.()
      restore = screenWidth(width)
      const { unmount } = render(
        <ReviewFrame open onOpenChange={() => {}} title="Steam on a Windows PC">
          <p>body</p>
        </ReviewFrame>
      )
      expect(screen.getByRole("dialog"), `${width}`).toHaveAttribute("data-form", form)
      expect(document.querySelector('[data-slot="review-scrim"]')!.className.split(/\s+/), `${width}`).toContain(scrim)
      // The close float button: L (48) on the sheet, M (44) on the dialog.
      expect(screen.getByRole("button", { name: "Close" }).className, `${width}`).toContain(close)
      unmount()
    }
  })
})
