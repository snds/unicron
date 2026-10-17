// Owned component (not generated): a secret full screen, grouped in threes, for reading across a room
// or typing into something without a keyboard. Spec: docs/specs/security/large-type-view.md.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { Button } from "../ui/button"
import { Kbd } from "../ui/kbd"
import { Label } from "../ui/label"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet"
import { Skeleton } from "../ui/skeleton"
import { Switch } from "../ui/switch"
import { readSecondsToken, useCopyCountdown, useHighContrast } from "./copy-countdown"
import { useCrownJewel } from "./crown-jewel"

export type LargeTypeCaptions = "auto" | "always" | "off"
export type LargeTypeCharClass = "digit" | "letter" | "symbol"

export interface LargeTypeViewProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** One-shot, as SecretField. The bytes are decoded, then zeroed. */
  getSecret: () => Promise<Uint8Array>
  /** What is being shown, never the value: "Wi-Fi password · Home". */
  title: string
  /** 4 for card numbers and kit codes already grouped by the format. */
  groupSize?: 3 | 4
  /** `auto` names only ambiguous glyphs and every symbol. */
  captions?: LargeTypeCaptions
  /** Adds "capital" and "lowercase" to letter captions. */
  caseSensitive?: boolean
  /** Position numbers under groups, for long values. */
  showIndex?: boolean
  /** Seconds before the view hides itself. Defaults to the `--c-large-type-lifetime` knob (120 s). */
  lifetime?: number
  /** Copy uses the clipboard timer. */
  allowCopy?: boolean
  /** The recovery-kit page: inline, captions on, no timer, no controls, title and date in the header. */
  print?: boolean
  /** Seconds until the host clears the clipboard. */
  clipboardTimer?: number
  /** The host's copy function gets the bytes; `navigator.clipboard` only in the pure web vault. */
  onCopy?: (value: Uint8Array) => void | Promise<void>
  onClipboardClear?: () => void
  /** Mobile: keep the screen awake while shown; `false` on close. */
  onKeepAwake?: (on: boolean) => void
  /** Mobile: raise brightness to maximum while shown; `false` on close. */
  onBrightness?: (max: boolean) => void
  /** Re-run before "Show again". Inside a CrownJewelSurface the surface's gate is used when this is omitted. */
  gate?: () => Promise<boolean>
  /** The value was hidden: lifetime, blur, or lock. */
  onExpire?: () => void
}

type Status = "loading" | "shown" | "expired" | "error"

const AMBIGUOUS = new Set(["0", "O", "o", "1", "l", "I", "5", "S", "8", "B", "2", "Z"])
const DIGIT_WORDS = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"]
const SYMBOLS: Record<string, string> = {
  "-": "dash",
  _: "underscore",
  ".": "dot",
  ",": "comma",
  "!": "exclamation mark",
  "?": "question mark",
  "@": "at sign",
  "#": "hash",
  $: "dollar sign",
  "%": "percent",
  "^": "caret",
  "&": "ampersand",
  "*": "asterisk",
  "(": "open parenthesis",
  ")": "close parenthesis",
  "+": "plus",
  "=": "equals",
  "/": "slash",
  "\\": "backslash",
  "|": "vertical bar",
  ":": "colon",
  ";": "semicolon",
  '"': "double quote",
  "'": "apostrophe",
  "`": "backtick",
  "~": "tilde",
  "<": "less than",
  ">": "greater than",
  "[": "open bracket",
  "]": "close bracket",
  "{": "open brace",
  "}": "close brace",
  " ": "space",
}
const DEFAULT_LIFETIME_S = 120
const DEFAULT_CLIPBOARD_S = 30
const SHOULDER_NOTICE_S = 3
const WARN_AT_S = 30
const SIZE_STEP = 1.15
const SIZE_STEPS = 4
const SIZE_KEY = "unicron:large-type:size-step"
const CHAR_EM = 0.62

export function classifyChar(ch: string): LargeTypeCharClass {
  if (/^[0-9]$/.test(ch)) return "digit"
  if (/^\p{L}$/u.test(ch)) return "letter"
  return "symbol"
}

/** The full name of a character: "zero", "capital O", "lowercase l", "dash". */
export function nameChar(ch: string, caseSensitive = true): string {
  const kind = classifyChar(ch)
  if (kind === "digit") return DIGIT_WORDS[Number(ch)] as string
  if (kind === "letter") {
    if (!caseSensitive) return `letter ${ch}`
    return ch === ch.toUpperCase() && ch !== ch.toLowerCase() ? `capital ${ch}` : `lowercase ${ch}`
  }
  return SYMBOLS[ch] ?? "symbol"
}

/** The caption under a glyph, or `null` for none. `auto` names ambiguous glyphs and every symbol. */
export function captionFor(ch: string, mode: LargeTypeCaptions, caseSensitive = true): string | null {
  if (mode === "off") return null
  if (mode === "always") return nameChar(ch, caseSensitive)
  const kind = classifyChar(ch)
  if (kind === "symbol" || AMBIGUOUS.has(ch)) return nameChar(ch, caseSensitive)
  return null
}

/** How one character is spoken in the canvas label: "capital T", "r", "4", "zero", "lowercase l", "dash". */
export function speakChar(ch: string, caseSensitive = true): string {
  const kind = classifyChar(ch)
  if (kind === "symbol" || AMBIGUOUS.has(ch)) return nameChar(ch, caseSensitive)
  if (kind === "letter" && caseSensitive && ch === ch.toUpperCase() && ch !== ch.toLowerCase()) return `capital ${ch}`
  return ch
}

export function groupValue(value: string, groupSize: number): string[][] {
  const chars = Array.from(value)
  const groups: string[][] = []
  for (let i = 0; i < chars.length; i += groupSize) groups.push(chars.slice(i, i + groupSize))
  return groups
}

/** "capital T, r, 4, pause, dash, 9, lowercase l" */
export function spellValue(value: string, groupSize: number, caseSensitive = true): string {
  return groupValue(value, groupSize)
    .map((g) => g.map((ch) => speakChar(ch, caseSensitive)).join(", "))
    .join(", pause, ")
}

function readPx(el: Element | null, name: string, fallbackPx: number): number {
  if (!el || typeof getComputedStyle !== "function") return fallbackPx
  try {
    const raw = getComputedStyle(el).getPropertyValue(name).trim()
    const m = /^(-?\d*\.?\d+)(rem|px|em)?$/.exec(raw)
    if (!m) return fallbackPx
    const n = Number(m[1])
    if (m[2] === "px") return n
    const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    return n * root
  } catch {
    return fallbackPx
  }
}

function readStoredStep(): number {
  try {
    const v = Number(window.localStorage.getItem(SIZE_KEY))
    return Number.isFinite(v) ? Math.max(-SIZE_STEPS, Math.min(SIZE_STEPS, v)) : 0
  } catch {
    return 0
  }
}

function formatClock(s: number): string {
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r < 10 ? "0" : ""}${r}`
}

// ── Canvas ────────────────────────────────────────────────────────────────────────────────────

interface CanvasProps {
  value: string
  groupSize: number
  captionsOn: boolean
  captionMode: LargeTypeCaptions
  caseSensitive: boolean
  showIndex: boolean
  fontSize?: number
  canvasRef?: React.Ref<HTMLDivElement>
}

function Canvas({ value, groupSize, captionsOn, captionMode, caseSensitive, showIndex, fontSize, canvasRef }: CanvasProps) {
  const groups = groupValue(value, groupSize)
  const mode: LargeTypeCaptions = captionsOn ? (captionMode === "off" ? "auto" : captionMode) : "off"
  return (
    <div
      ref={canvasRef}
      data-slot="large-type-view-canvas"
      role="img"
      aria-label={spellValue(value, groupSize, caseSensitive)}
      className="flex w-full flex-wrap content-start items-end gap-x-(--c-large-type-group-gap) gap-y-[0.5em] select-none"
      style={fontSize ? { fontSize } : undefined}
    >
      {groups.map((g, gi) => (
        <span
          key={gi}
          data-slot="large-type-view-group"
          className="inline-flex flex-col items-center contrast-more:border contrast-more:border-foreground contrast-more:px-[0.1em] forced-colors:border"
        >
          <span className="inline-flex items-start gap-x-(--c-large-type-char-gap)">
            {g.map((ch, ci) => {
              const kind = classifyChar(ch)
              const caption = captionFor(ch, mode, caseSensitive)
              return (
                <span key={ci} data-slot="large-type-view-char" data-class={kind} className="inline-flex flex-col items-center">
                  <span
                    aria-hidden
                    className={cn(
                      "font-mono leading-none [font-feature-settings:'zero']",
                      kind === "digit" && "text-(--c-large-type-digit-ink)",
                      kind === "letter" && "text-(--c-large-type-letter-ink)",
                      kind === "symbol" && "text-(--c-large-type-symbol-ink)",
                      "contrast-more:text-foreground"
                    )}
                  >
                    {ch === " " ? " " : ch}
                  </span>
                  {caption && (
                    <span
                      data-slot="large-type-view-caption"
                      aria-hidden
                      className="text-(--c-large-type-caption-ink) mt-[0.15em] text-center font-sans text-(length:--c-large-type-caption-size) leading-tight whitespace-nowrap"
                    >
                      {caption}
                    </span>
                  )}
                </span>
              )
            })}
          </span>
          {showIndex && (
            <span data-slot="large-type-view-index" aria-hidden className="text-muted-foreground mt-1 font-sans text-xs tabular-nums">
              {gi * groupSize + 1}–{gi * groupSize + g.length}
            </span>
          )}
        </span>
      ))}
    </div>
  )
}

function Legend() {
  const row = (cls: LargeTypeCharClass, word: string, ink: string) => (
    <span className="inline-flex items-center gap-1.5" data-class={cls}>
      <span aria-hidden className={cn("size-2.5 rounded-full contrast-more:bg-foreground", ink)} />
      {word}
    </span>
  )
  return (
    <div data-slot="large-type-view-legend" className="text-muted-foreground flex flex-wrap gap-4 text-xs">
      {row("digit", "digits", "bg-(--c-large-type-digit-ink)")}
      {row("letter", "letters", "bg-(--c-large-type-letter-ink)")}
      {row("symbol", "symbols", "bg-(--c-large-type-symbol-ink)")}
    </div>
  )
}

// ── Print page (D69 kit page) ─────────────────────────────────────────────────────────────────

function PrintPage({
  getSecret,
  title,
  groupSize,
  caseSensitive,
  showIndex,
}: Pick<LargeTypeViewProps, "getSecret" | "title" | "caseSensitive" | "showIndex"> & { groupSize: number }) {
  const [value, setValue] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<Status>("loading")
  React.useEffect(() => {
    let live = true
    getSecret()
      .then((bytes) => {
        const text = new TextDecoder().decode(bytes)
        bytes.fill(0)
        if (!live) return
        setValue(text)
        setStatus("shown")
      })
      .catch(() => live && setStatus("error"))
    return () => {
      live = false
      setValue(null)
    }
  }, [getSecret])
  const [date] = React.useState(() => new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }))
  return (
    <article
      data-slot="large-type-view"
      data-variant="print"
      className="bg-background text-foreground flex w-full flex-col gap-6 p-8 print:p-0"
      style={{ "--c-large-type-digit-ink": "var(--foreground)", "--c-large-type-symbol-ink": "var(--foreground)" } as React.CSSProperties}
    >
      <header data-slot="large-type-view-header" className="flex items-baseline justify-between gap-4 border-b pb-3">
        <h1 className="text-base font-medium">{title}</h1>
        <time className="text-muted-foreground text-xs">{date}</time>
      </header>
      {status === "loading" && <Skeleton className="h-16 w-full" />}
      {status === "error" && <p className="text-destructive text-sm">Couldn't read this value</p>}
      {status === "shown" && value !== null && (
        <Canvas
          value={value}
          groupSize={groupSize}
          captionsOn
          captionMode="always"
          caseSensitive={caseSensitive ?? true}
          showIndex={showIndex ?? false}
          fontSize={40}
        />
      )}
    </article>
  )
}

// ── The view ──────────────────────────────────────────────────────────────────────────────────

/**
 * A secret full screen in large monospace glyphs, grouped in threes, digits, letters and symbols
 * in different inks with ambiguous glyphs named underneath; it fits the width and hides itself
 * after a while. `print` is the same layout as the recovery-kit page.
 */
export function LargeTypeView({
  open = false,
  onOpenChange,
  getSecret,
  title,
  groupSize = 3,
  captions = "auto",
  caseSensitive = true,
  showIndex = false,
  lifetime: lifetimeProp,
  allowCopy = false,
  print = false,
  clipboardTimer = DEFAULT_CLIPBOARD_S,
  onCopy,
  onClipboardClear,
  onKeepAwake,
  onBrightness,
  gate,
  onExpire,
}: LargeTypeViewProps) {
  const crown = useCrownJewel()
  const highContrast = useHighContrast()
  const countdown = useCopyCountdown(clipboardTimer, onClipboardClear)
  const closeRef = React.useRef<HTMLButtonElement>(null)
  const popupRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  const [value, setValue] = React.useState<string | null>(null)
  const [status, setStatus] = React.useState<Status>("loading")
  const [secondsLeft, setSecondsLeft] = React.useState(0)
  const [captionsOn, setCaptionsOn] = React.useState(captions !== "off")
  const [sizeStep, setSizeStep] = React.useState(0)
  const [width, setWidth] = React.useState(0)
  const [shoulder, setShoulder] = React.useState(false)
  const [live, setLive] = React.useState<{ text: string; n: number }>({ text: "", n: 0 })
  const announce = React.useCallback((text: string) => setLive((s) => ({ text, n: s.n + 1 })), [])
  const spellTimers = React.useRef<ReturnType<typeof setTimeout>[]>([])

  const effectiveGate = gate ?? (crown.gated ? () => crown.requestProof("reveal") : undefined)

  const load = React.useCallback(async () => {
    setStatus("loading")
    try {
      const bytes = await getSecret()
      const text = new TextDecoder().decode(bytes)
      bytes.fill(0)
      setValue(text)
      setStatus("shown")
      const el = popupRef.current
      setSecondsLeft(Math.max(1, Math.round(lifetimeProp ?? readSecondsToken(el, "--c-large-type-lifetime", DEFAULT_LIFETIME_S))))
    } catch {
      setValue(null)
      setStatus("error")
    }
  }, [getSecret, lifetimeProp])

  const hide = React.useCallback(() => {
    setValue(null)
    setStatus((s) => (s === "shown" || s === "loading" ? "expired" : s))
    setSecondsLeft(0)
    announce("Hidden.")
    onExpire?.()
  }, [announce, onExpire])

  // Open: load, hooks on, shoulder notice, size from this device.
  React.useEffect(() => {
    if (!open || print) return
    void load()
    onKeepAwake?.(true)
    onBrightness?.(true)
    setSizeStep(readStoredStep())
    setShoulder(true)
    const t = setTimeout(() => setShoulder(false), SHOULDER_NOTICE_S * 1000)
    return () => {
      clearTimeout(t)
      setValue(null)
      setStatus("loading")
      setSecondsLeft(0)
      onKeepAwake?.(false)
      onBrightness?.(false)
      for (const s of spellTimers.current) clearTimeout(s)
      spellTimers.current = []
    }
    // The hooks are host callbacks; re-running on identity change would flash brightness.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, print, load])

  // Lifetime.
  React.useEffect(() => {
    if (!open || status !== "shown") return
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        const next = s - 1
        if (next === WARN_AT_S) announce("Hides in 30 seconds")
        if (next <= 0) {
          clearInterval(id)
          hide()
          return 0
        }
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [open, status, announce, hide])

  // Window blur and hidden tab hide the value within a frame.
  React.useEffect(() => {
    if (!open || status !== "shown") return
    const onBlur = () => hide()
    const onVisibility = () => {
      if (document.visibilityState === "hidden") hide()
    }
    window.addEventListener("blur", onBlur)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("blur", onBlur)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [open, status, hide])

  // Fit to width.
  React.useEffect(() => {
    const el = canvasRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(e.contentRect.width)
    })
    ro.observe(el)
    setWidth(el.getBoundingClientRect().width)
    return () => ro.disconnect()
  }, [status])

  const fontSize = React.useMemo(() => {
    const el = popupRef.current
    const min = readPx(el, "--c-large-type-min-size", 40)
    const max = readPx(el, "--c-large-type-max-size", 96)
    const n = value?.length ?? 0
    const g = Math.max(1, Math.ceil(n / groupSize))
    const em = n * CHAR_EM + Math.max(0, n - g) * 0.1 + Math.max(0, g - 1) * 1.5
    const fit = width > 0 && em > 0 ? width / em : max
    const stepped = fit * Math.pow(SIZE_STEP, sizeStep)
    return Math.round(Math.max(min, Math.min(max, stepped)))
  }, [value, width, groupSize, sizeStep])

  const resize = (delta: number) => {
    setSizeStep((s) => {
      const next = Math.max(-SIZE_STEPS, Math.min(SIZE_STEPS, s + delta))
      try {
        window.localStorage.setItem(SIZE_KEY, String(next))
      } catch {
        // Per-device convenience only.
      }
      return next
    })
  }

  const copy = async () => {
    if (!allowCopy || value === null) return
    if (crown.gated && !(await crown.requestProof("use"))) return
    await onCopy?.(new TextEncoder().encode(value))
    countdown.start()
    announce(`Copied. Clipboard clears in ${clipboardTimer} seconds.`)
  }

  const spellOut = () => {
    if (value === null) return
    for (const s of spellTimers.current) clearTimeout(s)
    spellTimers.current = groupValue(value, groupSize).map((g, i) =>
      setTimeout(() => announce(g.map((ch) => speakChar(ch, caseSensitive)).join(", ")), i * 1500)
    )
  }

  const showAgain = async () => {
    if (effectiveGate && !(await effectiveGate())) return
    void load()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLElement && /^(input|textarea)$/i.test(e.target.tagName)) return
    if (e.key === "+" || e.key === "=") {
      e.preventDefault()
      resize(1)
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault()
      resize(-1)
    } else if ((e.key === "c" || e.key === "C") && !e.altKey) {
      if (!allowCopy) return
      e.preventDefault()
      void copy()
    }
  }

  if (print) {
    return <PrintPage getSecret={getSecret} title={title} groupSize={groupSize} caseSensitive={caseSensitive} showIndex={showIndex} />
  }

  const captionsShown = captionsOn || highContrast

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={popupRef}
        side="bottom"
        fullscreen
        showCloseButton={false}
        initialFocus={closeRef}
        data-slot="large-type-view"
        data-status={status}
        onKeyDown={onKeyDown}
        className="bg-background text-foreground"
      >
        <SheetHeader data-slot="large-type-view-header" className="flex-row items-center justify-between gap-3 border-b">
          <div className="flex min-w-0 flex-col gap-0.5">
            <SheetTitle className="truncate">{title}</SheetTitle>
            <SheetDescription>
              {shoulder ? "Anyone who can see your screen can read this." : "Shown in large type. Press Escape to hide it."}
            </SheetDescription>
          </div>
          <SheetClose render={<Button ref={closeRef} variant="ghost" size="icon" aria-label="Close" />}>
            <Icon name="close" />
          </SheetClose>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
          {status === "loading" && (
            <div data-slot="large-type-view-canvas" aria-busy className="flex flex-wrap gap-(--c-large-type-group-gap)">
              <Skeleton className="h-16 w-40" />
              <Skeleton className="h-16 w-40" />
              <Skeleton className="h-16 w-40" />
            </div>
          )}
          {status === "error" && (
            <div data-slot="large-type-view-canvas" className="text-destructive text-sm">
              Couldn't read this value
            </div>
          )}
          {status === "expired" && (
            <div data-slot="large-type-view-canvas" className="flex flex-col items-start gap-3 text-sm">
              <span className="text-muted-foreground">Hidden.</span>
              <Button variant="outline" onClick={showAgain}>
                Show again
              </Button>
            </div>
          )}
          {status === "shown" && value !== null && (
            <Canvas
              canvasRef={canvasRef}
              value={value}
              groupSize={groupSize}
              captionsOn={captionsShown}
              captionMode={captions}
              caseSensitive={caseSensitive}
              showIndex={showIndex}
              fontSize={fontSize}
            />
          )}
          {status === "shown" && <Legend />}
        </div>

        <div data-slot="large-type-view-controls" className="flex flex-wrap items-center gap-3 border-t p-4">
          <IconButton label="Smaller" shortcut="-" icon="remove" variant="outline" disabled={sizeStep <= -SIZE_STEPS} onClick={() => resize(-1)} />
          <IconButton label="Larger" shortcut="+" icon="add" variant="outline" disabled={sizeStep >= SIZE_STEPS} onClick={() => resize(1)} />
          <Label className="flex items-center gap-2 text-sm">
            <Switch checked={captionsShown} disabled={highContrast} onCheckedChange={(v) => setCaptionsOn(v)} />
            Captions
          </Label>
          <Button variant="outline" size="sm" disabled={status !== "shown"} onClick={spellOut}>
            <Icon name="record_voice_over" data-icon="inline-start" />
            Spell out
          </Button>
          {allowCopy && (
            <IconButton
              data-slot="large-type-view-copy"
              label="Copy"
              shortcut="C"
              tooltip={
                countdown.state === "counting"
                  ? `Copied · clears in ${countdown.secondsLeft} s`
                  : countdown.state === "cleared"
                    ? "Cleared"
                    : "Copy"
              }
              variant="outline"
              disabled={status !== "shown"}
              onClick={() => void copy()}
            >
              {countdown.state === "counting" ? (
                <span className="text-xs tabular-nums">{countdown.secondsLeft}</span>
              ) : countdown.state === "cleared" ? (
                <Icon name="check" />
              ) : (
                <>
                  <Icon name="content_copy" />
                  {crown.gated && <Icon name="lock" className="size-3" />}
                </>
              )}
            </IconButton>
          )}
          <span data-slot="large-type-view-timer" className="text-muted-foreground ml-auto text-sm tabular-nums">
            {status === "shown" ? `Hides in ${formatClock(secondsLeft)}` : status === "expired" ? "Hidden" : ""}
          </span>
          <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:inline-flex">
            <Kbd>Esc</Kbd> hides
          </span>
        </div>
        <span aria-live="polite" className="sr-only" data-slot="large-type-view-live">
          <span key={live.n}>{live.text}</span>
        </span>
      </SheetContent>
    </Sheet>
  )
}
