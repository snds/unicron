// Badge: a status word with a tone, in mono caps. View: ?view=badge
import type { ReactNode } from "react"
import { Badge, Icon } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function BadgeView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Tone // neutral, live, needs-you, critical, warning, success">
        <Badge>No triggers</Badge>
        <Badge tone="live">Running</Badge>
        <Badge tone="needs-you">Needs you</Badge>
        <Badge tone="critical">Clash</Badge>
        <Badge tone="warning">Stale</Badge>
        <Badge tone="success">Passing</Badge>
      </Specimen>

      <Specimen label="With an icon // 12px">
        <Badge tone="live">
          <Icon name="terminal" />
          Running 04:12
        </Badge>
        <Badge tone="critical">
          <Icon name="flag" />
          Failing 06
        </Badge>
      </Specimen>

      <Specimen label="In a row // the word carries it, the tone backs it up">
        <div className="flex w-full max-w-md flex-col">
          <div className="rule-t flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="type-ui truncate">ux-copy</p>
              <p className="type-meta truncate">spoke // lead-ui-designer // 14 uses</p>
            </div>
            <Badge>No triggers</Badge>
          </div>
          <div className="rule-t flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="type-ui truncate">Add baseline drift check</p>
              <p className="type-meta truncate">SEA-48 // Claude Code</p>
            </div>
            <Badge tone="live">Running</Badge>
          </div>
          <div className="rule-t flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="type-ui truncate">OPAQUE migration diff</p>
              <p className="type-meta truncate">SEA-51 // 6 files</p>
            </div>
            <Badge tone="needs-you">Needs you</Badge>
          </div>
        </div>
      </Specimen>

      <Specimen label="Names from before 1.0 // each draws as a tone">
        <Badge variant="default">Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
      </Specimen>
    </div>
  )
}
