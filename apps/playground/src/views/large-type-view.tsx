// LargeTypeView as a viewer (full screen on a phone, 960 on the desktop): digits, letters and
// symbols in their own inks, ambiguous glyphs named. Under it, the print form: the same layout
// drawn in the page, for a recovery kit. View: ?view=large-type-view
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
      <h3 className="type-overline">Print // the same layout inline: a recovery kit's page, in groups of four with their places</h3>
      <div className="rule-box w-full max-w-[--spacing(240)]">
        <LargeTypeView print title="Recovery kit · Secret Key" getSecret={() => Promise.resolve(new TextEncoder().encode("A3-K7PQ2M-9XZ4R-W8H6N"))} groupSize={4} showIndex />
      </div>
    </div>
  )
}
