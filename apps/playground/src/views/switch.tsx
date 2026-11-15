// Switch: Figma's Toggle (32:53), alone and at the end of a row. View: ?view=switch
import { useState, type ReactNode } from "react"
import { Label, Switch } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function SwitchView() {
  const [lock, setLock] = useState(true)
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="State // on, off">
        <Switch aria-label="Lock after 5 minutes" defaultChecked />
        <Switch aria-label="Lock after 5 minutes" />
      </Specimen>

      <Specimen label="State // disabled on, disabled off">
        <Switch aria-label="Lock after 5 minutes" defaultChecked disabled />
        <Switch aria-label="Lock after 5 minutes" disabled />
      </Specimen>

      <Specimen label="State // invalid">
        <Switch aria-label="Accept the terms" aria-invalid />
      </Specimen>

      <Specimen label="With a label // the label turns it too">
        <div className="flex w-full max-w-sm items-center justify-between gap-4 py-3">
          <div className="flex min-w-0 flex-col">
            <Label htmlFor="view-switch-lock">Lock after 5 minutes</Label>
            <p className="type-caption">Also locks when the screen sleeps.</p>
          </div>
          <Switch id="view-switch-lock" checked={lock} onCheckedChange={setLock} />
        </div>
        <div className="flex w-full max-w-sm items-center justify-between gap-4 py-3">
          <Label htmlFor="view-switch-clipboard">Clear the clipboard after 30 seconds</Label>
          <Switch id="view-switch-clipboard" />
        </div>
      </Specimen>
    </div>
  )
}
