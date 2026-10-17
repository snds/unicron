// Owned component (not generated): a hidden value used without exposing it longer than the job
// takes. One-shot value handle, a bounded reveal, hide on blur, a timed copy with a conditional
// clipboard clear, and a gate hook. Not an Input type="password" variant: that keeps the value in
// the DOM and only toggles visibility.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Spec: docs/specs/security/secret-field.md
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton, type IconButtonProps } from "../icon-button"
import { Button } from "../ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group"
import { Skeleton } from "../ui/skeleton"
import { Spinner } from "../ui/spinner"
import { readSecondsToken, useCopyCountdown, useReducedMotion } from "./copy-countdown"
import { useCrownJewel } from "./crown-jewel"

export type SecretGate = "none" | "biometric" | "password"
export type SecretRevealMode = "hold" | "toggle"
export type SecretFormat = "plain" | "groups-of-4" | "words"
export type SecretStrength = "weak" | "fair" | "strong"

/**
 * What the field asks of its host. The value only ever travels as bytes: the host copies them
 * (the core on Tauri and native; `navigator.clipboard` only in the pure web vault), the field
 * zeroes its copy, and at expiry the host clears the clipboard, conditionally where it can read it.
 */
export interface SecretFieldHost {
  /** Put these bytes on the clipboard. The field starts the timer when this resolves. */
  copy(bytes: Uint8Array): Promise<void>
  /** Clear the clipboard. Called at expiry, once, when the clipboard still holds our value (or always, see below). */
  clear(): Promise<void>
  /**
   * Does the clipboard still hold what we copied? `hash` is a hex SHA-256 of the bytes the field
   * handed to `copy`. Omit it where the platform cannot read the clipboard: the clear then runs
   * unconditionally and the tooltip says so.
   */
  clipboardHolds?(hash: string): Promise<boolean>
  /** Run a gate; resolve `true` when the person passed. The field asks, it never decides. Inside a `CrownJewelSurface` the surface's `requestProof` is used instead. */
  gate?(gate: Exclude<SecretGate, "none">): Promise<boolean>
}

/** The texts the field speaks through its polite live region, verbatim from the spec. */
export const secretFieldAnnouncements = {
  shown: (label: string, seconds: number) => `${label} shown. Hides in ${seconds} seconds.`,
  copied: (seconds: number) => `Copied. Clipboard clears in ${seconds} seconds.`,
  cleared: "Clipboard cleared.",
  gateReveal: "Confirm it's you to show this.",
  gateCopy: "Confirm it's you to copy this.",
} as const

export const secretFieldErrors = {
  read: "Couldn't read this field",
  copy: "Couldn't copy this field",
} as const

interface CommonProps {
  /** The field's name ("Password", "Secret Key"). Also the subject of the live-region texts. */
  label: string
  /** Monospace value. */
  mono?: boolean
  description?: React.ReactNode
  /** The `more` slot: large type, generate, history. */
  children?: React.ReactNode
  id?: string
  className?: string
}

export interface SecretFieldReadProps extends CommonProps {
  mode?: "read"
  /** One-shot: the field consumes the buffer and zeroes it after use. */
  getSecret: () => Promise<Uint8Array>
  host: SecretFieldHost
  /** `hold` reveals while the pointer or Space is held (Lockdown D97); `toggle` is the per-person setting, with the auto-hide. */
  revealMode?: SecretRevealMode
  /** Seconds. Default from `--c-secret-field-reveal-lifetime` (30), or `--c-crown-jewel-reveal-lifetime` (20) inside a `CrownJewelSurface`. Also hides on blur, lock, and leaving the viewport. */
  revealLifetime?: number
  /** Seconds, 10–90. Default from `--c-secret-field-clipboard-timer` (30). No "never". */
  clipboardTimer?: number
  /** `biometric` or `password` runs `host.gate` first. Inside a `CrownJewelSurface` the field is gated by the surface whatever this says. */
  gate?: SecretGate
  format?: SecretFormat
  /** The vault locked: the field masks at once. */
  locked?: boolean
  /** For the audit log. */
  onReveal?: () => void
  onCopy?: () => void
}

export interface SecretFieldEditProps extends CommonProps {
  mode: "edit"
  value: string
  onChange: (value: string) => void
  /** Computed by the host's core. Always shown with its word. */
  strength?: SecretStrength
  disabled?: boolean
  error?: string
}

export type SecretFieldProps = SecretFieldReadProps | SecretFieldEditProps

export function SecretField(props: SecretFieldProps) {
  return props.mode === "edit" ? <SecretFieldEdit {...props} /> : <SecretFieldRead {...props} />
}

// ── one revealed field per document ─────────────────────────────────────────────────────────────
let revealed: (() => void) | null = null
function claimReveal(mask: () => void) {
  if (revealed && revealed !== mask) revealed()
  revealed = mask
}
function releaseReveal(mask: () => void) {
  if (revealed === mask) revealed = null
}

// ── helpers ──────────────────────────────────────────────────────────────────────────────────────
const NAMED: Record<string, string> = {
  " ": "space",
  "-": "dash",
  _: "underscore",
  ".": "dot",
  ",": "comma",
  "/": "slash",
  "\\": "backslash",
  "@": "at",
  "#": "hash",
  "!": "exclamation mark",
  "?": "question mark",
  "*": "asterisk",
  "+": "plus",
  "=": "equals",
  $: "dollar",
  "%": "percent",
  "&": "ampersand",
  "(": "open paren",
  ")": "close paren",
  ":": "colon",
  ";": "semicolon",
  "'": "apostrophe",
  '"': "quote",
  "<": "less than",
  ">": "greater than",
  "~": "tilde",
  "^": "caret",
  "|": "bar",
  "[": "open bracket",
  "]": "close bracket",
  "{": "open brace",
  "}": "close brace",
  "`": "backtick",
}

/** Spell a value per character with case ("capital T, r, 4, dash"), so a screen reader never reads it as a word or a number. */
export function spellSecret(text: string): string {
  return Array.from(text)
    .map((c) => (/[A-Z]/.test(c) ? `capital ${c.toLowerCase()}` : /[0-9]/.test(c) ? c : (NAMED[c] ?? c)))
    .join(", ")
}

function formatSecret(text: string, format: SecretFormat): string {
  if (format === "groups-of-4") return text.replace(/(.{4})(?=.)/g, "$1 ")
  return text
}

async function hashBytes(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (subtle) {
    try {
      const copy = new Uint8Array(bytes) // digest needs a buffer we do not zero mid-flight
      const digest = new Uint8Array(await subtle.digest("SHA-256", copy))
      wipe(copy)
      return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("")
    } catch {
      /* fall through */
    }
  }
  // FNV-1a, only where SubtleCrypto is missing (an old webview). Enough to tell "ours" from "theirs".
  let h = 0x811c9dc5
  for (const b of bytes) {
    h ^= b
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `fnv1a-${h.toString(16).padStart(8, "0")}`
}

const decoder = new TextDecoder()
const CLIPBOARD_MIN = 10
const CLIPBOARD_MAX = 90

/** Zero a secret buffer. Tolerates a buffer the host already detached. */
function wipe(bytes: Uint8Array | null | undefined) {
  try {
    bytes?.fill(0)
  } catch {
    /* detached */
  }
}

/** `--c-secret-field-mask-count` from :root; the spec's 12 without the stylesheet. */
function readMaskCount(): number {
  if (typeof document === "undefined" || typeof getComputedStyle !== "function") return 12
  try {
    const n = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--c-secret-field-mask-count"))
    return Number.isFinite(n) && n > 0 ? Math.round(n) : 12
  } catch {
    return 12
  }
}

const rootEl = () => (typeof document === "undefined" ? null : document.documentElement)

type Phase = "masked" | "loading" | "revealed" | "error"

// ── read mode ────────────────────────────────────────────────────────────────────────────────────
function SecretFieldRead({
  label,
  getSecret,
  host,
  revealMode = "hold",
  revealLifetime,
  clipboardTimer,
  gate: gateProp,
  format = "plain",
  mono = true,
  locked = false,
  onReveal,
  onCopy,
  description,
  children,
  id: idProp,
  className,
}: SecretFieldReadProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  // Inside a CrownJewelSurface the surface gates every field (use → biometric, reveal → password);
  // elsewhere the `gate` prop names the host gate to run.
  const crown = useCrownJewel()
  const gate: SecretGate = crown.gated ? "password" : (gateProp ?? "none")
  const gated = crown.gated || gate !== "none"
  const reducedMotion = useReducedMotion()

  const root = React.useRef<HTMLDivElement>(null)
  const valueEl = React.useRef<HTMLSpanElement>(null)
  /** The spelled-out accessible name while revealed, written imperatively like the value. */
  const spelledEl = React.useRef<HTMLSpanElement>(null)
  const hiddenNameId = `${id}-hidden`
  const spelledNameId = `${id}-spelled`
  const bytes = React.useRef<Uint8Array | null>(null)
  const lifetimeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const holding = React.useRef(false)
  const revealSeq = React.useRef(0)
  const lastAction = React.useRef<"reveal" | "copy" | null>(null)
  /** Which control the gate is running for (so its glyph becomes the spinner). */
  const [gateFor, setGateFor] = React.useState<"reveal" | "copy" | null>(null)

  const [phase, setPhase] = React.useState<Phase>("masked")
  const [errorText, setErrorText] = React.useState<string>(secretFieldErrors.read)
  const [gateBusy, setGateBusy] = React.useState(false)
  const [live, setLive] = React.useState("")
  // Knobs: the mask count and the clipboard default are rendered, so they are read from :root once;
  // the reveal lifetime is read from the field itself when a reveal starts (an event, never a
  // render), so a surface that re-maps it for its subtree is honoured. Spec defaults apply without the stylesheet.
  const [maskCount] = React.useState(readMaskCount)
  const [clipboardDefault] = React.useState(() => readSecondsToken(rootEl(), "--c-secret-field-clipboard-timer", 30))
  const clipboardSeconds = Math.min(CLIPBOARD_MAX, Math.max(CLIPBOARD_MIN, Math.round(clipboardTimer ?? clipboardDefault)))
  // Inside a CrownJewelSurface the shorter crown-jewel knob (20 s) wins over the field's own (30 s); an explicit prop wins over both.
  const lifetimeSeconds = () =>
    Math.max(
      1,
      Math.round(
        revealLifetime ??
          (crown.gated
            ? readSecondsToken(root.current, "--c-crown-jewel-reveal-lifetime", 20)
            : readSecondsToken(root.current, "--c-secret-field-reveal-lifetime", 30))
      )
    )

  // The shared clipboard countdown. At expiry: clear only if the clipboard still holds our value.
  const lastHash = React.useRef("")
  const cancelCountdown = React.useRef<() => void>(() => {})
  const countdown = useCopyCountdown(clipboardSeconds, () => {
    void (async () => {
      let holds = true
      if (host.clipboardHolds) {
        try {
          holds = await host.clipboardHolds(lastHash.current)
        } catch {
          holds = false
        }
      }
      if (!holds) {
        cancelCountdown.current() // someone else's text: leave it, and do not say "Cleared"
        return
      }
      try {
        await host.clear()
      } catch {
        /* the host reports its own failures */
      }
      setLive(secretFieldAnnouncements.cleared)
    })()
  })
  React.useEffect(() => {
    cancelCountdown.current = countdown.cancel
  }, [countdown.cancel])

  // mask() is stable and reads only refs, so every listener below can hold it.
  const mask = React.useCallback(function mask() {
    revealSeq.current++
    if (lifetimeTimer.current) clearTimeout(lifetimeTimer.current)
    lifetimeTimer.current = null
    if (valueEl.current) valueEl.current.textContent = ""
    if (spelledEl.current) spelledEl.current.textContent = ""
    wipe(bytes.current)
    bytes.current = null
    releaseReveal(mask)
    setPhase((p) => (p === "revealed" || p === "loading" ? "masked" : p))
  }, [])

  // Hide on window blur, on the tab going hidden, on lock, and on leaving the viewport; and on unmount.
  React.useEffect(() => {
    const onBlur = () => mask()
    const onVisibility = () => {
      if (document.visibilityState === "hidden") mask()
    }
    window.addEventListener("blur", onBlur)
    document.addEventListener("visibilitychange", onVisibility)
    let io: IntersectionObserver | null = null
    if (typeof IntersectionObserver === "function" && root.current) {
      io = new IntersectionObserver((entries) => {
        if (entries.some((e) => !e.isIntersecting)) mask()
      })
      io.observe(root.current)
    }
    return () => {
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("visibilitychange", onVisibility)
      io?.disconnect()
      mask()
    }
  }, [mask])
  React.useEffect(() => {
    // The lock is an external fact: the field wipes at once, not on the next event.
    // oxlint-disable-next-line react/set-state-in-effect
    if (locked) mask()
  }, [locked, mask])

  const runGate = async (kind: "reveal" | "copy"): Promise<boolean> => {
    if (!gated) return true
    setLive(kind === "reveal" ? secretFieldAnnouncements.gateReveal : secretFieldAnnouncements.gateCopy)
    setGateBusy(true)
    setGateFor(kind)
    try {
      if (crown.gated) return (await crown.requestProof(kind === "reveal" ? "reveal" : "use")) === true
      return (await host.gate?.(gate as Exclude<SecretGate, "none">)) === true
    } catch {
      return false
    } finally {
      setGateBusy(false)
      setGateFor(null)
    }
  }

  const reveal = async () => {
    if (phase === "revealed" || phase === "loading" || gateBusy || locked) return
    lastAction.current = "reveal"
    if (!(await runGate("reveal"))) return
    if (revealMode === "hold" && !holding.current) return // released while the gate ran
    const seq = ++revealSeq.current
    setPhase("loading")
    let buf: Uint8Array
    try {
      buf = await getSecret()
    } catch {
      setErrorText(secretFieldErrors.read)
      setPhase("error")
      return
    }
    // Masked meanwhile (blur, lock, pointer released): drop the buffer, never show it.
    if (seq !== revealSeq.current || (revealMode === "hold" && !holding.current) || !valueEl.current || !spelledEl.current) {
      wipe(buf)
      setPhase((p) => (p === "loading" ? "masked" : p))
      return
    }
    // The string exists only for this DOM write; React state holds a boolean.
    const text = decoder.decode(buf)
    valueEl.current.textContent = formatSecret(text, format)
    spelledEl.current.textContent = spellSecret(text)
    bytes.current = buf
    claimReveal(mask)
    setPhase("revealed")
    const seconds = lifetimeSeconds()
    setLive(secretFieldAnnouncements.shown(label, seconds))
    onReveal?.()
    lifetimeTimer.current = setTimeout(mask, seconds * 1000)
  }

  const copy = async () => {
    if (gateBusy || locked) return
    lastAction.current = "copy"
    if (!(await runGate("copy"))) return
    let buf: Uint8Array | undefined
    let hash = ""
    try {
      buf = await getSecret()
      hash = await hashBytes(buf)
      await host.copy(buf)
    } catch {
      setErrorText(secretFieldErrors.copy)
      setPhase("error")
      return
    } finally {
      // Whatever happened, our copy of the bytes is gone.
      wipe(buf)
    }
    lastHash.current = hash
    onCopy?.()
    countdown.start()
    setLive(secretFieldAnnouncements.copied(clipboardSeconds))
  }

  const retry = () => {
    setPhase("masked")
    if (lastAction.current === "copy") void copy()
    else if (revealMode === "toggle") void reveal()
  }

  // ── reveal control: hold (default) or toggle ────────────────────────────────────────────────────
  const isRevealed = phase === "revealed"
  const holdHandlers: Pick<IconButtonProps, "onPointerDown" | "onPointerUp" | "onPointerCancel" | "onPointerLeave" | "onKeyDown" | "onKeyUp" | "onBlur" | "onClick"> =
    revealMode === "hold"
      ? {
          onPointerDown: (e) => {
            if (e.button !== 0) return
            holding.current = true
            void reveal()
          },
          onPointerUp: () => {
            holding.current = false
            mask()
          },
          onPointerCancel: () => {
            holding.current = false
            mask()
          },
          onPointerLeave: () => {
            if (holding.current) {
              holding.current = false
              mask()
            }
          },
          onKeyDown: (e) => {
            if (e.key === "Enter") e.preventDefault() // a stray Enter never reveals
            if (e.key === " ") {
              e.preventDefault()
              if (e.repeat || holding.current) return
              holding.current = true
              void reveal()
            }
          },
          onKeyUp: (e) => {
            if (e.key === " ") {
              e.preventDefault()
              holding.current = false
              mask()
            }
          },
          onBlur: () => {
            if (holding.current) {
              holding.current = false
              mask()
            }
          },
          // Clicks are what pointer up and Space release produce; the hold already handled them.
          onClick: (e) => e.preventDefault(),
        }
      : {
          onClick: () => (isRevealed ? mask() : void reveal()),
        }

  const copyPhase = countdown.state
  const copyLeft = countdown.secondsLeft
  const revealGlyph = isRevealed ? "visibility_off" : "visibility"
  const copyTooltip =
    copyPhase === "counting"
      ? `Copied · clears in ${copyLeft} s${host.clipboardHolds ? "" : ", even if you copy something else"}`
      : copyPhase === "cleared"
        ? "Cleared"
        : gated
          ? `Copy ${label} (confirm it's you first)`
          : undefined

  const onControlKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
      e.preventDefault()
      void copy()
    }
  }

  return (
    <div ref={root} data-slot="secret-field" data-mode="read" data-state={phase} data-gate={crown.gated ? "crown-jewel" : gate} className={className}>
      <Field>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div data-slot="secret-field-control" className={cn(mono && "font-mono")}>
          <InputGroup onKeyDown={onControlKeyDown}>
            {phase === "error" ? (
              <span data-slot="secret-field-error" role="alert" className="text-destructive flex flex-1 items-center gap-2 px-2.5 text-sm">
                {errorText}
                <Button variant="link" size="inline" onClick={retry}>
                  Retry
                </Button>
              </span>
            ) : (
              <span
                id={id}
                data-slot="secret-field-value"
                role="textbox"
                aria-readonly="true"
                aria-labelledby={isRevealed ? spelledNameId : hiddenNameId}
                tabIndex={0}
                className={cn(
                  "mx-1.5 flex h-6 min-w-0 flex-1 items-center truncate rounded-sm px-1 text-sm outline-none transition-colors motion-reduce:transition-none",
                  isRevealed
                    ? "bg-(--c-secret-field-revealed-bg) tracking-(--c-secret-field-letter-spacing) contrast-more:bg-transparent forced-colors:bg-transparent"
                    : "text-muted-foreground"
                )}
                style={{ userSelect: "none", WebkitUserSelect: "none" }}
              >
                {/* Revealed: the text node and its spelled name are written imperatively, never through React state.
                    The span stays mounted while loading: `reveal` writes into it after `getSecret` resolves, and a
                    host whose fetch crosses a bridge (any IPC call) resolves after the loading render has committed. */}
                <span ref={valueEl} data-slot="secret-field-revealed" className="truncate" />
                <span id={hiddenNameId} className="sr-only">
                  {label}, hidden
                </span>
                <span id={spelledNameId} ref={spelledEl} className="sr-only" />
                {phase === "loading" && <Skeleton data-slot="secret-field-loading" className="h-4 flex-1" />}
                {!isRevealed && phase !== "loading" && (
                  <>
                    <span aria-hidden className="tracking-[0.2em] contrast-more:hidden forced-colors:hidden">
                      {"•".repeat(maskCount)}
                    </span>
                    <span aria-hidden className="hidden contrast-more:inline forced-colors:inline">
                      Hidden
                    </span>
                  </>
                )}
                {isRevealed && (
                  <span aria-hidden className="text-muted-foreground ml-2 hidden text-xs contrast-more:inline forced-colors:inline">
                    Shown
                  </span>
                )}
              </span>
            )}
            <InputGroupAddon align="inline-end">
              <IconButton
                data-slot="secret-field-reveal"
                label={isRevealed ? `Hide ${label}` : revealMode === "hold" ? `Hold to show ${label}` : `Show ${label}`}
                aria-pressed={isRevealed}
                disabled={gateBusy || phase === "loading" || phase === "error" || locked}
                onPointerDown={holdHandlers.onPointerDown}
                onPointerUp={holdHandlers.onPointerUp}
                onPointerCancel={holdHandlers.onPointerCancel}
                onPointerLeave={holdHandlers.onPointerLeave}
                onKeyDown={holdHandlers.onKeyDown}
                onKeyUp={holdHandlers.onKeyUp}
                onBlur={holdHandlers.onBlur}
                onClick={holdHandlers.onClick}
              >
                {gateFor === "reveal" ? (
                  <Spinner />
                ) : (
                  <GlyphWithGate name={revealGlyph} gated={gated} />
                )}
              </IconButton>
              <IconButton
                data-slot="secret-field-copy"
                label={`Copy ${label}`}
                tooltip={copyTooltip}
                disabled={gateBusy || phase === "error" || locked}
                onClick={() => void copy()}
              >
                {gateFor === "copy" ? (
                  <Spinner />
                ) : copyPhase === "counting" ? (
                  <CopyCountdown left={copyLeft} total={clipboardSeconds} numeric={reducedMotion} />
                ) : copyPhase === "cleared" ? (
                  <>
                    <Icon name="check" />
                    <span className="sr-only">Cleared</span>
                  </>
                ) : (
                  <GlyphWithGate name="content_copy" gated={gated} />
                )}
              </IconButton>
              {children && <span data-slot="secret-field-more">{children}</span>}
            </InputGroupAddon>
          </InputGroup>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </Field>
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  )
}

function GlyphWithGate({ name, gated }: { name: "visibility" | "visibility_off" | "content_copy"; gated: boolean }) {
  return (
    <span className="relative inline-flex">
      <Icon name={name} />
      {gated && (
        <span data-slot="secret-field-gate" className="absolute -right-1 -bottom-1 [&>svg]:size-2.5!">
          <Icon name="lock" fill />
        </span>
      )}
    </span>
  )
}

/** The copy countdown: a ring that drains, or, under reduced motion, the seconds as text. */
function CopyCountdown({ left, total, numeric }: { left: number; total: number; numeric: boolean }) {
  if (numeric) {
    return (
      <span data-slot="secret-field-copy-countdown" className="text-[0.625rem] font-medium tabular-nums">
        {left} s
      </span>
    )
  }
  const progress = total > 0 ? Math.max(0, Math.min(1, left / total)) : 0
  return (
    <svg data-slot="secret-field-copy-countdown" viewBox="0 0 20 20" className="size-4 -rotate-90" aria-hidden fill="none">
      <circle cx="10" cy="10" r="8" strokeWidth="2" className="stroke-(--c-secret-field-copy-track) forced-colors:stroke-[GrayText]" />
      <circle
        cx="10"
        cy="10"
        r="8"
        strokeWidth="2"
        pathLength={100}
        strokeDasharray="100"
        strokeDashoffset={100 - progress * 100}
        strokeLinecap="round"
        className="stroke-(--c-secret-field-copy-progress) transition-[stroke-dashoffset] duration-1000 ease-linear forced-colors:stroke-[CanvasText]"
      />
    </svg>
  )
}

// ── edit mode ────────────────────────────────────────────────────────────────────────────────────
const STRENGTH: Record<SecretStrength, { word: string; segments: number; className: string }> = {
  weak: { word: "Weak", segments: 1, className: "bg-(--c-secret-field-meter-weak)" },
  fair: { word: "Fair", segments: 2, className: "bg-(--c-secret-field-meter-fair)" },
  strong: { word: "Strong", segments: 3, className: "bg-(--c-secret-field-meter-strong)" },
}

function SecretFieldEdit({ label, value, onChange, strength, disabled = false, error, mono = true, description, children, id: idProp, className }: SecretFieldEditProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const meterId = `${id}-strength`
  const [shown, setShown] = React.useState(false)
  const meter = strength ? STRENGTH[strength] : null

  return (
    <div data-slot="secret-field" data-mode="edit" data-state={shown ? "revealed" : "masked"} className={className}>
      <Field data-invalid={error ? "true" : undefined} data-disabled={disabled ? "true" : undefined}>
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <div data-slot="secret-field-control" className={cn(mono && "font-mono")}>
          <InputGroup>
            <InputGroupInput
              id={id}
              type={shown ? "text" : "password"}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              disabled={disabled}
              aria-invalid={error ? true : undefined}
              aria-describedby={meter ? meterId : undefined}
            />
            <InputGroupAddon align="inline-end">
              <IconButton
                data-slot="secret-field-reveal"
                label={shown ? `Hide ${label}` : `Show ${label}`}
                icon={shown ? "visibility_off" : "visibility"}
                aria-pressed={shown}
                disabled={disabled}
                onClick={() => setShown((s) => !s)}
              />
              {children && <span data-slot="secret-field-more">{children}</span>}
            </InputGroupAddon>
          </InputGroup>
        </div>
        {meter && (
          <div id={meterId} data-slot="secret-field-meter" data-strength={strength} className="flex items-center gap-2 text-xs">
            <span aria-hidden className="flex flex-1 gap-1">
              {[1, 2, 3].map((n) => (
                <span key={n} className={cn("bg-border h-1 flex-1 rounded-full", n <= meter.segments && meter.className)} />
              ))}
            </span>
            <span className="text-muted-foreground">
              <span className="sr-only">Strength: </span>
              {meter.word}
            </span>
          </div>
        )}
        {description && !error && <FieldDescription>{description}</FieldDescription>}
        {error && <FieldError>{error}</FieldError>}
      </Field>
    </div>
  )
}
