// Vale's Settings (T0 in app-vale-undrawn.md; Desktop / 12, 36:2839; Mobile / 16, 34:1400) in the
// SettingsFrame: the sidebar with Settings current, the status line, the page head, the section
// list (eleven sections in four groups, "Find a setting") beside one column up to 720; on a phone
// the drawn Accounts rows first, then every section, each pushed with a TopBar back. The rows are
// Field Rows and Toggle Rows. View: ?view=settings-vale
import { useState } from "react"
import {
  AppFrame,
  AppFrameInset,
  AppFrameMain,
  AppFramePageHead,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameTopRow,
  AppLockup,
  FieldRow,
  FieldRowAction,
  NavItem,
  NavSection,
  SearchField,
  SectionHeader,
  SettingsFrame,
  type SettingsSection,
  StatusItem,
  ToggleRow,
  TopBar,
  useAppFrame,
} from "@unicron/ui"

const SECTIONS: SettingsSection[] = [
  { value: "accounts", label: "Accounts", icon: "user--avatar", group: "Accounts", description: "Where your mail, calendars and contacts come from." },
  { value: "team", label: "Team members", icon: "user--multiple", group: "Accounts", description: "Who shares this gateway, and what they see." },
  { value: "mail", label: "Mail", icon: "email", group: "Mail", description: "Summaries, undo send and the Screener." },
  { value: "signatures", label: "Signatures and templates", icon: "pen", group: "Mail", description: "What goes under your messages." },
  { value: "ai", label: "AI summaries and replies", icon: "idea", group: "Mail", description: "Short summaries and suggested replies, made on this device." },
  { value: "notifications", label: "Notifications", icon: "notification", group: "Mail", description: "Who can notify you, and when." },
  { value: "calendar", label: "Calendar", icon: "calendar", group: "Calendar and notes", description: "Week numbers, the first day, default alerts." },
  { value: "notes", label: "Notes", icon: "notebook", group: "Calendar and notes", description: "Where notes sync." },
  { value: "appearance", label: "Appearance", icon: "contrast", group: "Vale", description: "Theme and text size." },
  { value: "shortcuts", label: "Shortcuts and gestures", icon: "keyboard", group: "Vale", description: "Every key and swipe Vale knows." },
  { value: "about", label: "About", icon: "information", group: "Vale", description: "This app and the server.", mark: { square: true, label: "Update ready" } },
]

function Rows({ section }: { section: string | null }) {
  if (section === "mail" || section === null) {
    return (
      <>
        <ToggleRow label="Summaries" description="Short summary above long messages" defaultChecked />
        <ToggleRow label="Undo send" description="10 seconds to take a message back" defaultChecked />
        <FieldRow label="Notify for" action={<FieldRowAction>Change</FieldRowAction>}>
          People I know
        </FieldRow>
      </>
    )
  }
  return (
    <>
      <SectionHeader title="Accounts" count={2} level={3} />
      <FieldRow label="Personal" action={<FieldRowAction>Manage</FieldRowAction>}>
        Fastmail
      </FieldRow>
      <FieldRow label="Work" description="Google // sign-in needed" action={<FieldRowAction>Sign in</FieldRowAction>}>
        Google
      </FieldRow>
    </>
  )
}

function Settings() {
  const frame = useAppFrame()
  const [section, setSection] = useState<string | null>(null)
  const shown = section ?? (frame.split ? "accounts" : null)
  const current = SECTIONS.find((s) => s.value === shown)

  return (
    <>
      <AppFrameSidebar
        lockup={<AppLockup name="Vale" />}
        action={{ label: "Compose", icon: "edit" }}
        footer={<NavItem label="Settings" icon="settings" current mark={{ square: true, label: "Update ready" }} href="#settings" />}
      >
        <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
        <NavSection title="Apps" count={4}>
          <NavItem label="Mail" icon="email" count={12} href="#mail" />
          <NavItem label="Calendar" icon="calendar" count={3} href="#calendar" />
          <NavItem label="Contacts" icon="user--multiple" href="#contacts" />
          <NavItem label="Notes" icon="notebook" href="#notes" />
        </NavSection>
      </AppFrameSidebar>

      <AppFrameStatusLine crumbs={[{ label: "Settings", href: "#settings" }, { label: current?.label ?? "All" }]}>
        <StatusItem text="Vale 2.4" />
      </AppFrameStatusLine>

      <AppFrameTopRow>
        <TopBar onBack={() => (section !== null ? setSection(null) : undefined)} title={section ? current?.label : "Settings"} titleAs="h1" />
      </AppFrameTopRow>

      <AppFrameMain>
        <SettingsFrame
          sections={SECTIONS}
          value={section ?? (frame.split ? "accounts" : null)}
          onValueChange={setSection}
          head={frame.split ? <AppFramePageHead overline="Settings // Personal + Work" title="Settings" /> : undefined}
          search={<SearchField aria-label="Find a setting" placeholder="Find a setting" />}
          overview={
            <AppFrameInset>
              <Rows section="accounts" />
              <SectionHeader title="All settings" count={11} level={2} />
            </AppFrameInset>
          }
        >
          <AppFrameInset>
            <Rows section={shown} />
          </AppFrameInset>
        </SettingsFrame>
      </AppFrameMain>
    </>
  )
}

export default function SettingsVale() {
  return (
    <AppFrame>
      <Settings />
    </AppFrame>
  )
}
