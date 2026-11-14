// Stand-ins for the shell demos (shell-vale, shell-warpcore, shell-lockdown, shell-synapse,
// settings-vale): the list rows, field rows and blocks that other areas build in parallel
// (ListRow, FieldRow, NeedsYou, Composer, ChatMessage are data-a, data-b and chat's). They are
// plain elements drawn close to the Figma frames so the frame can be judged around them; the
// integrator swaps each for the real part. Not a view: the file name starts with "_".
import type { ReactNode } from "react"
import { Progress } from "@unicron/ui"

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ")
}

/** A list of rows, each ruled on top, as List Row draws it. */
export function StandInRows({ label, children }: { label: string; children: ReactNode }) {
  return (
    <ul aria-label={label} className="flex flex-col">
      {children}
    </ul>
  )
}

/** Stand-in for ListRow layout="message" (Vale's inbox rows). */
export function StandInMessageRow({
  sender,
  time,
  subject,
  preview,
  unread = false,
  selected = false,
  onOpen,
}: {
  sender: string
  time: string
  subject: string
  preview: string
  unread?: boolean
  selected?: boolean
  onOpen?: () => void
}) {
  return (
    <li className="flex">
      <a
        href="#open"
        aria-current={selected ? "true" : undefined}
        onClick={(event) => {
          event.preventDefault()
          onOpen?.()
        }}
        className={cx("flex min-w-0 flex-1 flex-col gap-1 px-3 pt-4 pb-5 rule-t", selected && "bg-primary-soft edge-l")}
      >
        <span className="flex items-baseline justify-between gap-3">
          <span className="type-body-strong flex min-w-0 items-center gap-2 text-text-body">
            {unread ? <span aria-label="Unread" className="size-1.5 shrink-0 bg-text-body" /> : null}
            <span className="truncate">{sender}</span>
          </span>
          <span className="type-meta shrink-0 text-text-label">{time}</span>
        </span>
        <span className="type-ui truncate text-text-body">{subject}</span>
        <span className="type-caption line-clamp-2 text-text-label">{preview}</span>
      </a>
    </li>
  )
}

/** Stand-in for ListRow layout="inline" (Warpcore's tasks, Lockdown's items, Synapse's checks). */
export function StandInInlineRow({
  index,
  title,
  meta,
  status,
  statusTone = "label",
  progress,
  selected = false,
  onOpen,
}: {
  index?: string
  title: string
  meta: string
  status?: string
  statusTone?: "label" | "live"
  progress?: number
  selected?: boolean
  onOpen?: () => void
}) {
  return (
    <li className="flex">
      <a
        href="#open"
        aria-current={selected ? "true" : undefined}
        onClick={(event) => {
          event.preventDefault()
          onOpen?.()
        }}
        className={cx("flex min-w-0 flex-1 gap-4 px-4 py-6 rule-t", selected && "bg-primary-soft edge-l")}
      >
        {index ? <span className="type-folio w-12 shrink-0 text-text-label">{index}</span> : null}
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="type-subtitle truncate text-text-body">{title}</span>
          <span className="type-meta truncate text-text-label">{meta}</span>
          {progress !== undefined ? (
            <span className="mt-2 block max-w-90">
              <Progress variant="segmented" value={progress} segments={32} tone="live" aria-label={`${title}, ${progress}%`} />
            </span>
          ) : null}
        </span>
        {status ? <span className={cx("type-meta shrink-0", statusTone === "live" ? "text-secondary-live" : "text-text-label")}>{status}</span> : null}
      </a>
    </li>
  )
}

/** A titled block of plain text: a stand-in for a detail's body (a message, a note). */
export function StandInText({ children }: { children: ReactNode }) {
  return <div className="type-body flex flex-col gap-4 text-text-body">{children}</div>
}

/** Stand-in for FieldRow: a mono label, a value, an action word. */
export function StandInField({ label, value, action }: { label: string; value: string; action?: string }) {
  return (
    <div className="flex items-baseline gap-6 py-4 rule-t">
      <span className="type-label w-35 shrink-0 text-text-label">{label}</span>
      <span className="type-body min-w-0 flex-1 truncate text-text-body">{value}</span>
      {action ? <span className="type-overline shrink-0 text-text-body">{action}</span> : null}
    </div>
  )
}

/** Stand-in for SectionHeader: an overline with an inline rule. */
export function StandInSection({ title, count }: { title: string; count?: string }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-3">
      <span className="type-overline shrink-0 text-text-label">{count ? `${title} ${count}` : title}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-line-rule" />
    </div>
  )
}

/** Stand-in for NeedsYou: the yellow block, one solid action (a Button the view passes), a text action. */
export function StandInNeedsYou({ overline, body, actions }: { overline: string; body: string; actions: ReactNode }) {
  return (
    <div className="on-needs-you flex flex-col gap-4 bg-needs-you-fill p-6 text-needs-you-on-fill">
      <p className="type-overline text-needs-you-on-fill">{overline}</p>
      <p className="type-body">{body}</p>
      <div className="flex items-center gap-4">{actions}</div>
    </div>
  )
}

/** Stand-in for Composer: the raised field with its placeholder. */
export function StandInComposer({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-control min-w-0 flex-1 items-center bg-surface-raised px-4 rule-box">
      <span className="type-body truncate text-text-label">{placeholder}</span>
    </div>
  )
}

/** Stand-in for ChatMessage: the person's bubble on the right, the agent's text on the left. */
export function StandInMessage({ from, time, children, mine = false }: { from: string; time: string; children: ReactNode; mine?: boolean }) {
  return (
    <div className={cx("flex flex-col gap-1", mine && "items-end")}>
      <p className={cx("type-meta", mine ? "text-text-label" : "text-secondary-live")}>{`${from} // ${time}`}</p>
      <div className={cx("type-response text-text-body", mine && "max-w-75 bg-surface-raised px-4 py-3 rule-box")}>{children}</div>
    </div>
  )
}

/** Stand-in for FilterChipGroup: square chips in the overline role, the active one inverted ink. */
export function StandInChips({ label, chips, active }: { label: string; chips: string[]; active: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {chips.map((chip) => (
        <span
          key={chip}
          aria-current={chip === active ? "true" : undefined}
          className={cx("type-overline inline-flex h-6 items-center px-2", chip === active ? "bg-text-body text-surface-ground" : "text-text-label")}
        >
          {chip}
        </span>
      ))}
    </div>
  )
}

/** Stand-in for a search field: the raised box, a hairline, its placeholder. */
export function StandInSearch({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex h-control items-center bg-surface-raised px-4 rule-box">
      <span className="type-body text-text-body">{placeholder}</span>
    </div>
  )
}

/** Stand-in for SectionHeader variant="index": a big letter, `// count`, a rule under. */
export function StandInLetter({ letter, count }: { letter: string; count: string }) {
  return (
    <div className="flex items-baseline gap-3 px-0 pt-8 pb-2">
      <span className="type-title text-text-label">{letter}</span>
      <span className="type-meta text-text-label">{`// ${count}`}</span>
    </div>
  )
}
