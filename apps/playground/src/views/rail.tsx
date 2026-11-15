// Rail Item, as Figma draws it (44:106), and the collapsed Warpcore context panel. View: ?view=rail
import { useState, type ReactNode } from "react"
import { FloatButton, Rail, RailItem } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-start gap-6">{children}</div>
    </section>
  )
}

const PANEL = [
  { id: "tasks", label: "Background tasks", icon: "task", count: 2, live: true },
  { id: "artifacts", label: "Artifacts", icon: "code", count: 4, live: false },
  { id: "environments", label: "Environments", icon: "cloud", count: 3, live: false },
  { id: "files", label: "Files", icon: "document", count: 6, live: false },
] as const

export default function RailView() {
  const [open, setOpen] = useState<string>("artifacts")
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Figma // default, active, live (Figma: Alert)">
        <RailItem label="Tasks" icon="task" count={3} />
        <RailItem label="Tasks" icon="task" count={3} state="active" />
        <RailItem label="Tasks" icon="task" count={3} state="live" />
        <RailItem label="Files" icon="document" />
      </Specimen>

      <Specimen label="Marks // a needs-you count, an update square">
        <RailItem label="Tasks" icon="task" mark={{ count: 1, tone: "needs-you" }} />
        <RailItem label="Settings" icon="settings" mark={{ square: true, label: "Update ready" }} />
      </Specimen>

      <Specimen label="Warpcore context panel, collapsed // a toolbar: one tab stop, arrows move">
        <div className="flex flex-col items-center gap-4">
          <FloatButton label="Open the context panel" icon="open-panel--right" />
          <Rail aria-label="Context panel">
            {PANEL.map((p) => (
              <RailItem
                key={p.id}
                label={p.label}
                icon={p.icon}
                count={p.count}
                state={open === p.id ? "active" : p.live ? "live" : "default"}
                liveLabel="running"
                onClick={() => setOpen(p.id)}
              />
            ))}
          </Rail>
        </div>
      </Specimen>
    </div>
  )
}
