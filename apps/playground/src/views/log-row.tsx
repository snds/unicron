// Log Row: the activity lines on Warpcore's running task and Synapse's overview (contract 5.1a, 5.1b #38). View: ?view=log-row
import type { ReactNode } from "react"
import { LogRow, SectionHeader } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-134 flex-col gap-4">{children}</div>
    </section>
  )
}

export default function LogRowView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Activity // a mono time and a line, 40 tall (Warpcore, SEA-48)">
        <SectionHeader title="Activity" count={6} level={3} />
        <ol className="flex flex-col">
          <LogRow render={<li />} time="14:20" dateTime="2026-11-12T14:20">
            Opened harness/visual-qa
          </LogRow>
          <LogRow render={<li />} time="14:21" dateTime="2026-11-12T14:21">
            Read harness/visual-qa/config.ts
          </LogRow>
          <LogRow render={<li />} time="14:22" dateTime="2026-11-12T14:22">
            Wrote baseline/drift.ts (+84)
          </LogRow>
          <LogRow render={<li />} time="14:23" dateTime="2026-11-12T14:23">
            Added 9 tests
          </LogRow>
          <LogRow render={<li />} time="14:24" dateTime="2026-11-12T14:24">
            Running tests // 41 of 57
          </LogRow>
        </ol>
      </Specimen>

      <Specimen label="As links // each line opens what it is about (Synapse overview)">
        <SectionHeader title="Activity // today" count={4} level={3} />
        <ul className="flex flex-col">
          <li>
            <LogRow href="#knowledge" time="14:02">
              Imported 12 notes from Obsidian
            </LogRow>
          </li>
          <li>
            <LogRow href="#k-14" time="13:40">
              Check K-14 started failing
            </LogRow>
          </li>
          <li>
            <LogRow href="#ux-copy" time="11:15">
              Skill ux-copy updated
            </LogRow>
          </li>
          <li>
            <LogRow href="#codex" time="09:02">
              Codex connected
            </LogRow>
          </li>
        </ul>
      </Specimen>

      <Specimen label="A long line // wraps, never cut; the row grows by 20">
        <div className="w-80">
          <LogRow time="14:24">Running tests // 41 of 57 in harness/visual-qa, baseline/drift.ts first</LogRow>
        </div>
      </Specimen>
    </div>
  )
}
