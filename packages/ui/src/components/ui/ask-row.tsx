// Owned component (not generated): one ask from a session, answered in one click (Warpcore, Synapse, phone).
// Promoted from: Seeded in snds/unicron (2.0: Figma Ask Row 216:787, synapse PR 262, one-click asks; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { IconButton } from "../icon-button"
import { Button } from "./button"
import { StatusOrb } from "./status-orb"

export interface AskRowChoice {
  /** The session's own words for the choice ("Keep for a week"). */
  label: string
  /** The session's recommended choice: the one primary button. At most one per ask. */
  recommended?: boolean
}

export type AskRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The question, as the session asked it. */
  question: React.ReactNode
  /** Where it came from and how long ago ("Windows sign-in helper · Codex · 4 min"). */
  source?: React.ReactNode
  /** The session's choices. Without them the ask is open-ended and offers `reply`. */
  choices?: readonly AskRowChoice[]
  /** A choice was picked: its label. */
  onChoose?: (label: string) => void
  /** The answer once given: the row shows it with Undo in place of the choices. */
  answer?: string | null
  onUndo?: () => void
  /** An open-ended ask: the one button that opens the session to answer it ("Reply in Warpcore"). */
  replyLabel?: string
  onReply?: () => void
  /** Open the session the ask came from. Its words name the app ("Open in Warpcore"). */
  openLabel?: string
  onOpen?: () => void
}

/**
 * AskRow: one ask from a session, answerable in one click, the 2.0 Ask Row (Figma 216:787).
 *
 * - Choices: the Needs-you mark, the question, its source and age, an open icon on the right, then
 *   the session's own choices as small buttons, the recommended one primary.
 * - Open-ended: one secondary "Reply in …" button.
 * - Answered: the Done mark, `Answered “<choice>”`, and Undo. The answer is announced (a polite
 *   live region), and focus moves to Undo, so a slip is one key away.
 *
 * 12 inside, 8 between the top and the actions; the actions step in 20, under the question.
 */
function AskRow({
  question,
  source,
  choices,
  onChoose,
  answer = null,
  onUndo,
  replyLabel = "Reply",
  onReply,
  openLabel = "Open",
  onOpen,
  className,
  ...props
}: AskRowProps) {
  const questionId = React.useId()
  const undoRef = React.useRef<HTMLButtonElement>(null)
  const answered = answer !== null && answer !== undefined
  const wasAnswered = React.useRef(answered)
  React.useEffect(() => {
    if (answered && !wasAnswered.current) undoRef.current?.focus()
    wasAnswered.current = answered
  }, [answered])

  const state = answered ? "answered" : choices && choices.length > 0 ? "choices" : "open-ended"
  return (
    <div
      data-slot="ask-row"
      data-state={state}
      role="group"
      aria-labelledby={questionId}
      className={cn("flex min-w-0 flex-col gap-2 p-3", className)}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span data-slot="ask-row-mark" className="flex h-5 w-3 shrink-0 items-center justify-center">
          <StatusOrb state={answered ? "done" : "needs-you"} size="xs" tooltip={false} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p id={questionId} data-slot="ask-row-question" className="type-ui-emphasis text-text-body">
            {question}
          </p>
          {source ? (
            <p data-slot="ask-row-source" className="type-caption text-text-secondary">
              {source}
            </p>
          ) : null}
        </div>
        {onOpen ? <IconButton icon="launch" label={openLabel} size="icon-sm" onClick={onOpen} /> : null}
      </div>
      <div data-slot="ask-row-actions" aria-live="polite" className="flex min-w-0 flex-wrap items-center gap-2 ps-5">
        {state === "answered" ? (
          <>
            <span data-slot="ask-row-answer" className="type-ui text-text-secondary">{`Answered “${answer}”`}</span>
            {onUndo ? (
              <Button ref={undoRef} variant="quiet" size="sm" onClick={onUndo}>
                Undo
              </Button>
            ) : null}
          </>
        ) : state === "choices" ? (
          choices!.map((choice) => (
            <Button key={choice.label} variant={choice.recommended ? "default" : "secondary"} size="sm" onClick={() => onChoose?.(choice.label)}>
              {choice.label}
            </Button>
          ))
        ) : (
          <Button variant="secondary" size="sm" onClick={onReply}>
            {replyLabel}
          </Button>
        )}
      </div>
    </div>
  )
}

export { AskRow }
