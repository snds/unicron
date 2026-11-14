// Owned component (not generated): approve or deny a request from another device, agent, TV, or
// contact, with number matching and "This wasn't me". A component rather than a Dialog variant
// because it owns behaviour no parent has: an origin gate that can remove the approve control,
// matching that gates the confirm action, a timeout that denies by itself, a retry limit, an arming
// delay, and a third action kind (report).
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Lockdown Figma 40:1441 and 41:3394, Sheet Header 32:122; no app PR, no DSA record)
// Spec: docs/specs/security/approval-sheet.md
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { readSecondsToken, useReducedMotion } from "./copy-countdown"
import { DigitGroups } from "./digit-groups"
import { ReviewCountdownRule, ReviewFrame, formatCountdown, rowClasses } from "./parts"
import { RiskTierBadge, type RiskTier } from "./risk-tier-badge"

// DigitGroups and QrCode are new in 1.0 and reach the package root through the files that use
// them until index.ts names them (the integrator's line); then these re-exports go.
export { DigitGroups, digitGroupSize, splitDigitGroups, spellDigitGroups, type DigitGroupsProps, type DigitGroupsSize } from "./digit-groups"

export type ApprovalKind = "device" | "agent" | "device-code" | "contact-request" | "bridge"
export type ApprovalOrigin = "scan" | "pairing" | "push"
/** Why it was denied. `mismatch`: the person said the code on the other screen differs (compare matching). */
export type ApprovalDenyReason = "user" | "timeout" | "retries" | "origin" | "mismatch"

export interface ApprovalContextRow {
  label: string
  value: string
  /** Shown stronger (the full domain for a device code). */
  emphasis?: boolean
}

/** Number matching: the person proves they see the other screen by entering (or picking) its digits. */
export interface ApprovalNumberMatching {
  /** `enter` wherever there is a keyboard or a number pad; `choose` for the watch and the compact popup only. */
  mode: "enter" | "choose"
  /** How many digits the other device shows. Three where the host's threat model asks. */
  digits: 2 | 3
  /** The digits the other device shows, from the signed request. Never generated here. */
  expected: string
  /** `choose` mode: the options, one of which is `expected`. */
  choices?: string[]
}

/**
 * Compare: both screens show the same code (a pairing code, six digits from a key exchange) and
 * the person says whether they match. The yes says "They match" and the no "They don't match".
 */
export interface ApprovalCompareMatching {
  mode: "compare"
  /** The code this side shows, from the signed request. Shown in `DigitGroups`. */
  code: string
  /** The sentence over the code. Default `approvalSheetComparePrompt`. */
  prompt?: string
}

/** None: nothing to match (a passkey request on this device, a server to trust); the arming delay and the timeout still hold. */
export interface ApprovalNoMatching {
  mode: "none"
}

export type ApprovalMatching = ApprovalNumberMatching | ApprovalCompareMatching | ApprovalNoMatching

/** Title template and icon per kind. The component owns the words; hosts pass the kind. */
export const approvalSheetCopy: Record<ApprovalKind, { title: string; icon: IconName; prompt: string; defaultTier: RiskTier }> = {
  device: { title: "Approve a new device?", icon: "devices", prompt: "Enter the digits shown on the other device", defaultTier: "standard" },
  agent: { title: "Approve this agent?", icon: "bot", prompt: "Enter the digits shown by the agent", defaultTier: "standard" },
  "device-code": { title: "Approve a sign-in on this screen?", icon: "screen", prompt: "Enter the digits shown on the screen", defaultTier: "official" },
  "contact-request": { title: "Approve this contact request?", icon: "user--multiple", prompt: "Enter the digits your contact reads to you", defaultTier: "standard" },
  bridge: { title: "Approve this bridge?", icon: "extensions", prompt: "Enter the digits shown on the other device", defaultTier: "tolerated" },
}

/** The overline per kind, before the time left: "Device request // 01:40 left". */
export const approvalSheetOverline: Record<ApprovalKind, string> = {
  device: "Device request",
  agent: "Agent request",
  "device-code": "Sign-in request",
  "contact-request": "Contact request",
  bridge: "Bridge request",
}

export const approvalSheetComparePrompt = "Approve only if the other screen shows these digits."

/** The default words of the buttons. A host names the yes by the gate's route ("Approve with Touch ID"). */
export const approvalSheetWords = {
  approve: "Approve",
  deny: "Deny",
  close: "Close",
  report: "This wasn't me",
  match: "They match",
  mismatch: "They don't match",
} as const

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
  /** The request in its own words ("Steam on a Windows PC"). Default: the kind's question (`approvalSheetCopy`). The frame's accessible name. */
  title?: string
  /** Mono caps over the title, before the time left. Default by kind (`approvalSheetOverline`). */
  overline?: string
  /** The one sentence under the facts. Default: where the request came from (`approvalSheetOriginCopy`). */
  note?: React.ReactNode
  /** The yes, named by the gate's route ("Approve with Touch ID"). Default "Approve", or "They match" when comparing. */
  approveLabel?: string
  /** A 16px glyph before the yes (`fingerprint-recognition` for a platform check). */
  approveIcon?: IconName
  /** The no. Default "Deny", or "They don't match" when comparing. */
  denyLabel?: string
  /**
   * What closing decides (Escape, the close button). `deny` (default): closing denies, as before
   * 1.0. `keep`: closing decides nothing; the host keeps the request waiting until it runs out.
   */
  dismiss?: "deny" | "keep"
}

/** Seconds left at which the countdown rule turns critical: the knob `--c-approval-urgent-at` (20 s). */
const URGENT_RULE_DEFAULT_S = 20

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
  title,
  overline,
  note,
  approveLabel,
  approveIcon,
  denyLabel,
  dismiss = "deny",
}: ApprovalSheetProps) {
  const copy = approvalSheetCopy[kind]
  const numberMatching = matching.mode === "enter" || matching.mode === "choose" ? matching : null
  const digitCount = numberMatching?.digits ?? 0
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
  const [cells, setCells] = React.useState<string[]>(() => Array.from({ length: digitCount }, () => ""))
  const [urgentAt, setUrgentAt] = React.useState(URGENT_RULE_DEFAULT_S)
  const [notice, setNotice] = React.useState<string | null>(null)
  const [live, setLive] = React.useState("")
  const [remaining, setRemaining] = React.useState(() => Math.max(0, Math.ceil((expiresAtMs - openedAt) / 1000)))
  const [urgentSaid, setUrgentSaid] = React.useState(false)

  const terminal = phase === "expired" || phase === "denied" || phase === "reported"

  // Arming delay: the tier 3 knob, read from the sheet once it is in the tree.
  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setArmed(true), readSecondsToken(root.current, "--c-approval-arm-delay", 0.5) * 1000)
    setUrgentAt(readSecondsToken(root.current, "--c-approval-urgent-at", URGENT_RULE_DEFAULT_S))
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
    if (phase !== "default" || !numberMatching) return
    if (entry === numberMatching.expected) {
      setNotice(null)
      setLive(approvalSheetAnnouncements.matched)
      setPhase("matched")
      return
    }
    const used = tries + 1
    setTries(used)
    setCells(Array.from({ length: digitCount }, () => ""))
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
    if (digit && index < digitCount - 1) cellRefs.current[index + 1]?.focus()
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
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, digitCount)
    if (!digits) return
    e.preventDefault()
    const next = Array.from({ length: digitCount }, (_, i) => digits[i] ?? "")
    setCells(next)
    cellRefs.current[Math.min(digits.length, digitCount) - 1]?.focus()
    if (next.every((c) => c !== "")) check(next.join(""))
  }

  // ── actions (all guarded by the arming delay) ────────────────────────────────────────────────
  // Compare and none have no matching step: the yes is live once armed. Their phase stays
  // `default`, so focus is never moved onto the yes by itself.
  const matched = phase === "matched" || (!numberMatching && phase === "default")
  const approve = () => {
    if (!armed || !matched || busy || error) return
    onApprove()
  }
  const deny = () => {
    if (!armed) return
    if (phase === "expired") {
      onOpenChange?.(false)
      return
    }
    resolve("denied", phase === "refused" ? "origin" : matching.mode === "compare" ? "mismatch" : "user")
  }
  const report = () => {
    if (!armed) return
    resolve("reported")
  }
  const onBaseOpenChange = (next: boolean) => {
    if (next) return
    if (!armed) return // a double click that opened the request cannot close it either
    if (terminal || dismiss === "keep") {
      // `keep`: closing decides nothing; the request keeps waiting with the host until it runs out.
      onOpenChange?.(false)
      return
    }
    resolve("denied", phase === "refused" ? "origin" : "user")
  }

  const showApprove = !refused && phase !== "expired"
  const approveDisabled = !armed || !matched || busy || !!error
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
  const hasPrompt = !refused && !terminal && matching.mode !== "none"
  const describedBy = hasPrompt ? `${contextId} ${promptId}` : contextId
  const total = Math.max(1, Math.ceil((expiresAtMs - openedAt) / 1000))
  const ruleUrgent = remaining <= urgentAt
  const yes = approveLabel ?? (matching.mode === "compare" ? approvalSheetWords.match : approvalSheetWords.approve)
  const no = expired ? approvalSheetWords.close : (denyLabel ?? (matching.mode === "compare" ? approvalSheetWords.mismatch : approvalSheetWords.deny))
  const row = rowClasses("auto")

  return (
    <ReviewFrame
      open={open}
      onOpenChange={onBaseOpenChange}
      size="review"
      aria-describedby={describedBy}
      initialFocus={refused || expired ? denyRef : numberMatching?.mode === "enter" ? firstCell : denyRef}
      overline={
        <>
          {overline ?? approvalSheetOverline[kind]}
          <span aria-hidden> // </span>
          <span data-slot="approval-sheet-timer" role="timer" aria-live="off" className={cn(urgent && !expired && "text-critical-text")}>
            {expired ? "Expired" : `${formatCountdown(displayRemaining)} left`}
          </span>
        </>
      }
      title={<span data-slot="approval-sheet-title">{title ?? copy.title}</span>}
      headerAfter={
        <ReviewCountdownRule>
          <Progress
            data-slot="approval-sheet-countdown"
            variant="segmented"
            segments={30}
            min={0}
            max={total}
            value={expired ? 0 : displayRemaining}
            tone={ruleUrgent && !expired ? "critical" : "default"}
          />
        </ReviewCountdownRule>
      }
      footer={
        // DOM order is the tab order the spec asks for (Approve → Deny → This wasn't me). On a phone
        // the two answers share the last line (the no left, the yes right) under the report action;
        // wider, one line: the report action apart on the left, then the no and the yes. Inert until armed.
        <div
          data-slot="approval-sheet-actions"
          aria-busy={!armed || busy}
          className={cn("grid grid-cols-2 gap-3 sm:flex sm:flex-row-reverse sm:items-center", !armed && "pointer-events-none")}
        >
          {showApprove && (
            <div className="col-start-2 row-start-2">
              <Button ref={approveRef} data-action="approve" block disabled={approveDisabled} aria-disabled={approveDisabled} loading={busy} onClick={approve}>
                {approveIcon && !busy && <Icon name={approveIcon} size="sm" />}
                {yes}
                {approveDisabled && !busy && <span className="hidden line-through forced-colors:inline"> Locked</span>}
              </Button>
            </div>
          )}
          <div className={cn("row-start-2", showApprove ? "col-start-1" : "col-span-2")}>
            <Button ref={denyRef} data-action="deny" variant="secondary" block disabled={busy && !expired} onClick={deny}>
              <Icon name="close" size="sm" />
              {no}
            </Button>
          </div>
          {!terminal && (
            <div className="col-span-2 row-start-1 justify-self-start sm:mr-auto">
              <Button data-action="report" variant="ghost-destructive" onClick={report}>
                <Icon name="warning--hex" size="sm" />
                {approvalSheetWords.report}
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div
        ref={root}
        data-slot="approval-sheet"
        data-kind={kind}
        data-origin={origin}
        data-phase={phase}
        data-armed={armed}
        data-matching={matching.mode}
        className="flex min-w-(--c-approval-min-width) flex-col gap-4"
      >
        {/* The facts, as Field Rows: label, value. From the signed request; the sheet never infers them. */}
        <div id={contextId} data-slot="approval-sheet-context" className="flex flex-col">
          {context.map((r, i) => (
            <div key={i} data-slot="approval-sheet-context-row" className={row.root}>
              <div className={row.inner}>
                <div className={row.body}>
                  <span className={row.label}>{r.label}</span>
                  <span className={cn("text-text-body min-w-0 flex-1 break-words", r.emphasis ? "type-ui-emphasis" : "type-code-inline")}>{r.value}</span>
                </div>
              </div>
            </div>
          ))}
          <div data-slot="approval-sheet-tier" className={cn(row.root, "flex items-center gap-4 py-3")}>
            <span className={cn(row.label, "w-auto")}>Trust</span>
            <RiskTierBadge tier={tier ?? copy.defaultTier} verified size="sm" />
          </div>
        </div>

        {hasPrompt && (
          <div data-slot="approval-sheet-match" className="flex flex-col gap-3">
            <p id={promptId} data-slot="approval-sheet-match-prompt" className="type-body text-text-body">
              {matching.mode === "compare"
                ? (matching.prompt ?? approvalSheetComparePrompt)
                : copy.prompt.replace("the digits", `the ${WORD[digitCount as 2 | 3]} digits`)}
            </p>
            {matching.mode === "compare" ? (
              <DigitGroups data-slot="approval-sheet-match-code" value={matching.code} size="lg" />
            ) : matching.mode === "enter" ? (
              <div data-slot="approval-sheet-match-input" role="group" aria-labelledby={promptId} className="flex gap-(--c-approval-digit-gap)">
                {cells.map((value, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      cellRefs.current[i] = el
                      if (i === 0) firstCell.current = el
                    }}
                    data-slot="approval-sheet-match-cell"
                    aria-label={`Digit ${i + 1} of ${digitCount}`}
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
                    // The Text Field box (Figma 32:48): raised, a hairline inside, 2px primary while focused (no outer ring).
                    className="bg-surface-raised text-text-body type-code-display rule-box focus:rule-box-emphasis size-control rounded p-0 text-center outline-none"
                  />
                ))}
              </div>
            ) : (
              <div data-slot="approval-sheet-match-choice" role="group" aria-labelledby={promptId} className="flex flex-wrap gap-(--c-approval-digit-gap)">
                {(numberMatching?.choices ?? []).map((choice) => {
                  const picked = phase === "matched" && choice === numberMatching?.expected
                  return (
                    <ButtonPrimitive
                      key={choice}
                      type="button"
                      disabled={!armed || phase === "matched" || busy}
                      aria-pressed={picked}
                      onClick={() => check(choice)}
                      className={cn(
                        "type-number-count hit-area h-control min-w-control inline-flex items-center justify-center rounded px-3 disabled:pointer-events-none",
                        // Picked is inverted ink, as an active Filter Chip is (contract §6.5), never a second primary.
                        picked ? "bg-text-body text-surface-ground" : "rule-box text-text-body hover:bg-state-hover active:bg-state-pressed disabled:opacity-50"
                      )}
                    >
                      {choice}
                    </ButtonPrimitive>
                  )
                })}
              </div>
            )}
          </div>
        )}

        <p
          data-slot="approval-sheet-notice"
          role={error || (notice && phase === "default") ? "alert" : undefined}
          className={cn("type-caption min-h-5", error || notice ? "text-critical-text" : "text-text-secondary")}
        >
          {error ? (
            <>
              <span>Error: </span>
              {error}
            </>
          ) : (
            (noticeText ?? note ?? approvalSheetOriginCopy[origin])
          )}
        </p>
        <span role="status" aria-live="polite" className="sr-only">
          {live}
        </span>
      </div>
    </ReviewFrame>
  )
}
