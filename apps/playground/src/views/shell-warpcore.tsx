// Warpcore's first screen, Tasks with one waiting on you, as one composition of the frame's parts:
// the top bar, a list that fills and a 534 detail at 1440 (Desktop 01, 38:756); the floating rows,
// the live strip and the scrolled chrome at 390 (Mobile 06, 37:666; States 02, 51:5902). It
// switches by width. The chips, rows, steps and the needs-you block are the system's own parts.
// View: ?view=shell-warpcore
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
  FilterChip,
  FilterChipGroup,
  FloatButton,
  ListRow,
  NeedsYou,
  Prose,
  SectionHeader,
  StatusItem,
  Step,
  Steps,
  TabBar,
  TabBarItem,
  TopBar,
  TopTab,
  TopTabs,
  useAppFrame,
  type StepStatus,
} from "@unicron/ui"

const TASKS = [
  { id: "sea-51", index: "01", title: "Migrate vault login to OPAQUE", meta: "SEA-51 // Lockdown // Claude Code // Risk 2", status: "Needs you" },
  { id: "sea-48", index: "02", title: "Add baseline drift check", meta: "SEA-48 // Workspace // Codex // Risk 1", status: "+ Running 04:12", live: true, progress: 20 / 32 },
  { id: "sea-47", index: "03", title: "Promote Popover out of candidates", meta: "SEA-47 // Unicron // Claude Code // Risk 1", status: "+ Running 01:47", live: true, progress: 20 / 32 },
  { id: "sea-46", index: "04", title: "Index the Vale decision records", meta: "SEA-46 // Vale // Local model // Risk 1", status: "Queued" },
  { id: "sea-44", index: "05", title: "Nightly dependency audit", meta: "SEA-44 // Synapse // Codex // Risk 1", status: "Failed" },
  { id: "sea-43", index: "06", title: "Rename the vault export command", meta: "SEA-43 // Lockdown // Codex // Risk 1", status: "Done" },
]

const STEPS: { title: string; status: StepStatus; statusLabel?: string }[] = [
  { title: "Plan the change", status: "done" },
  { title: "Edit 6 files", status: "done" },
  { title: "Run tests", status: "done", statusLabel: "128 / 128 pass" },
  { title: "Your review", status: "current", statusLabel: "Waiting on you" },
  { title: "Merge", status: "upcoming", statusLabel: "Next" },
]

function Tasks() {
  const frame = useAppFrame()
  const [section, setSection] = useState("tasks")
  const [picked, setPicked] = useState<string | null>(null)
  const [show, setShow] = useState("all")
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
              <FilterChipGroup label="Show" value={show} onValueChange={setShow}>
                <FilterChip value="all" count={12}>All</FilterChip>
                <FilterChip value="running" count={3}>Running</FilterChip>
                <FilterChip value="waiting" count={1}>Waiting</FilterChip>
                <FilterChip value="done" count={8}>Done</FilterChip>
              </FilterChipGroup>
            </div>
          </AppFrameInset>
          <ul aria-label="Tasks" className="flex flex-col">
            {TASKS.map((t) => (
              <ListRow
                key={t.id}
                render={<li />}
                index={t.index}
                title={t.title}
                meta={t.meta}
                status={t.status}
                tone={t.live ? "live" : "neutral"}
                progress={t.progress}
                selected={frame.split && t.id === open}
                onClick={() => setPicked(t.id)}
              />
            ))}
          </ul>
        </AppFrameList>
        <AppFrameDetail size="narrow" open={picked !== null} onBack={() => setPicked(null)} aria-label={task?.title ?? "Task"}>
          {task ? (
            <AppFrameInset fill>
              <div className="flex flex-1 flex-col gap-8">
                <AppFramePageHead size="sm" overline="SEA-51 // Claude Code // Risk 2" title={task.title} />
                <Prose>
                  <p>Replaces password-hash login with OPAQUE, so the server never sees the password. Touches the auth service, the client SDK, and the tests.</p>
                </Prose>
                <div className="flex flex-col gap-3">
                  <SectionHeader title="Steps" count={STEPS.length} level={3} />
                  <Steps aria-label="Steps">
                    {STEPS.map((step) => (
                      <Step key={step.title} title={step.title} detail="Claude Code" status={step.status} statusLabel={step.statusLabel} live={step.status === "current"} />
                    ))}
                  </Steps>
                </div>
                <div className="mt-auto">
                  <NeedsYou
                    title="Awaiting your review // SEA-51"
                    body="Claude Code changed 6 files: 212 lines added, 48 removed. All 128 tests pass."
                    action={<Button variant="needs-you">Review diff</Button>}
                    secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
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
