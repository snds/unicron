import * as React from "react"
import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { ConfirmDialog } from "./confirm-dialog"
import { Dialog, DialogContent, DialogTitle } from "./dialog"
import { NeedsYou, NeedsYouProvider } from "./needs-you"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet"

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

describe("NeedsYou size=\"compact\" (contract 5.1c C19, Lockdown LA8)", () => {
  function Line(props: Partial<React.ComponentProps<typeof NeedsYou>>) {
    return (
      <NeedsYou
        size="compact"
        title="Sign-in request // 01:40 left"
        action={
          <Button variant="needs-you" size="sm">
            Review
          </Button>
        }
        {...props}
      />
    )
  }
  const blocks = () => Array.from(document.querySelectorAll<HTMLElement>('[data-slot="needs-you"][data-size="default"]'))

  it("one 48px line: the title, cut to one line and read whole, then one solid action", () => {
    render(<Line />)
    const line = screen.getByRole("region", { name: "Sign-in request // 01:40 left" })
    expect(line).toHaveAttribute("data-size", "compact")
    expect(classesOf(line)).toEqual(expect.arrayContaining(["h-control", "items-center", "bg-needs-you-fill", "text-needs-you-on-fill"]))
    const title = line.querySelector('[data-slot="needs-you-title"]') as HTMLElement
    expect(title).toHaveTextContent("Sign-in request // 01:40 left")
    expect(classesOf(title)).toEqual(expect.arrayContaining(["type-overline", "truncate", "min-w-0", "flex-1"]))
    expect(within(line).getAllByRole("button").map((b) => b.textContent)).toEqual(["Review"])
  })

  it("holds no body, no text actions and nothing else", () => {
    render(
      <Line body="Chrome on Linux wants to sign in." secondaryAction={<Button variant="needs-you-text">Decline</Button>}>
        <p>extra</p>
      </Line>
    )
    expect(screen.queryByText("Chrome on Linux wants to sign in.")).toBeNull()
    expect(screen.queryByRole("button", { name: "Decline" })).toBeNull()
    expect(screen.queryByText("extra")).toBeNull()
  })

  it("says // +1 and is read as one more waiting", () => {
    render(<Line more={1} />)
    expect(screen.getByRole("region")).toHaveAccessibleName("Sign-in request // 01:40 left, 1 more waiting")
  })

  it("one yellow shape: while a compact line shows, the full block hides (and keeps its space); it comes back when the line goes", () => {
    function Screen({ request }: { request: boolean }) {
      return (
        <>
          <Block />
          {request ? <Line /> : null}
        </>
      )
    }
    const { rerender } = render(<Screen request={false} />)
    const [block] = blocks()
    expect(block).not.toHaveAttribute("data-covered")
    expect(block).not.toHaveAttribute("aria-hidden")
    rerender(<Screen request />)
    expect(block).toHaveAttribute("data-covered")
    expect(block).toHaveAttribute("aria-hidden", "true")
    // Invisible, not removed: the page under the scrim does not move.
    expect(classesOf(block)).toContain("data-covered:invisible")
    expect(document.querySelectorAll('[data-slot="needs-you"]:not([data-covered])')).toHaveLength(1)
    rerender(<Screen request={false} />)
    expect(block).not.toHaveAttribute("data-covered")
  })

  it("works through the layers: a line in a dialog's notice hides the block on the page, with no app code between them", async () => {
    function Page({ open }: { open: boolean }) {
      return (
        <>
          <Block />
          <Dialog open={open}>
            <DialogContent notice={<Line />}>
              <DialogTitle>New login</DialogTitle>
            </DialogContent>
          </Dialog>
        </>
      )
    }
    const { rerender } = render(<Page open={false} />)
    expect(blocks()[0]).not.toHaveAttribute("data-covered")
    rerender(<Page open />)
    await waitFor(() => expect(blocks()[0]).toHaveAttribute("data-covered"))
    expect(document.querySelector('[data-slot="dialog-notice"] [data-slot="needs-you"]')).toHaveAttribute("data-size", "compact")
    rerender(<Page open={false} />)
    await waitFor(() => expect(blocks()[0]).not.toHaveAttribute("data-covered"))
  })

  it("in a sheet's notice and in a ConfirmDialog's too", async () => {
    const { unmount } = render(
      <>
        <Block />
        <Sheet open>
          <SheetContent side="bottom" notice={<Line />}>
            <SheetHeader>
              <SheetTitle>Edit Steam</SheetTitle>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </>
    )
    await waitFor(() => expect(blocks()[0]).toHaveAttribute("data-covered"))
    const notice = document.querySelector('[data-slot="sheet-notice"]') as HTMLElement
    expect(notice).toContainElement(document.querySelector('[data-size="compact"]') as HTMLElement)
    // Before the grabber, flush with the sheet's top; the close button moves under it.
    expect(notice.compareDocumentPosition(document.querySelector('[data-slot="sheet-grabber"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(document.querySelector('[data-slot="sheet-close-anchor"]')!.className).toContain("in-data-[side=bottom]:top-[calc(var(--size-control)+var(--spacing)*5)]")
    unmount()
    render(
      <>
        <Block />
        <ConfirmDialog defaultOpen presentation="desktop" title="Discard changes?" confirmLabel="Discard" cancelLabel="Keep editing" onConfirm={() => {}} notice={<Line />} />
      </>
    )
    await waitFor(() => expect(blocks()[0]).toHaveAttribute("data-covered"))
  })

  it("a NeedsYouProvider is a scope of its own: a line inside it hides only the blocks inside it", () => {
    render(
      <>
        <Block title="Outside // SEA-51" />
        <NeedsYouProvider>
          <Block title="Inside // SEA-52" />
          <Line />
        </NeedsYouProvider>
      </>
    )
    const [outside, inside] = blocks()
    expect(outside).not.toHaveAttribute("data-covered")
    expect(inside).toHaveAttribute("data-covered")
  })

  it("two lines at once: the block stays hidden until both have gone", () => {
    function Two({ a, b }: { a: boolean; b: boolean }) {
      return (
        <>
          <Block />
          {a ? <Line /> : null}
          {b ? <Line title="Pairing request // 01:12 left" /> : null}
        </>
      )
    }
    const { rerender } = render(<Two a b />)
    expect(blocks()[0]).toHaveAttribute("data-covered")
    rerender(<Two a={false} b />)
    expect(blocks()[0]).toHaveAttribute("data-covered")
    rerender(<Two a={false} b={false} />)
    expect(blocks()[0]).not.toHaveAttribute("data-covered")
  })

  it("says itself politely once it is on screen", async () => {
    render(<Line />)
    await act(async () => {})
    expect(document.querySelector('[data-slot="needs-you-announcer"]')).toHaveTextContent("Sign-in request // 01:40 left")
  })
})

