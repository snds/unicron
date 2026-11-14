// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: live = secondary-live, needs-you = the yellow with an ink outline, square marks; contract 5.1; no app PR, no DSA record)
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
 * | idle | small square | none | label ink |
 * | queued | `time--filled` glyph (a clock) | none | label ink |
 * | thinking | square in a soft halo | the halo breathes | live (`secondary-live`) |
 * | working | square in a square ring with a gap | the ring turns | live |
 * | paused | `pause--outline--filled` glyph | none | label ink |
 * | needs-you | square with an ink outline in a solid ring | the ring pulses out | the yellow |
 * | done | check | none | success |
 * | stopped | `stop--filled` glyph | none | label ink |
 * | failed | `warning--filled` glyph (a circle with an exclamation mark) | none | critical text |
 * | offline | hollow square | none | label ink |
 *
 * Queued, paused and stopped are still: each is waiting or over, so none of them moves. Stopped is
 * a run someone ended, apart from one that failed or one that never started.
 *
 * With reduced motion the halo and the pulse hold still and the working ring becomes dashed.
 *
 * Marks are squares (contract §1.6). The yellow has no lightness contrast with the stone surfaces,
 * so the needs-you square carries a 1px outline in the yellow's own ink
 * (`--c-status-orb-needs-you-edge`): on stone the outline draws the shape, on graphite the yellow
 * does. The turning ring is the one motion reserved for agent work; generic loading uses Spinner.
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
          <span
            data-slot="status-orb-dot"
            aria-hidden
            className={state === "needs-you" ? "ring-(length:--stroke-rule) ring-(--c-status-orb-needs-you-edge)" : undefined}
          />
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
