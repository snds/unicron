// ApprovalSheet as Lockdown's sign-in review (40:1441 on a phone, 41:3394 on the desktop): Sheet
// Header, the request's facts as Field Rows, one sentence, the no and the yes. Nothing to match
// here; see approval-sheet-pairing and approval-sheet-enter. View: ?view=approval-sheet
import { useState } from "react"
import { ApprovalSheet, Button } from "@unicron/ui"

export default function ApprovalSheetView() {
  const [open, setOpen] = useState(true)
  const [at] = useState(() => Date.now() + 100_000)
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p className="type-body text-text-secondary">Sign-in request // Steam on a Windows PC</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Review sign-in
      </Button>
      <ApprovalSheet
        open={open}
        onOpenChange={setOpen}
        kind="device"
        origin="push"
        overline="Sign-in request"
        title="Steam on a Windows PC"
        matching={{ mode: "none" }}
        expiresAt={at}
        context={[
          { label: "Account", value: "kestrel.04" },
          { label: "Device", value: "Windows 11 // Edge 131" },
          { label: "Near", value: "Sacramento, CA" },
          { label: "Time", value: "14:31" },
        ]}
        note="Not you? Deny, and Lockdown locks this login until you change the password."
        approveLabel="Approve with Face ID"
        approveIcon="fingerprint-recognition"
        dismiss="keep"
        onApprove={() => setOpen(false)}
        onDeny={() => {}}
        onReport={() => {}}
      />
    </div>
  )
}
