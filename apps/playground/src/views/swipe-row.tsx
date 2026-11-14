// Swipe Action, as Figma draws it (25:2042), on rows that swipe (contract §6.4). View: ?view=swipe-row
import { useState, type ReactNode } from "react"
import { DropdownMenuItem, ListRow, SwipeAction, SwipeRow } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-98 flex-col">{children}</div>
    </section>
  )
}

export default function SwipeRowView() {
  const [last, setLast] = useState("Swipe a row, or open its menu")
  const say = (what: string) => () => setLast(what)

  const vale = {
    leading: { label: "Read", icon: "view" as const, reversible: true, onAction: say("Marked read") },
    trailing: [
      { label: "Flag", icon: "flag" as const, reversible: true, onAction: say("Flagged") },
      { label: "Snooze", icon: "time" as const, onAction: say("Snooze: pick a time") },
      { label: "Archive", icon: "archive" as const, reversible: true, onAction: say("Archived (undo in the strip)") },
    ],
  }

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Tiles // primary, neutral, needs-you; 80 wide, stretched to the row">
        <div className="flex h-24 gap-6">
          <SwipeAction tone="primary" icon="archive" label="Archive" />
          <SwipeAction tone="neutral" icon="archive" label="Archive" />
          <SwipeAction tone="needs-you" icon="archive" label="Archive" />
        </div>
      </Specimen>

      <Specimen label="Vale inbox // open on each side, and at rest; a full swipe archives">
        <p className="type-caption pb-3" aria-live="polite">
          {last}
        </p>
        <SwipeRow {...vale} defaultOpen="trailing">
          <ListRow
            layout="message"
            unread
            onClick={say("Opened: Cabin for the 20th, confirmed")}
            sender="Mira Chen"
            time="09:14"
            subject="Cabin for the 20th, confirmed"
            preview="Booked the two-bedroom. Check-in is after 3."
          />
        </SwipeRow>
        <SwipeRow {...vale}>
          <ListRow
            layout="message"
            onClick={say("Opened: Your November statement is ready")}
            sender="Ledger Bank"
            time="08:02"
            subject="Your November statement is ready"
            preview="The statement for your checking account is ready."
          />
        </SwipeRow>
        <SwipeRow {...vale} defaultOpen="leading">
          <ListRow
            layout="message"
            unread
            onClick={say("Opened: Re: Saturday carpool")}
            sender="Theo Park"
            time="Wed"
            subject="Re: Saturday carpool"
            preview="I can take both kids this week."
          />
        </SwipeRow>
        <SwipeRow {...vale}>
          <ListRow
            layout="message"
            onClick={say("Opened: 3 comments on Theme Studies")}
            sender="Figma"
            time="Wed"
            subject="3 comments on Theme Studies"
            preview="New comments on the Swiss frame."
          />
        </SwipeRow>
      </Specimen>

      <Specimen label="Lockdown items // more, code, copy password; favorite on the right">
        {[
          { title: "Steam", meta: "store.steampowered.com", status: "Passkey + code", open: "trailing" as const },
          { title: "Spotify", meta: "spotify.com", status: "Passkey" },
          { title: "Stripe", meta: "dashboard.stripe.com", status: "Login", open: "leading" as const },
          { title: "Synology", meta: "quickconnect.to", status: "Login + code" },
        ].map((item) => (
          <SwipeRow
            key={item.title}
            defaultOpen={item.open}
            leading={{ label: "Favorite", icon: "star", reversible: true, onAction: say(`Favorite: ${item.title}`) }}
            trailing={[
              { label: "More", icon: "overflow-menu--horizontal", onAction: say(`More: ${item.title}`) },
              { label: "Code", icon: "time", onAction: say(`Code copied: ${item.title}`) },
              { label: "Password", icon: "copy", reversible: true, onAction: say(`Password copied: ${item.title}`) },
            ]}
          >
            <ListRow href={`#${item.title.toLowerCase()}`} title={item.title} meta={item.meta} metaStyle="plain" status={item.status} />
          </SwipeRow>
        ))}
      </Specimen>

      <Specimen label="Warpcore tasks // stop, pause; review on the right never approves">
        <SwipeRow
          leading={{ label: "Review", icon: "review", confirm: true, onReview: say("Review opened: SEA-51") }}
          trailing={[
            { label: "Stop", icon: "stop", onAction: say("Stop: asks first") },
            { label: "Pause", icon: "pause", reversible: true, onAction: say("Paused: SEA-48") },
          ]}
        >
          <ListRow
            index="02"
            title="Add baseline drift check"
            meta="SEA-48 // Workspace // Codex // Risk 1"
            status="Running 04:12"
            tone="live"
            progress={19 / 32}
            onClick={say("Opened: SEA-48")}
            menu={<DropdownMenuItem onClick={say("Open chat: SEA-48")}>Open chat</DropdownMenuItem>}
          />
        </SwipeRow>
        <SwipeRow
          defaultOpen="trailing"
          trailing={[{ label: "Review", icon: "review", tone: "needs-you", confirm: true, onReview: say("Review opened: sign-in request") }]}
        >
          <ListRow
            index="01"
            title="Migrate vault login to OPAQUE"
            meta="SEA-51 // Lockdown // Claude Code // Risk 2"
            status="Needs you"
            onClick={say("Opened: SEA-51")}
          />
        </SwipeRow>
      </Specimen>
    </div>
  )
}
