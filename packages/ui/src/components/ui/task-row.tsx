// Owned component (not generated): one task or thread in a list (Warpcore's tasks, Synapse's sessions).
// Promoted from: Seeded in snds/unicron (2.0: Figma Task Row 143:633; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { StatusOrb, type StatusOrbState } from "./status-orb"

export type TaskRowProps = Omit<useRender.ComponentProps<"a">, "children" | "title"> & {
  /** What the task is doing: the Status Mark at the start. Its word joins the row's name. */
  state: StatusOrbState
  /** The task's name, one line. */
  title: React.ReactNode
  /** When it last moved ("now", "4 min"): caption, after the title. */
  time?: React.ReactNode
  /** One line of what is happening ("Step 2 of 4: adding the backup"). */
  line?: React.ReactNode
  /** Where it runs and for how long ("Claude Code · server · 12 min"): caption, label ink. */
  meta?: React.ReactNode
  /** The project, before the meta: a Tag Chip or a few words. */
  project?: React.ReactNode
  /** Optional helpers under the meta (avatars, sub-agents). */
  helpers?: React.ReactNode
  /** Something new since the person last looked: the 6px unread dot at the end, and "Unread" in the name. */
  unread?: boolean
  /** The task open beside the list: the neutral 8% fill with the inset bar, and `aria-current`. */
  selected?: boolean
  /** Words for the unread dot. Default "Unread". */
  unreadLabel?: string
}

/**
 * TaskRow: one task or thread, the 2.0 Task Row (Figma 143:633). The Status Mark, the title and
 * its time, one line of what is happening, then the meta (project, where it runs, how long) and
 * optional helpers, and the unread dot. 10 / 12 inside, 10 apart, an 8px corner, inset in its list
 * with no dividers. Hover is the 5% wash; selected the 8% fill (surface/selected) with a 2px inset
 * bar in the accent's text colour, 6 in from the edge and 8 from top and bottom.
 *
 * A link with `href` (or a router link through `render`), otherwise a button. Its name is the
 * state's word, the title and "Unread"; the time, line and meta describe it.
 */
function TaskRow({
  state,
  title,
  time,
  line,
  meta,
  project,
  helpers,
  unread = false,
  selected = false,
  unreadLabel = "Unread",
  render,
  className,
  ...props
}: TaskRowProps) {
  const isLink = Boolean(props.href) || Boolean(render)
  const id = React.useId()
  const ids = { mark: `${id}-mark`, title: `${id}-title`, unread: `${id}-unread`, time: `${id}-time`, line: `${id}-line`, meta: `${id}-meta` }
  // Named by what it is (state, title, unread); described by the rest, so a list reads quickly.
  const labelledBy = [ids.mark, ids.title, unread && ids.unread].filter(Boolean).join(" ")
  const describedBy = [time && ids.time, line && ids.line, (meta || project) && ids.meta].filter(Boolean).join(" ") || undefined
  return useRender({
    defaultTagName: isLink ? "a" : "button",
    render,
    props: mergeProps<"a">(
      {
        "aria-current": selected ? ("true" as const) : undefined,
        "aria-labelledby": labelledBy,
        "aria-describedby": describedBy,
        type: isLink ? undefined : ("button" as const),
        className: cn(
          "group/task-row relative flex w-full min-w-0 items-start gap-2.5 rounded-md px-3 py-2.5 text-start select-none",
          "transition-[background-color] duration-(--motion-fast) ease-(--motion-ease)",
          "hover:bg-surface-hover active:bg-surface-selected aria-[current=true]:bg-surface-selected",
          className
        ),
        children: (
          <>
            {selected ? (
              <span data-slot="task-row-bar" aria-hidden="true" className="pointer-events-none absolute inset-y-2 start-1.5 w-0.5 rounded-xs bg-primary-text" />
            ) : null}
            {/* The mark centers on the title's 20px line. */}
            <span data-slot="task-row-mark" className="flex h-5 w-3 shrink-0 items-center justify-center">
              <StatusOrb id={ids.mark} state={state} size="xs" tooltip={false} />
            </span>
            <span data-slot="task-row-body" className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex min-w-0 items-center gap-2">
                <span id={ids.title} data-slot="task-row-title" className={cn("min-w-0 flex-1 truncate text-text-body", selected ? "type-ui-emphasis" : "type-ui")}>
                  {title}
                </span>
                {time ? (
                  <span id={ids.time} data-slot="task-row-time" className="type-caption shrink-0 text-text-label">
                    {time}
                  </span>
                ) : null}
              </span>
              {line ? (
                <span id={ids.line} data-slot="task-row-line" className="type-ui truncate text-text-secondary">
                  {line}
                </span>
              ) : null}
              {meta || project ? (
                <span id={ids.meta} data-slot="task-row-meta" className="type-caption flex min-w-0 items-center gap-1.5 text-text-label">
                  {project}
                  {meta ? <span className="truncate">{meta}</span> : null}
                </span>
              ) : null}
              {helpers ? <span data-slot="task-row-helpers">{helpers}</span> : null}
            </span>
            <span data-slot="task-row-unread" className="flex h-5 w-3 shrink-0 items-center justify-center">
              {unread ? (
                <>
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-info-fill" />
                  <span id={ids.unread} className="sr-only">{unreadLabel}</span>
                </>
              ) : null}
            </span>
          </>
        ),
      },
      props
    ),
    state: { slot: "task-row" },
  })
}

export { TaskRow }
