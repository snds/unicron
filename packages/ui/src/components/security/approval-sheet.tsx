// Owned component (not generated): approve or deny a request from another device, agent, TV, or
// contact, with number matching and "This wasn't me". A component rather than a Dialog variant
// because it owns behaviour no parent has: an origin gate that can remove the approve control,
// matching that gates the confirm action, a timeout that denies by itself, a retry limit, an arming
// delay, and a third action kind (report).
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Spec: docs/specs/security/approval-sheet.md
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Button } from "../ui/button"
import { DialogAction, DialogActions } from "../ui/dialog"
import { Input } from "../ui/input"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "../ui/item"
import { AdaptiveSheetContent, Sheet, SheetHeader, SheetTitle } from "../ui/sheet"
import { Spinner } from "../ui/spinner"
import { readSecondsToken, useReducedMotion } from "./copy-countdown"
import { RiskTierBadge, type RiskTier } from "./risk-tier-badge"

export type ApprovalKind = "device" | "agent" | "device-code" | "contact-request" | "bridge"
export type ApprovalOrigin = "scan" | "pairing" | "push"
export type ApprovalDenyReason = "user" | "timeout" | "retries" | "origin"

export interface ApprovalContextRow {
  label: string
  value: string
  /** Shown stronger (the full domain for a device code). */
  emphasis?: boolean
}

export interface ApprovalMatching {
  /** `enter` wherever there is a keyboard or a number pad; `choose` for the watch and the compact popup only. */
  mode: "enter" | "choose"
  /** How many digits the other device shows. Three where the host's threat model asks. */
  digits: 2 | 3
  /** The digits the other device shows, from the signed request. Never generated here. */
  expected: string
  /** `choose` mode: the options, one of which is `expected`. */
  choices?: string[]
}

/** Title template and icon per kind. The component owns the words; hosts pass the kind. */
export const approvalSheetCopy: Record<ApprovalKind, { title: string; icon: IconName; prompt: string; defaultTier: RiskTier }> = {
  device: { title: "Approve a new device?", icon: "devices", prompt: "Enter the digits shown on the other device", defaultTier: "standard" },
  agent: { title: "Approve this agent?", icon: "smart_toy", prompt: "Enter the digits shown by the agent", defaultTier: "standard" },
  "device-code": { title: "Approve a sign-in on this screen?", icon: "tv", prompt: "Enter the digits shown on the screen", defaultTier: "official" },
  "contact-request": { title: "Approve this contact request?", icon: "group", prompt: "Enter the digits your contact reads to you", defaultTier: "standard" },
  bridge: { title: "Approve this bridge?", icon: "extension", prompt: "Enter the digits shown on the other device", defaultTier: "tolerated" },
}

export const approvalSheetOriginCopy: Record<ApprovalOrigin, string> = {
  scan: "Scanned from the screen in front of you.",
  pairing: "From a device you paired.",
  push: "Sent to this device.",
}

/** The texts the sheet speaks through its polite live region, verbatim from the spec. */
export const approvalSheetAnnouncements = {
  matched: "Number matches",
  wrong: "That number does not match, one try left",
  urgent: "10 seconds left",
  expired: "Request expired. Nothing was approved.",
  refused: "Device codes are approved only when you scan the screen in front of you.",
} as const

const WORD = { 2: "two", 3: "three" } as const
const MAX_TRIES = 2
const URGENT_SECONDS = 10
const CLOSE_MS = 1000

export interface ApprovalSheetProps {
  kind: ApprovalKind
  /** `device-code` approves only from `scan`: any other origin renders no approve control, and a notice says why. */
  origin: ApprovalOrigin
  /** What · who · where · when. The host supplies real facts from the signed request; the sheet never infers them. */
  context: ApprovalContextRow[]
  matching: ApprovalMatching
  /** When the request dies. Default: open time plus `--c-approval-lifetime` (60 s). */
  expiresAt?: number | Date
  /** Defaults by kind: `official` for device codes, `tolerated` for bridges, `standard` otherwise. */
  tier?: RiskTier
  busy?: boolean
  error?: string
  onApprove: () => void
  onDeny: (reason: ApprovalDenyReason) => void
  /** "This wasn't me": denies, and the host revokes the requesting session, logs it, and offers follow-ups. */
  onReport: () => void
  /** The sheet is modal and controlled. Default open; `onOpenChange(false)` fires once a decision has been shown. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type Phase = "default" | "matched" | "expired" | "denied" | "reported" | "refused"

export function ApprovalSheet({
  kind,
  origin,
  context,
  matching,
  expiresAt,
  tier,
  busy = false,
  error,
  onApprove,
  onDeny,
  onReport,
  open = true,
  onOpenChange,
}: ApprovalSheetProps) {
  const copy = approvalSheetCopy[kind]
  const refused = kind === "device-code" && origin !== "scan"
  const reducedMotion = useReducedMotion()
  const ids = React.useId()
  const contextId = `${ids}-context`
  const promptId = `${ids}-prompt`

  const root = React.useRef<HTMLDivElement>(null)
  const firstCell = React.useRef<HTMLInputElement>(null)
  const approveRef = React.useRef<HTMLButtonElement>(null)
  const denyRef = React.useRef<HTMLButtonElement>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // The clock starts when the sheet mounts. The default lifetime is the tier 3 knob on :root.
  const [openedAt] = React.useState(() => Date.now())
  const [defaultExpiresAt] = React.useState(
    () => openedAt + readSecondsToken(typeof document === "undefined" ? null : document.documentElement, "--c-approval-lifetime", 60) * 1000
  )
  const expiresAtMs = expiresAt === undefined ? defaultExpiresAt : expiresAt instanceof Date ? expiresAt.getTime() : expiresAt

  const [armed, setArmed] = React.useState(false)
  const [phase, setPhase] = React.useState<Phase>(refused ? "refused" : "default")
  const [tries, setTries] = React.useState(0)
  const [cells, setCells] = React.useState<string[]>(() => Array.from({ length: matching.digits }, () => ""))
  const [notice, setNotice] = React.useState<string | null>(null)
  const [live, setLive] = React.useState("")
  const [remaining, setRemaining] = React.useState(() => Math.max(0, Math.ceil((expiresAtMs - openedAt) / 1000)))
  const [urgentSaid, setUrgentSaid] = React.useState(false)

  const terminal = phase === "expired" || phase === "denied" || phase === "reported"

  // Arming delay: the tier 3 knob, read from the sheet once it is in the tree.
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setArmed(true), readSecondsToken(root.current, "--c-approval-arm-delay", 0.5) * 1000)
    return () => clearTimeout(t)
  }, [open])

  const stopClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }
  React.useEffect(() => stopClose, [])

  /** End the sheet: fire the callback, show the one-line state, then ask the host to close. */
  const resolve = (next: Exclude<Phase, "default" | "matched" | "refused">, reason?: ApprovalDenyReason) => {
    if (terminal) return
    setPhase(next)
    if (next === "reported") onReport()
    else onDeny(reason ?? "user")
    if (next !== "expired") {
      stopClose()
      closeTimer.current = setTimeout(() => onOpenChange?.(false), CLOSE_MS)
    }
  }

  // Timeout: tick once a second; announce at 10 s; deny at zero. Never a per-second announcement.
  const tick = React.useEffectEvent(() => {
    if (terminal) return
    const left = Math.max(0, Math.ceil((expiresAtMs - Date.now()) / 1000))
    setRemaining(left)
    if (left <= URGENT_SECONDS && left > 0 && !urgentSaid) {
      setUrgentSaid(true)
      setLive(approvalSheetAnnouncements.urgent)
    }
    if (left === 0) {
      setLive(approvalSheetAnnouncements.expired)
      resolve("expired", "timeout")
    }
  })
  React.useEffect(() => {
    if (!open || terminal) return
    const i = setInterval(() => tick(), 1000)
    return () => clearInterval(i)
  }, [open, terminal])

  // Focus follows the state: the first cell on open, Approve on match, Close on expiry.
  React.useEffect(() => {
    if (phase === "matched") approveRef.current?.focus()
    if (phase === "expired") denyRef.current?.focus()
  }, [phase])

  // ── matching ─────────────────────────────────────────────────────────────────────────────────
  const check = (entry: string) => {
    if (phase !== "default") return
    if (entry === matching.expected) {
      setNotice(null)
      setLive(approvalSheetAnnouncements.matched)
      setPhase("matched")
      return
    }
    const used = tries + 1
    setTries(used)
    setCells(Array.from({ length: matching.digits }, () => ""))
    if (used >= MAX_TRIES) {
      resolve("denied", "retries")
      return
    }
    const left = MAX_TRIES - used
    setNotice(`That number does not match. ${left} ${left === 1 ? "try" : "tries"} left.`)
    setLive(approvalSheetAnnouncements.wrong)
    firstCell.current?.focus()
  }

  const cellRefs = React.useRef<Array<HTMLInputElement | null>>([])
  const setCell = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1)
    const next = cells.slice()
    next[index] = digit
    setCells(next)
    if (digit && index < matching.digits - 1) cellRefs.current[index + 1]?.focus()
    if (next.every((c) => c !== "")) check(next.join(""))
  }
  const onCellKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // Enter never approves; after a match focus is already on Approve
      return
    }
    if (e.key === "Backspace" && cells[index] === "" && index > 0) {
      e.preventDefault()
      const next = cells.slice()
      next[index - 1] = ""
      setCells(next)
      cellRefs.current[index - 1]?.focus()
    }
  }
  const onCellPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, matching.digits)
    if (!digits) return
    e.preventDefault()
    const next = Array.from({ length: matching.digits }, (_, i) => digits[i] ?? "")
    setCells(next)
    cellRefs.current[Math.min(digits.length, matching.digits) - 1]?.focus()
    if (next.every((c) => c !== "")) check(next.join(""))
  }

  // ── actions (all guarded by the arming delay) ────────────────────────────────────────────────
  const approve = () => {
    if (!armed || phase !== "matched" || busy || error) return
    onApprove()
  }
  const deny = () => {
    if (!armed) return
    if (phase === "expired") {
      onOpenChange?.(false)
      return
    }
    resolve("denied", phase === "refused" ? "origin" : "user")
  }
  const report = () => {
    if (!armed) return
    resolve("reported")
  }
  const onBaseOpenChange = (next: boolean) => {
    if (next) return
    if (!armed) return // a double click that opened the request cannot close it either
    if (terminal) {
      onOpenChange?.(false)
      return
    }
    resolve("denied", phase === "refused" ? "origin" : "user")
  }

  const showApprove = !refused && phase !== "expired"
  const approveDisabled = !armed || phase !== "matched" || busy || !!error
  const expired = phase === "expired"
  const displayRemaining = reducedMotion ? Math.ceil(remaining / 5) * 5 : remaining
  const urgent = remaining <= URGENT_SECONDS

  const noticeText =
    phase === "denied"
      ? "Denied. Nothing was approved."
      : phase === "reported"
        ? "Reported. This request was denied, and the host will sign that session out."
        : refused
          ? approvalSheetAnnouncements.refused
          : notice
  const describedBy = `${contextId} ${promptId}`

  return (
    <Sheet open={open} onOpenChange={onBaseOpenChange} modal>
      <AdaptiveSheetContent
        aria-describedby={describedBy}
        initialFocus={refused || expired ? denyRef : matching.mode === "enter" ? firstCell : denyRef}
      >
        <div
          ref={root}
          data-slot="approval-sheet"
          data-kind={kind}
          data-origin={origin}
          data-phase={phase}
          data-armed={armed}
          className="flex min-w-(--c-approval-min-width) flex-col"
        >
          <SheetHeader data-slot="approval-sheet-header">
            <div className="flex items-center gap-2">
              <Icon name={copy.icon} data-slot="approval-sheet-icon" />
              <SheetTitle data-slot="approval-sheet-title">{copy.title}</SheetTitle>
              <RiskTierBadge data-slot="approval-sheet-tier" tier={tier ?? copy.defaultTier} verified size="sm" />
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-4 px-4">
            <ItemGroup id={contextId} data-slot="approval-sheet-context">
              {context.map((row, i) => (
                <Item key={i} variant="muted" size="xs">
                  <ItemContent>
                    <ItemDescription>{row.label}</ItemDescription>
                    <ItemTitle>{row.emphasis ? <strong className="font-semibold">{row.value}</strong> : row.value}</ItemTitle>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>

            {!refused && !terminal && (
              <div data-slot="approval-sheet-match" className="flex flex-col gap-2">
                <p id={promptId} data-slot="approval-sheet-match-prompt" className="text-sm">
                  {copy.prompt.replace("the digits", `the ${WORD[matching.digits]} digits`)}
                </p>
                {matching.mode === "enter" ? (
                  <div data-slot="approval-sheet-match-input" role="group" aria-labelledby={promptId} className="flex gap-(--c-approval-digit-gap)">
                    {cells.map((value, i) => (
                      <Input
                        key={i}
                        ref={(el) => {
                          cellRefs.current[i] = el
                          if (i === 0) firstCell.current = el
                        }}
                        data-slot="approval-sheet-match-cell"
                        aria-label={`Digit ${i + 1} of ${matching.digits}`}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        maxLength={1}
                        value={value}
                        readOnly={phase === "matched" || busy}
                        onChange={(e) => setCell(i, e.target.value)}
                        onKeyDown={onCellKeyDown(i)}
                        onPaste={onCellPaste}
                        onFocus={(e) => e.currentTarget.select()}
                        className="size-12 px-0 text-center font-mono text-(length:--c-approval-digit-size) tabular-nums md:text-(length:--c-approval-digit-size)"
                      />
                    ))}
                  </div>
                ) : (
                  <div data-slot="approval-sheet-match-choice" role="group" aria-labelledby={promptId} className="flex flex-wrap gap-(--c-approval-digit-gap)">
                    {(matching.choices ?? []).map((choice) => (
                      <Button
                        key={choice}
                        type="button"
                        variant={phase === "matched" && choice === matching.expected ? "secondary" : "outline"}
                        shape="pill"
                        disabled={!armed || phase === "matched" || busy}
                        aria-pressed={phase === "matched" && choice === matching.expected}
                        onClick={() => check(choice)}
                      >
                        <span className="font-mono tabular-nums">{choice}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <TimerRing remaining={displayRemaining} total={Math.max(1, Math.ceil((expiresAtMs - openedAt) / 1000))} urgent={urgent} expired={expired} animate={!reducedMotion} />
              <span data-slot="approval-sheet-timer" role="timer" aria-live="off" className={cn("tabular-nums", urgent && !expired && "text-(--c-approval-timer-urgent)")}>
                {expired ? "Expired" : `${displayRemaining} s left`}
              </span>
            </div>

            <p
              data-slot="approval-sheet-notice"
              role={error || (notice && phase === "default") ? "alert" : undefined}
              className={cn("min-h-5 text-sm", error || notice ? "text-destructive" : "text-muted-foreground")}
            >
              {error ? (
                <>
                  <span className="font-medium">Error: </span>
                  {error}
                </>
              ) : (
                (noticeText ?? approvalSheetOriginCopy[origin])
              )}
            </p>
          </div>

          <div className="mt-2 px-4 pb-4">
            {/* DOM order is the tab order the spec asks for (Approve → Deny → This wasn't me); the row is reversed so the report action sits apart on the far left. Inert until armed. */}
            <DialogActions data-slot="approval-sheet-actions" className={cn("flex-row-reverse", !armed && "pointer-events-none")} aria-busy={!armed || busy}>
              {showApprove && (
                <DialogAction
                  ref={approveRef}
                  kind="confirm"
                  data-action="approve"
                  disabled={approveDisabled}
                  aria-disabled={approveDisabled}
                  onClick={approve}
                >
                  {busy ? <Spinner data-icon="inline-start" /> : null}
                  Approve
                  {approveDisabled && !busy && <span className="hidden line-through forced-colors:inline"> Locked</span>}
                </DialogAction>
              )}
              <DialogAction ref={denyRef} kind="cancel" data-action="deny" icon={expired ? "close" : undefined} disabled={busy && !expired} onClick={deny}>
                {expired ? "Close" : "Deny"}
              </DialogAction>
              {!terminal && (
                <DialogAction kind="destructive" data-action="report" icon="report" onClick={report}>
                  This wasn't me
                </DialogAction>
              )}
            </DialogActions>
          </div>
          <span role="status" aria-live="polite" className="sr-only">
            {live}
          </span>
        </div>
      </AdaptiveSheetContent>
    </Sheet>
  )
}

function TimerRing({ remaining, total, urgent, expired, animate }: { remaining: number; total: number; urgent: boolean; expired: boolean; animate: boolean }) {
  const progress = expired ? 0 : Math.max(0, Math.min(1, remaining / total))
  return (
    <svg
      data-slot="approval-sheet-timer-ring"
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      className="size-6 shrink-0 -rotate-90 rounded-full forced-colors:border forced-colors:border-[CanvasText]"
    >
      <circle cx="12" cy="12" r="10" strokeWidth="2.5" className="stroke-(--c-approval-timer-track) forced-colors:stroke-transparent" />
      <circle
        cx="12"
        cy="12"
        r="10"
        strokeWidth="2.5"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - progress * 100}
        strokeLinecap="round"
        className={cn(
          urgent && !expired ? "stroke-(--c-approval-timer-urgent)" : "stroke-(--c-approval-timer-progress)",
          animate && "transition-[stroke-dashoffset] duration-1000 ease-linear",
          "forced-colors:stroke-[CanvasText]"
        )}
      />
    </svg>
  )
}
