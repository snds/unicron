// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2026-11 design direction; the segmented bar inside Figma 9:181 "List Row" and on the Warpcore, Synapse and Lockdown frames; no app PR, no DSA record)
"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "../../lib/utils"

/** How far past which a `budget` bar warns, and past which it says it's nearly spent. */
export const progressBudgetThresholds = { warning: 0.7, over: 0.9 } as const

/** How many cells a segmented bar is cut into unless `segments` says otherwise. */
export const progressDefaultSegments = 32

export type ProgressVariant = "bar" | "segmented"
export type ProgressTone = "default" | "primary" | "live" | "budget" | "critical"

type ProgressProps = ProgressPrimitive.Root.Props & {
  /**
   * `bar`: a continuous fill. `segmented`: a row of equal cells, 4px tall and 2px apart, lit from
   * the start by the share of `value` between `min` and `max`.
   */
  variant?: ProgressVariant
  /**
   * `default`: a bar fills in `primary` and turns `success` once complete; a segmented bar fills
   * in the live colour, because that is what it shows in a row (an agent's run).
   * `primary`: the identity colour on either, for a quantity that is not live (a spend, a score).
   * `live`: the live colour on either.
   * `budget`: a spend against a cap, `warning` past 70% and `destructive` past 90%.
   * `critical`: the critical fill, for a countdown that is about to run out.
   * Only `default` on a bar ever turns `success`.
   */
  tone?: ProgressTone
  /**
   * Segmented only: how many cells. Default 32. For one cell per step of a checklist, pass the
   * step count (`segments={7} max={7}`).
   */
  segments?: number
}

function budgetLevel(value: number | null, min: number, max: number) {
  if (value === null || max <= min) return undefined
  const share = (value - min) / (max - min)
  return share > progressBudgetThresholds.over ? "over" : share > progressBudgetThresholds.warning ? "warning" : "ok"
}

type Fill = "primary" | "complete" | "live" | "budget" | "critical"

/** The fill a tone asks for on a variant. Only a default bar turns `success` once complete. */
function fillOf(variant: ProgressVariant, tone: ProgressTone): Fill {
  if (tone === "default") return variant === "segmented" ? "live" : "complete"
  return tone
}

// The fill's colour, by the root's `data-fill` (and `data-level` for a budget). Each is a knob, so
// an app re-maps a colour once for every bar.
const fill =
  "bg-(--c-progress-fill) group-data-[fill=complete]/progress:group-data-complete/progress:bg-(--c-progress-complete) group-data-[fill=live]/progress:bg-(--c-progress-tone-live) group-data-[fill=critical]/progress:bg-(--c-progress-tone-critical) group-data-[level=warning]/progress:bg-(--c-progress-warning) group-data-[level=over]/progress:bg-(--c-progress-over)"

/**
 * Progress: how far along a task is, or how much of something is left. Base UI's Progress gives
 * it `role="progressbar"` and its values; pass `aria-label` or a `ProgressLabel` child to name it.
 * `value={null}` is indeterminate: the track pulses (still under reduced motion). The cells of a
 * segmented bar are decoration; the root says the value.
 */
function Progress({
  className,
  children,
  value,
  min = 0,
  max = 100,
  variant = "bar",
  tone = "default",
  segments = progressDefaultSegments,
  ...props
}: ProgressProps) {
  const level = tone === "budget" ? budgetLevel(value, min, max) : undefined
  return (
    <ProgressPrimitive.Root
      value={value}
      min={min}
      max={max}
      data-slot="progress"
      data-variant={variant}
      data-tone={tone}
      data-fill={fillOf(variant, tone)}
      data-level={level}
      className={cn("group/progress flex flex-wrap gap-x-3 gap-y-1", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        {variant === "segmented" ? (
          <ProgressSegments value={value} min={min} max={max} segments={segments} />
        ) : (
          <ProgressIndicator />
        )}
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}

function ProgressTrack({ className, ...props }: ProgressPrimitive.Track.Props) {
  return (
    <ProgressPrimitive.Track
      className={cn(
        // The empty part is the hairline colour, on a bar and on a cell alike.
        "relative flex h-(--c-progress-height) w-full items-center overflow-x-hidden rounded-none bg-(--c-progress-track) group-data-indeterminate/progress:animate-pulse",
        // Segmented: the track is only the gaps' container; each cell draws its own empty part.
        "group-data-[variant=segmented]/progress:gap-(--c-progress-segment-gap) group-data-[variant=segmented]/progress:overflow-visible group-data-[variant=segmented]/progress:bg-transparent",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

function ProgressIndicator({
  className,
  ...props
}: ProgressPrimitive.Indicator.Props) {
  return (
    <ProgressPrimitive.Indicator
      data-slot="progress-indicator"
      // Base UI sets the width; it moves at --motion-base, and only its colour moves under reduced motion.
      className={cn("h-full transition-[width,background-color] duration-(--motion-base)", fill, className)}
      {...props}
    />
  )
}

/** How many of `segments` cells are lit. It rounds down: a bar never looks done before it is. */
function litSegments(value: number | null, min: number, max: number, segments: number) {
  if (value === null || max <= min) return 0
  const share = Math.min(1, Math.max(0, (value - min) / (max - min)))
  // The small nudge keeps a share like 0.3 of 10 cells at 3, not 2.999… rounded down to 2.
  return Math.floor(share * segments + 1e-9)
}

/** The cells. Decorative: the root already says "19 of 32" to a screen reader. */
function ProgressSegments({ value, min, max, segments }: { value: number | null; min: number; max: number; segments: number }) {
  const count = Math.max(0, Math.round(segments))
  const lit = litSegments(value, min, max, count)
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          data-slot="progress-segment"
          data-filled={i < lit ? "" : undefined}
          // An empty cell is the hairline colour; a lit one takes the tone's fill.
          className={cn("h-full flex-1 transition-colors", i < lit ? fill : "bg-(--c-progress-track)")}
        />
      ))}
    </>
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("type-label", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn("type-meta ml-auto", className)}
      data-slot="progress-value"
      {...props}
    />
  )
}

export {
  Progress,
  ProgressTrack,
  ProgressIndicator,
  ProgressLabel,
  ProgressValue,
}
