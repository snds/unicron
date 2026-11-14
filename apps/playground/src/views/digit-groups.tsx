// DigitGroups: codes in groups, to read aloud or compare (Lockdown brief L-23).
// View: ?view=digit-groups
import type { ReactNode } from "react"
import { DigitGroups } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className="flex w-full max-w-[40.5rem] flex-col gap-3">{children}</div>
    </section>
  )
}

export default function DigitGroupsView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Large // six digits to compare across a room">
        <DigitGroups value="482913" size="lg" label="Pairing code" />
      </Specimen>
      <Specimen label="Medium // a phrase of nine digits, a device code">
        <DigitGroups value="739204158" label="Phrase" />
        <DigitGroups value="7KQ2M-9XH4P" label="Device code" />
      </Specimen>
      <Specimen label="Small // in a Field Row: a fingerprint, a server's key">
        <DigitGroups value="052187340912673094518276034519862740183526" size="sm" label="Fingerprint" />
        <DigitGroups value="3F9A C21E 77B0 1D4C 9E05 A6F3" size="sm" label="Server key" />
      </Specimen>
    </div>
  )
}
