// Contrast recipes for the overlays: Dialog, Sheet, Popover, DropdownMenu, Tooltip, Command,
// Toaster, TruncatedText, the adaptive layers and ConfirmDialog (packages/ui/src/components/ui).
// One pair per row as the component paints it: the paint, the stack it sits on (bottom first),
// and what it is for. Every overlay is the raised surface (Figma draws its dialogs, sheets and
// the quick-create menu so), so most text sits on `surface-raised`; a highlighted row sits on the
// opaque highlight fill (`accent`), a picked sheet row on `primary-soft`. The kind follows the ink
// (scripts/recipes/README.md).
//
// Pairs the core table already measures are not measured twice (tokens hand-off, decision 8). The
// overlays paint these too, and each misses its floor in some modes as a Figma value or a contract
// state over one, so the core reports it, not this file:
//
//   label ink on the raised surface (an overline, a group heading, the palette's placeholder and
//     search glyph, a menu row's count) ......................... core `label-raised`
//   critical ink on the raised surface (a destructive row, a failed yes, an error toast's glyph)
//                                                                 core `critical-text-raised`
//   body ink on the highlight fill (a highlighted row) .......... core `body-accent`
//   critical ink on the highlight fill (a highlighted destructive row)  core `critical-text-accent`
//   body ink on primary-soft (a picked row in a phone menu sheet)  core `body-soft`
//   the field's 2px primary-fill focus border on the raised surface (the palette's search field)
//                                                                 core `field-focus-raised`
//
// What is left here passes in all 8 modes, or is reported (edges, fills, the grabber).

const r = (role, alpha) => ({ role, alpha })

const RAISED = [r("surface-raised")]
// The page under a layer's scrim, which the layer's edge is seen against. The scrim's strength is
// its knob, read per ground: 0.6 and 0.5 on graphite, the role's own 64% on stone (knob 1).
const DIALOG_SCRIM = [r("surface-ground"), r("surface-scrim", "c-scrim-dialog")]
const SHEET_SCRIM = [r("surface-ground"), r("surface-scrim", "c-scrim-sheet")]

export const recipes = [
  // ── The layer itself ────────────────────────────────────────────────────────────────────────
  { id: "layer-title", source: "DialogTitle, SheetTitle, PopoverTitle: text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "layer-description", source: "DialogDescription, SheetDescription, PopoverDescription, a toast's description: text-text-secondary on the raised surface", kind: "text-secondary", paint: r("text-secondary"), over: RAISED },
  { id: "layer-edge-dialog", source: "dialog-rule: rule-box (line-rule) against the page under the dialog scrim (decorative: the fill tells the layer apart)", kind: "border-decorative", paint: r("line-rule"), over: DIALOG_SCRIM },
  { id: "layer-edge-sheet", source: "sheet: rule-t (line-rule) against the page under the sheet scrim (decorative)", kind: "border-decorative", paint: r("line-rule"), over: SHEET_SCRIM },
  { id: "layer-fill-dialog", source: "bg-surface-raised against the page under the dialog scrim: how far a layer stands off what it covers", kind: "surface", paint: r("surface-raised"), over: DIALOG_SCRIM },
  { id: "layer-fill-sheet", source: "bg-surface-raised against the page under the sheet scrim", kind: "surface", paint: r("surface-raised"), over: SHEET_SCRIM },
  { id: "sheet-grabber", source: "sheet-grabber: bg-(--c-sheet-handle) = line-grid-dot on the raised surface (decorative: the close button and Escape close it)", kind: "border-decorative", paint: r("c-sheet-handle"), over: RAISED },

  // ── Menu and palette rows ───────────────────────────────────────────────────────────────────
  { id: "row", source: "CommandItem: text-text-body (words and 20px glyph) on the raised surface", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "row-nav", source: "DropdownMenuItem, AdaptiveMenuItem at rest, as Figma's Nav Item rows: type-label text-text-secondary (words, 20px glyph, the submenu chevron) on the raised surface. Highlighted, checked or current they are body ink (core body-accent, body-raised, body-soft)", kind: "text-secondary", paint: r("text-secondary"), over: RAISED },
  { id: "row-separator", source: "DropdownMenuSeparator, CommandSeparator, AdaptiveMenuSeparator: bg-line-rule (decorative)", kind: "border-decorative", paint: r("line-rule"), over: RAISED },

  // ── Tooltip: inverted ink ───────────────────────────────────────────────────────────────────
  { id: "tooltip", source: "TooltipContent, TruncatedText's full text: bg-text-body text-surface-ground", kind: "text-body", paint: r("surface-ground"), over: [r("text-body")] },

  // ── Toast ───────────────────────────────────────────────────────────────────────────────────
  { id: "toast-title", source: "a toast's title: type-ui-emphasis text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "toast-edge", source: "a toast: rule-box (line-rule) against the page (decorative)", kind: "border-decorative", paint: r("line-rule"), over: [r("surface-ground")] },
  { id: "toast-focus", source: "a focused toast (each is a tab stop): the stylesheet's :focus-visible outline in --ring, 2px clear of the toast, against the page it floats over", kind: "focus", paint: r("ring"), over: [r("surface-ground")] },
  { id: "toast-focus-raised", source: "a focused toast's outline beside the next toast in the column (bg-surface-raised)", kind: "focus", paint: r("ring"), over: RAISED },
]
