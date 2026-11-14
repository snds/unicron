// Contrast recipes for the foundation roles round 2 adds (contract 5.1b #55, #56):
//
//   - the twelve swatches, swatch-01 … swatch-12: a person's colour for a calendar, a note, a
//     label, a persona or a graph kind. They are drawn as a 2px bar (CalendarEvent), a 4px edge
//     (Tile), an 8px square (NavItem, ListRow) or, where an app needs it, as words. So each is
//     held to the floor for coloured text (Lc 60) on the two surfaces it sits on, and as a mark
//     (Lc 30) on the washes a row can carry under it: the selected row or current nav item
//     (primary-soft), and the hover and pressed washes. The values were solved for Lc 62 on the
//     lowest of the eight surfaces of each ground (global.json → swatch), so nothing here is an
//     exception.
//   - edge-t and edge-b (packages/ui/src/styles/index.css) paint the same primary-fill edge as
//     edge-l, on the same surfaces: the core's primary-fill-ground, -raised and primary-edge-soft
//     measure them (graphite misses there are Figma's fill, named in the core).
//
// The diff washes (diff-added, diff-removed) are measured in the core table (body-diff-added,
// body-diff-removed), beside the roles they are made from.

const r = (role, alpha) => ({ role, alpha })

const SWATCHES = Array.from({ length: 12 }, (_, i) => `swatch-${String(i + 1).padStart(2, "0")}`)

export const recipes = SWATCHES.flatMap((swatch) => [
  // As words, or as a bar, edge or square on the page and on a raised surface.
  { id: `${swatch}-ground`, source: `text-${swatch}, or bg-${swatch} as a bar or square, on the ground`, kind: "text-label", paint: r(swatch), over: [r("surface-ground")] },
  { id: `${swatch}-raised`, source: `text-${swatch}, or bg-${swatch} as a bar, edge or square, on bg-surface-raised (an event, a tile, a card)`, kind: "text-label", paint: r(swatch), over: [r("surface-raised")] },
  // As a mark in a row that carries a state: the current nav item or a selected row, and the
  // hover and pressed washes over the page and over a raised surface.
  { id: `${swatch}-soft`, source: `bg-${swatch}, the 8px square of a current nav item or a selected row (bg-primary-soft)`, kind: "solid", paint: r(swatch), over: [r("primary-soft")] },
  { id: `${swatch}-ground-hover`, source: `bg-${swatch}, a row's square under hover:bg-state-hover`, kind: "solid", paint: r(swatch), over: [r("surface-ground"), r("state-hover")] },
  { id: `${swatch}-ground-pressed`, source: `bg-${swatch}, a row's square under active:bg-state-pressed`, kind: "solid", paint: r(swatch), over: [r("surface-ground"), r("state-pressed")] },
  { id: `${swatch}-raised-pressed`, source: `bg-${swatch}, the bar of a pressed event on bg-surface-raised (active:bg-state-pressed)`, kind: "solid", paint: r(swatch), over: [r("surface-raised"), r("state-pressed")] },
])

export default recipes
