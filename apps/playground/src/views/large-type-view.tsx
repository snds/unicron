// LargeTypeView as a viewer (full screen on a phone, 960 on the desktop): digits, letters and
// symbols in their own inks, ambiguous glyphs named. View: ?view=large-type-view
import { useState } from "react"
import { Button, LargeTypeView } from "@unicron/ui"

export default function LargeTypeViewView() {
  const [open, setOpen] = useState(true)
  return (
    <div className="flex flex-col items-start gap-4 p-6">
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Show large type
      </Button>
      <LargeTypeView
        open={open}
        onOpenChange={setOpen}
        title="Wi-Fi password · Home"
        getSecret={() => Promise.resolve(new TextEncoder().encode("Pine0-Hollow!l9"))}
        allowCopy
        onCopy={() => {}}
      />
    </div>
  )
}
