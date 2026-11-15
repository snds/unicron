// Skeleton: the loading rows of every app's "States 04" frame. View: ?view=skeleton
import type { ReactNode } from "react"
import { Skeleton } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-sm flex-col">{children}</div>
    </section>
  )
}

export default function SkeletonView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Inbox // 012 unread">
        <div aria-busy="true" aria-label="Loading mail">
          <Skeleton variant="row" />
          <Skeleton variant="row" />
          <Skeleton variant="row" />
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </div>
      </Specimen>
    </div>
  )
}
