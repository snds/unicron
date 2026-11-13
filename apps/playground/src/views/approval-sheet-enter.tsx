// ApprovalSheet with number matching (a device asks; enter the digits it shows), one wrong try in.
// View: ?view=approval-sheet-enter
import { useEffect, useState } from "react"
import { ApprovalSheet, Button } from "@unicron/ui"

export default function ApprovalSheetEnterView() {
  const [open, setOpen] = useState(true)
  const [at] = useState(() => Date.now() + 15_000)
  // One wrong entry once the sheet is armed, so the picture shows the try counter.
  useEffect(() => {
    const t = setTimeout(() => {
      const cells = document.querySelectorAll<HTMLInputElement>('[data-slot="approval-sheet-match-cell"]')
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
      cells.forEach((cell, i) => {
        set?.call(cell, i === 0 ? "1" : "7")
        cell.dispatchEvent(new Event("input", { bubbles: true }))
      })
    }, 700)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <p className="type-body text-text-secondary">Device request // MacBook Air</p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Review device
      </Button>
      <ApprovalSheet
        open={open}
        onOpenChange={setOpen}
        kind="device"
        origin="pairing"
        title="Add MacBook Air?"
        matching={{ mode: "enter", digits: 2, expected: "42" }}
        expiresAt={at}
        context={[
          { label: "Device", value: "MacBook Air // macOS 26" },
          { label: "Near", value: "Sacramento, CA" },
          { label: "Time", value: "14:31" },
        ]}
        onApprove={() => setOpen(false)}
        onDeny={() => {}}
        onReport={() => {}}
      />
    </div>
  )
}
