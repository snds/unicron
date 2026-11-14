// Vale's first screen, the inbox, as one composition of the frame's parts: the sidebar, the status
// line, list + detail at 1440 (Desktop / 01, 36:699); the floating rows, the strip and the scrolled
// chrome at 390 (Mobile / 01, 34:45; States / 02, 51:1914). It switches by width; nothing here is
// a media query. Rows, the message and the composer are stand-ins (./_shell-parts) until data-a,
// data-b and chat land. View: ?view=shell-vale
import { useState } from "react"
import {
  AppFrame,
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameTopRow,
  FloatButton,
  StatusItem,
  useAppFrame,
} from "@unicron/ui"
import { AppLockup } from "@unicron/ui/app-lockup"
import { NavItem, NavSection } from "@unicron/ui/nav-item"
import { TabBar, TabBarItem } from "@unicron/ui/tab-bar"
import { TopBar } from "@unicron/ui/top-bar"

import { StandInComposer, StandInMessageRow, StandInRows, StandInText } from "./_shell-parts"

const MESSAGES = [
  { id: "mira", sender: "Mira Chen", time: "09:14", subject: "Cabin for the 20th, confirmed", preview: "Booked the two-bedroom. Check-in is after 3, and the road up is fine without chains.", unread: true },
  { id: "ledger", sender: "Ledger Bank", time: "08:02", subject: "Your November statement is ready", preview: "The statement for your checking account is ready to view." },
  { id: "theo", sender: "Theo Park", time: "WED", subject: "Re: Saturday carpool", preview: "I can take both kids this week if you grab them next Saturday.", unread: true },
  { id: "figma", sender: "Figma", time: "WED", subject: "3 comments on Theme Studies", preview: "New comments on the Swiss frame from your team." },
  { id: "calendar", sender: "Calendar", time: "TUE", subject: "Dentist moved to 4:30 PM", preview: "Your appointment on Nov 18 has a new time." },
  { id: "pine", sender: "Pine Hollow Cabins", time: "TUE", subject: "Booking confirmation PH-20817", preview: "Fri 11.20 – Sun 11.22 // 2 nights. Check-in after 15:00." },
  { id: "ben", sender: "Ben Ortiz", time: "MON", subject: "Lunch Thursday?", preview: "The new place on 5th has a patio. Noon works for me." },
]

function Inbox() {
  const frame = useAppFrame()
  const [section, setSection] = useState("mail")
  const [picked, setPicked] = useState<string | null>(null)
  // Desktop / 01 shows the first message open; a phone starts on the list (Vale never picks a row by itself there).
  const open = picked ?? (frame.split ? "mira" : null)
  const message = MESSAGES.find((m) => m.id === open)

  return (
    <>
      <AppFrameSidebar
        lockup={<AppLockup name="Vale" />}
        action={{ label: "Compose", icon: "edit" }}
        footer={<NavItem label="Settings" icon="settings" href="#settings" />}
      >
        <NavSection title="Apps" count={4}>
          <NavItem label="Mail" icon="email" count={12} href="#mail" />
          <NavItem label="Calendar" icon="calendar" count={3} href="#calendar" />
          <NavItem label="Contacts" icon="user--multiple" href="#contacts" />
          <NavItem label="Notes" icon="notebook" href="#notes" />
        </NavSection>
        <NavSection title="Mail // folders">
          <NavItem label="Inbox" icon="email" count={12} current href="#inbox" />
          <NavItem label="Starred" icon="star" count={4} href="#starred" />
          <NavItem label="Drafts" icon="edit" count={2} href="#drafts" />
          <NavItem label="Sent" icon="send" href="#sent" />
          <NavItem label="Archive" icon="archive" href="#archive" />
        </NavSection>
        <NavSection title="Accounts" count={2}>
          <NavItem label="Personal" icon="user--avatar" count={12} href="#personal" />
          <NavItem label="Work" icon="document" count={31} href="#work" />
        </NavSection>
      </AppFrameSidebar>

      <AppFrameStatusLine crumbs={[{ label: "Mail", href: "#mail" }, { label: "Inbox" }]}>
        <StatusItem text="Synced // 09:16" />
      </AppFrameStatusLine>

      {message && !frame.split ? (
        <AppFrameTopRow>
          <TopBar
            onBack={() => setPicked(null)}
            actions={
              <>
                <FloatButton label="Archive" icon="archive" size="l" />
                <FloatButton label="More" icon="overflow-menu--horizontal" size="l" />
              </>
            }
          />
        </AppFrameTopRow>
      ) : (
        <AppFrameTopRow lockup={<AppLockup name="Vale" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
      )}

      <AppFrameMain>
        <AppFrameList aria-label="Inbox">
          <AppFramePageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" />
          <StandInRows label="Messages">
            {MESSAGES.map((m) => (
              <StandInMessageRow key={m.id} {...m} selected={frame.split && m.id === open} onOpen={() => setPicked(m.id)} />
            ))}
          </StandInRows>
        </AppFrameList>
        <AppFrameDetail open={picked !== null} onBack={() => setPicked(null)} aria-label={message?.subject ?? "Message"}>
          {message ? (
            <AppFrameInset className="flex min-h-full flex-col gap-8">
              <div className="flex gap-8">
                {[
                  ["From", message.sender],
                  ["Received", message.time],
                  ["Attached", "01"],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="type-overline text-text-label">{label}</span>
                    <span className="type-meta text-text-body">{value}</span>
                  </div>
                ))}
              </div>
              <AppFramePageHead size="sm" title={message.subject} />
              <StandInText>
                <p>Hi,</p>
                <p>Booked the two-bedroom for the 20th through the 22nd. Check-in is after 3, and the road up is fine without chains this time of year.</p>
                <p>Could you bring the board games? I'll handle groceries for the first night.</p>
                <p>Mira</p>
              </StandInText>
              {frame.split ? (
                <div className="mt-auto flex">
                  <StandInComposer placeholder="Reply to Mira" />
                </div>
              ) : null}
            </AppFrameInset>
          ) : (
            <AppFrameInset className="flex flex-col gap-1 pt-2">
              <p className="type-overline text-text-label">Inbox</p>
              <p className="type-title text-text-body">Nothing open.</p>
              <p className="type-body text-text-secondary">Pick a message to see it here.</p>
            </AppFrameInset>
          )}
        </AppFrameDetail>
      </AppFrameMain>

      {/* Nothing live: once the page has scrolled, the place strip (States / 02). */}
      <AppFrameAccessory scrolledOnly meta="Inbox // 012 unread" title="Cabin for the 20th" />

      {message && !frame.split ? (
        <AppFrameBottomRow variant="detail" fill={<StandInComposer placeholder="Reply to Mira" />} />
      ) : (
        <AppFrameBottomRow
          start={<FloatButton label="Search" icon="search" size="l" />}
          tabs={
            <TabBar label="Sections" value={section} onValueChange={setSection}>
              <TabBarItem value="mail" icon="email" label="Mail" />
              <TabBarItem value="calendar" icon="calendar" label="Calendar" />
              <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
              <TabBarItem value="notes" icon="notebook" label="Notes" />
            </TabBar>
          }
          end={<FloatButton label="New message" icon="edit" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => {}} />}
        />
      )}
    </>
  )
}

export default function ShellVale() {
  return (
    <AppFrame>
      <Inbox />
    </AppFrame>
  )
}
