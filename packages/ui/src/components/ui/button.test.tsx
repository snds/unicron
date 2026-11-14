import { readdirSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button, buttonVariants } from "./button"

const VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "ghost-muted",
  "destructive",
  "ghost-destructive",
  "link",
  "needs-you",
  "needs-you-outline",
  "needs-you-text",
] as const
const NEEDS_YOU = ["needs-you", "needs-you-outline", "needs-you-text"] as const
const BOXED_SIZES = ["default", "sm", "lg", "xs"] as const
const classesOf = (props: Parameters<typeof buttonVariants>[0]) => buttonVariants(props).split(/\s+/)

// A link drawn as a button takes buttonVariants' classes straight into className, with no merge of
// its own. They arrive merged, so a caller's class replaces the variant's instead of sitting beside it.
describe("buttonVariants", () => {
  it("draws an outlined kind's edge inside the box, with no border of its own", () => {
    const classes = classesOf({ variant: "secondary" })
    expect(classes).toEqual(expect.arrayContaining(["inset-ring", "inset-ring-foreground", "text-foreground"]))
    expect(classes.some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
  })

  it("keeps a caller's class over the variant's", () => {
    const classes = classesOf({ variant: "secondary", className: "inset-ring-input" })
    expect(classes).toContain("inset-ring-input")
    expect(classes).not.toContain("inset-ring-foreground")
  })
})

describe("Button kinds (2026-11 direction, Figma 15:478)", () => {
  it("Primary is the primary fill with its on-fill label", () => {
    expect(classesOf({})).toEqual(expect.arrayContaining(["bg-primary", "text-primary-foreground"]))
  })

  it("outline is secondary under its older name", () => {
    expect(buttonVariants({ variant: "outline" })).toBe(buttonVariants({ variant: "secondary" }))
  })

  it("ghost is text only: no fill and no edge at rest, and the same padding as a boxed kind", () => {
    const classes = classesOf({ variant: "ghost" })
    expect(classes).toContain("text-foreground")
    expect(classes.some((c) => c.startsWith("bg-") || c.startsWith("inset-ring"))).toBe(false)
    expect(classes).toEqual(expect.arrayContaining(["h-10", "px-4"]))
  })

  it("destructive is the critical fill with its on-fill label", () => {
    expect(classesOf({ variant: "destructive" })).toEqual(expect.arrayContaining(["bg-critical-fill", "text-critical-on-fill"]))
  })

  it("the needs-you kinds swap the yellow's two colours and never use the page's ink", () => {
    expect(classesOf({ variant: "needs-you" })).toEqual(expect.arrayContaining(["bg-needs-you-on-fill", "text-needs-you-fill"]))
    expect(classesOf({ variant: "needs-you-outline" })).toEqual(
      expect.arrayContaining(["inset-ring", "inset-ring-needs-you-on-fill", "text-needs-you-on-fill"])
    )
    const text = classesOf({ variant: "needs-you-text" })
    expect(text).toContain("text-needs-you-on-fill")
    expect(text.some((c) => c.startsWith("bg-") || c.startsWith("inset-ring"))).toBe(false)
    // The same padding as the solid one, so the two line up side by side.
    for (const size of ["default", "sm"] as const) {
      const padding = (variant: (typeof NEEDS_YOU)[number]) => classesOf({ variant, size }).filter((c) => /^(h|px|py)-/.test(c))
      expect(padding("needs-you-text")).toEqual(padding("needs-you"))
    }
    for (const variant of NEEDS_YOU) {
      const classes = classesOf({ variant })
      expect(classes.some((c) => /(^|:)(bg|text|inset-ring)-(foreground|state-)/.test(c))).toBe(false)
    }
  })

  it("every kind names its own label ink (the overline role would otherwise make it label grey)", () => {
    for (const variant of VARIANTS) expect(classesOf({ variant }).some((c) => c.startsWith("text-"))).toBe(true)
  })
})

describe("Button sizes", () => {
  it("M is 40 tall with 12 / 16 padding, S is 32 with 8 / 12, lg is the control height", () => {
    expect(classesOf({ size: "default" })).toEqual(expect.arrayContaining(["h-10", "px-4", "py-3"]))
    expect(classesOf({ size: "sm" })).toEqual(expect.arrayContaining(["h-8", "px-3", "py-2"]))
    expect(classesOf({ size: "lg" })).toEqual(expect.arrayContaining(["h-control", "px-4"]))
  })

  it("the icon sizes are squares of the same heights", () => {
    expect(classesOf({ size: "icon" })).toContain("size-10")
    expect(classesOf({ size: "icon-sm" })).toContain("size-8")
    expect(classesOf({ size: "icon-lg" })).toContain("size-control")
  })

  it("older size names still work, as the nearest of the three", () => {
    expect(buttonVariants({ size: "xs" })).toBe(buttonVariants({ size: "sm" }))
    expect(buttonVariants({ size: "icon-xs" })).toBe(buttonVariants({ size: "icon-sm" }))
  })

  it("the label is the mono caps overline at every boxed size, with an 8px gap to a 16px icon", () => {
    for (const size of BOXED_SIZES) {
      const classes = classesOf({ size })
      expect(classes).toEqual(expect.arrayContaining(["type-overline", "gap-2", "[&_svg:not([class*='size-'])]:size-4"]))
    }
  })

  it("a size under 44px widens its touch target on a coarse pointer; 48 needs none", () => {
    for (const size of ["default", "sm", "xs", "icon", "icon-sm", "icon-xs"] as const) expect(classesOf({ size })).toContain("hit-area")
    for (const size of ["lg", "icon-lg"] as const) expect(classesOf({ size })).not.toContain("hit-area")
  })

  it("an inline text action keeps the sentence's own type, and is underlined at rest", () => {
    const classes = classesOf({ variant: "link", size: "inline" })
    expect(classes).toContain("underline")
    expect(classes).not.toContain("type-overline")
    expect(classes).not.toContain("hit-area")
  })

  it("the corner is the control radius, and shape=\"pill\" no longer rounds it", () => {
    expect(classesOf({})).toContain("rounded-lg")
    const pill = classesOf({ shape: "pill" })
    expect(pill).toContain("rounded-lg")
    expect(pill).not.toContain("rounded-full")
    expect(buttonVariants({ shape: "pill", size: "sm" })).toBe(buttonVariants({ size: "sm" }))
  })

  it("block stretches to the container", () => {
    expect(classesOf({ block: true })).toEqual(expect.arrayContaining(["flex", "w-full"]))
    expect(classesOf({})).not.toContain("w-full")
  })
})

describe("Button focus and invalid edges", () => {
  // The ring is one rule in the stylesheet for every control (:focus-visible, 2px solid --ring,
  // 2px clear). A control gets it by not resetting it.
  it("no kind resets the shared focus ring or draws one of its own", () => {
    for (const variant of VARIANTS) {
      const classes = classesOf({ variant })
      expect(classes.some((c) => /(^|:)outline-(none|hidden)$/.test(c))).toBe(false)
      expect(classes.some((c) => c.startsWith("focus-visible:"))).toBe(false)
    }
  })

  it("on the yellow the ring takes the ink that sits on the yellow", () => {
    for (const variant of NEEDS_YOU) expect(classesOf({ variant })).toContain("on-needs-you")
    for (const variant of VARIANTS.filter((v) => !v.startsWith("needs-you"))) expect(classesOf({ variant })).not.toContain("on-needs-you")
  })

  it("an invalid button takes a 2px inside edge in the critical fill, as an invalid field does", () => {
    expect(classesOf({})).toEqual(expect.arrayContaining(["aria-invalid:inset-ring-2", "aria-invalid:inset-ring-critical-fill"]))
  })

  it("no primitive draws the pre-1.0 invalid ring (nothing measures it any more)", () => {
    // The pre-1.0 fields drew aria-invalid:ring-destructive/80 (stone) and dark:…/50 (graphite),
    // gated by a temporary contrast file (recipes/legacy-fields.mjs). Round 2 restyled every field
    // to the 2px critical inside edge, and that file is gone, so a ring that came back would be
    // unmeasured.
    const dir = import.meta.dirname
    const found = readdirSync(dir)
      .filter((f) => f.endsWith(".tsx") && !f.endsWith(".test.tsx"))
      .flatMap((f) => readFileSync(resolve(dir, f), "utf8").match(/\S*ring-destructive\/\d+/g) ?? [])
    expect(found).toEqual([])
  })
})

describe("Button states", () => {
  it.each(VARIANTS)("%s has a pressed fill or ink that differs from its hover", (variant) => {
    const classes = classesOf({ variant })
    const hover = classes.filter((c) => /^hover:(bg|text)-/.test(c)).map((c) => c.slice("hover:".length))
    const active = classes.filter((c) => /^active:(bg|text)-/.test(c)).map((c) => c.slice("active:".length))
    expect(active.length).toBeGreaterThan(0)
    expect(active.some((a) => !hover.includes(a))).toBe(true)
  })

  it("solid kinds go to 90% under the pointer and 80% when pressed", () => {
    expect(classesOf({})).toEqual(expect.arrayContaining(["hover:bg-primary/90", "active:bg-primary/80"]))
    expect(classesOf({ variant: "destructive" })).toEqual(expect.arrayContaining(["hover:bg-critical-fill/90", "active:bg-critical-fill/80"]))
    expect(classesOf({ variant: "needs-you" })).toEqual(expect.arrayContaining(["hover:bg-needs-you-on-fill/90", "active:bg-needs-you-on-fill/80"]))
  })

  it("transparent kinds take the hover and pressed washes", () => {
    for (const variant of ["secondary", "outline", "ghost", "ghost-muted"] as const) {
      expect(classesOf({ variant })).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    }
  })

  it("ghost-destructive becomes the critical fill under the pointer, so it shows on any surface", () => {
    const classes = classesOf({ variant: "ghost-destructive" })
    expect(classes).toEqual(expect.arrayContaining(["text-destructive", "hover:bg-critical-fill", "hover:text-critical-on-fill"]))
    expect(classes).not.toContain("hover:bg-state-hover")
  })

  it("disabled is half strength and takes no pointer", () => {
    expect(classesOf({})).toEqual(expect.arrayContaining(["disabled:pointer-events-none", "disabled:opacity-50"]))
  })

  it("transitions on the motion roles, not transition-all on Tailwind's curve", () => {
    const classes = classesOf({})
    expect(classes).not.toContain("transition-all")
    expect(classes.some((c) => c.startsWith("transition-["))).toBe(true)
  })
})

describe("Button", () => {
  it("is a button named by its label, and says its kind and size", async () => {
    const onClick = vi.fn()
    render(
      <Button variant="secondary" size="sm" onClick={onClick}>
        Review diff
      </Button>
    )
    const button = screen.getByRole("button", { name: "Review diff" })
    expect(button).toHaveAttribute("data-slot", "button")
    expect(button).toHaveAttribute("data-variant", "secondary")
    expect(button).toHaveAttribute("data-size", "sm")
    expect(button).toHaveAttribute("type", "button")
    await userEvent.setup().click(button)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("runs from the keyboard with Enter and with Space", async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={onClick}>Review diff</Button>)
    await user.tab()
    expect(screen.getByRole("button", { name: "Review diff" })).toHaveFocus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it("disabled takes no press", () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Review diff
      </Button>
    )
    const button = screen.getByRole("button", { name: "Review diff" })
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("loading says it is busy, takes no press, and keeps its label and a spinner", () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Review diff
      </Button>
    )
    // The name stays the label: the spinner is decoration, aria-busy says the rest.
    const button = screen.getByRole("button", { name: "Review diff" })
    expect(button).toHaveAttribute("aria-busy", "true")
    expect(button).toHaveAttribute("aria-disabled", "true")
    const spinner = button.querySelector('[data-slot="button-spinner"]')!
    expect(spinner).toHaveAttribute("aria-hidden", "true")
    expect(spinner.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
    expect(button.firstElementChild).toBe(spinner)
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("loading keeps the button in the tab order, so focus is not lost when it goes busy", async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Button>Review diff</Button>)
    await user.tab()
    const button = screen.getByRole("button", { name: "Review diff" })
    expect(button).toHaveFocus()
    rerender(<Button loading>Review diff</Button>)
    expect(button).toHaveFocus()
    expect(button).not.toHaveAttribute("disabled")
    // Busy is not dimmed (it is not unavailable); its own icon gives way to the spinner.
    expect(button.className).toContain("aria-disabled:not-aria-busy:opacity-50")
    expect(button.className).toContain("aria-busy:[&>svg]:hidden")
  })

  it("a button that is not loading says nothing about busy", () => {
    render(<Button>Review diff</Button>)
    const button = screen.getByRole("button", { name: "Review diff" })
    expect(button).not.toHaveAttribute("aria-busy")
    expect(button.querySelector('[data-slot="button-spinner"]')).toBeNull()
  })

  it("block and a caller's className reach the element", () => {
    render(
      <Button block className="mt-2">
        Compose
      </Button>
    )
    const classes = screen.getByRole("button", { name: "Compose" }).className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["w-full", "mt-2"]))
  })
})

describe("Button disabledReason (contract 5.1b #37)", () => {
  it("disabled with a reason stays in the tab order, shows the line and is described by it", async () => {
    const onClick = vi.fn()
    render(
      <Button disabled disabledReason="Fix or remove the address in red." onClick={onClick}>
        Send
      </Button>
    )
    const send = screen.getByRole("button", { name: "Send" })
    expect(send).toHaveAttribute("aria-disabled", "true")
    expect(send).not.toHaveAttribute("disabled")
    expect(send).toHaveAccessibleDescription("Fix or remove the address in red.")
    expect(screen.getByText("Fix or remove the address in red.")).toHaveAttribute("data-slot", "disabled-reason")
    await userEvent.tab()
    expect(send).toHaveFocus()
    await userEvent.keyboard("{Enter}")
    fireEvent.click(send)
    expect(onClick).not.toHaveBeenCalled()
  })

  it("the reason shows only while the button is disabled", () => {
    render(<Button disabledReason="Offline.">Share</Button>)
    expect(screen.getByRole("button", { name: "Share" })).not.toHaveAttribute("aria-disabled")
    expect(screen.queryByText("Offline.")).toBeNull()
  })

  it("keeps its own description beside the reason", () => {
    render(
      <>
        <span id="cost">Costs about $0.40.</span>
        <Button disabled disabledReason="Over today's budget." aria-describedby="cost">
          Start
        </Button>
      </>
    )
    expect(screen.getByRole("button", { name: "Start" })).toHaveAccessibleDescription("Costs about $0.40. Over today's budget.")
  })
})
