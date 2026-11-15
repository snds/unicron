// Edges (?view=edges): the stylesheet's 2px primary edges, edge-l, edge-t and edge-b (contract
// §1.6 and 5.1b #56). Like the rules, an edge is an inset shadow: it never adds height, and every
// edge and rule on one element composes into one box-shadow. Each row prints its own height and
// how many lines it draws, measured from the page; every row is as tall as the first, which has
// none. Then the uses the briefs name: today in a month grid when another day is picked (Vale,
// edge-b), a selected row (edge-l), a tile marked from above in a swatch (edge-t).
import { Block, Caption, Page } from "./_foundation"
import { count, px, useRead } from "./_foundation-read"

const EDGES: { name: string; paint: string }[] = [
  { name: "edge-t", paint: "edge-t" },
  { name: "edge-b", paint: "edge-b" },
  { name: "edge-l", paint: "edge-l" },
  { name: "edge-t edge-b", paint: "edge-t edge-b" },
  { name: "edge-l edge-b", paint: "edge-l edge-b" },
  { name: "rule-b edge-t", paint: "rule-b edge-t" },
  { name: "rule-t edge-b", paint: "rule-t edge-b" },
  { name: "rule-box edge-t", paint: "rule-box edge-t bg-surface-raised" },
  { name: "rule-b edge-l // selected", paint: "rule-b edge-l bg-primary-soft" },
  { name: "edge-b // --edge-color: secondary-live", paint: "edge-b [--edge-color:var(--secondary-live)]" },
  { name: "edge-t // --edge-color: swatch-07", paint: "edge-t [--edge-color:var(--swatch-07)] bg-surface-raised" },
  { name: "edge-b // + a ring under the pointer", paint: "edge-b hover:ring-1 hover:ring-primary-fill" },
]

/** How many lines the box-shadow draws: one per inset layer that is not transparent. */
function lines(shadow: string) {
  if (shadow === "none") return 0
  return shadow.split(/,(?![^(]*\))/).filter((layer) => /inset/.test(layer) && !/rgba\(0, 0, 0, 0\)|transparent/.test(layer) && !/^\s*(rgba?\([^)]*\)\s*)?0px 0px 0px 0px/.test(layer.trim())).length
}

function EdgeRow({ name, paint }: { name: string; paint: string }) {
  const [ref, reading] = useRead((element) => {
    const style = getComputedStyle(element)
    const drawn = lines(style.boxShadow)
    return `${px(style.height)} // ${count(drawn)} ${drawn === 1 ? "line" : "lines"}`
  })
  return (
    <figure data-edge={name} className="min-w-0">
      <div ref={ref} className={`${paint} type-ui px-4 py-3`}>
        Cabin for the 20th, confirmed
      </div>
      <Caption name={name} value={reading} />
    </figure>
  )
}

// ── a month grid: today with edge-b while another day is picked (Vale 1.3) ───────────────────

const WEEKS: { day: string; date: string; muted?: boolean }[][] = [
  [
    { day: "MON", date: "09" },
    { day: "TUE", date: "10" },
    { day: "WED", date: "11" },
    { day: "THU", date: "12" },
    { day: "FRI", date: "13" },
    { day: "SAT", date: "14" },
    { day: "SUN", date: "15" },
  ],
  [
    { day: "MON", date: "16" },
    { day: "TUE", date: "17" },
    { day: "WED", date: "18" },
    { day: "THU", date: "19" },
    { day: "FRI", date: "20" },
    { day: "SAT", date: "21" },
    { day: "SUN", date: "22" },
  ],
]
const TODAY = "12"
const PICKED = "18"

function Day({ day, date }: { day: string; date: string }) {
  const picked = date === PICKED
  const today = date === TODAY
  const paint = picked ? "bg-primary-fill text-primary-on-fill" : today ? "edge-b" : ""
  return (
    <div data-day={date} data-today={today || undefined} data-picked={picked || undefined} className={`${paint} flex h-12 flex-col items-center justify-center`}>
      <span className="type-meta text-current">{day}</span>
      <span className="type-number-count leading-none">{date}</span>
    </div>
  )
}

function MonthGrid() {
  const [ref, reading] = useRead((element) => {
    const today = element.querySelector<HTMLElement>(`[data-day="${TODAY}"]`)
    const plain = element.querySelector<HTMLElement>('[data-day="13"]')
    if (!today || !plain) return null
    return `today ${px(getComputedStyle(today).height)} // a plain day ${px(getComputedStyle(plain).height)}`
  })
  return (
    <figure data-edge-use="month" className="min-w-0">
      <div ref={ref} className="bg-surface-ground rule-box px-2 py-2">
        <p className="type-overline px-2 pb-2">Calendar // November 2026</p>
        {WEEKS.map((week) => (
          <div key={week[0]!.date} className="grid grid-cols-7 gap-1">
            {week.map((cell) => (
              <Day key={cell.date} {...cell} />
            ))}
          </div>
        ))}
      </div>
      <Caption name="edge-b // today, THU 12, while WED 18 is picked" value={reading} />
    </figure>
  )
}

function SelectedRow() {
  return (
    <figure data-edge-use="row" className="min-w-0">
      <div className="bg-surface-ground">
        <div className="rule-b edge-l bg-primary-soft px-4 py-3">
          <p className="type-meta">Mira Chen</p>
          <p className="type-ui-emphasis">Cabin for the 20th, confirmed</p>
        </div>
        <div className="rule-b px-4 py-3">
          <p className="type-meta">Theo Park</p>
          <p className="type-ui-emphasis">Re: Saturday carpool</p>
        </div>
        <div className="rule-b px-4 py-3">
          <p className="type-meta">Calendar</p>
          <p className="type-ui-emphasis">Dentist moved to 4:30 PM</p>
        </div>
      </div>
      <Caption name="rule-b edge-l // a selected row" />
    </figure>
  )
}

function SwatchTile() {
  return (
    <figure data-edge-use="tile" className="min-w-0">
      <div className="edge-t [--edge-color:var(--swatch-07)] bg-surface-raised rule-box px-4 pt-5 pb-4">
        <p className="type-overline">Event // Wed 11.18</p>
        <p className="type-subtitle">Dentist</p>
        <p className="type-caption text-text-secondary">Sierra Dental, Roseville</p>
      </div>
      <Caption name="edge-t rule-box // --edge-color: swatch-07" />
    </figure>
  )
}

export default function EdgesView() {
  return (
    <Page
      slot="edges"
      overline={`Foundation // Edges // ${count(EDGES.length + 1)} rows`}
      title="Edges"
      lead="The 2px primary edge, along the left, the top or the bottom. It is drawn inside the box, so it never adds height, and it composes with the hairline rules. --edge-color recolours every edge on the element."
    >
      <Block id="edges" overline={`Edges // ${count(EDGES.length + 1)} rows`} title="Each edge, alone and together">
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          <EdgeRow name="no edge" paint="" />
          {EDGES.map((edge) => (
            <EdgeRow key={edge.name} name={edge.name} paint={edge.paint} />
          ))}
        </div>
      </Block>
      <Block id="uses" overline="Uses // 03" title="Where the briefs use them">
        <div className="grid gap-x-6 gap-y-8 lg:grid-cols-3">
          <MonthGrid />
          <SelectedRow />
          <SwatchTile />
        </div>
      </Block>
    </Page>
  )
}
