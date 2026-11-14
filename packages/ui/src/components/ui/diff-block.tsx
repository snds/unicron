// Owned component (not generated): a file's changes: a header, then lines with a + or − mark on the added and removed washes.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, the diffs on the Warpcore Review diff and Synapse harness review frames; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Badge } from "./badge"
import { Button } from "./button"
import { COPIED_FOR_MS } from "./code-block"

export type DiffLineKind = "context" | "added" | "removed" | "hunk"

/** One line of a diff. `hunk` is a `@@ … @@` heading between runs of lines. */
export interface DiffLine {
  kind: DiffLineKind
  text: string
  /** The line's number before the change (context and removed lines). */
  oldNumber?: number
  /** The line's number after the change (context and added lines). */
  newNumber?: number
}

/** A file's state, as decisions §11 names them. */
export type DiffFileState = "added" | "modified" | "deleted" | "renamed"

export interface DiffFile {
  path: string
  /** The path before a rename. */
  previousPath?: string
  state: DiffFileState
  lines: DiffLine[]
}

const STATE_WORDS: Record<DiffFileState, string> = {
  added: "Added",
  modified: "Modified",
  deleted: "Deleted",
  renamed: "Renamed",
}

const HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/

/**
 * The lines of one file's diff, from unified diff text (the part from the first `@@`, or lines
 * that start with `+`, `-` or a space). File headers (`diff --git`, `---`, `+++`) are skipped.
 */
export function parseDiffLines(text: string): DiffLine[] {
  const lines: DiffLine[] = []
  let oldAt = 1
  let newAt = 1
  const rows = text.replace(/\r\n?/g, "\n").split("\n")
  if (rows.at(-1) === "") rows.pop()
  for (const row of rows) {
    const hunk = HUNK.exec(row)
    if (hunk) {
      oldAt = Number(hunk[1])
      newAt = Number(hunk[2])
      lines.push({ kind: "hunk", text: row })
      continue
    }
    if (row.startsWith("+++ ") || row.startsWith("--- ") || row.startsWith("diff --git") || row.startsWith("\\")) continue
    if (row.startsWith("+")) lines.push({ kind: "added", text: row.slice(1), newNumber: newAt++ })
    else if (row.startsWith("-")) lines.push({ kind: "removed", text: row.slice(1), oldNumber: oldAt++ })
    else lines.push({ kind: "context", text: row.startsWith(" ") ? row.slice(1) : row, oldNumber: oldAt++, newNumber: newAt++ })
  }
  return lines
}

/** Every file in a unified diff (`git diff`, a `.patch`), with its state and lines. */
export function parseUnifiedDiff(patch: string): DiffFile[] {
  const files: DiffFile[] = []
  let file: (DiffFile & { body: string[] }) | null = null
  const flush = () => {
    if (file) files.push({ path: file.path, previousPath: file.previousPath, state: file.state, lines: parseDiffLines(file.body.join("\n")) })
  }
  const strip = (p: string) => p.replace(/^[ab]\//, "")
  for (const row of patch.replace(/\r\n?/g, "\n").split("\n")) {
    const start = /^diff --git a\/(.+) b\/(.+)$/.exec(row)
    if (start) {
      flush()
      file = { path: start[2], previousPath: start[1] !== start[2] ? start[1] : undefined, state: start[1] !== start[2] ? "renamed" : "modified", lines: [], body: [] }
      continue
    }
    if (!file && (row.startsWith("--- ") || row.startsWith("@@"))) file = { path: "", state: "modified", lines: [], body: [] }
    if (!file) continue
    if (row.startsWith("new file mode")) file.state = "added"
    else if (row.startsWith("deleted file mode")) file.state = "deleted"
    else if (row.startsWith("rename from ")) {
      file.previousPath = row.slice("rename from ".length)
      file.state = "renamed"
    } else if (row.startsWith("rename to ")) file.path = row.slice("rename to ".length)
    else if (row.startsWith("--- ")) {
      const from = row.slice(4)
      if (from === "/dev/null") file.state = "added"
      else if (!file.path) file.path = strip(from)
    } else if (row.startsWith("+++ ")) {
      const to = row.slice(4)
      if (to === "/dev/null") file.state = "deleted"
      else file.path = strip(to)
    } else if (/^(@@|[+\- \\])/.test(row) || row === "") file.body.push(row)
  }
  flush()
  return files
}

/** The diff as text again, a `+`, `-` or space before each line: what Copy puts on the clipboard. */
function diffText(lines: readonly DiffLine[]) {
  return lines.map((l) => (l.kind === "hunk" ? l.text : `${l.kind === "added" ? "+" : l.kind === "removed" ? "-" : " "}${l.text}`)).join("\n")
}

/** How long "Copied" stays (decisions §1: "Copied" for 2 s, no toast): CopyButton's one constant. */
const COPIED_MS = COPIED_FOR_MS

export type DiffBlockProps = Omit<React.ComponentProps<"section">, "children"> & {
  /** The file, as it is named in the repository ("server/auth/login.ts"). Shown as typed, never in capitals. */
  path?: string
  /** A renamed file's old path: shown "old → new". */
  previousPath?: string
  /** A state Badge: Added, Modified, Deleted, Renamed. */
  state?: DiffFileState
  /** The lines. Or pass `diff`. */
  lines?: readonly DiffLine[]
  /** One file's unified diff text, parsed with `parseDiffLines`. */
  diff?: string
  /** `+n −n` in the header, counted from the lines. Default true when there is a header. */
  stats?: boolean
  /** How many lines were added, when the lines are not all here (a folded file not loaded yet). Default: counted. */
  additions?: number
  /** How many lines were removed, when the lines are not all here. Default: counted. */
  deletions?: number
  /** The old and new line numbers in a gutter before the marks. Default false, as drawn. */
  lineNumbers?: boolean
  /** The path is a button that folds the lines away and opens them (`aria-expanded`). */
  foldable?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Past this many lines the rest wait behind "Show n more lines". Default 40. */
  maxLines?: number
  /** Long lines wrap instead of scrolling sideways. */
  wrap?: boolean
  defaultWrap?: boolean
  onWrapChange?: (wrap: boolean) => void
  /** A Wrap toggle in the header. Default true when there is a header. */
  wrapToggle?: boolean
  /** A Copy button in the header (decisions §1: "Copied" for 2 s, no toast). Default true when there is a header. */
  copy?: boolean
  /** What Copy puts on the clipboard. Default: the diff as text, a mark before each line. */
  copyText?: string
  /** More header controls, after Copy. */
  actions?: React.ReactNode
}

function Mark({ kind }: { kind: DiffLineKind }) {
  const sign = kind === "added" ? "+" : kind === "removed" ? "−" : ""
  return (
    <>
      <span
        data-slot="diff-block-mark"
        aria-hidden="true"
        // The mark always shows: colour never carries the change alone. A removed line's minus is
        // the critical ink; an added line's plus is ink, as its wash is neutral (decisions §11).
        className={cn("w-[1ch] shrink-0 select-none", kind === "removed" ? "text-critical-text" : "text-foreground")}
      >
        {sign}
      </span>
      {kind === "added" || kind === "removed" ? <span className="sr-only">{kind === "added" ? "Added: " : "Removed: "}</span> : null}
    </>
  )
}

/**
 * DiffBlock (contract 5.1a, 5.1b #43): one file's changes. A header (the path as typed, `+n −n`,
 * a state Badge, Wrap and Copy), then a raised box with a hairline that scrolls sideways. Added
 * lines are on the neutral `diff-added` wash, removed lines on `diff-removed` (`critical-soft`),
 * and every changed line keeps its `+` or `−` mark, so colour never carries the change alone.
 * Lines are code-inline type, 28 tall. `foldable` shuts the file to its header; past `maxLines` the
 * rest wait behind a button. For many files, use one DiffBlock per file from `parseUnifiedDiff`,
 * the first open and the rest folded.
 */
function DiffBlock({
  path,
  previousPath,
  state,
  lines: linesProp,
  diff,
  stats,
  additions,
  deletions,
  lineNumbers = false,
  foldable = false,
  open: openProp,
  defaultOpen = true,
  onOpenChange,
  maxLines = 40,
  wrap: wrapProp,
  defaultWrap = false,
  onWrapChange,
  wrapToggle,
  copy,
  copyText,
  actions,
  className,
  "aria-label": ariaLabel,
  ...props
}: DiffBlockProps) {
  const id = React.useId()
  const lines = React.useMemo(() => linesProp ?? (diff ? parseDiffLines(diff) : []), [linesProp, diff])
  const added = additions ?? lines.filter((l) => l.kind === "added").length
  const removed = deletions ?? lines.filter((l) => l.kind === "removed").length

  const [openState, setOpenState] = React.useState(defaultOpen)
  const open = foldable ? (openProp ?? openState) : true
  const setOpen = (next: boolean) => {
    if (openProp === undefined) setOpenState(next)
    onOpenChange?.(next)
  }
  const [wrapState, setWrapState] = React.useState(defaultWrap)
  const wrap = wrapProp ?? wrapState
  const setWrap = (next: boolean) => {
    if (wrapProp === undefined) setWrapState(next)
    onWrapChange?.(next)
  }
  const [expanded, setExpanded] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  // Whether a line is wider than the box, so the box scrolls sideways. Watched as the box, its
  // lines and the wrap change.
  const boxRef = React.useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = React.useState(false)
  React.useEffect(() => {
    const el = boxRef.current
    if (!el) return
    const check = () => setScrolls(el.scrollWidth > el.clientWidth + 1)
    check()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(check)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [open, wrap, expanded, lines])
  React.useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), COPIED_MS)
    return () => clearTimeout(timer)
  }, [copied])

  const hasHeader = Boolean(path || state || actions || copy || wrapToggle)
  const showStats = stats ?? hasHeader
  const showCopy = copy ?? hasHeader
  const showWrap = wrapToggle ?? hasHeader
  const hidden = !expanded && lines.length > maxLines ? lines.length - maxLines : 0
  const shown = hidden > 0 ? lines.slice(0, maxLines) : lines
  const digits = String(Math.max(1, ...lines.map((l) => Math.max(l.oldNumber ?? 0, l.newNumber ?? 0)))).length

  const doCopy = async () => {
    const text = copyText ?? diffText(lines)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      // No clipboard (an insecure page, a denied permission): nothing is said to have been copied.
    }
  }

  const pathWords = (
    <span data-slot="diff-block-path" className="min-w-0 truncate type-meta text-foreground">
      {previousPath ? (
        <>
          {previousPath}
          <span aria-hidden="true"> → </span>
          <span className="sr-only"> renamed to </span>
        </>
      ) : null}
      {path}
    </span>
  )

  const regionLabel = ariaLabel ?? (path ? `Changes to ${path}` : "Changes")
  return (
    <section
      data-slot="diff-block"
      data-state={state}
      data-open={open || undefined}
      data-wrap={wrap || undefined}
      aria-label={regionLabel}
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      {hasHeader ? (
        <div data-slot="diff-block-header" className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          {foldable ? (
            <ButtonPrimitive
              data-slot="diff-block-fold"
              aria-expanded={open}
              aria-controls={`${id}-lines`}
              onClick={() => setOpen(!open)}
              className="hit-area -mx-1 inline-flex min-w-0 items-center gap-1 rounded-lg px-1 text-left hover:bg-state-hover active:bg-state-pressed"
            >
              <span aria-hidden="true" className={cn("inline-flex shrink-0 text-muted-foreground transition-transform duration-(--motion-fast) motion-reduce:transition-none", !open && "-rotate-90")}>
                <Icon name="chevron--down" size="sm" />
              </span>
              {pathWords}
            </ButtonPrimitive>
          ) : path ? (
            pathWords
          ) : null}
          {showStats ? (
            <span data-slot="diff-block-stats" className="shrink-0 type-meta whitespace-nowrap text-muted-foreground">
              <span aria-hidden="true">
                +{added} −{removed}
              </span>
              <span className="sr-only">
                {added} lines added, {removed} removed
              </span>
            </span>
          ) : null}
          {state ? <Badge>{STATE_WORDS[state]}</Badge> : null}
          <span aria-hidden="true" className="flex-1" />
          {showWrap && open ? (
            <Button variant="ghost" size="sm" aria-pressed={wrap} onClick={() => setWrap(!wrap)}>
              Wrap
            </Button>
          ) : null}
          {showCopy && open ? (
            <Button variant="ghost" size="sm" onClick={doCopy}>
              <Icon name={copied ? "checkmark" : "copy"} />
              {copied ? "Copied" : "Copy"}
            </Button>
          ) : null}
          {actions}
          <span role="status" className="sr-only">
            {copied ? "Copied" : ""}
          </span>
        </div>
      ) : null}
      <div
        ref={boxRef}
        id={`${id}-lines`}
        data-slot="diff-block-box"
        data-scrolls={scrolls || undefined}
        hidden={!open}
        // While a line is wider than the box, the box takes focus and has a name, so a keyboard can
        // scroll it sideways in every engine (Chromium makes a bare scroller a tab stop by itself,
        // WebKit, which the Mac apps run in, does not), as CodeBlock and Table do.
        tabIndex={scrolls ? 0 : undefined}
        role={scrolls ? "group" : undefined}
        aria-label={scrolls ? `${regionLabel}, lines` : undefined}
        className="overflow-x-auto overscroll-x-contain rounded-none bg-surface-raised py-2.5 rule-box"
        style={{ "--diff-digits": digits } as React.CSSProperties}
      >
        <div data-slot="diff-block-lines" className={cn("flex flex-col", wrap ? "w-full" : "w-max min-w-full")}>
          {shown.map((line, i) => (
            <div key={i} data-slot="diff-block-line" data-kind={line.kind} className="flex min-w-0 type-code-inline">
              {lineNumbers ? (
                <span data-slot="diff-block-numbers" aria-hidden="true" className="flex shrink-0 gap-3 py-1 pl-4 select-none type-meta text-muted-foreground">
                  <span className="min-w-[calc(var(--diff-digits)*1ch)] text-right">{line.oldNumber ?? ""}</span>
                  <span className="min-w-[calc(var(--diff-digits)*1ch)] text-right">{line.newNumber ?? ""}</span>
                </span>
              ) : null}
              <span
                className={cn(
                  "flex min-w-0 flex-1 items-baseline gap-1.5 py-1 pr-4 pl-4",
                  line.kind === "added" && "bg-diff-added",
                  line.kind === "removed" && "bg-diff-removed"
                )}
              >
                {line.kind === "hunk" ? (
                  <span data-slot="diff-block-hunk" className="type-meta text-muted-foreground">
                    {line.text}
                  </span>
                ) : (
                  <>
                    <Mark kind={line.kind} />
                    <code data-slot="diff-block-code" className={cn("min-w-0 font-[inherit] text-foreground [tab-size:4]", wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre")}>
                      {line.text || " "}
                    </code>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
        {hidden > 0 ? (
          <div data-slot="diff-block-more" className="px-4 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setExpanded(true)}>
              Show {hidden} more {hidden === 1 ? "line" : "lines"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

export { DiffBlock }
