// Nav Item and Nav Section, as Figma draws them (15:487) and as the sidebars use them: counts,
// marks, a tree, toggles, a trailing action, the rail. View: ?view=nav-item
import { useState, type ReactNode } from "react"
import { Button, Icon, NavItem, NavSection } from "@unicron/ui"

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-52 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

type Node = { id: string; label: string; icon: "folder" | "document" | "bot"; count?: number; children?: Node[] }

const WORKSPACE: Node[] = [
  {
    id: "agents",
    label: "Agents",
    icon: "folder",
    count: 4,
    children: [
      { id: "review", label: "review.md", icon: "bot" },
      { id: "release", label: "Release", icon: "folder", children: [{ id: "notes", label: "release-notes.md", icon: "document" }] },
    ],
  },
  { id: "skills", label: "Skills", icon: "folder", count: 12, children: [{ id: "drift", label: "baseline-drift.md", icon: "document" }] },
  { id: "rules", label: "Rules", icon: "folder", count: 3 },
]

/** Synapse's workspace files (SNA6): a NavSection tree. Each row goes to its place; → and ← open and close. */
function WorkspaceTree() {
  const [open, setOpen] = useState<string[]>(["agents", "release"])
  const [current, setCurrent] = useState("review")
  const rows: ReactNode[] = []
  const walk = (nodes: Node[], level: number) => {
    for (const node of nodes) {
      const branch = Boolean(node.children)
      const expanded = branch ? open.includes(node.id) : undefined
      rows.push(
        <NavItem
          key={node.id}
          label={node.label}
          icon={node.icon}
          count={node.count}
          level={level}
          current={current === node.id}
          expanded={expanded}
          onExpandedChange={(to) => setOpen((ids) => (to ? [...ids, node.id] : ids.filter((id) => id !== node.id)))}
          onClick={() => setCurrent(node.id)}
        />
      )
      if (branch && expanded) walk(node.children!, level + 1)
    }
  }
  walk(WORKSPACE, 0)
  return (
    <NavSection title="Workspace" tree>
      {rows}
    </NavSection>
  )
}

export default function NavItemView() {
  const [shown, setShown] = useState<Record<string, boolean>>({ personal: true, work: true, holidays: false })
  const [account, setAccount] = useState("personal")
  const [folders, setFolders] = useState(true)
  const [more, setMore] = useState(false)

  return (
    <div className="flex flex-wrap items-start gap-x-12 gap-y-10 p-6">
      <Column label="Figma // default, active">
        <div className="flex flex-col gap-1">
          <NavItem href="#mail" index="01" label="Mail" count={12} />
          <NavItem href="#mail" index="01" label="Mail" count={12} current />
        </div>
      </Column>

      <Column label="Vale // the sidebar">
        <div className="flex flex-col gap-7">
          <NavSection title="Apps" count={4}>
            <NavItem href="#mail" label="Mail" icon="email" count={12} />
            <NavItem href="#calendar" label="Calendar" icon="calendar" count={3} />
            <NavItem href="#contacts" label="Contacts" icon="user--multiple" />
            <NavItem href="#notes" label="Notes" icon="notebook" />
          </NavSection>
          <NavSection title="Mail // folders">
            <NavItem href="#search" label="Search" icon="search" mark={{ keys: "/" }} />
            <NavItem href="#inbox" label="Inbox" icon="email" count={12} current />
            <NavItem href="#starred" label="Starred" icon="star" count={4} />
            <NavItem href="#drafts" label="Drafts" icon="edit" count={2} />
            <NavItem href="#sent" label="Sent" icon="send--alt" />
            <NavItem href="#archive" label="Archive" icon="archive" />
          </NavSection>
          <NavSection title="Accounts" count={2}>
            <NavItem href="#personal" label="Personal" icon="user--avatar" count={12} />
            <NavItem href="#work" label="Work" icon="document" count={31} tone="critical" description="Not syncing since 09:16" />
          </NavSection>
        </div>
      </Column>

      <Column label="Lockdown // a tree, a trailing action, a description">
        <div className="flex flex-col gap-7">
          <NavSection title="Items // 06 types">
            <NavItem href="#all" label="All items" icon="folder" count={248} current />
            <NavItem href="#logins" label="Logins" icon="password" count={142} expanded={folders} onExpandedChange={setFolders} />
            {folders ? (
              <>
                <NavItem href="#work-logins" label="Work" icon="folder" count={38} level={1} />
                <NavItem href="#streaming" label="Streaming" icon="folder" count={7} level={1} />
              </>
            ) : null}
            <NavItem href="#passkeys" label="Passkeys" icon="locked" count={61} />
            <NavItem href="#codes" label="Codes" icon="time" count={18} />
            <NavItem label="More" icon="overflow-menu--horizontal" expanded={more} onExpandedChange={setMore} />
            {more ? <NavItem href="#cards" label="Cards" icon="wallet" count={4} level={1} /> : null}
          </NavSection>
          <NavSection
            title="Vaults"
            count={2}
            action={
              <Button variant="ghost" size="icon-sm" aria-label="New vault">
                <Icon name="add" />
              </Button>
            }
          >
            <NavItem
              href="#v-personal"
              label="Personal"
              icon="user--avatar"
              count={231}
              action={
                <Button variant="ghost" size="icon-sm" aria-label="More for Personal">
                  <Icon name="overflow-menu--horizontal" />
                </Button>
              }
            />
            <NavItem href="#v-family" label="Family" icon="user--multiple" count={17} description="Shared by Mira Chen" />
          </NavSection>
          <NavSection title="Tools">
            <NavItem href="#health" label="Health" icon="security" count={92} />
            <NavItem href="#sharing" label="Sharing" icon="share" mark={{ count: 2, tone: "needs-you" }} />
            <NavItem label="Bring in" icon="document" disabled description="Nothing to bring in yet." />
          </NavSection>
        </div>
      </Column>

      <Column label="Toggles // checkboxes to show calendars, radios for one account">
        <div className="flex flex-col gap-7">
          <NavSection title="Calendars" count={3} checkable="multiple">
            <NavItem label="Personal" swatch={1} checked={shown.personal} onCheckedChange={(on) => setShown((s) => ({ ...s, personal: on }))} />
            <NavItem label="Work" swatch={2} checked={shown.work} onCheckedChange={(on) => setShown((s) => ({ ...s, work: on }))} />
            <NavItem label="US holidays" swatch={3} checked={shown.holidays} onCheckedChange={(on) => setShown((s) => ({ ...s, holidays: on }))} />
          </NavSection>
          <NavSection title="Accounts" count={2} checkable="single">
            <NavItem label="All" checked={account === "all"} onCheckedChange={() => setAccount("all")} />
            <NavItem label="Personal" description="mira.chen@fastmail.com" checked={account === "personal"} onCheckedChange={() => setAccount("personal")} />
            <NavItem label="Work" description="mira@ledger.co" tone="critical" checked={account === "work"} onCheckedChange={() => setAccount("work")} />
          </NavSection>
          <NavSection title="Footer">
            <NavItem href="#settings" label="Settings" icon="settings" mark={{ square: true, label: "Update ready" }} />
          </NavSection>
        </div>
      </Column>

      <Column label="Synapse // a tree: arrows move, right opens, left closes">
        <WorkspaceTree />
      </Column>

      <Column label="Collapsed // the sidebar's rail">
        <div className="flex flex-col gap-4">
          <NavSection title="Apps" count={4} collapsed>
            <NavItem href="#search" label="Search" icon="search" mark={{ keys: "/" }} />
            <NavItem href="#mail" label="Mail" icon="email" count={12} current />
            <NavItem href="#calendar" label="Calendar" icon="calendar" count={3} />
            <NavItem href="#contacts" label="Contacts" icon="user--multiple" />
            <NavItem href="#notes" label="Notes" icon="notebook" />
          </NavSection>
        </div>
      </Column>
    </div>
  )
}
