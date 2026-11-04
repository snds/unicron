// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/warpcore · PR snds/unicron#66 · DSA none
"use client"

import * as ResizablePrimitive from "react-resizable-panels"
import { cn } from "../../lib/utils"

/**
 * How far a handle's press area reaches, in CSS pixels, whatever the 1px line it draws. Above the 24px
 * of WCAG 2.5.8 on touch, without taking so much from the panes that a control beside the line gets
 * hard to press. The library reads numbers here, so this can't be a token.
 */
const HANDLE_TARGET = { coarse: 32, fine: 12 }

/**
 * Panes side by side (`orientation="horizontal"`, the default) or stacked (`"vertical"`). Fills its
 * parent, so give the parent a height. To remember a layout between visits, pass `defaultLayout` and
 * `onLayoutChanged` from
 * `useResizablePanesLayout({ id })` by name (a spread counts against `dsa`'s ratchet), and give each
 * `ResizablePane` an `id`.
 */
function ResizablePanes({
  className,
  resizeTargetMinimumSize = HANDLE_TARGET,
  ...props
}: ResizablePrimitive.GroupProps) {
  return (
    <ResizablePrimitive.Group
      data-slot="resizable-panes"
      className={cn(
        "flex h-full w-full aria-[orientation=vertical]:flex-col",
        className
      )}
      resizeTargetMinimumSize={resizeTargetMinimumSize}
      {...props}
    />
  )
}

function ResizablePane({ ...props }: ResizablePrimitive.PanelProps) {
  return <ResizablePrimitive.Panel data-slot="resizable-pane" {...props} />
}

/**
 * The line between two panes. `label` names it for screen readers, because a separator that takes
 * focus needs a name: "Resize the conversation". `withGrip` adds a visible grip for touch, where
 * nothing hovers to show that the line moves.
 */
function ResizableHandle({
  label,
  withGrip,
  className,
  ...props
}: ResizablePrimitive.SeparatorProps & {
  label: string
  withGrip?: boolean
}) {
  return (
    <ResizablePrimitive.Separator
      data-slot="resizable-handle"
      aria-label={label}
      className={cn(
        "bg-border data-[separator=hover]:bg-ring data-[separator=active]:bg-ring focus-visible:bg-ring focus-visible:ring-ring/50 relative flex w-px shrink-0 items-center justify-center outline-none transition-colors focus-visible:ring-3 aria-[orientation=horizontal]:h-px aria-[orientation=horizontal]:w-full [&[aria-orientation=horizontal]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withGrip && (
        <div
          data-slot="resizable-handle-grip"
          className="bg-muted-foreground in-data-[separator=hover]:bg-ring in-data-[separator=active]:bg-ring z-10 flex h-6 w-1 shrink-0 rounded-lg transition-colors"
        />
      )}
    </ResizablePrimitive.Separator>
  )
}

/** Remembers a layout between visits. Returns the `defaultLayout` and `onLayoutChanged` to pass to `ResizablePanes`. */
const useResizablePanesLayout = ResizablePrimitive.useDefaultLayout

/** A ref for `ResizablePane`'s `panelRef`, to collapse, expand or resize it from code. */
const useResizablePaneRef = ResizablePrimitive.usePanelRef

export {
  ResizableHandle,
  ResizablePane,
  ResizablePanes,
  useResizablePaneRef,
  useResizablePanesLayout,
}
