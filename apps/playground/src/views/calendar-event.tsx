// CalendarEvent: Figma's Calendar Event (32:116), its two tones, and what Vale adds: swatch, compact, selected, a mark (contract 5.1b #39). View: ?view=calendar-event
import { useState, type ReactNode } from "react"
import { CalendarEvent, Icon } from "@unicron/ui"

function Specimen({ label, children, width = "max-w-[300px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col gap-2 ${width}`}>{children}</div>
    </section>
  )
}

const TODAY = [
  { id: "review", time: "10:00 – 10:30", title: "Unicron design review", place: "Video call" },
  { id: "pine", time: "13:00 – 13:20", title: "Call Pine Hollow about late check-in", place: "Next // in 1 h 18 min" },
  { id: "games", time: "19:00 – 21:00", title: "Board game night", place: "Home" },
]

export default function CalendarEventView() {
  const [open, setOpen] = useState("pine")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // primary, neutral; 300 wide, 80 tall">
        <CalendarEvent tone="primary" time="16:30 – 17:15" title="Dentist" place="Sierra Dental, Roseville" />
        <CalendarEvent time="16:30 – 17:15" title="Dentist" place="Sierra Dental, Roseville" />
      </Specimen>

      <Specimen label="A day // the next event in primary; press one to open it" width="max-w-[358px]">
        {TODAY.map((e) => (
          <CalendarEvent
            key={e.id}
            tone={e.id === "pine" ? "primary" : "neutral"}
            selected={open === e.id}
            time={e.time}
            title={e.title}
            place={e.place}
            mark={e.id === "review" ? <Icon name="video" size="sm" label="Has a call" /> : undefined}
            onClick={() => setOpen(e.id)}
          />
        ))}
        <CalendarEvent time="Wed 11.18 // 16:30 – 17:15" title="Dentist" place="Sierra Dental, Roseville" href="#dentist" />
      </Specimen>

      <Specimen label="Swatch // the bar in the calendar's colour (swatch roles arrive with the foundation work)">
        <CalendarEvent swatch="03" time="All day" title="Veterans Day" place="US holidays" />
        <CalendarEvent swatch="07" time="12:00 – 13:00" title="Lunch with Ben" place="Bricks Cafe" />
      </Specimen>

      <Specimen label="Compact // a week strip or a month cell: title first, 24 tall" width="max-w-[160px]">
        <CalendarEvent compact time="10:00" title="Warpcore planning" />
        <CalendarEvent compact tone="primary" time="13:00" title="Call Pine Hollow" />
        <CalendarEvent compact time="19:00" title="Board game night" mark={<Icon name="video" size="sm" label="Has a call" />} />
        <CalendarEvent compact swatch="03" time="All day" title="Veterans Day" />
      </Specimen>

      <Specimen label="Disabled">
        <CalendarEvent disabled time="09:00 – 10:30" title="Soccer carpool" place="Theo drives" />
      </Specimen>
    </div>
  )
}
