// List Row, as Figma draws it (9:181), and the round-2 parts (contract 5.1b #21). View: ?view=list-row
import { useState, type ReactNode } from "react"
import { Badge, Button, Checkbox, DropdownMenuItem, Icon } from "@unicron/ui"
import { ListRow } from "../../../../packages/ui/src/components/ui/list-row"

function Specimen({ label, wide = true, children }: { label: string; wide?: boolean; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={wide ? "flex w-full max-w-160 flex-col" : "flex w-full max-w-108 flex-col"}>{children}</div>
    </section>
  )
}

const TASK = { index: "01", title: "Migrate vault login to OPAQUE", meta: "SEA-51 // Lockdown // Claude Code", status: "Queued" }

export default function ListRowView() {
  const [selected, setSelected] = useState("02")
  const [inbox, setInbox] = useState("mira")
  const [done, setDone] = useState(false)

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Inline // label meta: default, live, selected, selected live (88)">
        <ListRow {...TASK} />
        <ListRow {...TASK} tone="live" />
        <ListRow {...TASK} selected />
        <ListRow {...TASK} selected tone="live" />
      </Specimen>

      <Specimen label="Inline // plain meta (92)">
        <ListRow {...TASK} metaStyle="plain" />
        <ListRow {...TASK} metaStyle="plain" tone="live" />
        <ListRow {...TASK} metaStyle="plain" selected />
        <ListRow {...TASK} metaStyle="plain" selected tone="live" />
      </Specimen>

      <Specimen label="Message // unread, selected (100); two preview lines (120)">
        <ListRow
          layout="message"
          unread
          sender="Mira Chen"
          time="09:14"
          subject="Cabin for the 20th, confirmed"
          preview="Booked the two-bedroom. Check-in is after 3."
        />
        <ListRow
          layout="message"
          unread
          selected
          sender="Mira Chen"
          time="09:14"
          subject="Cabin for the 20th, confirmed"
          preview="Booked the two-bedroom. Check-in is after 3."
        />
      </Specimen>

      <Specimen label="Tasks // links with a real progress value; select one (Warpcore)">
        {[
          { index: "01", title: "Migrate vault login to OPAQUE", meta: "SEA-51 // Lockdown // Claude Code // Risk 2", status: "Needs you" },
          { index: "02", title: "Add baseline drift check", meta: "SEA-48 // Workspace // Codex // Risk 1", status: "Running 04:12", live: true, progress: 19 / 32 },
          { index: "03", title: "Promote Popover out of candidates", meta: "SEA-47 // Unicron // Claude Code // Risk 1", status: "Running 01:47", live: true, progress: 19 / 32 },
          { index: "04", title: "Index the Vale decision records", meta: "SEA-46 // Vale // Local model // Risk 1", status: "Queued" },
          { index: "05", title: "Nightly dependency audit", meta: "SEA-44 // Synapse // Codex // Risk 1", status: "Failed" },
        ].map((task) => (
          <ListRow
            key={task.index}
            index={task.index}
            title={task.title}
            meta={task.meta}
            status={task.status}
            tone={task.live ? "live" : "neutral"}
            progress={task.progress}
            selected={selected === task.index}
            onClick={() => setSelected(task.index)}
            menu={
              <>
                <DropdownMenuItem>Open chat</DropdownMenuItem>
                <DropdownMenuItem>Stop</DropdownMenuItem>
              </>
            }
          />
        ))}
      </Specimen>

      <Specimen label="Inbox // message rows as buttons; count, tag, account (Vale)" wide={false}>
        <ListRow
          layout="message"
          unread
          selected={inbox === "mira"}
          onClick={() => setInbox("mira")}
          sender="Mira Chen"
          time="09:14"
          subject="Cabin for the 20th, confirmed"
          preview="Booked the two-bedroom. Check-in is after 3, and the road up is fine without chains."
        />
        <ListRow
          layout="message"
          selected={inbox === "ledger"}
          onClick={() => setInbox("ledger")}
          sender="Ledger Bank"
          account="Personal"
          time="08:02"
          subject="Your November statement is ready"
          preview="The statement for your checking account is ready to view."
        />
        <ListRow
          layout="message"
          unread
          count={3}
          selected={inbox === "theo"}
          onClick={() => setInbox("theo")}
          sender="Theo Park"
          time="Wed"
          subject="Re: Saturday carpool"
          preview="I can take both kids this week if you grab them next Saturday."
          previewLines={1}
        />
        <ListRow
          layout="message"
          tag={<Badge>Work</Badge>}
          selected={inbox === "figma"}
          onClick={() => setInbox("figma")}
          sender="Figma"
          time="Wed"
          subject="3 comments on Theme Studies"
          preview="New comments on the Swiss frame from your team."
        />
      </Specimen>

      <Specimen label="Leading, marks, badge, detail, action // the round-2 parts">
        <ListRow
          leading={<Checkbox checked={done} onCheckedChange={(on) => setDone(Boolean(on))} aria-label="Done: Index the Vale decision records" />}
          title="Index the Vale decision records"
          meta="SEA-46 // Vale // Local model"
          status={done ? "Done" : "Queued"}
        />
        <ListRow
          href="#k-14"
          leading={<Icon name="warning--alt" />}
          title="A knowledge note links to a missing file"
          meta="K-14 // knowledge/legion"
          metaStyle="plain"
          badge={<Badge tone="critical">Failing</Badge>}
          detail="Since 13:40. The note points at legion/brief.md, which was renamed."
        />
        <ListRow
          href="#steam"
          title="Steam"
          marks={<Icon name="star--filled" size="sm" label="Favourite" />}
          meta="store.steampowered.com"
          metaStyle="plain"
          status="Passkey + code"
          action={<Button variant="secondary" size="sm">Fill</Button>}
          menu={
            <>
              <DropdownMenuItem>Copy password</DropdownMenuItem>
              <DropdownMenuItem>Copy code</DropdownMenuItem>
            </>
          }
        />
        <ListRow
          href="#groq"
          title="Groq"
          meta="free // general, coding // gpt-oss-120b"
          metaStyle="plain"
          detail="May train on prompts. Tasks never use it."
          badge={<Badge tone="success">Connected</Badge>}
        />
        <ListRow
          title="Other (JMAP)"
          meta="Mail // calendars // contacts"
          metaStyle="plain"
          disabled
          disabledReason="This build cannot sign in to a JMAP server."
          onClick={() => undefined}
        />
      </Specimen>

      <Specimen label="Compact // 56 (Lockdown Quick access and sheets)" wide={false}>
        <ListRow size="compact" href="#spotify" title="Spotify" meta="spotify.com" metaStyle="plain" status="Passkey" />
        <ListRow size="compact" href="#stripe" title="Stripe" meta="dashboard.stripe.com" metaStyle="plain" status="Login" selected />
        <ListRow size="compact" href="#synology" title="Synology" meta="quickconnect.to" metaStyle="plain" action={<Button variant="secondary" size="sm">Fill</Button>} />
        <ListRow
          size="compact"
          layout="message"
          unread
          sender="Mira Chen"
          time="09:14"
          preview="Booked the two-bedroom. Check-in is after 3."
          onClick={() => undefined}
        />
      </Specimen>
    </div>
  )
}
