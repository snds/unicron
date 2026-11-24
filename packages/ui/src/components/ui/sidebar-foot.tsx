// Owned component (not generated): the 2.0 sidebar foot every app shares.
// Promoted from: Seeded in snds/unicron (2.0: Figma Sidebar Foot 178:4541; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { IconButton } from "../icon-button"
import { AppFrameRailContext } from "./app-frame-context"
import type { IndicatorProp } from "./indicator"
import { InitialTile } from "./initial-tile"

export interface SidebarFootAccount {
  /** The person's name, the row's first line. */
  name: string
  /** One or two letters for the tile. */
  initials: string
  /** Their photo, over the initials once it loads. */
  src?: string
  /** The row's second line: a fact about the account ("$1.20 today", "3 vaults"). */
  meta?: string
  /**
   * Where the row goes (Warpcore: Spend), or what a press does (a switcher's menu). Without either
   * the row is plain text. With `onClick` it draws the switch chevron.
   */
  href?: string
  onClick?: () => void
  /** The row's name when it is a link or a button: "Spend, $1.20 today". Default: the name and the meta. */
  label?: string
  /** The row's page is open. */
  current?: boolean
}

export interface SidebarFootSettings {
  /** Default "Settings". */
  label?: string
  onClick: () => void
  /** Settings is the open page: the whole row takes the selected fill, square to the edges. */
  current?: boolean
  /** Something in Settings wants the person (an update ready): the dot on the button. */
  indicator?: IndicatorProp
  /** The key that opens it, shown in the tooltip ("⌘,"). */
  shortcut?: string
}

/** Settings' name, with the words of its dot when it has one. */
const nameOf = (settings: SidebarFootSettings) => settings.label ?? "Settings"

export type SidebarFootProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** The status line over the rule: an icon and a few words ("Synced just now"). */
  status?: { icon: IconName; text: string }
  account: SidebarFootAccount
  /** A second control before Settings (Lockdown's Lock): an `IconButton` at size `icon-sm`. */
  secondAction?: React.ReactNode
  settings?: SidebarFootSettings
  /** The sidebar's rail: the tile only. Inside `AppFrameSidebar` drawn as its rail it defaults to true. */
  collapsed?: boolean
}

/**
 * SidebarFoot: the foot of every 2.0 sidebar (Figma 178:4541). An optional status line, an edge to
 * edge rule, then the account row: the initials tile, the name over a fact, an optional second
 * control and Settings. While Settings is open the whole row takes the selected fill, square to the
 * sidebar's edges. In the rail it is the tile alone. Place it in `AppFrameSidebar`'s `footer`, which
 * runs it the sidebar's full width.
 */
function SidebarFoot({ status, account, secondAction, settings, collapsed: collapsedProp, className, ...props }: SidebarFootProps) {
  const rail = React.useContext(AppFrameRailContext)
  const collapsed = collapsedProp ?? rail
  const current = Boolean(settings?.current)
  const accountName = account.label ?? (account.meta ? `${account.name}, ${account.meta}` : account.name)
  const tile = <InitialTile size="s" initials={account.initials} src={account.src} name={account.name} />

  if (collapsed) {
    // The rail's foot is the tile alone, and it is the way into Settings (Figma: Collapsed, Current
    // fills it as it fills the whole row). Without Settings it goes where the account row goes.
    const tileClass = "hit-area flex size-10 items-center justify-center rounded-md hover:bg-surface-hover"
    const settingsName = settings ? nameOf(settings) : undefined
    return (
      <div
        data-slot="sidebar-foot"
        data-state={current ? "current" : "default"}
        data-collapsed=""
        className={cn("flex w-full flex-col items-center py-2 rule-t", current && "bg-surface-selected", className)}
        {...props}
      >
        {settings ? (
          <IconButton
            data-slot="sidebar-foot-settings"
            label={settingsName!}
            tooltip={settings.label ?? "Settings"}
            shortcut={settings.shortcut}
            indicator={settings.indicator}
            aria-current={settings.current ? "page" : undefined}
            render={<button type="button" className={tileClass} />}
            onClick={settings.onClick}
          >
            {tile}
          </IconButton>
        ) : account.href ? (
          <a href={account.href} aria-label={account.label} aria-current={account.current ? "page" : undefined} className={tileClass}>
            {tile}
          </a>
        ) : account.onClick ? (
          <button type="button" aria-label={account.label} onClick={account.onClick} className={tileClass}>
            {tile}
          </button>
        ) : (
          <span className="flex size-10 items-center justify-center" title={accountName}>
            {tile}
          </span>
        )}
      </div>
    )
  }

  // The row writes the name beside the tile, so the tile goes unnamed there ("Sean, $1.20 today", not "Sean Sean").
  const rowTile = (
    <span aria-hidden="true" className="contents">
      <InitialTile size="s" initials={account.initials} src={account.src} />
    </span>
  )
  const lines = (
    <span className="flex min-w-0 flex-1 flex-col">
      <span data-slot="sidebar-foot-name" className="type-ui-emphasis truncate text-text-body">
        {account.name}
      </span>
      {account.meta ? (
        <span data-slot="sidebar-foot-meta" className="type-caption truncate text-text-secondary">
          {account.meta}
        </span>
      ) : null}
    </span>
  )
  const accountClass = "hit-area flex min-w-0 flex-1 items-center gap-2.5 rounded-md px-2.5 py-1 text-start"
  return (
    <div
      data-slot="sidebar-foot"
      data-state={current ? "current" : "default"}
      className={cn("flex w-full flex-col", className)}
      {...props}
    >
      {status ? (
        <p data-slot="sidebar-foot-status" className="type-caption flex h-7 items-center gap-1.5 px-5 text-text-label">
          <Icon name={status.icon} size="sm" className="shrink-0" />
          <span className="min-w-0 truncate">{status.text}</span>
        </p>
      ) : null}
      <div data-slot="sidebar-foot-account" className={cn("flex items-center gap-1 py-2 ps-2.5 pe-3 rule-t", current && "bg-surface-selected")}>
        {account.href ? (
          <a
            href={account.href}
            aria-label={account.label}
            aria-current={account.current ? "page" : undefined}
            className={cn(accountClass, "hover:bg-surface-hover")}
          >
            {rowTile}
            {lines}
          </a>
        ) : account.onClick ? (
          <button type="button" aria-label={account.label} onClick={account.onClick} className={cn(accountClass, "hover:bg-surface-hover")}>
            {rowTile}
            {lines}
            <Icon name="chevron--sort" size="sm" className="shrink-0 text-text-label" />
          </button>
        ) : (
          <div className={accountClass}>
            {rowTile}
            {lines}
          </div>
        )}
        {secondAction}
        {settings ? (
          <IconButton
            data-slot="sidebar-foot-settings"
            icon="settings"
            label={settings.label ?? "Settings"}
            size="icon-sm"
            shortcut={settings.shortcut}
            indicator={settings.indicator}
            aria-current={settings.current ? "page" : undefined}
            onClick={settings.onClick}
          />
        ) : null}
      </div>
    </div>
  )
}

export { SidebarFoot }
