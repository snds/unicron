// ApprovalSheet comparing a code (Lockdown brief A1, browser pairing): the code in DigitGroups,
// "They match" and "Codes differ". View: ?view=approval-sheet-pairing
import { useState } from "react"
import { ApprovalSheet, Button } from "@unicron/ui"

export default function ApprovalSheetPairingView() {
  const [open, setOpen] = useState(true)
  const [at] = useState(() => Date.now() + 100_000)
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p className="type-body text-text-secondary">Pairing request // Chrome on Linux</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Review pairing
      </Button>
      <ApprovalSheet
        open={open}
        onOpenChange={setOpen}
        kind="bridge"
        origin="pairing"
        overline="Pairing request"
        title="Pair Chrome on Linux?"
        matching={{ mode: "compare", code: "482913", prompt: "Approve only if the Lockdown extension in your browser shows this code." }}
        expiresAt={at}
        context={[
          { label: "Browser", value: "Chrome on Linux" },
          { label: "Kind", value: "Chromium" },
        ]}
        note="A paired browser can ask to fill the sign-ins, codes and cards on this computer. It never sees your vault."
        denyLabel="Codes differ"
        dismiss="keep"
        onApprove={() => setOpen(false)}
        onDeny={() => {}}
        onReport={() => {}}
      />
    </div>
  )
}
