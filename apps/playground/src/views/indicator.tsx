// Indicator: where the person is wanted. Square marks: unread in ink, attention in the yellow with
// an ink outline; counts in two digits, capped at 99+ (decisions §13). View: ?view=indicator
import type { ReactNode } from "react"
import { Button, IconButton, IndicatorMark } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </section>
  )
}

function Marks() {
  return (
    <>
      <IndicatorMark indicator={{ kind: "unread" }} />
      <IndicatorMark indicator={{ kind: "attention" }} />
      <IndicatorMark indicator={{ kind: "unread", count: 7 }} shape="badge" />
      <IndicatorMark indicator={{ kind: "unread", count: 14 }} shape="badge" />
      <IndicatorMark indicator={{ kind: "attention", count: 2 }} shape="badge" />
      <IndicatorMark indicator={{ kind: "attention", count: 140 }} shape="badge" />
    </>
  )
}

export default function IndicatorView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Marks // unread dot, attention dot, then counts on the ground">
        <Marks />
      </Specimen>
      <Specimen label="Marks // on a raised panel">
        <div className="bg-surface-raised rule-box flex items-center gap-6 p-4">
          <Marks />
        </div>
      </Specimen>
      <Specimen label="Marks // on a selected row (primary-soft)">
        <div className="bg-primary-soft flex items-center gap-6 p-4">
          <Marks />
        </div>
      </Specimen>
      <Specimen label="On a control // the mark in the corner, the words in the name">
        <Button variant="secondary" indicator={{ kind: "attention", count: 2 }}>
          Tasks
        </Button>
        <IconButton icon="chat" label="Chats" indicator={{ kind: "unread", count: 3 }} />
        <IconButton icon="settings" label="Settings" indicator={{ kind: "attention" }} />
      </Specimen>
    </div>
  )
}
