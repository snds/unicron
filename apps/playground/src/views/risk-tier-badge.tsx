// RiskTierBadge: one word per trust tier, square and in mono caps (Badge's look), with the explain
// control. View: ?view=risk-tier-badge
import type { ReactNode } from "react"
import { RiskTierBadge } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className="flex flex-wrap items-center gap-4">{children}</div>
    </section>
  )
}

export default function RiskTierBadgeView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Tiers // small, in a row">
        <RiskTierBadge tier="standard" verified />
        <RiskTierBadge tier="official" verified />
        <RiskTierBadge tier="tolerated" verified />
      </Specimen>
      <Specimen label="States // checking the manifest, and unverified">
        <RiskTierBadge tier="official" />
        <RiskTierBadge tier="official" verified={false} />
      </Specimen>
      <Specimen label="Medium // in a detail or a sheet, with the explain control">
        <RiskTierBadge tier="standard" verified size="md" explain />
        <RiskTierBadge tier="official" verified size="md" explain />
        <RiskTierBadge tier="tolerated" verified size="md" explain disclosures={["Signs in with the vendor's private API.", "May stop working after a vendor update."]} />
      </Specimen>
    </div>
  )
}
