// Swatches (?view=swatches): the twelve colours a person gives to a calendar, a note, a label, a
// persona or a graph kind (contract 5.1b #55). Each is shown the ways a component draws it: an
// 8px square beside a name, a 2px bar, a 2px top edge on a raised tile (edge-t), and as words.
// Each specimen paints its role's own Tailwind class, written out in full so Tailwind sees it; a
// role the tokens do not expose paints nothing and reads "not set".
//
// The names are the Vale frames' own (Calendar, Desktop / 06 and Mobile / 08): three calendars
// and the events of week 46. Here each simply takes the next swatch.
import { Block, Caption, Page } from "./_foundation"
import { colorText, count, useRead } from "./_foundation-read"

type Swatch = { role: string; hue: string; angle: number; square: string; ink: string; edge: string; name: string }

const SWATCHES: Swatch[] = [
  { role: "swatch-01", hue: "red", angle: 25, square: "bg-swatch-01", ink: "text-swatch-01", edge: "[--edge-color:var(--swatch-01)]", name: "Personal" },
  { role: "swatch-02", hue: "orange", angle: 55, square: "bg-swatch-02", ink: "text-swatch-02", edge: "[--edge-color:var(--swatch-02)]", name: "Work" },
  { role: "swatch-03", hue: "ochre", angle: 85, square: "bg-swatch-03", ink: "text-swatch-03", edge: "[--edge-color:var(--swatch-03)]", name: "US holidays" },
  { role: "swatch-04", hue: "olive", angle: 115, square: "bg-swatch-04", ink: "text-swatch-04", edge: "[--edge-color:var(--swatch-04)]", name: "Unicron design review" },
  { role: "swatch-05", hue: "green", angle: 145, square: "bg-swatch-05", ink: "text-swatch-05", edge: "[--edge-color:var(--swatch-05)]", name: "Call Pine Hollow" },
  { role: "swatch-06", hue: "jade", angle: 175, square: "bg-swatch-06", ink: "text-swatch-06", edge: "[--edge-color:var(--swatch-06)]", name: "Board game night" },
  { role: "swatch-07", hue: "teal", angle: 205, square: "bg-swatch-07", ink: "text-swatch-07", edge: "[--edge-color:var(--swatch-07)]", name: "Dentist" },
  { role: "swatch-08", hue: "azure", angle: 235, square: "bg-swatch-08", ink: "text-swatch-08", edge: "[--edge-color:var(--swatch-08)]", name: "Warpcore planning" },
  { role: "swatch-09", hue: "blue", angle: 265, square: "bg-swatch-09", ink: "text-swatch-09", edge: "[--edge-color:var(--swatch-09)]", name: "Lunch with Ben" },
  { role: "swatch-10", hue: "violet", angle: 295, square: "bg-swatch-10", ink: "text-swatch-10", edge: "[--edge-color:var(--swatch-10)]", name: "Veterans Day" },
  { role: "swatch-11", hue: "plum", angle: 325, square: "bg-swatch-11", ink: "text-swatch-11", edge: "[--edge-color:var(--swatch-11)]", name: "Pick up board games" },
  { role: "swatch-12", hue: "rose", angle: 355, square: "bg-swatch-12", ink: "text-swatch-12", edge: "[--edge-color:var(--swatch-12)]", name: "Soccer carpool" },
]

// ── the twelve ─────────────────────────────────────────────────────────────────────────────────

function SwatchSquare({ swatch }: { swatch: Swatch }) {
  const [ref, value] = useRead((element) => colorText(getComputedStyle(element).backgroundColor))
  return (
    <figure data-swatch={swatch.role} className="min-w-0">
      <div ref={ref} className={`${swatch.square} h-12`} />
      <Caption name={`${swatch.role} // ${swatch.hue}`} value={value} note={`${swatch.angle}°`} />
    </figure>
  )
}

// ── on each surface ────────────────────────────────────────────────────────────────────────────

const SURFACES: { name: string; paint: string; note: string }[] = [
  { name: "surface-ground", paint: "bg-surface-ground", note: "a list, a sidebar" },
  { name: "surface-raised", paint: "bg-surface-raised", note: "an event, a tile, a menu" },
  { name: "primary-soft", paint: "bg-primary-soft edge-l", note: "the current nav item, a selected row" },
  { name: "state-pressed", paint: "bg-surface-ground", note: "a row under the pointer, pressed" },
]

function SquareRow({ surface }: { surface: (typeof SURFACES)[number] }) {
  const pressed = surface.name === "state-pressed"
  return (
    <figure data-surface={surface.name} className="min-w-0">
      <div className={`${surface.paint} rule-box`}>
        <div className={`${pressed ? "bg-state-pressed" : ""} grid grid-cols-6 gap-x-4 gap-y-3 px-4 py-3 sm:grid-cols-12`}>
          {SWATCHES.map((swatch) => (
            <span key={swatch.role} className="flex h-5 items-center">
              <span data-square={swatch.role} className={`${swatch.square} size-2`} />
            </span>
          ))}
        </div>
      </div>
      <Caption name={surface.name} note={surface.note} />
    </figure>
  )
}

// ── each swatch, the ways components draw it ───────────────────────────────────────────────────

function Uses({ swatch }: { swatch: Swatch }) {
  const [ref, value] = useRead((element) => colorText(getComputedStyle(element).color))
  return (
    <article data-swatch-uses={swatch.role} className="flex min-w-0 flex-col gap-3">
      <p className="type-overline">
        {swatch.role} // {swatch.hue}
      </p>
      {/* An 8px square beside a name (a calendar in the sidebar, a label in a row). */}
      <div className="type-ui flex h-9 items-center gap-3">
        <span className={`${swatch.square} size-2 shrink-0`} />
        <span className="truncate">{swatch.name}</span>
      </div>
      {/* A 2px bar inside 8px of padding on a raised surface (an event). */}
      <div className="bg-surface-raised flex gap-3 py-2 pr-3">
        <span className={`${swatch.square} w-0.5 shrink-0 self-stretch`} />
        <span className="type-ui-emphasis truncate">{swatch.name}</span>
      </div>
      {/* A 2px top edge on a raised tile: edge-t in the swatch (a note card). */}
      <div className={`edge-t ${swatch.edge} bg-surface-raised rule-box type-ui px-3 pt-4 pb-3`}>
        <span className="truncate">{swatch.name}</span>
      </div>
      {/* As words: each holds Lc 60 on the ground and on a raised surface. */}
      <div ref={ref} className={`${swatch.ink} type-label truncate`}>
        {swatch.name}
      </div>
      <Caption name="ink" value={value} />
    </article>
  )
}

export default function SwatchesView() {
  return (
    <Page
      slot="swatches"
      overline={`Foundation // Swatches // ${count(SWATCHES.length)}`}
      title="Swatches"
      lead="Twelve colours for things a person colours: calendars, notes, labels, personas, graph kinds. Hues 30° apart, each solved per ground to hold Lc 60 as text and Lc 30 as a mark on every surface it sits on. A swatch is data, never a status, and never a fill behind text."
    >
      <Block id="swatches" overline={`Roles // ${count(SWATCHES.length)}`} title="The twelve">
        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {SWATCHES.map((swatch) => (
            <SwatchSquare key={swatch.role} swatch={swatch} />
          ))}
        </div>
      </Block>
      <Block id="surfaces" overline={`Surfaces // ${count(SURFACES.length)}`} title="As 8px squares, on each surface">
        <div className="grid gap-y-6">
          {SURFACES.map((surface) => (
            <SquareRow key={surface.name} surface={surface} />
          ))}
        </div>
      </Block>
      <Block id="uses" overline="Uses // square // bar // edge-t // words" title="The ways a component draws one">
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {SWATCHES.map((swatch) => (
            <Uses key={swatch.role} swatch={swatch} />
          ))}
        </div>
      </Block>
    </Page>
  )
}
