// Button, as Figma draws it (15:478) and in the states Figma leaves out. View: ?view=button
import type { ReactNode } from "react"
import { Button, Icon } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function ButtonView() {
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Kind // size M (40)">
        <Button>Review diff</Button>
        <Button variant="secondary">Review diff</Button>
        <Button variant="ghost">Review diff</Button>
        <Button variant="destructive">Stop task</Button>
        <Button variant="link">Open docs</Button>
      </Specimen>

      <Specimen label="Kind // size S (32), for rows and toolbars">
        <Button size="sm">Review diff</Button>
        <Button size="sm" variant="secondary">
          Review diff
        </Button>
        <Button size="sm" variant="ghost">
          Review diff
        </Button>
        <Button size="sm" variant="destructive">
          Stop task
        </Button>
      </Specimen>

      <Specimen label="Size // S 32, M 40, L 48">
        <Button size="sm">Review diff</Button>
        <Button>Review diff</Button>
        <Button size="lg">Review diff</Button>
      </Specimen>

      <Specimen label="Icon // 16px, 8px from the label">
        <Button>
          <Icon name="add" />
          New task
        </Button>
        <Button variant="secondary">
          <Icon name="search" />
          Search
        </Button>
        <Button size="sm" variant="secondary">
          <Icon name="archive" />
          Archive
        </Button>
      </Specimen>

      <Specimen label="Icon only // squares of the same heights">
        <Button size="icon-sm" variant="secondary" aria-label="Search">
          <Icon name="search" />
        </Button>
        <Button size="icon" variant="secondary" aria-label="Search">
          <Icon name="search" />
        </Button>
        <Button size="icon-lg" variant="secondary" aria-label="Search">
          <Icon name="search" />
        </Button>
        <Button size="icon" aria-label="New task">
          <Icon name="add" />
        </Button>
        <Button size="icon" variant="ghost" aria-label="Close">
          <Icon name="close" />
        </Button>
      </Specimen>

      <Specimen label="Block // stretches to its container (Vale sidebar, 240)">
        <div className="w-60">
          <Button block>
            <Icon name="edit" />
            Compose
          </Button>
        </div>
      </Specimen>

      <Specimen label="State // disabled">
        <Button disabled>Review diff</Button>
        <Button variant="secondary" disabled>
          Review diff
        </Button>
        <Button variant="ghost" disabled>
          Review diff
        </Button>
        <Button variant="destructive" disabled>
          Stop task
        </Button>
      </Specimen>

      <Specimen label="State // disabled with a reason: it stays in the tab order and says why (5.1b #37)">
        <Button disabled disabledReason="Fix or remove the address in red.">
          Send
        </Button>
        <Button variant="secondary" disabled disabledReason="Offline. Sharing needs the server.">
          Share
        </Button>
      </Specimen>

      <Specimen label="State // loading: busy, label kept, spinner in the icon slot">
        <Button loading>Review diff</Button>
        <Button variant="secondary" loading>
          <Icon name="archive" />
          Archive
        </Button>
        <Button size="sm" variant="secondary" loading>
          Review diff
        </Button>
        <Button size="icon" variant="secondary" loading aria-label="Search">
          <Icon name="search" />
        </Button>
      </Specimen>

      <Specimen label="On needs-you // one solid action, the second is text">
        <div className="on-needs-you bg-needs-you-fill text-needs-you-on-fill flex w-full max-w-md flex-col gap-3 p-4">
          <p className="type-overline text-needs-you-on-fill">Awaiting your review // SEA-51</p>
          <p className="type-ui">Claude Code changed 6 files.</p>
          <div className="flex items-center gap-2">
            <Button variant="needs-you">Review diff</Button>
            <Button variant="needs-you-text">Open task</Button>
          </div>
        </div>
        <div className="on-needs-you bg-needs-you-fill text-needs-you-on-fill flex h-12 w-full max-w-md items-center gap-3 px-4">
          <div className="min-w-0 flex-1">
            <p className="type-overline text-needs-you-on-fill truncate">SEA-48 // Running 04:12</p>
            <p className="type-ui truncate">Add baseline drift check</p>
          </div>
          <Button size="sm" variant="needs-you">
            Review diff
          </Button>
        </div>
        <div className="on-needs-you bg-needs-you-fill text-needs-you-on-fill flex w-full max-w-md items-center gap-2 p-4">
          <Button variant="needs-you-outline">Review diff</Button>
          <Button variant="needs-you-outline" disabled>
            Review diff
          </Button>
          <Button variant="needs-you-text">Open task</Button>
        </div>
      </Specimen>

      <Specimen label="Quiet kinds // ghost-muted, ghost-destructive">
        <Button variant="ghost-muted">Add holidays and more</Button>
        <Button variant="ghost-destructive">Delete</Button>
      </Specimen>

      <Specimen label="Inline // a text action inside a sentence">
        <p className="type-caption">
          Fastmail refused the password. Mail from 09:16 on is not here yet.{" "}
          <Button variant="link" size="inline">
            Sign in again
          </Button>
        </p>
      </Specimen>

      <Specimen label="Indicator // something behind the button wants the person">
        <Button variant="secondary" indicator={{ kind: "attention", count: 2 }}>
          Tasks
        </Button>
        <Button size="icon" variant="secondary" aria-label="Mail" indicator={{ kind: "unread" }}>
          <Icon name="archive" />
        </Button>
      </Specimen>
    </div>
  )
}
