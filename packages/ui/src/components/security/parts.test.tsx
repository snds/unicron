import { fireEvent, render, screen } from "@testing-library/react"

import { ReviewFrame, TextAction, formatCountdown, rowClasses } from "./parts"

describe("formatCountdown: the cross-app words (decisions §13)", () => {
  it("is NN s up to a minute and MM:SS past it, with a leading zero", () => {
    expect(formatCountdown(4)).toBe("4 s")
    expect(formatCountdown(18.2)).toBe("19 s")
    expect(formatCountdown(60)).toBe("60 s")
    expect(formatCountdown(100)).toBe("01:40")
    expect(formatCountdown(600)).toBe("10:00")
    expect(formatCountdown(-3)).toBe("0 s")
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
    expect(rowClasses("default").label).toContain("w-(--c-security-row-label-width)")
    expect(rowClasses("default").inner).toContain("items-baseline")
    expect(rowClasses("stacked").body).toContain("flex-col")
    expect(rowClasses("auto").inner).toContain("@max-lg/row:items-center")
    expect(rowClasses("auto").root).toContain("rule-t")
  })
})

describe("ReviewFrame: a sheet on a phone, a dialog wider", () => {
  it("is a modal dialog named by its title, with the overline and a close float button", () => {
    const onOpenChange = vi.fn()
    render(
      <ReviewFrame open onOpenChange={onOpenChange} overline="Sign-in request" title="Steam on a Windows PC" footer={<span>footer</span>}>
        <p>body</p>
      </ReviewFrame>
    )
    const dialog = screen.getByRole("dialog", { name: "Steam on a Windows PC" })
    expect(dialog).toHaveAttribute("data-size", "review")
    expect(dialog.className).toContain("sm:w-[min(var(--c-review-width),calc(100vw-(--spacing(8))))]")
    expect(dialog.className).toContain("bg-surface-raised")
    // No blur, no shadow: the scrim and a hairline set it apart.
    expect(dialog.className).not.toMatch(/blur|shadow/)
    expect(document.querySelector('[data-slot="review-scrim"]')!.className).toContain("scrim-sheet")
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
    expect(dialog.className).toContain("max-sm:h-dvh")
    expect(document.querySelector('[data-slot="review-grabber"]')).toBeNull()
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
  })
})
