// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: mono meta lines, the live colour on the running step, the stylesheet's one focus ring; contract 5.1; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { IconButton } from "../icon-button"
import { useViewport } from "../use-viewport"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { AdaptiveSheetContent, Sheet, SheetHeader, SheetTitle, SheetTrigger } from "./sheet"
import { StatusOrb, type StatusOrbState } from "./status-orb"

/** `needs-you`: the step is blocked on a person's answer (an AgentPrompt in the conversation). */
export type RunStepState = "running" | "needs-you" | "done" | "failed" | "stopped"

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

/**
 * Something that happened between steps, not a step itself: an answer, a stop, a pause, a resume.
 * One line in meta type, an icon and a few words, drawn after the step it follows.
 */
export interface RunMark {
  id: string
  /** The step it follows. Without one it comes before the first step. */
  after?: string
  /** A few words: "Allowed once", "Paused for a game". */
  label: string
  icon?: IconName
  /** Epoch milliseconds. Not drawn; for the host's own ordering and for the title. */
  at?: number
}

/** Every word RunTrace draws or says. Hosts pass data, not copy; swap this for another language. */
export const runTraceCopy = {
  steps: (n: number) => (n === 1 ? "1 step" : `${n} steps`),
  failed: (n: number) => `${n} failed`,
  state: { running: "Running", "needs-you": "Needs you", done: "Done", failed: "Failed", stopped: "Stopped" } satisfies Record<RunStepState, string>,
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

const ORB: Record<RunStepState, StatusOrbState> = { running: "working", "needs-you": "needs-you", done: "done", failed: "failed", stopped: "stopped" }

/** How the whole run reads on its one line: waiting on you beats working; failed beats stopped beats done. */
function runOrb(steps: readonly RunStep[], live: boolean): StatusOrbState {
  if (live) return steps.some((s) => s.state === "needs-you") ? "needs-you" : "working"
  if (steps.some((s) => s.state === "failed")) return "failed"
  if (steps.some((s) => s.state === "stopped")) return "stopped"
  return "done"
}

/** Steps with each mark after the step it follows; a mark without a step it can find goes last. */
function interleave(steps: readonly RunStep[], marks: readonly RunMark[]) {
  type Row = { kind: "step"; step: RunStep } | { kind: "mark"; mark: RunMark }
  const ids = new Set(steps.map((s) => s.id))
  const rows: Row[] = marks.filter((m) => m.after === undefined).map((mark) => ({ kind: "mark", mark }))
  for (const step of steps) {
    rows.push({ kind: "step", step })
    for (const mark of marks) if (mark.after === step.id) rows.push({ kind: "mark", mark })
  }
  for (const mark of marks) if (mark.after !== undefined && !ids.has(mark.after)) rows.push({ kind: "mark", mark })
  return rows
}

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
  /** What happened between steps: answers, stops, pauses. Each goes after the step it names. */
  marks?: readonly RunMark[]
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
  marks = [],
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
  const current = [...steps].reverse().find((s) => s.state === "running" || s.state === "needs-you")
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
        className="type-meta hover:text-text-body hover:bg-state-hover active:bg-state-pressed hit-area -mx-1 flex w-fit max-w-full cursor-pointer items-center gap-1.5 rounded-sm px-1 py-0.5 text-left transition-colors duration-(--motion-fast) ease-(--motion-ease)"
      >
        {/* The spaces between parts are for the button's name; a flex row draws none of them. */}
        <StatusOrb state={runOrb(steps, live)} size="xs" tooltip={false} />{" "}
        {live && current ? <><span className={cn("truncate", current.state === "running" && "text-secondary-live")}>{current.label}</span>{" "}<Sep />{" "}</> : null}
        <span>{time}</span>{" "}
        <Sep />{" "}
        <span>{copy.steps(steps.length)}</span>
        {failed ? (
          <>
            {" "}<Sep />{" "}
            <span className="text-critical-text">{copy.failed(failed)}</span>
          </>
        ) : null}
        <Icon name="chevron--down" size="sm" className="transition-transform duration-(--motion-fast) ease-(--motion-ease) in-data-panel-open:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent data-slot="run-trace-content" className="flex flex-col gap-1.5">
        {reasoning ? (
          <div className="flex items-start gap-1">
            {showReasoning ? <Reasoning text={reasoning} /> : <span className="flex-1" />}
            <IconButton
              size="icon-xs"
              variant="ghost-muted"
              icon={showReasoning ? "view--off" : "view"}
              label={showReasoning ? copy.hideReasoning : copy.showReasoning}
              aria-pressed={!showReasoning}
              onClick={() => setShowReasoning((v) => !v)}
            />
          </div>
        ) : null}
        <ol data-slot="run-trace-steps" className="flex flex-col gap-1">
          {interleave(steps, marks).map((row) =>
            row.kind === "step" ? (
              <RunTraceStep key={row.step.id} step={row.step} now={now} />
            ) : (
              <RunTraceMark key={`mark-${row.mark.id}`} mark={row.mark} />
            )
          )}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** Between the facts on the run's one line: `//`, as every mono line in the system. */
function Sep() {
  return <span aria-hidden>{"//"}</span>
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
      className="type-caption text-text-secondary max-h-[calc(var(--type-caption-leading)*3)] min-w-0 flex-1 overflow-hidden whitespace-pre-wrap [mask-image:linear-gradient(to_bottom,transparent,var(--foreground)_50%)]"
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
      <span className={cn("type-meta min-w-0 flex-1 break-words", step.state === "running" ? "text-secondary-live" : "text-text-body")}>{step.label}</span>{" "}
      <span className="type-meta shrink-0">{time}</span>
      {step.detail ? <StepDetail step={step} /> : null}
    </li>
  )
}

/** Between steps: the icon where a step's orb sits, and a few quiet words. */
function RunTraceMark({ mark }: { mark: RunMark }) {
  return (
    <li data-slot="run-trace-mark" className="type-meta flex min-w-0 items-center gap-2">
      <span aria-hidden className="flex size-(--c-status-orb-size-xs) shrink-0 items-center justify-center">
        {mark.icon ? <Icon name={mark.icon} className="size-full" /> : <span className="size-1 bg-current" />}
      </span>
      <span className="min-w-0 flex-1 break-words">{mark.label}</span>
    </li>
  )
}

/** A popover beside the step; on a phone, a sheet from the bottom. */
function StepDetail({ step }: { step: RunStep }) {
  const { widthClass } = useViewport()
  // A 32px button in a 20px line: it hangs 6px over the line above and below, so a step with
  // detail is as tall as one without.
  const trigger = <IconButton size="icon-xs" variant="ghost-muted" icon="information" label={`${runTraceCopy.details}: ${step.label}`} className="-my-1.5" />
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
