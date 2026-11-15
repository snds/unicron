// Steps: a vertical list of a flow's steps (contract 5.1b #32): Synapse's import, Warpcore's task steps, Lockdown's checklist, and the phone folio. View: ?view=steps
import { useState, type ReactNode } from "react"
import { Badge, Button, Checkbox, Step, Steps, StepsFolio, type StepStatus } from "@unicron/ui"

function Specimen({ label, children, width = "max-w-[534px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col gap-4 ${width}`}>{children}</div>
    </section>
  )
}

const IMPORT = ["Snapshot and inventory", "Pre-pass", "Deep scan", "Review", "Write and score"]

export default function StepsView() {
  const [at, setAt] = useState(2)
  const status = (i: number): StepStatus => (i < 2 ? "done" : i === 2 ? "current" : "upcoming")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Synapse import // a press goes to the step; later steps wait">
        <Steps aria-label="Import steps">
          {IMPORT.map((title, i) => (
            <Step
              key={title}
              title={title}
              status={status(i)}
              live={i === 2}
              statusLabel={i === 2 ? "Reading" : undefined}
              detail={i === 2 ? "Pass 02 of 05" : undefined}
              disabled={i > 2}
              onClick={() => setAt(i)}
            />
          ))}
        </Steps>
        <p className="type-caption text-support-foreground">{`Showing step ${at + 1}.`}</p>
      </Specimen>

      <Specimen label="Warpcore task // states in the task's own words">
        <Steps aria-label="Steps">
          <Step title="Plan the change" detail="Claude Code" status="done" />
          <Step title="Edit 6 files" detail="Claude Code" status="done" />
          <Step title="Run tests" detail="Claude Code" status="done" statusLabel="128 / 128 pass" />
          <Step title="Your review" detail="Claude Code" status="current" statusLabel="Waiting on you" />
          <Step title="Merge" detail="Claude Code" status="upcoming" statusLabel="Next" />
        </Steps>
      </Specimen>

      <Specimen label="Failed // a step that stopped">
        <Steps aria-label="Steps">
          <Step title="Scan lockfiles" detail="Codex" status="done" />
          <Step title="Resolve 31 updates" detail="Codex" status="failed" statusLabel="17 of 31" />
          <Step title="Run tests" detail="Codex" statusLabel="Not run" />
        </Steps>
      </Specimen>

      <Specimen label="Lockdown // a checklist: a checkbox, a Next badge, a text action">
        <Steps aria-label="Something happened? Steps">
          <Step
            leading={<Checkbox defaultChecked aria-label="Change the Steam password" />}
            title="Change the Steam password"
            status="done"
            statusLabel={null}
          >
            Use a new one Lockdown makes for you.
          </Step>
          <Step
            leading={<Checkbox aria-label="Sign out other devices" />}
            title="Sign out other devices"
            badge={<Badge>Next</Badge>}
            status="current"
            statusLabel={null}
            action={<Button variant="ghost" size="sm">Go to devices</Button>}
          >
            Any device you don't know loses access.
          </Step>
          <Step leading={<Checkbox aria-label="Turn on two-step sign-in" />} title="Turn on two-step sign-in" statusLabel={null}>
            Steam Guard codes then live in Codes.
          </Step>
        </Steps>
      </Specimen>

      <Specimen label="Phone // one folio line under the top row" width="max-w-[358px]">
        <StepsFolio current={2} total={7} title="Apps" />
        <StepsFolio current={3} total={5} title="Deep scan" />
      </Specimen>
    </div>
  )
}
