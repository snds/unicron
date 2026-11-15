// ToggleRow: Figma's Toggle Row (32:54), the whole row a target, and what the apps add (contract 5.1b #22, #37). View: ?view=toggle-row
import { useState, type ReactNode } from "react"
import { Badge, FieldRowAction, Kbd, ToggleRow } from "@unicron/ui"

function Specimen({ label, children, width = "max-w-[390px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col ${width}`}>{children}</div>
    </section>
  )
}

export default function ToggleRowView() {
  const [lock, setLock] = useState(true)
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 390 wide, 16 in, on; 64 with a description, 48 without">
        <ToggleRow inset rule="bottom" label="Lock after 5 minutes" description="Also locks when the screen sleeps." checked={lock} onCheckedChange={setLock} />
        <ToggleRow inset rule="bottom" label="Lock after 5 minutes" defaultChecked />
      </Specimen>

      <Specimen label="In a settings list // rule on top, as the other rows" width="max-w-[534px]">
        <ToggleRow label="Summaries" description="Short summary above long messages." defaultChecked />
        <ToggleRow label="Undo send" description="10 seconds to take a message back." defaultChecked />
        <ToggleRow label="Week numbers" description="Shows ISO week in the day header." />
        <ToggleRow label="Follow system" description="Switches to Stone in daylight." defaultChecked rule="both" />
      </Specimen>

      <Specimen label="Disabled // and disabled with a reason, still focusable" width="max-w-[534px]">
        <ToggleRow label="Lockdown as passkey provider" description="Apps and sites save passkeys here." defaultChecked disabled />
        <ToggleRow
          label="Quick unlock"
          description="Unlock with Touch ID instead of the master password."
          disabledReason="Turn on Touch ID for this Mac in System Settings first."
          rule="both"
        />
      </Specimen>

      <Specimen label="A badge, a key in the label, the meta slot" width="max-w-[534px]">
        <ToggleRow label="Let it run when an agent asks" badge={<Badge>Beta</Badge>} description="Installers that shape identities always wait for your click." />
        <ToggleRow label={<>Open the command menu with <Kbd>⌘K</Kbd></>} defaultChecked />
        <ToggleRow
          label="Make it a git repository with a first commit"
          description="Every change can be seen and undone."
          meta={<FieldRowAction variant="ghost-muted">Everywhere</FieldRowAction>}
          defaultChecked
          rule="both"
        />
      </Specimen>
    </div>
  )
}
