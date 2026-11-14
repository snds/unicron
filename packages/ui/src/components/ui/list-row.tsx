// Owned component (not generated): one row for every list in Unicron: inline (indexed items) and message (mail, notifications).
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 9:181; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from "./dropdown-menu"
import { Progress, type ProgressTone } from "./progress"
import { SwipeRowMenuItems, useSwipeRowActions } from "./swipe-row"

export type ListRowLayout = "inline" | "message"
export type ListRowTone = "neutral" | "live"
export type ListRowMetaStyle = "label" | "plain"
export type ListRowSize = "default" | "compact"

/** A row's progress: a share from 0 to 1, or a value between `min` and `max` (a count of 32, steps of 7). */
export interface ListRowProgress {
  value: number | null
  min?: number
  max?: number
  /** Default: the segmented bar's own default, the live colour. */
  tone?: ProgressTone
  /** Default 32, as Figma draws it. */
  segments?: number
}

/**
 * A count as decisions §13 writes it: two digits (`07`), three from 100 (`146`), a comma from
 * 1,000 (`1,204`). Shared by the data parts that show a count (SectionHeader, FilterChip, ListRow).
 */
export function formatListCount(count: number): string {
  if (!Number.isFinite(count)) return String(count)
  const n = Math.max(0, Math.round(count))
  if (n >= 1000) return n.toLocaleString("en-US")
  return String(n).padStart(n >= 100 ? 3 : 2, "0")
}

const ROW = cva(
  // The rule is an inset shadow on top, so it adds no height. Selected is primary-soft with the 2px
  // primary edge, also an inset shadow, so it pushes nothing. Text keeps its default colours.
  "group/list-row relative flex w-full min-w-0 rule-t text-foreground",
  {
    variants: {
      layout: {
        // Figma Inline: 16 at the sides, 24 between columns, children on the text baseline.
        inline: "gap-6 px-4",
        // Figma Message: 12 at the sides, 16 at the top and bottom.
        message: "gap-3 px-3",
      },
      size: { default: "", compact: "" },
      metaStyle: { label: "", plain: "" },
      selected: { true: "bg-primary-soft edge-l", false: "" },
      interactive: {
        // A wash over whatever fill the row has (none, or primary-soft), as an image layer, while
        // the pointer is on the row's main control; the stylesheet's ring is redrawn on the row.
        true: "has-[[data-slot=list-row-main]:hover]:bg-[image:linear-gradient(var(--state-hover),var(--state-hover))] has-[[data-slot=list-row-main]:active]:bg-[image:linear-gradient(var(--state-pressed),var(--state-pressed))] has-[[data-slot=list-row-main]:focus-visible]:outline-solid has-[[data-slot=list-row-main]:focus-visible]:outline-(length:--stroke-emphasis) has-[[data-slot=list-row-main]:focus-visible]:outline-ring has-[[data-slot=list-row-main]:focus-visible]:outline-offset-[calc(var(--stroke-emphasis)*-1)]",
        false: "",
      },
      disabled: { true: "pointer-events-none opacity-50", false: "" },
    },
    compoundVariants: [
      // Label: 20 + 28 + 4 + 16 + 20 = 88. Plain: 20 + 28 + 6 + 20 + 2 + 16 = 92.
      { layout: "inline", size: "default", metaStyle: "label", className: "items-baseline pt-5 pb-5" },
      { layout: "inline", size: "default", metaStyle: "plain", className: "items-baseline pt-5 pb-4" },
      // Compact (Lockdown's popup and sheets, Vale's summary rows): 8 + 20 + 4 + 16 + 8 = 56.
      { layout: "inline", size: "compact", className: "min-h-14 items-center py-2" },
      { layout: "inline", size: "compact", metaStyle: "plain", className: "py-1.5" },
      // Message: 16 + 20 + 4 + 20 + 4 + 20 + 16 = 100 with one preview line.
      { layout: "message", size: "default", className: "items-start py-4" },
      // A collapsed message: one line, 12 + 20 + 12 = 44.
      { layout: "message", size: "compact", className: "items-center py-3" },
    ],
    defaultVariants: {
      layout: "inline",
      size: "default",
      metaStyle: "label",
      selected: false,
      interactive: false,
      disabled: false,
    },
  }
)

// The main control's text stays the row's text; its hit area is stretched over the whole row by an
// ::after, and the parts that are their own controls (action, menu) sit above it. The focus ring
// is drawn on the row instead of around the words, inset so a scroller never clips it.
const MAIN =
  "cursor-pointer rounded-none text-left [color:inherit] [font:inherit] outline-none after:absolute after:inset-0 after:content-[''] aria-disabled:cursor-default"

// A box one text line tall, with the line's own baseline (an invisible letter in the same type
// role), so a control or a mark sits centred on the title line and still lines up on the baseline.
const ON_LINE =
  "inline-flex shrink-0 items-center before:invisible before:w-0 before:overflow-hidden before:content-['x']"

type MainRender = useRender.RenderProp

export type ListRowProps = Omit<React.HTMLAttributes<HTMLElement>, "title" | "onClick" | "children"> & {
  /** `inline` (indexed items: tasks, vault items) or `message` (mail, notifications). */
  layout?: ListRowLayout
  /** Primary-soft with the 2px primary edge; the main control says `aria-current`. */
  selected?: boolean
  /** The `aria-current` value a selected row says. Default `true`; a link to a page may say `page`. */
  current?: "page" | "step" | "location" | "date" | "time" | "true"
  /** `live` colours the status in the live ink, for running work. */
  tone?: ListRowTone
  /** `compact` (56; a collapsed message 44) for popups, sheets and summary rows. */
  size?: ListRowSize
  /** Dimmed, and its main control says `aria-disabled` and does nothing; a reason may be shown. */
  disabled?: boolean
  /** A visible line saying why the row is unavailable, tied to its main control by `aria-describedby`. */
  disabledReason?: React.ReactNode
  /** In place of the index: a Checkbox, an Initial Tile S, an 8 px swatch square, a status mark. */
  leading?: React.ReactNode
  /** Small marks after the title (inline) or the sender (message): a star, a crown-jewel mark. */
  marks?: React.ReactNode
  /** One trailing control (FILL, OPEN, Answer): a Button `size="sm"`. Sits above the row's own click. */
  action?: React.ReactNode
  /** The row's menu: `DropdownMenuItem`s. Shown as an overflow button (always on touch, on hover and focus with a mouse), and on the Menu key, Shift+F10 and a right click. A SwipeRow around the row adds its actions here. */
  menu?: React.ReactNode
  /** The words of the overflow button; the row's title is added to its name. Default "More actions". */
  menuLabel?: string
  /** The row opens this address: the main control is a link. */
  href?: string
  target?: string
  rel?: string
  /** The row runs this: the main control is a button (unless `href` is given). */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** The main control as another element, a router link: `mainRender={<Link to="/tasks/14" />}`. With `onClick` and no `href`, an element to draw the button as (a function is used for links only). */
  mainRender?: MainRender
  /** The row itself as another element, an item of a list: `render={<li />}`. */
  render?: useRender.RenderProp

  // ── Inline ──
  /** The folio in the 40 px leading column ("01"). */
  index?: React.ReactNode
  /** Subtitle role; wraps. Required for an inline row. */
  title?: React.ReactNode
  /** One line, cut with an ellipsis. `label` (overline) or `plain` (meta) per `metaStyle`. */
  meta?: React.ReactNode
  metaStyle?: ListRowMetaStyle
  /** The status words, right, in overline caps ("Queued"); in the live ink when `tone="live"`. */
  status?: React.ReactNode
  /** A status Badge, after the status words. */
  badge?: React.ReactNode
  /** A line of detail under the meta (a search snippet, a description): caption role, two lines at most. */
  detail?: React.ReactNode
  /** The segmented bar under the meta, up to 360 wide: a share from 0 to 1, or a value and its range. */
  progress?: number | ListRowProgress | null

  // ── Message ──
  sender?: React.ReactNode
  time?: React.ReactNode
  subject?: React.ReactNode
  preview?: React.ReactNode
  /** The 6 px unread square before the sender; "Unread" is read with the row's name. */
  unread?: boolean
  /** How many messages the thread holds, after the sender. */
  count?: number
  /** A tag after the sender (a Badge or a Chip). */
  tag?: React.ReactNode
  /** Which account the message came to, before the time ("Work"). */
  account?: React.ReactNode
  /** How many lines the preview may run to before it is cut. Default 2, as the app screens draw it. */
  previewLines?: 1 | 2 | 3
}

function progressProps(progress: number | ListRowProgress): ListRowProgress {
  if (typeof progress === "number") return { value: Math.min(1, Math.max(0, progress)), min: 0, max: 1 }
  return progress
}

const PREVIEW_LINES = { 1: "line-clamp-1", 2: "line-clamp-2", 3: "line-clamp-3" } as const

/**
 * ListRow: one row for every list (Figma 1, "List Row"). Inline rows hold an index, a title that
 * wraps, one line of meta, a status that hugs its words and an optional segmented progress bar;
 * message rows hold an unread mark, a sender, a time, a subject and a preview. Heights 88 (label
 * meta), 92 (plain meta) and 100 (with progress) as drawn; 56 compact.
 *
 * Interactive with `href`, `onClick` or `mainRender`: the title (or the sender) is the row's main
 * control, stretched over the row. Its name is the title alone (a message: unread, sender and
 * subject), and the meta, status and detail describe it. The trailing `action` and the menu are
 * separate controls beside it, never inside it.
 */
function ListRow({
  layout = "inline",
  selected = false,
  current,
  tone = "neutral",
  size = "default",
  disabled = false,
  disabledReason,
  leading,
  marks,
  action,
  menu,
  menuLabel = "More actions",
  href,
  target,
  rel,
  onClick,
  mainRender,
  render,
  index,
  title,
  meta,
  metaStyle = "label",
  status,
  badge,
  detail,
  progress,
  sender,
  time,
  subject,
  preview,
  unread = false,
  count,
  tag,
  account,
  previewLines = 2,
  className,
  onKeyDown,
  onContextMenu,
  ...props
}: ListRowProps) {
  const id = React.useId()
  const ids = {
    title: `${id}-title`,
    meta: `${id}-meta`,
    status: `${id}-status`,
    detail: `${id}-detail`,
    reason: `${id}-reason`,
    unread: `${id}-unread`,
    sender: `${id}-sender`,
    subject: `${id}-subject`,
    time: `${id}-time`,
    preview: `${id}-preview`,
    menu: `${id}-menu`,
  }
  const message = layout === "message"
  const compact = size === "compact"
  const interactive = Boolean(href || onClick || mainRender)

  const swipe = useSwipeRowActions()
  const swipeActions = swipe?.actions.length ?? 0
  const hasMenu = Boolean(menu) || swipeActions > 0
  const [menuOpen, setMenuOpen] = React.useState(false)

  const has = (node: React.ReactNode) => node !== undefined && node !== null && node !== false
  const nameIds = message
    ? [unread ? ids.unread : null, has(sender) ? ids.sender : null, has(subject) && !compact ? ids.subject : null]
    : [ids.title]
  const describedBy = (
    message
      ? [has(time) ? ids.time : null, has(preview) ? ids.preview : null, has(disabledReason) ? ids.reason : null]
      : [has(meta) ? ids.meta : null, has(status) ? ids.status : null, has(detail) ? ids.detail : null, has(disabledReason) ? ids.reason : null]
  )
    .filter(Boolean)
    .join(" ")

  // The main control: a link, a button, an app's own element, or (not interactive) plain text. A
  // button is an inline span with the button role (Base UI Button, not native), because a native
  // button is an inline block: a title that wraps inside it would put the row's baseline on its
  // last line instead of its first.
  const tag_ = href || (mainRender && !onClick) ? "a" : onClick ? "button" : "span"
  const mainProps = interactive
    ? {
        className: MAIN,
        "aria-current": selected ? (current ?? "true") : undefined,
        "aria-labelledby": message ? nameIds.filter(Boolean).join(" ") || undefined : undefined,
        "aria-describedby": describedBy || undefined,
        "aria-disabled": disabled || undefined,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          onClick?.(event)
        },
      }
    : {}
  const children = message ? sender : title
  const linkOrText = useRender({
    defaultTagName: tag_ === "a" ? "a" : "span",
    render: interactive && tag_ === "a" ? mainRender : undefined,
    props: mergeProps<"a">(
      tag_ === "a"
        ? {
            ...mainProps,
            href: disabled ? undefined : href,
            target: disabled ? undefined : target,
            rel,
            role: disabled ? "link" : undefined,
            tabIndex: disabled ? 0 : undefined,
          }
        : {},
      { children }
    ),
    state: { slot: interactive ? "list-row-main" : "list-row-text" },
  })
  const main =
    tag_ === "button" ? (
      <ButtonPrimitive data-slot="list-row-main" nativeButton={false} render={React.isValidElement(mainRender) ? mainRender : <span />} focusableWhenDisabled {...mainProps}>
        {children}
      </ButtonPrimitive>
    ) : (
      linkOrText
    )

  const openMenuKeys = (event: React.KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event)
    if (event.defaultPrevented || !hasMenu || disabled) return
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault()
      setMenuOpen(true)
    }
  }
  const openMenuOnRightClick = (event: React.MouseEvent<HTMLElement>) => {
    onContextMenu?.(event)
    if (event.defaultPrevented || !hasMenu || disabled) return
    event.preventDefault()
    setMenuOpen(true)
  }

  const lineType = message || compact ? "type-ui" : "type-subtitle"
  // The line box a control or a mark is centred on: the title's (28) or a message header's (20).
  // Fixed, so a 32px button overhangs it evenly instead of pushing the row's baseline down.
  const lineBox = message ? "type-ui-emphasis h-5" : compact ? "type-ui h-5" : "type-subtitle h-7"
  // With a mouse, the menu button shows on hover and focus; without a trailing action it takes the
  // status's place then (the status hides), so at rest the status hugs the row's edge as drawn. On
  // touch it always shows, in its own place.
  const overlayMenu = hasMenu && !has(action)
  const menuButton = hasMenu ? (
    <span
      data-slot="list-row-menu"
      className={cn(
        ON_LINE,
        lineBox,
        "relative z-10 opacity-0 group-focus-within/list-row:opacity-100 group-hover/list-row:opacity-100 pointer-coarse:opacity-100 has-aria-expanded:opacity-100",
        overlayMenu &&
          (compact
            ? "pointer-fine:absolute pointer-fine:top-1/2 pointer-fine:-translate-y-1/2"
            : message
              ? "pointer-fine:absolute pointer-fine:top-4"
              : "pointer-fine:absolute pointer-fine:top-5"),
        overlayMenu && (message ? "pointer-fine:right-3" : "pointer-fine:right-4")
      )}
    >
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-labelledby={[ids.menu, ...nameIds].filter(Boolean).join(" ")} />}
        >
          <Icon name="overflow-menu--horizontal" />
          <span id={ids.menu} className="sr-only">
            {menuLabel}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" width="auto">
          {swipe ? <SwipeRowMenuItems menu={swipe} /> : null}
          {swipeActions > 0 && menu ? <DropdownMenuSeparator /> : null}
          {menu}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  ) : null
  // What the overlaid menu button covers while it shows.
  const underMenu = overlayMenu
    ? "pointer-fine:group-hover/list-row:invisible pointer-fine:group-focus-within/list-row:invisible pointer-fine:group-has-aria-expanded/list-row:invisible"
    : ""
  const actionSlot = has(action) ? (
    <span data-slot="list-row-action" className={cn(ON_LINE, lineBox, "relative z-10")}>
      {action}
    </span>
  ) : null
  const leadingSlot = has(leading) ? (
    <span data-slot="list-row-leading" className={cn(ON_LINE, lineBox, message ? "self-start" : "w-(--c-list-row-leading-width)")}>
      {leading}
    </span>
  ) : null

  const progressShown = !message && progress !== undefined && progress !== null
  // Plain meta keeps Figma's 6 between title and meta (and its 2 under the body); a line added
  // under them sits 4 below, so the row stays on the 4px grid (92 + 24 a line).
  const plainExtra = metaStyle === "plain" && !compact ? "-mt-0.5" : ""
  const body = message ? (
    <div data-slot="list-row-body" className={cn("flex min-w-0 flex-1 flex-col", compact ? "" : "gap-1")}>
      {/* One 20px line: the smaller roles in it sit on its baseline and cannot make it taller. */}
      <div data-slot="list-row-header" className="flex h-5 min-w-0 items-baseline gap-2">
        {unread ? (
          <>
            <span data-slot="list-row-unread" aria-hidden="true" className="size-(--c-list-row-unread-size) shrink-0 bg-foreground" />
            <span id={ids.unread} className="sr-only">
              Unread
            </span>
          </>
        ) : null}
        <span id={ids.sender} data-slot="list-row-sender" className="min-w-0 shrink truncate type-ui-emphasis text-foreground">
          {main}
        </span>
        {count !== undefined ? (
          <span data-slot="list-row-count" className="shrink-0 type-meta text-muted-foreground">
            {formatListCount(count)}
          </span>
        ) : null}
        {has(marks) ? <span data-slot="list-row-marks" className="inline-flex shrink-0 items-center gap-1 self-center">{marks}</span> : null}
        {has(tag) ? <span data-slot="list-row-tag" className="inline-flex shrink-0 self-center">{tag}</span> : null}
        {compact && has(preview) ? (
          // The caption role wraps prettily; the line inside it is cut instead.
          <span id={ids.preview} data-slot="list-row-preview" className="min-w-0 flex-1 type-caption text-muted-foreground">
            <span className="block truncate">{preview}</span>
          </span>
        ) : (
          <span aria-hidden="true" className="flex-1" />
        )}
        {has(account) || has(time) ? (
          <span id={ids.time} data-slot="list-row-time" className={cn("shrink-0 type-overline whitespace-nowrap text-muted-foreground", underMenu)}>
            {account}
            {has(account) && has(time) ? <span aria-hidden="true"> // </span> : null}
            {time}
          </span>
        ) : null}
      </div>
      {!compact && has(subject) ? (
        <p id={ids.subject} data-slot="list-row-subject" className="type-ui text-foreground">
          {subject}
        </p>
      ) : null}
      {!compact && has(preview) ? (
        <p id={ids.preview} data-slot="list-row-preview" className={cn("type-caption text-muted-foreground", PREVIEW_LINES[previewLines])}>
          {preview}
        </p>
      ) : null}
      {has(disabledReason) ? (
        <p id={ids.reason} data-slot="list-row-reason" className="type-caption text-support-foreground">
          {disabledReason}
        </p>
      ) : null}
    </div>
  ) : (
    <div
      data-slot="list-row-body"
      className={cn("flex min-w-0 flex-1 flex-col", metaStyle === "plain" ? (compact ? "gap-1" : "gap-1.5 pb-0.5") : "gap-1")}
    >
      <p id={ids.title} data-slot="list-row-title" className={cn(lineType, "text-foreground")}>
        {main}
        {has(marks) ? (
          <span data-slot="list-row-marks" className="ml-2 inline-flex items-center gap-1 align-middle">
            {marks}
          </span>
        ) : null}
      </p>
      {has(meta) ? (
        <p
          id={ids.meta}
          data-slot="list-row-meta"
          className={cn("truncate text-muted-foreground", metaStyle === "plain" ? "type-meta" : "type-overline")}
        >
          {meta}
        </p>
      ) : null}
      {has(detail) ? (
        <p id={ids.detail} data-slot="list-row-detail" className={cn("line-clamp-2 type-caption text-support-foreground", plainExtra)}>
          {detail}
        </p>
      ) : null}
      {has(disabledReason) ? (
        <p id={ids.reason} data-slot="list-row-reason" className={cn("type-caption text-support-foreground", plainExtra)}>
          {disabledReason}
        </p>
      ) : null}
      {progressShown ? (
        <div
          data-slot="list-row-progress"
          className={cn("w-full max-w-(--c-list-row-progress-max-width)", metaStyle === "plain" ? "pt-1.5" : "pt-1")}
        >
          <Progress variant="segmented" aria-labelledby={ids.title} {...progressProps(progress)} />
        </div>
      ) : null}
    </div>
  )

  const words = has(status) || has(badge)
  const controls = has(action) || hasMenu
  // Inline rows keep their trailing parts together. With a mouse they sit on one line (the menu
  // over the status, or after the action). On touch the words stay on the title line and the
  // controls go under them, so a phone row gives its title the width, not the buttons.
  const trailing =
    !message && (words || controls) ? (
      <div
        data-slot="list-row-trailing"
        className="flex shrink-0 items-baseline gap-3 pointer-coarse:flex-col pointer-coarse:items-end pointer-coarse:gap-1"
      >
        {words ? (
          <span data-slot="list-row-words" className={cn("flex items-baseline gap-3", underMenu)}>
            {has(status) ? (
              <span
                id={ids.status}
                data-slot="list-row-status"
                className={cn("type-overline whitespace-nowrap", tone === "live" ? "text-secondary-live" : "text-muted-foreground")}
              >
                {status}
              </span>
            ) : null}
            {has(badge) ? <span data-slot="list-row-badge" className="inline-flex shrink-0">{badge}</span> : null}
          </span>
        ) : null}
        {controls ? (
          <span data-slot="list-row-controls" className="flex items-baseline gap-1">
            {actionSlot}
            {menuButton}
          </span>
        ) : null}
      </div>
    ) : null

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps<"div">(
      {
        className: cn(ROW({ layout, size, metaStyle, selected, interactive, disabled }), className),
        onKeyDown: openMenuKeys,
        onContextMenu: openMenuOnRightClick,
        children: (
          <>
            {!message && !has(leading) && has(index) ? (
              <span data-slot="list-row-index" className="w-(--c-list-row-leading-width) shrink-0 type-folio text-muted-foreground">
                {index}
              </span>
            ) : null}
            {leadingSlot}
            {body}
            {message ? (
              <>
                {actionSlot}
                {menuButton}
              </>
            ) : (
              trailing
            )}
          </>
        ),
      },
      props as React.ComponentProps<"div">
    ),
    state: {
      slot: "list-row",
      layout,
      tone,
      size,
      "meta-style": metaStyle,
      selected: selected || undefined,
      disabled: disabled || undefined,
      interactive: interactive || undefined,
    },
  })
}

export { ListRow }
