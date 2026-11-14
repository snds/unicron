// Page head, as the apps draw it on every list and detail screen (no Figma component): the three
// sizes, a count or side meta on the baseline, a status Badge, actions, the switcher and the
// collapsed small title. View: ?view=page-head
import { useState, type ReactNode } from "react"
import { Badge, Button, PageHead, Switch } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

const WORKSPACES = ["Personal", "Unicron", "Clients"]

export default function PageHeadView() {
  const [said, setSaid] = useState("Press the workspace head, or swipe it sideways")
  const [workspace, setWorkspace] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="md // display/compact, a side meta on the baseline (Vale)">
        <PageHead overline="Inbox // 012 unread" title="Today" meta="THU 11.12" onMetaClick={() => setSaid("Back to today")} metaLabel="Go to today" />
      </Specimen>

      <Specimen label="md // a count on the baseline (Lockdown, Synapse)">
        <PageHead overline="Personal vault // 6 types" title="Items" count={248} />
        <PageHead overline="Skills // 145 // +3 this week" title="Skills" count={145} />
      </Specimen>

      <Specimen label="lg // display, the count in code/display (Warpcore desktop)">
        <PageHead size="lg" overline="Tasks // 03 running // 01 waiting on you" title="Tasks" count="/012" />
      </Specimen>

      <Specimen label="lg // a desktop detail head, the meta on a line under the title (Lockdown)">
        <PageHead size="lg" overline="Login // passkey + code // Steam Guard" title="Steam" meta="store.steampowered.com // added 2024.03.11" metaPosition="below" />
      </Specimen>

      <Specimen label="sm // title, two lines when it must (Warpcore task)">
        <div className="max-w-sm">
          <PageHead size="sm" overline="SEA-51 // Lockdown // Risk 2" title="Migrate vault login to OPAQUE" />
        </div>
      </Specimen>

      <Specimen label="Status and actions // a Badge after the title; controls at the end">
        <PageHead
          overline="Checks // 218 // 6 failing"
          title="Checks"
          count={218}
          status={<Badge tone="live">Running</Badge>}
          actions={
            <Button size="sm" variant="secondary" onClick={() => setSaid("Checking again")}>
              Check again
            </Button>
          }
        />
        <PageHead overline="Harness // H-09" title="Visual QA" status={<Badge>Read-only</Badge>} />
      </Specimen>

      <Specimen label="Switcher // the whole head is the button; swipe or arrow keys step the workspace">
        <div className="max-w-sm">
          <PageHead
            overline={`Workspace // 0${workspace + 1} of 03`}
            title={WORKSPACES[workspace]}
            switcher={{
              label: "Switch workspace",
              "aria-haspopup": "menu",
              onClick: () => setSaid("The workspace menu opens here"),
              onSwipe: (direction) => {
                setWorkspace((i) => (direction === "next" ? (i + 1) % 3 : (i + 2) % 3))
                setSaid(`Switched to the ${direction} workspace`)
              },
            }}
          />
        </div>
        <p className="type-caption text-support-foreground" aria-live="polite">
          {said}
        </p>
      </Specimen>

      <Specimen label="Collapsed // the frame drives it once the page scrolls">
        <div className="flex items-center gap-3">
          <Switch checked={scrolled} onCheckedChange={setScrolled} aria-label="Scrolled" />
          <span className="type-caption text-support-foreground">Scrolled</span>
        </div>
        <div className="max-w-sm">
          <PageHead overline="Inbox // 012 unread" title={scrolled ? "Inbox" : "Today"} meta="THU 11.12" collapsed={scrolled} />
        </div>
        <div className="max-w-sm">
          <PageHead overline={`Workspace // 0${workspace + 1} of 03`} title={WORKSPACES[workspace]} collapsed switcher={{ label: "Switch workspace", onClick: () => setSaid("The workspace menu opens here") }} />
        </div>
      </Specimen>
    </div>
  )
}
