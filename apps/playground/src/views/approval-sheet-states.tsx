// ApprovalSheet's other states, each behind a button so the request's clock starts when it opens:
// choosing the number from three, a TV code that came from a scan, the same code from a push
// (refused: no approve control at all), busy, an error from the host, and a request that has run
// out. The three drawn reviews are their own views (approval-sheet, -enter, -pairing).
// View: ?view=approval-sheet-states
import { useState } from "react"
import { ApprovalSheet, Button, type ApprovalContextRow, type ApprovalKind, type ApprovalMatching, type ApprovalOrigin } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

const SIGN_IN: ApprovalContextRow[] = [
  { label: "Account", value: "kestrel.04" },
  { label: "Device", value: "MacBook Air // macOS 26" },
  { label: "Near", value: "Sacramento, CA" },
  { label: "Time", value: "14:31" },
]
const TV_CODE: ApprovalContextRow[] = [
  { label: "What", value: "Activate Steam Link" },
  { label: "Domain", value: "store.steampowered.com", emphasis: true },
  { label: "Where", value: "Living room TV" },
  { label: "Time", value: "14:31" },
]
const ENTER: ApprovalMatching = { mode: "enter", digits: 2, expected: "42" }

interface Scenario {
  label: string
  title: string
  kind: ApprovalKind
  origin: ApprovalOrigin
  context: ApprovalContextRow[]
  matching: ApprovalMatching
  busy?: boolean
  error?: string
  /** Milliseconds from the press; the sheet's own default is 60 s. */
  expiresIn?: number
}

const SCENARIOS: Scenario[] = [
  { label: "Choose the number", title: "Share Steam with Mira Chen?", kind: "contact-request", origin: "push", context: SIGN_IN, matching: { mode: "choose", digits: 2, expected: "42", choices: ["17", "42", "88"] } },
  { label: "A TV code, scanned", title: "Activate Steam Link?", kind: "device-code", origin: "scan", context: TV_CODE, matching: ENTER },
  { label: "A TV code, pushed (refused)", title: "Activate Steam Link?", kind: "device-code", origin: "push", context: TV_CODE, matching: ENTER },
  { label: "Busy", title: "Add MacBook Air?", kind: "device", origin: "pairing", context: SIGN_IN, matching: ENTER, busy: true },
  { label: "An error from the host", title: "Add MacBook Air?", kind: "device", origin: "pairing", context: SIGN_IN, matching: ENTER, error: "Too many attempts. Try again in a minute." },
  { label: "Ten seconds left", title: "Add MacBook Air?", kind: "device", origin: "pairing", context: SIGN_IN, matching: ENTER, expiresIn: 10_000 },
  { label: "Run out", title: "Add MacBook Air?", kind: "device", origin: "pairing", context: SIGN_IN, matching: ENTER, expiresIn: -1 },
]

export default function ApprovalSheetStatesView() {
  const [open, setOpen] = useState<{ scenario: Scenario; expiresAt?: number } | null>(null)
  const [decision, setDecision] = useState("Nothing decided yet.")
  return (
    <Page>
      <Specimen label="States // press one to open its review; the number to match is 42">
        {SCENARIOS.map((scenario) => (
          <Button
            key={scenario.label}
            variant="secondary"
            onClick={() => setOpen({ scenario, expiresAt: scenario.expiresIn === undefined ? undefined : Date.now() + scenario.expiresIn })}
          >
            {scenario.label}
          </Button>
        ))}
      </Specimen>
      <p className="type-meta" role="status">
        {decision}
      </p>
      {open && (
        <ApprovalSheet
          key={open.scenario.label}
          open
          onOpenChange={(next) => {
            if (!next) setOpen(null)
          }}
          kind={open.scenario.kind}
          origin={open.scenario.origin}
          title={open.scenario.title}
          context={open.scenario.context}
          matching={open.scenario.matching}
          busy={open.scenario.busy}
          error={open.scenario.error}
          expiresAt={open.expiresAt}
          onApprove={() => {
            setDecision("Approved.")
            setOpen(null)
          }}
          onDeny={(reason) => setDecision(`Denied: ${reason}.`)}
          onReport={() => setDecision("Reported: this wasn't me.")}
        />
      )}
    </Page>
  )
}
