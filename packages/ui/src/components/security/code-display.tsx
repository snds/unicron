// Owned component (not generated): a one-time code, grouped for reading, with the time it has left.
// Spec: docs/specs/security/code-display.md.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Item, ItemActions, ItemContent, ItemMedia } from "../ui/item"
import { Skeleton } from "../ui/skeleton"
import { readSecondsToken, useCopyCountdown, useHighContrast, useReducedMotion } from "./copy-countdown"
import { useCrownJewel } from "./crown-jewel"

export type CodeDisplayVariant = "totp" | "hotp" | "steam"
export type CodeDisplayDensity = "detail" | "list" | "compact"
export type CodeDisplayWarning = "issuer-equals-login"

/**
 * What `onCopy` may resolve with: the string `clipboardHolds` is asked about when the countdown
 * ends, and what `onClipboardClear` is handed back. The same shape as SecretField's
 * `SecretFieldCopyRef`, so one host implementation serves both. Opaque to the component: a digest,
 * or the host's own record of the copy (a generation counter).
 */
export interface CodeDisplayCopyRef {
  hash?: string
}

/** The texts the component speaks through its polite live region. The copy and clear wording matches SecretField's. */
export const codeDisplayAnnouncements = {
  copied: (seconds: number) => `Copied. Clipboard clears in ${seconds} seconds.`,
  copiedNext: (seconds: number) => `Copied the next code. Clipboard clears in ${seconds} seconds.`,
  cleared: "Clipboard cleared.",
  newCode: (issuer: string, spelled: string) => `New code for ${issuer}: ${spelled}`,
} as const

export interface CodeDisplayProps extends Omit<React.ComponentProps<"div">, "onCopy"> {
  /** `steam`: 5 characters, one group, alphabet `23456789BCDFGHJKMNPQRTVWXY`. */
  variant?: CodeDisplayVariant
  /** Grouping: 6 → 3+3, 8 → 4+4, 5 → one group. Defaults from the variant. */
  digits?: 5 | 6 | 8
  /** The current code, computed by the host's core. The component never sees the secret. */
  code?: string
  /** The next code, shown early so nobody types a code that dies mid-entry. */
  next?: string
  /** Seconds per step (TOTP and Steam). */
  period?: number
  /** Unix seconds at which `code` dies. Defaults to the end of the current period. */
  expiresAt?: number
  /** The core's skew-corrected clock, in Unix seconds, ticked by the host. Omit it and the component ticks itself. */
  now?: number
  density?: CodeDisplayDensity
  /** Tap or Enter reveals for one period. Forced inside a CrownJewelSurface. */
  concealed?: boolean
  /** Shows the clock notice past ±15 s. */
  skewSeconds?: number
  warnings?: CodeDisplayWarning[]
  /** Seconds until the host clears the clipboard. As SecretField. */
  clipboardTimer?: number
  /**
   * The person copied. `which` says which code: the current one, or the next one in the last
   * seconds. `value` is that code as passed in `code` or `next` (the component draws it, so handing
   * it back exposes nothing new); a host that copies inside its own process by id may ignore it and
   * act on `which` alone. The countdown starts when this resolves; a rejection starts nothing.
   * Resolve with `{ hash }` and the component keeps it for this copy: at the countdown's end it is
   * handed to `clipboardHolds` and to `onClipboardClear`. Resolve with nothing and both get nothing.
   */
  onCopy?: (
    value: string,
    which: "code" | "next"
  ) => void | CodeDisplayCopyRef | Promise<void | CodeDisplayCopyRef>
  /**
   * HOTP: advance the counter. Resolve once the host has the new code, and pass it as `code` (and
   * `counter`). "Next code" and copy are disabled while it is pending. Without it "Next code" is
   * disabled.
   */
  onAdvance?: () => void | Promise<void>
  /** HOTP: the counter, shown beside "Next code". */
  counter?: number
  /** "GitHub" in "GitHub · sean". Also names the code to assistive tech. */
  issuer?: string
  /** "sean" in "GitHub · sean". */
  account?: string
  /** Avatar or Icon for the issuer, in `detail` and `list` density. */
  media?: React.ReactNode
  /** Called once when the code enters the expiring state. Mobile hosts vibrate; desktop hosts leave it out. */
  onHaptic?: () => void
  /** "Fix clock" in the skew notice. */
  onFixClock?: () => void
  /**
   * Does the clipboard still hold what we copied? `hash` is what `onCopy` resolved with for the copy
   * whose countdown ended. Asked once, at the end; `false` (or a rejection) skips the clear and ends
   * the countdown without "Cleared". Not asked for a copy that resolved without a `hash`. The same
   * signature as `SecretFieldHost.clipboardHolds`.
   */
  clipboardHolds?: (hash: string) => Promise<boolean>
  /**
   * The clipboard timer ran out; the host clears the clipboard if it still holds the code. `ref` is
   * what `onCopy` resolved with for the copy whose countdown ended (a later copy restarts the
   * countdown, so this is always the latest). Not called when `clipboardHolds` answered `false`.
   * Resolve `true` when the clear ran and `false` when the host left the clipboard alone; the
   * component says "Cleared" only when `clipboardHolds` answered `true` or this resolved `true`, and
   * never when this resolved `false` or rejected.
   */
  onClipboardClear?: (ref?: CodeDisplayCopyRef) => void | boolean | Promise<void | boolean>
  loading?: boolean
  /** "Can't make a code" with this reason; no digits are drawn. */
  error?: string
}

export type CodeDisplayState = "default" | "expiring" | "concealed" | "loading" | "error"

const SKEW_NOTICE_S = 15
const DEFAULT_CLIPBOARD_S = 30
const DEFAULTS = { expiringAt: 5, nextAt: 10, copyNextAt: 3, rollover: 0.2 }

/** 6 → [3, 3]; 8 → [4, 4]; 5 → [5]; anything else is one group. */
export function groupCode(code: string): string[] {
  const n = code.length
  if (n === 6) return [code.slice(0, 3), code.slice(3)]
  if (n === 8) return [code.slice(0, 4), code.slice(4)]
  return n ? [code] : []
}

/** "482917" → "4 8 2, 9 1 7": one character at a time, a comma at the group break, never a number. */
export function spellCode(code: string): string {
  return groupCode(code)
    .map((g) => g.split("").join(" "))
    .join(", ")
}

// ── Shared live region for a list ─────────────────────────────────────────────────────────────

const AnnounceContext = React.createContext<((text: string) => void) | null>(null)

/** Hook for the nearest live region: the list's when inside `CodeDisplayList`, else the component's own. */
function useAnnouncer(): [(text: string) => void, React.ReactNode] {
  const shared = React.useContext(AnnounceContext)
  const [local, setLocal] = React.useState<{ text: string; n: number }>({ text: "", n: 0 })
  const announce = React.useCallback(
    (text: string) => {
      if (shared) shared(text)
      else setLocal((s) => ({ text, n: s.n + 1 }))
    },
    [shared]
  )
  const region = shared ? null : (
    <span aria-live="polite" className="sr-only" data-slot="code-display-live">
      <span key={local.n}>{local.text}</span>
    </span>
  )
  return [announce, region]
}

/** Wrap a list of codes so they share one polite live region instead of twenty. */
export function CodeDisplayList({ className, children, ...props }: React.ComponentProps<"div">) {
  const [msg, setMsg] = React.useState<{ text: string; n: number }>({ text: "", n: 0 })
  const announce = React.useCallback((text: string) => setMsg((s) => ({ text, n: s.n + 1 })), [])
  return (
    <AnnounceContext.Provider value={announce}>
      <div data-slot="code-display-list" className={cn("flex flex-col", className)} {...props}>
        {children}
        <span aria-live="polite" className="sr-only" data-slot="code-display-live">
          <span key={msg.n}>{msg.text}</span>
        </span>
      </div>
    </AnnounceContext.Provider>
  )
}

// ── The ring ──────────────────────────────────────────────────────────────────────────────────

function Ring({ fraction, expiring, seconds }: { fraction: number; expiring: boolean; seconds: number }) {
  const r = 14
  const c = 2 * Math.PI * r
  return (
    <span data-slot="code-display-timer" data-expiring={expiring ? "" : undefined} className="inline-flex items-center">
      <svg
        aria-hidden
        viewBox="0 0 32 32"
        className="size-5 -rotate-90 contrast-more:hidden forced-colors:hidden"
      >
        <circle cx="16" cy="16" r={r} fill="none" strokeWidth="3" className="stroke-(--c-code-ring-track)" />
        <circle
          cx="16"
          cy="16"
          r={r}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, Math.max(0, fraction)))}
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear motion-reduce:transition-none",
            expiring ? "stroke-(--c-code-ring-expiring)" : "stroke-(--c-code-ring-progress)"
          )}
        />
      </svg>
      {/* High contrast: the ring becomes text. */}
      <span className="hidden text-xs tabular-nums contrast-more:inline forced-colors:inline">{seconds} s</span>
    </span>
  )
}

// ── The component ─────────────────────────────────────────────────────────────────────────────

/**
 * A one-time code a person has seconds to read and type: grouped, with a ring for the time left,
 * a warning before it expires, the next code early, and a copy with a clipboard timer. The host's
 * core computes `code` and `next`; the component never holds the secret.
 */
export function CodeDisplay({
  variant = "totp",
  digits,
  code = "",
  next,
  period = 30,
  expiresAt: expiresAtProp,
  now: nowProp,
  density = "detail",
  concealed: concealedProp = false,
  skewSeconds = 0,
  warnings = [],
  clipboardTimer = DEFAULT_CLIPBOARD_S,
  onCopy,
  onAdvance,
  counter,
  issuer,
  account,
  media,
  onHaptic,
  onFixClock,
  clipboardHolds,
  onClipboardClear,
  loading = false,
  error,
  className,
  onKeyDown,
  onClick,
  ...props
}: CodeDisplayProps) {
  const crown = useCrownJewel()
  const reducedMotion = useReducedMotion()
  const highContrast = useHighContrast()
  const rootRef = React.useRef<HTMLDivElement>(null)
  const [announce, liveRegion] = useAnnouncer()
  // ── The clipboard countdown. Each copy keeps its own reference; a later copy restarts the
  // countdown and supersedes it. At the end: ask `clipboardHolds` about that copy, then hand it to
  // `onClipboardClear`, and say "Cleared" only when the clear is known to have run. ──
  /** The latest copy: its number, and what `onCopy` resolved with (`undefined` for nothing). */
  const lastCopy = React.useRef<{ seq: number; ref: CodeDisplayCopyRef | undefined }>({ seq: 0, ref: undefined })
  /** The copy whose clear is known to have run, so the "cleared" phase is drawn for that copy only. */
  const [clearedSeq, setClearedSeq] = React.useState<number | null>(null)
  const holdsRef = React.useRef(clipboardHolds)
  const clearRef = React.useRef(onClipboardClear)
  React.useEffect(() => {
    holdsRef.current = clipboardHolds
    clearRef.current = onClipboardClear
  })
  const cancelCountdown = React.useRef<() => void>(() => {})
  const countdown = useCopyCountdown(clipboardTimer, () => {
    const { seq, ref } = lastCopy.current
    const superseded = () => lastCopy.current.seq !== seq
    void (async () => {
      const hash = typeof ref?.hash === "string" ? ref.hash : null
      const holds = holdsRef.current
      let confirmed = false
      if (holds && hash !== null) {
        let held = false
        try {
          held = await holds(hash)
        } catch {
          held = false
        }
        if (superseded()) return // a newer copy owns the clipboard and the countdown now
        if (!held) {
          cancelCountdown.current() // someone else's text: leave it, and do not say "Cleared"
          return
        }
        confirmed = true
      }
      const clear = clearRef.current
      if (!clear) {
        if (!superseded()) cancelCountdown.current() // nothing cleared, so nothing to say
        return
      }
      let ran: boolean
      try {
        const result = await clear(ref)
        ran = result === true || (result !== false && confirmed)
      } catch {
        ran = false // the host reports its own failures
      }
      if (superseded()) return
      if (!ran) {
        cancelCountdown.current()
        return
      }
      setClearedSeq(seq)
      announce(codeDisplayAnnouncements.cleared)
    })()
  })
  React.useEffect(() => {
    cancelCountdown.current = countdown.cancel
  }, [countdown.cancel])
  /** The countdown as drawn: `cleared` only once the clear is known to have run for the latest copy (a new copy resets it). */
  const copyPhase = countdown.state === "cleared" ? (clearedSeq !== null ? "cleared" : "idle") : countdown.state

  const concealed = concealedProp || crown.gated
  const timed = variant !== "hotp"
  const expectedDigits = digits ?? (variant === "steam" ? 5 : 6)
  const display = variant === "steam" ? code.toUpperCase() : code
  const nextDisplay = variant === "steam" ? next?.toUpperCase() : next

  // ── Clock. `now` comes from the host; without it, tick once a second. ──
  const [tick, setTick] = React.useState(() => Date.now() / 1000)
  React.useEffect(() => {
    if (nowProp !== undefined || !timed) return
    const id = setInterval(() => setTick(Date.now() / 1000), 1000)
    return () => clearInterval(id)
  }, [nowProp, timed])
  const now = nowProp ?? tick
  const expiresAt = expiresAtProp ?? (Math.floor(now / period) + 1) * period
  const remaining = timed ? Math.max(0, expiresAt - now) : 0
  const secondsLeft = Math.ceil(remaining)

  // ── Thresholds, from the tier 3 knobs (spec defaults when the stylesheet is absent). ──
  const [thresholds, setThresholds] = React.useState(DEFAULTS)
  React.useEffect(() => {
    const el = rootRef.current
    setThresholds({
      expiringAt: readSecondsToken(el, "--c-code-expiring-at", DEFAULTS.expiringAt),
      nextAt: readSecondsToken(el, "--c-code-next-at", DEFAULTS.nextAt),
      copyNextAt: readSecondsToken(el, "--c-code-copy-next-at", DEFAULTS.copyNextAt),
      rollover: readSecondsToken(el, "--c-code-rollover-duration", DEFAULTS.rollover),
    })
  }, [])

  const expiring = timed && remaining > 0 && remaining <= thresholds.expiringAt
  const nextShown = timed && Boolean(nextDisplay) && remaining <= thresholds.nextAt
  const copyNext = timed && Boolean(nextDisplay) && remaining <= thresholds.copyNextAt

  // ── Concealed: reveal for one period (one code). ──
  const [revealedFor, setRevealedFor] = React.useState<string | null>(null)
  const hidden = concealed && revealedFor !== code

  // ── Rollover: crossfade, and an announcement only while focused or recently copied. ──
  const [rolling, setRolling] = React.useState(false)
  const [focused, setFocused] = React.useState(false)
  const copiedAt = React.useRef<number | null>(null)
  const prevCode = React.useRef(code)
  React.useEffect(() => {
    if (prevCode.current === code) return
    prevCode.current = code
    if (!code) return
    const recentlyCopied = copiedAt.current !== null && now - copiedAt.current <= period
    if ((focused || recentlyCopied) && !hidden) announce(codeDisplayAnnouncements.newCode(issuer ?? "this account", spellCode(display)))
    if (reducedMotion) return
    setRolling(true)
    const t = setTimeout(() => setRolling(false), thresholds.rollover * 1000)
    return () => clearTimeout(t)
    // `now` is read, not reacted to.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  // ── Haptic once per code, at the expiring threshold. ──
  const hapticFor = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (!expiring || hapticFor.current === code) return
    hapticFor.current = code
    onHaptic?.()
  }, [expiring, code, onHaptic])

  // ── The accessible label: refreshed on rollover and at the expiring threshold, not every second. ──
  const [labelSeconds, setLabelSeconds] = React.useState(secondsLeft)
  React.useEffect(() => {
    setLabelSeconds(secondsLeft)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, expiring])
  const who = issuer ? `${issuer}${account ? `, ${account}` : ""}` : account ?? "this account"
  const label = hidden
    ? `Code for ${who}, hidden. Press Enter to show it.`
    : `Code for ${who}: ${spellCode(display)}.${timed ? ` ${labelSeconds} seconds left.` : ""}`

  // ── HOTP advance. ──
  const [advancing, setAdvancing] = React.useState(false)
  const advance = async () => {
    if (advancing || !onAdvance) return
    setAdvancing(true)
    try {
      await onAdvance()
    } finally {
      setAdvancing(false)
    }
  }

  // ── Copy. ──
  const [copied, setCopied] = React.useState<"code" | "next" | null>(null)
  const copy = async () => {
    // While an HOTP advance is pending the code drawn is about to be replaced; a host that copies by
    // id would copy the new one while the old one shows, so copy waits for the advance to land.
    if (!code || loading || error || advancing) return
    if (crown.gated && !(await crown.requestProof("use"))) return
    const which: "code" | "next" = copyNext && nextDisplay ? "next" : "code"
    const value = which === "next" ? (nextDisplay as string) : display
    let result: void | CodeDisplayCopyRef
    try {
      result = await onCopy?.(value, which)
    } catch {
      return // the host reports its own failure; nothing was copied, so no countdown
    }
    lastCopy.current = { seq: lastCopy.current.seq + 1, ref: result && typeof result === "object" ? result : undefined }
    setClearedSeq(null)
    copiedAt.current = now
    setCopied(which)
    countdown.start()
    announce(which === "next" ? codeDisplayAnnouncements.copiedNext(clipboardTimer) : codeDisplayAnnouncements.copied(clipboardTimer))
  }
  React.useEffect(() => {
    if (countdown.state === "idle") setCopied(null)
  }, [countdown.state])

  const activate = () => {
    if (hidden) {
      setRevealedFor(code)
      return
    }
    void copy()
  }

  const state: CodeDisplayState = error ? "error" : loading ? "loading" : hidden ? "concealed" : expiring ? "expiring" : "default"
  const fraction = timed
    ? (reducedMotion ? Math.ceil(remaining / 5) * 5 : remaining) / Math.max(1, period)
    : 0
  const groups = groupCode(display)
  const skewed = Math.abs(skewSeconds) > SKEW_NOTICE_S
  const itemSize = density === "detail" ? "default" : density === "list" ? "sm" : "xs"
  const copyTooltip =
    copyPhase === "counting"
      ? `${copied === "next" ? "Copied the next code" : "Copied"} · clears in ${countdown.secondsLeft} s`
      : copyPhase === "cleared"
        ? "Cleared"
        : copyNext
          ? "Copy the next code"
          : "Copy code"

  return (
    <Item
      ref={rootRef}
      data-slot="code-display"
      data-variant={variant}
      data-density={density}
      data-state={state}
      data-gated={crown.gated ? "" : undefined}
      data-copied={copied ?? undefined}
      size={itemSize}
      role="group"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "bg-card select-none",
        density === "list" && "min-h-11",
        density === "compact" && "min-h-9",
        className
      )}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
      }}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented) return
        if (hidden) setRevealedFor(code)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented || e.target !== e.currentTarget) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          activate()
        }
      }}
      {...props}
    >
      {media && density !== "compact" && <ItemMedia>{media}</ItemMedia>}
      <ItemContent>
        {(issuer || account) && density !== "compact" && (
          <span data-slot="code-display-issuer" className="text-muted-foreground flex items-center gap-1 text-xs">
            {issuer}
            {issuer && account && <span aria-hidden> · </span>}
            {account}
          </span>
        )}

        {error ? (
          <span data-slot="code-display-error" className="text-destructive text-sm">
            Can't make a code: {error}
          </span>
        ) : loading ? (
          <span data-slot="code-display-code" className="flex gap-(--c-code-group-gap)">
            {Array.from({ length: expectedDigits === 5 ? 1 : 2 }, (_, i) => (
              <Skeleton key={i} className="h-[1.2em] w-[3.2em]" />
            ))}
          </span>
        ) : (
          <span
            data-slot="code-display-code"
            data-rolling={rolling ? "true" : undefined}
            aria-hidden
            className={cn(
              "font-mono flex items-baseline gap-(--c-code-group-gap) leading-none tracking-(--c-code-letter-spacing) tabular-nums",
              density === "detail" && "text-(length:--c-code-size-detail)",
              density === "list" && "text-(length:--c-code-size-list)",
              density === "compact" && "text-(length:--c-code-size-compact)",
              expectedDigits === 8 && "[font-feature-settings:'zero']",
              expiring && "text-warning font-semibold contrast-more:underline forced-colors:underline",
              rolling && "animate-in fade-in-0 motion-reduce:animate-none"
            )}
            style={rolling ? { animationDuration: "var(--c-code-rollover-duration)" } : undefined}
          >
            {hidden
              ? groups.map((g, i) => (
                  <span key={i} data-slot="code-display-group" data-concealed="">
                    {highContrast ? "*".repeat(g.length) : "•".repeat(g.length)}
                  </span>
                ))
              : groups.map((g, i) => (
                  <span key={i} data-slot="code-display-group">
                    {g}
                  </span>
                ))}
          </span>
        )}

        {nextShown && !hidden && !error && !loading && (
          <span
            data-slot="code-display-next"
            aria-hidden
            className="font-mono text-(--c-code-next-ink) flex gap-(--c-code-group-gap) text-xs tracking-(--c-code-letter-spacing) tabular-nums"
          >
            <span className="font-sans tracking-normal">Next</span>
            {groupCode(nextDisplay as string).map((g, i) => (
              <span key={i}>{g}</span>
            ))}
          </span>
        )}

        {(skewed || warnings.length > 0) && (
          <span data-slot="code-display-notice" className="flex flex-wrap items-center gap-1.5">
            {skewed && (
              <Badge variant="outline">
                <Icon name="schedule" data-icon="inline-start" />
                Clock is off by {Math.round(Math.abs(skewSeconds))} s
                {onFixClock && (
                  <>
                    {" · "}
                    <Button variant="link" size="inline" onClick={onFixClock}>
                      Fix clock
                    </Button>
                  </>
                )}
              </Badge>
            )}
            {warnings.includes("issuer-equals-login") && (
              <Badge variant="outline">
                <Icon name="warning" data-icon="inline-start" />
                Same account you sign in with
              </Badge>
            )}
          </span>
        )}
      </ItemContent>

      <ItemActions>
        {timed && !error && !loading && <Ring fraction={fraction} expiring={expiring} seconds={secondsLeft} />}
        {!timed && counter !== undefined && (
          <span data-slot="code-display-counter" className="text-muted-foreground text-xs tabular-nums">
            #{counter}
          </span>
        )}
        {!timed && (
          <Button variant="outline" size="sm" disabled={advancing || !onAdvance} onClick={advance}>
            Next code
          </Button>
        )}
        {!error && (
          <IconButton
            data-slot="code-display-copy"
            label={copyNext ? "Copy the next code" : "Copy code"}
            tooltip={copyTooltip}
            size={density === "compact" ? "icon-sm" : "icon"}
            disabled={loading || !code || advancing}
            onClick={(e) => {
              e.stopPropagation()
              void copy()
            }}
          >
            {copyPhase === "counting" ? (
              <span className="text-xs tabular-nums">{countdown.secondsLeft}</span>
            ) : copyPhase === "cleared" ? (
              <>
                <Icon name="check" />
                <span className="sr-only">Cleared</span>
              </>
            ) : (
              <>
                <Icon name="content_copy" />
                {crown.gated && <Icon name="lock" className="size-3" />}
              </>
            )}
          </IconButton>
        )}
      </ItemActions>
      {liveRegion}
    </Item>
  )
}
