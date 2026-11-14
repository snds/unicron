// Tile: a raised panel with a hairline and a 4px top edge (contract 5.1b #33): Lockdown's card art, Vale's note cards. View: ?view=tile
// The new data-b components are imported from the ui source until packages/ui/src/index.ts exports
// them (the integrator's file); then these imports become "@unicron/ui".
import { useState, type ReactNode } from "react"
import { Tile } from "../../../../packages/ui/src/components/ui/tile"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

function CardArt() {
  return (
    <>
      <p className="type-overline">Visa // personal</p>
      <p className="type-number-count">•••• •••• •••• 4417</p>
      <div className="flex gap-8">
        <div className="flex flex-col gap-1">
          <p className="type-overline">Expires</p>
          <p className="type-folio">08/29</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="type-overline">CVC</p>
          <p className="type-folio">•••</p>
        </div>
      </div>
    </>
  )
}

const NOTES = [
  { id: "cabin", title: "Cabin packing list", snippet: "Sleeping bags, headlamps, board games (Theo), groceries for night one, firewood starter.", foot: "Edited 08:40", swatch: "04" as const },
  { id: "games", title: "Board games to bring", snippet: "Azul, Cascadia, the long Catan box, two decks of cards.", foot: "Edited Wed", swatch: undefined },
  { id: "dentist", title: "Questions for the dentist", snippet: "Night guard fit. Whether the 4:30 slot can move to mornings.", foot: "Edited Tue", swatch: "09" as const },
]

export default function TileView() {
  const [open, setOpen] = useState("cabin")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Card art // desktop 420 wide, 24 in">
        <div className="w-full max-w-[420px]">
          <Tile>
            <CardArt />
          </Tile>
        </div>
      </Specimen>

      <Specimen label="Card art // phone 358 wide, 20 in">
        <div className="w-full max-w-[358px]">
          <Tile size="compact">
            <CardArt />
          </Tile>
        </div>
      </Specimen>

      <Specimen label="Note cards // a swatch edge when the note has a colour; press to open">
        <div className="grid w-full max-w-[648px] grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {NOTES.map((note) => (
            <Tile
              key={note.id}
              size="compact"
              edge="none"
              swatch={note.swatch}
              selected={open === note.id}
              onClick={() => setOpen(note.id)}
            >
              <span className="type-ui-emphasis">{note.title}</span>
              <span className="type-caption text-support-foreground line-clamp-6">{note.snippet}</span>
              <span className="type-meta">{note.foot}</span>
            </Tile>
          ))}
        </div>
      </Specimen>

      <Specimen label="Guest card // around a QR code (QrCode arrives with the security work)">
        <div className="w-full max-w-[358px]">
          <Tile size="compact">
            <p className="type-overline">Wi-Fi // guest card</p>
            <p className="type-subtitle">PineHollow-Guest</p>
            <p className="type-caption text-support-foreground">Scan with a phone camera to join.</p>
          </Tile>
        </div>
      </Specimen>
    </div>
  )
}
