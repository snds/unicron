// Promoted from: hand-raised from the Mercury review (none)
import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

/** What an agent, a job or a device is doing. */
export type StatusOrbState = "idle" | "thinking" | "working" | "needs-you" | "done" | "failed" | "offline"

export const statusOrbStates: readonly StatusOrbState[] = ["idle", "thinking", "working", "needs-you", "done", "failed", "offline"]

/** The words for each state: the tooltip and the accessible name. Hosts pass only the state. */
export const statusOrbCopy: Record<StatusOrbState, string> = {
  idle: "Idle",
  thinking: "Thinking",
  working: "Working",
  "needs-you": "Needs you",
  done: "Done",
  failed: "Failed",
  offline: "Offline",
}

export type StatusOrbSize = "xs" | "sm" | "md"

export interface StatusOrbProps extends Omit<React.ComponentProps<"span">, "children"> {
  state: StatusOrbState
  /** xs 12px (a step in a trace), sm 16px (a row, a header), md 20px (a nav item, a hero). */
  size?: StatusOrbSize
  /** Show the words in a tooltip on hover. Turn it off inside a control that has its own tooltip. */
  tooltip?: boolean
  /** Words in another language. Defaults to `statusOrbCopy[state]`. */
  label?: string
}

/**
 * One glanceable state, without words on screen. Each state differs by shape and motion as well as
 * colour, so it reads without colour too:
 *
 * | state | shape | motion | colour |
 * |---|---|---|---|
 * | idle | small dot | none | muted |
 * | thinking | dot in a soft halo | the halo breathes | running |
 * | working | dot in a ring with a gap | the ring turns | running |
 * | needs-you | dot in a solid ring | the ring pulses out | attention |
 * | done | check | none | success |
 * | failed | `error` glyph | none | destructive |
 * | offline | hollow ring | none | muted |
 *
 * With reduced motion the halo and the pulse hold still and the working ring becomes dashed.
 */
export function StatusOrb({ state, size = "sm", tooltip = true, label, className, ...props }: StatusOrbProps) {
  const words = label ?? statusOrbCopy[state]
  const glyph = state === "done" ? "check_circle" : state === "failed" ? "error" : null
  const orb = (
    <span
      data-slot="status-orb"
      data-state={state}
      data-size={size}
      role="img"
      aria-label={words}
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      {...props}
    >
      {glyph ? (
        <Icon name={glyph} fill data-slot="status-orb-glyph" />
      ) : (
        <>
          <span data-slot="status-orb-halo" aria-hidden />
          <span data-slot="status-orb-dot" aria-hidden />
        </>
      )}
    </span>
  )
  if (!tooltip) return orb
  return (
    <Tooltip>
      <TooltipTrigger render={orb} />
      <TooltipContent>{words}</TooltipContent>
    </Tooltip>
  )
}
