// Synapse's first screen, the workspace overview, as one composition of the frame's parts: the
// sidebar with its workspace switcher, the status line, one column with the activity beside it at
// 1440 (Desktop 01, 43:735); the floating rows, the needs-you strip and the scrolled chrome at 390
// (Mobile 01, 42:45; States 02, 51:11134). It switches by width. The score, the needs-you block and
// the check rows are stand-ins (./_shell-parts) until data-a, data-b and chat land.
// View: ?view=shell-synapse
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
  Button,
  FloatButton,
  StatusItem,
  useAppFrame,
} from "@unicron/ui"
import { AppLockup } from "@unicron/ui/app-lockup"
import { NavItem, NavSection } from "@unicron/ui/nav-item"
import { TabBar, TabBarItem } from "@unicron/ui/tab-bar"

import { StandInInlineRow, StandInNeedsYou, StandInRows, StandInSection } from "./_shell-parts"

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
          {/* The score is the head here (Metric size="hero" is data-b's; a stand-in until it lands). */}
          <AppFrameInset>
              <div className="flex flex-col gap-2 pb-8">
            <p className="type-overline text-text-label">{frame.split ? "Workspace health // Score" : "Personal // Workspace health"}</p>
            <p className="flex items-baseline gap-4">
              <span className="type-number-hero text-primary-display">94</span>
              <span className="type-code-display text-text-label">/100</span>
            </p>
            <p className="type-title text-text-body">212 of 218 checks pass.</p>
            <p className="type-body text-text-secondary">6 need attention. 2 changes wait for your review.</p>
          </div>
            </AppFrameInset>
          {frame.split ? (
            <div className="pb-8">
              <StandInNeedsYou
                overline="Awaiting your review // 02 harness changes"
                body="Claude Code and Codex proposed changes to visual-qa and the UI harness."
                actions={
                  <>
                    <Button variant="needs-you">Review H-09</Button>
                    <Button variant="needs-you-text">See both</Button>
                  </>
                }
              />
            </div>
          ) : null}
          <AppFrameInset>
            <StandInSection title="Failing checks" count="03 of 06" />
          </AppFrameInset>
          <StandInRows label="Failing checks">
            {CHECKS.map((c) => (
              <StandInInlineRow key={c.index} index={c.index} title={c.title} meta={c.meta} status={c.status} />
            ))}
          </StandInRows>
        </AppFrameColumn>
        {/* The activity stands beside the overview on a desktop; on a phone it is not part of the page, so the sheet starts closed. */}
        <AppFrameSidePanel open={frame.split && activity} onOpenChange={setActivity} title="Activity" minContent="detail">
          <div className="flex flex-col gap-6">
            <StandInSection title="Activity // Today" count="04" />
            {ACTIVITY.map(([time, text]) => (
              <p key={time} className="flex items-baseline gap-4">
                <span className="type-meta text-text-label">{time}</span>
                <span className="type-ui text-text-body">{text}</span>
              </p>
            ))}
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
