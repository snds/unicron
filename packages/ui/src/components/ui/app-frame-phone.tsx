// Owned component (not generated): the phone's floating chrome: the top row, the bottom row (tabs or a detail screen's actions), the status-strip slot and the scroll edges; the trailing column on a short screen.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, drawn on every app's phone frames and "States 02" boards; contract 5.2, 5.1b #2, #11; no app PR, no DSA record)
"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { mergeProps } from "@base-ui/react/merge-props"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Accessory, type AccessoryProps } from "./accessory"
import { AppFrameTabBarContext, readLength, stripStateFor, useAppFrame } from "./app-frame-context"
import type { PageHeadSwitcher } from "./page-head"
import { TopBar } from "./top-bar"

/**
 * Reports an element's height as what the content must keep clear of at one edge, while it shows.
 * `extra` is a knob added to it (the bottom fade), plus `pad` px of air.
 */
function useClearance(el: HTMLElement | null, edge: "top" | "bottom", active: boolean, extra: string | null, pad: number) {
  const { setClearance } = useAppFrame()
  React.useLayoutEffect(() => {
    if (!el || !active) return
    const measure = () => {
      const more = extra ? readLength(el, extra, 0) : 0
      setClearance(edge, Math.round(el.getBoundingClientRect().height + more + pad))
    }
    measure()
    if (typeof ResizeObserver !== "function") return () => setClearance(edge, 0)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => {
      observer.disconnect()
      setClearance(edge, 0)
    }
  }, [el, active, edge, extra, pad, setClearance])
}

/* ── Scroll edge ─────────────────────────────────────────────────────────────────────────────── */

export type AppFrameScrollEdgeProps = React.ComponentProps<"div"> & {
  /**
   * `top`: the solid ground under the top row (content scrolls under it and is gone). `bottom`:
   * the fade above the bottom row: content fades into the ground over `--c-app-frame-scroll-edge`
   * (80) and the ground is solid from 16 above the chrome down (Vale Mobile / 01, y 640 to 720).
   */
  edge: "top" | "bottom"
}

/**
 * AppFrameScrollEdge (rules.md 6.6): content fades into the ground under the floating rows. A masked
 * fill of `surface-ground`, never a blur and never a painted gradient, so it is the theme's ground
 * in all eight modes; the mask is written for WebKit too. The top and bottom rows draw their own;
 * place one yourself only under other floating chrome. It sits behind its row and takes no presses.
 */
function AppFrameScrollEdge({ edge, className, ...props }: AppFrameScrollEdgeProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="app-frame-scroll-edge"
      data-edge={edge}
      className={cn(
        "pointer-events-none absolute inset-x-0 -z-10 bg-surface-ground",
        edge === "top"
          ? "inset-y-0"
          : "bottom-0 -top-[calc(var(--c-app-frame-scroll-edge)+--spacing(4))] [mask-image:linear-gradient(to_bottom,transparent,black_var(--c-app-frame-scroll-edge))] [-webkit-mask-image:linear-gradient(to_bottom,transparent,black_var(--c-app-frame-scroll-edge))]",
        className
      )}
      {...props}
    />
  )
}

/* ── Top row ─────────────────────────────────────────────────────────────────────────────────── */

export type AppFrameTopRowProps = Omit<React.ComponentProps<"div">, "title" | "children"> & {
  /** `AppLockup`, at the start. The frame hides its wordmark once the page has scrolled (the mark stays). */
  lockup?: React.ReactNode
  /** One or two `FloatButton`s (size `l`) at the end: profile or settings (rules.md 6.2). */
  actions?: React.ReactNode
  /**
   * The small centred title once the page has scrolled. Default: the title of the
   * `AppFramePageHead` in the column that shows.
   */
  title?: string
  /** The small title as the switcher (decisions §7). Default: the page head's switcher. */
  switcher?: PageHeadSwitcher
  /**
   * The row's content instead of lockup and actions: a pushed screen's `TopBar` (back, actions).
   * A `TopBar` with no `title` gets the page head's title once the page has scrolled.
   */
  children?: React.ReactNode
}

/** The small centred title: the page's name, or the switcher button. The page head below stays the h1. */
function SmallTitle({ title, switcher }: { title: string; switcher?: PageHeadSwitcher }) {
  if (!switcher) {
    return (
      <p data-slot="app-frame-top-row-title" aria-hidden="true" className="type-subtitle motion-pop min-w-0 truncate text-center text-text-body">
        {title}
      </p>
    )
  }
  const { label, onSwipe: _onSwipe, ...buttonProps } = switcher
  return (
    <ButtonPrimitive
      data-slot="app-frame-top-row-title"
      {...(mergeProps<"button">(buttonProps as React.ComponentProps<"button">, { "aria-label": `${title}, ${label}` }) as ButtonPrimitive.Props)}
      className="motion-pop hit-area flex min-w-0 items-center justify-center gap-1 rounded-sm px-2 py-1 text-text-body transition-[background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover active:bg-state-pressed"
    >
      <span className="type-subtitle truncate">{title}</span>
      <span aria-hidden="true" className="inline-flex text-text-label">
        <Icon name="chevron--down" size="sm" />
      </span>
    </ButtonPrimitive>
  )
}

/**
 * AppFrameTopRow: the phone's floating top row (rules.md 6.2): `AppLockup` at the start, one or two
 * float buttons at the end, 48 high, 16 from the screen's sides, over the solid ground. Once the
 * page has scrolled (the frame's minimized state) the wordmark hides, the page's small title
 * shows centred, and a hairline appears under the row (the "States 02" boards).
 *
 * On a short screen there is no top row (Warpcore U-03): its buttons move to the top of the
 * trailing column, and a `TopBar` passed as children stays at the top of the content.
 * It hides while a keyboard leaves too little room.
 */
function AppFrameTopRow({ lockup, actions, title, switcher, children, className, ...props }: AppFrameTopRowProps) {
  const frame = useAppFrame()
  const [band, setBand] = React.useState<HTMLDivElement | null>(null)
  const rail = frame.layout === "rail"
  const shows = frame.phone && !frame.tight
  const hasChildren = children !== undefined && children !== null
  // On a short screen with nothing at the top of the content, the band is only the 16 above it:
  // the page head's small title sits there, level with the trailing column's first button.
  const bare = rail && !hasChildren
  // The content starts 16 below the row: the band reaches 12 below it, so 4 more.
  useClearance(band, "top", shows, null, bare ? 0 : 4)
  if (!shows) return null

  const minimized = frame.minimized
  const smallTitle = title ?? frame.head?.title
  const smallSwitcher = title !== undefined ? switcher : (switcher ?? frame.head?.switcher)

  let content: React.ReactNode
  if (hasChildren) {
    // A pushed screen's TopBar: the head's title arrives in it once the head has scrolled away.
    content =
      React.isValidElement<React.ComponentProps<typeof TopBar>>(children) && children.type === TopBar && children.props.title === undefined
        ? React.cloneElement(children, { title: minimized ? smallTitle : undefined })
        : children
  } else if (!rail) {
    const mark =
      React.isValidElement<{ showName?: boolean }>(lockup) && lockup.props.showName === undefined
        ? React.cloneElement(lockup, { showName: !minimized })
        : lockup
    content = (
      <div
        data-slot="app-frame-top-row-bar"
        // The ends size to what they hold and share what is left; the middle takes at most its text.
        className="grid h-control min-w-0 grid-cols-[minmax(max-content,1fr)_minmax(0,max-content)_minmax(max-content,1fr)] items-center gap-2"
      >
        {/* A lockup inside the app's own component hides its wordmark by this rule instead. */}
        <div className={cn("flex min-w-0 items-center justify-start", minimized && "[&_[data-slot=app-lockup-name]]:sr-only")}>{mark}</div>
        {minimized && smallTitle ? <SmallTitle title={smallTitle} switcher={smallSwitcher} /> : <span aria-hidden="true" />}
        <div data-slot="app-frame-top-row-actions" className="flex items-center justify-end gap-2">
          {actions}
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        ref={setBand}
        data-slot="app-frame-top-row"
        data-minimized={minimized ? "" : undefined}
        className={cn(
          // The solid ground the content scrolls under (the top scroll edge): on the row itself, so
          // its hairline, an inset shadow, is not covered by a child's fill.
          "absolute inset-x-0 top-0 z-20 bg-surface-ground px-4",
          !bare && "pb-3",
          // 16 from the top of the screen, or 4 below the status bar where there is one (Figma: y 52).
          "pt-[max(--spacing(1),calc(--spacing(4)-env(safe-area-inset-top)))]",
          // Once the page has scrolled under it, a hairline (States 02: y 111).
          "transition-[box-shadow] duration-(--motion-fast) ease-(--motion-ease)",
          minimized && "rule-b",
          rail && "end-20",
          className
        )}
        {...props}
      >
        {content}
      </div>
      {rail && actions && frame.rail.top ? createPortal(actions, frame.rail.top) : null}
    </>
  )
}

/* ── Bottom row ──────────────────────────────────────────────────────────────────────────────── */

export type AppFrameBottomRowProps = Omit<React.ComponentProps<"div">, "children"> & {
  /**
   * `tabs` (a section's root, rules.md 6.3): search, the tab bar filling, create. `detail` (a
   * pushed screen, contract 5.1b #2): `start`, `fill`, `end`, no tab bar. Default: `tabs` when
   * there is a tab bar.
   */
  variant?: "tabs" | "detail"
  /** `tabs`: the search `FloatButton` (size `l`). `detail`: up to two neutral float buttons. */
  start?: React.ReactNode
  /** The `TabBar` (or the app's component holding it). The row drives its `minimized` (scrolled) and `orientation` (short screen) unless you set them. */
  tabs?: React.ReactNode
  /** `detail`: what fills the row between the ends: a `Composer`, or nothing. */
  fill?: React.ReactNode
  /** `tabs`: the create `FloatButton` (size `l`, primary). `detail`: one primary float button, or an extended one. */
  end?: React.ReactNode
}

/**
 * AppFrameBottomRow: the phone's floating bottom row, 48 high, 8 between its parts, 16 from the
 * screen's sides and clear of the home bar (Figma: x 16 to 374, y 760 to 808), over the bottom
 * scroll edge. The status strip (`AppFrameAccessory`) sits above it, or inside it once the page has
 * scrolled, after the tab bar shrunk to the active tab: never more than two bars at the bottom.
 *
 * - While a keyboard is up the `tabs` row and the strip step aside, so the content and a focused
 *   field have the room; a `detail` row stays on the keyboard, so a composer is where you type.
 * - On a short screen the buttons and the tab bar (turned vertical) stand in the trailing column,
 *   and the strip and `fill` sit at the foot of the content.
 */
function AppFrameBottomRow({ variant, start, tabs, fill, end, className, ...props }: AppFrameBottomRowProps) {
  const frame = useAppFrame()
  const kind = variant ?? (tabs ? "tabs" : "detail")
  const rail = frame.layout === "rail"
  const shows = frame.phone && !(frame.keyboardOpen && kind === "tabs")
  const [dock, setDock] = React.useState<HTMLDivElement | null>(null)
  const [above, setAbove] = React.useState<HTMLDivElement | null>(null)
  const [inside, setInside] = React.useState<HTMLDivElement | null>(null)
  const [bar, setBar] = React.useState<HTMLDivElement | null>(null)
  const { setBottom, setBottomBar } = frame

  React.useLayoutEffect(() => {
    if (!shows) return
    setBottom({ variant: kind, above: rail ? null : above, inside })
    return () => setBottom(null)
  }, [shows, kind, rail, above, inside, setBottom])

  // The content scrolls clear of the dock and its fade, with 16 of air.
  useClearance(dock, "bottom", shows, "--c-app-frame-scroll-edge", 16)

  // A toast takes the strip's slot just above this bar (C6): the frame measures it.
  React.useLayoutEffect(() => {
    if (!shows || rail || !bar) return
    setBottomBar(bar)
    return () => setBottomBar(null)
  }, [shows, rail, bar, setBottomBar])

  if (!shows) return null

  const minimized = frame.minimized && kind === "tabs"
  // The tab bar reads these as its defaults, wherever it sits in the app's own components.
  const placement = { minimized: rail ? false : minimized, orientation: rail ? ("vertical" as const) : ("horizontal" as const) }
  const tabBar = <AppFrameTabBarContext.Provider value={placement}>{tabs}</AppFrameTabBarContext.Provider>

  const inset = "pb-[max(--spacing(0.5),calc(--spacing(4)-env(safe-area-inset-bottom)))] group-data-[keyboard=open]/frame:pb-2"

  if (rail) {
    return (
      <>
        <div
          ref={setDock}
          data-slot="app-frame-bottom-row"
          data-variant={kind}
          data-layout="rail"
          className={cn("pointer-events-none absolute start-0 end-20 bottom-0 z-20 flex items-end gap-2 px-4", inset, className)}
          {...props}
        >
          <AppFrameScrollEdge edge="bottom" />
          {/* The strip at the start of the content's foot, compact (Warpcore U-03: 190 wide). */}
          <div ref={setInside} data-slot="app-frame-strip" className="pointer-events-auto flex w-48 shrink-0 flex-col empty:hidden [&>*:not(:first-child)]:hidden" />
          {fill ? <div className="pointer-events-auto flex min-w-0 flex-1">{fill}</div> : null}
        </div>
        {frame.rail.bottom
          ? createPortal(
              <>
                {start}
                {tabBar}
                {end}
              </>,
              frame.rail.bottom
            )
          : null}
      </>
    )
  }

  return (
    <div
      ref={setDock}
      data-slot="app-frame-bottom-row"
      data-variant={kind}
      data-minimized={minimized ? "" : undefined}
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 px-4", inset, className)}
      {...props}
    >
      <AppFrameScrollEdge edge="bottom" />
      {/* The status strip's slot, above the row (rules.md 6.4). One strip at a time. */}
      <div ref={setAbove} data-slot="app-frame-strip" className="pointer-events-auto flex flex-col empty:hidden [&>*:not(:first-child)]:hidden" />
      <div ref={setBar} data-slot="app-frame-bottom-row-bar" className="pointer-events-auto flex min-h-control min-w-0 items-end gap-2">
        {start}
        {tabBar}
        {/* Scrolled: the strip, compact, takes the room the tab bar gave up. */}
        <div ref={setInside} data-slot="app-frame-bottom-row-strip" className="contents [&>*:not(:first-child)]:hidden" />
        {fill ? <div data-slot="app-frame-bottom-row-fill" className="flex min-w-0 flex-1">{fill}</div> : null}
        {end}
      </div>
    </div>
  )
}

/* ── Status strip ────────────────────────────────────────────────────────────────────────────── */

export type AppFrameAccessoryProps = AccessoryProps & {
  /**
   * Only once the page has scrolled: the place strip Vale and Synapse draw in the scrolled bottom row
   * when nothing is live ("INBOX // 012 UNREAD" over the newest subject).
   */
  scrolledOnly?: boolean
}

/**
 * AppFrameAccessory: the phone's status-strip slot (rules.md 6.4): an `Accessory`, placed by the
 * frame. Above the bottom row, full width, 8 above it (Warpcore Mobile / 06: y 704 to 752); once the
 * page has scrolled, inside the row in its compact form; with no bottom row, alone at the foot,
 * 16 from each side. On a short screen it is compact at the foot of the content. It steps aside
 * while a keyboard is up, and on a desktop it draws nothing: live status there is the status
 * line's `StatusItem`. One strip at a time: the app picks it by its priority.
 *
 * Toasts (contract 5.1c C6) take this slot too, and the strip says what it means for them: one
 * with an action (undo send) is never covered, so toasts wait; one without gives way for the
 * toast's time; a needs-you (or critical) strip never gives way, so the toast sits under the top row.
 */
function AppFrameAccessory({ scrolledOnly = false, compact, className, ...props }: AppFrameAccessoryProps) {
  const frame = useAppFrame()
  const [alone, setAlone] = React.useState<HTMLDivElement | null>(null)
  const slots = frame.bottom
  const shows = frame.phone && !frame.keyboardOpen && (!scrolledOnly || frame.minimized)
  const inRow = Boolean(slots) && (frame.layout === "rail" || (frame.minimized && slots?.variant === "tabs"))
  useClearance(alone, "bottom", shows && !slots, "--c-app-frame-scroll-edge", 16)

  // The frame tells the Toaster what this strip means for a toast (C6).
  const id = React.useId()
  const hasAction = props.action !== undefined && props.action !== null && props.action !== false
  const state = stripStateFor(props.tone, hasAction)
  const { setStrip } = frame
  React.useLayoutEffect(() => {
    if (!shows) return
    setStrip(id, state)
    return () => setStrip(id, null)
  }, [shows, id, state, setStrip])

  if (!shows) return null

  // A strip with no action gives way while a toast takes its slot, then comes back (C6). In the
  // row it is out of the slot's way, so it stays.
  const yields = state === "live" && frame.toastShowing && !inRow
  const strip = (
    <Accessory
      compact={compact ?? inRow}
      className={cn(className, yields && "invisible")}
      data-yield={yields ? "" : undefined}
      aria-hidden={yields || undefined}
      inert={yields || undefined}
      {...props}
    />
  )
  if (slots) {
    const target = inRow ? slots.inside : slots.above
    return target ? createPortal(strip, target) : null
  }
  return (
    <div
      ref={setAlone}
      data-slot="app-frame-strip"
      className={cn(
        "absolute inset-x-0 bottom-0 z-20 flex flex-col px-4 pb-[max(--spacing(0.5),calc(--spacing(4)-env(safe-area-inset-bottom)))]",
        frame.layout === "rail" && "end-20"
      )}
    >
      <AppFrameScrollEdge edge="bottom" />
      {strip}
    </div>
  )
}

export { AppFrameAccessory, AppFrameBottomRow, AppFrameScrollEdge, AppFrameTopRow }
