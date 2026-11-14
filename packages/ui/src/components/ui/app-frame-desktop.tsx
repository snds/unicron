// Owned component (not generated): the desktop shells: the sidebar (with its switcher, its collapsed rail and its drawer), the status line with its status items, and Warpcore's top bar.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn on every app's desktop frames; contract 5.1a, 5.1b #4, #9; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { formatCountdown } from "../../lib/format"
import { Icon, type IconName } from "../icon"
import { AppFrameRailContext, useAppFrame, useFrameAnnouncement, type AppFrameBack } from "./app-frame-context"
import { Button } from "./button"
import { DropdownMenu, DropdownMenuTrigger } from "./dropdown-menu"
import { FloatButton } from "./float-button"
import { Kbd } from "./kbd"
import { Progress, type ProgressTone } from "./progress"
import { Rail, RailItem } from "./rail"
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip"

/** True for Cmd+\ (or Ctrl+\): the sidebar's key in all four apps (decisions §6). */
function isSidebarKey(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && (event.key === "\\" || event.code === "Backslash")
}

/* ── The primary action the sidebar and the top bar draw ─────────────────────────────────────── */

/** The one primary action of a shell: the section's create. Drawn full width, or icon-only where room is short. */
export interface AppFrameAction {
  label: string
  icon?: IconName
  onClick?: () => void
  /** Quick create (right-click, a long press on the icon-only form). */
  onLongPress?: () => void
  longPressLabel?: string
}

function isAction(value: unknown): value is AppFrameAction {
  return typeof value === "object" && value !== null && !React.isValidElement(value) && "label" in value
}

/* ── Sidebar ─────────────────────────────────────────────────────────────────────────────────── */

export type AppFrameSidebarProps = Omit<React.ComponentProps<"nav">, "children"> & {
  /** The nav's name. Default "Places". */
  label?: string
  /** `AppLockup`. In the rail it shows its mark only. */
  lockup?: React.ReactNode
  /** `AppFrameSwitcher`: the account, vault or workspace. Not in the rail (the page head switches there). */
  switcher?: React.ReactNode
  /**
   * The full-width primary Button (Vale's "Compose", Lockdown's "New item"). Pass the action and
   * the sidebar draws it full width, and icon-only in the rail; or pass your own node.
   */
  action?: AppFrameAction | React.ReactNode
  /** Pinned at the foot, under the scrolling middle: the Settings `NavItem`. */
  footer?: React.ReactNode
  /** A control at the end of the foot's row (Lockdown's Lock). The collapse control follows it. */
  footerControl?: React.ReactNode
  /**
   * The sidebar as its rail at the expanded width, by choice (Synapse ⌘\, Vale ADR-0073). The app
   * keeps it (a stored preference) and passes it back. At medium width the sidebar is always its rail.
   */
  collapsed?: boolean
  /** Draws the collapse and expand controls, and takes ⌘\ (Ctrl+\). */
  onCollapsedChange?: (collapsed: boolean) => void
  /** At medium width: the full sidebar laid over the content as a drawer. Controlled, or the sidebar keeps it. */
  drawerOpen?: boolean
  onDrawerOpenChange?: (open: boolean) => void
  /**
   * Room for the macOS window buttons (the app draws its own title bar): `start` moves the
   * lockup along its row (Synapse: x 88 instead of 48, so 40), `top` moves the rail's mark down
   * (y 44 instead of 16, so 28). In px.
   */
  leadingInset?: { start?: number; top?: number }
  /** The NavSections: the middle, which scrolls between the head and the pinned foot. */
  children?: React.ReactNode
}

/**
 * AppFrameSidebar: the desktop navigation column of Vale, Lockdown and Synapse (contract 5.2,
 * 5.1b #9). 204 wide on the page's own ground, 24 from the content, as every desktop frame draws
 * it: the lockup, an optional switcher, the full-width primary, the `NavSection`s 28 apart (they
 * scroll), and the pinned foot with its control slot.
 *
 * Collapsed (by choice at the expanded width, always at medium) it is the rail: 48 wide, the mark,
 * the primary as an icon, every section's items as rail items (their labels in tooltips), the foot,
 * and the expand control. At medium width expanding lays the full sidebar over the content as a
 * drawer with the menu scrim; it never pushes the content, and Esc or a press outside closes it.
 */
function AppFrameSidebar({
  label = "Places",
  lockup,
  switcher,
  action,
  footer,
  footerControl,
  collapsed = false,
  onCollapsedChange,
  drawerOpen: drawerOpenProp,
  onDrawerOpenChange,
  leadingInset,
  className,
  style,
  children,
  ...props
}: AppFrameSidebarProps) {
  const frame = useAppFrame()
  const [drawerOwn, setDrawerOwn] = React.useState(false)
  const drawerOpen = drawerOpenProp ?? drawerOwn
  const setDrawerOpen = React.useCallback(
    (open: boolean) => {
      if (drawerOpenProp === undefined) setDrawerOwn(open)
      onDrawerOpenChange?.(open)
    },
    [drawerOpenProp, onDrawerOpenChange]
  )
  // At medium width, and when a list + detail needs the room at the expanded width (C8), the
  // sidebar is its rail and expanding it lays the full sidebar over the content as a drawer.
  const medium = frame.layout === "medium" || frame.sidebarRail
  const rail = medium || collapsed
  const { setSidebar } = frame
  React.useLayoutEffect(() => {
    if (frame.phone) return
    setSidebar({ collapsed })
    return () => setSidebar(null)
  }, [frame.phone, collapsed, setSidebar])
  const drawerShows = medium && drawerOpen
  const expandButton = React.useRef<HTMLButtonElement>(null)
  const drawerRef = React.useRef<HTMLDivElement>(null)

  // ⌘\ (Ctrl+\): collapse and expand at the expanded width; open and close the drawer at medium.
  React.useEffect(() => {
    if (frame.phone) return
    const onKey = (event: KeyboardEvent) => {
      if (!isSidebarKey(event)) return
      if (medium) {
        event.preventDefault()
        setDrawerOpen(!drawerOpen)
      } else if (onCollapsedChange) {
        event.preventDefault()
        onCollapsedChange(!collapsed)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [frame.phone, medium, drawerOpen, setDrawerOpen, onCollapsedChange, collapsed])

  // The drawer: focus goes into it, Esc closes it and focus comes back to the expand control.
  React.useEffect(() => {
    if (!drawerShows) return
    drawerRef.current?.querySelector<HTMLElement>("a[href],button:not([disabled]),[tabindex='0']")?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setDrawerOpen(false)
      expandButton.current?.focus()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [drawerShows, setDrawerOpen])

  if (frame.phone) return null

  const full = (inDrawer: boolean) => (
    <>
      <div data-slot="app-frame-sidebar-head" className="flex flex-col gap-4">
        <div className="flex h-control items-center" style={leadingInset?.start ? { paddingInlineStart: leadingInset.start } : undefined}>
          {React.isValidElement<{ showName?: boolean }>(lockup) ? React.cloneElement(lockup, { showName: lockup.props.showName ?? true }) : lockup}
        </div>
        {switcher}
        {isAction(action) ? (
          <Button block onClick={action.onClick} onContextMenu={action.onLongPress ? (event) => (event.preventDefault(), action.onLongPress?.()) : undefined}>
            {action.icon ? <Icon name={action.icon} size="sm" /> : null}
            {action.label}
          </Button>
        ) : (
          action
        )}
      </div>
      <div data-slot="app-frame-sidebar-middle" className="-mx-1 mt-6 flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-1">
        {children}
      </div>
      {footer || footerControl || onCollapsedChange || inDrawer ? (
        <div data-slot="app-frame-sidebar-footer" className="mt-4 flex items-center gap-2">
          <div className="min-w-0 flex-1">{footer}</div>
          {footerControl}
          {inDrawer ? (
            <SidebarControl label="Close sidebar" icon="side-panel--close" onClick={() => (setDrawerOpen(false), expandButton.current?.focus())} />
          ) : onCollapsedChange ? (
            <SidebarControl label="Collapse sidebar" icon="side-panel--close" onClick={() => onCollapsedChange(true)} />
          ) : null}
        </div>
      ) : null}
    </>
  )

  if (!rail) {
    return (
      <nav
        data-slot="app-frame-sidebar"
        data-state="expanded"
        aria-label={label}
        className={cn("me-6 flex min-h-0 w-(--c-app-frame-sidebar-width) flex-col pt-4 pb-9 [grid-area:sidebar]", className)}
        style={style}
        {...props}
      >
        {full(false)}
      </nav>
    )
  }

  const canExpand = medium || Boolean(onCollapsedChange)
  return (
    <>
      <nav
        data-slot="app-frame-sidebar"
        data-state="rail"
        aria-label={label}
        className={cn("me-6 flex min-h-0 w-(--c-app-frame-sidebar-rail) flex-col items-center pt-4 pb-9 [grid-area:sidebar]", className)}
        style={{ ...(leadingInset?.top ? { paddingTop: `calc(var(--spacing) * 4 + ${leadingInset.top}px)` } : null), ...style }}
        {...props}
        inert={drawerShows || undefined}
      >
        <AppFrameRailContext.Provider value={true}>
          <div data-slot="app-frame-sidebar-head" className="flex flex-col items-center gap-4">
            <div className="flex h-control items-center [&_[data-slot=app-lockup-name]]:sr-only">
              {React.isValidElement<{ showName?: boolean }>(lockup) ? React.cloneElement(lockup, { showName: false }) : lockup}
            </div>
            {isAction(action) ? (
              <FloatButton
                kind="primary"
                size="l"
                label={action.label}
                icon={action.icon ?? "add"}
                onClick={action.onClick}
                onLongPress={action.onLongPress}
                longPressLabel={action.longPressLabel}
              />
            ) : null}
          </div>
          <div
            data-slot="app-frame-sidebar-middle"
            // A hairline between the groups, as the rail has no headings (Synapse Y-01).
            className="mt-6 flex min-h-0 flex-1 flex-col items-center gap-2 overflow-y-auto [&>*+*]:pt-2 [&>*+*]:rule-t"
          >
            {children}
          </div>
          <div data-slot="app-frame-sidebar-footer" className="mt-4 flex flex-col items-center gap-2">
            {footer}
            {footerControl}
            {canExpand ? (
              <Rail edge="left" aria-label="Sidebar">
                <RailItem
                  ref={expandButton}
                  label="Expand sidebar"
                  icon="side-panel--open"
                  aria-expanded={medium ? drawerOpen : false}
                  aria-keyshortcuts="Meta+Backslash Control+Backslash"
                  onClick={() => (medium ? setDrawerOpen(true) : onCollapsedChange?.(false))}
                />
              </Rail>
            ) : null}
          </div>
        </AppFrameRailContext.Provider>
      </nav>
      {drawerShows ? (
        <>
          {/* A press outside closes it. The scrim is the menu's (32%): the drawer is a panel, not a dialog. */}
          <div data-slot="app-frame-sidebar-scrim" aria-hidden="true" className="scrim-menu absolute inset-0 z-30" onPointerDown={() => setDrawerOpen(false)} />
          <div
            ref={drawerRef}
            data-slot="app-frame-sidebar-drawer"
            role="dialog"
            aria-label={label}
            className="motion-slide motion-slide-from-left absolute inset-y-0 start-0 z-40 flex bg-surface-ground ps-6 pe-6 rule-r"
          >
            <nav aria-label={label} className="flex min-h-0 w-(--c-app-frame-sidebar-width) flex-col pt-4 pb-9">
              {full(true)}
            </nav>
          </div>
        </>
      ) : null}
    </>
  )
}

/** The sidebar's own control in its foot: a ghost icon button with a tooltip naming its key. */
function SidebarControl({ label, icon, onClick }: { label: string; icon: IconName; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Button variant="ghost" size="icon" />}
        data-slot="app-frame-sidebar-control"
        aria-label={label}
        aria-keyshortcuts="Meta+Backslash Control+Backslash"
        onClick={onClick}
      >
        <Icon name={icon} />
      </TooltipTrigger>
      <TooltipContent side="top">
        {label}
        <Kbd>⌘\</Kbd>
      </TooltipContent>
    </Tooltip>
  )
}

export type AppFrameSwitcherProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The overline: what it switches, and where you are among them ("Workspace // 01 of 03"). */
  overline: React.ReactNode
  /** The open one's name ("Personal"). */
  title: string
  /** The chevron's name: "Switch workspace". */
  label: string
  /** The menu the chevron opens: a `DropdownMenuContent` with the accounts, ending "Add a workspace…" (decisions §7). */
  menu?: React.ReactNode
  /** Or a press the app answers itself (a popover, a sheet). */
  onOpen?: () => void
}

/**
 * AppFrameSwitcher: the sidebar's account, vault or workspace switcher (Synapse Desktop / 01): the
 * overline, the open one's name in the lead role (24/32, as drawn), and a chevron float button that opens the menu.
 */
function AppFrameSwitcher({ overline, title, label, menu, onOpen, className, ...props }: AppFrameSwitcherProps) {
  const chevron = <FloatButton label={label} icon="chevron--down" onClick={onOpen} aria-haspopup={menu ? "menu" : undefined} />
  return (
    <div data-slot="app-frame-switcher" className={cn("flex min-w-0 flex-col", className)} {...props}>
      <p className="type-overline truncate text-text-label">{overline}</p>
      <div className="flex min-w-0 items-center gap-2">
        <p data-slot="app-frame-switcher-title" className="type-lead min-w-0 truncate text-text-body">
          {title}
        </p>
        {menu ? (
          <DropdownMenu>
            <DropdownMenuTrigger render={chevron} />
            {menu}
          </DropdownMenu>
        ) : (
          chevron
        )}
      </div>
    </div>
  )
}

/* ── Status items ────────────────────────────────────────────────────────────────────────────── */

/** `neutral` a fact, `live` running now, `warning`, `critical`. Never needs-you: a status line is never yellow (decisions §1). */
export type StatusItemTone = "neutral" | "live" | "warning" | "critical"

const STATUS_INK: Record<StatusItemTone, string> = {
  neutral: "text-text-label",
  live: "text-secondary-live",
  warning: "text-warning",
  critical: "text-critical-text",
}

const STATUS_MARK: Record<StatusItemTone, string> = {
  neutral: "bg-text-label",
  live: "bg-secondary-live",
  warning: "bg-warning",
  critical: "bg-critical-text",
}

const STATUS_PROGRESS: Record<StatusItemTone, ProgressTone> = {
  neutral: "default",
  live: "live",
  warning: "budget",
  critical: "critical",
}

/** A countdown as decisions §13 writes one: `NN S` under a minute, `MM:SS` from one. */
export { formatCountdown }

export type StatusItemProps = Omit<React.ComponentProps<"div">, "children"> & {
  tone?: StatusItemTone
  /** A square mark before the words (the live mark), or a 16px glyph. */
  mark?: "square" | IconName
  /** The words, in the overline role, `//` between the parts ("Synced // 09:16"). */
  text: string
  /** The shorter form the top bar falls back to when it is out of room ("$3.40"). It never hides. */
  short?: string
  /** Seconds left, after the words (`08 S`, `04:12`). Hidden from assistive tech: say it in `announce`. */
  countdown?: number
  /** A segmented bar after the words (the undo window, a run). Hidden from assistive tech. */
  progress?: { value: number; max?: number; segments?: number }
  /** One text action after it: UNDO, STAY UNLOCKED, STOP. */
  action?: { label: string; onClick: () => void }
  /** The whole item is a button ("Check again"): its press. */
  onClick?: () => void
  /** Or a link (Warpcore's spend, to /spend). */
  href?: string
  /** A button's or link's name when the words say less ("Check again"); the words are its description. */
  label?: string
  /**
   * What a screen reader is told when the item changes, said once in a polite region: a stable
   * sentence ("Sending. 10 seconds to undo."), not each tick. Default: the words. Inside an
   * AppFrame it goes to the frame's one region (contract 5.1c C7); a live, warning or critical item,
   * or one with its own `announce`, is also said when it first shows.
   */
  announce?: string
}

/**
 * StatusItem (contract 5.1b #4): one fact at the end of the status line or the top bar, in the
 * overline role: a square mark or a glyph, the words in the tone's ink, and at most one of a
 * countdown, a segmented bar and a text action. The item itself can be a button or a link. Two at
 * most per line: the live one first, then the screen's own fact.
 */
function StatusItem({ tone = "neutral", mark, text, short, countdown, progress, action, onClick, href, label, announce, className, ...props }: StatusItemProps) {
  const descriptionId = React.useId()
  const ink = STATUS_INK[tone]
  // One polite region per frame (C7): the frame says the sentence; outside a frame the item does.
  const framed = useFrameAnnouncement(announce ?? text, tone !== "neutral" || announce !== undefined)

  const body = (
    <>
      {mark === "square" ? (
        <span data-slot="status-item-mark" aria-hidden="true" className={cn("size-(--c-accessory-live-mark) shrink-0", STATUS_MARK[tone])} />
      ) : mark ? (
        <span data-slot="status-item-glyph" aria-hidden="true" className={cn("inline-flex shrink-0", ink)}>
          <Icon name={mark} size="sm" />
        </span>
      ) : null}
      <span data-slot="status-item-text" id={descriptionId} className={cn("type-overline truncate whitespace-nowrap", ink, short && "[[data-short-status]_&]:hidden")}>
        {text}
      </span>
      {short ? (
        // The top bar's short form (Warpcore U-01): shown once the bar is out of room. The item keeps its full words as its name.
        <span data-slot="status-item-short" className={cn("type-overline hidden whitespace-nowrap [[data-short-status]_&]:inline", ink)}>
          {short}
        </span>
      ) : null}
      {countdown !== undefined ? (
        <span data-slot="status-item-countdown" aria-hidden="true" className={cn("type-overline shrink-0 tabular-nums", ink)}>
          {`// ${formatCountdown(countdown)}`}
        </span>
      ) : null}
    </>
  )

  const pressable = onClick || href
  const pressClass = cn(
    "hit-area -mx-1 flex min-w-0 items-center gap-2 rounded-sm px-1 py-1 underline-offset-4 transition-[background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover hover:underline active:bg-state-pressed",
    ink
  )

  return (
    <div data-slot="status-item" data-tone={tone} className={cn("flex min-w-0 items-center gap-3", className)} {...props}>
      {href ? (
        <a href={href} aria-label={label ?? (short ? text : undefined)} aria-describedby={label ? descriptionId : undefined} className={pressClass}>
          {body}
        </a>
      ) : onClick ? (
        <ButtonPrimitive aria-label={label ?? (short ? text : undefined)} aria-describedby={label ? descriptionId : undefined} onClick={onClick} className={pressClass}>
          {body}
        </ButtonPrimitive>
      ) : (
        <span className="flex min-w-0 items-center gap-2">{body}</span>
      )}
      {progress && !pressable ? (
        <span data-slot="status-item-progress" aria-hidden="true" className="w-24 shrink-0">
          <Progress variant="segmented" value={progress.value} max={progress.max ?? 100} segments={progress.segments ?? 10} tone={STATUS_PROGRESS[tone]} />
        </span>
      ) : null}
      {action ? (
        <Button variant="ghost" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
      {framed ? null : (
        <span data-slot="status-item-status" role="status" className="sr-only">
          {announce ?? text}
        </span>
      )}
    </div>
  )
}

/* ── Status line ─────────────────────────────────────────────────────────────────────────────── */

export interface AppFrameCrumb {
  label: string
  /** A link back to that place. */
  href?: string
  /** Or a press. */
  onClick?: () => void
}

export type AppFrameStatusLineProps = Omit<React.ComponentProps<"header">, "children"> & {
  /** Where you are, outermost first: "Mail", "Inbox". Every crumb but the last is the way back to its place. */
  crumbs?: AppFrameCrumb[]
  /** One Badge after the crumbs (Synapse's SAMPLE). */
  badge?: React.ReactNode
  /**
   * The leading slot: a back button. Default: the frame's own, while a detail is pushed at medium
   * width (decisions §14). `false` keeps it empty.
   */
  back?: AppFrameBack | false
  /** Up to two `StatusItem`s at the end: the live one first, then the screen's own fact. */
  children?: React.ReactNode
}

function Crumbs({ crumbs, badge }: { crumbs: AppFrameCrumb[]; badge?: React.ReactNode }) {
  return (
    <nav data-slot="app-frame-crumbs" aria-label="Breadcrumb" className="flex min-w-0 items-center gap-3">
      <ol className="type-overline flex min-w-0 items-center text-text-body">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1
          const link = !last && (crumb.href || crumb.onClick)
          const crumbClass = "hit-area truncate rounded-sm underline-offset-4 hover:underline"
          return (
            <li key={`${i}-${crumb.label}`} className={cn("flex min-w-0 items-center", last ? "shrink" : "shrink-0")}>
              {i > 0 ? (
                <span aria-hidden="true" className="whitespace-pre">
                  {" // "}
                </span>
              ) : null}
              {link && crumb.href ? (
                <a href={crumb.href} className={crumbClass}>
                  {crumb.label}
                </a>
              ) : link ? (
                <ButtonPrimitive onClick={crumb.onClick} className={crumbClass}>
                  {crumb.label}
                </ButtonPrimitive>
              ) : (
                <span className="truncate" aria-current={last ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </li>
          )
        })}
      </ol>
      {badge ? <span className="inline-flex shrink-0">{badge}</span> : null}
    </nav>
  )
}

/**
 * AppFrameStatusLine (contract 5.1a): the desktop top line of the sidebar apps: the breadcrumb at
 * the start in body ink, the status at the end in label ink, both in the overline role, over a
 * hairline (Vale Desktop / 01: crumbs at y 28, the rule at y 63, from x 276 to 1392). At medium
 * width a pushed detail's back button takes the leading slot.
 */
function AppFrameStatusLine({ crumbs, badge, back, className, children, ...props }: AppFrameStatusLineProps) {
  const frame = useAppFrame()
  if (frame.phone) return null
  const way = back === false ? null : (back ?? frame.back)
  return (
    <header
      data-slot="app-frame-status-line"
      className={cn("flex h-16 min-w-0 items-center gap-6 pt-2 rule-b [grid-area:header]", className)}
      {...props}
    >
      {way ? <FloatButton label={way.label} icon="arrow--left" onClick={way.onBack} /> : null}
      {crumbs?.length ? <Crumbs crumbs={crumbs} badge={badge} /> : null}
      <div data-slot="app-frame-status-line-status" className="ms-auto flex min-w-0 items-center gap-6">
        {children}
      </div>
    </header>
  )
}

/* ── Warpcore's top bar ──────────────────────────────────────────────────────────────────────── */

/**
 * What the top bar gives up when it runs out of room, in Warpcore's order (U-01), as data
 * attributes on the bar: the status's short form, the wordmark, the primary's word, the tab
 * numbers, the tab words. The bar's own CSS and the status item's read them.
 */
const TOP_BAR_FLAGS = ["data-short-status", "data-no-wordmark", "data-icon-action", "data-no-index", "data-icon-tabs"] as const

/**
 * Fits the bar: from the full form, it gives up one thing at a time until its content fits. It
 * measures the DOM it has drawn and sets attributes only, so no render waits on it; it runs again
 * after every render and whenever the bar's width changes, so it widens back when there is room.
 */
function useCollapseFlags(bar: React.RefObject<HTMLElement | null>, enabled: boolean) {
  const fit = React.useCallback(() => {
    const el = bar.current
    if (!el || !enabled) return
    for (const flag of TOP_BAR_FLAGS) el.removeAttribute(flag)
    let stage = 0
    while (el.scrollWidth > el.clientWidth + 1 && stage < TOP_BAR_FLAGS.length) {
      el.setAttribute(TOP_BAR_FLAGS[stage], "")
      stage += 1
    }
    el.setAttribute("data-stage", String(stage))
  }, [bar, enabled])
  React.useLayoutEffect(fit)
  React.useLayoutEffect(() => {
    const el = bar.current
    if (!el || !enabled || typeof ResizeObserver !== "function") return
    let width = el.clientWidth
    const observer = new ResizeObserver(() => {
      if (el.clientWidth === width) return
      width = el.clientWidth
      fit()
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [bar, enabled, fit])
}

export type AppFrameTopBarProps = Omit<React.ComponentProps<"header">, "children"> & {
  /** `AppLockup`, at the start, in the column the sidebar apps give their sidebar. */
  lockup?: React.ReactNode
  /** `TopTabs` with a `TopTab` per section. */
  tabs?: React.ReactNode
  /** One `StatusItem` (the spend), first in the right cluster. Give it a `short` form. */
  status?: React.ReactNode
  /** The primary Button ("New task"); icon-only when the bar runs out of room. */
  action?: AppFrameAction
  /** Float buttons at the end (search, settings), size m. */
  actions?: React.ReactNode
}

/**
 * AppFrameTopBar: Warpcore's desktop bar (contract 5.2), 64 high over a hairline: the lockup, the
 * top tabs, and on the right the status, the primary Button and the float buttons (Desktop / 01).
 * When it runs out of room (medium width) it gives up room in Warpcore's order (U-01): the status
 * takes its short form; the wordmark hides; the primary becomes an icon-only float button with the
 * same name; the tab numbers hide; the tabs go icon only, keeping their names. The status never hides.
 */
function AppFrameTopBar({ lockup, tabs, status, action, actions, className, ...props }: AppFrameTopBarProps) {
  const frame = useAppFrame()
  const bar = React.useRef<HTMLElement>(null)
  useCollapseFlags(bar, !frame.phone)
  if (frame.phone) return null
  const wide = frame.layout === "expanded"

  return (
    <header
      ref={bar}
      data-slot="app-frame-top-bar"
      className={cn(
        "flex h-16 min-w-0 items-center gap-6 overflow-hidden rule-b [grid-area:header]",
        // What the bar gives up, as the flags say (useCollapseFlags).
        "[&[data-no-wordmark]_[data-slot=app-lockup-name]]:sr-only",
        "[&[data-icon-action]_[data-slot=app-frame-top-bar-action]]:hidden",
        "[&:not([data-icon-action])_[data-slot=app-frame-top-bar-action-icon]]:hidden",
        "[&[data-no-index]_[data-slot=top-tab-index]]:hidden",
        "[&[data-icon-tabs]_[data-slot=top-tab-label]]:sr-only",
        className
      )}
      {...props}
    >
      <div data-slot="app-frame-top-bar-lockup" className={cn("flex shrink-0 items-center", wide && "w-(--c-app-frame-sidebar-width)")}>
        {lockup}
      </div>
      {/* The tabs' own padding is their hit area: pull it back so the first glyph sits on the content's line. */}
      <div data-slot="app-frame-top-bar-tabs" className="-ms-3 flex shrink-0 items-center">
        {tabs}
      </div>
      <div data-slot="app-frame-top-bar-end" className="ms-auto flex shrink-0 items-center gap-6">
        {status}
        <div className="flex items-center gap-3">
          {action ? (
            <>
              <span data-slot="app-frame-top-bar-action" className="inline-flex">
                <Button onClick={action.onClick}>
                  {action.icon ? <Icon name={action.icon} size="sm" /> : null}
                  {action.label}
                </Button>
              </span>
              {/* Out of room: the same action as an icon-only primary float button with the same name. */}
              <span data-slot="app-frame-top-bar-action-icon" className="inline-flex">
                <FloatButton kind="primary" label={action.label} icon={action.icon ?? "add"} onClick={action.onClick} onLongPress={action.onLongPress} longPressLabel={action.longPressLabel} />
              </span>
            </>
          ) : null}
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}

export { AppFrameSidebar, AppFrameStatusLine, AppFrameSwitcher, AppFrameTopBar, StatusItem }
