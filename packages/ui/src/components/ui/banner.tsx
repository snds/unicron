// Owned component (not generated): an inline message at the top of the section it is about: something broke, or news that can wait.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:89; no app PR, no DSA record)
"use client"

import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { Button } from "./button"

/**
 * `critical`: broken, and the person can fix it (decisions §1, channel 4). `info`: news that can
 * wait (channel 5). `warning` and `success` are not drawn in Figma; they use the existing roles.
 */
export type BannerTone = "critical" | "info" | "warning" | "success"
export type BannerSize = "default" | "compact"

/** The glyph each tone draws when no `icon` is given. Each tone has its own shape, so colour never carries it alone. */
export const bannerIcons: Record<BannerTone, IconName> = {
  // Figma's default for the drawn Critical tone.
  critical: "warning--alt",
  // A circled i. Figma's Info tone keeps the warning triangle only because the 57 had no other.
  info: "information",
  // A circled !, so a warning never shares the critical triangle.
  warning: "warning",
  success: "checkmark--outline",
}

const banner = cva(
  // Edges are inset, so the banner is as tall as its content. Children centre, as drawn.
  "group/banner flex min-w-0 items-center rounded-lg",
  {
    variants: {
      tone: {
        critical: "bg-critical-soft inset-ring inset-ring-critical-fill",
        info: "bg-surface-raised rule-box",
        warning: "bg-surface-raised inset-ring inset-ring-warning",
        success: "bg-surface-raised inset-ring inset-ring-success",
      },
      size: {
        // As drawn: 12 / 16 padding, 12 gap, a 20px icon.
        default: "gap-3 px-4 py-3",
        // Inside a form, a pane or a dialog: 8 / 12 padding, 8 gap, a 16px icon, one caption paragraph.
        compact: "gap-2 px-3 py-2",
      },
    },
    defaultVariants: { tone: "critical", size: "default" },
  }
)

const ICON_INK: Record<BannerTone, string> = {
  critical: "text-critical-text",
  info: "text-foreground",
  warning: "text-warning",
  success: "text-success-foreground",
}

export type BannerProps = Omit<React.ComponentProps<"div">, "title" | "role"> & {
  /** Default `critical`, Figma's default. */
  tone?: BannerTone
  /** `default` as drawn, or `compact` for a notice inside a form, a pane or a dialog. Its text wraps and is never cut. */
  size?: BannerSize
  /** The glyph. Default per tone (`bannerIcons`); `null` draws none. */
  icon?: IconName | null
  /** What happened, in a few words ("Sync failed"). In ui/emphasis; in the compact size, the start of the sentence. */
  title?: React.ReactNode
  /** What it means and what to do, in the caption role. `children` is the same slot. */
  body?: React.ReactNode
  /** The one way to fix it: a `Button variant="secondary" size="sm"` ("Sign in", "Try again"). */
  action?: React.ReactNode
  /** Show a close button that calls this. For news that can wait (decisions §1). */
  onDismiss?: () => void
  /** The close button's name. Default "Dismiss". */
  dismissLabel?: string
}

/**
 * Banner: Figma's Banner. A message about the section it sits at the top of: an icon, a title, a
 * line of body, one action, and an optional close button. Critical is `role="alert"` (said at
 * once); the other tones are `role="status"` (said when the reader is free).
 */
function Banner({
  tone = "critical",
  size = "default",
  icon,
  title,
  body,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  children,
  ...props
}: BannerProps) {
  const compact = size === "compact"
  const glyph = icon === undefined ? bannerIcons[tone] : icon
  const text = body ?? children
  return (
    <div
      role={tone === "critical" ? "alert" : "status"}
      data-slot="banner"
      data-tone={tone}
      data-size={size}
      className={cn(banner({ tone, size }), className)}
      {...props}
    >
      {glyph ? (
        <span data-slot="banner-icon" className={cn("inline-flex shrink-0", ICON_INK[tone])}>
          <Icon name={glyph} size={compact ? "sm" : "md"} />
        </span>
      ) : null}
      {compact ? (
        // One paragraph: the title starts the sentence in body ink, so the size stays 13/20.
        <p data-slot="banner-text" className="type-caption text-support-foreground min-w-0 flex-1">
          {title ? (
            <span data-slot="banner-title" className="text-foreground">
              {title}{" "}
            </span>
          ) : null}
          {text}
        </p>
      ) : (
        <div data-slot="banner-text" className="flex min-w-0 flex-1 flex-col">
          {title ? (
            <p data-slot="banner-title" className="type-ui-emphasis text-foreground">
              {title}
            </p>
          ) : null}
          {text ? (
            <p data-slot="banner-body" className="type-caption text-support-foreground">
              {text}
            </p>
          ) : null}
        </div>
      )}
      {action ? (
        <div data-slot="banner-action" className="flex shrink-0 items-center">
          {action}
        </div>
      ) : null}
      {onDismiss ? (
        <Button variant="ghost" size="icon-sm" aria-label={dismissLabel} onClick={onDismiss}>
          <Icon name="close" />
        </Button>
      ) : null}
    </div>
  )
}

export { Banner, banner as bannerVariants }
