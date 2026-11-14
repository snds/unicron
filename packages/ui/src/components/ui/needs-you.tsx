// Owned component (not generated): the one yellow block per screen, for the thing that waits on the person.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:517; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"

/** The words in a node, as a screen reader gets them: what is under `aria-hidden` is left out. */
function wordsOf(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(wordsOf).join("")
  if (React.isValidElement<{ children?: React.ReactNode; "aria-hidden"?: unknown }>(node)) {
    const hidden = node.props["aria-hidden"]
    return hidden === true || hidden === "true" ? "" : wordsOf(node.props.children)
  }
  return ""
}

// ── one yellow shape: a compact line on a layer hides the block behind its scrim ──────────────────

/**
 * Which NeedsYou parts are on screen, per scope: while any compact line shows, every full block in
 * the same scope hides (contract 5.1c C19, Lockdown LA8: one yellow shape for one thing). A store,
 * so the line in a layer and the block on the page find each other wherever React puts them.
 */
interface NeedsYouScope {
  subscribe: (onChange: () => void) => () => void
  /** True while a compact line shows. */
  compactShowing: () => boolean
  /** A compact line arrived; call what it returns when it leaves. */
  addCompact: () => () => void
}

function createNeedsYouScope(): NeedsYouScope {
  let compact = 0
  const listeners = new Set<() => void>()
  const changed = () => listeners.forEach((l) => l())
  return {
    subscribe(onChange) {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    compactShowing: () => compact > 0,
    addCompact() {
      compact++
      changed()
      let gone = false
      return () => {
        if (gone) return
        gone = true
        compact--
        changed()
      }
    },
  }
}

/** The document's scope, when no NeedsYouProvider sets one. */
const documentScope = createNeedsYouScope()
const NeedsYouScopeContext = React.createContext<NeedsYouScope>(documentScope)

/**
 * A scope of its own for the NeedsYou parts inside it: a compact line hides only the blocks of its
 * scope. Without one, the whole document is one scope, which is what an app wants. A host that
 * draws several separate screens on one page (a gallery, a test) gives each its own.
 */
function NeedsYouProvider({ children }: { children: React.ReactNode }) {
  const [scope] = React.useState(createNeedsYouScope)
  return <NeedsYouScopeContext.Provider value={scope}>{children}</NeedsYouScopeContext.Provider>
}

/** True while a compact NeedsYou line shows in this scope, so the full block hides. */
function useNeedsYouCompactShowing(): boolean {
  const scope = React.useContext(NeedsYouScopeContext)
  return React.useSyncExternalStore(scope.subscribe, scope.compactShowing, () => false)
}

export type NeedsYouSize = "default" | "compact"

export type NeedsYouProps = Omit<React.ComponentProps<"section">, "title"> & {
  /**
   * `default`: the block (Figma 15:517). `compact`: one 48px line, the title and one solid action,
   * for the top of an open dialog or sheet (`notice` on DialogContent, SheetContent,
   * AdaptiveDialog), when something with a time limit arrives under a layer (Lockdown LA8). While
   * a compact line shows, the full block on the page behind the scrim hides, so one yellow shape
   * shows. A compact line takes no body, no text actions and no children.
   */
  size?: NeedsYouSize
  /** What waits, in mono caps, with `//` between its parts ("Awaiting your review // SEA-51"). */
  title: React.ReactNode
  /**
   * How many more things wait besides this one. The title ends `// +1`; the others are ordinary
   * rows under a "Waiting on you" header (decisions §2). Read as "1 more waiting".
   */
  more?: number
  /** One sentence on what it is, in body/strong ("Claude Code changed 6 files."). */
  body?: React.ReactNode
  /** The one solid action: a `Button variant="needs-you"` (size `sm` in the compact line). */
  action?: React.ReactNode
  /** The second action, text only: a `Button variant="needs-you-text"`. */
  secondaryAction?: React.ReactNode
  /**
   * Up to two text actions (`needs-you-text`), for a block that offers two ways out ("See both",
   * "Pause task"). Use this or `secondaryAction`, not both.
   */
  secondaryActions?: readonly [React.ReactNode, React.ReactNode?]
  /**
   * Say the block to assistive tech when it appears and when its words change, politely, without
   * moving focus. Default true. Turn it off where the block is already on screen when the page
   * opens and saying it again would be noise.
   */
  announce?: boolean
}

/**
 * NeedsYou: the yellow block. Same yellow in every app and both grounds, no corner, 24px in from
 * every side. One solid action, and one or two text actions; no dismiss, and it cannot be swiped
 * away. At most one per screen, with no other solid primary within 96px of it.
 *
 * It is a region named by its title and described by its body, so it can be reached from the
 * landmarks list. `data-slot="needs-you"` turns every focus ring inside it to the yellow's ink.
 */
function NeedsYou({ size = "default", ...props }: NeedsYouProps) {
  return size === "compact" ? <NeedsYouCompact {...props} /> : <NeedsYouBlock {...props} />
}

/** The yellow block. It hides (and leaves its space) while a compact line shows in its scope. */
function NeedsYouBlock({
  title,
  more,
  body,
  action,
  secondaryAction,
  secondaryActions,
  announce = true,
  className,
  children,
  ...props
}: Omit<NeedsYouProps, "size">) {
  const covered = useNeedsYouCompactShowing()
  const uid = React.useId()
  const titleId = `${uid}-title`
  const bodyId = body ? `${uid}-body` : undefined
  // The type holds the list to two; nothing given is dropped.
  const textActions = [secondaryAction, ...(secondaryActions ?? [])].filter(Boolean)

  // The live region starts empty and its words are written once the block is on screen (and
  // again when they change), so a screen reader hears a change: a region that arrives already
  // full is not reliably read. Written through the DOM, the one place the words go.
  const words = [wordsOf(title), more ? `, ${more} more waiting` : "", body ? `. ${wordsOf(body)}` : ""].join("")
  const announcer = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (announcer.current) announcer.current.textContent = words
  }, [words, announce])

  return (
    <section
      data-slot="needs-you"
      data-size="default"
      data-covered={covered ? "" : undefined}
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      // Covered by a compact line on a layer: invisible and out of the reading order, but it keeps
      // its space, so nothing on the page moves when the layer closes and it comes back.
      aria-hidden={covered || undefined}
      className={cn("flex min-w-0 flex-col gap-4 bg-needs-you-fill p-6 text-needs-you-on-fill data-covered:invisible", className)}
      {...props}
    >
      <p id={titleId} data-slot="needs-you-title" className="type-overline text-needs-you-on-fill">
        {title}
        {more ? (
          <>
            <span aria-hidden="true">{` // +${more}`}</span>
            <span className="sr-only">{`, ${more} more waiting`}</span>
          </>
        ) : null}
      </p>
      {body ? (
        <p id={bodyId} data-slot="needs-you-body" className="type-body-strong">
          {body}
        </p>
      ) : null}
      {children}
      {action || textActions.length ? (
        <div data-slot="needs-you-actions" className="flex flex-wrap items-center gap-3">
          {action}
          {textActions.map((node, i) => (
            <React.Fragment key={i}>{node}</React.Fragment>
          ))}
        </div>
      ) : null}
      {announce ? (
        <span ref={announcer} role="status" data-slot="needs-you-announcer" className="sr-only" />
      ) : null}
    </section>
  )
}

/**
 * The compact line: 48 tall, the yellow, the title (one line, cut with an ellipsis, the whole of
 * it read) and one solid action. It is the layer's needs-you while it shows; it registers with its
 * scope so the full block behind the scrim hides.
 */
function NeedsYouCompact({
  title,
  more,
  action,
  announce = true,
  className,
  // A compact line holds no body, no text actions and nothing else.
  body: _body,
  secondaryAction: _secondaryAction,
  secondaryActions: _secondaryActions,
  children: _children,
  ...props
}: Omit<NeedsYouProps, "size">) {
  const scope = React.useContext(NeedsYouScopeContext)
  React.useLayoutEffect(() => scope.addCompact(), [scope])
  const uid = React.useId()
  const titleId = `${uid}-title`
  const words = [wordsOf(title), more ? `, ${more} more waiting` : ""].join("")
  const announcer = React.useRef<HTMLSpanElement>(null)
  React.useEffect(() => {
    if (announcer.current) announcer.current.textContent = words
  }, [words, announce])
  return (
    <section
      data-slot="needs-you"
      data-size="compact"
      aria-labelledby={titleId}
      className={cn("flex h-control min-w-0 shrink-0 items-center gap-4 bg-needs-you-fill pr-2 pl-4 text-needs-you-on-fill", className)}
      {...props}
    >
      {/* `relative`: the title is the box of its own hidden words (", 1 more waiting"). They sit after
          the cut text, past the title's edge; without it they would escape the cut and widen the page. */}
      <p id={titleId} data-slot="needs-you-title" className="type-overline text-needs-you-on-fill relative min-w-0 flex-1 truncate">
        {title}
        {more ? (
          <>
            <span aria-hidden="true">{` // +${more}`}</span>
            <span className="sr-only">{`, ${more} more waiting`}</span>
          </>
        ) : null}
      </p>
      {action ? (
        <div data-slot="needs-you-actions" className="flex shrink-0 items-center">
          {action}
        </div>
      ) : null}
      {announce ? <span ref={announcer} role="status" data-slot="needs-you-announcer" className="sr-only" /> : null}
    </section>
  )
}

export { NeedsYou, NeedsYouProvider, useNeedsYouCompactShowing }
