// Promoted from: hand-raised from the Mercury review (none)
import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

/** What an agent, a job or a device is doing. */
export type StatusOrbState = "idle" | "queued" | "thinking" | "working" | "paused" | "needs-you" | "done" | "stopped" | "failed" | "offline"

export const statusOrbStates: readonly StatusOrbState[] = ["idle", "queued", "thinking", "working", "paused", "needs-you", "done", "stopped", "failed", "offline"]

/** The words for each state: the tooltip and the accessible name. Hosts pass only the state. */
export const statusOrbCopy: Record<StatusOrbState, string> = {
  idle: "Idle",
  queued: "Queued",
  thinking: "Thinking",
  working: "Working",
  paused: "Paused",
  "needs-you": "Needs you",
  done: "Done",
  stopped: "Stopped",
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

/** States drawn as a filled glyph rather than a dot and a halo. */
const GLYPHS: Partial<Record<StatusOrbState, IconName>> = {
  queued: "time--filled",
  paused: "pause--outline--filled",
  done: "checkmark--filled",
  stopped: "stop--filled",
  failed: "warning--filled",
}

/**
 * One glanceable state, without words on screen. Each state differs by shape and motion as well as
 * colour, so it reads without colour too:
 *
 * | state | shape | motion | colour |
 * |---|---|---|---|
 * | idle | small dot | none | muted |
 * | queued | `time--filled` glyph (a clock) | none | muted |
 * | thinking | dot in a soft halo | the halo breathes | running |
 * | working | dot in a ring with a gap | the ring turns | running |
 * | paused | `pause--outline--filled` glyph | none | muted |
 * | needs-you | dot in a solid ring | the ring pulses out | attention |
 * | done | check | none | success |
 * | stopped | `stop--filled` glyph | none | muted |
 * | failed | `warning--filled` glyph (a circle with an exclamation mark) | none | destructive |
 * | offline | hollow ring | none | muted |
 *
 * Queued, paused and stopped are still: each is waiting or over, so none of them moves. Stopped is
 * a run someone ended, apart from one that failed or one that never started.
 *
 * With reduced motion the halo and the pulse hold still and the working ring becomes dashed.
 */
export function StatusOrb({ state, size = "sm", tooltip = true, label, className, ...props }: StatusOrbProps) {
  const words = label ?? statusOrbCopy[state]
  const glyph = GLYPHS[state] ?? null
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
        <Icon name={glyph} data-slot="status-orb-glyph" />
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
