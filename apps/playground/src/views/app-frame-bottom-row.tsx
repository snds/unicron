// AppFrameBottomRow, AppFrameAccessory and AppFrameScrollEdge: the phone's floating bottom row with
// its tab bar (rules.md 6.3), the status strip above it (6.4) and inside it once the page has
// scrolled (6.5), the detail form of a pushed screen (contract 5.1b #2), a strip alone, the fade
// under the chrome (6.6), and the short screen's trailing column. View: ?view=app-frame-bottom-row
import {
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameList,
  AppFrameMain,
  Composer,
  FloatButton,
  ListRow,
  TabBar,
  TabBarItem,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

const ROWS = [
  { sender: "Mira Chen", time: "09:14", subject: "Cabin for the 20th, confirmed", preview: "Booked the two-bedroom. Check-in is after 3." },
  { sender: "Ledger Bank", time: "08:02", subject: "Your November statement is ready", preview: "The statement for your checking account is ready." },
  { sender: "Theo Park", time: "WED", subject: "Re: Saturday carpool", preview: "I can take both kids this week." },
  { sender: "Figma", time: "WED", subject: "3 comments on Theme Studies", preview: "New comments on the Swiss frame." },
]

function Rows() {
  return (
    <AppFrameMain>
      <AppFrameList aria-label="Inbox">
        <ul aria-label="Messages" className="flex flex-col">
          {ROWS.map((r) => (
            <ListRow key={r.subject} render={<li />} layout="message" sender={r.sender} time={r.time} subject={r.subject} preview={r.preview} href="#message" />
          ))}
        </ul>
      </AppFrameList>
    </AppFrameMain>
  )
}

function ValeSections() {
  return (
    <TabBar label="Sections" value="mail">
      <TabBarItem value="mail" icon="email" label="Mail" />
      <TabBarItem value="calendar" icon="calendar" label="Calendar" />
      <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
      <TabBarItem value="notes" icon="notebook" label="Notes" />
    </TabBar>
  )
}

const search = <FloatButton label="Search" icon="search" size="l" />
const create = <FloatButton label="New message" icon="edit" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => {}} />

export default function AppFrameBottomRowView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Tabs // search, the tab bar filling, create; content fades into the ground under it">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={420} layout="phone" label="Vale // no strip">
            <Rows />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
          <FrameBox width={390} height={420} layout="phone" label="Vale // a live strip above the row">
            <Rows />
            <AppFrameAccessory tone="live" meta="Syncing // Personal + Work" title="Checking 2 accounts" />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
          <FrameBox width={390} height={420} layout="phone" label="Lockdown // the needs-you strip">
            <Rows />
            <AppFrameAccessory tone="needs-you" meta="Sign-in request // 00:40 ago" title="Steam on a Windows PC" action={{ label: "Review" }} />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Scrolled // the tab bar shrinks to the active tab and the strip joins the row: one bar">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={300} layout="phone" minimized label="Vale // the place strip (only once scrolled)">
            <Rows />
            <AppFrameAccessory scrolledOnly meta="Inbox // 012 unread" title="Cabin for the 20th" />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
          <FrameBox width={390} height={300} layout="phone" minimized label="Warpcore // a live strip, compact">
            <Rows />
            <AppFrameAccessory tone="live" meta="Tasks // 03 running" title="SEA-48 running 04:12" />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
          <FrameBox width={390} height={300} layout="phone" minimized label="Synapse // needs-you keeps its yellow">
            <Rows />
            <AppFrameAccessory tone="needs-you" meta="Awaiting your review // 02" title="Harness changes from agents" />
            <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Detail // a pushed screen: start, fill, end, no tab bar">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={300} layout="phone" label="Vale // the reply field fills">
            <Rows />
            <AppFrameBottomRow variant="detail" fill={<Composer size="line" placeholder="Reply to Mira" />} />
          </FrameBox>
          <FrameBox width={390} height={300} layout="phone" label="Lockdown // two ends, the primary says its word">
            <Rows />
            <AppFrameBottomRow
              variant="detail"
              start={<FloatButton label="Copy username" icon="copy" size="l" />}
              end={<FloatButton label="Copy password" icon="copy" kind="primary" size="l" extended />}
            />
          </FrameBox>
          <FrameBox width={390} height={300} layout="phone" label="Vale // undo send above a detail row">
            <Rows />
            <AppFrameAccessory tone="live" meta="Sending // 08 S" title="Board games for the cabin" action={{ label: "Undo" }} progress={{ value: 2, max: 10 }} />
            <AppFrameBottomRow variant="detail" fill={<Composer size="line" placeholder="Reply to Mira" />} />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="No bottom row // the strip floats alone at the foot, 16 from each side (Settings, a form)">
        <FrameBox width={390} height={300} layout="phone" label="Vale // sending from a full-screen form">
          <Rows />
          <AppFrameAccessory tone="live" meta="Sending // 08 S" title="Board games for the cabin" action={{ label: "Undo" }} />
        </FrameBox>
      </Specimen>
      <Specimen label="Short screen // search, the tab bar turned vertical and create stand in the trailing column; the strip is compact at the foot">
        <FrameBox width={844} height={390} layout="rail" label="Vale // 844 × 390">
          <Rows />
          <AppFrameAccessory tone="live" meta="Syncing" title="Checking 2 accounts" />
          <AppFrameBottomRow start={search} tabs={<ValeSections />} end={create} />
        </FrameBox>
      </Specimen>
    </div>
  )
}
