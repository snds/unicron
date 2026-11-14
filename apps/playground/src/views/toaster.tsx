// Toaster: solid toasts, three at most, one action. Each specimen is a real frame with its own
// Toaster inside it, so the frame says where toasts go (5.1c C6): the bottom left of the content on
// a desktop, the status strip's slot above the bottom row on a phone. View: ?view=toaster
import { useEffect } from "react"
import {
  AppFrameBottomRow,
  AppFrameColumn,
  AppFrameMain,
  AppFrameSidebar,
  AppFrameTopRow,
  AppLockup,
  Button,
  FloatButton,
  NavItem,
  NavSection,
  TabBar,
  TabBarItem,
  toast,
  Toaster,
} from "@unicron/ui"

import { FrameBox } from "./_frame-boxes"
import { PageBehind, Specimen } from "./_stage"

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

/** A frame's own Toaster, holding the three toasts. It must sit inside the AppFrame to read it. */
function Toasts({ id }: { id: string }) {
  useToasts(id)
  return <Toaster id={id} />
}

export default function ToasterView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <Specimen label="Desktop // bottom left of the content column, beside a 204 sidebar">
        {/* At its own width on any screen: a narrow window scrolls it sideways. */}
        <div className="max-w-full overflow-x-auto">
          <div className="w-max">
            <FrameBox width={1392} height={560} layout="expanded" label="Lockdown // 24 above the foot, three at most">
              <AppFrameSidebar lockup={<AppLockup name="Lockdown" />}>
                <NavSection title="Items // 06 types">
                  <NavItem label="All items" icon="folder" count={248} current href="#all" />
                  <NavItem label="Logins" icon="password" count={142} href="#logins" />
                  <NavItem label="Passkeys" icon="locked" count={61} href="#passkeys" />
                </NavSection>
              </AppFrameSidebar>
              <AppFrameMain>
                <AppFrameColumn aria-label="Items">
                  <PageBehind app="lockdown" />
                </AppFrameColumn>
              </AppFrameMain>
              <Toasts id="view-desktop" />
            </FrameBox>
          </div>
        </div>
      </Specimen>

      <Specimen label="Phone // the status-strip slot above the bottom row">
        <FrameBox width={390} height={844} layout="phone" label="Warpcore // as wide as the strip, 8 above the bottom row">
          <AppFrameTopRow lockup={<AppLockup name="Warpcore" />} actions={<FloatButton label="Settings" icon="settings" size="l" />} />
          <AppFrameMain>
            <AppFrameColumn aria-label="Tasks">
              <PageBehind app="warpcore" />
            </AppFrameColumn>
          </AppFrameMain>
          <AppFrameBottomRow
            start={<FloatButton label="Search" icon="search" size="l" />}
            tabs={
              <TabBar label="Sections" value="tasks">
                <TabBarItem value="chat" icon="chat" label="Chat" />
                <TabBarItem value="docs" icon="document" label="Docs" />
                <TabBarItem value="tasks" icon="task" label="Tasks" />
              </TabBar>
            }
            end={<FloatButton label="New task" icon="add" kind="primary" size="l" />}
          />
          <Toasts id="view-phone" />
        </FrameBox>
      </Specimen>

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
