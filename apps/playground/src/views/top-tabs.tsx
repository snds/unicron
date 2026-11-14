// Top Tab, as Figma draws it (15:498), and Warpcore's desktop top bar sections. View: ?view=top-tabs
import { useState, type ReactNode } from "react"
import { TopTab, TopTabs } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </section>
  )
}

const SECTIONS = [
  { id: "chat", index: "01", label: "Chat", icon: "chat" },
  { id: "docs", index: "02", label: "Docs", icon: "document" },
  { id: "tasks", index: "03", label: "Tasks", icon: "task" },
] as const

export default function TopTabsView() {
  const [current, setCurrent] = useState<string>("tasks")
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Figma // default, active">
        <TopTabs label="Figma specimen">
          <TopTab href="#tasks" index="03" label="Tasks" />
          <TopTab href="#tasks" index="03" label="Tasks" current />
        </TopTabs>
      </Specimen>

      <Specimen label="Warpcore top bar // icon, index, label; Tasks current">
        <TopTabs label="Sections">
          {SECTIONS.map((s) => (
            <TopTab
              key={s.id}
              href={`#${s.id}`}
              index={s.index}
              label={s.label}
              icon={s.icon}
              current={current === s.id}
              onClick={(event) => {
                event.preventDefault()
                setCurrent(s.id)
              }}
            />
          ))}
        </TopTabs>
      </Specimen>

      <Specimen label="Mark // the Tasks count in the needs-you tone; an update square">
        <TopTabs label="Sections with marks">
          <TopTab href="#chat" index="01" label="Chat" icon="chat" />
          <TopTab href="#docs" index="02" label="Docs" icon="document" mark={{ square: true, label: "Edited since you looked" }} />
          <TopTab href="#tasks" index="03" label="Tasks" icon="task" current mark={{ count: 1, tone: "needs-you" }} />
        </TopTabs>
      </Specimen>
    </div>
  )
}
