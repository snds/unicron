// Owned component (not generated): a one-time code, grouped for reading, with the time it has left.
// Spec: docs/specs/security/code-display.md.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Lockdown Figma 40:357, 40:954, 41:720, 41:2487; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { AdaptiveMenuItem, overflowMenuLabel } from "../ui/adaptive"
import { Badge } from "../ui/badge"
import { FieldRowOverflow } from "../ui/field-row"
import { Progress } from "../ui/progress"
import { Skeleton } from "../ui/skeleton"
import { readSecondsToken, useCopyCountdown, useHighContrast, useReducedMotion } from "./copy-countdown"
import { useCrownJewel } from "./crown-jewel"
import { TextAction, formatCountdown, rowClasses } from "./parts"

export type CodeDisplayVariant = "totp" | "hotp" | "steam"
/**
 * Where the code sits (Lockdown's frames): `field`, a Field Row in the Display size on an item
 * (Figma 40:357, 41:720); `row`, a row of the phone's Codes list (40:954); `tile`, a tile of the
 * desktop Codes grid (41:2487); `compact`, one line in a popup or a list inside a sheet.
 */
export type CodeDisplayLayout = "field" | "row" | "tile" | "compact"
/** @deprecated Use `layout`: `detail` draws as `field`, `list` as `row`, `compact` as `compact`. */
export type CodeDisplayDensity = "detail" | "list" | "compact"
export type CodeDisplayWarning = "issuer-equals-login"

/** The countdown's cells: one per second of a 30 s period, as Figma draws it. */
export const codeDisplaySegments = 30

const LAYOUT_OF_DENSITY: Record<CodeDisplayDensity, CodeDisplayLayout> = { detail: "field", list: "row", compact: "compact" }

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
  /** Default `field`, or what a legacy `density` asks for. */
  layout?: CodeDisplayLayout
  /** @deprecated Use `layout`. */
  density?: CodeDisplayDensity
  /** The field layout's label ("Steam Guard"). Default: `issuer`, else "One-time code". */
  label?: string
  /**
   * The field layout's hairline above it. `none` (the default) as Lockdown Desktop / 01 draws the
   * code under an item's Field Rows; `top` for a field that stands alone or opens a group.
   */
  rule?: "top" | "none"
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
  /** Avatar or Icon for the issuer, in the `row` and `tile` layouts. */
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
  /**
   * More actions behind a trailing overflow button (⋯) in the `field`, `row` and `tile` layouts
   * (contract 5.1c C18, Lockdown LA5): `AdaptiveMenu` parts from the app ("Open item", "Show large
   * type"). Always shown; a menu on a desktop, a sheet on a phone; it never copies by itself. A row
   * that copies or shows the code uses `CodeDisplayMenuItem`, which runs this code's own copy (the
   * clipboard countdown and clear) and reveal.
   */
  menu?: React.ReactNode
  /** The overflow button's name and the menu's title. Default "More actions for {label or issuer}". */
  menuLabel?: string
}

interface CodeDisplayMenuContextValue {
  /** The code can be copied now (not loading, no error, no advance pending). */
  canCopy: boolean
  /** The code is concealed: a reveal row shows it for one period. */
  hidden: boolean
  /** Copying now takes the next code (the last seconds). */
  copyNext: boolean
  copy: () => void
  reveal: () => void
}

const CodeDisplayMenuContext = React.createContext<CodeDisplayMenuContextValue | null>(null)

export interface CodeDisplayMenuItemProps {
  /**
   * `copy`: this code's own copy, as a click on the code (the crown-jewel gate, the next code in
   * the last seconds, the clipboard countdown and clear). `reveal`: a concealed code shown for one
   * period, as Show does; it draws nothing when the code is not concealed.
   */
  action: "copy" | "reveal"
  /** The row's words. Default "Copy code" (or "Copy the next code") / "Show code". */
  children?: React.ReactNode
}

/**
 * A row of a CodeDisplay's overflow menu that copies or shows the code (contract 5.1c C18). It
 * runs the component's own copy and reveal, so the clipboard countdown, the clear and the gate
 * hold. An app's own row must never copy the code itself.
 */
export function CodeDisplayMenuItem({ action, children }: CodeDisplayMenuItemProps) {
  const code = React.useContext(CodeDisplayMenuContext)
  if (!code) throw new Error("CodeDisplayMenuItem must be inside a CodeDisplay's menu.")
  if (action === "reveal") {
    if (!code.hidden) return null
    return (
      <AdaptiveMenuItem icon="view" onSelect={code.reveal}>
        {children ?? "Show code"}
      </AdaptiveMenuItem>
    )
  }
  return (
    <AdaptiveMenuItem icon="copy" disabled={!code.canCopy} onSelect={code.copy}>
      {children ?? (code.copyNext ? "Copy the next code" : "Copy code")}
    </AdaptiveMenuItem>
  )
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

export interface CodeDisplayListProps extends React.ComponentProps<"div"> {
  /** `list` stacks rows; `grid` lays tiles in as many columns as fit (three at 1280 px, two below, on Lockdown's desktop). */
  layout?: "list" | "grid"
}

/** Wrap a list of codes so they share one polite live region instead of twenty. */
export function CodeDisplayList({ className, children, layout = "list", ...props }: CodeDisplayListProps) {
  const [msg, setMsg] = React.useState<{ text: string; n: number }>({ text: "", n: 0 })
  const announce = React.useCallback((text: string) => setMsg((s) => ({ text, n: s.n + 1 })), [])
  return (
    <AnnounceContext.Provider value={announce}>
      <div
        data-slot="code-display-list"
        data-layout={layout}
        className={cn(
          layout === "grid" ? "grid grid-cols-[repeat(auto-fill,minmax(var(--c-code-tile-min-width),1fr))] gap-(--c-code-tile-gap)" : "flex flex-col",
          className
        )}
        {...props}
      >
        {children}
        <span aria-live="polite" className="sr-only" data-slot="code-display-live">
          <span key={msg.n}>{msg.text}</span>
        </span>
      </div>
    </AnnounceContext.Provider>
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
  layout: layoutProp,
  density,
  label: labelProp,
  rule = "none",
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
  menu,
  menuLabel,
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
  const groupLabel = hidden
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
  const layout: CodeDisplayLayout = layoutProp ?? (density ? LAYOUT_OF_DENSITY[density] : "field")
  // The cells follow the seconds; under reduced motion they step every 5 s, as the ring did.
  const shownRemaining = reducedMotion ? Math.ceil(remaining / 5) * 5 : Math.ceil(remaining)
  const groups = groupCode(display)
  const skewed = Math.abs(skewSeconds) > SKEW_NOTICE_S
  const copyStatus =
    copyPhase === "counting" ? `Clears in ${countdown.secondsLeft} s` : copyPhase === "cleared" ? "Cleared" : null
  // A row or a tile is one target: a click anywhere copies (the copy button's hit area covers it).
  // Not while concealed: then a click shows the code, and the copy button keeps to the digits.
  const stretch = (layout === "row" || layout === "tile") && !hidden && !error && !loading
  const codeType = layout === "tile" ? "type-number-metric" : layout === "field" ? "type-code-display" : "type-number-count"

  // ── Parts ──
  const codeEl = error ? (
    <span data-slot="code-display-error" className="type-caption text-critical-text min-w-0">
      Can't make a code: {error}
    </span>
  ) : loading ? (
    <span data-slot="code-display-code" className={cn("flex gap-(--c-code-group-gap)", codeType)}>
      {Array.from({ length: expectedDigits === 5 ? 1 : 2 }, (_, i) => (
        <Skeleton key={i} className="h-[1em] w-[3.2em] self-center" />
      ))}
    </span>
  ) : (
    <ButtonPrimitive
      data-slot="code-display-copy"
      aria-label={copyNext ? "Copy the next code" : "Copy code"}
      disabled={!code || advancing}
      onClick={(e) => {
        e.stopPropagation()
        void copy()
      }}
      className={cn(
        "group/copy inline-flex min-w-0 items-baseline gap-3 rounded-sm text-left select-none disabled:pointer-events-none",
        // Rows and tiles: the code is drawn on the right of a row and sits with its status on its left.
        (layout === "row" || layout === "compact") && "flex-row-reverse",
        stretch && "after:absolute after:inset-0 after:content-['']"
      )}
    >
      <span
        data-slot="code-display-code"
        data-rolling={rolling ? "true" : undefined}
        aria-hidden
        className={cn(
          "text-text-body flex items-baseline gap-(--c-code-group-gap) whitespace-nowrap",
          codeType,
          expectedDigits === 8 && "[font-feature-settings:'zero']",
          expiring && "contrast-more:underline forced-colors:underline",
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
      {copyStatus && (
        // The clipboard's countdown, on the copy control: the live colour, because it is running now.
        <span data-slot="code-display-copy-status" className="type-overline text-secondary-live whitespace-nowrap">
          {copyStatus === "Cleared" ? (
            <>
              <Icon name="checkmark" size="sm" className="mr-1 inline align-[-0.2em]" />
              Cleared
            </>
          ) : (
            copyStatus
          )}
        </span>
      )}
    </ButtonPrimitive>
  )

  const secondsEl =
    timed && !error && !loading ? (
      <span
        data-slot="code-display-timer"
        data-expiring={expiring ? "" : undefined}
        aria-hidden
        className={cn("type-overline shrink-0 whitespace-nowrap", expiring ? "text-critical-text" : "text-secondary-live")}
      >
        {formatCountdown(secondsLeft)}
      </span>
    ) : null

  const nextEl =
    nextShown && !hidden && !error && !loading ? (
      <span data-slot="code-display-next" aria-hidden className="type-overline text-text-label shrink-0 whitespace-nowrap">
        Next{" "}
        {groupCode(nextDisplay as string).map((g, i) => (
          <span key={i} className="ml-[0.5em]">
            {g}
          </span>
        ))}
      </span>
    ) : null

  const barEl =
    timed && !error && !loading ? (
      <span data-slot="code-display-bar" className="min-w-0 flex-1">
        <Progress
          aria-hidden
          variant="segmented"
          segments={codeDisplaySegments}
          min={0}
          max={Math.max(1, period)}
          value={Math.min(period, shownRemaining)}
          tone={expiring ? "critical" : "default"}
        />
      </span>
    ) : null

  const counterEl = !timed ? (
    <>
      {counter !== undefined && (
        <span data-slot="code-display-counter" className="type-overline text-text-label whitespace-nowrap">
          Counter {counter}
        </span>
      )}
      <TextAction data-slot="code-display-advance" className="relative z-10" disabled={advancing || !onAdvance} onClick={(e) => {
        e.stopPropagation()
        void advance()
      }}>
        Next code
      </TextAction>
    </>
  ) : null

  const showEl = hidden && !error && !loading ? (
    <TextAction data-slot="code-display-reveal" aria-label="Show code" className="relative z-10" onClick={(e) => {
      e.stopPropagation()
      setRevealedFor(code)
    }}>
      Show
    </TextAction>
  ) : null

  const noticeEl =
    skewed || warnings.length > 0 ? (
      <span data-slot="code-display-notice" className="relative z-10 flex flex-wrap items-center gap-x-3 gap-y-1">
        {skewed && (
          <>
            <Badge tone="warning">
              <Icon name="time" size="sm" />
              Clock is off by {Math.round(Math.abs(skewSeconds))} s
            </Badge>
            {onFixClock && <TextAction onClick={onFixClock}>Fix clock</TextAction>}
          </>
        )}
        {warnings.includes("issuer-equals-login") && (
          <Badge tone="warning">
            <Icon name="warning--alt" size="sm" />
            Same account you sign in with
          </Badge>
        )}
      </span>
    ) : null

  // The issuer over the account: 10 apart in a tile and 4 in a row, as the two Lockdown codes
  // screens draw them (Desktop / 06: account ink 35 under the tile's top; Mobile / 08: 29 under
  // the row's). The compact row keeps them touching, in its 56.
  const who2 = (issuer || account) && (
    <span className={cn("flex min-w-0 flex-col", layout === "tile" && "gap-2.5", layout === "row" && "gap-1")}>
      {issuer && (
        <span data-slot="code-display-issuer" className="type-ui-emphasis text-text-body truncate">
          {issuer}
        </span>
      )}
      {account && (
        <span data-slot="code-display-account" className="type-meta text-text-label truncate">
          {account}
        </span>
      )}
    </span>
  )

  const rootProps = {
    ref: rootRef,
    "data-slot": "code-display",
    "data-variant": variant,
    "data-layout": layout,
    "data-state": state,
    "data-gated": crown.gated ? "" : undefined,
    "data-copied": copied ?? undefined,
    role: "group",
    "aria-label": groupLabel,
    tabIndex: 0,
    onFocus: () => setFocused(true),
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
    },
    onClick: (e: React.MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      if (e.defaultPrevented) return
      // A press in the overflow menu (its button, or its rows, which a portal draws elsewhere on the
      // page) is the menu's own: it never shows a concealed code by reaching the row.
      const target = e.target as Element
      if (!e.currentTarget.contains(target) || target.closest?.("[data-overflow-menu]")) return
      if (hidden) setRevealedFor(code)
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || e.target !== e.currentTarget) return
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        activate()
      }
    },
  } as const

  // The trailing ⋯ (field, row and tile), above a row's or a tile's stretched copy target.
  const menuEl =
    menu && layout !== "compact" ? (
      <CodeDisplayMenuContext.Provider
        value={{
          canCopy: Boolean(code) && !loading && !error && !advancing,
          hidden: hidden && !error && !loading,
          copyNext,
          copy: () => void copy(),
          reveal: () => setRevealedFor(code),
        }}
      >
        <span data-slot="code-display-menu" className="relative z-10 inline-flex shrink-0 self-center">
          <FieldRowOverflow label={menuLabel ?? overflowMenuLabel(labelProp ?? issuer ?? "One-time code")}>{menu}</FieldRowOverflow>
        </span>
      </CodeDisplayMenuContext.Provider>
    ) : null

  if (layout === "field") {
    const row = rowClasses("display-auto")
    return (
      // As Lockdown Desktop / 01 draws the code on an item, under its Field Rows: no hairline above
      // it (the rows before it each draw their own; `rule="top"` adds one), the label hugging its
      // words, the code centred between the label and the seconds, the bar 10 under the code's
      // line and 14 above the row's end: 12 + 40 + 10 + 4 + 14 = 80. The bar's row carries the odd
      // 2px on each side of it, so every other form of the field (no bar, a notice under it, an
      // error) keeps the stack's 8 and 12 and stays on the 4px grid.
      <div {...rootProps} data-rule={rule} className={cn("@container/row", rule === "top" && "rule-t", "select-none", className)} {...props}>
        <div className="flex flex-col gap-2 pb-3">
          <div className={cn(row.inner, "pb-0")}>
            <div className={row.body}>
              <span data-slot="code-display-label" className="type-overline text-text-label min-w-0 shrink-0">
                {labelProp ?? issuer ?? "One-time code"}
              </span>
              {/* Stacked under its label in a narrow column, it starts at the column's edge. */}
              <span className="flex min-w-0 flex-1 items-baseline justify-center gap-4 @max-lg/row:justify-start">{codeEl}</span>
            </div>
            <span className={row.actions}>
              {secondsEl}
              {counterEl}
              {showEl}
              {menuEl}
            </span>
          </div>
          {(barEl || nextEl) && (
            <div data-slot="code-display-bar-row" className="my-0.5 flex items-center gap-3">
              {nextEl}
              {barEl}
            </div>
          )}
          {noticeEl}
        </div>
        {liveRegion}
      </div>
    )
  }

  if (layout === "compact") {
    return (
      <div {...rootProps} className={cn("rule-t relative flex min-h-14 items-center gap-4 py-3.5 select-none hover:bg-state-hover", className)} {...props}>
        {media && <span data-slot="code-display-media" className="shrink-0">{media}</span>}
        <span className="flex min-w-0 flex-1 flex-col">
          {who2}
          {noticeEl}
        </span>
        {nextEl}
        {codeEl}
        {secondsEl}
        {counterEl}
        {showEl}
        {liveRegion}
      </div>
    )
  }

  // Row and tile: issuer and account over the code's line, the cells and seconds under it.
  const tile = layout === "tile"
  return (
    <div
      {...rootProps}
      className={cn(
        "relative flex flex-col select-none",
        tile
          ? "bg-surface-raised rule-box min-h-(--c-code-tile-min-height) gap-2.5 rounded p-5 hover:bg-accent active:bg-[color-mix(in_oklab,var(--text-body)_10%,var(--surface-raised))]"
          : "rule-b min-h-(--c-code-row-min-height) gap-2 px-4 py-3.5 hover:bg-state-hover active:bg-state-pressed",
        className
      )}
      {...props}
    >
      {tile ? (
        <>
          <span className="flex min-w-0 items-center gap-3">
            {media && <span data-slot="code-display-media" className="shrink-0">{media}</span>}
            {who2}
          </span>
          <span className="flex min-w-0 items-baseline">{codeEl}</span>
        </>
      ) : (
        <span className="flex min-w-0 items-center gap-4">
          {media && <span data-slot="code-display-media" className="shrink-0">{media}</span>}
          <span className="min-w-0 flex-1">{who2}</span>
          {codeEl}
        </span>
      )}
      {(barEl || nextEl || secondsEl || counterEl || showEl || menuEl) && (
        <span className="flex items-center gap-3">
          {nextEl}
          {barEl ?? <span className="flex-1" />}
          {secondsEl}
          {counterEl}
          {showEl}
          {menuEl}
        </span>
      )}
      {noticeEl}
      {liveRegion}
    </div>
  )
}
