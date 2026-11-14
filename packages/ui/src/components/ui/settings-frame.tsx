// Owned component (not generated): the one Settings page of all four apps: a section list beside one content column on a desktop, a list that pushes each section on a phone.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, cross-app decisions §5, contract 5.1b #13; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import type { IconName } from "../icon"
import { AppFrameDetail, AppFrameInset, AppFrameList } from "./app-frame"
import { useAppFrame } from "./app-frame-context"
import { NavItem, NavSection } from "./nav-item"
import type { NavMarkProp } from "./rail"

export interface SettingsSection {
  value: string
  /** As written, "and" never "&" (decisions §5): "Accounts", "Mail and sending". */
  label: string
  icon?: IconName
  /** The group it belongs to, shown as an overline once there are more than seven sections ("You", "This Mac"). */
  group?: string
  /** The section head's one line ("Where your mail comes from."). */
  description?: string
  /** A mark on its row: the update square on About (decisions §3). */
  mark?: NavMarkProp
}

export type SettingsFrameProps = Omit<React.ComponentProps<"div">, "title"> & {
  /** The section list's name. Default "Settings sections". */
  label?: string
  sections: SettingsSection[]
  /**
   * The open section. `null` on a phone is the list itself; on a desktop the first section shows.
   * The app keeps it (an address such as `/settings/<section>`).
   */
  value: string | null
  onValueChange: (value: string | null) => void
  /**
   * "Find a setting": the app's `SearchField`, shown above the list from ten sections up
   * (decisions §5). Hidden with fewer.
   */
  search?: React.ReactNode
  /** On a phone, the rows the frame draws first (the drawn Settings rows), above the full section list. */
  overview?: React.ReactNode
  /** The page's head above the section list (Vale T0: `AppFramePageHead` "Settings // Personal + Work", "Settings"). */
  head?: React.ReactNode
  /** The open section's rows: `FieldRow`, `ToggleRow`, `SectionHeader`. */
  children?: React.ReactNode
}

/** Groups in the order they first appear; one unnamed group when there are seven sections or fewer. */
function grouped(sections: SettingsSection[]): { title?: string; items: SettingsSection[] }[] {
  if (sections.length <= 7) return [{ items: sections }]
  const groups: { title?: string; items: SettingsSection[] }[] = []
  for (const section of sections) {
    const title = section.group ?? "More"
    const group = groups.find((g) => g.title === title)
    if (group) group.items.push(section)
    else groups.push({ title, items: [section] })
  }
  return groups
}

/**
 * SettingsFrame (decisions §5, contract 5.1b #13): one Settings for all four apps, made of the
 * frame's own columns.
 *
 * - Expanded: the section list (204) beside one content column up to 720; the section head is its
 *   title and one line. Past seven sections the list is grouped under overlines.
 * - Phone and medium: the drawn Settings rows first (`overview`), then the whole section list;
 *   each section pushes, and the app's `TopBar` back (or the status line's) returns with
 *   `onValueChange(null)`.
 * - "Find a setting" (`search`) from ten sections up.
 *
 * Place it in `AppFrameMain`.
 */
function SettingsFrame({ label = "Settings sections", sections, value, onValueChange, search, overview, head, className, children, ...props }: SettingsFrameProps) {
  const frame = useAppFrame()
  const shownValue = value ?? (frame.split ? (sections[0]?.value ?? null) : null)
  const current = sections.find((s) => s.value === shownValue)
  const groups = grouped(sections)
  const findable = sections.length >= 10 && search

  const list = (
    <nav aria-label={label} data-slot="settings-frame-nav" className={cn("flex flex-col gap-7", frame.split && "w-(--c-app-frame-settings-list)")}>
      {groups.map((group, i) => {
        const items = group.items.map((section) => (
          <NavItem
            key={section.value}
            label={section.label}
            icon={section.icon}
            mark={section.mark}
            current={frame.split && section.value === shownValue}
            onClick={() => onValueChange(section.value)}
          />
        ))
        return group.title ? (
          <NavSection key={group.title} title={group.title}>
            {items}
          </NavSection>
        ) : (
          <ul key={i} role="list" className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.key}>{item}</li>
            ))}
          </ul>
        )
      })}
    </nav>
  )

  return (
    <div data-slot="settings-frame" className={cn("contents", className)} {...props}>
      <AppFrameList size="narrow" aria-label={label} className={cn(frame.split && "w-[calc(var(--c-app-frame-settings-list)+--spacing(3)+var(--column-start-room,0px))]")}>
        {head}
        {!frame.split && overview ? <div data-slot="settings-frame-overview" className="pb-8">{overview}</div> : null}
        <AppFrameInset className="flex flex-col gap-6">
          {findable ? <div data-slot="settings-frame-search">{search}</div> : null}
          {list}
        </AppFrameInset>
      </AppFrameList>
      <AppFrameDetail open={value !== null} onBack={() => onValueChange(null)} aria-label={current?.label}>
        {current ? (
          <div data-slot="settings-frame-content" className="flex max-w-(--c-app-frame-reading) flex-col">
            <AppFrameInset data-slot="settings-frame-head" className="flex flex-col gap-1 pb-8">
              <h2 className="type-title text-text-body">{current.label}</h2>
              {current.description ? <p className="type-body text-text-secondary">{current.description}</p> : null}
            </AppFrameInset>
            {children}
          </div>
        ) : null}
      </AppFrameDetail>
    </div>
  )
}

export { SettingsFrame }
