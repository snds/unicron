// FoldPanes: two parts that land either side of a fold when a device is partly folded, and
// otherwise share the space. No device here is folded, so these show the shared form: columns
// side by side, and rows as a part that fills over a part at the foot. The fold is the line, so
// there is no handle to drag (that is ResizablePanes). View: ?view=fold-panes
import type { ReactNode } from "react"
import { FoldPanes } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

/** A screen-sized box for the panes to share: FoldPanes fills its parent. */
function Screen({ children }: { children: ReactNode }) {
  return <div className="rule-box flex h-64 w-full max-w-[--spacing(160)]">{children}</div>
}

function Part({ overline, children, edge = false }: { overline: string; children: ReactNode; edge?: "start" | "top" | false }) {
  return (
    <div className={edge === "start" ? "rule-l flex flex-col gap-1 p-4" : edge === "top" ? "rule-t flex flex-col gap-1 p-4" : "flex flex-col gap-1 p-4"}>
      <span className="type-overline">{overline}</span>
      <span className="type-body text-text-secondary">{children}</span>
    </div>
  )
}

export default function FoldPanesView() {
  return (
    <Page>
      <Specimen label="Columns // a fold down the middle (book pose): the first part left of it, the second right" column>
        <Screen>
          <FoldPanes split="columns">
            <Part overline="Inbox // 12 unread">The list stays on the left screen.</Part>
            <Part overline="Mira Chen // 09:14" edge="start">
              Cabin for the 20th, confirmed. The message opens on the right screen.
            </Part>
          </FoldPanes>
        </Screen>
      </Specimen>

      <Specimen label="Rows // a fold across the middle (tabletop pose): what you read stands up, what you touch lies flat" column>
        <Screen>
          <FoldPanes split="rows">
            <Part overline="SEA-48 // running 04:12">Add baseline drift check. The run's steps fill the upright half.</Part>
            <Part overline="Reply" edge="top">
              The composer sits on the flat half, under the fold.
            </Part>
          </FoldPanes>
        </Screen>
      </Specimen>
    </Page>
  )
}
