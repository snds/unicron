// Status Orb: one glanceable state per shape, motion and colour. Live is the app's secondary
// colour; needs-you is the yellow with an ink outline, so it reads on stone. View: ?view=status-orb
import type { ReactNode } from "react"
import { StatusOrb, statusOrbCopy, statusOrbStates } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

function Grid() {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-x-6 gap-y-4">
      {statusOrbStates.map((state) => (
        <div key={state} className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <StatusOrb state={state} size="xs" />
            <StatusOrb state={state} size="sm" />
            <StatusOrb state={state} size="md" />
          </div>
          <p className="type-meta">{statusOrbCopy[state]}</p>
        </div>
      ))}
    </div>
  )
}

export default function StatusOrbView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Every state // xs 12, sm 16, md 20, on the ground">
        <Grid />
      </Specimen>
      <Specimen label="Every state // on a raised panel">
        <div className="bg-surface-raised rule-box p-4">
          <Grid />
        </div>
      </Specimen>
      <Specimen label="Reduced motion // the halo and the pulse hold still; the working ring is dashed">
        <div data-motion="reduced">
          <Grid />
        </div>
      </Specimen>
    </div>
  )
}
