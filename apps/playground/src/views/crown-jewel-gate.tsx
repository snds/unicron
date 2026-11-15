// CrownJewelGate, the question that guards a crown jewel: the reason, the account password in
// SecretField's edit box, Cancel and Confirm (open, with an error and two tries left); and the
// biometric level behind the second button. View: ?view=crown-jewel-gate
import { useState } from "react"
import { Button, CrownJewelGate } from "@unicron/ui"

export default function CrownJewelGateView() {
  const [open, setOpen] = useState(true)
  const [biometric, setBiometric] = useState(false)
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Show recovery phrase
      </Button>
      <Button variant="secondary" onClick={() => setBiometric(true)}>
        Copy recovery phrase
      </Button>
      {/* The biometric level: the system's own check runs as the gate opens; nothing is typed. */}
      <CrownJewelGate
        open={biometric}
        onOpenChange={setBiometric}
        level="biometric"
        reason="To copy the recovery phrase for Ledger"
        onBiometric={() => new Promise((resolve) => setTimeout(() => resolve("ok"), 800))}
        onConfirm={() => setBiometric(false)}
      />
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
