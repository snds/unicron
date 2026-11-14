// The content columns: AppFrameList and AppFrameDetail at the drawn widths (432 beside a filling
// detail in the sidebar apps, a filling list beside a 534 detail in Warpcore), the rule between
// them with 12 on a list's side and 24 on a detail's; the reading column (720); the side panel
// (312); a peek over the content (648, no scrim); focus (the list steps aside); and the resizable
// companion pane. View: ?view=app-frame-columns
import { useState } from "react"
import {
  AppFrameColumn,
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFramePeek,
  AppFrameSidePanel,
  AppFrameStatusLine,
  Button,
  Icon,
  ListRow,
  Prose,
  SectionHeader,
  StatusItem,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

function Line({ crumbs }: { crumbs: string[] }) {
  return (
    <AppFrameStatusLine crumbs={crumbs.map((label) => ({ label }))}>
      <StatusItem text="Synced // 09:16" />
    </AppFrameStatusLine>
  )
}

function Message() {
  return (
    <AppFrameInset>
      <div className="flex flex-col gap-6">
        <AppFramePageHead size="sm" overline="From // Mira Chen // 09:14" title="Cabin for the 20th, confirmed" />
        <Prose>
          <p>Booked the two-bedroom for the 20th through the 22nd. Check-in is after 3, and the road up is fine without chains this time of year.</p>
        </Prose>
      </div>
    </AppFrameInset>
  )
}

function Inbox() {
  return (
    <AppFrameList aria-label="Inbox">
      <AppFramePageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" />
      <ul aria-label="Messages" className="flex flex-col">
        <ListRow render={<li />} layout="message" sender="Mira Chen" time="09:14" subject="Cabin for the 20th, confirmed" preview="Booked the two-bedroom." unread selected href="#mira" />
        <ListRow render={<li />} layout="message" sender="Ledger Bank" time="08:02" subject="Your November statement is ready" preview="The statement is ready to view." href="#ledger" />
      </ul>
    </AppFrameList>
  )
}

export default function AppFrameColumnsView() {
  const [peek, setPeek] = useState(true)
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="List + detail // 432 and the rest (648 at 1440): Vale, Lockdown, Synapse">
        <FrameBox width={1440} height={560} layout="expanded" label="1440 // list 432, rule at 720, detail from 744">
          <Line crumbs={["Mail", "Inbox"]} />
          <AppFrameMain>
            <Inbox />
            <AppFrameDetail aria-label="Message">
              <Message />
            </AppFrameDetail>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="A filling list beside a 534 detail // Warpcore's Tasks and Docs">
        <FrameBox width={1440} height={420} layout="expanded" label="1440 // list fills, detail 534">
          <Line crumbs={["Tasks", "All"]} />
          <AppFrameMain>
            <AppFrameList size="fill" aria-label="Tasks">
              <ul aria-label="Tasks" className="flex flex-col">
                <ListRow render={<li />} index="01" title="Migrate vault login to OPAQUE" meta="SEA-51 // Lockdown // Claude Code" status="Needs you" selected href="#sea-51" />
                <ListRow render={<li />} index="02" title="Add baseline drift check" meta="SEA-48 // Workspace // Codex" status="+ Running 04:12" tone="live" progress={20 / 32} href="#sea-48" />
              </ul>
            </AppFrameList>
            <AppFrameDetail size="narrow" aria-label="Task">
              <AppFrameInset>
                <AppFramePageHead size="sm" overline="SEA-51 // Claude Code // Risk 2" title="Migrate vault login to OPAQUE" />
              </AppFrameInset>
            </AppFrameDetail>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="Under 1280 // the list narrows to 320 (Lockdown 4.0)">
        <FrameBox width={1180} height={420} layout="expanded" label="1180 // list 320">
          <Line crumbs={["Mail", "Inbox"]} />
          <AppFrameMain>
            <Inbox />
            <AppFrameDetail aria-label="Message">
              <Message />
            </AppFrameDetail>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="Medium and phone // the detail is pushed over the list">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={820} height={420} layout="medium" label="820 // pushed, back in the status line">
            <Line crumbs={["Mail", "Inbox", "Cabin for the 20th"]} />
            <AppFrameMain>
              <Inbox />
              <AppFrameDetail open onBack={() => {}} aria-label="Message">
                <Message />
              </AppFrameDetail>
            </AppFrameMain>
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Reading column // 720 at most, centred">
        <FrameBox width={1440} height={360} layout="expanded" label="Warpcore // the conversation in focus">
          <AppFrameMain>
            <AppFrameColumn reading aria-label="Chat">
              <AppFramePageHead size="sm" overline="Chat // SEA-51 // Claude Code" title="OPAQUE login" />
              <Prose variant="response">
                <p>Done. The diff is ready, and the tests are running in the cloud sandbox. I&apos;ll post here when they finish.</p>
              </Prose>
            </AppFrameColumn>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="Side panel // 312 beside the content when it keeps its room; a sheet otherwise">
        <FrameBox width={1440} height={360} layout="expanded" label="Synapse // the activity beside the overview">
          <Line crumbs={["Personal", "Overview"]} />
          <AppFrameMain>
            <AppFrameColumn aria-label="Overview">
              <SectionHeader title="Failing checks" count="03 of 06" />
            </AppFrameColumn>
            <AppFrameSidePanel open onOpenChange={() => {}} title="Activity" minContent="detail">
              <SectionHeader title="Activity // Today" count={4} />
              <p className="type-ui text-text-body">Imported 12 notes from Obsidian</p>
            </AppFrameSidePanel>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="Peek // an item of another section over the right 648, no scrim, not modal; Esc closes it">
        <FrameBox width={1440} height={420} layout="expanded" label="Synapse // a failing check peeked from the overview">
          <Line crumbs={["Personal", "Overview"]} />
          <AppFrameMain>
            <AppFrameColumn aria-label="Overview">
              <SectionHeader title="Failing checks" count="03 of 06" />
              <Button variant="secondary" size="sm" onClick={() => setPeek(true)}>
                Peek K-14
              </Button>
            </AppFrameColumn>
            <AppFramePeek
              open={peek}
              onOpenChange={setPeek}
              title="A knowledge note links to a missing file"
              overline="Check // K-14"
              actions={
                <Button variant="ghost" size="sm">
                  <Icon name="launch" size="sm" />
                  Open in Checks
                </Button>
              }
            >
              <Prose>
                <p>knowledge/legion links to a file that was renamed on 11.12.</p>
              </Prose>
            </AppFramePeek>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
      <Specimen label="Focus // reading at length: the list steps aside">
        <FrameBox width={1440} height={300} layout="expanded" focus label="Synapse // a note in focus">
          <Line crumbs={["Knowledge", "legion"]} />
          <AppFrameMain>
            <Inbox />
            <AppFrameDetail aria-label="Note">
              <Message />
            </AppFrameDetail>
          </AppFrameMain>
        </FrameBox>
      </Specimen>
    </div>
  )
}
