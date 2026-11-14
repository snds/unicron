// Owned component (not generated): an attached file as a chip: type tag, name, size; a link or a button, with one trailing action.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, the attachment on the Vale desktop inbox, Figma 53:2398; no app PR, no DSA record)
"use client"

import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Spinner } from "./spinner"

const chip = cva(
  // The Vale frame: a raised surface with a 1px rule, 12 in, 12 between the parts, 44 tall.
  "group/file-chip relative inline-flex max-w-full min-w-0 items-stretch rounded-lg bg-surface-raised text-foreground",
  {
    variants: {
      critical: {
        false: "rule-box",
        // Something is wrong with the file (too big, blocked): the critical edge, and the reason in
        // place of its size. The edge is 2px, the error border fields draw.
        true: "rule-box-emphasis [--rule-color:var(--critical-fill)]",
      },
    },
    defaultVariants: { critical: false },
  }
)

const MAIN = cva(
  "flex min-w-0 flex-1 items-center gap-3 rounded-lg py-3 pl-3 text-left [font:inherit] [color:inherit] [&_img]:pointer-events-none",
  {
    variants: {
      pressable: {
        // A wash over the raised surface while the pointer is on the file, a deeper one pressed.
        true: "cursor-pointer hover:bg-state-hover active:bg-state-pressed aria-busy:cursor-progress",
        false: "",
      },
      trailing: { true: "pr-2", false: "pr-3" },
    },
    defaultVariants: { pressable: false, trailing: false },
  }
)

export type FileChipProps = Omit<React.HTMLAttributes<HTMLElement>, "children" | "onClick"> & {
  /** The file's name as it is ("Pine Hollow booking.pdf"). Ui role; cut in the middle of a long name is the app's call. */
  name: string
  /** The type tag ("PDF"): overline on the primary fill. Default: the name's extension. */
  type?: string
  /** The size as words ("84 KB"), in the meta role. */
  size?: React.ReactNode
  /** A picture of the file in place of the type tag (an image's thumbnail). A URL the app serves, never a `data:` URL. */
  thumbnail?: string
  /** The file is on its way (uploading, saving): a spinner in place of the size, and `aria-busy`. */
  busy?: boolean
  /** What is wrong with the file, in place of its size ("Too big to send"): the critical edge and ink. */
  critical?: React.ReactNode
  /** The chip opens the file: a link. */
  href?: string
  download?: string | boolean
  target?: string
  rel?: string
  /** The chip opens the file: a button (unless `href` is given). */
  onClick?: (event: React.MouseEvent<HTMLElement>) => void
  /** The chip as another element, a router link. */
  mainRender?: useRender.RenderProp
  /** One trailing control: Save, Remove (a ghost Button `size="icon-sm"` with a label). */
  action?: React.ReactNode
}

function extensionOf(name: string) {
  const dot = name.lastIndexOf(".")
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1) : undefined
}

/**
 * FileChip: an attached file (contract 5.1a, 5.1b #30). A type tag (overline on the primary
 * fill) or a thumbnail, the name in the ui role, the size in the meta role, on a raised surface
 * with a hairline. With `href` or `onClick` the file part is one link or button named by the
 * name, type and size; `action` (Save, Remove) is its own button after it, never inside it.
 * `busy` shows a spinner and says `aria-busy`; `critical` says what is wrong in place of the size.
 */
function FileChip({
  name,
  type,
  size,
  thumbnail,
  busy = false,
  critical,
  href,
  download,
  target,
  rel,
  onClick,
  mainRender,
  action,
  className,
  ...props
}: FileChipProps) {
  const id = React.useId()
  const tag = (type ?? extensionOf(name) ?? "File").slice(0, 4)
  const isCritical = critical !== undefined && critical !== null && critical !== false
  const pressable = Boolean(href || onClick || mainRender)
  const hasAction = action !== undefined && action !== null && action !== false
  const element = href || (mainRender && !onClick) ? "a" : pressable ? "button" : "div"

  const parts = (
    <>
      {thumbnail ? (
        <img data-slot="file-chip-thumbnail" src={thumbnail} alt="" className="size-5 shrink-0 object-cover" />
      ) : (
        <span
          data-slot="file-chip-type"
          className={cn(
            "inline-flex h-5 shrink-0 items-center px-1.5 type-overline",
            isCritical ? "bg-critical-fill text-critical-on-fill" : "bg-primary text-primary-foreground"
          )}
        >
          {tag}
        </span>
      )}
      {" "}
      <span id={`${id}-name`} data-slot="file-chip-name" className="min-w-0 truncate type-ui">
        {name}
      </span>
      {" "}
      {busy ? (
        <span data-slot="file-chip-busy" className="inline-flex shrink-0 text-muted-foreground [&_svg]:size-4">
          <span className="sr-only">Working on it</span>
          <Spinner aria-hidden="true" />
        </span>
      ) : isCritical ? (
        <span id={`${id}-size`} data-slot="file-chip-critical" className="shrink-0 type-meta text-critical-text">
          {critical}
        </span>
      ) : size !== undefined && size !== null ? (
        <span id={`${id}-size`} data-slot="file-chip-size" className="shrink-0 type-meta whitespace-nowrap text-muted-foreground">
          {size}
        </span>
      ) : null}
    </>
  )

  const main = useRender({
    defaultTagName: element,
    render: pressable ? mainRender : undefined,
    props: mergeProps<"a">(
      {
        className: MAIN({ pressable, trailing: hasAction }),
        children: parts,
        "aria-busy": busy || undefined,
        ...(pressable
          ? {
              href,
              download: typeof download === "string" ? download : download ? "" : undefined,
              target,
              rel,
              type: element === "button" ? "button" : undefined,
              onClick: onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined,
            }
          : {}),
      },
      {}
    ),
    state: { slot: "file-chip-main" },
  })

  return (
    <div
      data-slot="file-chip"
      data-critical={isCritical || undefined}
      data-busy={busy || undefined}
      className={cn(chip({ critical: isCritical }), className)}
      {...props}
    >
      {main}
      {hasAction ? (
        <span data-slot="file-chip-action" className="inline-flex shrink-0 items-center pr-1.5">
          {action}
        </span>
      ) : null}
    </div>
  )
}

export { FileChip }
