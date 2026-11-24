// Owned component (not generated): the context panel beside a conversation: open with its tabs, collapsed to a rail with counts, or hidden; a sheet on a phone; an artifact can take its place.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Warpcore chat workspace frames 45:2087 to 45:4070 and 47:3223 to 47:3773; DR §7; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import type { IconName } from "../icon"
import { useAppFrame } from "./app-frame-context"
import { FloatButton } from "./float-button"
import { IconButton } from "../icon-button"
import { Rail, RailItem, formatNavCount, rovingTarget } from "./rail"

/** One tab of the panel: background tasks, artifacts, environments, files (DR §7). */
export interface ContextPanelTab {
  value: string
  /** As written ("Tasks"); the chip sets the capitals. */
  label: string
  /** The rail's glyph for it. */
  icon: IconName
  /** How many: in the chip after the label, under the glyph in the rail (decisions §13). */
  count?: number
  /** Something there runs now: the rail item takes the live ink (Figma's Rail Item "Alert"). */
  live?: boolean
  /** Words for the live state, joined to the rail item's name. Default "live". */
  liveLabel?: string
}

/** `open`: the tabs and the panel. `rail`: icons and counts, 48 wide. `hidden`: nothing (the chat-only focus). */
export type ContextPanelState = "open" | "rail" | "hidden"

export type ContextPanelProps = Omit<React.ComponentProps<"aside">, "children"> & {
  /** The panel's name. Default "Context". */
  label?: string
  /** Controlled: the app keeps it (Warpcore remembers it). */
  state: ContextPanelState
  /** The panel's own controls ask for `rail` (collapse) and `open` (expand, or a rail item). */
  onStateChange?: (state: ContextPanelState) => void
  tabs: ContextPanelTab[]
  /** The tab showing. */
  value: string
  onValueChange: (value: string) => void
  /** The showing tab's body. */
  children?: React.ReactNode
  /**
   * A `Composer`, when the panel can be asked questions (Synapse's Ask). It docks under the body,
   * 12 in from the sides and the bottom (Figma Right Panel 127:460).
   */
  composer?: React.ReactNode
  /**
   * On a phone and at medium width the same content is a sheet the app owns and passes here (a
   * `Sheet` with its `SheetContent`); the panel draws nothing else there (DR §7).
   */
  sheet?: React.ReactNode
  /**
   * An artifact open beside the chat takes the panel's place (chat workspace 06), at the beside
   * width (696). Narrower than expanded it covers the content as a pushed screen.
   */
  artifact?: React.ReactNode
  /** The collapse control's name. Default "Collapse panel". */
  collapseLabel?: string
  /** The expand control's name. Default "Expand panel". */
  expandLabel?: string
}

/**
 * ContextPanel (contract 5.1, DR §7): what belongs to a conversation, beside it: background tasks,
 * artifacts, environments, files. Three states, driven by the app:
 *
 * - `open`: the 2.0 Right Panel (Figma 127:460). A 48 head of pill tabs with tab semantics (a
 *   `tablist`, arrow keys, Home and End) and a ghost collapse button at its end; the body; and,
 *   when the panel can be asked, a docked `composer`. 360 wide on the ground, a rule at its start.
 * - `rail`: the expand float button over a `Rail` of `RailItem`s: each tab's glyph and count, the
 *   live ink where something runs. Pressing one opens the panel at that tab.
 * - `hidden`: nothing; the conversation takes the room.
 *
 * A column of `AppFrameMain`, after the conversation. In a book-pose fold it is always open, on the
 * far side, with no collapse control.
 */
function ContextPanel({
  label = "Context",
  state,
  onStateChange,
  tabs,
  value,
  onValueChange,
  children,
  composer,
  sheet,
  artifact,
  collapseLabel = "Collapse panel",
  expandLabel = "Expand panel",
  className,
  ...props
}: ContextPanelProps) {
  const frame = useAppFrame()
  const id = React.useId()
  const listRef = React.useRef<HTMLDivElement>(null)
  const beside = frame.split && !frame.phone
  const expandRef = React.useRef<HTMLButtonElement>(null)
  const collapseRef = React.useRef<HTMLButtonElement>(null)
  // Collapsing and expanding swap the panel for another element, so the control that was pressed
  // is gone and focus would fall to the page's body. When one of the panel's own controls asked
  // for the change, focus goes to its counterpart: the expand button after a collapse; the chosen
  // tab (or the collapse button) after an expand. A change the app makes by itself moves nothing.
  const asked = React.useRef(false)
  const ask = (next: ContextPanelState) => {
    asked.current = true
    onStateChange?.(next)
  }
  const shownState = !beside || artifact ? null : frame.foldBook ? "open" : state
  React.useEffect(() => {
    if (!asked.current) return
    asked.current = false
    const active = document.activeElement
    if (active && active !== document.body && active.isConnected) return
    if (shownState === "rail") expandRef.current?.focus()
    else if (shownState === "open") (listRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]') ?? collapseRef.current)?.focus()
  }, [shownState])

  if (!beside) {
    if (artifact) {
      return (
        <section data-slot="context-panel-artifact" aria-label={label} className={cn("absolute inset-0 z-10 flex min-h-0 flex-col bg-surface-ground", frame.phone && "pt-(--app-frame-top-clear)")}>
          {artifact}
        </section>
      )
    }
    return <>{sheet ?? null}</>
  }

  if (artifact) {
    return (
      <section
        data-slot="context-panel-artifact"
        data-column="content"
        data-shown=""
        aria-label={label}
        className={cn("flex h-full min-h-0 w-[calc(var(--c-app-frame-beside)+--spacing(6))] shrink-0 flex-col pt-2 [[data-column][data-shown]+&]:ps-6 [[data-column][data-shown]+&]:rule-l", className)}
      >
        {artifact}
      </section>
    )
  }

  const pinned = frame.foldBook
  const shown = pinned ? "open" : state
  if (shown === "hidden") return null

  if (shown === "rail") {
    return (
      <aside
        data-slot="context-panel"
        data-state="rail"
        data-column="side"
        data-shown=""
        aria-label={label}
        // No space of its own above the expand button: it starts on the columns' line, 24 under the
        // top bar's rule (Figma cw-04: the button from y 88 to 132, the first glyph at 149).
        className={cn("flex h-full min-h-0 shrink-0 flex-col items-center gap-2 [[data-column][data-shown]+&]:ps-3 [[data-column][data-shown]+&]:rule-l", className)}
        {...props}
      >
        <FloatButton ref={expandRef} label={expandLabel} icon="open-panel--right" aria-expanded={false} onClick={() => ask("open")} />
        <Rail edge="right" aria-label={label}>
          {tabs.map((tab) => (
            <RailItem
              key={tab.value}
              label={tab.label}
              icon={tab.icon}
              state={tab.live ? "live" : "default"}
              liveLabel={tab.liveLabel}
              mark={tab.count}
              onClick={() => {
                onValueChange(tab.value)
                ask("open")
              }}
            />
          ))}
        </Rail>
      </aside>
    )
  }

  const panelId = `${id}-panel`
  const tabId = (v: string) => `${id}-tab-${v}`
  const select = (next: string) => {
    if (next !== value) onValueChange(next)
  }

  return (
    <aside
      data-slot="context-panel"
      data-state="open"
      data-column="side"
      data-shown=""
      aria-label={label}
      className={cn(
        // 2.0 Right Panel (Figma 127:460): one panel for every app, 360 wide on the ground, a rule
        // at its start. The head, body and dock keep their own padding.
        "bg-surface-ground flex h-full min-h-0 w-(--c-app-frame-context-panel) shrink-0 flex-col [[data-column][data-shown]+&]:rule-l",
        className
      )}
      {...props}
    >
      <div data-slot="context-panel-head" className="flex h-12 shrink-0 items-center gap-1 pr-2 pl-3">
        <div
          ref={listRef}
          data-slot="context-panel-tabs"
          role="tablist"
          aria-label={label}
          // One line that scrolls sideways: with counts, four tabs may not fit a 360 panel, and
          // wrapping would push the panel down. Room above and below keeps a 44px touch target.
          className="no-scrollbar flex min-w-0 flex-1 flex-nowrap items-center gap-1 overflow-x-auto overscroll-x-contain pointer-coarse:-my-2 pointer-coarse:py-2"
          onKeyDown={(event) => {
            const items = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[role="tab"]') ?? [])
            const target = rovingTarget(items, document.activeElement as HTMLElement | null, event.key, "horizontal")
            if (!target) return
            event.preventDefault()
            target.focus()
            // Automatic activation: the panel follows the focus.
            if (target.dataset.value) select(target.dataset.value)
          }}
        >
          {tabs.map((tab) => {
            const active = tab.value === value
            return (
              <ButtonPrimitive
                key={tab.value}
                id={tabId(tab.value)}
                role="tab"
                data-slot="context-panel-tab"
                data-value={tab.value}
                data-active={active ? "" : undefined}
                aria-selected={active}
                aria-controls={panelId}
                tabIndex={active ? 0 : -1}
                onClick={() => select(tab.value)}
                className={cn(
                  // Figma Pill Tab (15:498), as Tabs draws it: 28 high, 9 at the sides, the control radius.
                  "type-ui hit-area inline-flex h-control-s shrink-0 items-center gap-1.5 rounded px-2.25 py-1 whitespace-nowrap transition-[color,background-color] duration-(--motion-fast) ease-(--motion-ease)",
                  active
                    ? "type-ui-emphasis bg-surface-selected text-text-body"
                    : "text-text-secondary hover:bg-surface-hover active:bg-surface-selected"
                )}
              >
                {tab.label}
                {tab.count !== undefined ? " " : null}
                {tab.count !== undefined ? <span data-slot="context-panel-tab-count" className="type-caption text-text-label">{formatNavCount(tab.count)}</span> : null}
              </ButtonPrimitive>
            )
          })}
        </div>
        {pinned ? null : (
          <IconButton
            ref={collapseRef}
            size="icon-sm"
            // Open is the panel's resting state, so the button keeps the plain ghost look, not
            // the pressed wash an expanded menu button takes.
            className="aria-expanded:bg-transparent aria-expanded:hover:bg-state-hover aria-expanded:active:bg-state-pressed"
            label={collapseLabel} icon="open-panel--filled--right" aria-expanded={true} onClick={() => ask("rail")} />
        )}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        data-slot="context-panel-body"
        aria-labelledby={tabId(value)}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-2"
      >
        {children}
      </div>
      {composer ? (
        <div data-slot="context-panel-dock" className="shrink-0 px-3 pt-2 pb-3">
          {composer}
        </div>
      ) : null}
    </aside>
  )
}

export { ContextPanel }
