// Owned component (not generated): a hidden value used without exposing it longer than the job
// takes. One-shot value handle, a bounded reveal, hide on blur, a timed copy with a conditional
// clipboard clear, and a gate hook. Not an Input type="password" variant: that keeps the value in
// the DOM and only toggles visibility.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:512 Field Row and 32:48 Text Field; no app PR, no DSA record)
// Spec: docs/specs/security/secret-field.md
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { FloatButton, type FloatButtonKind, type FloatButtonSize } from "../ui/float-button"
import { Skeleton } from "../ui/skeleton"
import { readSecondsToken, useCopyCountdown, type CopyCountdownState } from "./copy-countdown"
import { useCrownJewel } from "./crown-jewel"
import { TextAction, rowClasses } from "./parts"

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
  /** Put these bytes on the clipboard. The field starts the timer when this resolves. Not called when `copyRef` is given. */
  copy(bytes: Uint8Array): Promise<void>
  /**
   * Copy by reference: the host puts the value on the clipboard inside its own process (the core
   * on Tauri and native), so no bytes cross to the UI for a copy. When present, the field never
   * calls `getSecret` or `copy` to copy. Resolve with `{ hash }` and the field hands that string
   * back to `clipboardHolds` at expiry (it is opaque to the field: a digest, or the host's own
   * record of the copy). Resolve with nothing and the clear runs unconditionally, and the tooltip
   * says so.
   */
  copyRef?(): Promise<SecretFieldCopyRef | void>
  /** Clear the clipboard. Called at expiry, once, when the clipboard still holds our value (or always, see below). */
  clear(): Promise<void>
  /**
   * Does the clipboard still hold what we copied? `hash` is a hex SHA-256 of the bytes the field
   * handed to `copy`, or the `hash` that `copyRef` resolved with. Omit it where the platform cannot
   * read the clipboard: the clear then runs unconditionally and the tooltip says so.
   */
  clipboardHolds?(hash: string): Promise<boolean>
  /** Run a gate; resolve `true` when the person passed. The field asks, it never decides. Inside a `CrownJewelSurface` the surface's `requestProof` is used instead. */
  gate?(gate: Exclude<SecretGate, "none">): Promise<boolean>
}

/** What `copyRef` may resolve with: the string `clipboardHolds` is asked about at expiry. */
export interface SecretFieldCopyRef {
  hash?: string
}

/** A host that only copies by reference: `copyRef` is required and `copy` may be left out. */
export type SecretFieldReferenceHost = Omit<SecretFieldHost, "copy" | "copyRef"> & {
  copyRef(): Promise<SecretFieldCopyRef | void>
  copy?: SecretFieldHost["copy"]
}

/** What failed, for `errorText` as a function. */
export type SecretFieldAction = "read" | "copy"

/** The texts the field speaks through its polite live region, verbatim from the spec. */
export const secretFieldAnnouncements = {
  shown: (label: string, seconds: number) => `${label} shown. Hides in ${seconds} seconds.`,
  /** A hold reveal that went through a gate: the check took focus, so the value stays until Hide or the lifetime. */
  shownUntilHidden: (label: string, seconds: number) => `${label} shown. Hides in ${seconds} seconds, or when you select Hide.`,
  copied: (seconds: number) => `Copied. Clipboard clears in ${seconds} seconds.`,
  cleared: "Clipboard cleared.",
  gateReveal: "Confirm it's you to show this.",
  gateCopy: "Confirm it's you to copy this.",
} as const

export const secretFieldErrors = {
  read: "Couldn't read this field",
  copy: "Couldn't copy this field",
} as const

/** What a fill-only field says in place of its value (a share that may fill, never show or copy). */
export const secretFieldFillOnlyText = "Fills in the browser only; never shown or copied."

/**
 * The words on the field's own text actions. Each is part of its control's accessible name
 * ("Hold to show Password", "Copy Password"), so a voice-control user can say what they see.
 */
export const secretFieldWords = {
  show: "Show",
  hold: "Hold to show",
  hide: "Hide",
  copy: "Copy",
  retry: "Retry",
  clearsIn: (seconds: number) => `Clears in ${seconds} s`,
  cleared: "Cleared",
} as const

/**
 * The row's layout, Field Row's sizes (Figma 15:512): `default` puts the label in a column on the
 * value's baseline (desktop), `stacked` puts it over the value (phone). `auto` (the default) is
 * `default` in a container 32rem wide or more and `stacked` below it.
 */
export type SecretFieldSize = "auto" | "default" | "stacked"

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
  /** Never set on a field that reveals and copies; see `SecretFieldFillOnlyProps`. */
  fillOnly?: false
  /** Field Row's layout. Default `auto`. */
  size?: SecretFieldSize
  /**
   * Bind controls outside the row to this field: the phone's bottom-row eye and copy buttons
   * (`SecretFieldRemoteButton`). Make it with `useSecretFieldRemote()`. The remote runs the
   * field's own reveal and copy, with the same gate, hold, lifetime and clipboard timer.
   */
  remote?: SecretFieldRemote
  /** One-shot: the field consumes the buffer and zeroes it after use. */
  getSecret: () => Promise<Uint8Array>
  host: SecretFieldHost | SecretFieldReferenceHost
  /**
   * `hold` reveals while the pointer or Space is held (Lockdown D97); `toggle` is the per-person
   * setting, with the auto-hide. A gated field (a `gate`, or inside a `CrownJewelSurface`) always
   * reveals as `toggle`: the check opens a dialog or an OS prompt, which ends any hold.
   */
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
  /**
   * The host's own words for a failed reveal or copy, in place of "Couldn't read this field" /
   * "Couldn't copy this field". A string is shown for either; a function gets what `getSecret`,
   * `copy` or `copyRef` rejected with, and which action failed, and may return `undefined` for the
   * default words.
   */
  errorText?: string | ((error: unknown, action: SecretFieldAction) => string | undefined)
}

export interface SecretFieldEditProps extends CommonProps {
  mode: "edit"
  value: string
  onChange: (value: string) => void
  /**
   * Computed by the host's core, never by the field (see `secretStrengthFromScore` for the
   * shared mapping from a 0–4 guess score). Always shown with its word.
   */
  strength?: SecretStrength
  disabled?: boolean
  error?: string
  /**
   * Several lines (a private key, a recovery phrase): a textarea that keeps line breaks, drawn
   * masked until Show, with the same Show control and the same edit rules as one line.
   */
  multiline?: boolean
  /** Visible lines when `multiline`. Default 4; the box grows with what is typed. */
  rows?: number
  /** The control's `name`, for a form and a form library. */
  name?: string
  /** Native `required` and `aria-required`, so the browser's form check and a form library see it. */
  required?: boolean
  /** For a form library that tracks touched fields. */
  onBlur?: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  /** Shown in the empty box ("Left empty, it stays as it is."). */
  placeholder?: string
  /**
   * Nothing to type here: the box shows this line instead of an input ("Made when you save",
   * "Removed when you save.", "Made by a passkey provider; kept as it is."). No value, no Show.
   */
  stateText?: string
  /** Text actions on the label's line, at its end: `Generate`, `Remove`, `Keep`, `Options`. Two at most read well. */
  actions?: SecretFieldTextAction[]
  /** Default `new-password` (one line) or `off` (several). `current-password` where a known secret is asked for (a gate). */
  autoComplete?: "new-password" | "current-password" | "off"
  /** The input or textarea, for a dialog's first focus. */
  inputRef?: React.Ref<HTMLInputElement & HTMLTextAreaElement>
}

/** One word that does one thing, on the edit field's label line. */
export interface SecretFieldTextAction {
  label: string
  onClick: () => void
  disabled?: boolean
  /** Its accessible name when the word alone is not enough ("Generate a password"). It must contain `label`. */
  "aria-label"?: string
}

/**
 * A secret this person may have filled into a page but never sees or copies (a fill-only share).
 * The row draws its label and one sentence; there is no reveal, no copy, no `more` slot, and
 * nothing is ever fetched. A remote bound to it draws nothing.
 */
export interface SecretFieldFillOnlyProps extends Omit<CommonProps, "children" | "mono"> {
  mode?: "read"
  fillOnly: true
  size?: SecretFieldSize
  remote?: SecretFieldRemote
  /** In place of `secretFieldFillOnlyText`. */
  fillOnlyText?: string
}

export type SecretFieldProps = SecretFieldReadProps | SecretFieldEditProps | SecretFieldFillOnlyProps

export function SecretField(props: SecretFieldProps) {
  if (props.mode === "edit") return <SecretFieldEdit {...props} />
  if (props.fillOnly) return <SecretFieldFillOnly {...props} />
  return <SecretFieldRead {...props} />
}

// ── remote: controls outside the row that drive this field ───────────────────────────────────

/** What a remote button draws from: the field's state, as the field reports it. */
export interface SecretFieldRemoteState {
  label: string
  revealMode: SecretRevealMode
  revealed: boolean
  /** A gate or a fetch is running. */
  busy: boolean
  /** Locked, or the field is showing an error. */
  disabled: boolean
  gated: boolean
  /** The field may be revealed and copied (false for a fill-only field, or before a field binds). */
  available: boolean
  copyPhase: CopyCountdownState
  copySecondsLeft: number
}

type RevealHandlers = {
  onPointerDown?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerCancel?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerLeave?: (e: React.PointerEvent<HTMLButtonElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  onKeyUp?: (e: React.KeyboardEvent<HTMLButtonElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLButtonElement>) => void
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

interface RemoteBinding {
  reveal: RevealHandlers
  copy: () => void
  /** Bring the row into view before a remote reveal, so the value shows where it is read. */
  show: () => void
}

/** Made by `useSecretFieldRemote()`; pass the same object to the field and to its remote buttons. */
export interface SecretFieldRemote {
  /** For `SecretFieldRemoteButton`. */
  readonly subscribe: (onChange: () => void) => () => void
  /** For `SecretFieldRemoteButton`: `null` until a field binds. */
  readonly getSnapshot: () => SecretFieldRemoteState | null
}

interface RemoteImpl extends SecretFieldRemote {
  binding: () => RemoteBinding | null
  bind: (binding: RemoteBinding | null, state: SecretFieldRemoteState | null) => void
}

function createRemote(): RemoteImpl {
  let state: SecretFieldRemoteState | null = null
  let bound: RemoteBinding | null = null
  const listeners = new Set<() => void>()
  return {
    binding: () => bound,
    subscribe(onChange) {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    getSnapshot: () => state,
    bind(binding, next) {
      bound = binding
      const same =
        state === next ||
        (state !== null &&
          next !== null &&
          (Object.keys(next) as (keyof SecretFieldRemoteState)[]).every((k) => state![k] === next[k]))
      if (same) return
      state = next
      for (const l of listeners) l()
    },
  }
}

/** A remote for one SecretField: pass it to the field's `remote` and to each `SecretFieldRemoteButton`. */
export function useSecretFieldRemote(): SecretFieldRemote {
  const [remote] = React.useState(createRemote)
  return remote
}

/** Bind a field to its remote: report the state after each render, and hand over the handlers. */
function useRemoteBinding(remote: SecretFieldRemote | undefined, state: SecretFieldRemoteState, binding: RemoteBinding) {
  const impl = remote as RemoteImpl | undefined
  React.useLayoutEffect(() => {
    if (!impl) return
    impl.bind(binding, state)
  })
  React.useEffect(() => {
    if (!impl) return
    return () => impl.bind(null, null)
  }, [impl])
}

export interface SecretFieldRemoteButtonProps {
  remote: SecretFieldRemote
  /** `reveal`: the eye (hold or tap, as the field says). `copy`: the timed copy. */
  action: "reveal" | "copy"
  /** Default: `neutral` for reveal, `primary` for copy (Lockdown's phone item, Figma 40:357). */
  kind?: FloatButtonKind
  /** Default `l` (48), the phone's bottom row. */
  size?: FloatButtonSize
}

/**
 * A float button in the phone's bottom row that drives a SecretField somewhere above it: the eye
 * shows the value in the field's own row (held or tapped, gated, for the field's lifetime), and
 * copy runs the field's timed copy. Its name says what it does ("Hold to show Password", "Copy
 * Password"); the countdown and "Cleared" show in the row and are spoken there. It draws nothing
 * until a field binds, and nothing for a fill-only field.
 */
export function SecretFieldRemoteButton({ remote, action, kind, size = "l" }: SecretFieldRemoteButtonProps) {
  const state = React.useSyncExternalStore(remote.subscribe, remote.getSnapshot, () => null)
  const impl = remote as RemoteImpl
  if (!state || !state.available) return null
  if (action === "copy") {
    return (
      <FloatButton
        data-slot="secret-field-remote-copy"
        label={`${secretFieldWords.copy} ${state.label}`}
        icon={state.copyPhase === "cleared" ? "checkmark" : "copy"}
        kind={kind ?? "primary"}
        size={size}
        disabled={state.busy || state.disabled}
        onClick={() => impl.binding()?.copy()}
      />
    )
  }
  const name = state.revealed
    ? `${secretFieldWords.hide} ${state.label}`
    : state.revealMode === "hold"
      ? `${secretFieldWords.hold} ${state.label}`
      : `${secretFieldWords.show} ${state.label}`
  const call = <K extends keyof RevealHandlers>(key: K) =>
    ((e: Parameters<NonNullable<RevealHandlers[K]>>[0]) => {
      const handler = impl.binding()?.reveal[key] as ((event: typeof e) => void) | undefined
      // A reveal starts here: bring the row into view first, so the value shows where it is read.
      if (!state.revealed && (key === "onPointerDown" || key === "onKeyDown" || key === "onClick")) impl.binding()?.show()
      handler?.(e)
    }) as NonNullable<RevealHandlers[K]>
  return (
    <FloatButton
      data-slot="secret-field-remote-reveal"
      label={name}
      icon={state.revealed ? "view--off" : "view"}
      kind={kind ?? "neutral"}
      size={size}
      aria-pressed={state.revealed}
      disabled={state.busy || state.disabled}
      onPointerDown={call("onPointerDown")}
      onPointerUp={call("onPointerUp")}
      onPointerCancel={call("onPointerCancel")}
      onPointerLeave={call("onPointerLeave")}
      onKeyDown={call("onKeyDown")}
      onKeyUp={call("onKeyUp")}
      onBlur={call("onBlur")}
      onClick={call("onClick")}
    />
  )
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
  revealMode: revealModeProp = "hold",
  revealLifetime,
  clipboardTimer,
  gate: gateProp,
  format = "plain",
  mono = true,
  locked = false,
  onReveal,
  onCopy,
  errorText: errorTextProp,
  description,
  children,
  id: idProp,
  className,
  size = "auto",
  remote,
}: SecretFieldReadProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  // Inside a CrownJewelSurface the surface gates every field (use → biometric, reveal → password);
  // elsewhere the `gate` prop names the host gate to run.
  const crown = useCrownJewel()
  const gate: SecretGate = crown.gated ? "password" : (gateProp ?? "none")
  const gated = crown.gated || gate !== "none"
  // A hold cannot outlive a gate: the check takes focus (a dialog, an OS prompt), and losing focus ends the hold.
  // So a gated field reveals as a toggle, with the lifetime, and says so when it shows.
  const revealMode: SecretRevealMode = gated ? "toggle" : revealModeProp
  const holdFellBack = gated && revealModeProp === "hold"

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
  const [failure, setFailure] = React.useState<{ action: SecretFieldAction; words?: string }>({ action: "read" })
  const fail = (action: SecretFieldAction, error: unknown) => {
    let words: string | undefined
    if (typeof errorTextProp === "function") {
      try {
        words = errorTextProp(error, action)
      } catch {
        words = undefined
      }
    }
    setFailure({ action, words })
    setPhase("error")
  }
  const errorWords =
    failure.words ?? (typeof errorTextProp === "string" && errorTextProp ? errorTextProp : undefined) ?? secretFieldErrors[failure.action]
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
  /** What `clipboardHolds` is asked about at expiry; `null` when the clear is unconditional (a reference copy with no hash). */
  const lastHash = React.useRef<string | null>("")
  /** Whether the running countdown ends in a conditional clear: drawn in the tooltip. */
  const [conditionalClear, setConditionalClear] = React.useState(Boolean(host.clipboardHolds))
  const cancelCountdown = React.useRef<() => void>(() => {})
  const countdown = useCopyCountdown(clipboardSeconds, () => {
    void (async () => {
      let holds = true
      const hash = lastHash.current
      if (host.clipboardHolds && hash !== null) {
        try {
          holds = await host.clipboardHolds(hash)
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
    } catch (error) {
      fail("read", error)
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
    setLive(holdFellBack ? secretFieldAnnouncements.shownUntilHidden(label, seconds) : secretFieldAnnouncements.shown(label, seconds))
    onReveal?.()
    lifetimeTimer.current = setTimeout(mask, seconds * 1000)
  }

  const copy = async () => {
    if (gateBusy || locked) return
    lastAction.current = "copy"
    if (!(await runGate("copy"))) return
    let hash: string | null = ""
    if (host.copyRef) {
      // By reference: the host copies inside its own process; no bytes come to the UI.
      try {
        const ref = await host.copyRef()
        hash = typeof ref?.hash === "string" ? ref.hash : null
      } catch (error) {
        fail("copy", error)
        return
      }
    } else {
      let buf: Uint8Array | undefined
      try {
        if (!host.copy) throw new Error("SecretField: the host has neither copy nor copyRef")
        buf = await getSecret()
        hash = await hashBytes(buf)
        await host.copy(buf)
      } catch (error) {
        fail("copy", error)
        return
      } finally {
        // Whatever happened, our copy of the bytes is gone.
        wipe(buf)
      }
    }
    lastHash.current = hash
    setConditionalClear(Boolean(host.clipboardHolds) && hash !== null)
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
  const holdHandlers: RevealHandlers =
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
  const revealName = isRevealed ? `${secretFieldWords.hide} ${label}` : revealMode === "hold" ? `${secretFieldWords.hold} ${label}` : `${secretFieldWords.show} ${label}`
  const revealWord = isRevealed ? secretFieldWords.hide : revealMode === "hold" ? secretFieldWords.hold : secretFieldWords.show
  // The tooltip of the old icon button, kept as the copy control's description: how the clear runs.
  const copyNote =
    copyPhase === "counting"
      ? `Copied · clears in ${copyLeft} s${conditionalClear ? "" : ", even if you copy something else"}`
      : copyPhase === "cleared"
        ? secretFieldWords.cleared
        : gated
          ? `Copy ${label} (confirm it's you first)`
          : undefined
  const copyNoteId = `${id}-copy-note`

  const onControlKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "c") {
      e.preventDefault()
      void copy()
    }
  }

  useRemoteBinding(
    remote,
    {
      label,
      revealMode,
      revealed: isRevealed,
      busy: gateBusy || phase === "loading",
      disabled: locked || phase === "error",
      gated,
      available: true,
      copyPhase,
      copySecondsLeft: copyLeft,
    },
    {
      reveal: holdHandlers,
      copy: () => void copy(),
      show: () => root.current?.scrollIntoView?.({ block: "nearest" }),
    }
  )

  const row = rowClasses(size)
  const labelId = `${id}-label`

  return (
    <div
      ref={root}
      data-slot="secret-field"
      data-mode="read"
      data-state={phase}
      data-gate={crown.gated ? "crown-jewel" : gate}
      data-reveal-mode={revealMode}
      data-size={size}
      className={cn(row.root, className)}
    >
      <div data-slot="secret-field-control" className={row.inner} onKeyDown={onControlKeyDown}>
        <div className={row.body}>
          <span id={labelId} data-slot="secret-field-label" className={row.label}>
            {label}
          </span>
          {phase === "error" ? (
            <span data-slot="secret-field-error" role="alert" className="type-caption text-critical-text flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3">
              {errorWords}
              <TextAction tone="critical" onClick={retry}>
                {secretFieldWords.retry}
              </TextAction>
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
                "text-text-body flex min-w-0 flex-1 items-baseline gap-2 rounded-sm select-none",
                mono ? "type-code-inline" : "type-ui",
                isRevealed && "tracking-(--c-secret-field-letter-spacing)"
              )}
              // Through the style prop as well as the class, so it holds before any stylesheet loads (React sets it through the CSSOM: strict-CSP safe).
              style={{ userSelect: "none", WebkitUserSelect: "none" }}
            >
              {/* Revealed: the text node and its spelled name are written imperatively, never through React state.
                  The span stays mounted while loading: `reveal` writes into it after `getSecret` resolves, and a
                  host whose fetch crosses a bridge (any IPC call) resolves after the loading render has committed. */}
              {/* The wash behind a shown value hugs the text: out in the open, and only as wide as it is. */}
              <span
                ref={valueEl}
                data-slot="secret-field-revealed"
                className={cn(
                  "min-w-0 truncate",
                  isRevealed && "-mx-1 bg-(--c-secret-field-revealed-bg) px-1 contrast-more:bg-transparent forced-colors:bg-transparent"
                )}
              />
              <span id={hiddenNameId} className="sr-only">
                {label}, hidden
              </span>
              <span id={spelledNameId} ref={spelledEl} className="sr-only" />
              {phase === "loading" && <Skeleton data-slot="secret-field-loading" className="h-4 flex-1 self-center" />}
              {!isRevealed && phase !== "loading" && (
                <>
                  <span aria-hidden className="tracking-(--c-secret-field-mask-spacing) contrast-more:hidden forced-colors:hidden">
                    {"•".repeat(maskCount)}
                  </span>
                  <span aria-hidden className="hidden contrast-more:inline forced-colors:inline">
                    Hidden
                  </span>
                </>
              )}
              {isRevealed && (
                <span aria-hidden className="type-overline text-text-label hidden contrast-more:inline forced-colors:inline">
                  Shown
                </span>
              )}
            </span>
          )}
        </div>
        <div data-slot="secret-field-actions" className={row.actions}>
          {(copyPhase === "counting" || copyPhase === "cleared") && (
            // The clipboard's own countdown, in the live colour: it is running now (rules §2.5.4).
            // Spoken through the live region at the start and the end, not every second.
            <span data-slot="secret-field-copy-countdown" aria-hidden className="type-overline text-secondary-live whitespace-nowrap">
              {copyPhase === "counting" ? secretFieldWords.clearsIn(copyLeft) : secretFieldWords.cleared}
            </span>
          )}
          <TextAction
            data-slot="secret-field-reveal"
            aria-label={revealName}
            aria-pressed={isRevealed}
            busy={gateFor === "reveal"}
            disabled={gateBusy || phase === "loading" || phase === "error" || locked}
            {...holdHandlers}
          >
            {gated && gateFor !== "reveal" && <Icon data-slot="secret-field-gate" name="locked--filled" size="sm" />}
            {revealWord}
          </TextAction>
          <TextAction
            data-slot="secret-field-copy"
            aria-label={`${secretFieldWords.copy} ${label}`}
            aria-describedby={copyNote ? copyNoteId : undefined}
            busy={gateFor === "copy"}
            disabled={gateBusy || phase === "error" || locked}
            onClick={() => void copy()}
          >
            {gated && gateFor !== "copy" && <Icon name="locked--filled" size="sm" />}
            {secretFieldWords.copy}
          </TextAction>
          {copyNote && (
            <span id={copyNoteId} className="sr-only">
              {copyNote}
            </span>
          )}
          {children && <span data-slot="secret-field-more" className="flex items-baseline gap-4">{children}</span>}
        </div>
      </div>
      {description && <p data-slot="secret-field-description" className="type-caption text-text-secondary -mt-2 pb-3">{description}</p>}
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  )
}

// ── fill only ────────────────────────────────────────────────────────────────────────────────────
function SecretFieldFillOnly({ label, description, id: idProp, className, size = "auto", remote, fillOnlyText }: SecretFieldFillOnlyProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const row = rowClasses(size)
  // Bound, but unavailable: a remote button for this field draws nothing.
  useRemoteBinding(
    remote,
    { label, revealMode: "toggle", revealed: false, busy: false, disabled: true, gated: false, available: false, copyPhase: "idle", copySecondsLeft: 0 },
    { reveal: {}, copy: () => {}, show: () => {} }
  )
  return (
    <div data-slot="secret-field" data-mode="read" data-fill-only="" data-state="masked" data-size={size} className={cn(row.root, className)}>
      <div data-slot="secret-field-control" className={row.inner}>
        <div className={row.body}>
          <span id={`${id}-label`} data-slot="secret-field-label" className={row.label}>
            {label}
          </span>
          <span id={id} data-slot="secret-field-value" role="textbox" aria-readonly="true" aria-labelledby={`${id}-label ${id}-words`} tabIndex={0} className="type-ui text-text-secondary min-w-0 flex-1">
            <span id={`${id}-words`}>{fillOnlyText ?? secretFieldFillOnlyText}</span>
          </span>
        </div>
      </div>
      {description && <p data-slot="secret-field-description" className="type-caption text-text-secondary -mt-2 pb-3">{description}</p>}
    </div>
  )
}

// ── edit mode ────────────────────────────────────────────────────────────────────────────────────
const STRENGTH: Record<SecretStrength, { word: string; segments: number; className: string }> = {
  weak: { word: "Weak", segments: 1, className: "bg-(--c-secret-field-meter-weak)" },
  fair: { word: "Fair", segments: 2, className: "bg-(--c-secret-field-meter-fair)" },
  strong: { word: "Strong", segments: 3, className: "bg-(--c-secret-field-meter-strong)" },
}

/**
 * zxcvbn's 0–4 guess score (the scale its ports share: the Rust `zxcvbn` crate, `@zxcvbn-ts/core`,
 * Swift and Kotlin ports) as the field's three words, so every host says the same word for the
 * same secret: 0–2 (under 10^8 guesses) weak, 3 (under 10^10) fair, 4 strong. A score outside
 * 0–4 reads as weak. The field never estimates: estimating needs the dictionaries, which belong
 * in the core.
 */
export function secretStrengthFromScore(score: number): SecretStrength {
  if (score >= 4) return "strong"
  if (score >= 3) return "fair"
  return "weak"
}

function SecretFieldEdit({
  label,
  value,
  onChange,
  strength,
  disabled = false,
  error,
  mono = true,
  description,
  children,
  id: idProp,
  className,
  multiline = false,
  rows = 4,
  name,
  required,
  onBlur,
  placeholder,
  stateText,
  actions,
  autoComplete,
  inputRef,
}: SecretFieldEditProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const meterId = `${id}-strength`
  const helperId = `${id}-helper`
  const [shown, setShown] = React.useState(false)
  const meter = strength && stateText === undefined ? STRENGTH[strength] : null
  const helper = error ?? description
  const describedBy = [meter ? meterId : null, helper ? helperId : null].filter(Boolean).join(" ") || undefined
  const shared = {
    id,
    name,
    value,
    required,
    placeholder,
    "aria-required": required || undefined,
    spellCheck: false,
    autoCorrect: "off",
    autoCapitalize: "off",
    disabled,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": describedBy,
    onBlur,
  } as const
  // A masked textarea copies like a password input: not at all.
  const blockWhileMasked = (e: React.SyntheticEvent) => {
    if (!shown) e.preventDefault()
  }
  const control = cn(
    "text-text-body placeholder:text-text-label min-w-0 flex-1 bg-transparent outline-none disabled:cursor-not-allowed",
    mono ? "type-code-inline" : "type-ui"
  )

  return (
    <div
      data-slot="secret-field"
      data-mode="edit"
      data-multiline={multiline ? "true" : undefined}
      data-state={stateText !== undefined ? "settled" : shown ? "revealed" : "masked"}
      data-invalid={error ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      className={cn("flex flex-col gap-1", className)}
    >
      {/* The Text Field look (Figma 32:48): an overline label, the box, a helper line. Text actions share the label's line. */}
      <div className="flex min-w-0 items-baseline gap-4">
        <label htmlFor={stateText === undefined ? id : undefined} id={`${id}-label`} className={cn("type-overline min-w-0 flex-1", error ? "text-critical-text" : "text-text-label")}>
          {label}
        </label>
        {actions && actions.length > 0 && (
          <span data-slot="secret-field-actions" className="flex shrink-0 items-baseline gap-4">
            {actions.map((a) => (
              <TextAction key={a.label} aria-label={a["aria-label"]} disabled={disabled || a.disabled} onClick={a.onClick}>
                {a.label}
              </TextAction>
            ))}
          </span>
        )}
      </div>
      <div
        data-slot="secret-field-control"
        className={cn(
          // The box: raised, a 1px hairline inside; 2px primary on focus, 2px critical on error (both inside, so the box never grows).
          "bg-surface-raised flex min-h-control gap-2 rounded px-4 py-3",
          multiline ? "items-start" : "items-center",
          error ? "rule-box-emphasis [--rule-color:var(--critical-fill)]" : "rule-box focus-within:rule-box-emphasis",
          disabled && "opacity-50"
        )}
      >
        {stateText !== undefined ? (
          <span data-slot="secret-field-value" aria-labelledby={`${id}-label`} className="type-ui text-text-label min-w-0 flex-1">
            {stateText}
          </span>
        ) : multiline ? (
          <textarea
            {...shared}
            ref={inputRef}
            data-slot="secret-field-value"
            rows={rows}
            // A textarea has no type="password": the stylesheet masks it (-webkit-text-security,
            // or transparent ink where an engine lacks that), and lifts the mask on Show.
            data-masked={shown ? undefined : ""}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete ?? "off"}
            onCopy={blockWhileMasked}
            onCut={blockWhileMasked}
            onDragStart={blockWhileMasked}
            className={cn(control, "field-sizing-content resize-none")}
          />
        ) : (
          <input
            {...shared}
            ref={inputRef}
            data-slot="secret-field-value"
            type={shown ? "text" : "password"}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete ?? "new-password"}
            className={control}
          />
        )}
        {stateText === undefined && (
          <TextAction
            data-slot="secret-field-reveal"
            aria-label={`${shown ? secretFieldWords.hide : secretFieldWords.show} ${label}`}
            aria-pressed={shown}
            disabled={disabled}
            onClick={() => setShown((s) => !s)}
          >
            {shown ? secretFieldWords.hide : secretFieldWords.show}
          </TextAction>
        )}
        {children && <span data-slot="secret-field-more" className="flex shrink-0 items-center gap-2">{children}</span>}
      </div>
      {meter && (
        // The strength rule: three cells and the core's word, always together (the word carries it).
        <div id={meterId} data-slot="secret-field-meter" data-strength={strength} className="flex items-center gap-3 pt-1">
          <span aria-hidden className="flex flex-1 gap-0.5">
            {[1, 2, 3].map((n) => (
              <span key={n} className={cn("h-1 flex-1", n <= meter.segments ? meter.className : "bg-line-rule")} />
            ))}
          </span>
          <span className="type-overline text-text-label">
            <span className="sr-only">Strength: </span>
            {meter.word}
          </span>
        </div>
      )}
      {helper &&
        (error ? (
          <p id={helperId} data-slot="secret-field-error" role="alert" className="type-caption text-critical-text">
            {error}
          </p>
        ) : (
          <p id={helperId} data-slot="secret-field-description" className="type-caption text-text-secondary">
            {description}
          </p>
        ))}
    </div>
  )
}
