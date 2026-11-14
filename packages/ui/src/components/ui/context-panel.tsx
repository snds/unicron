// Owned component (not generated): the context panel beside a conversation: open with its tabs, collapsed to a rail with counts, or hidden; a sheet on a phone; an artifact can take its place.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Warpcore chat workspace frames 45:2087 to 45:4070 and 47:3223 to 47:3773; DR §7; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import type { IconName } from "../icon"
import { useAppFrame } from "./app-frame-context"
import { FloatButton } from "./float-button"
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
 * - `open`: a tab strip drawn as Filter Chips (square, the overline role, the active one inverted
 *   ink) with tab semantics (a `tablist`, arrow keys, Home and End), the collapse float button at
 *   its end, and the panel. 400 wide with a rule at its start.
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
        className={cn("flex h-full min-h-0 shrink-0 flex-col items-center gap-2 pt-2 [[data-column][data-shown]+&]:ps-3 [[data-column][data-shown]+&]:rule-l", className)}
        {...props}
      >
        <FloatButton label={expandLabel} icon="open-panel--right" aria-expanded={false} onClick={() => onStateChange?.("open")} />
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
                onStateChange?.("open")
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
        "flex h-full min-h-0 w-[calc(var(--c-app-frame-context-panel)+--spacing(3))] shrink-0 flex-col pt-2 [[data-column][data-shown]+&]:ps-3 [[data-column][data-shown]+&]:rule-l",
        className
      )}
      {...props}
    >
      <div data-slot="context-panel-head" className="flex items-center gap-3 pb-4">
        <div
          ref={listRef}
          data-slot="context-panel-tabs"
          role="tablist"
          aria-label={label}
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
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
                  // Figma 15:503 Filter Chip: 24 high, 4 / 8 padding, square corners, the overline role.
                  "type-overline hit-area inline-flex h-6 shrink-0 items-center px-2 py-1 whitespace-pre transition-[color,background-color] duration-(--motion-fast) ease-(--motion-ease)",
                  active
                    ? "bg-text-body text-surface-ground"
                    : "text-text-label hover:bg-state-hover hover:text-text-body active:bg-state-pressed"
                )}
              >
                {tab.count !== undefined ? `${tab.label} ${formatNavCount(tab.count)}` : tab.label}
              </ButtonPrimitive>
            )
          })}
        </div>
        {pinned ? null : <FloatButton label={collapseLabel} icon="open-panel--filled--right" aria-expanded={true} onClick={() => onStateChange?.("rail")} />}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        data-slot="context-panel-body"
        aria-labelledby={tabId(value)}
        tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {children}
      </div>
    </aside>
  )
}

export { ContextPanel }
