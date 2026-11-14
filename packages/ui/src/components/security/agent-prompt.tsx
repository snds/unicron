// Owned component (not generated): an agent's question in the conversation (allow this, continue,
// or pick one), answered with a click, a tap or one key. A component rather than a Card recipe
// because it owns behaviour no parent has: Y/N and 1-9 keys that only the newest prompt hears, a
// layout rule that turns long options into numbered rows, a bottom sheet on a phone, one
// "Waiting for you" announcement, a countdown to the safe answer, and a typed reply.
// Promoted from: hand-raised from the Mercury review (none)
// Promoted from: Seeded in snds/unicron (2026-11 design direction: the needs-you look of Figma 15:517, the safe answer solid and focused (cross-app decisions §2); contract 5.1b #44; no app PR, no DSA record)
// Spec: docs/specs/security/agent-prompt.md
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { formatCountdown } from "../../lib/format"
import { Icon, type IconName } from "../icon"
import { useViewport } from "../use-viewport"
import { Button } from "../ui/button"
import { Kbd } from "../ui/kbd"
import { AdaptiveSheetContent, Sheet, SheetHeader, SheetTitle } from "../ui/sheet"
import { Spinner } from "../ui/spinner"
import { TextField } from "../ui/text-field"
import { readSecondsToken } from "./copy-countdown"
import { RiskTierBadge, type RiskTier } from "./risk-tier-badge"

/** `reply`: an open question, answered in words; its options (Deny, say) are the other ways out. */
export type AgentPromptKind = "permission" | "continue" | "choice" | "reply"

export interface AgentPromptOption {
  id: string
  /** A few words. Up to three short labels (24 characters or fewer) draw as buttons. */
  label: string
  /** A second line. Any option with one turns the set into numbered rows. */
  detail?: string
  /**
   * The answer that does no harm (Deny, Stop). It is the one solid button and takes focus when the
   * prompt arrives (cross-app decisions §2), and N answers it. `safeAnswer` marks it too.
   */
  safe?: boolean
  /**
   * The key that answers this option, by meaning, not by place: `"y"`, `"n"`, `"3"` (Warpcore: Y
   * allows once, N denies, 3 allows always). Without one, in a yes-or-no kind, N is the safe option
   * and Y the first other one; an option left with no key answers to its place, 1 to 9, unless
   * another option claims that digit.
   */
  key?: string
  /**
   * A standing grant: an answer that keeps applying after this prompt ("Always for Lockdown").
   * Its key answers only while focus is inside the prompt, so a stray key elsewhere on the page
   * can never grant it. A click or a tap always works. Mark every "always" answer with it.
   */
  standing?: boolean
}

/** The words the prompt owns, per kind. Hosts pass the kind and the options; the overline is optional. */
export const agentPromptCopy: Record<AgentPromptKind, { title: string; icon: IconName; options: AgentPromptOption[] }> = {
  // The safe answer first: it is the solid one (cross-app decisions §2). The keys keep their meaning.
  permission: {
    title: "Allow?",
    icon: "user--feedback",
    options: [
      { id: "deny", label: "Deny", safe: true, key: "n" },
      { id: "allow", label: "Allow once", key: "y" },
    ],
  },
  continue: {
    title: "Continue?",
    icon: "play",
    options: [
      { id: "stop", label: "Stop", safe: true, key: "n" },
      { id: "continue", label: "Continue", key: "y" },
    ],
  },
  choice: { title: "Choose", icon: "list--checked", options: [] },
  reply: { title: "Reply", icon: "chat", options: [] },
}

/** The answer id a typed reply arrives as: `onAnswer("reply", text)`, and `answer="reply"` once sent. */
export const AGENT_PROMPT_REPLY = "reply"

/** Words for the deadline, the reply field and sending. */
export const agentPromptStateCopy = {
  /** The timer's name: "Deny in 04:59". The visible text is only the time. */
  safeIn: (answer: string, time: string) => `${answer} in ${time}`,
  timedOut: "Timed out",
  replyLabel: "Your answer",
  send: "Send",
  sending: "Sending",
}

/**
 * The time left, as every countdown in the four apps writes it (cross-app decisions §13): `MM:SS`
 * with a leading zero ("28:14", "01:05"), then `NN S` under a minute ("45 S", "05 S").
 */
export function formatPromptCountdown(ms: number): string {
  return formatCountdown(ms / 1000)
}

export const agentPromptAnnouncements = { waiting: "Waiting for you" } as const
export const agentPromptAnswerLabel = "Answer"

/** Button row or numbered rows. */
export const AGENT_PROMPT_MAX_BUTTONS = 3
export const AGENT_PROMPT_MAX_BUTTON_LABEL = 24

export function agentPromptLayout(options: readonly AgentPromptOption[]): "buttons" | "rows" {
  return options.length <= AGENT_PROMPT_MAX_BUTTONS &&
    options.every((o) => !o.detail && o.label.length <= AGENT_PROMPT_MAX_BUTTON_LABEL)
    ? "buttons"
    : "rows"
}

/**
 * The key each option answers to, by meaning, not by place (contract 5.1c C15, Warpcore NA4). An
 * option's own `key` wins, a digit too ("3" allows always, wherever Always sits). In a yes-or-no
 * kind an option without one takes N if it is the safe one and Y if it is the first other one;
 * with no safe option at all, the first is Y and the second N, as before 1.0. Only an option left
 * with no key at all (a choice's numbered rows) answers to its place, 1 to 9, and never to a digit
 * another option claims. So one key never means two things, and moving an option never moves its
 * key.
 */
export function agentPromptKeys(options: readonly AgentPromptOption[], kind: AgentPromptKind, safeId?: string): (string | undefined)[] {
  const keys = options.map((o) => o.key?.toLowerCase())
  const yesNo = kind === "permission" || kind === "continue"
  const taken = new Set(keys.filter(Boolean))
  if (yesNo && safeId === undefined) {
    if (options[0] && !keys[0] && !taken.has("y")) keys[0] = "y"
    if (options[1] && !keys[1] && !taken.has("n")) keys[1] = "n"
  } else if (yesNo) {
    const safeAt = options.findIndex((o) => o.id === safeId)
    if (safeAt >= 0 && !keys[safeAt] && !taken.has("n")) keys[safeAt] = "n"
    const yesAt = options.findIndex((_, i) => i !== safeAt && !keys[i])
    if (yesAt >= 0 && !taken.has("y")) keys[yesAt] = "y"
  }
  const claimed = new Set(keys.filter(Boolean))
  return keys.map((k, i) => k ?? (i < 9 && !claimed.has(String(i + 1)) ? String(i + 1) : undefined))
}

// Only the newest prompt that's waiting hears keys, and only it opens its sheet on a phone.
const listening: symbol[] = []
const watchers = new Set<() => void>()
const changed = () => watchers.forEach((w) => w())
function subscribe(watch: () => void) {
  watchers.add(watch)
  return () => watchers.delete(watch)
}
const newest = () => listening[listening.length - 1]

/** Joins the listening prompts while `on`, in mount order; true while it's the newest. */
function useNewest(on: boolean) {
  const [me] = React.useState(() => Symbol("agent-prompt"))
  React.useEffect(() => {
    if (!on) return
    listening.push(me)
    changed()
    return () => {
      listening.splice(listening.indexOf(me), 1)
      changed()
    }
  }, [on, me])
  return React.useSyncExternalStore(subscribe, () => newest() === me, () => false)
}

/**
 * The key went to something that takes text: a native field, an editable region, or a part with a
 * text role (`role="textbox"` is how SecretField draws a value; a combobox and a search box type
 * too). A letter typed there is never an answer.
 */
function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el || !el.tagName) return false
  if (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)) return true
  return typeof el.closest === "function" && el.closest('[contenteditable=""], [contenteditable="true"], [role="textbox"], [role="combobox"], [role="searchbox"], [role="spinbutton"]') !== null
}

/** The inert window after a prompt starts listening, in ms, without the stylesheet. */
const ARM_DELAY_FALLBACK = 0.5

export interface AgentPromptProps extends Omit<React.ComponentProps<"section">, "children" | "title"> {
  kind: AgentPromptKind
  /** What the agent wants to do or know: "Run pnpm install in the sandbox". Six lines, then it scrolls. */
  children?: React.ReactNode
  /** Defaults to the kind's own (Deny / Allow once, Stop / Continue). A choice needs its own. */
  options?: readonly AgentPromptOption[]
  /**
   * The mono caps line that names the prompt ("Question", "Ask first // GitHub"). Type it in
   * sentence case. Default: the kind's title ("Allow?"). The countdown and `// +1` follow it.
   */
  overline?: React.ReactNode
  /** More questions wait after this one: `// +1` after the overline (cross-app decisions §2). */
  more?: number
  /** The trust tier of what's asking, from a signed manifest. */
  tier?: RiskTier
  /** The host's manifest check for `tier` (see RiskTierBadge). */
  verified?: boolean
  /** An option's id; for a reply, `AGENT_PROMPT_REPLY` and the words. */
  onAnswer: (id: string, text?: string) => void
  /** The answer once given: the prompt stays, marked and done, and stops listening. */
  answer?: string
  /** The answer is on its way: the chosen option spins, nothing else can be picked. */
  pending?: boolean
  /** Sending failed. Clear `answer` and `pending` so it can be answered again; this says why. */
  error?: React.ReactNode
  /** When it answers itself (epoch ms). Needs `safeAnswer`. */
  expiresAt?: number
  /** The option it takes when time runs out: the one that does no harm (Deny, Stop). It is marked safe. */
  safeAnswer?: string
  /** Time ran out. Default: `onAnswer(safeAnswer)`. A host whose server answers on its own passes a no-op. */
  onExpire?: () => void
  /**
   * False for an older prompt still on screen; only listening prompts take keys. Default true.
   * It is also the off switch for the single-key answers (WCAG 2.1.4): with `listen={false}` no
   * key answers, and every option is still a button.
   */
  listen?: boolean
  /**
   * Move focus to the safe answer (the reply field, for a reply) when the prompt arrives, but only
   * when nothing else has focus, so a person busy elsewhere is not pulled away. Default true.
   */
  autoFocus?: boolean
  /** The word on a reply's send button. Default "Send"; Warpcore says "Reply". */
  sendLabel?: string
  /**
   * Where the options go at compact width (a phone). `adaptive` (the default): in place on a wider
   * screen; on a phone an Answer button opens them in a bottom sheet. `inline`: in place at every
   * width, with no Answer button and no sheet (Warpcore's task screen, where the prompt is the first
   * thing under the title; contract 5.1c C15).
   */
  layout?: AgentPromptPlacement
}

/** See `AgentPromptProps.layout`. */
export type AgentPromptPlacement = "adaptive" | "inline"

/**
 * An agent's question, in the needs-you look (Figma "8. Needs You": the yellow field, 24 padding,
 * 16 gap, an overline in its ink). While it waits, it is the screen's one yellow shape. The overline
 * names it, with the countdown and `// +1` after it; the question is in the body role; then the
 * options. The safe answer (Deny, Stop) is the one solid button and takes focus on arrival; the
 * rest are text buttons (cross-app decisions §2). An open question keeps its send button solid.
 * Long or detailed options are numbered rows that wrap.
 *
 * Keys answer by meaning (`agentPromptKeys`): an option's own `key`, else Y the yes and N the safe
 * answer; only options with no key answer to their place, 1 to 9. They work when focus isn't in
 * something that takes text, and only the newest prompt listens. Three guards keep a stray key from
 * answering: the keys are inert for `--c-agent-prompt-arm-delay` (500ms) after a prompt starts
 * listening, as the approval frame is; a `standing` answer ("Always") takes its key only while
 * focus is inside the prompt; and `listen={false}` turns the keys off. Each option says its key
 * through `aria-keyshortcuts`. Once answered it turns quiet (the raised surface
 * with a hairline) and marks the answer. On a phone the options open in a bottom sheet, or stay in
 * place with `layout="inline"`.
 */
export function AgentPrompt({
  kind,
  children,
  options: optionsProp,
  overline,
  more,
  tier,
  verified,
  onAnswer,
  answer: answerProp,
  pending = false,
  error,
  expiresAt,
  safeAnswer,
  onExpire,
  listen = true,
  autoFocus = true,
  sendLabel = agentPromptStateCopy.send,
  layout = "adaptive",
  className,
  ...props
}: AgentPromptProps) {
  const copy = agentPromptCopy[kind]
  const options = optionsProp ?? copy.options
  // Out of time: it reads as answered with the safe option, whether or not the host has said so yet.
  const deadline = expiresAt !== undefined && safeAnswer !== undefined ? expiresAt : undefined
  const left = useTimeLeft(deadline, answerProp === undefined)
  const expired = left === 0
  const answer = answerProp ?? (expired ? safeAnswer : undefined)
  const waiting = answer === undefined
  const sending = pending && !waiting
  // Yellow while it waits on the person, and while their answer is on its way.
  const asking = waiting || sending
  const titleId = React.useId()
  const { widthClass } = useViewport()
  const compact = widthClass === "compact"
  // On a phone the options go in a sheet, unless the host keeps them in place.
  const inSheet = compact && layout !== "inline"
  const isNewest = useNewest(waiting && listen)
  // On a phone the newest prompt's sheet opens by itself; closing it leaves an Answer button.
  const [dismissed, setDismissed] = React.useState(false)
  const [reopened, setReopened] = React.useState(false)
  const sheetOpen = inSheet && waiting && (reopened || (isNewest && !dismissed))
  const setSheetOpen = (open: boolean) => {
    setReopened(open)
    if (!open) setDismissed(true)
  }

  const safeId = safeAnswer ?? options.find((o) => o.safe)?.id
  const keys = agentPromptKeys(options, kind, safeId)
  // The one solid option: the safe one; with none marked, the first. A reply's solid is its send.
  const solidId = kind === "reply" ? undefined : (safeId ?? options[0]?.id)

  const answerWith = React.useCallback(
    (id: string, text?: string) => {
      if (!waiting) return
      // A plain option answers with its id alone; only a reply carries words.
      if (text === undefined) onAnswer(id)
      else onAnswer(id, text)
    },
    [waiting, onAnswer]
  )

  // Time ran out: answer once with the safe option, unless the host takes it from here.
  const fired = React.useRef(false)
  const expire = React.useRef(() => {})
  React.useEffect(() => {
    expire.current = () => {
      if (onExpire) onExpire()
      else if (safeAnswer !== undefined) onAnswer(safeAnswer)
    }
  })
  React.useEffect(() => {
    if (!expired || answerProp !== undefined || fired.current) return
    fired.current = true
    expire.current()
  }, [expired, answerProp])

  // Keys: each option's key, by meaning (`agentPromptKeys`). The handler reads the latest options
  // through a ref, so a host re-rendering never re-orders the prompts.
  const latest = React.useRef({ options, keys, answerWith })
  React.useLayoutEffect(() => {
    latest.current = { options, keys, answerWith }
  })
  const rootRef = React.useRef<HTMLElement>(null)
  const scope = React.useId()
  React.useEffect(() => {
    if (!isNewest) return
    // Inert at first, each time this prompt starts listening: a key already on its way down when
    // the prompt arrives (or when the one after it is answered) answers nothing.
    const armedAt = Date.now() + readSecondsToken(rootRef.current, "--c-agent-prompt-arm-delay", ARM_DELAY_FALLBACK) * 1000
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat || isTyping(e.target)) return
      const { options, keys, answerWith } = latest.current
      const at = keys.indexOf(e.key.toLowerCase())
      const option = at >= 0 ? options[at] : undefined
      if (!option) return
      if (Date.now() < armedAt) return
      // A standing grant takes its key only from inside the prompt (its block, or its sheet).
      if (option.standing) {
        const active = document.activeElement
        const inside = active instanceof Element && active.closest("[data-agent-prompt-scope]")?.getAttribute("data-agent-prompt-scope") === scope
        if (!inside) return
      }
      e.preventDefault()
      answerWith(option.id)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isNewest, scope])

  // On arrival, focus goes to the safe answer (or the reply field), unless something else holds it.
  // On a phone only a safe answer in place takes it: the sheet takes its own, and a field there
  // would raise the keyboard by itself.
  const solidRef = React.useRef<HTMLButtonElement>(null)
  const replyRef = React.useRef<HTMLTextAreaElement>(null)
  React.useEffect(() => {
    if (!autoFocus || !isNewest || inSheet || (compact && kind === "reply")) return
    const active = document.activeElement
    if (active && active !== document.body) return
    ;(kind === "reply" ? replyRef.current : solidRef.current)?.focus()
  }, [autoFocus, isNewest, inSheet, compact, kind])

  // "Waiting for you", once: the live region is filled after it mounts, so it's heard.
  const [announce, setAnnounce] = React.useState("")
  React.useEffect(() => {
    if (waiting) setAnnounce(agentPromptAnnouncements.waiting)
  }, [waiting])

  const safeLabel = options.find((o) => o.id === safeAnswer)?.label
  const ink = asking ? "text-needs-you-on-fill" : "text-text-label"
  const timer =
    deadline !== undefined && safeLabel && (waiting || expired) ? (
      <span
        role="timer"
        data-slot="agent-prompt-timer"
        aria-label={expired ? agentPromptStateCopy.timedOut : agentPromptStateCopy.safeIn(safeLabel, formatPromptCountdown(left ?? 0))}
        className={cn("type-overline", ink)}
      >
        {"// "}
        {expired ? agentPromptStateCopy.timedOut : formatPromptCountdown(left ?? 0)}
      </span>
    ) : null
  const optionsFor = (onYellow: boolean, inline: boolean) =>
    options.length ? (
      <AgentPromptOptions
        options={options}
        keys={keys}
        solidId={solidId}
        solidRef={onYellow ? solidRef : undefined}
        answer={answer}
        sending={sending}
        onYellow={onYellow}
        inline={inline}
        onAnswer={answerWith}
      />
    ) : null
  // A reply's short ways out (Deny) sit in one row after its send button; long ones stay rows below.
  const replyInline = agentPromptLayout(options) === "buttons"
  const choices = (onYellow: boolean) => (
    <>
      {kind === "reply" ? (
        <AgentPromptReply
          ref={onYellow ? replyRef : undefined}
          answer={answer}
          sending={sending}
          onYellow={onYellow}
          sendLabel={sendLabel}
          onSend={(text) => answerWith(AGENT_PROMPT_REPLY, text)}
        >
          {replyInline ? optionsFor(onYellow, true) : null}
        </AgentPromptReply>
      ) : null}
      {kind !== "reply" || !replyInline ? optionsFor(onYellow, false) : null}
      {error && waiting ? (
        <p role="alert" data-slot="agent-prompt-error" className={cn("type-caption flex items-center gap-1.5", onYellow ? "text-needs-you-on-fill" : "text-critical-text")}>
          <Icon name="warning--alt" />
          {error}
        </p>
      ) : null}
    </>
  )

  return (
    <section
      ref={rootRef}
      data-slot="agent-prompt"
      data-agent-prompt-scope={scope}
      data-kind={kind}
      data-layout={inSheet ? "sheet" : "inline"}
      data-answered={waiting || sending ? undefined : ""}
      data-pending={sending ? "" : undefined}
      data-expired={expired ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "flex min-w-0 flex-col gap-4 p-6",
        asking ? "on-needs-you bg-needs-you-fill text-needs-you-on-fill" : "bg-surface-raised rule-box text-text-body rounded-lg",
        className
      )}
      {...props}
    >
      <header className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <h3 id={titleId} className={cn("type-overline", ink)}>
          {overline ?? copy.title}
        </h3>
        {timer}
        {more ? <span className={cn("type-overline", ink)}>{`// +${more}`}</span> : null}
        {tier ? (
          <span className="ml-auto flex items-center">
            {/* On the yellow the badge takes the yellow's ink: the page's ink is near-white on graphite (1.15:1 there). */}
            <RiskTierBadge tier={tier} verified={verified} surface={asking ? "needs-you" : "page"} />
          </span>
        ) : null}
      </header>
      {children ? (
        <div data-slot="agent-prompt-body" className="type-body max-h-[calc(var(--type-body-leading)*6)] min-w-0 overflow-y-auto break-words">
          {children}
        </div>
      ) : null}
      {inSheet && waiting ? (
        <>
          <Button variant="needs-you" className="self-start" onClick={() => setSheetOpen(true)}>
            {agentPromptAnswerLabel}
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <AdaptiveSheetContent data-slot="agent-prompt-sheet" data-agent-prompt-scope={scope}>
              <SheetHeader>
                <SheetTitle>{overline ?? copy.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-4">
                {children ? <div className="type-body break-words">{children}</div> : null}
                {choices(false)}
              </div>
            </AdaptiveSheetContent>
          </Sheet>
        </>
      ) : (
        choices(asking)
      )}
      <span role="status" className="sr-only">
        {waiting ? announce : ""}
      </span>
    </section>
  )
}

/** The time left until `deadline`, ticking once a second while `on`; undefined without one. */
function useTimeLeft(deadline: number | undefined, on: boolean) {
  const [now, setNow] = React.useState(() => Date.now())
  React.useEffect(() => {
    if (deadline === undefined || !on) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= deadline) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [deadline, on])
  return deadline === undefined ? undefined : Math.max(0, deadline - now)
}

/** The words of a reply: Enter sends, Shift+Enter is a new line. Once sent it keeps them, read-only. */
function AgentPromptReply({
  answer,
  sending,
  onYellow,
  sendLabel,
  onSend,
  ref,
  children,
}: {
  answer?: string
  sending: boolean
  onYellow: boolean
  sendLabel: string
  onSend: (text: string) => void
  ref?: React.Ref<HTMLTextAreaElement>
  /** The other ways out, in the send button's row. */
  children?: React.ReactNode
}) {
  const [text, setText] = React.useState("")
  const done = answer !== undefined
  const send = () => {
    const trimmed = text.trim()
    if (trimmed && !done) onSend(trimmed)
  }
  return (
    <div data-slot="agent-prompt-reply" className="flex flex-col gap-3">
      <TextField
        multiline
        minRows={2}
        ref={ref}
        aria-label={agentPromptStateCopy.replyLabel}
        placeholder={agentPromptStateCopy.replyLabel}
        value={text}
        readOnly={done}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            send()
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant={done && !sending ? (answer === AGENT_PROMPT_REPLY ? "secondary" : "ghost") : onYellow ? "needs-you" : "default"}
          disabled={done || !text.trim()}
          aria-pressed={done ? answer === AGENT_PROMPT_REPLY : undefined}
          onClick={send}
        >
          {sending && answer === AGENT_PROMPT_REPLY ? (
            <Spinner label={agentPromptStateCopy.sending} data-icon="inline-start" />
          ) : (
            <Icon name={answer === AGENT_PROMPT_REPLY ? "checkmark" : "send--alt"} data-icon="inline-start" />
          )}
          {sendLabel}
        </Button>
        {children}
      </div>
    </div>
  )
}

function AgentPromptOptions({
  options,
  keys,
  solidId,
  solidRef,
  answer,
  sending,
  onYellow,
  inline = false,
  onAnswer,
}: {
  options: readonly AgentPromptOption[]
  keys: readonly (string | undefined)[]
  solidId: string | undefined
  solidRef?: React.Ref<HTMLButtonElement>
  answer?: string
  sending: boolean
  onYellow: boolean
  /** Buttons that join a row the caller draws (a reply's send row). */
  inline?: boolean
  onAnswer: (id: string) => void
}) {
  const done = answer !== undefined
  // The chosen option, spinning while it's sent, checked once it's in.
  const mark = (id: string, check: React.ReactNode) =>
    answer !== id ? null : sending ? <Spinner label={agentPromptStateCopy.sending} data-icon="inline-start" /> : check
  // The key that answers each option, shown only with a fine pointer (a keyboard is likely).
  const keyFor = (i: number) => keys[i]?.toUpperCase()
  const hint = (i: number) => {
    const k = keyFor(i)
    return k && !done ? (
      <Kbd aria-hidden className={cn("hidden pointer-fine:inline-flex", onYellow && "bg-transparent text-inherit inset-ring inset-ring-current/40")}>
        {k}
      </Kbd>
    ) : null
  }
  // Waiting: the solid option is the yellow's ink (or the primary fill off the yellow, in a phone
  // sheet), the rest are text. Answered: quiet, the chosen one outlined.
  const variantFor = (id: string) => {
    if (done && !sending) return answer === id ? "secondary" : "ghost"
    if (onYellow) return id === solidId ? "needs-you" : "needs-you-text"
    return id === solidId ? "default" : "ghost"
  }

  if (agentPromptLayout(options) === "buttons") {
    return (
      <div data-slot="agent-prompt-options" data-layout="buttons" className={inline ? "contents" : "flex flex-wrap gap-3"}>
        {options.map((o, i) => (
          <Button
            key={o.id}
            ref={o.id === solidId ? solidRef : undefined}
            variant={variantFor(o.id)}
            data-safe={o.id === solidId ? "" : undefined}
            disabled={done}
            aria-pressed={done ? answer === o.id : undefined}
            aria-keyshortcuts={done ? undefined : keyFor(i)}
            onClick={() => onAnswer(o.id)}
          >
            {mark(o.id, <Icon name="checkmark" data-icon="inline-start" />)}
            {o.label}
            {hint(i)}
          </Button>
        ))}
      </div>
    )
  }
  // Rows: each option a full-width button with its number, its label and its detail, wrapping,
  // never cut. On the yellow an ink edge marks each one; the solid one is filled in that ink.
  return (
    <ol data-slot="agent-prompt-options" data-layout="rows" className="flex flex-col gap-2">
      {options.map((o, i) => {
        const solid = !done && o.id === solidId
        return (
          <li key={o.id}>
            <ButtonPrimitive
              ref={o.id === solidId ? solidRef : undefined}
              type="button"
              data-slot="agent-prompt-option"
              data-safe={o.id === solidId ? "" : undefined}
              data-selected={answer === o.id ? "true" : undefined}
              disabled={done}
              aria-pressed={done ? answer === o.id : undefined}
              aria-keyshortcuts={done ? undefined : keyFor(i)}
              onClick={() => onAnswer(o.id)}
              className={cn(
                "hit-area flex w-full min-w-0 cursor-pointer items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-(--motion-fast) ease-(--motion-ease) disabled:pointer-events-none disabled:opacity-50 aria-pressed:opacity-100",
                onYellow && !done
                  ? solid
                    ? "bg-needs-you-on-fill text-needs-you-fill hover:bg-needs-you-on-fill/90 active:bg-needs-you-on-fill/80"
                    : "inset-ring-needs-you-on-fill text-needs-you-on-fill inset-ring hover:bg-needs-you-on-fill/5 active:bg-needs-you-on-fill/9"
                  : solid
                    ? "bg-primary-fill text-primary-on-fill hover:bg-primary-fill/90 active:bg-primary-fill/80"
                    : "rule-box text-text-body hover:bg-state-hover active:bg-state-pressed data-selected:bg-primary-soft"
              )}
            >
              <span aria-hidden className="type-meta w-4 shrink-0 text-center text-inherit">
                {mark(o.id, <Icon name="checkmark" />) ?? i + 1}
              </span>
              <span className="flex min-w-0 flex-col whitespace-normal">
                <span data-slot="agent-prompt-option-title" className="type-ui-emphasis break-words">
                  {o.label}
                </span>
                {o.detail ? (
                  <span data-slot="agent-prompt-option-detail" className="type-caption break-words">
                    {o.detail}
                  </span>
                ) : null}
              </span>
            </ButtonPrimitive>
          </li>
        )
      })}
    </ol>
  )
}
