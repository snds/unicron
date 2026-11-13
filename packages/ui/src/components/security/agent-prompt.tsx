// Owned component (not generated): an agent's question in the conversation (allow this, continue,
// or pick one), answered with a click, a tap or one key. A component rather than a Card recipe
// because it owns behaviour no parent has: Y/N and 1-9 keys that only the newest prompt hears, a
// layout rule that turns long options into numbered rows, a bottom sheet on a phone, one
// "Waiting for you" announcement, a countdown to the safe answer, and a typed reply.
// Promoted from: hand-raised from the Mercury review (none)
// Spec: docs/specs/security/agent-prompt.md
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { useViewport } from "../use-viewport"
import { Button } from "../ui/button"
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "../ui/item"
import { Kbd } from "../ui/kbd"
import { AdaptiveSheetContent, Sheet, SheetHeader, SheetTitle } from "../ui/sheet"
import { Spinner } from "../ui/spinner"
import { Textarea } from "../ui/textarea"
import { RiskTierBadge, type RiskTier } from "./risk-tier-badge"

/** `reply`: an open question, answered in words; its options (Deny, say) are the other ways out. */
export type AgentPromptKind = "permission" | "continue" | "choice" | "reply"

export interface AgentPromptOption {
  id: string
  /** A few words. Up to three short labels (24 characters or fewer) draw as buttons. */
  label: string
  /** A second line. Any option with one turns the set into numbered rows. */
  detail?: string
}

/** The words the prompt owns, per kind. Hosts pass the kind and the options, never the title. */
export const agentPromptCopy: Record<AgentPromptKind, { title: string; icon: IconName; options: AgentPromptOption[] }> = {
  permission: {
    title: "Allow?",
    icon: "stop-sign",
    options: [
      { id: "allow", label: "Allow" },
      { id: "deny", label: "Deny" },
    ],
  },
  continue: {
    title: "Continue?",
    icon: "play",
    options: [
      { id: "continue", label: "Continue" },
      { id: "stop", label: "Stop" },
    ],
  },
  choice: { title: "Choose", icon: "list--checked", options: [] },
  reply: { title: "Reply", icon: "chat", options: [] },
}

/** The answer id a typed reply arrives as: `onAnswer("reply", text)`, and `answer="reply"` once sent. */
export const AGENT_PROMPT_REPLY = "reply"

/** Words for the deadline, the reply field and sending. */
export const agentPromptStateCopy = {
  /** The timer's name: "Deny in 4:59". The visible text is only the time. */
  safeIn: (answer: string, time: string) => `${answer} in ${time}`,
  timedOut: "Timed out",
  replyLabel: "Your answer",
  send: "Send",
  sending: "Sending",
}

/** "29:59", "0:05". */
export function formatPromptCountdown(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
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

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el || !el.tagName) return false
  return el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
}

export interface AgentPromptProps extends Omit<React.ComponentProps<"section">, "children" | "title"> {
  kind: AgentPromptKind
  /** What the agent wants to do or know, in a line or two: "Run pnpm install in the sandbox". */
  children?: React.ReactNode
  /** Defaults to the kind's own (Allow / Deny, Continue / Stop). A choice needs its own. */
  options?: readonly AgentPromptOption[]
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
  /** The option it takes when time runs out: the one that does no harm (Deny, Stop). */
  safeAnswer?: string
  /** Time ran out. Default: `onAnswer(safeAnswer)`. A host whose server answers on its own passes a no-op. */
  onExpire?: () => void
  /** False for an older prompt still on screen; only listening prompts take keys. Default true. */
  listen?: boolean
}

/**
 * An agent's question, in the conversation. It has an attention edge, the kind's title, what's
 * asked, an optional risk tier, and the options. Two or three short options are buttons, the first
 * primary; anything else is numbered rows that wrap. Y/N (permission, continue) and 1-9 answer it
 * when focus isn't in a text field, and only the newest prompt listens. On a phone the options open
 * in a bottom sheet.
 */
export function AgentPrompt({
  kind,
  children,
  options: optionsProp,
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
  const titleId = React.useId()
  const { widthClass } = useViewport()
  const compact = widthClass === "compact"
  const isNewest = useNewest(waiting && listen)
  // On a phone the newest prompt's sheet opens by itself; closing it leaves an Answer button.
  const [dismissed, setDismissed] = React.useState(false)
  const [reopened, setReopened] = React.useState(false)
  const sheetOpen = waiting && (reopened || (isNewest && !dismissed))
  const setSheetOpen = (open: boolean) => {
    setReopened(open)
    if (!open) setDismissed(true)
  }

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

  // Keys: Y and N for the first two options of a yes-or-no kind, 1-9 for any option. The handler
  // reads the latest options through a ref, so a host re-rendering never re-orders the prompts.
  const latest = React.useRef({ kind, options, answerWith })
  latest.current = { kind, options, answerWith }
  React.useEffect(() => {
    if (!isNewest) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return
      const { kind, options, answerWith } = latest.current
      const key = e.key.toLowerCase()
      let option: AgentPromptOption | undefined
      const yesNo = kind === "permission" || kind === "continue"
      if (yesNo && key === "y") option = options[0]
      else if (yesNo && key === "n") option = options[1]
      else if (/^[1-9]$/.test(key)) option = options[Number(key) - 1]
      if (!option) return
      e.preventDefault()
      answerWith(option.id)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [isNewest])

  // "Waiting for you", once: the live region is filled after it mounts, so it's heard.
  const [announce, setAnnounce] = React.useState("")
  React.useEffect(() => {
    if (waiting) setAnnounce(agentPromptAnnouncements.waiting)
  }, [waiting])

  const yesNo = kind === "permission" || kind === "continue"
  const safeLabel = options.find((o) => o.id === safeAnswer)?.label
  const timer =
    deadline !== undefined && safeLabel && (waiting || expired) ? (
      <span
        role="timer"
        data-slot="agent-prompt-timer"
        aria-label={expired ? agentPromptStateCopy.timedOut : agentPromptStateCopy.safeIn(safeLabel, formatPromptCountdown(left ?? 0))}
        className="type-meta flex items-center gap-1 tabular-nums"
      >
        <Icon name="time" />
        {expired ? agentPromptStateCopy.timedOut : formatPromptCountdown(left ?? 0)}
      </span>
    ) : null
  const choices = (
    <>
      {kind === "reply" ? <AgentPromptReply answer={answer} sending={sending} onSend={(text) => answerWith(AGENT_PROMPT_REPLY, text)} /> : null}
      {options.length ? <AgentPromptOptions options={options} yesNo={yesNo} answer={answer} sending={sending} onAnswer={answerWith} /> : null}
      {error && waiting ? (
        <p role="alert" data-slot="agent-prompt-error" className="type-support text-destructive flex items-center gap-1.5">
          <Icon name="warning" />
          {error}
        </p>
      ) : null}
    </>
  )

  return (
    <section
      data-slot="agent-prompt"
      data-kind={kind}
      data-answered={waiting || sending ? undefined : ""}
      data-pending={sending ? "" : undefined}
      data-expired={expired ? "" : undefined}
      aria-labelledby={titleId}
      className={cn(
        "bg-card text-card-foreground ring-foreground/10 flex min-w-0 flex-col gap-3 rounded-xl border-l-(length:--c-agent-prompt-edge) border-(--c-agent-prompt-edge-color) p-3 ring-1",
        !waiting && !sending && "border-(--c-agent-prompt-edge-answered)",
        className
      )}
      {...props}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Icon name={copy.icon} className={cn(waiting || sending ? "text-attention-foreground" : "text-muted-foreground")} />
        <h3 id={titleId} className="type-group-title">
          {copy.title}
        </h3>
        {tier || timer ? (
          <span className="ml-auto flex items-center gap-2">
            {timer}
            {tier ? <RiskTierBadge tier={tier} verified={verified} /> : null}
          </span>
        ) : null}
      </header>
      {children ? <div className="type-body min-w-0 break-words">{children}</div> : null}
      {compact && waiting ? (
        <>
          <Button size="sm" className="self-start" onClick={() => setSheetOpen(true)}>
            {agentPromptAnswerLabel}
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <AdaptiveSheetContent data-slot="agent-prompt-sheet">
              <SheetHeader>
                <SheetTitle>{copy.title}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-4 pb-4">
                {children ? <div className="type-body break-words">{children}</div> : null}
                {choices}
              </div>
            </AdaptiveSheetContent>
          </Sheet>
        </>
      ) : (
        choices
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
function AgentPromptReply({ answer, sending, onSend }: { answer?: string; sending: boolean; onSend: (text: string) => void }) {
  const [text, setText] = React.useState("")
  const done = answer !== undefined
  const send = () => {
    const trimmed = text.trim()
    if (trimmed && !done) onSend(trimmed)
  }
  return (
    <div data-slot="agent-prompt-reply" className="flex items-end gap-2">
      <Textarea
        aria-label={agentPromptStateCopy.replyLabel}
        placeholder={agentPromptStateCopy.replyLabel}
        rows={2}
        value={text}
        readOnly={done}
        className="min-w-0 flex-1"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault()
            send()
          }
        }}
      />
      <Button size="sm" disabled={done || !text.trim()} aria-pressed={done ? answer === AGENT_PROMPT_REPLY : undefined} onClick={send}>
        {sending && answer === AGENT_PROMPT_REPLY ? (
          <Spinner label={agentPromptStateCopy.sending} data-icon="inline-start" />
        ) : (
          <Icon name={answer === AGENT_PROMPT_REPLY ? "checkmark" : "send--alt"} data-icon="inline-start" />
        )}
        {agentPromptStateCopy.send}
      </Button>
    </div>
  )
}

function AgentPromptOptions({
  options,
  yesNo,
  answer,
  sending,
  onAnswer,
}: {
  options: readonly AgentPromptOption[]
  yesNo: boolean
  answer?: string
  sending: boolean
  onAnswer: (id: string) => void
}) {
  const done = answer !== undefined
  // The chosen option, spinning while it's sent, checked once it's in.
  const mark = (id: string, check: React.ReactNode) =>
    answer !== id ? null : sending ? <Spinner label={agentPromptStateCopy.sending} data-icon="inline-start" /> : check
  // The key that answers each option, shown only with a fine pointer (a keyboard is likely).
  const keyFor = (i: number) => (yesNo && i === 0 ? "Y" : yesNo && i === 1 ? "N" : String(i + 1))
  const hint = (i: number) =>
    i < 9 && !done ? (
      <Kbd aria-hidden className="hidden pointer-fine:inline-flex">
        {keyFor(i)}
      </Kbd>
    ) : null

  if (agentPromptLayout(options) === "buttons") {
    return (
      <div data-slot="agent-prompt-options" data-layout="buttons" className="flex flex-wrap gap-2">
        {options.map((o, i) => (
          <Button
            key={o.id}
            size="sm"
            variant={i === 0 ? "default" : "outline"}
            disabled={done}
            aria-pressed={done ? answer === o.id : undefined}
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
  return (
    <ol data-slot="agent-prompt-options" data-layout="rows" className="flex flex-col gap-1.5">
      {options.map((o, i) => (
        <li key={o.id}>
          <Item
            render={<button type="button" disabled={done} aria-pressed={done ? answer === o.id : undefined} />}
            variant="outline"
            size="sm"
            data-selected={answer === o.id ? "true" : undefined}
            onClick={() => onAnswer(o.id)}
          >
            <ItemMedia>
              <span aria-hidden className="type-meta w-4 text-center">
                {mark(o.id, <Icon name="checkmark" />) ?? i + 1}
              </span>
            </ItemMedia>
            <ItemContent>
              <ItemTitle className="line-clamp-none">{o.label}</ItemTitle>
              {o.detail ? <ItemDescription className="line-clamp-none">{o.detail}</ItemDescription> : null}
            </ItemContent>
          </Item>
        </li>
      ))}
    </ol>
  )
}
