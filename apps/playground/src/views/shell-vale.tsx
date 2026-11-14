// Vale's first screen, the inbox, as one composition of the frame's parts: the sidebar, the status
// line, list + detail at 1440 (Desktop / 01, 36:699); the floating rows, the strip and the scrolled
// chrome at 390 (Mobile / 01, 34:45; States / 02, 51:1914). It switches by width; nothing here is
// a media query. The rows, the message head, the summary, the attachment and the composer are the
// system's own parts. Beyond the frames, the screen carries what the decisions add (5.1c): Search
// with its key above the first group (§6), the update mark on the way into Settings (§3; a demo
// state), and on a phone Archive raises its toast in the frame's own Toaster, which takes the
// strip's slot (C6). View: ?view=shell-vale
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
  AppLockup,
  Composer,
  EmptyState,
  FileChip,
  FloatButton,
  ListRow,
  MetaItem,
  MetaList,
  NavItem,
  NavSection,
  Prose,
  StatusItem,
  SummaryBlock,
  TabBar,
  TabBarItem,
  Toaster,
  TopBar,
  toast,
  useAppFrame,
} from "@unicron/ui"

const MESSAGES = [
  { id: "mira", sender: "Mira Chen", time: "09:14", subject: "Cabin for the 20th, confirmed", preview: "Booked the two-bedroom. Check-in is after 3, and the road up is fine without chains.", unread: true },
  { id: "ledger", sender: "Ledger Bank", time: "08:02", subject: "Your November statement is ready", preview: "The statement for your checking account is ready to view." },
  { id: "theo", sender: "Theo Park", time: "WED", subject: "Re: Saturday carpool", preview: "I can take both kids this week if you grab them next Saturday.", unread: true },
  { id: "figma", sender: "Figma", time: "WED", subject: "3 comments on Theme Studies", preview: "New comments on the Swiss frame from your team." },
  { id: "calendar", sender: "Calendar", time: "TUE", subject: "Dentist moved to 4:30 PM", preview: "Your appointment on Nov 18 has a new time." },
  { id: "pine", sender: "Pine Hollow Cabins", time: "TUE", subject: "Booking confirmation PH-20817", preview: "Fri 11.20 – Sun 11.22 // 2 nights. Check-in after 15:00." },
  { id: "ben", sender: "Ben Ortiz", time: "MON", subject: "Lunch Thursday?", preview: "The new place on 5th has a patio. Noon works for me." },
]

// Decisions §3: an update shows only as a mark on the way into Settings. The demo holds one ready.
const UPDATE = { square: true, label: "Update ready" } as const

/**
 * The inbox inside a frame; the app-frame view reuses it in boxes of each shell. With `toasterId`
 * (the id of a Toaster inside the same frame), Archive on a phone takes the message out of the list
 * and says so in a toast with Undo.
 */
export function ValeInbox({ toasterId }: { toasterId?: string } = {}) {
  const frame = useAppFrame()
  const [section, setSection] = useState("mail")
  const [picked, setPicked] = useState<string | null>(null)
  const [archived, setArchived] = useState<readonly string[]>([])
  const messages = MESSAGES.filter((m) => !archived.includes(m.id))
  // Desktop / 01 shows the first message open; a phone starts on the list (Vale never picks a row by itself there).
  const open = picked ?? (frame.split ? messages[0]?.id ?? null : null)
  const message = messages.find((m) => m.id === open)
  const archive = toasterId
    ? () => {
        if (!message) return
        const { id, subject } = message
        setArchived((ids) => [...ids, id])
        setPicked(null)
        toast(`Archived ${subject}`, { toasterId, action: { label: "Undo", onClick: () => setArchived((ids) => ids.filter((x) => x !== id)) } })
      }
    : undefined

  return (
    <>
      <AppFrameSidebar
        lockup={<AppLockup name="Vale" />}
        action={{ label: "Compose", icon: "edit" }}
        footer={<NavItem label="Settings" icon="settings" mark={UPDATE} href="#settings" />}
      >
        <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
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
                <FloatButton label="Archive" icon="archive" size="l" onClick={archive} />
                <FloatButton label="More" icon="overflow-menu--horizontal" size="l" />
              </>
            }
          />
        </AppFrameTopRow>
      ) : (
        <AppFrameTopRow lockup={<AppLockup name="Vale" />} title="Inbox" actions={<FloatButton label="Settings" icon="user--avatar" size="l" mark={UPDATE} />} />
      )}

      <AppFrameMain>
        <AppFrameList aria-label="Inbox">
          <AppFramePageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" />
          <ul aria-label="Messages" className="flex flex-col">
            {messages.map((m) => (
              <ListRow
                key={m.id}
                render={<li />}
                layout="message"
                sender={m.sender}
                time={m.time}
                subject={m.subject}
                preview={m.preview}
                unread={m.unread}
                selected={frame.split && m.id === open}
                onClick={() => setPicked(m.id)}
              />
            ))}
          </ul>
        </AppFrameList>
        <AppFrameDetail open={picked !== null} onBack={() => setPicked(null)} aria-label={message?.subject ?? "Message"}>
          {message ? (
            <AppFrameInset fill>
              <div className="flex flex-1 flex-col gap-8">
                <MetaList>
                  <MetaItem label="From">{message.sender}</MetaItem>
                  <MetaItem label="Received">{message.time}</MetaItem>
                  <MetaItem label="Attached">01</MetaItem>
                </MetaList>
                <AppFramePageHead size="sm" title={message.subject} />
                <SummaryBlock
                  overline="Summary // 03 points"
                  lines={["Two-bedroom cabin is booked for Nov 20 to 22.", "Check-in is after 3 PM. No chains needed.", "Mira asks you to bring the board games."]}
                />
                <Prose>
                  <p>Hi,</p>
                  <p>Booked the two-bedroom for the 20th through the 22nd. Check-in is after 3, and the road up is fine without chains this time of year.</p>
                  <p>Could you bring the board games? I&apos;ll handle groceries for the first night.</p>
                  <p>Mira</p>
                </Prose>
                <div className="flex">
                  <FileChip name="Pine Hollow booking.pdf" type="PDF" size="84 KB" href="#pine-hollow-booking" />
                </div>
                {frame.split ? (
                  <div className="mt-auto">
                    <Composer placeholder="Reply to Mira" />
                  </div>
                ) : null}
              </div>
            </AppFrameInset>
          ) : (
            <AppFrameInset>
              <EmptyState size="sm" overline="Inbox" title="Nothing open." body="Pick a message to see it here." />
            </AppFrameInset>
          )}
        </AppFrameDetail>
      </AppFrameMain>

      {/* Nothing live: once the page has scrolled, the place strip (States / 02). */}
      <AppFrameAccessory scrolledOnly meta="Inbox // 012 unread" title="Cabin for the 20th" />

      {message && !frame.split ? (
        <AppFrameBottomRow variant="detail" fill={<Composer size="line" placeholder="Reply to Mira" />} />
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
  // The frame's own Toaster (C6): inside the AppFrame, so it reads the strip and the frame's place.
  // An id keeps it apart from the playground's Toaster at the root.
  return (
    <AppFrame>
      <ValeInbox toasterId="shell-vale" />
      <Toaster id="shell-vale" />
    </AppFrame>
  )
}
