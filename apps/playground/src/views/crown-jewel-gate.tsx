// CrownJewelGate, the question that guards a crown jewel's reveal: the reason, the account
// password in SecretField's edit box, Cancel and Confirm. View: ?view=crown-jewel-gate
import { useState } from "react"
import { Button, CrownJewelGate } from "@unicron/ui"

export default function CrownJewelGateView() {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Show recovery phrase
      </Button>
      <CrownJewelGate
        open={open}
        onOpenChange={setOpen}
        level="password"
        reason="To show the recovery phrase for Ledger"
        attemptsLeft={2}
        error="Password incorrect."
        onConfirm={() => setOpen(false)}
      />
    </div>
  )
}
