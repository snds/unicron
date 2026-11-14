// SecretField in the Field Row look (Figma 15:512) and the Text Field box (32:48), with the phone's
// remote buttons (Lockdown 40:357). Each state is driven once on mount, so a screenshot shows it.
// View: ?view=secret-field
import { useEffect, useRef, useState, type ReactNode } from "react"
import { CrownJewelSurface, SecretField, SecretFieldRemoteButton, useSecretFieldRemote, type SecretFieldHost } from "@unicron/ui"

const encode = (text: string) => () => Promise.resolve(new TextEncoder().encode(text))
const host = (overrides: Partial<SecretFieldHost> = {}): SecretFieldHost => ({
  copy: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  clipboardHolds: () => Promise.resolve(true),
  gate: () => Promise.resolve(true),
  ...overrides,
})

function Specimen({ label, children, narrow = false }: { label: string; children: ReactNode; narrow?: boolean }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className={narrow ? "flex w-full max-w-[22.375rem] flex-col" : "flex w-full max-w-[40.5rem] flex-col"}>{children}</div>
    </section>
  )
}

/** Press one of the field's own controls once, after mount, so the picture shows that state. */
function Pressed({ slot, children }: { slot: "reveal" | "copy"; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const t = setTimeout(() => box.current?.querySelector<HTMLButtonElement>(`[data-slot="secret-field-${slot}"]`)?.click(), 50)
    return () => clearTimeout(t)
  }, [slot])
  return <div ref={box}>{children}</div>
}

export default function SecretFieldView() {
  const remote = useSecretFieldRemote()
  const [typed, setTyped] = useState("larch-ember-quartz-17")
  const [kept, setKept] = useState("")
  const [key, setKey] = useState("ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL0ck0wn\nkestrel.04@lockdown")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Read // Field Row, default size: masked, hold to show, copy">
        <SecretField label="Password" size="default" getSecret={encode("larch-ember-quartz-17")} host={host()} />
        <SecretField label="Security code" size="default" revealMode="toggle" getSecret={encode("4417")} host={host()} />
      </Specimen>

      <Specimen label="Read // shown, then copied: the clipboard's countdown in the live colour">
        <Pressed slot="reveal">
          <SecretField label="Password" size="default" revealMode="toggle" revealLifetime={600} getSecret={encode("larch-ember-quartz-17")} host={host()} />
        </Pressed>
        <Pressed slot="copy">
          <SecretField label="Card number" size="default" format="groups-of-4" clipboardTimer={90} getSecret={encode("4242424242424417")} host={host()} />
        </Pressed>
      </Specimen>

      <Specimen label="Read // gated (a lock on each action), loading, an error with Retry">
        <SecretField label="Secret Key" size="default" gate="biometric" getSecret={encode("A3-KX9P2M-7RT4Q")} host={host()} />
        <Pressed slot="reveal">
          <SecretField label="Recovery code" size="default" revealMode="toggle" getSecret={() => new Promise<Uint8Array>(() => {})} host={host()} />
        </Pressed>
        <Pressed slot="reveal">
          <SecretField label="API key" size="default" revealMode="toggle" getSecret={() => Promise.reject(new Error("locked"))} host={host()} errorText="The vault locked before this field was read." />
        </Pressed>
      </Specimen>

      <Specimen label="Read // fill only: a share that fills in the browser, never shown or copied">
        <SecretField label="Password" size="default" fillOnly />
      </Specimen>

      <Specimen label="Read // inside a crown jewel: every reveal and copy asks first">
        <CrownJewelSurface host="app" title="Steam recovery code" requestProof={() => Promise.resolve(true)}>
          <SecretField label="Recovery code" size="default" getSecret={encode("R7K2N-4HQ8T-XW3PL")} host={host()} />
        </CrownJewelSurface>
      </Specimen>

      <Specimen label="Phone // stacked rows and the bottom row's eye and copy, bound to the password" narrow>
        <SecretField label="Password" getSecret={encode("larch-ember-quartz-17")} host={host()} remote={remote} />
        <SecretField label="Wi-Fi password" fillOnly />
        <div className="flex items-center justify-between pt-6">
          <SecretFieldRemoteButton remote={remote} action="reveal" />
          <SecretFieldRemoteButton remote={remote} action="copy" />
        </div>
      </Specimen>

      <Specimen label="Edit // Text Field box: typed with the strength rule, made on save, kept, removed, a passkey">
        <div className="flex flex-col gap-6">
          <SecretField
            mode="edit"
            label="Password"
            value={typed}
            onChange={setTyped}
            strength="strong"
            actions={[{ label: "Generate", onClick: () => setTyped("pine-orbit-delta-90") }]}
          />
          <SecretField
            mode="edit"
            label="Password"
            value=""
            onChange={() => {}}
            stateText="Made when you save"
            description="20 characters: letters, digits and symbols // Strong"
            actions={[
              { label: "Options", onClick: () => {} },
              { label: "Type one instead", onClick: () => {} },
            ]}
          />
          <SecretField
            mode="edit"
            label="Password"
            value={kept}
            onChange={setKept}
            placeholder="Left empty, it stays as it is."
            actions={[
              { label: "Generate", onClick: () => {} },
              { label: "Remove", onClick: () => {} },
            ]}
          />
          <SecretField mode="edit" label="Recovery code" value="" onChange={() => {}} stateText="Removed when you save." actions={[{ label: "Keep", onClick: () => {} }]} />
          <SecretField mode="edit" label="Passkey" value="" onChange={() => {}} stateText="Made by a passkey provider; kept as it is." />
        </div>
      </Specimen>

      <Specimen label="Edit // several lines, an error, disabled">
        <div className="flex flex-col gap-6">
          <SecretField mode="edit" multiline rows={3} label="Private key" value={key} onChange={setKey} />
          <SecretField mode="edit" label="Master password" value="ticketmaster" onChange={() => {}} strength="weak" error="That isn't the master password." />
          <SecretField mode="edit" label="Set-up link" value="" onChange={() => {}} disabled description="Paste the otpauth:// or steam:// link the site gave you." />
        </div>
      </Specimen>
    </div>
  )
}
