// Toasts in the frame (contract 5.1c C6): the frame tells the Toaster where the content is and what
// its phone status strip means. No strip: the toast takes the strip's slot above the bottom row. A
// strip without an action gives way for the toast's time. A strip with an action (undo send) is
// never covered: toasts wait. A needs-you strip never gives way: the toast sits under the top row.
// Desktop: the bottom left of the content, three at most. View: ?view=app-frame-toasts
import { useEffect } from "react"
import {
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameTopRow,
  AppLockup,
  Button,
  FloatButton,
  ListRow,
  NavItem,
  NavSection,
  StatusItem,
  TabBar,
  TabBarItem,
  Toaster,
  toast,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

const ROWS = [
  { sender: "Mira Chen", time: "09:14", subject: "Cabin for the 20th, confirmed", preview: "Booked the two-bedroom. Check-in is after 3." },
  { sender: "Ledger Bank", time: "08:02", subject: "Your November statement is ready", preview: "The statement for your checking account is ready." },
  { sender: "Theo Park", time: "WED", subject: "Re: Saturday carpool", preview: "I can take both kids this week." },
  { sender: "Figma", time: "WED", subject: "3 comments on Theme Studies", preview: "New comments on the Swiss frame." },
  { sender: "Calendar", time: "TUE", subject: "Dentist moved to 4:30 PM", preview: "Your appointment on Nov 18 has a new time." },
]

function Inbox() {
  return (
    <AppFrameMain>
      <AppFrameList aria-label="Inbox">
        <AppFramePageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" />
        <ul aria-label="Messages" className="flex flex-col">
          {ROWS.map((r) => (
            <ListRow key={r.subject} render={<li />} layout="message" sender={r.sender} time={r.time} subject={r.subject} preview={r.preview} href="#message" />
          ))}
        </ul>
      </AppFrameList>
    </AppFrameMain>
  )
}

function Chrome() {
  return (
    <>
      <AppFrameTopRow lockup={<AppLockup name="Vale" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
      <AppFrameBottomRow
        start={<FloatButton label="Search" icon="search" size="l" />}
        tabs={
          <TabBar label="Sections" value="mail">
            <TabBarItem value="mail" icon="email" label="Mail" />
            <TabBarItem value="calendar" icon="calendar" label="Calendar" />
            <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
            <TabBarItem value="notes" icon="notebook" label="Notes" />
          </TabBar>
        }
        end={<FloatButton label="New message" icon="edit" kind="primary" size="l" />}
      />
    </>
  )
}

/**
 * One finished action's toast in a frame's own Toaster, held still for the picture. It is raised a
 * moment after the frame has drawn, as a real one is, once the strip has told the frame its state.
 */
function Raise({ id, title, action = true }: { id: string; title: string; action?: boolean }) {
  useEffect(() => {
    let raised: string | number | undefined
    const later = setTimeout(() => {
      raised = toast(title, {
        toasterId: id,
        duration: Number.POSITIVE_INFINITY,
        action: action ? { label: "Undo", onClick: () => {} } : undefined,
      })
    }, 120)
    return () => {
      clearTimeout(later)
      if (raised !== undefined) toast.dismiss(raised)
    }
  }, [id, title, action])
  return <Toaster id={id} />
}

export default function AppFrameToastsView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Phone // a toast takes the status strip's slot, so the bottom never holds three bars">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={640} layout="phone" label="No strip // the toast in the strip's slot, above the bottom row">
            <Inbox />
            <Chrome />
            <Raise id="toast-none" title="Archived Budget for audits" />
          </FrameBox>

          <FrameBox width={390} height={640} layout="phone" label="Live strip, no action // it gives way for the toast's time, then comes back">
            <Inbox />
            <AppFrameAccessory tone="live" meta="Syncing // Personal + Work" title="Checking 2 accounts" />
            <Chrome />
            <Raise id="toast-live" title="Moved 3 messages to Archive" />
          </FrameBox>

          <FrameBox width={390} height={640} layout="phone" label="Live strip with an action // never covered: the toast waits until it ends">
            <Inbox />
            <AppFrameAccessory
              tone="live"
              meta="Sending"
              countdown={8}
              title="Board games for the cabin"
              action={{ label: "Undo", onClick: () => {} }}
              progress={{ value: 8, max: 10 }}
              announce="Sending. 10 seconds to undo."
            />
            <Chrome />
            <Raise id="toast-wait" title="Archived Budget for audits" />
          </FrameBox>

          <FrameBox width={390} height={640} layout="phone" label="Needs-you strip // it never gives way: the toast sits under the top row">
            <Inbox />
            <AppFrameAccessory tone="needs-you" meta="Sign-in request // 01" title="Chrome on Windows" action={{ label: "Review", onClick: () => {} }} />
            <Chrome />
            <Raise id="toast-top" title="Copied the password for Steam" action={false} />
          </FrameBox>
        </div>
      </Specimen>

      <Specimen label="Desktop // the bottom left of the content, three at most">
        <FrameBox width={1180} height={480} layout="expanded" label="Vale // beside a 204 sidebar, 24 above the foot">
          <AppFrameSidebar lockup={<AppLockup name="Vale" />} action={{ label: "Compose", icon: "edit" }}>
            <NavSection title="Apps" count={4}>
              <NavItem label="Mail" icon="email" count={12} current href="#mail" />
              <NavItem label="Calendar" icon="calendar" count={3} href="#calendar" />
              <NavItem label="Contacts" icon="user--multiple" href="#contacts" />
              <NavItem label="Notes" icon="notebook" href="#notes" />
            </NavSection>
          </AppFrameSidebar>
          <AppFrameStatusLine crumbs={[{ label: "Mail", href: "#mail" }, { label: "Inbox" }]}>
            <StatusItem text="Synced // 09:16" />
          </AppFrameStatusLine>
          <Inbox />
          <Raise id="toast-desktop" title="Archived Budget for audits" />
        </FrameBox>
      </Specimen>

      <Specimen label="Try it // a toast in this page's own Toaster (4 s; 6 s with an action)">
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => toast("Saved Steam")}>
            Save
          </Button>
          <Button variant="secondary" onClick={() => toast("Archived Budget for audits", { action: { label: "Undo", onClick: () => toast("Restored Budget for audits") } })}>
            Archive
          </Button>
        </div>
      </Specimen>
    </div>
  )
}
