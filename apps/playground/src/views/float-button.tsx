// Float Button, as Figma draws it (20:1690), with the current state and the long press. View: ?view=float-button
import { useState, type ReactNode } from "react"
import { FloatButton } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function FloatButtonView() {
  const [filtering, setFiltering] = useState(true)
  const [panel, setPanel] = useState(false)
  const [last, setLast] = useState("Nothing yet")

  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Kind and size // neutral M 44, L 48; primary M 44, L 48">
        <FloatButton label="Search" icon="search" />
        <FloatButton label="Search" icon="search" size="l" />
        <FloatButton label="Search" icon="search" kind="primary" />
        <FloatButton label="Search" icon="search" kind="primary" size="l" />
      </Specimen>

      <Specimen label="Current // inverted ink, never a second primary fill">
        <FloatButton label="Search" icon="search" size="l" current="page" />
        <FloatButton label="Filter" icon="filter" size="l" current={filtering} onClick={() => setFiltering((on) => !on)} />
        <FloatButton label="Context panel" icon="settings" size="l" aria-pressed={panel} onClick={() => setPanel((on) => !on)} />
      </Specimen>

      <Specimen label="State // disabled">
        <FloatButton label="Search" icon="search" size="l" disabled />
        <FloatButton label="New task" icon="add" kind="primary" size="l" disabled />
      </Specimen>

      <Specimen label="Close // the close button of a sheet or a dialog">
        <FloatButton label="Close" icon="close" size="l" />
      </Specimen>

      <Specimen label="Phone bottom row // search left, create right; hold create, or press Shift+Enter on it">
        <div className="flex w-full max-w-sm items-center justify-between gap-2">
          <FloatButton label="Search" icon="search" size="l" onClick={() => setLast("Search")} />
          <p className="type-caption min-w-0 flex-1 truncate text-center" aria-live="polite">
            {last}
          </p>
          <FloatButton
            label="New task"
            icon="add"
            kind="primary"
            size="l"
            aria-haspopup="menu"
            longPressLabel="Quick create"
            onClick={() => setLast("New task")}
            onLongPress={() => setLast("Quick create")}
          />
        </div>
      </Specimen>
    </div>
  )
}
