// Shared by the frame's part views: a contained AppFrame in a box of a given size, labelled with its
// shell, so several shells sit on one page. Not a view: the file name starts with "_".
import type { ReactNode } from "react"
import { AppFrame, type AppFrameLayout } from "@unicron/ui"

export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** A frame of `width` × `height` CSS px, pinned to `layout` (and optionally to the scrolled state). */
export function FrameBox({
  width,
  height,
  layout,
  minimized,
  focus,
  label,
  children,
}: {
  width: number
  height: number
  layout?: AppFrameLayout
  minimized?: boolean
  focus?: boolean
  label: string
  children: ReactNode
}) {
  return (
    <figure className="flex min-w-0 flex-col gap-2">
      <div className="max-w-full shrink-0 overflow-hidden border border-line-rule" style={{ width, height }}>
        <AppFrame contained layout={layout} minimized={minimized} focus={focus} aria-label={label}>
          {children}
        </AppFrame>
      </div>
      <figcaption className="type-meta text-text-label">{label}</figcaption>
    </figure>
  )
}
