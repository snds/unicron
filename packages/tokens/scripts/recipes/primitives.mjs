// Contrast recipes for the primitives area (packages/ui/src/components: text-field, input, textarea,
// input-group, field, label, select, native-select, tabs, toggle, toggle-group, toolbar,
// split-button, item, avatar, initial-tile, empty, chip, chip-field, radio-group, progress,
// spinner, scroll-area, resizable-panes). One pair per row as the component paints it: the paint,
// the stack it sits on (bottom first), and what it is for. The kind follows the ink
// (scripts/recipes/README.md).
//
// A pair another file already measures is not measured twice; the line names where it is. Several
// of those miss their floor and are reported there, for Sean, as Figma values:
//   - a field's placeholder, a label-ink heading in the Select list, label-ink text on any raised
//     box: core `label-raised`
//   - a field's 2px focus and error borders: core `field-focus-*`, `field-error-*`
//   - a field's resting hairline: core `field-rest-*` (reported, contract 9.4)
//   - a highlighted Select item (bg-accent): core `body-accent`, `label-accent`
//   - a hover or pressed wash on the ground, a raised surface or a selected row (a tab, a toggle,
//     a row, a radio row, a select trigger): core `*-hover`, `*-pressed`, `body-soft-hover`
//   - a selected row's soft fill and 2px edge (Item): core `body-soft`, `label-soft`,
//     `primary-edge-soft`
//   - the Top Tab indicator, 2px of primary-fill on the ground: core `primary-fill-ground`
//   - inverted ink (a pressed Toggle, the chosen segment of Tabs): controls `float-current*`
//   - a critical Chip (ink on critical-soft inside a critical edge): controls `badge-critical*`
//   - ghost and primary Buttons inside a field, a toolbar or a SplitButton: controls `btn-*`
//   - a progress cell in the live, primary or critical fill: controls `progress-*`

const r = (role, alpha) => ({ role, alpha })

const GROUND = [r("surface-ground")]
const RAISED = [r("surface-raised")]
const SURFACES = [
  ["ground", "surface-ground"],
  ["raised", "surface-raised"],
]

export const recipes = [
  // ── Text Field, and every field in its box (Input, Textarea, InputGroup, Select, NativeSelect, ChipField)
  { id: "field-label", source: "text-field, label (field), field-legend: type-overline text-muted-foreground on the ground", kind: "text-label", paint: r("muted-foreground"), over: GROUND },
  { id: "field-label-critical", source: "text-field invalid: the label in text-critical-text on the ground", kind: "text-label", paint: r("critical-text"), over: GROUND },
  { id: "field-value", source: "the field box: the value, type-ui text-foreground on bg-surface-raised", kind: "text-body", paint: r("foreground"), over: RAISED },
  { id: "field-value-readonly", source: "a read-only field: the value on no fill (the ground), the rule kept", kind: "text-body", paint: r("foreground"), over: GROUND },
  { id: "field-slot-icon", source: "text-field leading and trailing icons, input-group add-ons, the select chevron: text-support-foreground on bg-surface-raised", kind: "text-secondary", paint: r("support-foreground"), over: RAISED },
  { id: "field-helper", source: "text-field helper, field-description, the disabled reason: type-caption text-support-foreground on the ground", kind: "text-secondary", paint: r("support-foreground"), over: GROUND },
  { id: "field-error-text", source: "text-field error, field-error, an invalid field's helper: type-caption text-critical-text on the ground", kind: "text-label", paint: r("critical-text"), over: GROUND },
  { id: "select-check", source: "select item chosen: the checkmark, text-foreground on bg-popover (surface-raised)", kind: "text-body", paint: r("foreground"), over: RAISED },
  { id: "list-edge", source: "select list: rule-box (line-rule) against the page under it (decorative: the list is a solid raised surface)", kind: "border-decorative", paint: r("line-rule"), over: GROUND },

  // ── Tabs, Toggle, ToggleGroup, Toolbar
  { id: "tab-label", source: "tabs trigger at rest: type-overline text-muted-foreground on the ground", kind: "text-label", paint: r("muted-foreground"), over: GROUND },
  { id: "tab-label-active", source: "tabs trigger chosen or under the pointer (line): text-foreground on the ground", kind: "text-body", paint: r("foreground"), over: GROUND },
  { id: "tab-index", source: "tabs trigger index: text-faint-foreground on the ground (Figma's Top Tab index)", kind: "text-faint", paint: r("faint-foreground"), over: GROUND },
  { id: "segment-active", source: "tabs default, the chosen segment; a pressed toggle: bg-foreground text-background (as controls float-current)", kind: "on-fill", paint: r("background"), over: [r("foreground")] },
  { id: "segment-edge", source: "tabs default list, toggle outline, joined toggle group: rule-box (line-rule) on the ground (the labels show the control)", kind: "border-rest", paint: r("line-rule"), over: GROUND },
  { id: "toolbar-separator", source: "toolbar separator: bg-line-rule between groups", kind: "border-decorative", paint: r("line-rule"), over: GROUND },

  // ── Item (the generic row), Chip, ChipField
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `row-title-${on}`, source: `item title: type-ui text-foreground on ${bg}`, kind: "text-body", paint: r("foreground"), over: [r(bg)] },
    { id: `row-description-${on}`, source: `item description: type-caption text-support-foreground on ${bg}`, kind: "text-secondary", paint: r("support-foreground"), over: [r(bg)] },
    { id: `chip-value-${on}`, source: `chip: type-caption text-foreground on ${bg} (outline on the ground, muted and secondary raised; a chip-field's chips sit on its raised box)`, kind: "text-body", paint: r("foreground"), over: [r(bg)] },
    { id: `chip-remove-${on}`, source: `chip remove: the close glyph in text-support-foreground on ${bg}`, kind: "text-secondary", paint: r("support-foreground"), over: [r(bg)] },
  ]),

  // ── RadioGroup, RadioRow
  { id: "radio-edge-raised", source: "radio at rest: the 1px edge, --c-radio-edge (label ink), on its bg-surface-raised box", kind: "control-edge", paint: r("c-radio-edge"), over: RAISED },
  { id: "radio-edge-ground", source: "radio at rest: the 1px edge against the ground around it", kind: "control-edge", paint: r("c-radio-edge"), over: GROUND },
  { id: "radio-mark", source: "radio chosen: the 8px square, --c-radio-mark (ink), on its bg-surface-raised box", kind: "solid", paint: r("c-radio-mark"), over: RAISED },
  { id: "radio-row-label", source: "radio row: the label, type-ui text-foreground on the ground", kind: "text-body", paint: r("foreground"), over: GROUND },
  { id: "radio-row-description", source: "radio row: the sentence, type-caption text-support-foreground on the ground", kind: "text-secondary", paint: r("support-foreground"), over: GROUND },

  // ── Empty, EmptyState
  { id: "empty-overline", source: "empty overline: type-overline text-muted-foreground on the ground", kind: "text-label", paint: r("muted-foreground"), over: GROUND },
  { id: "empty-overline-critical", source: "empty state tone=critical: the overline and its warning icon in text-critical-text", kind: "text-label", paint: r("critical-text"), over: GROUND },
  { id: "empty-title", source: "empty title: type-title text-foreground on the ground", kind: "text-body", paint: r("foreground"), over: GROUND },
  { id: "empty-body", source: "empty description: type-body text-support-foreground on the ground", kind: "text-secondary", paint: r("support-foreground"), over: GROUND },

  // ── InitialTile, Avatar
  { id: "tile-initials", source: "initial tile, avatar fallback: the initials, text-foreground on bg-surface-raised", kind: "text-body", paint: r("foreground"), over: RAISED },
  // The badge on an avatar: a square mark with a 2px ground ring, so the ground is what it is seen against.
  { id: "avatar-badge", source: "avatar badge (neutral): bg-text-body inside ring-background, as the unread mark", kind: "solid", paint: r("text-body"), over: GROUND },
  { id: "avatar-badge-live", source: "avatar badge tone=live: bg-secondary-live inside ring-background (presence)", kind: "solid", paint: r("secondary-live"), over: GROUND },
  { id: "avatar-badge-glyph", source: "avatar badge (neutral) holding a glyph: text-surface-ground on bg-text-body", kind: "solid", paint: r("surface-ground"), over: [r("text-body")] },
  { id: "avatar-badge-live-glyph", source: "avatar badge tone=live holding a glyph: text-surface-ground on bg-secondary-live", kind: "solid", paint: r("surface-ground"), over: [r("secondary-live")] },

  // ── Progress: the tones added in round 2, and the tick
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `progress-neutral-${on}`, source: `progress tone=neutral: a lit cell, --c-progress-neutral (ink), against the page (${bg})`, kind: "solid", paint: r("c-progress-neutral"), over: [r(bg)] },
    { id: `progress-warning-${on}`, source: `progress tone=warning: a lit cell, --c-progress-warning, against the page (${bg})`, kind: "solid", paint: r("c-progress-warning"), over: [r(bg)] },
    { id: `progress-tick-${on}`, source: `progress tick: 2px of --c-progress-tick (ink) across the bar, against the page (${bg})`, kind: "solid", paint: r("c-progress-tick"), over: [r(bg)] },
  ]),
  { id: "progress-neutral-track", source: "progress tone=neutral: a lit cell beside an empty one (--c-progress-track)", kind: "solid", paint: r("c-progress-neutral"), over: [r("c-progress-track")] },
  { id: "progress-warning-track", source: "progress tone=warning: a lit cell beside an empty one (--c-progress-track)", kind: "solid", paint: r("c-progress-warning"), over: [r("c-progress-track")] },

  // ── ScrollArea, ResizablePanes
  ...SURFACES.map(([on, bg]) => ({
    id: `scroll-thumb-${on}`, source: `scroll area thumb: --c-scroll-area-thumb (label ink), square, on ${bg}`, kind: "solid", paint: r("c-scroll-area-thumb"), over: [r(bg)],
  })),
  { id: "handle-rest", source: "resizable handle at rest: the 1px bg-line-rule between panes", kind: "border-decorative", paint: r("line-rule"), over: GROUND },
  { id: "handle-active", source: "resizable handle under the pointer, dragged or focused: --c-resizable-active (ink)", kind: "solid", paint: r("c-resizable-active"), over: GROUND },
  { id: "handle-grip", source: "resizable handle grip: 4 × 24 of --c-resizable-grip (label ink) on the page", kind: "solid", paint: r("c-resizable-grip"), over: GROUND },
]

export default recipes

export const exceptions = []
