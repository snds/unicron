// Tab Bar and Dock Tab, as Figma draws them (20:1657, 20:1656), in the phone's bottom row, scrolled,
// on a short screen, and as links. View: ?view=tab-bar
import { useState, type ReactNode } from "react"
import { Accessory, FloatButton, Switch, TabBar, TabBarItem } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** Vale's four sections, as the phone frames draw them. */
function ValeTabs({ value, onValueChange, minimized, onReselect }: { value: string; onValueChange: (v: string) => void; minimized?: boolean; onReselect?: (v: string) => void }) {
  return (
    <TabBar label="Sections" value={value} onValueChange={onValueChange} minimized={minimized} onReselect={onReselect}>
      <TabBarItem value="mail" icon="email" label="Mail" />
      <TabBarItem value="calendar" icon="calendar" label="Calendar" />
      <TabBarItem value="contacts" icon="user--multiple" label="Contacts" />
      <TabBarItem value="notes" icon="notebook" label="Notes" />
    </TabBar>
  )
}

export default function TabBarView() {
  const [vale, setVale] = useState("mail")
  const [warpcore, setWarpcore] = useState("tasks")
  const [scrolled, setScrolled] = useState(true)
  const [said, setSaid] = useState("Slide along the bar, or use the arrow keys")
  const [short, setShort] = useState("chat")

  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Tab bar // four sections, icon only, 48 high; Mail active">
        <div className="flex w-full max-w-sm">
          <ValeTabs value={vale} onValueChange={setVale} onReselect={(v) => setSaid(`Back to the top of ${v}`)} />
        </div>
      </Specimen>

      <Specimen label="Three sections // Warpcore; a needs-you count on Tasks">
        <div className="flex w-full max-w-sm">
          <TabBar label="Sections" value={warpcore} onValueChange={setWarpcore}>
            <TabBarItem value="chat" icon="chat" label="Chat" />
            <TabBarItem value="docs" icon="document" label="Docs" />
            <TabBarItem value="tasks" icon="task" label="Tasks" mark={{ count: 1, tone: "needs-you" }} />
          </TabBar>
        </div>
      </Specimen>

      <Specimen label="Phone bottom row // search, the tab bar filling, create">
        <div className="flex w-full max-w-sm items-center gap-2">
          <FloatButton label="Search" icon="search" size="l" />
          <ValeTabs value={vale} onValueChange={setVale} onReselect={(v) => setSaid(`Back to the top of ${v}`)} />
          <FloatButton label="New message" icon="edit" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => setSaid("Quick create")} />
        </div>
        <p className="type-caption text-support-foreground" aria-live="polite">
          {said}
        </p>
      </Specimen>

      <Specimen label="Scrolled // the bar shrinks to the active tab; the strip joins the row">
        <div className="flex items-center gap-3">
          <Switch checked={scrolled} onCheckedChange={setScrolled} aria-label="Scrolled" />
          <span className="type-caption text-support-foreground">Scrolled</span>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2">
          <FloatButton label="Search" icon="search" size="l" />
          <ValeTabs value={vale} onValueChange={setVale} minimized={scrolled} onReselect={() => setScrolled(false)} />
          {scrolled ? <Accessory compact meta="Inbox // 012 unread" title="Cabin for the 20th, confirmed" /> : null}
          <FloatButton label="New message" icon="edit" kind="primary" size="l" />
        </div>
      </Specimen>

      <Specimen label="Short screen // the bar turned vertical in the trailing column">
        <div className="flex flex-col items-start gap-2">
          <FloatButton label="Search" icon="search" size="l" />
          <TabBar label="Sections" orientation="vertical" value={short} onValueChange={setShort}>
            <TabBarItem value="chat" icon="chat" label="Chat" />
            <TabBarItem value="docs" icon="document" label="Docs" />
            <TabBarItem value="tasks" icon="task" label="Tasks" mark={{ count: 1, tone: "needs-you" }} />
          </TabBar>
          <FloatButton label="New task" icon="add" kind="primary" size="l" />
        </div>
      </Specimen>

      <Specimen label="As links // a nav of addresses; the current one says so">
        <div className="flex w-full max-w-sm">
          <TabBar label="Sections" navigation="links" value="items">
            <TabBarItem value="items" icon="password" label="Items" href="#items" />
            <TabBarItem value="codes" icon="time" label="Codes" href="#codes" />
            <TabBarItem value="health" icon="security" label="Health" href="#health" mark={3} />
            <TabBarItem value="settings" icon="settings" label="Settings" href="#settings" mark={{ square: true, label: "Update ready" }} />
          </TabBar>
        </div>
      </Specimen>

      <Specimen label="One section // nothing to switch between, so no bar">
        <div className="flex w-full max-w-sm">
          <TabBar label="Sections" value="mail">
            <TabBarItem value="mail" icon="email" label="Mail" />
          </TabBar>
          <p className="type-caption text-support-foreground">No tab bar: Mail is the only section.</p>
        </div>
      </Specimen>
    </div>
  )
}
