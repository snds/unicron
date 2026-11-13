// Owned component (not generated): the card for a thing a chat made (a diff, a document, a page) that opens beside the chat.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 44:85; contract 5.1; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"

export interface ArtifactCardProps extends Omit<useRender.ComponentProps<"button">, "title" | "children"> {
  /** The kind's icon in the tile (Figma `Icon`, default `code`): `document`, `flow`, `checkmark`. */
  icon?: IconName
  /** What it is, in a few words: "OPAQUE migration diff". One line; cut with an ellipsis. */
  title: React.ReactNode
  /** Mono facts with ` // ` between them: "Diff // 6 files // +212 −48 // v2". */
  meta?: React.ReactNode
  /** It is the one open beside the chat: the soft fill and the 2px edge, and `aria-current`. */
  selected?: boolean
  /** Make it a link instead of a button. Or pass `render` for a router's link. */
  href?: string
}

/**
 * A thing a chat made, as a card in the stream or in the Artifacts tab (Figma "26. Artifact Card").
 * The raised surface with a 1px hairline, 8px padding, gap 12: a 40px tile on `primary-soft` with
 * the kind's icon in `primary-text`, the title in `ui-emphasis` over the meta, and an arrow in
 * label ink. It fills its container (Figma's 420 is only the drawn width) and hugs 56 tall.
 *
 * A button by default; with `href` a link; with `render` the host's own link. Hover and pressed
 * are the contract's washes (`state-hover`, `state-pressed`) laid over the card's fill. `selected` is the open one: the
 * `primary-soft` fill and a 2px `primary-fill` edge on the left (contract §6.5), with the tile on
 * the raised surface so it still reads as a tile.
 */
export function ArtifactCard({ icon = "code", title, meta, selected = false, href, render, className, ...props }: ArtifactCardProps) {
  const asLink = href !== undefined
  const content = (
    <>
      <span
        aria-hidden
        data-slot="artifact-card-tile"
        className="bg-primary-soft text-primary-text group-data-selected/artifact:bg-surface-raised flex size-10 shrink-0 items-center justify-center rounded-lg"
      >
        <Icon name={icon} />
      </span>
      <span data-slot="artifact-card-text" className="flex min-w-0 flex-1 flex-col">
        <span data-slot="artifact-card-title" className="type-ui-emphasis text-text-body truncate">
          {title}
        </span>
        {/* A space between the two for the accessible name; the column draws none. */}
        {meta ? " " : null}
        {meta ? (
          <span data-slot="artifact-card-meta" className="type-meta text-text-label truncate">
            {meta}
          </span>
        ) : null}
      </span>
      <span aria-hidden data-slot="artifact-card-go" className="text-text-label flex shrink-0 items-center">
        <Icon name="arrow--right" />
      </span>
    </>
  )
  return useRender({
    defaultTagName: asLink ? "a" : "button",
    render,
    props: mergeProps<"button">(
      {
        className: cn(
          "group/artifact bg-surface-raised rule-box flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg p-2 text-left",
          "transition-colors duration-(--motion-fast) ease-(--motion-ease)",
          // Hover and pressed are the contract's washes (state-hover, state-pressed) on a layer
          // between the card's own fill and its content, so they tint the raised card, or the
          // soft fill of the open one, and never the text.
          "relative isolate before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:transition-colors before:duration-(--motion-fast) before:ease-(--motion-ease)",
          "hover:before:bg-state-hover active:before:bg-state-pressed",
          "data-selected:bg-primary-soft data-selected:edge-l",
          "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
          className
        ),
        children: content,
      },
      // A link takes its address; a plain button never submits a form it sits in.
      (asLink ? { href } : render ? {} : { type: "button" }) as React.ComponentProps<"button">,
      {
        "data-slot": "artifact-card",
        "data-selected": selected ? "true" : undefined,
        "aria-current": selected ? "true" : undefined,
      } as React.ComponentProps<"button">,
      props
    ),
  })
}
