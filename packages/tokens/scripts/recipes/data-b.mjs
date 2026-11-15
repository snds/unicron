// Contrast recipes for the data-b rows and blocks: FieldRow, ToggleRow, Metric, NeedsYou, Banner,
// CalendarEvent, MetaList, Steps, Tile (packages/ui/src/components/ui).
//
// This file measures the pairs these parts paint that no other table measures yet. A pair the
// core table (scripts/contrast.mjs) or recipes/controls.mjs already measures is not measured
// twice; the list below says which recipe covers each of those paints, so every paint here is
// gated or reported somewhere.
//
//   FieldRow     label: label-ground, label-raised · value, action: body-ground, body-raised ·
//                description, reason: secondary-ground, secondary-raised · rule: rule-ground,
//                rule-raised · the action's washes: body-*-hover, body-*-pressed · the display
//                action's live ink: live-ground, live-raised (its washes: below)
//   ToggleRow    label: body-* and body-*-hover, body-*-pressed · description, reason:
//                secondary-* and secondary-*-hover, -pressed · the Switch: controls:switch-*
//   Metric       label, neutral delta: label-ground (+ -hover, -pressed as a link) · value, up and
//                down: body-ground (+ washes) · live delta: live-ground (washes below) · hero in
//                primary/display: primary-display-ground (washes below) · unit: label-ground ·
//                the 2px ink rule: below
//   NeedsYou     title and body: needs-you-on-fill · its buttons: controls:btn-ny*
//   Banner       critical: body-critical-soft, secondary-critical-soft, critical-text-soft, the
//                edge critical-fill-ground (2.9:1 on graphite, reported as the field's) · info,
//                warning, success: body-raised, secondary-raised, rule-ground, warning-on-raised
//                · its buttons: controls:btn-* (their washes over critical-soft: below)
//   CalendarEvent primary: label-soft, body-soft, secondary-soft, primary-edge-soft and their
//                -hover (pressed: below) · neutral: label-raised, body-raised, secondary-raised,
//                rule-raised and their -hover, -pressed
//   MetaList     label-ground, label-raised · body-ground, body-raised
//   Steps        title, current index: body-ground (+ washes) · index, detail, status:
//                label-ground (+ washes) · content: secondary-ground (+ washes) · live and failed
//                status: live-ground, critical-text-ground (washes below)
//   Tile         ink: body-raised · edge and selected box: primary-fill-raised,
//                primary-fill-ground · hover: body-accent · pressed: controls:float-glyph-press
//                (the same 10% ink mix in the raised surface)
//
// `exceptions` lists the new pairs under their floor. Each is a contract state (§6.1: the hover
// or pressed wash) laid over a Figma value that has no room for it; none is a paint chosen here.

const r = (role, alpha) => ({ role, alpha })

const WASHES = [["hover", r("state-hover")], ["pressed", r("state-pressed")]]

export const recipes = [
  // ── New pairs at rest ───────────────────────────────────────────────────────────────────────
  { id: "ink-rule-ground", source: "Metric: the 2px text-body rule on top (an inset shadow) groups metrics without boxes", kind: "solid", paint: r("text-body"), over: [r("surface-ground")] },
  { id: "success-glyph-raised", source: "Banner success: the checkmark--outline glyph in text-success-foreground on bg-surface-raised", kind: "text-label", paint: r("success-foreground"), over: [r("surface-ground"), r("surface-raised")] },

  // ── Coloured ink under the contract's washes ────────────────────────────────────────────────
  ...WASHES.flatMap(([state, wash]) => [
    // The live ink: the display row's action (a ghost Button's own wash), a live Metric delta in
    // a metric that is a link, a live Step status in a step that opens.
    { id: `live-ground-${state}`, source: `FieldRowAction (display), Metric tone=live as a link, Step live: text-secondary-live under the ${state} wash (bg-state-${state})`, kind: "text-label", paint: r("secondary-live"), over: [r("surface-ground"), wash] },
    { id: `live-raised-${state}`, source: `FieldRowAction (display) in a dialog: text-secondary-live under the ${state} wash on bg-surface-raised`, kind: "text-label", paint: r("secondary-live"), over: [r("surface-raised"), wash] },
    // A failed step's status in a step that opens.
    { id: `critical-text-ground-${state}`, source: `Step status=failed, pressable: text-destructive under the ${state} wash`, kind: "text-label", paint: r("critical-text"), over: [r("surface-ground"), wash] },
    // The hero number of a metric that is a link.
    { id: `primary-display-ground-${state}`, source: `Metric size=hero valueTone=primary as a link: text-primary-display under the ${state} wash`, kind: "text-display", paint: r("primary-display"), over: [r("surface-ground"), wash] },
    // The label of a Button (secondary, ghost) in a critical Banner, under that button's wash.
    { id: `body-critical-soft-${state}`, source: `Banner critical: its action or close Button (text-foreground) under the button's ${state} wash on bg-critical-soft`, kind: "text-body", paint: r("foreground"), over: [r("surface-ground"), r("critical-soft"), wash] },
  ]),
  // A primary (or selected) CalendarEvent pressed: the pressed wash laid over primary-soft. The
  // core table measures the hover wash on primary-soft (body-soft-hover and the rest), not this.
  { id: "body-soft-pressed", source: "CalendarEvent primary or selected: title text-foreground under active:after:bg-state-pressed on bg-primary-soft", kind: "text-body", paint: r("foreground"), over: [r("surface-ground"), r("primary-soft"), r("state-pressed")] },
  { id: "secondary-soft-pressed", source: "CalendarEvent primary or selected: place text-support-foreground under the pressed wash on bg-primary-soft", kind: "text-secondary", paint: r("support-foreground"), over: [r("surface-ground"), r("primary-soft"), r("state-pressed")] },
  { id: "label-soft-pressed", source: "CalendarEvent primary or selected: time text-muted-foreground under the pressed wash on bg-primary-soft", kind: "text-label", paint: r("muted-foreground"), over: [r("surface-ground"), r("primary-soft"), r("state-pressed")] },
]

// The list has to match the misses exactly (`node scripts/contrast.mjs --print-exceptions` prints
// them). Each belongs in the docs summary row "text on a hover or pressed wash" (SUMMARY in
// contrast.mjs), with the core's own washes.
const ON_STATE = "contract state (§6.1: the hover or pressed wash) over a Figma value with no room for it; flagged for Sean"

export const exceptions = [
  { id: "live-ground-hover", modes: ["graphite", "warpcore / stone", "synapse / stone"], reason: ON_STATE },
  { id: "live-ground-pressed", modes: "all", reason: ON_STATE },
  { id: "live-raised-hover", modes: "graphite", reason: ON_STATE },
  { id: "live-raised-pressed", modes: ["graphite", "warpcore / stone", "synapse / stone"], reason: ON_STATE },
  { id: "critical-text-ground-hover", modes: "graphite", reason: ON_STATE },
  { id: "critical-text-ground-pressed", modes: "all", reason: ON_STATE },
  { id: "primary-display-ground-hover", modes: "graphite", reason: ON_STATE },
  { id: "primary-display-ground-pressed", modes: "graphite", reason: ON_STATE },
  { id: "body-critical-soft-hover", modes: "stone", reason: ON_STATE },
  { id: "body-critical-soft-pressed", modes: "all", reason: ON_STATE },
  { id: "body-soft-pressed", modes: ["stone", "lockdown / graphite"], reason: ON_STATE },
  { id: "secondary-soft-pressed", modes: "all", reason: ON_STATE },
  { id: "label-soft-pressed", modes: "all", reason: ON_STATE },
]
