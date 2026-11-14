// Owned component (not generated): the desktop top bar's sections as links: index, label, an optional icon, and a 2px indicator under the current one.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 15:498; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { NavMark, nameWithMark, resolveNavMark, type NavMarkProp } from "./rail"

export type TopTabsProps = React.ComponentProps<"nav"> & {
  /** What the tabs are, for assistive tech ("Sections"). */
  label: string
}

/**
 * TopTabs: the sections of an app with a desktop top bar (Warpcore). A `nav` of `TopTab` links,
 * 8px apart: with each tab's 12px side padding the labels sit 32px apart, as the frames draw them.
 * Tab moves along them; each is a link, so the browser and assistive tech treat them as places.
 */
function TopTabs({ label, className, ...props }: TopTabsProps) {
  return <nav data-slot="top-tabs" aria-label={label} className={cn("flex items-center gap-2", className)} {...props} />
}

export type TopTabProps = Omit<useRender.ComponentProps<"a">, "children" | "aria-label"> & {
  /** The section's name, as written; the overline sets the capitals. */
  label: string
  /** The section's number ("01"), in faint ink before the label. Not read out. */
  index?: string
  /** A 16px glyph first in the row. */
  icon?: IconName
  /** The section showing: body ink, the 2px primary indicator, and `aria-current="page"`. */
  current?: boolean
  /** A count or a square after the label (the mark every navigation item shares): Warpcore's Tasks count in the needs-you tone. */
  mark?: NavMarkProp
}

/**
 * TopTab: one section (Figma 15:498). A row of icon (16), index and label in the overline role, 6px
 * apart, and under it, 6px down, a 2px indicator as wide as the row: the primary fill when current,
 * nothing otherwise. Figma's tab has no padding, so its hit area would be 24px; here 12px of padding
 * on every side makes it 48 high without moving the drawn parts. Hover and pressed take the
 * contract's washes (§6), and the label and icon go to body ink.
 */
function TopTab({ label, index, icon, current = false, mark, render, className, ...props }: TopTabProps) {
  const resolved = resolveNavMark(mark)
  const ink = current ? "text-text-body" : "text-text-label group-hover/top-tab:text-text-body"
  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps<"a">(
      {
        className: cn(
          "group/top-tab inline-flex shrink-0 rounded-sm px-3 py-3 select-none transition-[background-color] duration-(--motion-fast) ease-(--motion-ease) hover:bg-state-hover active:bg-state-pressed",
          className
        ),
        "aria-current": current ? "page" : undefined,
        // The name is the label and the mark's words; the index is a folio, not part of the name.
        "aria-label": nameWithMark(label, resolved),
        children: (
          <span className="flex flex-col gap-1.5">
            <span className={cn("flex items-center gap-1.5 transition-[color] duration-(--motion-fast) ease-(--motion-ease)", ink)}>
              {icon ? <Icon name={icon} size="sm" /> : null}
              {index ? (
                <span data-slot="top-tab-index" aria-hidden="true" className="type-overline text-text-faint">
                  {index}
                </span>
              ) : null}
              <span data-slot="top-tab-label" className={cn("type-overline whitespace-nowrap transition-[color] duration-(--motion-fast) ease-(--motion-ease)", ink)}>
                {label}
              </span>
              <NavMark mark={resolved} placement="inline" type="overline" className={ink} />
            </span>
            <span
              data-slot="top-tab-indicator"
              aria-hidden="true"
              className={cn("h-(--stroke-emphasis) w-full", current ? "bg-primary-fill" : "bg-transparent")}
            />
          </span>
        ),
      } as React.ComponentProps<"a">,
      props
    ),
    state: { slot: "top-tab", current },
  })
}

export { TopTab, TopTabs }
