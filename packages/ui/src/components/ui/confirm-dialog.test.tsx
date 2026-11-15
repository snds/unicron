import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Button } from "./button"
import { Checkbox } from "./checkbox"
import { ConfirmDialog, ConfirmDialogConsequence, ConfirmDialogConsequences, type ConfirmDialogProps } from "./confirm-dialog"
import { RadioGroup, RadioRow } from "./radio-group"
import { TextField } from "./text-field"

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

  describe("children in its body (contract 5.1c C11)", () => {
    it("RadioRows: a series delete asks which events, at 480, focus still on Cancel", async () => {
      const onConfirm = vi.fn()
      function SeriesDelete() {
        const [scope, setScope] = React.useState("this")
        return (
          <Purge title="Delete Standup?" description={undefined} overline={undefined} onConfirm={() => onConfirm(scope)}>
            <RadioGroup aria-label="Which events" value={scope} onValueChange={(v) => setScope(String(v))}>
              <RadioRow value="this" label="This event" description="Only Wed 11.18." />
              <RadioRow value="following" label="This and following" description="Wed 11.18 and every one after it." />
              <RadioRow value="all" label="All events" description="The whole series." />
            </RadioGroup>
          </Purge>
        )
      }
      render(<SeriesDelete />)
      expect(screen.getByRole("dialog")).toHaveAttribute("data-size", "question")
      await vi.waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus())
      expect(screen.getAllByRole("radio")).toHaveLength(3)
      await userEvent.click(screen.getByRole("radio", { name: /All events/ }))
      await userEvent.click(screen.getByRole("button", { name: "Delete" }))
      expect(onConfirm).toHaveBeenCalledWith("all")
    })

    it("consequences: a list of lines, each a decorative glyph and one sentence", async () => {
      render(
        <Purge title="Turn on end-to-end encryption?" confirmLabel="Turn on" tone="default" description="Only your devices will be able to read your notes.">
          <ConfirmDialogConsequences>
            <ConfirmDialogConsequence icon="password">You'll get a key. Each of your other devices needs it to keep syncing.</ConfirmDialogConsequence>
            <ConfirmDialogConsequence icon="unlink">Notes you've shared stop working.</ConfirmDialogConsequence>
            <ConfirmDialogConsequence icon="trash-can">The relay deletes the readable copies it has.</ConfirmDialogConsequence>
          </ConfirmDialogConsequences>
        </Purge>
      )
      const list = screen.getByRole("list")
      expect(list).toHaveAttribute("data-slot", "confirm-dialog-consequences")
      const items = screen.getAllByRole("listitem")
      expect(items).toHaveLength(3)
      expect(items[1]).toHaveTextContent("Notes you've shared stop working.")
      expect(items[1].className).toContain("type-body")
      const glyph = items[0].querySelector('[data-slot="confirm-dialog-consequence-icon"]')!
      expect(glyph).toHaveAttribute("aria-hidden")
      expect(glyph.querySelector('[data-icon-name="password"]')).toBeInTheDocument()
      await vi.waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus())
    })

    it("a Checkbox: the yes carries what was ticked", async () => {
      const onConfirm = vi.fn()
      function TurnOffBackups() {
        const [forget, setForget] = React.useState(false)
        return (
          <Purge title="Turn off backups?" confirmLabel="Turn off" tone="default" description="The files stay where they are." onConfirm={() => onConfirm(forget)}>
            <label className="flex items-center gap-2">
              <Checkbox checked={forget} onCheckedChange={setForget} />
              Also forget the backup password on this computer
            </label>
          </Purge>
        )
      }
      render(<TurnOffBackups />)
      await userEvent.click(screen.getByRole("checkbox", { name: /Also forget/ }))
      await userEvent.click(screen.getByRole("button", { name: "Turn off" }))
      expect(onConfirm).toHaveBeenCalledWith(true)
    })

    function DeveloperReset({ onConfirm }: { onConfirm: () => void }) {
      const [typed, setTyped] = React.useState("")
      const armed = typed === "reset"
      return (
        <Purge
          title="Reset Lockdown on this computer?"
          description="Every vault, setting and key on this computer is erased."
          confirmLabel="Erase and restart"
          confirmDisabled={!armed}
          disabledReason="Type reset to turn this on."
          onConfirm={onConfirm}
        >
          <TextField label="Type reset" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </Purge>
      )
    }

    it("an arming Text Field: the yes is off with a visible reason, reachable and described by it, until the word matches", async () => {
      const onConfirm = vi.fn()
      render(<DeveloperReset onConfirm={onConfirm} />)
      // Focus still starts on Cancel, not on the field.
      await vi.waitFor(() => expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus())
      const yes = screen.getByRole("button", { name: "Erase and restart" })
      expect(yes).toHaveAttribute("aria-disabled", "true")
      expect(yes).toHaveAccessibleDescription("Type reset to turn this on.")
      expect(screen.getByText("Type reset to turn this on.")).toBeVisible()
      // In the tab order, so the reason can be heard: Tab from Cancel reaches it.
      await userEvent.tab()
      expect(yes).toHaveFocus()
      await userEvent.click(yes)
      expect(onConfirm).not.toHaveBeenCalled()
      // A near miss does not arm it.
      await userEvent.type(screen.getByRole("textbox", { name: "Type reset" }), "rese")
      expect(yes).toHaveAttribute("aria-disabled", "true")
      await userEvent.type(screen.getByRole("textbox", { name: "Type reset" }), "t")
      expect(yes).not.toHaveAttribute("aria-disabled")
      expect(screen.queryByText("Type reset to turn this on.")).toBeNull()
      expect(yes).not.toHaveAccessibleDescription("Type reset to turn this on.")
      await userEvent.click(yes)
      expect(onConfirm).toHaveBeenCalledOnce()
    })

    it("the reason sits at the foot of the body, at the end of the line, over the yes", () => {
      render(<DeveloperReset onConfirm={() => {}} />)
      const reason = document.querySelector('[data-slot="confirm-dialog-reason"]') as HTMLElement
      expect(reason.className.split(" ")).toEqual(expect.arrayContaining(["flex", "justify-end", "text-end"]))
      // After the field, before the actions.
      const field = screen.getByRole("textbox", { name: "Type reset" })
      expect(field.compareDocumentPosition(reason) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(reason.compareDocumentPosition(screen.getByRole("button", { name: "Cancel" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("takes a notice line across its top (a compact needs-you)", () => {
      render(<Purge notice={<p data-testid="notice">Sign-in request</p>} />)
      expect(document.querySelector('[data-slot="dialog-notice"]')).toContainElement(screen.getByTestId("notice"))
    })
  })
})
