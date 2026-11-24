// The 2.0 sidebar every app shares (Figma Sidebar Top 144:701, Sidebar Group 195:13818, Sidebar Foot
// 178:4541): 240 on the sunken ground, edge to edge, so the frame keeps no page gutters; the top row
// (the lockup and New, or on a Mac the window buttons' room and Hide sidebar over it), the groups,
// and the foot across the full width. Collapsed it is the 56 rail. View: ?view=sidebar-flush
import { useState } from "react"
import { AppFrameMain, AppFrameSidebar, AppLockup, NavItem, NavSection, SidebarFoot, TitleRow } from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

function Shell({ mac }: { mac: boolean }) {
  const [collapsed, setCollapsed] = useState(false)
  const [settings, setSettings] = useState(false)
  return (
    <>
      <AppFrameSidebar
        flush
        windowButtons={mac}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        lockup={<AppLockup name="Warpcore" />}
        action={{ label: "New chat", icon: "edit" }}
        footer={
          <SidebarFoot
            status={{ icon: "renew", text: "Synced just now" }}
            account={{ name: "Sean", initials: "S", meta: "$1.20 today", href: "#spend", label: "Spend, $1.20 today" }}
            settings={{ onClick: () => setSettings(!settings), current: settings }}
          />
        }
      >
        <div className="flex flex-col">
          <NavItem label="Search" icon="search" href="#search" />
          <NavItem label="Home" icon="home" current href="#home" />
          <NavItem label="Board" icon="dashboard" count={2} href="#board" />
        </div>
        <NavSection title="Projects">
          <NavItem label="Warpcore" icon="folder" href="#warpcore" />
          <NavItem label="Synapse" icon="folder" href="#synapse" />
          <NavItem label="Unicron" icon="folder" href="#unicron" />
        </NavSection>
        <NavSection title="Conversations">
          <NavItem label="Tile grout colors" href="#c1" />
          <NavItem label="GPU for local models" href="#c2" />
        </NavSection>
      </AppFrameSidebar>
      <TitleRow
        current="Home"
        sidebarToggle={mac || !collapsed ? undefined : { label: "Show sidebar", onClick: () => setCollapsed(false) }}
      />
      <AppFrameMain />
    </>
  )
}

export default function SidebarFlushView() {
  return (
    <div className="flex flex-col gap-8">
      <Specimen label="Web: the lockup and New on the top row">
        <FrameBox width={1280} height={720} label="Warpcore on the web, 1280">
          <Shell mac={false} />
        </FrameBox>
      </Specimen>
      <Specimen label="Mac: the window buttons' room and Hide sidebar, the lockup under them">
        <FrameBox width={1280} height={720} label="Warpcore on a Mac, 1280">
          <Shell mac />
        </FrameBox>
      </Specimen>
    </div>
  )
}
