// Highlight: the words a search matched (contract 5.1b #45, decisions §6). View: ?view=highlight
import { useState, type ReactNode } from "react"
import { Highlight, Input, ListRow } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-160 flex-col gap-4">{children}</div>
    </section>
  )
}

export default function HighlightView() {
  const [query, setQuery] = useState("drift")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="In rows // the match in the title and in the meta, any role, any ink">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search" />
        <div className="flex flex-col">
          <ListRow
            index="02"
            title={<Highlight text="Add baseline drift check" query={query} />}
            meta={<Highlight text="SEA-48 // Workspace // Codex" query={query} />}
            status="Running 04:12"
            tone="live"
            href="#sea-48"
          />
          <ListRow
            selected
            index="H-09"
            title={<Highlight text="Visual QA: baseline drift check" query={query} />}
            meta={<Highlight text="Claude Code // 3 files" query={query} />}
            metaStyle="plain"
            status="Review"
            href="#h-09"
          />
          <ListRow
            layout="message"
            sender={<Highlight text="Mira Chen" query={query} />}
            time="09:14"
            subject={<Highlight text="Cabin for the 20th, confirmed" query={query} />}
            preview={<Highlight text="Booked the two-bedroom. Check-in is after 3." query={query} />}
            href="#cabin"
          />
        </div>
      </Specimen>

      <Specimen label="Marked as given // the children are the match">
        <p className="type-body">
          Found in <Highlight>harness/visual-qa</Highlight>/config.ts
        </p>
      </Specimen>
    </div>
  )
}
