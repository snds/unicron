// The list + detail shrink order (contract 5.1c C8, Synapse SNA4): when the content is narrower than
// the list's least width, the gap and the detail's least width (320 + 24 + 480 = 824, knobs), the
// sidebar shows as its rail first; narrower still, the detail is pushed over the list as at medium
// width. The frame does it by itself: no media query here. View: ?view=app-frame-shrink
import { useState, type CSSProperties, type ReactNode } from "react"
import {
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppLockup,
  EmptyState,
  ListRow,
  NavItem,
  NavSection,
  Prose,
  StatusItem,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

const CHECKS = [
  { id: "k14", index: "K-14", title: "A knowledge note links to a missing file", meta: "Knowledge // legion // 2 links", status: "Failing" },
  { id: "s03", index: "S-03", title: "Two skills claim the same trigger", meta: "Skills // review, critique", status: "Failing" },
  { id: "a07", index: "A-07", title: "An agent prompt has no owner", meta: "Agents // release", status: "Stale" },
]

function Screen({ open, onOpen }: { open: string | null; onOpen: (id: string | null) => void }) {
  const check = CHECKS.find((c) => c.id === open)
  return (
    <>
      <AppFrameSidebar lockup={<AppLockup name="Synapse" />} action={{ label: "New skill", icon: "add" }}>
        <NavSection title="Workspace" count={5}>
          <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
          <NavItem label="Overview" icon="dashboard" href="#overview" />
          <NavItem label="Harnesses" icon="bot" count={4} href="#harnesses" />
          <NavItem label="Skills" icon="document" count={12} href="#skills" />
          <NavItem label="Checks" icon="checkmark--outline" mark={{ count: 3, tone: "needs-you" }} current href="#checks" />
        </NavSection>
      </AppFrameSidebar>
      <AppFrameStatusLine crumbs={[{ label: "Personal", href: "#personal" }, { label: "Checks" }]}>
        <StatusItem text="Checked // 09:16" />
      </AppFrameStatusLine>
      <AppFrameMain>
        <AppFrameList aria-label="Checks">
          <AppFramePageHead overline="Checks // 03 failing" title="Checks" size="sm" />
          <ul aria-label="Checks" className="flex flex-col">
            {CHECKS.map((c) => (
              <ListRow
                key={c.id}
                render={<li />}
                index={c.index}
                title={c.title}
                meta={c.meta}
                status={c.status}
                selected={c.id === open}
                onClick={() => onOpen(c.id)}
              />
            ))}
          </ul>
        </AppFrameList>
        <AppFrameDetail open={open !== null} onBack={() => onOpen(null)} aria-label={check?.title ?? "Check"}>
          <AppFrameInset>
            {check ? (
              <div className="flex flex-col gap-6">
                <AppFramePageHead size="sm" overline={`Check // ${check.index}`} title={check.title} />
                <Prose>
                  <p>knowledge/legion links to a file that was renamed on 11.12. Fix the link, or let an agent fix it.</p>
                </Prose>
              </div>
            ) : (
              <EmptyState size="sm" overline="Checks" title="Nothing open." body="Pick a check to see it here." />
            )}
          </AppFrameInset>
        </AppFrameDetail>
      </AppFrameMain>
    </>
  )
}

function ShrinkBox({ width, label, knobs, start = "k14" }: { width: number; label: string; knobs?: CSSProperties; start?: string | null }) {
  const [open, setOpen] = useState<string | null>(start)
  const box: ReactNode = (
    <FrameBox width={width} height={600} label={label}>
      <Screen open={open} onOpen={setOpen} />
    </FrameBox>
  )
  // A knob set on an ancestor reaches the frame: here a wider least detail moves the lines.
  return knobs ? <div style={knobs}>{box}</div> : box
}

export default function AppFrameShrinkView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Room for both // the full sidebar, list 320 + 12, the rule, the detail">
        <ShrinkBox width={1180} label="1180 // content 904: nothing to give up" />
      </Specimen>
      <Specimen label="Step 1 // content under 824 with the full sidebar: the sidebar shows as its rail (expand opens it as a drawer)">
        <ShrinkBox width={1050} label="1050 // content 774 with the sidebar, 930 with its rail" />
      </Specimen>
      <Specimen label="Step 2 // still too narrow with the rail: the detail is pushed over the list, its back in the status line">
        <ShrinkBox
          width={1050}
          label="1050, the least detail at 640 // 930 < 320 + 24 + 640: pushed as at medium"
          knobs={{ "--c-app-frame-detail-min": "40rem" } as CSSProperties}
        />
      </Specimen>
    </div>
  )
}
