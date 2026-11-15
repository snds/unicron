// Kbd and Separator: keys as typed, and the hairline. View: ?view=kbd
import type { ReactNode } from "react"
import { Kbd, KbdGroup, Separator } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function KbdView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Kbd // one key, a run of keys">
        <Kbd>Esc</Kbd>
        <Kbd>E</Kbd>
        <KbdGroup>
          <Kbd>Shift</Kbd>
          <Kbd>Enter</Kbd>
        </KbdGroup>
      </Specimen>

      <Specimen label="Kbd // beside the words it belongs to">
        <p className="type-caption flex items-center gap-2">
          Quick create
          <KbdGroup>
            <Kbd>Shift</Kbd>
            <Kbd>Enter</Kbd>
          </KbdGroup>
        </p>
      </Specimen>

      <Specimen label="Separator // horizontal">
        <div className="flex w-full max-w-sm flex-col gap-3">
          <p className="type-ui">Mail</p>
          <Separator />
          <p className="type-ui">Calendar</p>
        </div>
      </Specimen>

      <Specimen label="Separator // vertical">
        <div className="flex h-5 items-center gap-3">
          <span className="type-meta">SEA-48</span>
          <Separator orientation="vertical" />
          <span className="type-meta">Running 04:12</span>
        </div>
      </Specimen>
    </div>
  )
}
