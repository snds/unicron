import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { FilterChip, FilterChipGroup, filterChipVariants } from "./filter-chip"

describe("FilterChip (Figma 15:503)", () => {
  it("24 tall, 4 / 8 in, square corners, overline label; a touch reaches it across 44", () => {
    const classes = filterChipVariants().split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["h-6", "px-2", "py-1", "rounded-none", "type-overline", "hit-area"]))
    expect(classes.some((c) => /^rounded-(lg|md|sm|full)$/.test(c))).toBe(false)
  })

  it("off is label ink with no fill and the contract's washes; on is inverted ink, never the identity colour", () => {
    const off = filterChipVariants().split(/\s+/)
    expect(off).toEqual(expect.arrayContaining(["text-muted-foreground", "hover:bg-state-hover", "active:bg-state-pressed"]))
    expect(off.some((c) => /^bg-/.test(c))).toBe(false)
    const on = filterChipVariants({ active: true }).split(/\s+/)
    expect(on).toEqual(expect.arrayContaining(["bg-foreground", "text-background"]))
    expect(on.some((c) => /(^|:)bg-primary/.test(c))).toBe(false)
  })

  it("on its own it is a toggle button, its count part of its name", async () => {
    const onActiveChange = vi.fn()
    render(
      <FilterChip count={12} onActiveChange={onActiveChange}>
        All
      </FilterChip>
    )
    const chip = screen.getByRole("button", { name: "All 12", pressed: false })
    await userEvent.click(chip)
    expect(chip).toHaveAttribute("aria-pressed", "true")
    expect(onActiveChange).toHaveBeenLastCalledWith(true)
  })
})

describe("FilterChipGroup", () => {
  function Tasks(props: { onValueChange?: (v: string) => void }) {
    return (
      <FilterChipGroup label="Show tasks" defaultValue="all" onValueChange={props.onValueChange}>
        <FilterChip value="all" count={12}>All</FilterChip>
        <FilterChip value="running" count={3}>Running</FilterChip>
        <FilterChip value="waiting" count={1} disabled>Waiting</FilterChip>
        <FilterChip value="done" count={8}>Done</FilterChip>
      </FilterChipGroup>
    )
  }

  it("single is a radio group: one checked, one Tab stop", async () => {
    render(<Tasks />)
    expect(screen.getByRole("radiogroup", { name: "Show tasks" })).toBeInTheDocument()
    const all = screen.getByRole("radio", { name: "All 12" })
    expect(all).toHaveAttribute("aria-checked", "true")
    expect(all).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("radio", { name: "Running 03" })).toHaveAttribute("tabindex", "-1")
    await userEvent.tab()
    expect(all).toHaveFocus()
  })

  it("arrow keys move and choose, skip a disabled chip, wrap, and Home and End go to the ends", async () => {
    const onValueChange = vi.fn()
    render(<Tasks onValueChange={onValueChange} />)
    screen.getByRole("radio", { name: "All 12" }).focus()
    await userEvent.keyboard("{ArrowRight}")
    const running = screen.getByRole("radio", { name: "Running 03" })
    expect(running).toHaveFocus()
    expect(running).toHaveAttribute("aria-checked", "true")
    expect(onValueChange).toHaveBeenLastCalledWith("running")
    await userEvent.keyboard("{ArrowRight}")
    expect(screen.getByRole("radio", { name: "Done 08" })).toHaveFocus()
    await userEvent.keyboard("{ArrowDown}")
    expect(screen.getByRole("radio", { name: "All 12" })).toHaveFocus()
    await userEvent.keyboard("{ArrowLeft}")
    expect(screen.getByRole("radio", { name: "Done 08" })).toHaveFocus()
    await userEvent.keyboard("{Home}")
    expect(screen.getByRole("radio", { name: "All 12" })).toHaveAttribute("aria-checked", "true")
    await userEvent.keyboard("{End}")
    expect(screen.getByRole("radio", { name: "Done 08" })).toHaveAttribute("aria-checked", "true")
  })

  it("a click chooses; choosing the checked chip again changes nothing", async () => {
    const onValueChange = vi.fn()
    render(<Tasks onValueChange={onValueChange} />)
    await userEvent.click(screen.getByRole("radio", { name: "All 12" }))
    expect(onValueChange).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole("radio", { name: "Done 08" }))
    expect(onValueChange).toHaveBeenLastCalledWith("done")
  })

  it("multiple is a group of toggles", async () => {
    const onValueChange = vi.fn()
    render(
      <FilterChipGroup type="multiple" label="Search in" defaultValue={["mail"]} onValueChange={onValueChange}>
        <FilterChip value="mail">Mail</FilterChip>
        <FilterChip value="notes">Notes</FilterChip>
      </FilterChipGroup>
    )
    expect(screen.getByRole("group", { name: "Search in" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Mail", pressed: true })).toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: "Notes", pressed: false }))
    expect(onValueChange).toHaveBeenLastCalledWith(["mail", "notes"])
    await userEvent.click(screen.getByRole("button", { name: "Mail" }))
    expect(onValueChange).toHaveBeenLastCalledWith(["notes"])
  })

  it("scroll: one line that scrolls, no fade, room for the touch target; the action sits outside the scroll", () => {
    const { container } = render(
      <FilterChipGroup scroll label="Show" action={<button>Severity</button>}>
        <FilterChip value="all">All</FilterChip>
      </FilterChipGroup>
    )
    const list = container.querySelector('[data-slot="filter-chip-list"]') as HTMLElement
    expect(list.className.split(/\s+/)).toEqual(expect.arrayContaining(["flex-nowrap", "overflow-x-auto", "no-scrollbar", "pointer-coarse:py-2.5"]))
    expect(list.className).not.toMatch(/mask|gradient|fade/)
    const action = container.querySelector('[data-slot="filter-chip-group-action"]') as HTMLElement
    expect(list).not.toContainElement(action)
    expect(screen.getByRole("button", { name: "Severity" })).toBeInTheDocument()
  })

  it("chips are 8 apart, and wrap without scroll", () => {
    const { container } = render(
      <FilterChipGroup label="Show">
        <FilterChip value="all">All</FilterChip>
      </FilterChipGroup>
    )
    const list = container.querySelector('[data-slot="filter-chip-list"]') as HTMLElement
    expect(list.className.split(/\s+/)).toEqual(expect.arrayContaining(["gap-2", "flex-wrap"]))
  })
})

describe("FilterChip kinds: a trigger and a plain button (contract 5.1c C13, Warpcore NA2)", () => {
  it("trigger: a button with a trailing chevron--down and aria-haspopup, no pressed state, no on look", async () => {
    const onClick = vi.fn()
    render(
      <FilterChip kind="trigger" onClick={onClick}>
        Auto // Coding
      </FilterChip>
    )
    const chip = screen.getByRole("button", { name: "Auto // Coding" })
    expect(chip).toHaveAttribute("data-kind", "trigger")
    expect(chip).toHaveAttribute("aria-haspopup", "dialog")
    expect(chip).not.toHaveAttribute("aria-pressed")
    expect(chip).not.toHaveAttribute("data-active")
    expect(chip.querySelector('[data-icon-name="chevron--down"]')).toHaveAttribute("aria-hidden", "true")
    expect(chip.querySelector('[data-icon-name="chevron--down"]')).toHaveAttribute("width", "16")
    const cls = chip.className.split(/\s+/)
    // The off look, with the chevron 4 after the words; open, it keeps the pressed wash.
    expect(cls).toEqual(expect.arrayContaining(["text-muted-foreground", "gap-1", "aria-expanded:bg-state-pressed"]))
    expect(cls).not.toContain("bg-foreground")
    await userEvent.click(chip)
    await userEvent.click(chip)
    expect(onClick).toHaveBeenCalledTimes(2)
    // Pressing it twice never turns it on.
    expect(chip).not.toHaveAttribute("data-active")
  })

  it("button: a plain action, no chevron, no pressed state, no popup", async () => {
    const onClick = vi.fn()
    render(
      <FilterChip kind="button" onClick={onClick}>
        snds/lockdown // main
      </FilterChip>
    )
    const chip = screen.getByRole("button", { name: "snds/lockdown // main" })
    expect(chip).not.toHaveAttribute("aria-pressed")
    expect(chip).not.toHaveAttribute("aria-haspopup")
    expect(chip.querySelector('[data-icon-name="chevron--down"]')).toBeNull()
    await userEvent.click(chip)
    expect(onClick).toHaveBeenCalledOnce()
    expect(chip).not.toHaveAttribute("data-active")
  })

  it("an `active` given to either kind never draws the on look", () => {
    render(
      <>
        <FilterChip kind="trigger" active>
          General
        </FilterChip>
        <FilterChip kind="button" defaultActive>
          Envs
        </FilterChip>
      </>
    )
    for (const name of ["General", "Envs"]) {
      const chip = screen.getByRole("button", { name })
      expect(chip).not.toHaveAttribute("data-active")
      expect(chip.className.split(/\s+/)).not.toContain("bg-foreground")
    }
  })

  it("a group never counts them: they take no radio role, keep their own Tab stop, and leave the group's value alone", async () => {
    const onValueChange = vi.fn()
    render(
      <FilterChipGroup label="Who answers" defaultValue="auto" onValueChange={onValueChange} action={<FilterChip kind="trigger">More</FilterChip>}>
        <FilterChip value="auto">Auto</FilterChip>
        <FilterChip value="general">General</FilterChip>
        <FilterChip kind="button" value="envs">
          Envs
        </FilterChip>
      </FilterChipGroup>
    )
    expect(screen.getAllByRole("radio")).toHaveLength(2)
    const envs = screen.getByRole("button", { name: "Envs" })
    expect(envs).not.toHaveAttribute("tabindex", "-1")
    await userEvent.click(envs)
    await userEvent.click(screen.getByRole("button", { name: "More" }))
    expect(onValueChange).not.toHaveBeenCalled()
    expect(screen.getByRole("radio", { name: "Auto" })).toHaveAttribute("aria-checked", "true")
  })

  it("works as a layer's trigger: the trigger's ref and its aria-expanded reach the chip", async () => {
    const ref = { current: null as HTMLButtonElement | null }
    render(
      <FilterChip kind="trigger" ref={ref} aria-haspopup="menu" aria-expanded={true}>
        General
      </FilterChip>
    )
    const chip = screen.getByRole("button", { name: "General" })
    expect(ref.current).toBe(chip)
    expect(chip).toHaveAttribute("aria-haspopup", "menu")
    expect(chip).toHaveAttribute("aria-expanded", "true")
  })
})
