// Synapse's first screen, the workspace overview, as one composition of the frame's parts: the
// sidebar with its workspace switcher, the status line, one column with the activity beside it at
// 1440 (Desktop 01, 43:735); the floating rows, the needs-you strip and the scrolled chrome at 390
// (Mobile 01, 42:45; States 02, 51:11134). It switches by width. The score, the counts, the
// needs-you block, the check rows and the activity are the system's own parts. Search with its key
// sits above the first group (decisions §6). View: ?view=shell-synapse
import { useState } from "react"
import {
  AppFrame,
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameColumn,
  AppFrameInset,
  AppFrameMain,
  AppFrameSidebar,
  AppFrameSidePanel,
  AppFrameStatusLine,
  AppFrameSwitcher,
  AppFrameTopRow,
  AppLockup,
  Button,
  FloatButton,
  ListRow,
  LogRow,
  Metric,
  NavItem,
  NavSection,
  NeedsYou,
  Progress,
  SectionHeader,
  StatusItem,
  TabBar,
  TabBarItem,
  useAppFrame,
} from "@unicron/ui"

const CHECKS = [
  { index: "K-14", title: "A knowledge note links to a missing file", meta: "knowledge/legion", status: "Since 13:40" },
  { index: "S-03", title: "Skill has no trigger words", meta: "skills/ux-copy", status: "Failing" },
  { index: "H-07", title: "Harness points at a renamed folder", meta: "harness/visual-qa", status: "Failing" },
  { index: "S-11", title: "Two skills claim one trigger", meta: "skills/figma", status: "Failing" },
]

const ACTIVITY = [
  ["14:02", "Imported 12 notes from Obsidian"],
  ["13:40", "Check K-14 started failing"],
  ["11:15", "Skill ux-copy updated"],
  ["09:02", "Codex connected"],
]

const COUNTS = [
  { href: "#skills", label: "Skills", value: "145", delta: "+3 this week" },
  { href: "#knowledge", label: "Knowledge", value: "1,204", delta: "+12 today" },
  { href: "#harnesses", label: "Harnesses", value: "9", delta: "2 proposed" },
  { href: "#personas", label: "Personas", value: "3", delta: "11 accounts" },
]

function Overview() {
  const frame = useAppFrame()
  const [section, setSection] = useState("overview")
  const [activity, setActivity] = useState(true)

  return (
    <>
      <AppFrameSidebar
        lockup={<AppLockup name="Synapse" />}
        switcher={<AppFrameSwitcher overline="Workspace // 01 of 03" title="Personal" label="Switch workspace" />}
        action={{ label: "New skill", icon: "add" }}
        footer={<NavItem label="Settings" icon="settings" href="#settings" />}
      >
        <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
        <NavSection title="Workspace">
          <NavItem label="Overview" icon="dashboard" current href="#overview" />
          <NavItem label="Skills" icon="skill-level" count={145} href="#skills" />
          <NavItem label="Knowledge" icon="book" count={1204} href="#knowledge" />
          <NavItem label="Harnesses" icon="flow" count={9} href="#harnesses" />
          <NavItem label="Checks" icon="checkmark--outline" count={218} href="#checks" />
          <NavItem label="Personas" icon="user--avatar" count={3} href="#personas" />
        </NavSection>
        <NavSection title="Agents // 02 found">
          <NavItem label="Claude Code" icon="bot" href="#claude-code" />
          <NavItem label="Codex" icon="bot" href="#codex" />
        </NavSection>
      </AppFrameSidebar>

      <AppFrameStatusLine crumbs={[{ label: "Personal", href: "#personal" }, { label: "Overview" }]}>
        <StatusItem text="Checked // 15:37 // No agent needed" label="Check again" onClick={() => {}} />
      </AppFrameStatusLine>

      <AppFrameTopRow lockup={<AppLockup name="Synapse" />} title="Checks" actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />

      <AppFrameMain>
        <AppFrameColumn aria-label="Overview">
          {/* The score is the head here: the hero Metric, its sentence and bar beside it on a desktop. */}
          {/* Blocks 32 apart on a desktop (the request 48 under the counts, the list's header 28
              under it, as Desktop / 01 draws them); 16 on a phone. The "Failing checks" header
              stays with its list: nothing between them. */}
          <AppFrameInset>
            <div className={frame.split ? "flex flex-col gap-8" : "flex flex-col gap-4"}>
              {/* 40 under the hero on a desktop, as Desktop / 01 draws it (the number's line ends at
                  y 260, the counts' rule is at y 300): the stack's 32 and 8 here. */}
              <div className={frame.split ? "flex flex-wrap items-end gap-x-12 gap-y-4 pb-2" : "flex flex-wrap items-end gap-x-12 gap-y-4"}>
                <Metric
                  href="#checks"
                  size="hero"
                  valueTone="primary"
                  label={frame.split ? "Workspace health // Score" : "Personal // Workspace health"}
                  value="94"
                  unit="/100"
                />
                <div className={frame.split ? "flex min-w-60 flex-1 flex-col gap-2 pb-4" : "flex min-w-60 flex-1 flex-col gap-2"}>
                  <p className="type-lead text-text-body">212 of 218 checks pass.</p>
                  {frame.split ? <Progress variant="segmented" tone="primary" segments={48} value={212} max={218} aria-label="212 of 218 checks pass" /> : null}
                  <p className="type-body text-text-secondary">6 need attention. 2 changes wait for your review.</p>
                </div>
              </div>
              {frame.split ? (
                <div className="grid grid-cols-4 gap-6">
                  {COUNTS.map((count) => (
                    <Metric key={count.label} href={count.href} label={count.label} value={count.value} delta={count.delta} />
                  ))}
                </div>
              ) : null}
              {frame.split ? (
                <div className="pt-4">
                  <NeedsYou
                    title="Awaiting your review // 02 harness changes"
                    body="Claude Code and Codex proposed changes to visual-qa and the UI harness."
                    action={<Button variant="needs-you">Review H-09</Button>}
                    secondaryAction={<Button variant="needs-you-text">See both</Button>}
                  />
                </div>
              ) : null}
              <div className={frame.split ? "-mt-1" : undefined}>
                <SectionHeader title="Failing checks" count="03 of 06" level={2} />
              </div>
            </div>
          </AppFrameInset>
          <ul aria-label="Failing checks" className="flex flex-col">
            {CHECKS.map((c) => (
              <ListRow key={c.index} render={<li />} index={c.index} title={c.title} meta={c.meta} metaStyle="plain" status={c.status} href={`#check-${c.index}`} />
            ))}
          </ul>
        </AppFrameColumn>
        {/* The activity stands beside the overview while the window has the room. With less room, and on a phone, the panel is a sheet that starts closed (the part hands `open` back). */}
        <AppFrameSidePanel open={activity} onOpenChange={setActivity} title="Activity" minContent="detail">
          <div className="flex flex-col gap-2">
            <SectionHeader title="Activity // Today" count={ACTIVITY.length} level={2} />
            <ul aria-label="Activity today" className="flex flex-col">
              {ACTIVITY.map(([time, text]) => (
                <LogRow key={time} render={<li />} time={time} dateTime={`2026-11-12T${time}`}>
                  {text}
                </LogRow>
              ))}
            </ul>
          </div>
        </AppFrameSidePanel>
      </AppFrameMain>

      <AppFrameAccessory
        tone="needs-you"
        meta={frame.minimized ? "Checks // 06 failing" : "Awaiting your review // 02"}
        title={frame.minimized ? "2 changes to review" : "Harness changes from agents"}
        action={{ label: "Review" }}
        announce="Two harness changes wait for your review."
      />

      <AppFrameBottomRow
        start={<FloatButton label="Search" icon="search" size="l" />}
        tabs={
          <TabBar label="Sections" value={section} onValueChange={setSection}>
            <TabBarItem value="overview" icon="dashboard" label="Overview" />
            <TabBarItem value="skills" icon="skill-level" label="Skills" />
            <TabBarItem value="knowledge" icon="book" label="Knowledge" />
            <TabBarItem value="harnesses" icon="flow" label="Harnesses" />
          </TabBar>
        }
        end={<FloatButton label="Create" icon="add" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => {}} />}
      />
    </>
  )
}

export default function ShellSynapse() {
  return (
    <AppFrame>
      <Overview />
    </AppFrame>
  )
}
