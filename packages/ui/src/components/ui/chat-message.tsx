// Owned component (not generated): one message in a conversation: the person's in a raised bubble on the right, the agent's as plain response text across the column.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:103; contract 5.1 and 5.1b #47; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { StatusOrb, type StatusOrbState } from "./status-orb"

/** Who wrote it: the person (`user`) or an agent or model (`agent`). Figma's `Role`. */
export type ChatMessageRole = "user" | "agent"

/** `done`: complete. `streaming`: an agent's reply still arriving. `error`: it failed (or no reply came). */
export type ChatMessageState = "done" | "streaming" | "error"

/** Every word ChatMessage says on its own. Hosts pass the meta, the body and the error text. */
export const chatMessageCopy = {
  /** The orb's name while a reply arrives. */
  writing: "Writing",
  /** Said once, politely, when a streaming reply completes. Tokens are never read one by one. */
  finished: "Reply finished",
  /** Said once when a message goes into the error state and its error is not plain text. */
  failed: "Reply failed",
}

export interface ChatMessageProps extends Omit<React.ComponentProps<"article">, "role"> {
  /** Figma's `Role`: `user` is right aligned in a bubble; `agent` is plain text across the column. */
  role: ChatMessageRole
  /**
   * The mono caps line above the message: who and when ("Claude Code // 14:03", "You // 14:02").
   * Type it in sentence case. A part of it can be a `ChatMessageMetaButton` (the alias that opens
   * the reply's details). Label ink for the person, the live colour for an agent.
   */
  meta?: React.ReactNode
  /**
   * What a reply is doing while it streams, joined after the meta with ` // `: "waiting",
   * "thinking", "writing", "stopping". Shown only while `state="streaming"`.
   */
  phase?: React.ReactNode
  /** The StatusOrb before the meta while streaming. Default `working`. */
  orb?: StatusOrbState
  /** How the message ended, after the body as `// cut off`, `// stopped`. Type each in sentence case. */
  endMarks?: readonly React.ReactNode[]
  /** Default `done`. */
  state?: ChatMessageState
  /** With `state="error"`: one line in critical ink under the message, in the server's words. */
  error?: React.ReactNode
  /** Beside the error line: the way to try again (`<Button variant="secondary" size="sm">Try again</Button>`). */
  retry?: React.ReactNode
  /**
   * Actions under the message: Copy, Edit, Retry, as ghost 32px icon buttons (`CopyButton`,
   * `IconButton size="icon-sm"`). With a fine pointer they show on hover and on focus; on touch
   * they always show.
   */
  actions?: React.ReactNode
  /** The body. A string for the person's words; for an agent, whatever the host renders (Prose, CodeBlock, an ArtifactCard, a RunTrace). */
  children?: React.ReactNode
}

/**
 * One message (Figma "22. Chat Message"). The meta is an overline, 4px above the body.
 *
 * - `role="user"`: right aligned. The body sits in a bubble on the raised surface with a 1px
 *   hairline, padding 12 / 16, in the body role; the bubble hugs its text up to
 *   `--c-chat-bubble-max` (300px). Meta in label ink.
 * - `role="agent"`: left aligned, no bubble, the full width, in the response role. Meta in the
 *   live colour: the live accent marks what an agent wrote.
 *
 * Streaming: a StatusOrb and the phase join the meta, a live square follows the text, and the body
 * is busy. One polite line says "Reply finished" when it ends; the text itself is never re-read.
 * Error: a critical line and a retry slot under the message.
 */
export function ChatMessage({
  role,
  meta,
  phase,
  orb = "working",
  endMarks,
  state = "done",
  error,
  retry,
  actions,
  children,
  className,
  ...props
}: ChatMessageProps) {
  const user = role === "user"
  const streaming = state === "streaming"

  // One announcement per change of state, derived while rendering (no effect, no extra render).
  const [shown, setShown] = React.useState(state)
  const [said, setSaid] = React.useState("")
  if (shown !== state) {
    setShown(state)
    setSaid(
      state === "error"
        ? typeof error === "string"
          ? error
          : chatMessageCopy.failed
        : shown === "streaming" && state === "done"
          ? chatMessageCopy.finished
          : ""
    )
  }

  return (
    <article
      data-slot="chat-message"
      data-role={role}
      data-state={state}
      className={cn("group/message flex w-full min-w-0 flex-col gap-1", user ? "items-end" : "items-start", className)}
      {...props}
    >
      {meta || (streaming && phase) ? (
        <p data-slot="chat-message-meta" className={cn("type-overline flex max-w-full min-w-0 items-center gap-2", user ? "text-text-label" : "text-secondary-live")}>
          {streaming && !user ? <StatusOrb state={orb} size="xs" tooltip={false} aria-hidden /> : null}
          <span className="min-w-0">
            {meta}
            {streaming && phase ? (
              <>
                {meta ? " // " : null}
                <span data-slot="chat-message-phase">{phase}</span>
              </>
            ) : null}
          </span>
        </p>
      ) : null}
      {user ? (
        <div
          data-slot="chat-message-bubble"
          className="type-body text-text-body bg-surface-raised rule-box w-fit max-w-(--c-chat-bubble-max) min-w-0 rounded-lg px-4 py-3 break-words whitespace-pre-wrap"
        >
          {children}
        </div>
      ) : (
        <div data-slot="chat-message-body" aria-busy={streaming || undefined} className="type-response text-text-body w-full min-w-0 break-words">
          {children}
          {streaming ? (
            // The live mark: an 8px square in the live colour where the next words land. Still: the
            // orb in the meta carries the motion.
            <span aria-hidden data-slot="chat-message-caret" className="bg-secondary-live ml-1 inline-block size-2" />
          ) : null}
        </div>
      )}
      {endMarks?.length ? (
        <p data-slot="chat-message-end" className="type-overline text-text-label">
          {endMarks.map((mark, i) => (
            <React.Fragment key={i}>
              {i ? " " : null}
              {"// "}
              {mark}
            </React.Fragment>
          ))}
        </p>
      ) : null}
      {state === "error" && (error || retry) ? (
        <div data-slot="chat-message-error" className={cn("flex flex-wrap items-center gap-x-3 gap-y-2 pt-1", user && "justify-end")}>
          {error ? <p className="type-caption text-critical-text">{error}</p> : null}
          {retry}
        </div>
      ) : null}
      {actions ? (
        <div
          data-slot="chat-message-actions"
          className={cn(
            "flex items-center gap-1 transition-opacity duration-(--motion-fast) ease-(--motion-ease)",
            // A fine pointer sees them on hover and on focus; touch always sees them.
            "pointer-fine:opacity-0 group-hover/message:opacity-100 group-focus-within/message:opacity-100",
            user ? "-mr-2 justify-end" : "-ml-2"
          )}
        >
          {actions}
        </div>
      ) : null}
      <span role="status" className="sr-only">
        {said}
      </span>
    </article>
  )
}

/**
 * A part of a message's meta that is a button: the alias that opens a reply's details ("Answered
 * by General. Show details."). The overline's own type and ink, underlined on hover; give it an
 * `aria-label` that says what it opens. It forwards its ref and props, so it can be the `render` of
 * a PopoverTrigger.
 */
export function ChatMessageMetaButton({ className, type = "button", ...props }: React.ComponentProps<"button">) {
  return (
    <ButtonPrimitive
      data-slot="chat-message-meta-button"
      type={type}
      className={cn("type-overline hit-area cursor-pointer rounded-sm text-inherit underline-offset-3 hover:underline", className)}
      {...props}
    />
  )
}
