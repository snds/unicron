// Artifact Card, as Figma draws it (44:85), and the open (selected) state. View: ?view=artifact-card
import { useState, type ReactNode } from "react"
import { ArtifactCard } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-150 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

const ARTIFACTS = [
  { id: "diff", icon: "code", title: "OPAQUE migration diff", meta: "Diff // 6 files // +212 −48 // v2" },
  { id: "flow", icon: "flow", title: "Login flow", meta: "Diagram // 2 messages // v1" },
  { id: "doc", icon: "document", title: "auth.md draft", meta: "Doc // edited 14:04" },
  { id: "report", icon: "checkmark", title: "Test report", meta: "Report // 128 of 128 pass // 13:58" },
] as const

export default function ArtifactCardView() {
  const [open, setOpen] = useState<string>("flow")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Default // Figma 44:85 at its drawn 420">
        <div className="w-full max-w-105">
          <ArtifactCard title="OPAQUE migration diff" meta="Diff // 6 files // v2" />
        </div>
      </Specimen>

      <Specimen label="Kinds // the icon names the kind; it fills its column">
        {ARTIFACTS.map((a) => (
          <ArtifactCard key={a.id} icon={a.icon} title={a.title} meta={a.meta} />
        ))}
      </Specimen>

      <Specimen label="Open // the one beside the chat: soft fill, 2px edge (press another to move it)">
        {ARTIFACTS.map((a) => (
          <ArtifactCard key={a.id} icon={a.icon} title={a.title} meta={a.meta} selected={open === a.id} onClick={() => setOpen(a.id)} />
        ))}
      </Specimen>

      <Specimen label="As a link, and off">
        <ArtifactCard href="?view=artifact-card" icon="document" title="auth.md draft" meta="Doc // edited 14:04" />
        <ArtifactCard disabled icon="code" title="OPAQUE migration diff" meta="Diff // 6 files // v2" />
      </Specimen>

      <Specimen label="A long title // cut to one line">
        <div className="w-full max-w-90">
          <ArtifactCard title="Nightly dependency audit for every package in the monorepo" meta="Report // 03:12 // cap hit" />
        </div>
      </Specimen>
    </div>
  )
}
