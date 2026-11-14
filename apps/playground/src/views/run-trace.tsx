// Run Trace: what an agent is doing and what it did, in mono meta lines; live in the app's live
// colour. View: ?view=run-trace
import { useState, type ReactNode } from "react"
import { RunTrace, type RunStep } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-150 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

// The sample runs, built outside the view so its first element is the page, not a step's detail line.
function sampleRuns(t0: number) {
  const live: RunStep[] = [
    { id: "a", label: "Read sdk/src/login.ts", state: "done", startedAt: t0, endedAt: t0 + 2_000 },
    { id: "b", label: "Edit sdk/src/login.ts", state: "done", startedAt: t0 + 2_000, endedAt: t0 + 19_000 },
    { id: "c", label: "Run full test suite", state: "running", startedAt: t0 + 19_000, detail: <p className="type-caption">41 of 128 // cloud sandbox</p> },
  ]
  const waiting: RunStep[] = [
    { id: "a", label: "Read package.json", state: "done", startedAt: t0, endedAt: t0 + 1_000 },
    { id: "b", label: "pnpm install", state: "needs-you", startedAt: t0 + 1_000 },
  ]
  const failed: RunStep[] = [
    { id: "a", label: "Read package.json", state: "done", startedAt: t0, endedAt: t0 + 2_000 },
    { id: "b", label: "Run tests", state: "failed", startedAt: t0 + 2_000, endedAt: t0 + 9_000, detail: <p className="type-caption">exit 1 // 1 test failed in sdk/src/login.test.ts</p> },
    { id: "c", label: "Fix import", state: "done", startedAt: t0 + 9_000, endedAt: t0 + 12_000 },
  ]
  const stopped: RunStep[] = [
    { id: "a", label: "Nightly dependency audit", state: "stopped", startedAt: t0, endedAt: t0 + 192_000 },
  ]
  return { live, waiting, failed, stopped }
}

export default function RunTraceView() {
  const [t0] = useState(() => Date.now() - 134_000)
  const { live, waiting, failed, stopped } = sampleRuns(t0)

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Live // open on the current step; the step and its orb in the live colour">
        <RunTrace live steps={live} reasoning={"The suite is long, so I started it in the sandbox.\nWhile it runs I'll read the auth service's handshake.\nThe server side keeps both flows until Dec 12."} />
      </Specimen>

      <Specimen label="Live, waiting on you // the yellow square with its ink outline">
        <RunTrace live steps={waiting} marks={[{ id: "m", after: "a", label: "Asked to run pnpm install", icon: "user--feedback" }]} />
      </Specimen>

      <Specimen label="Finished with a failure // folded to one line; open it">
        <RunTrace steps={failed} marks={[{ id: "m", after: "b", label: "Allowed once", icon: "checkmark" }]} />
        <RunTrace steps={failed} defaultOpen />
      </Specimen>

      <Specimen label="Stopped // someone ended it; not a failure">
        <RunTrace steps={stopped} defaultOpen />
      </Specimen>
    </div>
  )
}
