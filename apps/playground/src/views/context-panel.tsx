// ContextPanel: Warpcore's chat workspace (DR §7; chat workspace frames 01 to 06): the panel open
// with its tabs (Filter Chip look, tab semantics), collapsed to a rail of icons and counts, hidden
// for the chat-only focus, an artifact in its place beside the chat, and on a phone the same
// content as the sheet the app passes. View: ?view=context-panel
import { useState } from "react"
import {
  AppFrameColumn,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameTopBar,
  ContextPanel,
  FloatButton,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  StatusItem,
  type ContextPanelState,
  type ContextPanelTab,
} from "@unicron/ui"
import { AppLockup } from "@unicron/ui/app-lockup"
import { TopTab, TopTabs } from "@unicron/ui/top-tabs"

import { FrameBox, Specimen } from "./_frame-boxes"
import { StandInComposer, StandInInlineRow, StandInMessage, StandInRows, StandInSection } from "./_shell-parts"

const TABS: ContextPanelTab[] = [
  { value: "tasks", label: "Tasks", icon: "task", count: 3, live: true, liveLabel: "2 running" },
  { value: "artifacts", label: "Artifacts", icon: "code", count: 4 },
  { value: "envs", label: "Envs", icon: "cloud", count: 3 },
  { value: "files", label: "Files", icon: "document", count: 6 },
]

function Panel({ value }: { value: string }) {
  if (value === "tasks") {
    return (
      <>
        <StandInSection title="Running" count="02" />
        <StandInRows label="Running">
          <StandInInlineRow title="Full test suite" meta="SEA-51 // Cloud sandbox // 41 of 128" status="+ 02:14" statusTone="live" progress={32} />
          <StandInInlineRow title="Add baseline drift check" meta="SEA-48 // Codex // Step 3 of 4" status="+ 04:12" statusTone="live" progress={75} />
        </StandInRows>
        <StandInSection title="Queued" count="01" />
        <StandInRows label="Queued">
          <StandInInlineRow title="Index Vale decisions" meta="SEA-46 // Local model" status="Next" />
        </StandInRows>
      </>
    )
  }
  return <StandInSection title={value} count="04" />
}

function Workspace({ initial, artifact = false, chats = true }: { initial: ContextPanelState; artifact?: boolean; chats?: boolean }) {
  const [state, setState] = useState<ContextPanelState>(initial)
  const [value, setValue] = useState("tasks")
  const [sheet, setSheet] = useState(false)
  return (
    <>
      <AppFrameTopBar
        lockup={<AppLockup name="Warpcore" />}
        tabs={
          <TopTabs label="Sections">
            <TopTab label="Chat" index="01" icon="chat" current href="#chat" />
            <TopTab label="Docs" index="02" icon="document" href="#docs" />
            <TopTab label="Tasks" index="03" icon="task" href="#tasks" />
          </TopTabs>
        }
        status={<StatusItem text="Spend // $3.40 of $10.00" short="$3.40" href="#spend" />}
        action={{ label: "New chat", icon: "add" }}
        actions={<FloatButton label="Settings" icon="settings" />}
      />
      <AppFrameMain>
        {chats ? (
          <AppFrameList size="narrow" aria-label="Chats">
            <StandInRows label="Chats">
              <StandInInlineRow title="OPAQUE login" meta="Claude Code // 14:06" status="SEA-51" selected />
              <StandInInlineRow title="Drift check scope" meta="Codex // 13:12" status="SEA-48" />
            </StandInRows>
          </AppFrameList>
        ) : null}
        <AppFrameColumn reading={state !== "open" && !artifact} aria-label="Chat">
          <AppFramePageHead size="sm" overline="Chat // SEA-51 // Claude Code" title="OPAQUE login" />
          <div className="flex flex-col gap-8">
            <StandInMessage from="You" time="14:02" mine>
              Split the OPAQUE migration into a diff I can review, and run the full test suite in the background.
            </StandInMessage>
            <StandInMessage from="Claude Code" time="14:03">
              Done. The diff is ready, and the tests are running in the cloud sandbox. I'll post here when they finish.
            </StandInMessage>
            <div className="flex">
              <StandInComposer placeholder="Ask about SEA-51, or @ a file" />
            </div>
          </div>
        </AppFrameColumn>
        <ContextPanel
          state={state}
          onStateChange={setState}
          tabs={TABS}
          value={value}
          onValueChange={setValue}
          artifact={
            artifact ? (
              <div className="flex flex-col gap-4">
                <AppFramePageHead size="sm" overline="Artifact // Diagram // v1 of 1" title="Login flow" actions={<FloatButton label="Close" icon="close" />} />
                <p className="type-body text-text-secondary">The sequence diagram (Warpcore's own diagram theme).</p>
              </div>
            ) : undefined
          }
          sheet={
            <Sheet open={sheet} onOpenChange={setSheet}>
              <SheetContent side="bottom" aria-label="Context">
                <SheetHeader>
                  <SheetTitle>Context</SheetTitle>
                </SheetHeader>
                <Panel value={value} />
              </SheetContent>
            </Sheet>
          }
        >
          <Panel value={value} />
        </ContextPanel>
      </AppFrameMain>
    </>
  )
}

export default function ContextPanelView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Open // the tabs as Filter Chips with tab semantics (arrow keys, Home, End); collapse at the end">
        <FrameBox width={1440} height={720} layout="expanded" label="Chat workspace 01 // Tasks">
          <Workspace initial="open" />
        </FrameBox>
      </Specimen>
      <Specimen label="Rail // icons and counts, the live ink where something runs; a rail item opens its tab">
        <FrameBox width={1440} height={560} layout="expanded" label="Chat workspace 04 // the rail">
          <Workspace initial="rail" />
        </FrameBox>
      </Specimen>
      <Specimen label="Hidden // chat only">
        <FrameBox width={1440} height={420} layout="expanded" label="Chat workspace 05 // focus">
          <Workspace initial="hidden" chats={false} />
        </FrameBox>
      </Specimen>
      <Specimen label="An artifact takes the panel's place beside the chat (696)">
        <FrameBox width={1440} height={480} layout="expanded" label="Chat workspace 06 // artifact open">
          <Workspace initial="open" artifact chats={false} />
        </FrameBox>
      </Specimen>
    </div>
  )
}
