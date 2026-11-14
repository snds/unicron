// Warpcore's first screen, Tasks with one waiting on you, as one composition of the frame's parts:
// the top bar, a list that fills and a 534 detail at 1440 (Desktop 01, 38:756); the floating rows,
// the live strip and the scrolled chrome at 390 (Mobile 06, 37:666; States 02, 51:5902). It
// switches by width. Rows, the needs-you block and the steps are stand-ins (./_shell-parts) until
// data-a, data-b and chat land. View: ?view=shell-warpcore
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
  AppFrameTopBar,
  AppFrameTopRow,
  AppLockup,
  Button,
  FloatButton,
  StatusItem,
  TabBar,
  TabBarItem,
  TopBar,
  TopTab,
  TopTabs,
  useAppFrame,
} from "@unicron/ui"

import { StandInChips, StandInInlineRow, StandInNeedsYou, StandInRows, StandInSection, StandInText } from "./_shell-parts"

const TASKS = [
  { id: "sea-51", index: "01", title: "Migrate vault login to OPAQUE", meta: "SEA-51 // Lockdown // Claude Code // Risk 2", status: "Needs you" },
  { id: "sea-48", index: "02", title: "Add baseline drift check", meta: "SEA-48 // Workspace // Codex // Risk 1", status: "+ Running 04:12", live: true, progress: 62 },
  { id: "sea-47", index: "03", title: "Promote Popover out of candidates", meta: "SEA-47 // Unicron // Claude Code // Risk 1", status: "+ Running 01:47", live: true, progress: 62 },
  { id: "sea-46", index: "04", title: "Index the Vale decision records", meta: "SEA-46 // Vale // Local model // Risk 1", status: "Queued" },
  { id: "sea-44", index: "05", title: "Nightly dependency audit", meta: "SEA-44 // Synapse // Codex // Risk 1", status: "Failed" },
  { id: "sea-43", index: "06", title: "Rename the vault export command", meta: "SEA-43 // Lockdown // Codex // Risk 1", status: "Done" },
]

const STEPS = [
  { index: "01", title: "Plan the change", status: "Done" },
  { index: "02", title: "Edit 6 files", status: "Done" },
  { index: "03", title: "Run tests", status: "128 / 128 pass" },
  { index: "04", title: "Your review", status: "Waiting on you" },
  { index: "05", title: "Merge", status: "Next" },
]

function Tasks() {
  const frame = useAppFrame()
  const [section, setSection] = useState("tasks")
  const [picked, setPicked] = useState<string | null>(null)
  // Desktop 01 opens the task that waits on you first (decisions §9: the list puts it first).
  const open = picked ?? (frame.split ? "sea-51" : null)
  const task = TASKS.find((t) => t.id === open)
  const pushed = Boolean(task) && !frame.split

  return (
    <>
      <AppFrameTopBar
        lockup={<AppLockup name="Warpcore" />}
        tabs={
          <TopTabs label="Sections">
            <TopTab label="Chat" index="01" icon="chat" href="#chat" />
            <TopTab label="Docs" index="02" icon="document" href="#docs" />
            <TopTab label="Tasks" index="03" icon="task" current href="#tasks" mark={{ count: 1, tone: "needs-you" }} />
          </TopTabs>
        }
        status={<StatusItem text="Spend // $3.40 of $10.00" short="$3.40" href="#spend" />}
        action={{ label: "New task", icon: "add" }}
        actions={
          <>
            <FloatButton label="Search" icon="search" />
            <FloatButton label="Settings" icon="settings" />
          </>
        }
      />

      {pushed ? (
        <AppFrameTopRow>
          <TopBar onBack={() => setPicked(null)} actions={<FloatButton label="More" icon="overflow-menu--horizontal" size="l" />} />
        </AppFrameTopRow>
      ) : (
        <AppFrameTopRow lockup={<AppLockup name="Warpcore" />} actions={<FloatButton label="Settings" icon="settings" size="l" />} />
      )}

      <AppFrameMain>
        <AppFrameList size="fill" aria-label="Tasks">
          <AppFramePageHead size={frame.split ? "lg" : "md"} overline="Tasks // 03 running // 01 waiting on you" title="Tasks" count="/012" />
          <AppFrameInset>
              <div className="pb-7">
            <StandInChips label="Show" chips={["All 12", "Running 03", "Waiting 01", "Done 08"]} active="All 12" />
          </div>
            </AppFrameInset>
          <StandInRows label="Tasks">
            {TASKS.map((t) => (
              <StandInInlineRow
                key={t.id}
                index={t.index}
                title={t.title}
                meta={t.meta}
                status={t.status}
                statusTone={t.live ? "live" : "label"}
                progress={t.progress}
                selected={frame.split && t.id === open}
                onOpen={() => setPicked(t.id)}
              />
            ))}
          </StandInRows>
        </AppFrameList>
        <AppFrameDetail size="narrow" open={picked !== null} onBack={() => setPicked(null)} aria-label={task?.title ?? "Task"}>
          {task ? (
            <AppFrameInset fill>
              <div className="flex flex-1 flex-col">
              <AppFramePageHead size="sm" overline="SEA-51 // Claude Code // Risk 2" title={task.title} />
              <StandInText>
                <p>Replaces password-hash login with OPAQUE, so the server never sees the password. Touches the auth service, the client SDK, and the tests.</p>
              </StandInText>
              <StandInSection title="Steps" count="05" />
              <StandInRows label="Steps">
                {STEPS.map((s) => (
                  <StandInInlineRow key={s.index} index={s.index} title={s.title} meta="Claude Code" status={s.status} statusTone={s.status === "Waiting on you" ? "live" : "label"} />
                ))}
              </StandInRows>
              <div className="mt-auto pt-6">
                <StandInNeedsYou
                  overline="Awaiting your review // SEA-51"
                  body="Claude Code changed 6 files: 212 lines added, 48 removed. All 128 tests pass."
                  actions={
                    <>
                      <Button variant="needs-you">Review diff</Button>
                      <Button variant="needs-you-text">Pause task</Button>
                    </>
                  }
                />
              </div>
              </div>
            </AppFrameInset>
          ) : null}
        </AppFrameDetail>
      </AppFrameMain>

      <AppFrameAccessory
        tone="live"
        meta={frame.minimized ? "Tasks // 03 running" : "SEA-48 // Running 04:12 // $0.42"}
        title={frame.minimized ? "SEA-48 running 04:12" : "Add baseline drift check"}
        action={{ label: "Open" }}
        announce="Add baseline drift check is running."
      />

      {pushed ? (
        <AppFrameBottomRow
          variant="detail"
          start={<FloatButton label="Pause task" icon="pause" size="l" />}
          end={<FloatButton label="Review diff" icon="arrow--right" kind="primary" size="l" extended />}
        />
      ) : (
        <AppFrameBottomRow
          start={<FloatButton label="Search" icon="search" size="l" />}
          tabs={
            <TabBar label="Sections" value={section} onValueChange={setSection}>
              <TabBarItem value="chat" icon="chat" label="Chat" />
              <TabBarItem value="docs" icon="document" label="Docs" />
              <TabBarItem value="tasks" icon="task" label="Tasks" mark={{ count: 1, tone: "needs-you" }} />
            </TabBar>
          }
          end={<FloatButton label="New task" icon="add" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => {}} />}
        />
      )}
    </>
  )
}

export default function ShellWarpcore() {
  return (
    <AppFrame>
      <Tasks />
    </AppFrame>
  )
}
