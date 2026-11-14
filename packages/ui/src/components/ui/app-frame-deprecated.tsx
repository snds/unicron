// Owned component (not generated): deprecated names from the 0.x frame, kept only so code that still imports them compiles while it moves to the 1.0 parts.
// Promoted from: snds/warpcore · PR snds/unicron#68 · DSA none
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import type { IconName } from "../icon"
import { FloatButton } from "./float-button"
import { indicatorLabel, type IndicatorProp } from "./indicator"

/**
 * @deprecated The floating frosted capsule is gone in 1.0. Use `AppFrameBottomRow` with a `TabBar`
 * on a phone, and `AppFrameSidebar` or `AppFrameTopBar` on a desktop. This draws a plain row of
 * float buttons, not floating and not frosted, and will be removed.
 */
function AppFrameNav({ className, ...props }: React.ComponentProps<"nav">) {
  return <nav data-slot="app-frame-nav-deprecated" className={cn("flex gap-2", className)} {...props} />
}

/**
 * @deprecated Use `TabBarItem` (a phone's section) or `NavItem` / `TopTab` (a desktop's place);
 * their `mark` replaces `indicator`. This draws a neutral float button named with its indicator.
 */
function AppFrameNavItem({
  icon,
  label,
  current,
  indicator,
  onClick,
}: {
  icon: IconName
  label: string
  current?: boolean
  indicator?: IndicatorProp
  onClick?: () => void
}) {
  const said = indicatorLabel(indicator)
  return <FloatButton icon={icon} label={said ? `${label}, ${said}` : label} current={current ? "page" : undefined} onClick={onClick} />
}

/** @deprecated The capsule's short-screen extras: put them in `AppFrameTopRow`'s actions, which move to the trailing column on a short screen. */
function AppFrameNavEnd({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="app-frame-nav-end-deprecated" className={cn("flex gap-2", className)} {...props} />
}

export { AppFrameNav, AppFrameNavEnd, AppFrameNavItem }
