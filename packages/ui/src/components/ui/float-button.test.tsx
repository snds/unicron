import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { FloatButton, floatButtonLongPressKeys, floatButtonVariants } from "./float-button"

const classesOf = (props?: Parameters<typeof floatButtonVariants>[0]) => floatButtonVariants(props).split(/\s+/)

describe("FloatButton (Figma 20:1690)", () => {
  it("is a button named by its label, with the glyph inside and hidden from assistive tech", () => {
    render(<FloatButton label="Search" icon="search" />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).toHaveAttribute("data-slot", "float-button")
    expect(button).toHaveAttribute("data-kind", "neutral")
    expect(button).toHaveAttribute("data-size", "m")
    expect(button).toHaveAttribute("type", "button")
    const glyph = button.querySelector('[data-slot="icon"]')!
    expect(glyph).toHaveAttribute("aria-hidden", "true")
  })

  it("neutral is the raised surface with a hairline and an ink glyph; primary is the identity fill", () => {
    expect(classesOf()).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "text-foreground"]))
    const primary = classesOf({ kind: "primary" })
    expect(primary).toEqual(expect.arrayContaining(["bg-primary", "text-primary-foreground"]))
    expect(primary).not.toContain("rule-box")
  })

  it("m is the touch floor (44), l is the control size (48), square, on the control radius, with a 20px glyph", () => {
    expect(classesOf({ size: "m" })).toContain("size-touch-min")
    expect(classesOf({ size: "l" })).toContain("size-control")
    expect(classesOf()).toEqual(expect.arrayContaining(["rounded-lg", "[&_svg]:size-5"]))
  })

  it("casts no shadow, and leaves the stylesheet's focus ring alone", () => {
    for (const props of [{ kind: "neutral" }, { kind: "primary" }, { current: true }] as const) {
      const classes = classesOf(props)
      expect(classes.some((c) => /(^|:)shadow/.test(c))).toBe(false)
      expect(classes.some((c) => /(^|:)outline-(none|hidden)$/.test(c) || c.startsWith("focus-visible:"))).toBe(false)
    }
  })

  it("every fill is opaque, hover and pressed included: it floats over content", () => {
    for (const props of [{ kind: "neutral" }, { kind: "primary" }, { current: true }] as const) {
      const fills = classesOf(props).filter((c) => /(^|:)bg-/.test(c))
      expect(fills.length).toBeGreaterThanOrEqual(3)
      // No alpha modifier (bg-primary/90) and no translucent wash role.
      for (const fill of fills) expect(fill).not.toMatch(/\/\d+$|state-(hover|pressed)/)
    }
  })

  it("current draws inverted ink for either kind, never a second primary fill", () => {
    for (const kind of ["neutral", "primary"] as const) {
      const classes = classesOf({ kind, current: true })
      expect(classes).toEqual(expect.arrayContaining(["bg-foreground", "text-background"]))
      expect(classes).not.toContain("bg-primary")
      expect(classes).not.toContain("rule-box")
    }
  })

  it("current says aria-current: true, or page for a place in the app", () => {
    const { rerender } = render(<FloatButton label="Filter" icon="filter" current />)
    const button = screen.getByRole("button", { name: "Filter" })
    expect(button).toHaveAttribute("aria-current", "true")
    expect(button).toHaveAttribute("data-current")
    expect(button.className).toContain("bg-foreground")
    rerender(<FloatButton label="Filter" icon="filter" current="page" />)
    expect(button).toHaveAttribute("aria-current", "page")
    rerender(<FloatButton label="Filter" icon="filter" />)
    expect(button).not.toHaveAttribute("aria-current")
    expect(button).not.toHaveAttribute("data-current")
    expect(button.className).not.toContain("bg-foreground")
  })

  it("an on/off tool passes aria-pressed and draws the same", () => {
    render(<FloatButton label="Context panel" icon="settings" aria-pressed />)
    const button = screen.getByRole("button", { name: "Context panel", pressed: true })
    expect(button).toHaveAttribute("data-current")
    expect(button).not.toHaveAttribute("aria-current")
    expect(button.className).toContain("bg-foreground")
  })

  it("runs its click from a pointer and from the keyboard", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<FloatButton label="Search" icon="search" onClick={onClick} />)
    await user.click(screen.getByRole("button", { name: "Search" }))
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  it("disabled disables the button itself", () => {
    const onClick = vi.fn()
    const onLongPress = vi.fn()
    render(<FloatButton label="Search" icon="search" disabled onClick={onClick} onLongPress={onLongPress} />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    fireEvent.contextMenu(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it("takes children instead of an icon, and a caller's className", () => {
    render(
      <FloatButton label="Mira Chen" className="ml-auto">
        <span data-testid="initials">MC</span>
      </FloatButton>
    )
    const button = screen.getByRole("button", { name: "Mira Chen" })
    expect(button).toContainElement(screen.getByTestId("initials"))
    expect(button.className.split(/\s+/)).toContain("ml-auto")
  })

  it("passes its ref and props to the button, so it can be another control's render", () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(<FloatButton ref={ref} label="Close" icon="close" size="l" aria-haspopup="menu" />)
    expect(ref.current).toBe(screen.getByRole("button", { name: "Close" }))
    expect(ref.current).toHaveAttribute("aria-haspopup", "menu")
  })

  it("extended shows its word beside the glyph (contract 5.1b #3): the same height, as wide as it needs, mono caps", () => {
    render(<FloatButton label="Approve" icon="checkmark" kind="primary" size="l" extended />)
    const button = screen.getByRole("button", { name: "Approve" })
    expect(button).toHaveAttribute("data-extended")
    expect(button.querySelector('[data-slot="float-button-word"]')).toHaveTextContent("Approve")
    const classes = button.className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["h-control", "px-4", "gap-2", "type-overline", "bg-primary", "text-primary-foreground"]))
    expect(classes).not.toContain("size-control")
    expect(classesOf({ size: "m", extended: true })).toEqual(expect.arrayContaining(["h-touch-min", "px-4"]))
    expect(classesOf({ size: "m", extended: true })).not.toContain("size-touch-min")
  })

  it("an extended button needs no tooltip: its word is there", async () => {
    const user = userEvent.setup()
    render(<FloatButton label="Share" icon="share" extended />)
    await user.tab()
    expect(screen.getAllByText("Share")).toHaveLength(1)
  })

  it("an extended button keeps the long press", () => {
    const onLongPress = vi.fn()
    render(<FloatButton label="Approve" icon="checkmark" kind="primary" extended onLongPress={onLongPress} />)
    const button = screen.getByRole("button", { name: "Approve" })
    expect(button).toHaveAttribute("aria-keyshortcuts", floatButtonLongPressKeys)
    fireEvent.keyDown(button, { key: "Enter", shiftKey: true })
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("takes the mark every navigation item shares: at the glyph's corner, its words in the name", () => {
    render(<FloatButton label="Settings" icon="settings" size="l" mark={{ square: true, label: "Update ready" }} />)
    const button = screen.getByRole("button", { name: "Settings, Update ready" })
    const glyph = button.querySelector('[data-slot="float-button-glyph"]')!
    expect(glyph.className).toContain("relative")
    expect(glyph.querySelector('[data-slot="nav-mark"]')).toHaveAttribute("data-kind", "square")
  })

  it("takes the very mark the nav items take (contract 5.1c C1): a count, a needs-you count, a square; its words join the name", () => {
    render(
      <>
        <FloatButton label="Comments" icon="chat" mark={3} />
        <FloatButton label="Requests" icon="notification" mark={{ count: 2, tone: "needs-you" }} />
        <FloatButton label="View options" icon="filter" mark={{ square: true, label: "Filter on" }} />
        <FloatButton label="Inbox" icon="email" mark={0} />
      </>
    )
    const comments = screen.getByRole("button", { name: "Comments, 3" })
    expect(comments.querySelector('[data-slot="nav-mark"]')).toHaveTextContent("03")
    const requests = screen.getByRole("button", { name: "Requests, 2 waiting on you" })
    expect(requests.querySelector('[data-slot="nav-mark"]')).toHaveAttribute("data-tone", "needs-you")
    expect(screen.getByRole("button", { name: "View options, Filter on" }).querySelector('[data-slot="nav-mark"]')).toHaveAttribute("data-kind", "square")
    // A count of 0 draws nothing and says nothing.
    const inbox = screen.getByRole("button", { name: "Inbox" })
    expect(inbox.querySelector('[data-slot="nav-mark"]')).toBeNull()
  })

  it("on a current button the mark takes the ground, so it does not vanish into the inverted ink", () => {
    render(
      <>
        <FloatButton label="Settings" icon="settings" current="page" mark={{ square: true, label: "Update ready" }} />
        <FloatButton label="Comments" icon="chat" current mark={3} />
        <FloatButton label="Requests" icon="notification" current mark={{ count: 2, tone: "needs-you" }} />
      </>
    )
    const square = screen.getByRole("button", { name: "Settings, Update ready" }).querySelector('[data-slot="nav-mark"]')!
    expect(square.className.split(/\s+/)).toContain("bg-background")
    expect(square.className.split(/\s+/)).not.toContain("bg-foreground")
    const count = screen.getByRole("button", { name: "Comments, 3" }).querySelector('[data-slot="nav-mark"]')!
    expect(count.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-background", "text-foreground"]))
    // The yellow stays the yellow.
    const waiting = screen.getByRole("button", { name: "Requests, 2 waiting on you" }).querySelector('[data-slot="nav-mark"]')!
    expect(waiting.className.split(/\s+/)).toContain("bg-needs-you-fill")
  })

  it("a key hint is said through aria-keyshortcuts, with the long press's keys after it, and shows in the tooltip, not on the glyph (contract 5.1c C2)", async () => {
    const user = userEvent.setup()
    render(<FloatButton label="Search" icon="search" mark={{ keys: "/" }} onLongPress={() => {}} longPressLabel="Search everything" />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).toHaveAttribute("aria-keyshortcuts", `/ ${floatButtonLongPressKeys}`)
    expect(button.querySelector("kbd")).toBeNull()
    await user.tab()
    const kbd = await screen.findByText("/", { selector: '[data-slot="nav-mark-keys"]' })
    expect(kbd.tagName).toBe("KBD")
  })

  it("shows its label as a tooltip on focus", async () => {
    const user = userEvent.setup()
    render(<FloatButton label="Search" icon="search" />)
    await user.tab()
    expect(await screen.findByText("Search")).toBeInTheDocument()
  })
})

describe("FloatButton long press", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  function setup(extra: { onPointerDown?: () => void } = {}) {
    const onClick = vi.fn()
    const onLongPress = vi.fn()
    render(<FloatButton label="Create" icon="add" kind="primary" size="l" onClick={onClick} onLongPress={onLongPress} longPressLabel="Quick create" {...extra} />)
    return { button: screen.getByRole("button", { name: "Create" }), onClick, onLongPress }
  }
  const hold = (ms: number) => act(() => void vi.advanceTimersByTime(ms))

  it("runs after about half a second of holding, and not before", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(499)
    expect(onLongPress).not.toHaveBeenCalled()
    hold(1)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("swallows the click that ends the hold, then clicks as usual again", () => {
    const { button, onClick, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(500)
    fireEvent.pointerUp(button)
    fireEvent.click(button)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("a hold released away from the button does not swallow the next press", () => {
    const { button, onClick, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(500)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    // Lifted over the menu the hold opened: the button gets no pointerup and no click.
    fireEvent.pointerUp(document.body)
    hold(0)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("a right click after a hold still runs the long-press action", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(500)
    fireEvent.pointerDown(button, { button: 2, clientX: 20, clientY: 20 })
    fireEvent.contextMenu(button)
    expect(onLongPress).toHaveBeenCalledTimes(2)
  })

  it("a short press is a click, not a long press", () => {
    const { button, onClick, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(200)
    fireEvent.pointerUp(button)
    fireEvent.click(button)
    hold(1000)
    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("is called off by movement past the slop, but not by a small drift", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerMove(button, { clientX: 26, clientY: 24 })
    hold(500)
    expect(onLongPress).toHaveBeenCalledTimes(1)

    fireEvent.pointerUp(button)
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerMove(button, { clientX: 20, clientY: 40 })
    hold(1000)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("is called off when the pointer leaves, or the browser takes the touch for a scroll", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerLeave(button)
    hold(1000)
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    fireEvent.pointerCancel(button)
    hold(1000)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it("ignores the secondary mouse button: a right click arrives as the context menu", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 2, clientX: 20, clientY: 20 })
    hold(1000)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it("the same action runs from the keyboard on Shift+Enter, without the click", () => {
    const { button, onClick, onLongPress } = setup()
    expect(fireEvent.keyDown(button, { key: "Enter", shiftKey: true })).toBe(false)
    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
    // Plain Enter is still the button's own action, and a held key does not repeat the long press.
    fireEvent.keyDown(button, { key: "Enter", shiftKey: true, repeat: true })
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("and from the context-menu key or a right click, with the browser's own menu held back", () => {
    const { button, onLongPress } = setup()
    expect(fireEvent.contextMenu(button)).toBe(false)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("a touch long press that also raises a context menu runs the action once", () => {
    const { button, onLongPress } = setup()
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    hold(500)
    fireEvent.contextMenu(button)
    expect(onLongPress).toHaveBeenCalledTimes(1)
  })

  it("tells assistive tech the key and what it does, and keeps the caller's own handlers", () => {
    const onPointerDown = vi.fn()
    const { button } = setup({ onPointerDown })
    expect(button).toHaveAttribute("aria-keyshortcuts", floatButtonLongPressKeys)
    expect(button).toHaveAccessibleDescription(`Quick create: hold, or press ${floatButtonLongPressKeys}`)
    // The description is not part of the name.
    expect(button).toHaveAccessibleName("Create")
    fireEvent.pointerDown(button, { button: 0, clientX: 20, clientY: 20 })
    expect(onPointerDown).toHaveBeenCalledTimes(1)
  })

  it("a button with no long press has none of it", () => {
    render(<FloatButton label="Search" icon="search" />)
    const button = screen.getByRole("button", { name: "Search" })
    expect(button).not.toHaveAttribute("aria-keyshortcuts")
    expect(button).not.toHaveAttribute("aria-describedby")
    // The browser's context menu is left alone.
    expect(fireEvent.contextMenu(button)).toBe(true)
  })

  it("stops waiting when it unmounts mid-hold", () => {
    const onLongPress = vi.fn()
    const { unmount } = render(<FloatButton label="Create" icon="add" onLongPress={onLongPress} />)
    fireEvent.pointerDown(screen.getByRole("button", { name: "Create" }), { button: 0, clientX: 20, clientY: 20 })
    unmount()
    hold(1000)
    expect(onLongPress).not.toHaveBeenCalled()
  })
})
