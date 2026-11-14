import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { ConfirmDialog, type ConfirmDialogProps } from "./confirm-dialog"

function Purge(props: Partial<ConfirmDialogProps>) {
  return (
    <ConfirmDialog
      defaultOpen
      presentation="desktop"
      overline="Steam // personal vault"
      title="Delete Steam for good?"
      description="It can't be brought back from Recently deleted."
      confirmLabel="Delete"
      tone="destructive"
      onConfirm={() => {}}
      {...props}
    />
  )
}

describe("ConfirmDialog", () => {
  it("asks in a question-size dialog on a desktop, named by the question, described by its one line", () => {
    render(<Purge />)
    const dialog = screen.getByRole("dialog", { name: "Delete Steam for good?" })
    expect(dialog).toHaveAttribute("data-size", "question")
    expect(dialog).toHaveAccessibleDescription("It can't be brought back from Recently deleted.")
    expect(screen.getByText("Steam // personal vault")).toBeInTheDocument()
  })

  it("focus starts on Cancel, so Enter never confirms by accident", async () => {
    render(<Purge />)
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus())
  })

  it("the yes repeats the verb, takes the critical fill when destructive and the primary fill otherwise; Cancel is the ink outline", () => {
    const { unmount } = render(<Purge />)
    expect(screen.getByRole("button", { name: "Delete" })).toHaveAttribute("data-variant", "destructive")
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute("data-variant", "secondary")
    unmount()
    render(<Purge tone="default" title="Restore this version?" confirmLabel="Restore" />)
    expect(screen.getByRole("button", { name: "Restore" })).toHaveAttribute("data-variant", "default")
  })

  it("Cancel, Escape and the close button all cancel, and never confirm", async () => {
    for (const way of ["cancel", "escape", "close"] as const) {
      const onConfirm = vi.fn()
      const onCancel = vi.fn()
      const onOpenChange = vi.fn()
      const { unmount } = render(<Purge onConfirm={onConfirm} onCancel={onCancel} onOpenChange={onOpenChange} />)
      if (way === "cancel") fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
      if (way === "close") fireEvent.click(screen.getByRole("button", { name: "Close" }))
      if (way === "escape") fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" })
      expect(onCancel).toHaveBeenCalledOnce()
      expect(onConfirm).not.toHaveBeenCalled()
      expect(onOpenChange).toHaveBeenCalledWith(false)
      unmount()
    }
  })

  it("the yes runs onConfirm and closes, without calling onCancel", async () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(<Purge onConfirm={onConfirm} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).not.toHaveBeenCalled()
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("a promise keeps it open and the yes busy until it settles; a rejection keeps it open", async () => {
    let settle!: (ok: boolean) => void
    const onConfirm = vi.fn(() => new Promise<void>((resolve, reject) => (settle = (ok) => (ok ? resolve() : reject(new Error("no"))))))
    function Host() {
      const [error, setError] = React.useState<string>()
      return (
        <Purge
          error={error}
          onConfirm={async () => {
            try {
              await onConfirm()
            } catch {
              setError("The server said no: the item is shared.")
              throw new Error("kept open")
            }
          }}
        />
      )
    }
    render(<Host />)
    const yes = screen.getByRole("button", { name: "Delete" })
    fireEvent.click(yes)
    await vi.waitFor(() => expect(yes).toHaveAttribute("aria-busy", "true"))
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
    await act(async () => settle(false))
    await vi.waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("The server said no: the item is shared."))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(yes).not.toHaveAttribute("aria-busy", "true")
    fireEvent.click(yes)
    await act(async () => settle(true))
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("holds more in its body, and the yes waits for it when told", () => {
    render(
      <Purge title="Turn off backups?" confirmLabel="Turn off" confirmDisabled tone="default">
        <label>
          <input type="checkbox" /> Delete the backups on the server too
        </label>
      </Purge>
    )
    expect(screen.getByRole("checkbox", { name: /Delete the backups/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Turn off" })).toBeDisabled()
  })

  it("Discard changes? keeps the words it is given, focus on Keep editing", async () => {
    render(<Purge title="Discard changes?" description={undefined} overline={undefined} confirmLabel="Discard" cancelLabel="Keep editing" />)
    await vi.waitFor(() => expect(screen.getByRole("button", { name: "Keep editing" })).toHaveFocus())
  })

  it("is a sheet on a phone, its two buttons sharing the width", () => {
    render(<Purge presentation="sheet" />)
    const sheet = screen.getByRole("dialog", { name: "Delete Steam for good?" })
    expect(sheet).toHaveAttribute("data-slot", "sheet-content")
    expect(document.querySelector('[data-slot="sheet-footer"]')).toContainElement(screen.getByRole("button", { name: "Delete" }))
  })

  it("opens from its trigger", async () => {
    render(<Purge defaultOpen={false} trigger={<Button>Delete for good</Button>} />)
    expect(screen.queryByRole("dialog")).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Delete for good" }))
    expect(screen.getByRole("dialog", { name: "Delete Steam for good?" })).toBeInTheDocument()
  })
})
