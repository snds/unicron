import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuWidth,
} from "./dropdown-menu"

const content = () => document.querySelector('[data-slot="dropdown-menu-content"]') as HTMLElement

function Subject({ width }: { width?: DropdownMenuWidth }) {
  return (
    <DropdownMenu open>
      <DropdownMenuTrigger>Change</DropdownMenuTrigger>
      <DropdownMenuContent width={width}>
        <DropdownMenuItem>Follow the system setting</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenuContent width", () => {
  it("matches its trigger by default, as before, never below the menu min", () => {
    render(<Subject />)
    const cls = content().className.split(" ")
    expect(content()).toHaveAttribute("data-width", "trigger")
    expect(cls).toEqual(expect.arrayContaining(["w-(--anchor-width)", "min-w-(--c-menu-min-width)"]))
    expect(cls).not.toContain("w-max")
  })

  it("fit: as wide as its items, at least the trigger, up to the menu max", () => {
    render(<Subject width="fit" />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining([
        "w-max",
        "min-w-[max(var(--c-menu-min-width),var(--anchor-width))]",
        "max-w-[min(var(--c-menu-max-width),var(--available-width))]",
      ])
    )
    expect(cls).not.toContain("w-(--anchor-width)")
  })

  it("auto: as wide as its items, whatever the trigger, between the menu min and max", () => {
    render(<Subject width="auto" />)
    const cls = content().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining(["w-max", "min-w-(--c-menu-min-width)", "max-w-[min(var(--c-menu-max-width),var(--available-width))]"])
    )
    expect(cls.some((c) => c.includes("--anchor-width"))).toBe(false)
  })

  it("a submenu sizes to its items by default (auto)", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuSub open>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Move to another project</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const sub = document.querySelector('[data-slot="dropdown-menu-sub-content"]') as HTMLElement
    expect(sub).toHaveAttribute("data-width", "auto")
  })
})
