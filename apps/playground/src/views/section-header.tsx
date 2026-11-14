// Section Header, as Figma draws it (32:60), with the round-2 parts (contract 5.1b #26). View: ?view=section-header
import type { ReactNode } from "react"
import { Button } from "@unicron/ui"
import { ListRow } from "../../../../packages/ui/src/components/ui/list-row"
import { LogRow } from "../../../../packages/ui/src/components/ui/log-row"
import { SectionHeader } from "../../../../packages/ui/src/components/ui/section-header"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-160 flex-col gap-4">{children}</div>
    </section>
  )
}

export default function SectionHeaderView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 390 wide, 16 at each side (inset), 32 tall">
        <div className="w-full max-w-98">
          <SectionHeader inset title="Mail // folders" count={12} />
        </div>
      </Specimen>

      <Specimen label="In a column // flush with the column's edge, the default">
        <SectionHeader title="Failing checks" count="03 of 06" level={3} />
        <SectionHeader title="Activity" count={6} level={3} />
        <SectionHeader title="Knowledge" count={1204} level={3} />
      </Specimen>

      <Specimen label="With an action // a text button after the rule">
        <SectionHeader title="Results // newest first" count={14} action={<Button variant="ghost" size="sm">Show all</Button>} />
        <SectionHeader title="Changes" count={6} action={<Button variant="ghost" size="sm">Patch</Button>} />
      </Specimen>

      <Specimen label="Collapsible // shut to one summary line; the title is the button">
        <SectionHeader
          collapsible
          title="Runs with"
          summary="Coding // $2.00 cap // 06 files"
        >
          <p className="type-body pt-2">Alias Coding, a $2.00 cap, and six files of context.</p>
        </SectionHeader>
        <SectionHeader collapsible defaultOpen title="Dismissed" count={4} summary="Dismissed and snoozed findings">
          <div className="flex flex-col pt-2">
            <LogRow time="2026.10.30">Dismissed: Ticketmaster reuses a password</LogRow>
          </div>
        </SectionHeader>
      </Specimen>

      <Specimen label="Index // letter headers that stay in view while their rows scroll (Vale, Lockdown)">
        <div className="h-72 overflow-y-auto">
          <SectionHeader variant="index" inset title="Favorites" count={2} />
          <ListRow title="Mira Chen" meta="mira.chen@fastmail.com" metaStyle="plain" status="Favorite" />
          <ListRow title="Theo Park" meta="theo.park@hey.com" metaStyle="plain" status="Favorite" />
          <SectionHeader variant="index" inset title="A – P" count={146} />
          <ListRow title="Ana Ruiz" meta="ana.ruiz@proton.me" metaStyle="plain" status="Work" />
          <ListRow title="Ben Okafor" meta="ben@okafor.studio" metaStyle="plain" status="Work" />
          <ListRow title="Pine Hollow Cabins" meta="bookings@pinehollow.example" metaStyle="plain" status="Business" />
        </div>
      </Specimen>
    </div>
  )
}
