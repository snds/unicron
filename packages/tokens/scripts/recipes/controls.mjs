// Contrast recipes for the leaf controls: Button, FloatButton, Switch, Checkbox, Badge, Kbd,
// Skeleton, Progress (packages/ui/src/components/ui). One pair per row as the component paints
// it: the paint, the stack it sits on (bottom first), and what it is for. The kind follows the
// ink (scripts/recipes/README.md): body ink is `text-body`, label ink and any coloured ink is
// `text-label`, text on a solid fill is `on-fill`, a mark or a bar is `solid`.
//
// `exceptions` lists the pairs that sit under their floor, each with why. They are of two sorts:
// a pair Figma draws (a progress cell in primary-fill or critical-fill on graphite, body ink on
// the soft critical ground on stone), and a contract state (§6: a hover or pressed wash, a solid
// at 80%) laid over a Figma value that has no room for it.

const r = (role, alpha) => ({ role, alpha })
const mix = (a, b, k) => ({ mix: [a, b], k })

const NEEDS_YOU = [r("needs-you-fill")]
// The two surfaces a control sits on: the page, and a raised surface.
const SURFACES = [["page", "surface-ground"], ["raised", "surface-raised"]]

export const recipes = [
  // ── Button ──────────────────────────────────────────────────────────────────────────────────
  // Solid kinds: the label on the fill at rest, at 90% (hover) and at 80% (pressed).
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `btn-primary-${on}`, source: "button default: bg-primary text-primary-foreground", kind: "on-fill", paint: r("primary-foreground"), over: [r(bg), r("primary")] },
    { id: `btn-primary-hover-${on}`, source: "button default: hover:bg-primary/90", kind: "on-fill", paint: r("primary-foreground"), over: [r(bg), r("primary", 0.9)] },
    { id: `btn-primary-press-${on}`, source: "button default: active:bg-primary/80", kind: "on-fill", paint: r("primary-foreground"), over: [r(bg), r("primary", 0.8)] },
    { id: `btn-critical-${on}`, source: "button destructive: bg-critical-fill text-critical-on-fill; ghost-destructive under the pointer", kind: "on-fill", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill")] },
    { id: `btn-critical-hover-${on}`, source: "button destructive: hover:bg-critical-fill/90", kind: "on-fill", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill", 0.9)] },
    { id: `btn-critical-press-${on}`, source: "button destructive, ghost-destructive: active:bg-critical-fill/80", kind: "on-fill", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill", 0.8)] },
  ]),
  // Transparent kinds (secondary, outline, ghost): the ink label, and the same label under each wash.
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `btn-ink-${on}`, source: "button secondary, outline, ghost: text-foreground", kind: "text-body", paint: r("foreground"), over: [r(bg)] },
    { id: `btn-ink-hover-${on}`, source: "button secondary, outline, ghost, ghost-muted: hover:bg-state-hover", kind: "text-body", paint: r("foreground"), over: [r(bg), r("state-hover")] },
    { id: `btn-ink-press-${on}`, source: "button secondary, outline, ghost, ghost-muted: active:bg-state-pressed", kind: "text-body", paint: r("foreground"), over: [r(bg), r("state-pressed")] },
    { id: `btn-edge-${on}`, source: "button secondary, outline: inset-ring-foreground, the 1px ink edge", kind: "border-rest", paint: r("foreground"), over: [r(bg)] },
  ]),
  { id: "btn-muted", source: "button ghost-muted at rest: text-muted-foreground", kind: "text-label", paint: r("muted-foreground"), over: [r("surface-ground")] },
  { id: "btn-ghost-critical", source: "button ghost-destructive at rest: text-destructive", kind: "text-label", paint: r("destructive"), over: [r("surface-ground")] },
  { id: "btn-link", source: "button link: text-primary-text", kind: "text-label", paint: r("primary-text"), over: [r("surface-ground")] },
  // The three kinds on the needs-you yellow.
  { id: "btn-ny", source: "button needs-you: bg-needs-you-on-fill text-needs-you-fill", kind: "on-fill", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill")] },
  { id: "btn-ny-hover", source: "button needs-you: hover:bg-needs-you-on-fill/90", kind: "on-fill", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.9)] },
  { id: "btn-ny-press", source: "button needs-you: active:bg-needs-you-on-fill/80", kind: "on-fill", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.8)] },
  { id: "btn-ny-ink", source: "button needs-you-outline, needs-you-text: text-needs-you-on-fill", kind: "on-fill", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  { id: "btn-ny-ink-hover", source: "button needs-you-outline, needs-you-text: hover:bg-needs-you-on-fill/5", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.05)] },
  { id: "btn-ny-ink-press", source: "button needs-you-outline, needs-you-text: active:bg-needs-you-on-fill/9", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.09)] },
  { id: "btn-ny-edge", source: "button needs-you-outline: inset-ring-needs-you-on-fill, the 1px edge", kind: "border-rest", paint: r("needs-you-on-fill"), over: NEEDS_YOU },

  // ── Shared by the controls ──────────────────────────────────────────────────────────────────
  // An invalid control's 2px inside edge: the critical fill, the same edge an invalid field has.
  ...SURFACES.map(([on, bg]) => ({
    id: `ctl-invalid-${on}`, source: "button, switch, checkbox: aria-invalid:inset-ring-2 inset-ring-critical-fill", kind: "border-error", paint: r("critical-fill"), over: [r(bg)],
  })),
  // Focus: the stylesheet's ring (2px solid --ring, 2px clear of the control), so it is judged
  // against what is around the control. On the yellow, `on-needs-you` points --ring at its ink.
  ...SURFACES.map(([on, bg]) => ({
    id: `ctl-focus-${on}`, source: "button, float button, switch, checkbox, badge: :focus-visible outline in --ring", kind: "focus", paint: r("ring"), over: [r(bg)],
  })),
  { id: "ctl-focus-needs-you", source: "button needs-you kinds, badge needs-you: on-needs-you (--ring = needs-you-on-fill)", kind: "focus", paint: r("needs-you-on-fill"), over: NEEDS_YOU },

  // ── FloatButton: every fill is opaque, because it floats over content ───────────────────────
  { id: "float-glyph", source: "float button neutral: bg-surface-raised text-foreground", kind: "text-body", paint: r("foreground"), over: [r("surface-raised")] },
  { id: "float-glyph-hover", source: "float button neutral: hover:bg-accent", kind: "text-body", paint: r("foreground"), over: [r("accent")] },
  { id: "float-glyph-press", source: "float button neutral: active:bg-[color-mix(text-body 10%, surface-raised)], the pressed wash laid on the button", kind: "text-body", paint: r("foreground"), over: [mix("surface-raised", "text-body", 0.1)] },
  { id: "float-edge", source: "float button neutral: rule-box on the page (resting hairline)", kind: "border-rest", paint: r("line-rule"), over: [r("surface-ground")] },
  { id: "float-primary", source: "float button primary: bg-primary text-primary-foreground", kind: "on-fill", paint: r("primary-foreground"), over: [r("primary")] },
  { id: "float-primary-hover", source: "float button primary: hover:bg-[color-mix(primary 90%, background)]", kind: "on-fill", paint: r("primary-foreground"), over: [mix("primary", "background", 0.1)] },
  { id: "float-primary-press", source: "float button primary: active:bg-[color-mix(primary 80%, background)]", kind: "on-fill", paint: r("primary-foreground"), over: [mix("primary", "background", 0.2)] },
  { id: "float-current", source: "float button current or pressed: bg-foreground text-background", kind: "on-fill", paint: r("background"), over: [r("foreground")] },
  { id: "float-current-hover", source: "float button current: hover:bg-[color-mix(foreground 90%, background)]", kind: "on-fill", paint: r("background"), over: [mix("foreground", "background", 0.1)] },
  { id: "float-current-press", source: "float button current: active:bg-[color-mix(foreground 80%, background)]", kind: "on-fill", paint: r("background"), over: [mix("foreground", "background", 0.2)] },
  { id: "float-current-page", source: "float button current: the inverted fill against the page", kind: "solid", paint: r("foreground"), over: [r("surface-ground")] },

  // ── Switch: the knob is the state mark, a solid on its track ────────────────────────────────
  { id: "switch-on-knob", source: "switch on: bg-primary-foreground knob on bg-primary", kind: "solid", paint: r("primary-foreground"), over: [r("surface-ground"), r("primary")] },
  { id: "switch-on-knob-hover", source: "switch on: data-checked:hover:bg-primary/90", kind: "solid", paint: r("primary-foreground"), over: [r("surface-ground"), r("primary", 0.9)] },
  { id: "switch-on-knob-press", source: "switch on: data-checked:active:bg-primary/80", kind: "solid", paint: r("primary-foreground"), over: [r("surface-ground"), r("primary", 0.8)] },
  { id: "switch-off-knob", source: "switch off: bg-muted-foreground knob on bg-surface-raised", kind: "solid", paint: r("muted-foreground"), over: [r("surface-raised")] },
  { id: "switch-off-knob-hover", source: "switch off: data-unchecked:hover:bg-accent", kind: "solid", paint: r("muted-foreground"), over: [r("accent")] },
  { id: "switch-off-edge", source: "switch off: data-unchecked:rule-box on the page (resting hairline)", kind: "border-rest", paint: r("line-rule"), over: [r("surface-ground")] },
  { id: "switch-off-track", source: "switch off: bg-surface-raised against the page", kind: "surface", paint: r("surface-raised"), over: [r("surface-ground")] },

  // ── Checkbox ────────────────────────────────────────────────────────────────────────────────
  { id: "checkbox-mark", source: "checkbox checked, indeterminate: text-background mark on bg-foreground", kind: "on-fill", paint: r("background"), over: [r("foreground")] },
  ...SURFACES.map(([on, bg]) => ({
    id: `checkbox-fill-${on}`, source: "checkbox checked: data-checked:bg-foreground against what it sits on", kind: "solid", paint: r("foreground"), over: [r(bg)],
  })),
  // Unchecked, the edge is the only thing that shows the box (its raised fill barely moves off the
  // ground), so it is held to 3:1 against what is around it, on both surfaces a form sits on.
  ...SURFACES.map(([on, bg]) => ({
    id: `checkbox-edge-${on}`, source: "checkbox unchecked: data-unchecked:rule-box in --c-checkbox-edge (the label ink), the box's only edge", kind: "control-edge", paint: r("c-checkbox-edge"), over: [r(bg)],
  })),

  // ── Badge: a mono caps word; the tone backs it up ───────────────────────────────────────────
  { id: "badge-neutral", source: "badge neutral: rule-box text-muted-foreground", kind: "text-label", paint: r("muted-foreground"), over: [r("surface-ground")] },
  { id: "badge-live", source: "badge live: rule-box text-secondary-live", kind: "text-label", paint: r("secondary-live"), over: [r("surface-ground")] },
  { id: "badge-needs-you", source: "badge needs-you: bg-needs-you-fill text-needs-you-on-fill", kind: "on-fill", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  // Both soft grounds are opaque, so what the badge sits on does not change the pair.
  { id: "badge-critical", source: "badge critical: bg-critical-soft text-foreground (the critical Banner's pair)", kind: "text-body", paint: r("foreground"), over: [r("critical-soft")] },
  { id: "badge-success", source: "badge success: bg-success-surface text-success-foreground", kind: "text-label", paint: r("success-foreground"), over: [r("success-surface")] },
  ...SURFACES.map(([on, bg]) => ({
    id: `badge-warning-${on}`, source: "badge warning: text-foreground inside inset-ring-warning, on no ground of its own", kind: "text-body", paint: r("foreground"), over: [r(bg)],
  })),
  { id: "badge-edge", source: "badge neutral, live: rule-box on the page (decorative: the word carries it)", kind: "border-decorative", paint: r("line-rule"), over: [r("surface-ground")] },
  { id: "badge-critical-edge", source: "badge critical: inset-ring-critical-fill on bg-critical-soft (decorative)", kind: "border-decorative", paint: r("critical-fill"), over: [r("critical-soft")] },
  { id: "badge-warning-edge", source: "badge warning: inset-ring-warning on the page (decorative)", kind: "border-decorative", paint: r("warning"), over: [r("surface-ground")] },

  // ── Kbd, Skeleton ───────────────────────────────────────────────────────────────────────────
  { id: "kbd", source: "kbd: bg-surface-raised text-support-foreground", kind: "text-secondary", paint: r("support-foreground"), over: [r("surface-raised")] },
  { id: "kbd-edge", source: "kbd: rule-box (decorative)", kind: "border-decorative", paint: r("line-rule"), over: [r("surface-raised")] },
  { id: "skeleton-bar", source: "skeleton: bg-surface-raised bars on the page (a placeholder, not content)", kind: "surface", paint: r("surface-raised"), over: [r("surface-ground")] },

  // ── Progress: the filled part against the empty part (--c-progress-track), and against the page ──
  { id: "progress-track", source: "progress: --c-progress-track, the empty part of a bar or an empty cell, on the page", kind: "border-decorative", paint: r("c-progress-track"), over: [r("surface-ground")] },
  ...[["live", "segmented by default, tone=live"], ["primary", "tone=primary, and a budget under its warning mark"], ["critical", "tone=critical"]].flatMap(([knob, where]) => [
    { id: `progress-${knob}-track`, source: `progress ${where}: --c-progress-${knob} on --c-progress-track`, kind: "solid", paint: r(`c-progress-${knob}`), over: [r("c-progress-track")] },
    { id: `progress-${knob}-page`, source: `progress ${where}: --c-progress-${knob} on the page`, kind: "solid", paint: r(`c-progress-${knob}`), over: [r("surface-ground")] },
  ]),
]

export default recipes

// ── Under a floor, and kept ──────────────────────────────────────────────────────────────────
// The list has to match the misses exactly (`node scripts/contrast.mjs --print-exceptions` prints
// them). Each row is a value that is Figma's, or a contract state laid over one; none is a paint
// this file's components chose for themselves.
const ON_STATE = "contract state (§6: a hover or pressed wash, a solid at 80%) over a Figma value with no room for it; flagged for Sean"
const FIGMA = "Figma value: the app frames draw this pair; flagged for Sean"

export const exceptions = [
  // A solid at 80% when pressed: the white label on the lightest primaries.
  { id: "btn-primary-press-page", modes: ["lockdown / stone"], reason: ON_STATE },
  { id: "btn-primary-press-raised", modes: ["vale / stone", "lockdown / stone"], reason: ON_STATE },
  { id: "float-primary-press", modes: ["lockdown / stone"], reason: ON_STATE },
  // The inverted (current) float button at 80% when pressed.
  { id: "float-current-press", modes: "graphite", reason: ON_STATE },
  // Body ink under the hover and pressed washes, and on the hover fill of a raised surface.
  { id: "btn-ink-hover-page", modes: "stone", reason: ON_STATE },
  { id: "btn-ink-press-page", modes: "stone", reason: ON_STATE },
  { id: "btn-ink-press-raised", modes: "stone", reason: ON_STATE },
  { id: "float-glyph-hover", modes: "stone", reason: ON_STATE },
  { id: "float-glyph-press", modes: "stone", reason: ON_STATE },
  // The error edge is the critical fill, as on a field: 2.9:1 on the graphite page, 2.6:1 on a
  // raised surface there.
  { id: "ctl-invalid-page", modes: "graphite", reason: FIGMA },
  { id: "ctl-invalid-raised", modes: "graphite", reason: FIGMA },
  // Body ink on the soft critical ground: the critical Banner's own pair (Lc 87 on stone).
  { id: "badge-critical", modes: "stone", reason: FIGMA },
  // A progress cell in the identity fill (Warpcore's spend bar, Synapse's checks bar) or the
  // critical fill (Lockdown's ticks near expiry): Lc 17 to 27 against the graphite surfaces.
  { id: "progress-primary-track", modes: "graphite", reason: FIGMA },
  { id: "progress-primary-page", modes: "graphite", reason: FIGMA },
  { id: "progress-critical-track", modes: "graphite", reason: FIGMA },
  { id: "progress-critical-page", modes: "graphite", reason: FIGMA },
]
