// AppFrameStatusLine and StatusItem: the desktop top line of the sidebar apps (the crumbs in body
// ink at the start, the status in label ink at the end, both in the overline role, over a hairline;
// Vale Desktop / 01), and the status items it holds (contract 5.1b #4): tones, a square mark or a
// glyph, a countdown, a segmented bar, a text action, the item as a button or a link, one Badge,
// and the back slot at medium width. View: ?view=app-frame-status-line
import { useState, type ReactNode } from "react"
import { AppFrameColumn, AppFrameDetail, AppFrameList, AppFrameMain, AppFrameStatusLine, Badge, StatusItem } from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

function Line({ children, crumbs, badge }: { children?: ReactNode; crumbs: string[]; badge?: ReactNode }) {
  return (
    <>
      <AppFrameStatusLine crumbs={crumbs.map((label, i) => (i < crumbs.length - 1 ? { label, href: `#${label.toLowerCase()}` } : { label }))} badge={badge}>
        {children}
      </AppFrameStatusLine>
      <AppFrameMain>
        <AppFrameColumn aria-label="Content" />
      </AppFrameMain>
    </>
  )
}

export default function AppFrameStatusLineView() {
  const [said, setSaid] = useState("Checked // 15:37")
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Steady // the screen's own fact (Vale, Lockdown)">
        <div className="flex flex-col gap-4">
          <FrameBox width={1180} height={120} layout="expanded" label="Vale // Mail // Inbox">
            <Line crumbs={["Mail", "Inbox"]}>
              <StatusItem text="Synced // 09:16" />
            </Line>
          </FrameBox>
          <FrameBox width={1180} height={120} layout="expanded" label="Lockdown // the item as a button">
            <Line crumbs={["Items", "All"]}>
              <StatusItem text="Health // 03 to fix" label="Open Health" onClick={() => {}} />
            </Line>
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Live // the live one first, then the screen's fact; two at most">
        <div className="flex flex-col gap-4">
          <FrameBox width={1180} height={120} layout="expanded" label="Synapse // checking, then Check again">
            <Line crumbs={["Personal", "Overview"]} badge={<Badge tone="neutral">Sample</Badge>}>
              <StatusItem tone="live" mark="square" text="Checking // Personal // 41 of 218" progress={{ value: 41, max: 218, segments: 16 }} announce="Checking Personal." />
              <StatusItem text={said} label="Check again" onClick={() => setSaid("Checked // 15:38")} />
            </Line>
          </FrameBox>
          <FrameBox width={1180} height={120} layout="expanded" label="Vale // sending, with its countdown and UNDO">
            <Line crumbs={["Mail", "Inbox"]}>
              <StatusItem tone="live" mark="square" text="Sending" countdown={8} progress={{ value: 2, max: 10 }} action={{ label: "Undo", onClick: () => {} }} announce="Sending. 10 seconds to undo." />
              <StatusItem text="Synced // 09:16" />
            </Line>
          </FrameBox>
          <FrameBox width={1180} height={120} layout="expanded" label="Lockdown // the idle lock's countdown, a text action">
            <Line crumbs={["Items", "All"]}>
              <StatusItem tone="live" mark="time" text="Locks" countdown={252} action={{ label: "Stay unlocked", onClick: () => {} }} announce="Lockdown locks in 4 minutes." />
            </Line>
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Warning and critical // never yellow: the status line is not where something waits on you">
        <div className="flex flex-col gap-4">
          <FrameBox width={1180} height={120} layout="expanded" label="Vale // an account stopped syncing">
            <Line crumbs={["Mail", "Inbox"]}>
              <StatusItem tone="critical" mark="warning--alt" text="Work // not syncing since 09:16" />
            </Line>
          </FrameBox>
          <FrameBox width={1180} height={120} layout="expanded" label="Warpcore // spend near the cap, a link">
            <Line crumbs={["Tasks", "All"]}>
              <StatusItem tone="warning" mark="warning--alt" text="Spend // $8.20 of $10.00" href="#spend" />
            </Line>
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Medium // a pushed detail's way back takes the leading slot; the crumbs stay links">
        <FrameBox width={820} height={160} layout="medium" label="Vale // a message pushed at 820">
          <AppFrameStatusLine crumbs={[{ label: "Mail", href: "#mail" }, { label: "Inbox", href: "#inbox" }, { label: "Cabin for the 20th" }]}>
            <StatusItem text="Synced // 09:16" />
          </AppFrameStatusLine>
          <AppFrameMain>
            <AppFrameList aria-label="Inbox" />
            <AppFrameDetail open onBack={() => {}} aria-label="Message" />
          </AppFrameMain>
        </FrameBox>
      </Specimen>
    </div>
  )
}
