// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: hand-raised from the Mercury review (none)
"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cn } from "../../lib/utils"

/** How far past which a `budget` bar warns, and past which it says it's nearly spent. */
export const progressBudgetThresholds = { warning: 0.7, over: 0.9 } as const

export type ProgressVariant = "bar" | "segmented"
export type ProgressTone = "default" | "budget"

type ProgressProps = ProgressPrimitive.Root.Props & {
  /**
   * `bar`: a continuous fill. `segmented`: one cell per step (`max` cells, `value` filled), for a
   * checklist's "3 of 7". Keep segmented to about a dozen steps; past that, use the bar.
   */
  variant?: ProgressVariant
  /**
   * `default`: the fill is `primary`, and `success` once complete. `budget`: a spend against a cap,
   * `warning` past 70% and `destructive` past 90%; it never turns `success`.
   */
  tone?: ProgressTone
}

function budgetLevel(value: number | null, min: number, max: number) {
  if (value === null || max <= min) return undefined
  const share = (value - min) / (max - min)
  return share > progressBudgetThresholds.over ? "over" : share > progressBudgetThresholds.warning ? "warning" : "ok"
}

/**
 * Progress: how far along a task is. Base UI's Progress gives it `role="progressbar"` and its
 * values; pass `aria-label` or a `ProgressLabel` child to name it. `value={null}` is
 * indeterminate: the track pulses (still under reduced motion).
 */
function Progress({
  className,
  children,
  value,
  min = 0,
  max = 100,
  variant = "bar",
  tone = "default",
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
      data-level={level}
      className={cn("group/progress flex flex-wrap gap-3", className)}
      {...props}
    >
      {children}
      <ProgressTrack>
        {variant === "segmented" ? (
          <ProgressSegments value={value} min={min} max={max} />
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
        "bg-muted h-(--c-progress-height) rounded-full relative flex w-full items-center overflow-x-hidden group-data-indeterminate/progress:animate-pulse",
        // Segmented: the track is only the gaps' container; each cell draws its own track.
        "group-data-[variant=segmented]/progress:gap-(--c-progress-segment-gap) group-data-[variant=segmented]/progress:overflow-visible group-data-[variant=segmented]/progress:bg-transparent",
        className
      )}
      data-slot="progress-track"
      {...props}
    />
  )
}

// The fill's colour, by tone and state. `success` once complete, unless it's a budget.
const fill =
  "bg-(--c-progress-fill) group-data-complete/progress:group-data-[tone=default]/progress:bg-(--c-progress-complete) group-data-[level=warning]/progress:bg-(--c-progress-warning) group-data-[level=over]/progress:bg-(--c-progress-over)"

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

/** One cell per step. Decorative: the root already says "3 of 7" to a screen reader. */
function ProgressSegments({ value, min, max }: { value: number | null; min: number; max: number }) {
  const count = Math.max(0, Math.round(max - min))
  const filled = value === null ? 0 : Math.min(count, Math.max(0, Math.floor(value - min)))
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          aria-hidden
          data-slot="progress-segment"
          data-filled={i < filled ? "" : undefined}
          className={cn("bg-muted h-full flex-1 rounded-full transition-colors", i < filled && fill)}
        />
      ))}
    </>
  )
}

function ProgressLabel({ className, ...props }: ProgressPrimitive.Label.Props) {
  return (
    <ProgressPrimitive.Label
      className={cn("text-sm font-medium", className)}
      data-slot="progress-label"
      {...props}
    />
  )
}

function ProgressValue({ className, ...props }: ProgressPrimitive.Value.Props) {
  return (
    <ProgressPrimitive.Value
      className={cn("text-muted-foreground ml-auto text-sm tabular-nums", className)}
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
