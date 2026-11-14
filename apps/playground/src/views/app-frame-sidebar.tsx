// AppFrameSidebar and AppFrameSwitcher: the desktop navigation column of Vale, Lockdown and Synapse
// (204, on the page's ground, 24 from the content): the lockup, the switcher, the full-width
// primary, sections 28 apart that scroll, the pinned foot and its control slot. Collapsed by
// choice it is the rail; at medium width it is always the rail, and expanding lays the drawer
// over the content. View: ?view=app-frame-sidebar
import { useState } from "react"
import {
  AppFrameColumn,
  AppFrameMain,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameSwitcher,
  AppLockup,
  Button,
  Icon,
  NavItem,
  NavSection,
  StatusItem,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

function ValeSections() {
  return (
    <>
      <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
      <NavSection title="Apps" count={4}>
        <NavItem label="Mail" icon="email" count={12} href="#mail" />
        <NavItem label="Calendar" icon="calendar" count={3} href="#calendar" />
        <NavItem label="Contacts" icon="user--multiple" href="#contacts" />
        <NavItem label="Notes" icon="notebook" href="#notes" />
      </NavSection>
      <NavSection title="Mail // folders">
        <NavItem label="Inbox" icon="email" count={12} current href="#inbox" />
        <NavItem label="Starred" icon="star" count={4} href="#starred" />
        <NavItem label="Drafts" icon="edit" count={2} href="#drafts" />
        <NavItem label="Sent" icon="send" href="#sent" />
        <NavItem label="Archive" icon="archive" href="#archive" />
      </NavSection>
      <NavSection title="Accounts" count={2}>
        <NavItem label="Personal" icon="user--avatar" count={12} href="#personal" />
        <NavItem label="Work" icon="document" count={31} tone="critical" toneLabel="not syncing" href="#work" />
      </NavSection>
    </>
  )
}

function Content() {
  return (
    <>
      <AppFrameStatusLine crumbs={[{ label: "Mail", href: "#mail" }, { label: "Inbox" }]}>
        <StatusItem text="Synced // 09:16" />
      </AppFrameStatusLine>
      <AppFrameMain>
        <AppFrameColumn aria-label="Inbox">
          <p className="type-body text-text-secondary">The content column.</p>
        </AppFrameColumn>
      </AppFrameMain>
    </>
  )
}

const settings = <NavItem label="Settings" icon="settings" mark={{ square: true, label: "Update ready" }} href="#settings" />

export default function AppFrameSidebarView() {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Vale // lockup, Compose, Search with its key, three sections, Settings pinned; the collapse control">
        <FrameBox width={1280} height={1000} layout="expanded" label={collapsed ? "Collapsed by choice // ⌘\\ or the control" : "Expanded // 204 wide"}>
          <AppFrameSidebar lockup={<AppLockup name="Vale" />} action={{ label: "Compose", icon: "edit" }} footer={settings} collapsed={collapsed} onCollapsedChange={setCollapsed}>
            <ValeSections />
          </AppFrameSidebar>
          <Content />
        </FrameBox>
      </Specimen>
      <Specimen label="Synapse // the workspace switcher: overline, the open one's name, a chevron that opens the menu">
        <FrameBox width={1280} height={720} layout="expanded" label="Expanded, with the switcher">
          <AppFrameSidebar
            lockup={<AppLockup name="Synapse" />}
            switcher={<AppFrameSwitcher overline="Workspace // 01 of 03" title="Personal" label="Switch workspace" />}
            action={{ label: "New skill", icon: "add" }}
            footer={<NavItem label="Settings" icon="settings" href="#settings" />}
            onCollapsedChange={() => {}}
          >
            <NavSection title="Workspace">
              <NavItem label="Overview" icon="dashboard" current href="#overview" />
              <NavItem label="Skills" icon="skill-level" count={145} href="#skills" />
              <NavItem label="Knowledge" icon="book" count={1204} href="#knowledge" />
              <NavItem label="Harnesses" icon="flow" count={9} href="#harnesses" />
              <NavItem label="Checks" icon="checkmark--outline" count={218} href="#checks" />
            </NavSection>
          </AppFrameSidebar>
          <Content />
        </FrameBox>
      </Specimen>
      <Specimen label="Lockdown // Lock in the foot's control slot; the macOS window buttons kept clear (leadingInset)">
        <FrameBox width={1280} height={720} layout="expanded" label="Expanded, with a foot control and room for the window buttons">
          <AppFrameSidebar
            lockup={<AppLockup name="Lockdown" />}
            action={{ label: "New item", icon: "add" }}
            footer={<NavItem label="Settings" icon="settings" href="#settings" />}
            footerControl={
              <Button variant="secondary" size="sm">
                <Icon name="locked" size="sm" />
                Lock
              </Button>
            }
            leadingInset={{ start: 40 }}
          >
            <NavSection title="Items // 06 types">
              <NavItem label="All items" icon="folder" count={248} current href="#all" />
              <NavItem label="Logins" icon="password" count={142} href="#logins" />
            </NavSection>
            <NavSection title="Vaults" count={2}>
              <NavItem label="Personal" icon="user--avatar" count={231} href="#personal" />
              <NavItem label="Family" icon="user--multiple" count={17} href="#family" />
            </NavSection>
          </AppFrameSidebar>
          <Content />
        </FrameBox>
      </Specimen>
      <Specimen label="Medium // always the rail; expanding lays the drawer over the content with the menu scrim">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={820} height={760} layout="medium" label="Medium // the rail">
            <AppFrameSidebar lockup={<AppLockup name="Vale" />} action={{ label: "Compose", icon: "edit" }} footer={settings}>
              <ValeSections />
            </AppFrameSidebar>
            <Content />
          </FrameBox>
          <FrameBox width={820} height={760} layout="medium" label="Medium // the drawer open">
            <AppFrameSidebar lockup={<AppLockup name="Vale" />} action={{ label: "Compose", icon: "edit" }} footer={settings} drawerOpen onDrawerOpenChange={() => {}}>
              <ValeSections />
            </AppFrameSidebar>
            <Content />
          </FrameBox>
        </div>
      </Specimen>
    </div>
  )
}
