// Toaster: solid toasts at the bottom left of the content (the frame says where with
// --frame-toast-left and --frame-toast-bottom), three at most, one action. View: ?view=toaster
import { useEffect, type CSSProperties } from "react"
import { Button, toast, Toaster } from "@unicron/ui"

import { Specimen, Stage } from "./_stage"

/** The toasts a finished action raises (Lockdown X2, Warpcore U-04), held still for the picture. */
function useToasts(toasterId: string) {
  useEffect(() => {
    const keep = { toasterId, duration: Number.POSITIVE_INFINITY }
    const ids = [
      toast("Copied the password for Steam, clears in 30 s", keep),
      toast("Archived Budget for audits", { ...keep, action: { label: "Undo", onClick: () => {} } }),
      toast.error("Couldn't move Steam", { ...keep, description: "The Family vault is read-only for you." }),
    ]
    return () => ids.forEach((id) => toast.dismiss(id))
  }, [toasterId])
}

function Desktop() {
  useToasts("view-desktop")
  return <Toaster id="view-desktop" />
}

function Phone() {
  useToasts("view-phone")
  return <Toaster id="view-phone" />
}

export default function ToasterView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <Stage label="Desktop // bottom left of the content column, beside a 252 sidebar" width={1392} height={560} app="lockdown">
        {() => (
          // The frame says where toasts go; here, the content column starts 276 in.
          <div className="absolute inset-0" style={{ "--frame-toast-left": "276px", "--frame-toast-bottom": "24px" } as CSSProperties}>
            <Desktop />
          </div>
        )}
      </Stage>

      <Stage label="Phone // the status-strip slot above the bottom row" width={390} height={844} app="warpcore">
        {() => (
          <div className="absolute inset-0" style={{ "--frame-toast-left": "16px", "--frame-toast-bottom": "80px" } as CSSProperties}>
            <Phone />
          </div>
        )}
      </Stage>

      <Specimen label="Try it // 4 s, or 6 s with an action; the action takes focus after a keyboard removal">
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => toast("Saved Steam")}>
            Save
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast("Moved Steam to Recently deleted", { action: { label: "Undo", onClick: () => toast("Restored Steam") }, takeFocus: true })}
          >
            Delete
          </Button>
        </div>
      </Specimen>
    </div>
  )
}
