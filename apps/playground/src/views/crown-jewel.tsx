// The crown-jewel treatment: the inverted surface with its banner, the mark after a title, and a
// field that cannot be decrypted. View: ?view=crown-jewel (the gate: ?view=crown-jewel-gate)
import type { ReactNode } from "react"
import { CrownJewelMark, CrownJewelSurface, SecretField } from "@unicron/ui"

const host = { copy: () => Promise.resolve(), clear: () => Promise.resolve() }
const encode = (text: string) => () => Promise.resolve(new TextEncoder().encode(text))

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className="flex w-full max-w-[40.5rem] flex-col gap-4">{children}</div>
    </section>
  )
}

export default function CrownJewelView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Mark // after a title in rows, headings and search results">
        <p className="type-title text-text-body inline-flex items-center gap-2">
          Ledger <CrownJewelMark />
        </p>
        <p className="type-ui text-text-body inline-flex items-center gap-2">
          Ledger <CrownJewelMark size="sm" />
        </p>
      </Specimen>

      <Specimen label="Surface // the inverted ground; use asks Touch ID, show asks the account password">
        <CrownJewelSurface host="app" title="Ledger recovery phrase" appName="Lockdown" requestProof={() => Promise.resolve(true)}>
          <SecretField label="Recovery phrase" size="default" getSecret={encode("abandon ability able about above")} host={host} />
          <SecretField label="PIN" size="default" getSecret={encode("4417")} host={host} />
        </CrownJewelSurface>
        <CrownJewelSurface host="app" title="Ledger recovery phrase" deviceOnly requestProof={() => Promise.resolve(true)}>
          <SecretField label="Recovery phrase" size="default" getSecret={encode("abandon ability able about above")} host={host} />
        </CrownJewelSurface>
      </Specimen>

      <Specimen label="Surface // loading, and an item that could not be decrypted">
        <CrownJewelSurface host="app" title="Ledger recovery phrase" loading requestProof={() => Promise.resolve(true)} />
        <CrownJewelSurface host="app" title="Ledger recovery phrase" error="This item could not be decrypted." requestProof={() => Promise.resolve(true)} />
      </Specimen>
    </div>
  )
}
