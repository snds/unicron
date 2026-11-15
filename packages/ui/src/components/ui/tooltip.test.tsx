import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { Kbd } from "./kbd"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

const tip = () => document.querySelector('[data-slot="tooltip-content"]') as HTMLElement | null

describe("Tooltip", () => {
  it("is ink-inverted, in the caption role, square, with no arrow and no shadow", () => {
    render(
      <Tooltip open>
        <TooltipTrigger>Archive</TooltipTrigger>
        <TooltipContent>Archive this thread</TooltipContent>
      </Tooltip>
    )
    const cls = tip()!.className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-text-body", "text-surface-ground", "type-caption", "rounded", "max-w-(--c-tooltip-max-width)"]))
    expect(cls.some((c) => /shadow|blur|rounded-md|zoom|slide/.test(c))).toBe(false)
    expect(tip()!.querySelector('[class*="rotate-45"]')).toBeNull()
  })

  it("opens on hover and on keyboard focus, and closes on Escape", async () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Archive</TooltipTrigger>
          <TooltipContent>Archive this thread</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
    const trigger = screen.getByRole("button", { name: "Archive" })
    expect(tip()).toBeNull()
    await act(async () => {
      fireEvent.focus(trigger)
    })
    await act(async () => {
      trigger.focus()
      fireEvent.pointerEnter(trigger, { pointerType: "mouse" })
      fireEvent.mouseEnter(trigger)
      fireEvent.mouseMove(trigger)
    })
    await vi.waitFor(() => expect(tip()).not.toBeNull())
    expect(tip()).toHaveTextContent("Archive this thread")
    await act(async () => {
      fireEvent.keyDown(document.activeElement ?? trigger, { key: "Escape" })
    })
    await vi.waitFor(() => expect(tip()?.hasAttribute("data-open") ?? false).toBe(false))
  })

  it("a Kbd inside takes the tip's ink", () => {
    render(
      <Tooltip open>
        <TooltipTrigger>Search</TooltipTrigger>
        <TooltipContent>
          Search <Kbd>/</Kbd>
        </TooltipContent>
      </Tooltip>
    )
    const kbd = tip()!.querySelector('[data-slot="kbd"]') as HTMLElement
    expect(kbd.className).toContain("in-data-[slot=tooltip-content]:text-inherit")
    expect(tip()!.className).toContain("has-data-[slot=kbd]:pr-1")
  })

  it("wraps past its knob, 20rem", () => {
    const tokens = JSON.parse(readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component/overlays.json"), "utf8"))
    expect(tokens.tooltip["max-width"].$value).toBe("20rem")
  })
})
