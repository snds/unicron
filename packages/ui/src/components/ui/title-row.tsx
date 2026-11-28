// Owned component (not generated): the 2.0 desktop title row every app shares.
// Promoted from: Seeded in snds/unicron (2.0: Figma Title Row 192:589; no app PR, no DSA record)
"use client"

import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { useAppFrame } from "./app-frame-context"

export interface TitleRowCrumb {
  label: string
  /** A breadcrumb parent goes back to its place. Ignored in `kind="settings"`, where it is a plain label. */
  href?: string
  onClick?: () => void
}

export interface TitleRowToggle {
  /** What it does: "Hide sidebar", "Show panel". The name and the tooltip. */
  label: string
  onClick: () => void
  /** The sidebar or the panel is showing. */
  pressed?: boolean
}

export type TitleRowProps = Omit<React.ComponentProps<"header">, "children"> & {
  /**
   * `breadcrumb`: the parent (a link back), a chevron, the current page. `settings`: the Settings
   * location label, "Settings | Page", where the parent is a plain marker, not a link.
   */
  kind?: "breadcrumb" | "settings"
  /** Where you are: the parent (optional; leave it out for a top-level page) and the current page. */
  parent?: TitleRowCrumb
  current: string
  /**
   * Room at the start for the Mac window buttons, which the window draws (a 52px inset). Leave it
   * off on Windows and the web.
   */
  windowButtons?: boolean
  /** The sidebar toggle, before the breadcrumb. */
  sidebarToggle?: TitleRowToggle
  /** A Status Mark and its word, after the breadcrumb. */
  status?: React.ReactNode
  /** Icon Buttons at the end, before the panel toggle (filter, search). */
  actions?: React.ReactNode
  /** The right panel's toggle, last (⌘.). */
  panelToggle?: TitleRowToggle & {
    /** Something in the panel waits on the person: the needs-you dot on the toggle. */
    needsYou?: boolean
  }
}

/**
 * TitleRow: the 2.0 desktop title row (Figma 192:589), 48 tall in every app, over a hairline.
 * From the start: room for the Mac window buttons, the sidebar toggle, the breadcrumb (header size:
 * the parent in crumb 15/500 secondary ink, a chevron in label ink, the current page in subtitle
 * 15/600 body ink), an optional status, then the actions and the panel toggle at the end. 20 in at
 * the start, 12 at the end, 12 between the parts.
 *
 * `kind="settings"` draws the Settings location label: "Settings", a 1 × 16 line/strong rule with
 * 12 each side, the page. The parent there is a marker, not a link, with no hover.
 */
function TitleRow({
  kind = "breadcrumb",
  parent,
  current,
  windowButtons = false,
  sidebarToggle,
  status,
  actions,
  panelToggle,
  className,
  ...props
}: TitleRowProps) {
  const { setBarSlot } = useAppFrame()
  const settings = kind === "settings"
  const parentLink = !settings && parent && (parent.href || parent.onClick)
  const parentClass = "type-crumb min-w-0 truncate text-text-secondary"
  return (
    <header
      data-slot="title-row"
      data-kind={kind}
      className={cn("flex h-12 min-w-0 shrink-0 items-center gap-3 bg-surface-ground ps-5 pe-3 rule-b [grid-area:header]", className)}
      {...props}
    >
      {windowButtons ? <span data-slot="title-row-window-buttons" aria-hidden="true" className="w-13 shrink-0" /> : null}
      {sidebarToggle ? (
        <IconButton
          data-slot="title-row-sidebar-toggle"
          icon="open-panel--left"
          label={sidebarToggle.label}
          size="icon-sm"
          aria-pressed={sidebarToggle.pressed}
          onClick={sidebarToggle.onClick}
        />
      ) : null}
      <nav data-slot="title-row-crumbs" aria-label="Breadcrumb" className="flex min-w-0 items-center">
        <ol className={cn("flex min-w-0 items-center", settings ? "gap-3" : "gap-1")}>
          {parent ? (
            <li className="flex min-w-0 shrink items-center">
              {parentLink && parent.href ? (
                <a href={parent.href} className={cn(parentClass, "hit-area rounded-sm hover:text-text-body")}>
                  {parent.label}
                </a>
              ) : parentLink ? (
                <ButtonPrimitive onClick={parent.onClick} className={cn(parentClass, "hit-area rounded-sm hover:text-text-body")}>
                  {parent.label}
                </ButtonPrimitive>
              ) : (
                <span className={parentClass}>{parent.label}</span>
              )}
            </li>
          ) : null}
          {parent ? (
            <li aria-hidden="true" className="flex shrink-0 items-center">
              {settings ? (
                <span data-slot="title-row-rule" className="h-4 w-px bg-line-strong" />
              ) : (
                <Icon name="chevron--right" size="sm" className="text-text-label" />
              )}
            </li>
          ) : null}
          <li className="flex min-w-0 shrink items-center">
            <span data-slot="title-row-current" aria-current="page" className="type-subtitle min-w-0 truncate text-text-body">
              {current}
            </span>
          </li>
        </ol>
      </nav>
      {status ? (
        <div data-slot="title-row-status" className="flex shrink-0 items-center gap-1.5">
          {status}
        </div>
      ) : null}
      <div data-slot="title-row-end" className="ms-auto flex shrink-0 items-center gap-1">
        {/* A page head marked `bar` puts its actions here (AppFramePageHead): labelled buttons, 8 apart. */}
        <span ref={setBarSlot} data-slot="title-row-page-actions" className="flex items-center gap-2 empty:hidden" />
        {actions}
        {panelToggle ? (
          <IconButton
            data-slot="title-row-panel-toggle"
            icon="open-panel--right"
            label={panelToggle.label}
            shortcut="⌘."
            aria-keyshortcuts="Meta+Period"
            aria-pressed={panelToggle.pressed}
            indicator={panelToggle.needsYou ? { kind: "attention" } : undefined}
            onClick={panelToggle.onClick}
          />
        ) : null}
      </div>
    </header>
  )
}

export { TitleRow }
