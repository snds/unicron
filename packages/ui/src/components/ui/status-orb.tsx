// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2.0: the Figma Status Mark 143:540, round marks in the shared status colours; needs-you keeps its ink outline; no app PR, no DSA record)
import * as React from "react"

import { cn } from "../../lib/utils"
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

/**
 * The states drawn as an 11px disc, as the Figma Status Mark draws them (143:540). Done and failed
 * carry a check or a cross in the fill's own ink. Queued, paused and stopped are a disc with a
 * clock, a pause or a stop cut out of it (even-odd), so the ground shows through. Drawn here rather than taken
 * from the icon set, so the mark stays the same whichever icon family the app uses.
 */
const STROKED: Partial<Record<StatusOrbState, string>> = {
  done: "M3.6 6.1 5.2 7.6 8.4 4.4",
  failed: "M4.2 4.2 7.8 7.8M7.8 4.2 4.2 7.8",
}
// The cut-out shapes, as subpaths of the disc filled even-odd (no mask, so nothing is composited).
const CUT: Partial<Record<StatusOrbState, string>> = {
  queued: "M5.3 2.8H6.7V5.3H8.3V6.7H5.3Z",
  paused: "M3.9 3.5H5.3V8.5H3.9ZM6.7 3.5H8.1V8.5H6.7Z",
  stopped: "M4 4H8V8H4Z",
}
const DISC = "M6 .5a5.5 5.5 0 1 1 0 11a5.5 5.5 0 1 1 0-11Z"

function Disc({ state }: { state: StatusOrbState }) {
  const stroke = STROKED[state]
  const cut = CUT[state]
  return (
    <svg data-slot="status-orb-glyph" data-mark={state} data-cut={cut ? "" : undefined} viewBox="0 0 12 12" aria-hidden focusable="false">
      <path d={cut ? DISC + cut : DISC} fill="currentColor" fillRule="evenodd" />
      {stroke ? (
        <path d={stroke} fill="none" stroke={`var(--c-status-orb-${state}-ink)`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
    </svg>
  )
}

/**
 * One glanceable state, without words on screen. Each state differs by shape and motion as well as
 * colour, so it reads without colour too:
 *
 * | state | shape | motion | colour |
 * |---|---|---|---|
 * | idle | hollow ring | none | status/idle |
 * | queued | disc with a clock cut out | none | status/idle |
 * | thinking | dot in a soft halo | the halo breathes | status/working |
 * | working | faint track with a quarter arc | the arc turns | status/working |
 * | paused | disc with a pause cut out | none | status/idle |
 * | needs-you | dot with an ink outline in a ring | the ring pulses out | the yellow |
 * | done | filled circle with a check | none | status/done |
 * | stopped | disc with a stop cut out | none | status/idle |
 * | failed | filled circle with a cross | none | status/failed |
 * | offline | dashed hollow ring | none | status/idle |
 *
 * Queued, paused and stopped are still: each is waiting or over, so none of them moves. Stopped is
 * a run someone ended, apart from one that failed or one that never started.
 *
 * With reduced motion the halo and the pulse hold still and the working track becomes dashed.
 *
 * Every state is drawn as in the 2.0 Figma Status Mark (143:540): round marks in the shared status
 * roles, the same in every app. Only thinking's breathing halo is code's own: Figma draws it still.
 * The yellow has no lightness contrast with the stone surfaces,
 * so the needs-you square carries a 1px outline in the yellow's own ink
 * (`--c-status-orb-needs-you-edge`): on stone the outline draws the shape, on graphite the yellow
 * does. The turning ring is the one motion reserved for agent work; generic loading uses Spinner.
 */
export function StatusOrb({ state, size = "sm", tooltip = true, label, className, ...props }: StatusOrbProps) {
  const words = label ?? statusOrbCopy[state]
  const disc = state in STROKED || state in CUT
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
      {disc ? (
        <Disc state={state} />
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
