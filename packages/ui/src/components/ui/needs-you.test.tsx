import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { NeedsYou } from "./needs-you"

const classesOf = (el: Element) => el.className.split(/\s+/)

function Block(props: Partial<React.ComponentProps<typeof NeedsYou>>) {
  return (
    <NeedsYou
      title="Awaiting your review // SEA-51"
      body="Claude Code changed 6 files."
      action={<Button variant="needs-you">Review diff</Button>}
      secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
      {...props}
    />
  )
}

describe("NeedsYou (Figma 15:517)", () => {
  it("is a region named by its title and described by its body", () => {
    render(<Block />)
    const region = screen.getByRole("region", { name: "Awaiting your review // SEA-51" })
    expect(region.tagName).toBe("SECTION")
    expect(region).toHaveAccessibleDescription("Claude Code changed 6 files.")
  })

  it("carries data-slot=needs-you, so every focus ring inside takes the yellow's ink", () => {
    render(<Block />)
    expect(screen.getByRole("region")).toHaveAttribute("data-slot", "needs-you")
  })

  it("pins the drawn block: the yellow, 24 in, 16 between, no corner; overline title, body/strong", () => {
    render(<Block />)
    const region = screen.getByRole("region")
    expect(classesOf(region)).toEqual(expect.arrayContaining(["bg-needs-you-fill", "text-needs-you-on-fill", "p-6", "gap-4", "flex-col"]))
    expect(classesOf(region).some((c) => c.startsWith("rounded"))).toBe(false)
    expect(classesOf(screen.getByText("Awaiting your review // SEA-51"))).toEqual(expect.arrayContaining(["type-overline", "text-needs-you-on-fill"]))
    expect(classesOf(screen.getByText("Claude Code changed 6 files."))).toContain("type-body-strong")
    const actions = region.querySelector('[data-slot="needs-you-actions"]') as HTMLElement
    expect(classesOf(actions)).toEqual(expect.arrayContaining(["flex", "gap-3"]))
  })

  it("holds one solid action, then the text actions, in that order; it has no dismiss", async () => {
    const review = vi.fn()
    const user = userEvent.setup()
    render(<Block action={<Button variant="needs-you" onClick={review}>Review diff</Button>} />)
    const buttons = screen.getAllByRole("button")
    expect(buttons.map((b) => b.textContent)).toEqual(["Review diff", "Pause task"])
    expect(buttons[0]).toHaveAttribute("data-variant", "needs-you")
    expect(buttons[1]).toHaveAttribute("data-variant", "needs-you-text")
    expect(screen.queryByRole("button", { name: /dismiss|close/i })).toBeNull()
    await user.tab()
    expect(buttons[0]).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(review).toHaveBeenCalledTimes(1)
  })

  it("takes two text actions (contract 5.1b #40)", () => {
    render(
      <NeedsYou
        title="Invitation // Wed 11.18"
        body="Dentist, 16:30 – 17:15, Sierra Dental, Roseville"
        action={<Button variant="needs-you">Accept</Button>}
        secondaryActions={[
          <Button key="maybe" variant="needs-you-text">
            Maybe
          </Button>,
          <Button key="decline" variant="needs-you-text">
            Decline
          </Button>,
        ]}
      />
    )
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["Accept", "Maybe", "Decline"])
  })

  it("more: the title ends // +1 on screen, and is read as one more waiting", () => {
    render(<Block more={1} />)
    const region = screen.getByRole("region", { name: "Awaiting your review // SEA-51, 1 more waiting" })
    expect(region).toHaveTextContent("Awaiting your review // SEA-51 // +1")
    expect(region.querySelector('[aria-hidden="true"]')).toHaveTextContent("// +1")
  })

  it("says itself politely once it is on screen, without taking focus", async () => {
    render(<Block more={1} />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("data-slot", "needs-you-announcer")
    await waitFor(() => expect(status).toHaveTextContent("Awaiting your review // SEA-51, 1 more waiting. Claude Code changed 6 files."))
    expect(document.body).toHaveFocus()
  })

  it("says it again when the words change, and stays quiet with announce={false}", async () => {
    const { rerender } = render(<Block />)
    const status = screen.getByRole("status")
    rerender(<Block title="Sign-in request // 00:40 ago" body="Steam on a Windows PC is asking to sign in as kestrel.04." />)
    await waitFor(() => expect(status).toHaveTextContent("Sign-in request // 00:40 ago. Steam on a Windows PC"))
    rerender(<Block announce={false} />)
    expect(screen.queryByRole("status")).toBeNull()
  })
})
