// Contrast recipes for the field styling from before 1.0, still on Input, Textarea, Select's
// trigger, NativeSelect, InputGroup and Toggle (packages/ui/src/components/ui), until the
// primitives round restyles them as TextField (contract §5.1, round 2). Delete this file, or
// move its rows to that round's own file, when those classes are gone.
//
// What they paint, as the classes say:
//   - the box: `bg-surface-raised`, Figma's field fill; under the pointer on Select and
//     NativeSelect, the contract's hover wash (state-hover, 6% of the ink) laid on that fill
//   - the value in the ink, the placeholder in `text-muted-foreground`
//   - a resting `border-input` hairline (reported, as every field's resting border is)
//   - focus: a 1px `border-ring` and a 3px `ring-ring/50` around the box
//   - invalid: a 1px `border-destructive` and a 3px `ring-destructive` ring, at 80% on stone and
//     50% on graphite, on whenever the field is invalid (`aria-invalid:ring-3`); the ring's alpha
//     is pinned by packages/ui button.test.tsx
// A ring sits outside the box, so it is judged against the page around the field; a border sits
// on the box's own fill.

const r = (role, alpha) => ({ role, alpha })

const BOX = [r("surface-raised")]
const mix = (a, b, k) => ({ mix: [a, b], k })
const HOVER = [mix("surface-raised", "text-body", 0.06)]
const PAGE = [r("surface-ground")]
const FIELDS = "input, textarea, select trigger, native select, input group"

export const recipes = [
  // The words in the box.
  { id: "value", source: `${FIELDS}: the value in the ink on bg-surface-raised`, kind: "text-body", paint: r("foreground"), over: BOX },
  { id: "value-hover", source: "select trigger, native select: the value on hover: 6% of the ink in bg-surface-raised", kind: "text-body", paint: r("foreground"), over: HOVER },
  { id: "placeholder", source: `${FIELDS}: placeholder:text-muted-foreground on bg-surface-raised`, kind: "text-label", paint: r("muted-foreground"), over: BOX },
  { id: "placeholder-hover", source: "select trigger, native select: the placeholder on hover: 6% of the ink in bg-surface-raised", kind: "text-label", paint: r("muted-foreground"), over: HOVER },

  // The resting box (reported: a field's resting border is a hairline, contract §9.4).
  { id: "edge", source: `${FIELDS}: border-input around bg-surface-raised, on the page`, kind: "border-rest", paint: r("input"), over: PAGE },

  // Focus: the 1px ink border on the box, and the 3px ring at half the ink around it.
  { id: "focus-border", source: `${FIELDS}: focus-visible:border-ring on the box`, kind: "focus", paint: r("ring"), over: BOX },
  { id: "focus-ring", source: `${FIELDS}, toggle: focus-visible:ring-ring/50, 3px around the box, on the page`, kind: "focus", paint: r("ring", 0.5), over: PAGE },

  // Invalid: the 1px border on the box and the 3px ring around it.
  { id: "invalid-border", source: `${FIELDS}: aria-invalid:border-destructive on the box`, kind: "border-error", paint: r("destructive"), over: BOX },
  { id: "invalid-border-page", source: `${FIELDS}: aria-invalid:border-destructive against the page outside the box`, kind: "border-error", paint: r("destructive"), over: PAGE },
  { id: "invalid-ring-stone", source: `${FIELDS}, toggle: aria-invalid:ring-destructive/80, 3px around the box, on the page`, kind: "border-error", modes: "stone", paint: r("destructive", 0.8), over: PAGE },
  { id: "invalid-ring-graphite", source: `${FIELDS}, toggle: dark:aria-invalid:ring-destructive/50, 3px around the box, on the page`, kind: "border-error", modes: "graphite", paint: r("destructive", 0.5), over: PAGE },
]

export default recipes

// ── Under a floor, and kept ──────────────────────────────────────────────────────────────────
// The same misses the core lists for Figma's own field: the label ink on the raised box (core
// label-raised, "a field's placeholder"), and on it under the hover wash (core label-raised-hover).
export const exceptions = [
  { id: "placeholder", modes: "graphite", reason: "Figma value: Figma's label ink on Figma's field fill (surface-raised), as the core's label-raised; flagged for Sean" },
  { id: "placeholder-hover", modes: "graphite", reason: "contract state (§6: the hover wash) over a Figma value with no room for it, as the core's label-raised-hover; flagged for Sean" },
]
