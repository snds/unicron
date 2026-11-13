// Progress: the segmented bar of List Row, the spend and score bars, a code's countdown, and the plain bar. View: ?view=progress
import type { ReactNode } from "react"
import { Progress, ProgressLabel, ProgressValue } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-sm flex-col gap-4">{children}</div>
    </section>
  )
}

export default function ProgressView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Segmented // 32 cells, live: SEA-48 // Running 04:12">
        <Progress variant="segmented" value={19} max={32} aria-label="Add baseline drift check" />
      </Specimen>

      <Specimen label="Segmented, primary // a quantity that is not live">
        <Progress variant="segmented" tone="primary" value={3.4} max={10}>
          <ProgressLabel>$3.40 of $10.00 today</ProgressLabel>
          <ProgressValue />
        </Progress>
        <Progress variant="segmented" tone="primary" segments={44} value={212} max={218}>
          <ProgressLabel>212 of 218 checks pass.</ProgressLabel>
        </Progress>
      </Specimen>

      <Specimen label="Countdown // 30 cells; critical near expiry">
        <div className="flex flex-col gap-1">
          <p className="type-overline text-secondary-live">Steam // 18 s</p>
          <Progress variant="segmented" segments={30} value={18} max={30} aria-label="Steam code, seconds left" />
        </div>
        <div className="flex flex-col gap-1">
          <p className="type-overline text-critical-text">Fastmail // 4 s</p>
          <Progress variant="segmented" tone="critical" segments={30} value={4} max={30} aria-label="Fastmail code, seconds left" />
        </div>
      </Specimen>

      <Specimen label="Segmented // one cell per step, and a budget">
        <Progress variant="segmented" tone="primary" segments={7} value={3} max={7}>
          <ProgressLabel>Plan</ProgressLabel>
          <ProgressValue>{(_, value) => `${value ?? 0} of 7`}</ProgressValue>
        </Progress>
        <Progress variant="segmented" tone="budget" value={8.2} max={10}>
          <ProgressLabel>$8.20 of $10.00 today</ProgressLabel>
          <ProgressValue />
        </Progress>
      </Specimen>

      <Specimen label="Bar // default, complete, budget, live, critical, indeterminate">
        <Progress value={40} aria-label="Sync" />
        <Progress value={100} aria-label="Sync" />
        <Progress tone="budget" value={82} aria-label="Spend" />
        <Progress tone="live" value={60} aria-label="Indexing" />
        <Progress tone="critical" value={12} aria-label="Time left" />
        <Progress value={null} aria-label="Loading" />
      </Specimen>
    </div>
  )
}
