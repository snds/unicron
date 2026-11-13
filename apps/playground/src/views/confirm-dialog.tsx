// ConfirmDialog: the question before a loss. Focus starts on Cancel; the yes repeats the verb; a
// question-size dialog on a desktop, a sheet on a phone. View: ?view=confirm-dialog
import { Checkbox, ConfirmDialog } from "@unicron/ui"

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
    </div>
  )
}
