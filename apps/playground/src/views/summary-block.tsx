// Summary Block: the one "model output" mark for every app (Vale's summary, drawn by hand on
// Figma 53:2448), with its states. View: ?view=summary-block
import type { ReactNode } from "react"
import { Button, CopyButton, IconButton, SummaryBlock } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-162 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

const POINTS = ["Two-bedroom cabin is booked for Nov 20 to 22.", "Check-in is after 3 PM. No chains needed.", "Mira asks you to bring the board games."]

export default function SummaryBlockView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Ready // as Vale draws it (desktop inbox, stone)">
        <SummaryBlock overline="Summary // 03 points" lines={POINTS} />
      </Specimen>

      <Specimen label="Ready // with the footer, the caption and the actions">
        <SummaryBlock
          overline="Summary // 03 points"
          lines={POINTS}
          footer="Newest 12 of 30 messages // qwen3.6:35b"
          caption="It can be wrong. Check what matters."
          actions={
            <>
              <CopyButton text={POINTS.join("\n")} label="Copy summary" />
              <IconButton icon="close" label="Close summary" size="icon-sm" />
            </>
          }
        />
      </Specimen>

      <Specimen label="Loading // the agent's motion on the orb; bars hold the lines' places">
        <SummaryBlock overline="Summary" state="loading" />
      </Specimen>

      <Specimen label="Error // one critical line and the ways out">
        <SummaryBlock
          overline="Summary"
          state="error"
          error="The model didn't answer. Check that it's running."
          actions={
            <>
              <Button size="sm" variant="secondary">
                Try again
              </Button>
              <Button size="sm" variant="ghost">
                Open settings
              </Button>
            </>
          }
        />
      </Specimen>

      <Specimen label="Children // suggested replies as button rows; picking one fills the composer">
        <SummaryBlock overline="Replies // 03" caption="Nothing is sent until you send it.">
          <div className="flex flex-col items-start gap-1">
            <Button variant="link" size="inline">
              Sounds good, see you on the 20th.
            </Button>
            <Button variant="link" size="inline">
              Can we check in at 4 instead?
            </Button>
            <Button variant="link" size="inline">
              Thanks for booking it!
            </Button>
          </div>
        </SummaryBlock>
      </Specimen>

      <Specimen label="Phone width">
        <div className="w-full max-w-90">
          <SummaryBlock overline="Summary // 03 points" lines={POINTS} />
        </div>
      </Specimen>
    </div>
  )
}
