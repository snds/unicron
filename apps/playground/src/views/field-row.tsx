// FieldRow: Figma's Field Row (15:512), its three sizes, and what the four apps add (contract 5.1b #22, #37). View: ?view=field-row
// The new data-b components are imported from the ui source until packages/ui/src/index.ts exports
// them (the integrator's file); then these imports become "@unicron/ui".
import { useState, type ReactNode } from "react"
import {
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Kbd,
  ToggleGroup,
  ToggleGroupItem,
} from "@unicron/ui"
import { FieldRow, FieldRowAction, FieldRowValue } from "../../../../packages/ui/src/components/ui/field-row"
import { ToggleRow } from "../../../../packages/ui/src/components/ui/toggle-row"

function Specimen({ label, children, width = "max-w-[648px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col ${width}`}>{children}</div>
    </section>
  )
}

const AUTO_LOCK = ["After 1 minute", "After 5 minutes", "After 15 minutes", "When the Mac sleeps"]

export default function FieldRowView() {
  const [autoLock, setAutoLock] = useState("After 5 minutes")
  const [theme, setTheme] = useState<readonly string[]>(["graphite"])
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Size // default 52, display 64, stacked 64">
        <FieldRow label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>
          kestrel.04
        </FieldRow>
        <FieldRow size="display" label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>
          kestrel.04
        </FieldRow>
        <FieldRow size="stacked" label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>
          kestrel.04
        </FieldRow>
      </Specimen>

      <Specimen label="Item // Steam: masked value, no action, a badge after the value">
        <FieldRow label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>
          kestrel.04
        </FieldRow>
        <FieldRow label="Password" badge={<Badge tone="warning">Weak</Badge>} action={<FieldRowAction>Reveal</FieldRowAction>}>
          ••••••••••••••
        </FieldRow>
        <FieldRow label="Passkey">Lockdown // 2026.10.02</FieldRow>
        <FieldRow
          label="Website"
          action={
            <>
              <FieldRowAction href="https://store.steampowered.com">Open</FieldRowAction>
              <FieldRowAction>Copy</FieldRowAction>
            </>
          }
        >
          store.steampowered.com
        </FieldRow>
      </Specimen>

      <Specimen label="Settings // a menu behind Change, chips in the value slot, a Toggle Row between">
        <FieldRow
          label="Auto-lock"
          action={
            <DropdownMenu>
              <DropdownMenuTrigger render={<FieldRowAction>Change</FieldRowAction>} />
              <DropdownMenuContent align="end">
                <DropdownMenuRadioGroup value={autoLock} onValueChange={setAutoLock}>
                  {AUTO_LOCK.map((choice) => (
                    <DropdownMenuRadioItem key={choice} value={choice}>
                      {choice}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          }
        >
          {autoLock}
        </FieldRow>
        <ToggleRow label="Touch ID" description="Opens the vault and approves sign-ins." defaultChecked />
        <FieldRow label="Clipboard" action={<FieldRowAction>Change</FieldRowAction>}>
          Clears after 90 s
        </FieldRow>
        <FieldRow label="Theme" description="Graphite is the dark ground, Stone the light one.">
          <ToggleGroup aria-label="Theme" value={theme} onValueChange={setTheme} variant="outline" size="sm">
            <ToggleGroupItem value="system">System</ToggleGroupItem>
            <ToggleGroupItem value="stone">Stone</ToggleGroupItem>
            <ToggleGroupItem value="graphite">Graphite</ToggleGroupItem>
          </ToggleGroup>
        </FieldRow>
      </Specimen>

      <Specimen label="Where it applies // the meta slot, before the action">
        <FieldRow
          label="Quiet hours"
          meta={<FieldRowAction variant="ghost-muted">Only on this device</FieldRowAction>}
          action={<FieldRowAction>Change</FieldRowAction>}
        >
          22:00 – 07:00
        </FieldRow>
        <FieldRow label="Ask first" meta="Everywhere" action={<FieldRowAction>Check again</FieldRowAction>}>
          Ready
        </FieldRow>
      </Specimen>

      <Specimen label="Kbd in the label // the keys list">
        <FieldRow label={<>Quick access <Kbd>⌘K</Kbd></>} action={<FieldRowAction>Change</FieldRowAction>}>
          Items, places and Lock, by name
        </FieldRow>
        <FieldRow label={<>Keys list <Kbd>?</Kbd></>}>Every key, in one list</FieldRow>
      </Specimen>

      <Specimen label="Disabled with a reason // the action stays focusable">
        <FieldRow
          label="Sharing link"
          disabledReason="Needs the server. You're offline."
          action={<FieldRowAction>Copy</FieldRowAction>}
        >
          lockdown.app/s/7Hq2
        </FieldRow>
        <FieldRow
          label="Your calendar"
          badge={<Badge tone="warning">Clash</Badge>}
          description="And 1 more at the same time."
        >
          Dentist 16:00–16:45
        </FieldRow>
      </Specimen>

      <Specimen label="Long values // never wrap mid-word; cut in the middle" width="max-w-[420px]">
        <FieldRow label="Folder" action={<FieldRowAction>Copy</FieldRowAction>}>
          /Users/you/Documents/Research vault/Inbox/2026-11-12 cabin notes.md
        </FieldRow>
        <FieldRow label="Address" action={<FieldRowAction>Copy</FieldRowAction>}>
          mira.chen.cabin-bookings@fastmail.com
        </FieldRow>
        <FieldRow label="Notify for">
          <FieldRowValue truncate="wrap">People I know, and anyone I wrote to in the last 30 days</FieldRowValue>
        </FieldRow>
      </Specimen>

      <Specimen label="Phone // stacked, inset, full bleed" width="max-w-[390px]">
        <FieldRow size="stacked" inset label="Auto-lock" action={<FieldRowAction>Change</FieldRowAction>}>
          After 5 minutes
        </FieldRow>
        <ToggleRow inset label="Face ID" description="Opens the vault and approves sign-ins." defaultChecked />
        <FieldRow size="stacked" inset label="Clipboard" action={<FieldRowAction>Change</FieldRowAction>}>
          Clears after 90 s
        </FieldRow>
        <FieldRow size="stacked" inset label="Website" rule="both" action={<FieldRowAction>Open</FieldRowAction>}>
          store.steampowered.com
        </FieldRow>
      </Specimen>
    </div>
  )
}
