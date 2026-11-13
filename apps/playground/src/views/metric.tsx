// Metric: Figma's Metric (15:513), its delta tones, as a link, and the hero size (Lockdown Health, Warpcore Spend, Synapse Overview). View: ?view=metric
// The new data-b components are imported from the ui source until packages/ui/src/index.ts exports
// them (the integrator's file); then these imports become "@unicron/ui".
import type { ReactNode } from "react"
import { Badge, Progress, useViewport } from "@unicron/ui"
import { Metric } from "../../../../packages/ui/src/components/ui/metric"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** Four metrics in a row, 24 apart, each 175 wide as drawn; they wrap on a phone. */
function Row({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,175px))] gap-6">{children}</div>
}

export default function MetricView() {
  // Warpcore's spend hero is wider than a phone: there it is the default size (Warpcore brief, Spend).
  const phone = useViewport().widthClass === "compact"
  const spend = phone ? "default" : "hero"
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 175 wide, 104 tall">
        <Row>
          <Metric label="Skills" value="145" delta="+3 this week" />
        </Row>
      </Specimen>

      <Specimen label="Synapse overview // links to their places">
        <Row>
          <Metric href="#skills" label="Skills" value="145" delta="+3 this week" />
          <Metric href="#knowledge" label="Knowledge" value="1,204" delta="+12 today" tone="live" />
          <Metric href="#harnesses" label="Harnesses" value="9" delta="2 proposed" />
          <Metric href="#personas" label="Personas" value="3" delta="11 accounts" />
        </Row>
      </Specimen>

      <Specimen label="Warpcore spend // tones neutral, up, down">
        <Row>
          <Metric label="This month" value="$41.80" delta="of $200.00" />
          <Metric label="Tasks run" value="38" delta="+6 this week" tone="up" />
          <Metric label="Avg per task" value="$1.10" delta="−$0.14" tone="down" />
          <Metric label="Stopped at cap" value="02" delta="SEA-44, SEA-39" />
        </Row>
      </Specimen>

      <Specimen label="Hero // primary display, out of 100 (Lockdown health)">
        <Metric size="hero" valueTone="primary" label="Health // personal + family" value="92" unit="/100" />
      </Specimen>

      <Specimen label="Hero // body ink, a caption and a bar (Warpcore spend; the default size on a phone)">
        <div className="flex max-w-[768px] flex-col gap-6">
          <Metric size={spend} label="Spend // Thursday 11.12" value="$3.40" delta="of $10.00 today">
            <Progress variant="segmented" tone="primary" segments={64} value={3.4} max={10} aria-label="$3.40 of $10.00 today" />
          </Metric>
          <Metric size={spend} label="Spend // Friday 11.13" value="$8.60" delta="of $10.00 today" badge={<Badge tone="warning">Near cap</Badge>}>
            <Progress variant="segmented" tone="budget" segments={64} value={8.6} max={10} aria-label="$8.60 of $10.00 today" />
          </Metric>
        </div>
      </Specimen>

      <Specimen label="Hero // Synapse workspace health, as a link">
        <Metric href="#checks" size="hero" valueTone="primary" label="Workspace health // score" value="94" unit="/100" />
      </Specimen>
    </div>
  )
}
