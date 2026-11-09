// Promoted from: hand-raised from the Mercury review (none)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { useViewport } from "../use-viewport"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { AdaptiveSheetContent, Sheet, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { StatusOrb, type StatusOrbState } from "./status-orb"

export type RunStepState = "running" | "done" | "failed" | "stopped"

export interface RunStep {
  id: string
  /** A few words: the tool or the action ("Read package.json"). Drawn in mono. */
  label: string
  state: RunStepState
  /** Epoch milliseconds. */
  startedAt: number
  endedAt?: number
  /**
   * Arguments and output, for a popover (a sheet on a phone). Keep it short and link to the log for
   * the full input and output; they never render inline.
   */
  detail?: React.ReactNode
}

/** Every word RunTrace draws or says. Hosts pass data, not copy; swap this for another language. */
export const runTraceCopy = {
  steps: (n: number) => (n === 1 ? "1 step" : `${n} steps`),
  failed: (n: number) => `${n} failed`,
  state: { running: "Running", done: "Done", failed: "Failed", stopped: "Stopped" } satisfies Record<RunStepState, string>,
  details: "Details",
  hideReasoning: "Hide reasoning",
  showReasoning: "Show reasoning",
}

/** "<1s", "12s", "1m 05s", "1h 02m". */
export function formatRunDuration(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000)
  if (s < 1) return "<1s"
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, "0")}s`
  return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, "0")}m`
}

const ORB: Record<RunStepState, StatusOrbState> = { running: "working", done: "done", failed: "failed", stopped: "idle" }

/** The time, ticking once a second while something is live. */
function useNow(live: boolean) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (!live) return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [live])
  return now
}

export interface RunTraceProps extends Omit<React.ComponentProps<"div">, "children"> {
  steps: readonly RunStep[]
  /** The run is going. It opens while live and folds to one line when it ends. */
  live?: boolean
  /** Reasoning text as it streams: a three-line window that keeps to the newest line. */
  reasoning?: string
  /** Open state, for a host that keeps it per message. A run going live or ending calls onOpenChange too. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** When the run started and ended (epoch ms). Default: the first step's start and the last step's end. */
  startedAt?: number
  endedAt?: number
}

/**
 * What an agent is doing and what it did. While live it is open on the current step; when the run
 * ends it folds to one line: the time, the step count and how many failed. Each step is a state, a
 * short label and its time. Detail opens in a popover, or a sheet on a phone, never inline.
 */
function RunTrace({
  steps,
  live = false,
  reasoning,
  open: openProp,
  defaultOpen,
  onOpenChange,
  startedAt,
  endedAt,
  className,
  ...props
}: RunTraceProps) {
  const [openState, setOpenState] = React.useState(defaultOpen ?? live)
  const open = openProp ?? openState
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (openProp === undefined) setOpenState(next)
      onOpenChange?.(next)
    },
    [openProp, onOpenChange]
  )
  // Opens when a run goes live, folds when it ends.
  const wasLive = React.useRef(live)
  React.useEffect(() => {
    if (wasLive.current !== live) setOpen(live)
    wasLive.current = live
  }, [live, setOpen])

  const [showReasoning, setShowReasoning] = React.useState(true)
  const now = useNow(live)
  const start = startedAt ?? Math.min(...steps.map((s) => s.startedAt), now)
  const end = live ? now : endedAt ?? Math.max(start, ...steps.map((s) => s.endedAt ?? s.startedAt))
  const failed = steps.filter((s) => s.state === "failed").length
  const current = [...steps].reverse().find((s) => s.state === "running")
  const time = formatRunDuration(end - start)
  const copy = runTraceCopy

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      data-slot="run-trace"
      data-live={live ? "" : undefined}
      className={cn("flex min-w-0 flex-col gap-1.5", className)}
      {...props}
    >
      <CollapsibleTrigger
        data-slot="run-trace-trigger"
        className="type-meta hover:text-foreground focus-visible:ring-ring/50 -mx-1 flex w-fit max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-left outline-none transition-colors focus-visible:ring-3"
      >
        {/* The spaces between parts are for the button's name; a flex row draws none of them. */}
        <StatusOrb state={live ? "working" : failed ? "failed" : "done"} size="xs" tooltip={false} />{" "}
        {live && current ? <><span className="truncate font-mono">{current.label}</span>{" "}</> : null}
        <span>{time}</span>{" "}
        <Dot />{" "}
        <span>{copy.steps(steps.length)}</span>
        {failed ? (
          <>
            {" "}<Dot />{" "}
            <span className="text-destructive">{copy.failed(failed)}</span>
          </>
        ) : null}
        <Icon name="keyboard_arrow_down" className="transition-transform in-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="run-trace-content" className="flex flex-col gap-1.5">
        {reasoning ? (
          <div className="flex items-start gap-1">
            {showReasoning ? <Reasoning text={reasoning} /> : <span className="flex-1" />}
            <IconButton
              size="icon-xs"
              variant="ghost-muted"
              icon={showReasoning ? "visibility_off" : "visibility"}
              label={showReasoning ? copy.hideReasoning : copy.showReasoning}
              aria-pressed={!showReasoning}
              onClick={() => setShowReasoning((v) => !v)}
            />
          </div>
        ) : null}
        <ol data-slot="run-trace-steps" className="flex flex-col gap-1">
          {steps.map((step) => (
            <RunTraceStep key={step.id} step={step} now={now} />
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Dot() {
  return <span aria-hidden>·</span>
}

/**
 * Three lines of the newest reasoning, the older lines fading out at the top. The fade is a plain
 * mask-image, not Tailwind's mask-t-* utilities: those bring a dozen @property rules, which every
 * app paid for (0.2 KB gzipped) because the stylesheet scans every component. Any opaque colour
 * works as the mask's solid end; --foreground is one.
 */
function Reasoning({ text }: { text: string }) {
  const ref = React.useRef<HTMLParagraphElement>(null)
  React.useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [text])
  return (
    <p
      ref={ref}
      data-slot="run-trace-reasoning"
      className="type-support max-h-[calc(var(--type-support-leading)*3)] min-w-0 flex-1 overflow-hidden whitespace-pre-wrap [mask-image:linear-gradient(to_bottom,transparent,var(--foreground)_50%)]"
    >
      {text}
    </p>
  )
}

function RunTraceStep({ step, now }: { step: RunStep; now: number }) {
  const copy = runTraceCopy
  const time = formatRunDuration((step.endedAt ?? now) - step.startedAt)
  return (
    <li data-slot="run-trace-step" data-state={step.state} className="flex min-w-0 items-center gap-2">
      <StatusOrb state={ORB[step.state]} label={copy.state[step.state]} size="xs" />{" "}
      <span className="min-w-0 flex-1 font-mono text-(length:--type-meta-size) leading-(--type-meta-leading) break-words">{step.label}</span>{" "}
      <span className="type-meta shrink-0">{time}</span>
      {step.detail ? <StepDetail step={step} /> : null}
    </li>
  )
}

/** A popover beside the step; on a phone, a sheet from the bottom. */
function StepDetail({ step }: { step: RunStep }) {
  const { widthClass } = useViewport()
  const trigger = <IconButton size="icon-xs" variant="ghost-muted" icon="info" label={`${runTraceCopy.details}: ${step.label}`} />
  if (widthClass === "compact") {
    return (
      <Sheet>
        <SheetTrigger render={trigger} />
        <AdaptiveSheetContent>
          <SheetHeader>
            <SheetTitle className="font-mono">{step.label}</SheetTitle>
          </SheetHeader>
          <div data-slot="run-trace-detail" className="px-4 pb-4">
            {step.detail}
          </div>
        </AdaptiveSheetContent>
      </Sheet>
    )
  }
  return (
    <Popover>
      <PopoverTrigger render={trigger} />
      <PopoverContent align="end" data-slot="run-trace-detail">
        {step.detail}
      </PopoverContent>
    </Popover>
  )
}

export { RunTrace }
