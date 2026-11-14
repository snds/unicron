// ConfirmDialog: the question before a loss. Focus starts on Cancel; the yes repeats the verb; a
// question-size dialog on a desktop, a sheet on a phone. View: ?view=confirm-dialog
import { useState } from "react"
import { Checkbox, ConfirmDialog, ConfirmDialogConsequence, ConfirmDialogConsequences, RadioGroup, RadioRow, TextField } from "@unicron/ui"

import { Stage } from "./_stage"

export default function ConfirmDialogView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-6">
        <Stage label="Destructive // question 480 (Lockdown X5)" width={960} height={480} app="lockdown">
          {(container) => (
            <ConfirmDialog
              open
              presentation="desktop"
              container={container}
              overline="Steam // personal vault"
              title="Delete Steam for good?"
              description="It can't be brought back from Recently deleted."
              confirmLabel="Delete"
              tone="destructive"
              onConfirm={() => {}}
            />
          )}
        </Stage>
        <Stage label="Phone // a sheet; Discard changes? (decisions §10)" width={390} height={844} app="lockdown">
          {(container) => (
            <ConfirmDialog
              open
              presentation="sheet"
              container={container}
              title="Discard changes?"
              description="The password you typed for github.com isn't saved."
              confirmLabel="Discard"
              cancelLabel="Keep editing"
              tone="destructive"
              onConfirm={() => {}}
            />
          )}
        </Stage>
      </div>

      <div className="flex flex-wrap gap-6">
        <Stage label="Default // a choice worth a second look, with one more control (Lockdown LA3)" width={960} height={520} app="lockdown">
          {(container) => (
            <ConfirmDialog
              open
              presentation="desktop"
              container={container}
              overline="Settings // backups"
              title="Turn off backups?"
              description="Lockdown stops saving a copy of your vault to the server."
              confirmLabel="Turn off"
              onConfirm={() => {}}
            >
              <label className="type-body flex items-center gap-3">
                <Checkbox />
                Also delete the backups already saved
              </label>
            </ConfirmDialog>
          )}
        </Stage>
        <Stage label="A failed yes // the server's words in one critical line" width={960} height={520} app="warpcore">
          {(container) => (
            <ConfirmDialog
              open
              presentation="desktop"
              container={container}
              overline="Providers // OpenRouter"
              title="Remove OpenRouter?"
              description="Chats that use its models switch to the default model."
              confirmLabel="Remove"
              tone="destructive"
              error="That didn't go through. Check your connection and try again."
              onConfirm={() => {}}
            />
          )}
        </Stage>
      </div>

      <div className="flex flex-wrap gap-6">
        <Stage label="RadioRows // which events of a series (Vale NA4, X6)" width={960} height={600} app="vale">
          {(container) => <SeriesDelete container={container} />}
        </Stage>
        <Stage label="Consequences // an icon and one sentence each (Vale NA4, T5)" width={960} height={600} app="vale">
          {(container) => (
            <ConfirmDialog
              open
              presentation="desktop"
              container={container}
              overline="Settings // notes"
              title="Turn on end-to-end encryption?"
              description="Only your devices will be able to read your notes. The relay keeps them, but can't open them."
              confirmLabel="Turn on"
              onConfirm={() => {}}
            >
              <ConfirmDialogConsequences>
                <ConfirmDialogConsequence icon="password">You'll get a key. Each of your other devices needs it to keep syncing, so copy it there.</ConfirmDialogConsequence>
                <ConfirmDialogConsequence icon="unlink">Notes and conversations you've shared stop working. Share them again for a link that's encrypted too.</ConfirmDialogConsequence>
                <ConfirmDialogConsequence icon="trash-can">The relay deletes the readable copies it has. It can't go back to readable sync.</ConfirmDialogConsequence>
              </ConfirmDialogConsequences>
            </ConfirmDialog>
          )}
        </Stage>
      </div>

      <div className="flex flex-wrap gap-6">
        <Stage label="Arming Text Field // off, with its reason, until the word matches (Lockdown LA3, T10)" width={960} height={600} app="lockdown">
          {(container) => <DeveloperReset container={container} typed="" />}
        </Stage>
        <Stage label="Arming Text Field // armed: reset typed" width={960} height={600} app="lockdown">
          {(container) => <DeveloperReset container={container} typed="reset" />}
        </Stage>
      </div>
      <Stage label="Phone // the arming field in a sheet" width={390} height={844} app="lockdown">
        {(container) => <DeveloperReset container={container} typed="res" presentation="sheet" />}
      </Stage>
    </div>
  )
}

/** Vale's series delete: three RadioRows pick the scope. */
function SeriesDelete({ container }: { container: HTMLElement }) {
  const [scope, setScope] = useState("this")
  return (
    <ConfirmDialog
      open
      presentation="desktop"
      container={container}
      overline="Calendar // personal"
      title="Delete Standup?"
      description="It repeats every weekday."
      confirmLabel="Delete"
      tone="destructive"
      onConfirm={() => {}}
    >
      <RadioGroup aria-label="Which events" value={scope} onValueChange={(v) => setScope(String(v))}>
        <RadioRow value="this" label="This event" description="Only Wed 11.18." />
        <RadioRow value="following" label="This and following" description="Wed 11.18 and every one after it." />
        <RadioRow value="all" label="All events" description="The whole series." />
      </RadioGroup>
    </ConfirmDialog>
  )
}

/** Lockdown's developer reset: typing reset arms the destructive yes. */
function DeveloperReset({ container, typed: initial, presentation = "desktop" }: { container: HTMLElement; typed: string; presentation?: "desktop" | "sheet" }) {
  const [typed, setTyped] = useState(initial)
  const armed = typed === "reset"
  return (
    <ConfirmDialog
      open
      presentation={presentation}
      container={container}
      overline="Developer tools // this Mac"
      title="Reset Lockdown on this computer?"
      description="Erases the vault cache, the device key and every setting on this Mac. Your vaults on the server stay."
      confirmLabel="Erase and restart"
      tone="destructive"
      confirmDisabled={!armed}
      disabledReason="Type reset to turn this on."
      onConfirm={() => {}}
    >
      <TextField label="Type reset" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
    </ConfirmDialog>
  )
}

