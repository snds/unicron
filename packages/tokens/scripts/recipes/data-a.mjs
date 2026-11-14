// Contrast recipes for the data-a area: ListRow, SwipeRow / SwipeAction, FilterChip, SectionHeader,
// LogRow, DiffBlock, FileChip, Table, Highlight (packages/ui/src/components/ui/).
//
// Only the pairs no other table measures yet are measured here. Every other paint these parts lay
// down is one the core table (contrast.mjs), controls.mjs or data-b.mjs already gates or reports,
// as a named exception where it misses; it is listed below so nothing is measured twice:
//
// ListRow
//   title, subject, sender (text-body) on the ground, on primary-soft ............. core body-ground, body-soft (stone: Figma value)
//   index (folio), meta, status, time, preview (text-label) .......................... core label-ground, label-soft (Figma value)
//   detail, disabled reason (text-secondary) ......................................... core secondary-ground, secondary-soft
//   live status (secondary-live) on the ground, on primary-soft ...................... core live-ground, live-soft (Figma value)
//   the hover and pressed washes under body, secondary and label ink ................. core *-ground-hover, *-ground-pressed, *-soft-hover (contract state)
//   the pressed wash on a selected row; live ink under a wash ........................ data-b.mjs (the same pairs, measured there)
//   the 2px selected edge (primary-fill) against primary-soft ....................... core primary-edge-soft (Figma value)
//   the focus ring, inset, on the ground and on primary-soft ........................ core ring-ground, ring-soft
//   the segmented progress bar ....................................................... core live-progress; controls progress-*
// SwipeAction
//   primary: primary-on-fill on primary-fill, and pressed at 80% ................... core primary-on-fill, primary-on-fill-pressed-* (contract state)
//   neutral: text-body on surface-raised, and pressed (the wash laid on the tile) ... core body-raised; controls float-glyph-press (the same paint)
//   needs-you: needs-you-on-fill on needs-you-fill (no pressed fill: at 80% over graphite the ink would fall under 75)
//                                                                                     core needs-you-on-fill
//   a tile against the row's ground ................................................. core primary-fill-ground (Figma value), needs-you-fill-ground
// FilterChip
//   off: text-label on the ground, under the hover and pressed washes ............... core label-ground, label-ground-hover, label-ground-pressed
//   on, pressed (the ink at 80%) ...................................................... controls float-current-press (the same paint)
// SectionHeader: overline and count (text-label); the collapsible title's washes .... core label-ground, label-ground-hover, label-ground-pressed
// LogRow: time (text-label), words (text-body); a linked line's washes ................ core label-ground, body-ground, *-ground-hover, *-ground-pressed
// DiffBlock
//   context lines (text-body) on surface-raised ...................................... core body-raised
//   added and removed lines, and their marks ......................................... core body-diff-added, body-diff-removed (stone: contract role, Figma value)
//   the removed line's minus in critical-text on diff-removed (critical-soft) ........ core critical-text-soft (graphite: Figma value)
//   line numbers, hunk headings, +n −n (text-label) on surface-raised ............... core label-raised (graphite: Figma value)
// FileChip
//   name (text-body) and size (text-label) on surface-raised, and their washes ....... core body-raised, label-raised, *-raised-hover, *-raised-pressed
//   type tag: primary-on-fill on primary-fill; critical-on-fill on critical-fill ..... core primary-on-fill, critical-on-fill
//   the critical reason (critical-text) on surface-raised ............................ core critical-text-raised (Figma value)
//   the 2px critical edge on surface-raised ........................................... core field-error-raised (Figma value)
// Table: head (text-label), cells (text-body), selected rows on primary-soft ......... core label-ground, body-ground, body-soft, label-soft
// Highlight
//   body, secondary and label ink on primary-soft .................................... core body-soft, secondary-soft, label-soft
//   the 2px primary edge under a match on a selected row ............................. core primary-edge-soft (Figma value)

export default ({ r, mix }) => [
  // FilterChip on: inverted ink. The label is the ground's colour on the ink.
  { id: "filter-chip-on", source: "FilterChip active: bg-foreground text-background", kind: "on-fill", paint: r("background"), over: [r("surface-ground"), r("foreground")] },
  { id: "filter-chip-on-hover", source: "FilterChip active: hover:bg-[color-mix(foreground 90%, background)]", kind: "on-fill", paint: r("background"), over: [r("surface-ground"), mix("foreground", "background", 0.1)] },
  // How the on chip stands against the page beside the off ones.
  { id: "filter-chip-on-page", source: "FilterChip active: the ink fill against the ground", kind: "solid", paint: r("foreground"), over: [r("surface-ground")] },
  { id: "filter-chip-on-raised", source: "FilterChip active: the ink fill against a raised surface (a sheet, a panel)", kind: "solid", paint: r("foreground"), over: [r("surface-raised")] },

  // ListRow message: the 6px unread square in ink, its bottom on the baseline.
  { id: "unread-ground", source: "ListRow unread: bg-foreground square on the ground", kind: "solid", paint: r("text-body"), over: [r("surface-ground")] },
  { id: "unread-soft", source: "ListRow unread on a selected row: bg-foreground square on bg-primary-soft", kind: "solid", paint: r("text-body"), over: [r("primary-soft")] },
  { id: "unread-hover", source: "ListRow unread under the pointer: bg-foreground on the ground under bg-state-hover", kind: "solid", paint: r("text-body"), over: [r("surface-ground"), r("state-hover")] },

  // SwipeAction neutral: the label against the tile, and the tile's hairline is decoration only.
  { id: "swipe-neutral-label", source: "SwipeAction neutral: text-foreground on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: [r("surface-raised")] },
]

export const exceptions = []
