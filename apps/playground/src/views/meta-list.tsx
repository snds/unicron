// MetaList and MetaItem: the Vale message head (From, Received, Attached), columns that wrap. View: ?view=meta-list
// The new data-b components are imported from the ui source until packages/ui/src/index.ts exports
// them (the integrator's file); then these imports become "@unicron/ui".
import type { ReactNode } from "react"
import { Button } from "@unicron/ui"
import { MetaItem, MetaList } from "../../../../packages/ui/src/components/ui/meta-list"

function Specimen({ label, children, width = "max-w-[648px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col gap-4 ${width}`}>{children}</div>
    </section>
  )
}

export default function MetaListView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Message head // as on the Vale desktop frame">
        <MetaList>
          <MetaItem label="From">Mira Chen</MetaItem>
          <MetaItem label="Received">09:14</MetaItem>
          <MetaItem label="Attached">01</MetaItem>
        </MetaList>
        <h2 className="type-title">Cabin for the 20th, confirmed</h2>
      </Specimen>

      <Specimen label="More facts // the columns wrap on a phone" width="max-w-[358px]">
        <MetaList>
          <MetaItem label="From">
            <Button variant="link" size="inline">
              Mira Chen
            </Button>
          </MetaItem>
          <MetaItem label="To">You, Theo Park</MetaItem>
          <MetaItem label="Received">Thu 11.12 // 09:14</MetaItem>
          <MetaItem label="Account">Personal</MetaItem>
          <MetaItem label="Attached">01</MetaItem>
        </MetaList>
      </Specimen>

      <Specimen label="A task head // Warpcore">
        <MetaList>
          <MetaItem label="Task">SEA-51</MetaItem>
          <MetaItem label="Agent">Claude Code</MetaItem>
          <MetaItem label="Risk">2</MetaItem>
          <MetaItem label="Spent">$1.84</MetaItem>
        </MetaList>
      </Specimen>
    </div>
  )
}
