// Contrast recipes for the leaf controls: Button, FloatButton, Switch, Checkbox, Badge, Kbd,
// Progress (packages/ui/src/components/ui). Same shape as RECIPES in ../contrast.mjs: the paint,
// the stack it sits on (bottom first), and what it is for (the kind sets the floor).
//
// What is gated here clears its floor in all eight Figma modes (measured with apca-w3 from the
// read-out in tokens/figma): labels on fills and tints Lc 60, reading text Lc 75, state marks and
// the focus ring 3:1. Three paints are drawn as Figma draws them and sit under a floor on
// graphite, so they are listed as reported (`state`), not gated, each with its number:
//   - critical-fill as the filled part of a progress bar (Lc 17 on the empty part, Lc 22 on the page);
//   - primary-fill as the filled part (Lc 17 to 22 on the empty part);
//   - the hairline of a resting Switch, Checkbox, Badge and FloatButton (1.3:1 to 1.4:1, as the
//     contract reports every resting hairline; state is carried by the fill and the knob).
// Label ink and the coloured inks (primary-text, secondary-live, critical-text) are gated on the
// page only: on surface-raised they measure Lc 59.0 to 59.6 on graphite, under the label floor.
// The controls here do not draw them there (Kbd uses the secondary ink on its raised box).

const r = (role, alpha) => ({ role, alpha })
const mix = (a, b, k) => ({ mix: [a, b], k })

const NEEDS_YOU = [r("needs-you-fill")]
// The two surfaces a control sits on: the page, and a raised surface (`card` is surface-raised).
const SURFACES = [["page", "background"], ["card", "card"]]

export const recipes = [
  // ── Button ──────────────────────────────────────────────────────────────────────────────────
  // Solid kinds: the label on the fill at rest, at 90% (hover) and at 80% (pressed), on the page
  // and on a raised surface.
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `btn-primary-${on}`, source: "button default: bg-primary text-primary-foreground", kind: "on-solid", paint: r("primary-foreground"), over: [r(bg), r("primary")] },
    { id: `btn-primary-hover-${on}`, source: "button default: hover:bg-primary/90", kind: "on-solid", paint: r("primary-foreground"), over: [r(bg), r("primary", 0.9)] },
    { id: `btn-primary-press-${on}`, source: "button default: active:bg-primary/80", kind: "on-solid", paint: r("primary-foreground"), over: [r(bg), r("primary", 0.8)] },
    { id: `btn-critical-${on}`, source: "button destructive: bg-critical-fill text-critical-on-fill; ghost-destructive under the pointer", kind: "on-solid", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill")] },
    { id: `btn-critical-hover-${on}`, source: "button destructive: hover:bg-critical-fill/90", kind: "on-solid", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill", 0.9)] },
    { id: `btn-critical-press-${on}`, source: "button destructive, ghost-destructive: active:bg-critical-fill/80", kind: "on-solid", paint: r("critical-on-fill"), over: [r(bg), r("critical-fill", 0.8)] },
  ]),
  // Transparent kinds (secondary, outline, ghost): the ink label on the page, and under each wash.
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `btn-ink-${on}`, source: "button secondary, outline, ghost: text-foreground", kind: "text-primary", paint: r("foreground"), over: [r(bg)] },
    { id: `btn-ink-hover-${on}`, source: "button secondary, outline, ghost, ghost-muted: hover:bg-state-hover", kind: "text-primary", paint: r("foreground"), over: [r(bg), r("state-hover")] },
    { id: `btn-ink-press-${on}`, source: "button secondary, outline, ghost, ghost-muted: active:bg-state-pressed", kind: "text-primary", paint: r("foreground"), over: [r(bg), r("state-pressed")] },
    { id: `btn-edge-${on}`, source: "button secondary, outline: inset-ring-foreground (the 1px edge is the control's boundary)", kind: "border-control", paint: r("foreground"), over: [r(bg)] },
  ]),
  { id: "btn-muted", source: "button ghost-muted at rest: text-muted-foreground", kind: "text-on-tint", paint: r("muted-foreground"), over: [r("background")] },
  { id: "btn-ghost-critical", source: "button ghost-destructive at rest: text-destructive", kind: "text-on-tint", paint: r("destructive"), over: [r("background")] },
  { id: "btn-link", source: "button link: text-primary-text", kind: "text-on-tint", paint: r("primary-text"), over: [r("background")] },
  // The three kinds on the needs-you yellow.
  { id: "btn-ny", source: "button needs-you: bg-needs-you-on-fill text-needs-you-fill", kind: "on-solid", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill")] },
  { id: "btn-ny-hover", source: "button needs-you: hover:bg-needs-you-on-fill/90", kind: "on-solid", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.9)] },
  { id: "btn-ny-press", source: "button needs-you: active:bg-needs-you-on-fill/80", kind: "on-solid", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.8)] },
  { id: "btn-ny-ink", source: "button needs-you-outline, needs-you-text: text-needs-you-on-fill", kind: "on-solid", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  { id: "btn-ny-ink-hover", source: "button needs-you-outline, needs-you-text: hover:bg-needs-you-on-fill/6", kind: "on-solid", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.06)] },
  { id: "btn-ny-ink-press", source: "button needs-you-outline, needs-you-text: active:bg-needs-you-on-fill/10", kind: "on-solid", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.1)] },
  { id: "btn-ny-edge", source: "button needs-you-outline: inset-ring-needs-you-on-fill", kind: "border-control", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  // An invalid control's 2px inside edge, in critical ink: critical-fill is 2.9:1 on the graphite
  // page (2.6:1 on a raised surface), under the 3:1 an error edge is held to.
  ...SURFACES.map(([on, bg]) => ({
    id: `ctl-invalid-${on}`, source: "button, switch, checkbox: aria-invalid:inset-ring-2 inset-ring-destructive", kind: "focus", paint: r("destructive"), over: [r(bg)],
  })),

  // ── Focus: 2px solid ring, 2px clear of the control, so it is judged against what is around it ──
  ...SURFACES.map(([on, bg]) => ({
    id: `ctl-focus-${on}`, source: "button, float button, switch, checkbox, badge: focus-visible:outline-ring", kind: "focus", paint: r("ring"), over: [r(bg)],
  })),
  { id: "ctl-focus-needs-you", source: "button needs-you kinds, badge needs-you: focus-visible:outline-needs-you-on-fill", kind: "focus", paint: r("needs-you-on-fill"), over: NEEDS_YOU },

  // ── FloatButton: every fill is opaque, because it floats over content ───────────────────────
  { id: "float-glyph", source: "float button neutral: bg-surface-raised text-foreground", kind: "text-primary", paint: r("foreground"), over: [r("surface-raised")] },
  { id: "float-glyph-hover", source: "float button neutral: hover:bg-accent", kind: "text-primary", paint: r("foreground"), over: [r("accent")] },
  { id: "float-glyph-press", source: "float button neutral: active:bg-[color-mix(accent, foreground 8%)]", kind: "text-primary", paint: r("foreground"), over: [mix("accent", "foreground", 0.08)] },
  { id: "float-edge", source: "float button neutral: rule-box on the page (resting hairline)", kind: "border-decorative", paint: r("line-rule"), over: [r("background")] },
  { id: "float-primary", source: "float button primary: bg-primary text-primary-foreground", kind: "on-solid", paint: r("primary-foreground"), over: [r("primary")] },
  { id: "float-primary-hover", source: "float button primary: hover:bg-[color-mix(primary 90%, background)]", kind: "on-solid", paint: r("primary-foreground"), over: [mix("primary", "background", 0.1)] },
  { id: "float-primary-press", source: "float button primary: active:bg-[color-mix(primary 80%, background)]", kind: "on-solid", paint: r("primary-foreground"), over: [mix("primary", "background", 0.2)] },
  { id: "float-current", source: "float button current or pressed: bg-foreground text-background", kind: "on-solid", paint: r("background"), over: [r("foreground")] },
  { id: "float-current-hover", source: "float button current: hover:bg-[color-mix(foreground 90%, background)]", kind: "on-solid", paint: r("background"), over: [mix("foreground", "background", 0.1)] },
  { id: "float-current-press", source: "float button current: active:bg-[color-mix(foreground 80%, background)]", kind: "on-solid", paint: r("background"), over: [mix("foreground", "background", 0.2)] },
  { id: "float-current-page", source: "float button current: the inverted fill against the page", kind: "solid", paint: r("foreground"), over: [r("background")] },

  // ── Switch: the knob is the state mark, so it is held to 3:1 on its track ───────────────────
  { id: "switch-on-knob", source: "switch on: data-checked:bg-primary-foreground knob on bg-primary", kind: "border-control", paint: r("primary-foreground"), over: [r("background"), r("primary")] },
  { id: "switch-on-knob-hover", source: "switch on: data-checked:hover:bg-primary/90", kind: "border-control", paint: r("primary-foreground"), over: [r("background"), r("primary", 0.9)] },
  { id: "switch-on-knob-press", source: "switch on: data-checked:active:bg-primary/80", kind: "border-control", paint: r("primary-foreground"), over: [r("background"), r("primary", 0.8)] },
  { id: "switch-off-knob", source: "switch off: data-unchecked:bg-muted-foreground knob on bg-surface-raised", kind: "border-control", paint: r("muted-foreground"), over: [r("surface-raised")] },
  { id: "switch-off-knob-hover", source: "switch off: data-unchecked:hover:bg-accent", kind: "border-control", paint: r("muted-foreground"), over: [r("accent")] },
  { id: "switch-off-edge", source: "switch off: data-unchecked:rule-box on the page (resting hairline)", kind: "border-decorative", paint: r("line-rule"), over: [r("background")] },
  { id: "switch-off-track", source: "switch off: bg-surface-raised against the page", kind: "surface", paint: r("surface-raised"), over: [r("background")] },

  // ── Checkbox ────────────────────────────────────────────────────────────────────────────────
  { id: "checkbox-mark", source: "checkbox checked, indeterminate: text-background mark on bg-foreground", kind: "on-solid", paint: r("background"), over: [r("foreground")] },
  ...SURFACES.map(([on, bg]) => ({
    id: `checkbox-fill-${on}`, source: "checkbox checked: data-checked:bg-foreground against what it sits on", kind: "solid", paint: r("foreground"), over: [r(bg)],
  })),
  { id: "checkbox-edge", source: "checkbox unchecked: data-unchecked:rule-box on the page (resting hairline)", kind: "border-decorative", paint: r("line-rule"), over: [r("background")] },

  // ── Badge: a mono caps word; the tone backs it up ───────────────────────────────────────────
  { id: "badge-neutral", source: "badge neutral: rule-box text-muted-foreground", kind: "text-on-tint", paint: r("muted-foreground"), over: [r("background")] },
  { id: "badge-live", source: "badge live: rule-box text-secondary-live", kind: "text-on-tint", paint: r("secondary-live"), over: [r("background")] },
  { id: "badge-needs-you", source: "badge needs-you: bg-needs-you-fill text-needs-you-on-fill", kind: "on-solid", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  ...SURFACES.flatMap(([on, bg]) => [
    { id: `badge-critical-${on}`, source: "badge critical: bg-critical-soft text-foreground", kind: "text-on-tint", paint: r("foreground"), over: [r(bg), r("critical-soft")] },
    { id: `badge-warning-${on}`, source: "badge warning: bg-warning/15 text-foreground", kind: "text-on-tint", paint: r("foreground"), over: [r(bg), r("warning", 0.15)] },
    { id: `badge-success-${on}`, source: "badge success: bg-success-surface text-success-foreground", kind: "text-on-tint", paint: r("success-foreground"), over: [r(bg), r("success-surface")] },
  ]),
  { id: "badge-edge", source: "badge neutral, live: rule-box on the page (decorative: the word carries it)", kind: "border-decorative", paint: r("line-rule"), over: [r("background")] },
  { id: "badge-critical-edge", source: "badge critical: inset-ring-critical-fill on bg-critical-soft (decorative)", kind: "border-decorative", paint: r("critical-fill"), over: [r("background"), r("critical-soft")] },
  { id: "badge-warning-edge", source: "badge warning: inset-ring-warning on bg-warning/15 (decorative)", kind: "border-decorative", paint: r("warning"), over: [r("background"), r("warning", 0.15)] },

  // ── Skeleton ────────────────────────────────────────────────────────────────────────────────
  { id: "skeleton-bar", source: "skeleton: bg-surface-raised bars on the page (1.1:1 as drawn; a placeholder, not content)", kind: "surface", paint: r("surface-raised"), over: [r("background")] },

  // ── Kbd ─────────────────────────────────────────────────────────────────────────────────────
  { id: "kbd", source: "kbd: bg-surface-raised text-support-foreground", kind: "text-secondary", paint: r("support-foreground"), over: [r("surface-raised")] },

  // ── Progress: the filled part against the empty part (--c-progress-track = line-rule), and against the page ──
  { id: "progress-live-track", source: "progress segmented, tone=live: --c-progress-tone-live on --c-progress-track", kind: "solid", paint: r("secondary-live"), over: [r("line-rule")] },
  ...SURFACES.map(([on, bg]) => ({
    id: `progress-live-${on}`, source: "progress segmented, tone=live: --c-progress-tone-live", kind: "solid", paint: r("secondary-live"), over: [r(bg)],
  })),
  { id: "progress-track", source: "progress: --c-progress-track, the empty part of a bar or an empty cell, on the page", kind: "border-decorative", paint: r("line-rule"), over: [r("background")] },
  // Reported, not gated: as drawn in Figma these sit under the Lc 30 solid floor on graphite. The
  // filled part still differs from the empty part by length, and the root says the value.
  { id: "progress-critical-track", source: "progress tone=critical: --c-progress-tone-critical on --c-progress-track (graphite Lc 17, stone Lc 55)", kind: "state", paint: r("critical-fill"), over: [r("line-rule")] },
  { id: "progress-critical-page", source: "progress tone=critical: --c-progress-tone-critical on the page (graphite Lc 22, stone Lc 72)", kind: "state", paint: r("critical-fill"), over: [r("background")] },
  { id: "progress-primary-track", source: "progress bar, tone=primary: --c-progress-fill on --c-progress-track (graphite Lc 17 to 22, stone Lc 52 to 58)", kind: "state", paint: r("primary"), over: [r("line-rule")] },
  ...[["complete", "success"], ["warning", "warning"], ["over", "destructive"]].map(([knob, role]) => ({
    id: `progress-${knob}-track`, source: `progress bar: --c-progress-${knob} (${role}) on --c-progress-track`, kind: "state", paint: r(role), over: [r("line-rule")],
  })),
]

export default recipes
