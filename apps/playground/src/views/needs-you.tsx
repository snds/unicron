// NeedsYou: Figma's Needs You (15:517), one per screen, as each app fills it; the // +1 suffix and two text actions (contract 5.1b #40). View: ?view=needs-you
// The new data-b components are imported from the ui source until packages/ui/src/index.ts exports
// them (the integrator's file); then these imports become "@unicron/ui".
import type { ReactNode } from "react"
import { Button } from "@unicron/ui"
import { NeedsYou } from "../../../../packages/ui/src/components/ui/needs-you"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-[648px] flex-col">{children}</div>
    </section>
  )
}

export default function NeedsYouView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 24 in, one solid action, one text action">
        <NeedsYou
          announce={false}
          title="Awaiting your review // SEA-51"
          body="Claude Code changed 6 files."
          action={<Button variant="needs-you">Review diff</Button>}
          secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
        />
      </Specimen>

      <Specimen label="One more waits // the title ends +1">
        <NeedsYou
          announce={false}
          title="Awaiting your review // SEA-51"
          more={1}
          body="Claude Code changed 6 files: 212 lines added, 48 removed. All 128 tests pass."
          action={<Button variant="needs-you">Review diff</Button>}
          secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
        />
      </Specimen>

      <Specimen label="Two text actions // an invitation">
        <NeedsYou
          announce={false}
          title="Invitation // Wed 11.18"
          body="Dentist, 16:30 – 17:15, Sierra Dental, Roseville"
          action={<Button variant="needs-you">Accept</Button>}
          secondaryActions={[
            <Button key="maybe" variant="needs-you-text">
              Maybe
            </Button>,
            <Button key="decline" variant="needs-you-text">
              Decline
            </Button>,
          ]}
        />
      </Specimen>

      <Specimen label="Lockdown // a sign-in request; Synapse // two harness changes">
        <div className="flex flex-col gap-8">
          <NeedsYou
            announce={false}
            title="Sign-in request // 00:40 ago"
            body="Steam on a Windows PC is asking to sign in as kestrel.04."
            action={<Button variant="needs-you">Review sign-in</Button>}
            secondaryAction={<Button variant="needs-you-text">Deny</Button>}
          />
          <NeedsYou
            announce={false}
            title="Awaiting your review // 02 harness changes"
            body="Claude Code and Codex proposed changes to visual-qa and the UI harness."
            action={<Button variant="needs-you">Review H-09</Button>}
            secondaryAction={<Button variant="needs-you-text">See both</Button>}
          />
        </div>
      </Specimen>
    </div>
  )
}
