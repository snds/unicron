// Contrast recipes for the security set and the update kit (packages/ui: components/security/*,
// ui/update-status.tsx), as restyled for the 2026-11 direction. One pair per row as the component
// paints it: the paint, the stack it sits on (bottom first), and what it is for.
//
// Only the pairs these components paint with their own knobs, or on a stack no other file
// measures, are here. The Field Row and Text Field looks they borrow (body and label ink on the
// ground and on a raised surface, the live colour, the field's borders, the hover and pressed
// washes under a text action, Button, FloatButton, Badge, Progress) are measured by the core table
// and by recipes/controls.mjs, with their exceptions, and are not measured twice.

const r = (role, alpha) => ({ role, alpha })

const GROUND = [r("surface-ground")]
const RAISED = [r("surface-raised")]
// The crown-jewel surface: the page's ink as a ground (`--c-crown-jewel-surface`, {protected}).
const JEWEL = [r("surface-ground"), r("c-crown-jewel-surface")]

export const recipes = [
  // ── SecretField ─────────────────────────────────────────────────────────────────────────────
  // A shown value: body ink on the ink wash that marks it as out in the open (a row on the page,
  // and a row in a sheet or dialog).
  { id: "secret-revealed-ground", source: "secret-field-revealed: bg-(--c-secret-field-revealed-bg) text-text-body", kind: "text-body", paint: r("text-body"), over: [...GROUND, r("c-secret-field-revealed-bg")] },
  { id: "secret-revealed-raised", source: "secret-field-revealed in a sheet: bg-(--c-secret-field-revealed-bg) on surface-raised", kind: "text-body", paint: r("text-body"), over: [...RAISED, r("c-secret-field-revealed-bg")] },
  // The strength rule: three cells on the page, the word always beside them.
  { id: "secret-meter-weak", source: "secret-field-meter weak: bg-(--c-secret-field-meter-weak)", kind: "solid", paint: r("c-secret-field-meter-weak"), over: GROUND },
  { id: "secret-meter-fair", source: "secret-field-meter fair: bg-(--c-secret-field-meter-fair)", kind: "solid", paint: r("c-secret-field-meter-fair"), over: GROUND },
  { id: "secret-meter-strong", source: "secret-field-meter strong: bg-(--c-secret-field-meter-strong)", kind: "solid", paint: r("c-secret-field-meter-strong"), over: GROUND },

  // ── CrownJewelSurface: the inverted ground and what its re-mapped roles paint on it ─────────
  { id: "jewel-ink", source: "crown-jewel-surface: text-text-body, re-mapped to --c-crown-jewel-ink (values, words, a live countdown)", kind: "text-body", paint: r("c-crown-jewel-ink"), over: JEWEL },
  { id: "jewel-label", source: "crown-jewel-surface: text-text-label, re-mapped to --c-crown-jewel-muted-ink (row labels, meta)", kind: "text-label", paint: r("c-crown-jewel-muted-ink"), over: JEWEL },
  { id: "jewel-ink-hover", source: "crown-jewel-surface: a text action under hover:bg-state-hover, re-mapped to --c-crown-jewel-hover", kind: "text-body", paint: r("c-crown-jewel-ink"), over: [...JEWEL, r("c-crown-jewel-hover")] },
  { id: "jewel-ink-pressed", source: "crown-jewel-surface: a text action under active:bg-state-pressed, re-mapped to --c-crown-jewel-pressed", kind: "text-body", paint: r("c-crown-jewel-ink"), over: [...JEWEL, r("c-crown-jewel-pressed")] },
  { id: "jewel-cells", source: "crown-jewel-surface: a countdown's lit cells, --c-progress-live re-mapped to the ink", kind: "solid", paint: r("c-crown-jewel-ink"), over: JEWEL },
  { id: "jewel-rule", source: "crown-jewel-surface: rule-t between rows, --line-rule re-mapped to --c-crown-jewel-border", kind: "border-decorative", paint: r("c-crown-jewel-border"), over: JEWEL },
  { id: "jewel-skeleton", source: "crown-jewel-surface: a Skeleton bar, --surface-raised re-mapped to --c-crown-jewel-muted", kind: "surface", paint: r("c-crown-jewel-muted"), over: JEWEL },
  // The surface against the page round it: it has to read as a different ground.
  { id: "jewel-surface", source: "crown-jewel-surface: bg-surface-ground re-mapped to --c-crown-jewel-surface, on the page", kind: "surface", paint: r("c-crown-jewel-surface"), over: GROUND },
]

export const exceptions = []
