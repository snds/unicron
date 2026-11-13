// Owned component (not generated): the one yellow block per screen, for the thing that waits on the person.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:517; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

/** The words in a node, as a screen reader gets them: what is under `aria-hidden` is left out. */
function wordsOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(wordsOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode; "aria-hidden"?: unknown }>(node)) {
    const hidden = node.props["aria-hidden"]
    return hidden === true || hidden === "true" ? "" : wordsOf(node.props.children)
  }
  return ""
}

export type NeedsYouProps = Omit<React.ComponentProps<"section">, "title"> & {
  /** What waits, in mono caps, with `//` between its parts ("Awaiting your review // SEA-51"). */
  title: React.ReactNode
  /**
   * How many more things wait besides this one. The title ends `// +1`; the others are ordinary
   * rows under a "Waiting on you" header (decisions §2). Read as "1 more waiting".
   */
  more?: number
  /** One sentence on what it is, in body/strong ("Claude Code changed 6 files."). */
  body?: React.ReactNode
  /** The one solid action: a `Button variant="needs-you"`. */
  action?: React.ReactNode
  /** The second action, text only: a `Button variant="needs-you-text"`. */
  secondaryAction?: React.ReactNode
  /**
   * Up to two text actions (`needs-you-text`), for a block that offers two ways out ("See both",
   * "Pause task"). Use this or `secondaryAction`, not both.
   */
  secondaryActions?: readonly [React.ReactNode, React.ReactNode?]
  /**
   * Say the block to assistive tech when it appears and when its words change, politely, without
   * moving focus. Default true. Turn it off where the block is already on screen when the page
   * opens and saying it again would be noise.
   */
  announce?: boolean
}

/**
 * NeedsYou: the yellow block. Same yellow in every app and both grounds, no corner, 24px in from
 * every side. One solid action, and one or two text actions; no dismiss, and it cannot be swiped
 * away. At most one per screen, with no other solid primary within 96px of it.
 *
 * It is a region named by its title and described by its body, so it can be reached from the
 * landmarks list. `data-slot="needs-you"` turns every focus ring inside it to the yellow's ink.
 */
function NeedsYou({
  title,
  more,
  body,
  action,
  secondaryAction,
  secondaryActions,
  announce = true,
  className,
  children,
  ...props
}: NeedsYouProps) {
  const uid = React.useId()
  const titleId = `${uid}-title`
  const bodyId = body ? `${uid}-body` : undefined
  // The type holds the list to two; nothing given is dropped.
  const textActions = [secondaryAction, ...(secondaryActions ?? [])].filter(Boolean)

  // The live region starts empty and its words are written once the block is on screen (and
  // again when they change), so a screen reader hears a change: a region that arrives already
  // full is not reliably read. Written through the DOM, the one place the words go.
  const words = [wordsOf(title), more ? `, ${more} more waiting` : "", body ? `. ${wordsOf(body)}` : ""].join("")
  const announcer = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (announcer.current) announcer.current.textContent = words
  }, [words, announce])

  return (
    <section
      data-slot="needs-you"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      className={cn("flex min-w-0 flex-col gap-4 bg-needs-you-fill p-6 text-needs-you-on-fill", className)}
      {...props}
    >
      <p id={titleId} data-slot="needs-you-title" className="type-overline text-needs-you-on-fill">
        {title}
        {more ? (
          <>
            <span aria-hidden="true">{` // +${more}`}</span>
            <span className="sr-only">{`, ${more} more waiting`}</span>
          </>
        ) : null}
      </p>
      {body ? (
        <p id={bodyId} data-slot="needs-you-body" className="type-body-strong">
          {body}
        </p>
      ) : null}
      {children}
      {action || textActions.length ? (
        <div data-slot="needs-you-actions" className="flex flex-wrap items-center gap-3">
          {action}
          {textActions.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      ) : null}
      {announce ? (
        <span ref={announcer} role="status" data-slot="needs-you-announcer" className="sr-only" />
      ) : null}
    </section>
  )
}

export { NeedsYou }
