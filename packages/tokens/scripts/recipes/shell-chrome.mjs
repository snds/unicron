// Contrast recipes for the shell's chrome parts: AppLockup, TabBar, Accessory, NavItem and
// NavSection, TopTabs, Rail, PageHead, TopBar, and the mark they share (packages/ui/src/components/ui).
// One pair per row as the component paints it: the paint, the stack it sits on (bottom first), and
// what it is for. The kind follows the ink (scripts/recipes/README.md): body ink is `text-body`,
// secondary ink `text-secondary`, label ink and any coloured ink `text-label`, text on a solid fill
// `on-fill`, a mark or a bar `solid`.
//
// The chrome sits on the page (surface-ground). The tab bar and the status strip are the raised
// surface on it; a current nav item, an active tab and an active rail item are the soft primary
// tile. FloatButton's own pairs (its extended form paints the same ones) are in controls.mjs.
//
// Measured once. Most of what the chrome paints is a core pair exactly: the same paint on the same
// stack, with the same numbers in every mode (a solid tile hides what is under it). Those are
// measured by the core table in contrast.mjs, and every miss among them is already a named
// exception there, with its row in the docs summary. `sameAsCore` below lists each of them: which
// part paints it, and the core recipe that measures it. Only the pairs no other recipe measures
// are in `recipes`. None of these misses; there is no exception in this file.

const r = (role, alpha) => ({ role, alpha })

const GROUND = [r("surface-ground")]
const RAISED = [r("surface-ground"), r("surface-raised")]
const SOFT = [r("surface-ground"), r("primary-soft")]
const NEEDS_YOU = [r("surface-ground"), r("needs-you-fill")]

export const recipes = [
  // ── The mark (count, square) on every navigation item ──────────────────────────────────────
  { id: "mark-count-corner", source: "nav-mark corner count: bg-foreground text-background (a tab, a float button)", kind: "on-fill", paint: r("background"), over: [...RAISED, r("foreground")] },
  { id: "mark-count-corner-fill", source: "nav-mark corner count: the ink box against the raised bar", kind: "solid", paint: r("foreground"), over: RAISED },
  { id: "mark-square-ground", source: "nav-mark square: bg-foreground on the page", kind: "solid", paint: r("foreground"), over: GROUND },
  { id: "mark-square-raised", source: "nav-mark square: bg-foreground on the raised bar", kind: "solid", paint: r("foreground"), over: RAISED },
  { id: "mark-square-soft", source: "nav-mark square: bg-foreground on a current item's soft tile", kind: "solid", paint: r("foreground"), over: SOFT },
  // The needs-you square is the yellow inside a hairline of its ink: the yellow is what shows on
  // graphite, the ink edge on stone (where the yellow has no lightness against the surface).
  { id: "mark-square-ny-fill", source: "nav-mark needs-you square: bg-needs-you-fill on graphite", kind: "solid", paint: r("needs-you-fill"), over: GROUND, modes: "graphite" },
  { id: "mark-square-ny-edge", source: "nav-mark needs-you square: inset-ring-needs-you-on-fill on stone", kind: "solid", paint: r("needs-you-on-fill"), over: GROUND, modes: "stone" },

  // ── Accessory on the yellow and the critical ground ────────────────────────────────────────
  { id: "strip-ny-hover", source: "accessory needs-you open button: hover:bg-needs-you-on-fill/5", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.05)] },
  { id: "strip-ny-press", source: "accessory needs-you open button: active:bg-needs-you-on-fill/9", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.09)] },
  { id: "strip-critical-edge", source: "accessory critical: inset-ring-critical-fill on the page (the critical Banner's edge)", kind: "border-rest", paint: r("critical-fill"), over: GROUND },

  // ── NavItem's check box (a checkable item) ──────────────────────────────────────────────────
  { id: "nav-check-on", source: "nav-item checked: the check in text-surface-ground on bg-text-body", kind: "on-fill", paint: r("surface-ground"), over: [r("surface-ground"), r("text-body")] },
  { id: "nav-check-fill", source: "nav-item checked: the bg-text-body box on the page", kind: "solid", paint: r("text-body"), over: GROUND },
  { id: "nav-check-edge", source: "nav-item unchecked: inset-ring-text-label, the edge that alone shows the box", kind: "control-edge", paint: r("text-label"), over: RAISED },
]

export default recipes

/**
 * The pairs the chrome paints that a core recipe in contrast.mjs already measures: `id` is the
 * part and state, `core` the recipe that measures that exact pair. `*` marks the ones that miss a
 * floor and are named exceptions in the core (Figma's value, or a contract wash over one), flagged
 * for Sean there and in the docs summary.
 */
export const sameAsCore = [
  // AppLockup (Figma 28:2297)
  { id: "lockup-initial", core: "primary-on-fill", source: "app-lockup mark: the initial in text-primary-on-fill on bg-primary-fill" },
  { id: "lockup-wordmark", core: "body-ground", source: "app-lockup name: type-brand-wordmark text-text-body" },
  { id: "lockup-mark", core: "primary-fill-ground *", source: "app-lockup mark: the bg-primary-fill square on the page (graphite)" },
  // TabBar and TabBarItem (Figma 20:1657, 20:1656)
  { id: "tab-icon", core: "label-raised *", source: "tab-bar-item at rest: the icon in text-text-label on the raised bar (graphite)" },
  { id: "tab-icon-hover", core: "label-raised-hover *", source: "tab-bar-item: hover:bg-state-hover (graphite)" },
  { id: "tab-icon-press", core: "label-raised-pressed *", source: "tab-bar-item: active:bg-state-pressed (graphite; warpcore stone)" },
  { id: "tab-active", core: "body-soft *", source: "tab-bar-item active: the icon in text-text-body on bg-primary-soft (contract 9.9; stone)" },
  { id: "tab-active-tile", core: "primary-soft-raised", source: "tab-bar-item active: the soft tile against the raised bar" },
  { id: "tab-bar-edge", core: "field-rest-ground", source: "tab-bar: rule-box, the resting hairline on the page" },
  // The mark
  { id: "mark-count-needs-you", core: "needs-you-on-fill", source: "nav-mark needs-you count: text-needs-you-on-fill on bg-needs-you-fill" },
  // Accessory (Figma 20:1713)
  { id: "strip-meta", core: "label-raised *", source: "accessory neutral: the meta in text-text-label on bg-surface-raised (graphite)" },
  { id: "strip-meta-hover", core: "label-raised-hover *", source: "accessory open button: hover:bg-state-hover under the meta (graphite)" },
  { id: "strip-title", core: "body-raised", source: "accessory neutral, live: the title in text-text-body on bg-surface-raised" },
  { id: "strip-title-hover", core: "body-raised-hover", source: "accessory open button: hover:bg-state-hover under the title" },
  { id: "strip-title-press", core: "body-raised-pressed *", source: "accessory open button: active:bg-state-pressed under the title (stone)" },
  { id: "strip-live-meta", core: "live-raised *", source: "accessory live: the meta in text-secondary-live on bg-surface-raised (vale, lockdown graphite)" },
  { id: "strip-live-mark", core: "live-mark-raised", source: "accessory live: the 8px bg-secondary-live square" },
  { id: "strip-progress-lit", core: "live-mark-raised", source: "accessory progress: a lit live cell on the raised strip" },
  { id: "strip-edge", core: "field-rest-ground", source: "accessory neutral, live: rule-box on the page" },
  { id: "strip-ny-ink", core: "needs-you-on-fill", source: "accessory needs-you: meta and title in text-needs-you-on-fill on bg-needs-you-fill" },
  { id: "strip-critical-title", core: "body-critical-soft *", source: "accessory critical: the title in text-text-body on bg-critical-soft, as the critical Banner (stone)" },
  { id: "strip-critical-meta", core: "secondary-critical-soft", source: "accessory critical: the meta in text-text-secondary on bg-critical-soft, as the Banner's body" },
  { id: "strip-critical-glyph", core: "critical-text-soft *", source: "accessory critical: warning--alt in text-critical-text on bg-critical-soft, as the Banner's icon (graphite)" },
  // NavItem and NavSection (Figma 15:487)
  { id: "nav-heading", core: "label-ground", source: "nav-section heading: type-overline text-text-label" },
  { id: "nav-label", core: "secondary-ground", source: "nav-item at rest: the label and icon in text-text-secondary" },
  { id: "nav-label-hover", core: "secondary-ground-hover", source: "nav-item: hover:bg-state-hover under the label" },
  { id: "nav-label-press", core: "secondary-ground-pressed *", source: "nav-item: has-[main:active]:bg-state-pressed under the label (stone)" },
  { id: "nav-count", core: "label-ground", source: "nav-item at rest: the count in text-text-label" },
  { id: "nav-count-hover", core: "label-ground-hover *", source: "nav-item: hover:bg-state-hover under the count (graphite)" },
  { id: "nav-index", core: "faint-ground", source: "nav-item at rest: the index in text-text-faint (reported, no floor)" },
  { id: "nav-description", core: "label-ground", source: "nav-item description: type-caption text-text-label" },
  { id: "nav-disclosure", core: "label-ground", source: "nav-item disclosure: the chevron in text-text-label" },
  { id: "nav-current", core: "body-soft *", source: "nav-item current: label, icon and count in text-text-body on bg-primary-soft (stone); a critical current item too" },
  { id: "nav-current-index", core: "secondary-soft", source: "nav-item current: the index in text-text-secondary on bg-primary-soft" },
  { id: "nav-current-description", core: "secondary-soft", source: "nav-item current: the description in text-text-secondary on bg-primary-soft" },
  { id: "nav-current-hover", core: "body-soft", source: "nav-item current under the pointer: the tile keeps its fill (no wash)" },
  { id: "nav-critical", core: "critical-text-ground", source: "nav-item tone=critical: label, icon and glyph in text-critical-text" },
  // TopTabs and TopTab (Figma 15:498)
  { id: "top-tab-label", core: "label-ground", source: "top-tab at rest: label and icon in text-text-label" },
  { id: "top-tab-index", core: "faint-ground", source: "top-tab: the index in text-text-faint (reported, no floor)" },
  { id: "top-tab-current", core: "body-ground", source: "top-tab current: text-text-body" },
  { id: "top-tab-hover", core: "body-ground-hover *", source: "top-tab: hover:bg-state-hover, the label to text-text-body (stone)" },
  { id: "top-tab-press", core: "body-ground-pressed *", source: "top-tab: active:bg-state-pressed (stone)" },
  { id: "top-tab-indicator", core: "primary-fill-ground *", source: "top-tab current: the 2px bg-primary-fill indicator on the page (graphite)" },
  // Rail and RailItem (Figma 44:106); NavItem in a collapsed NavSection draws the same
  { id: "rail-icon", core: "body-ground", source: "rail-item default: the icon in text-foreground" },
  { id: "rail-count", core: "label-ground", source: "rail-item default: the count in text-muted-foreground" },
  { id: "rail-icon-hover", core: "body-ground-hover *", source: "rail-item: hover:bg-state-hover under the icon (stone)" },
  { id: "rail-count-hover", core: "label-ground-hover *", source: "rail-item: hover:bg-state-hover under the count (graphite)" },
  { id: "rail-active-icon", core: "primary-text-soft *", source: "rail-item active: the icon in text-primary-text on bg-primary-soft (graphite; lockdown stone)" },
  { id: "rail-active-count", core: "label-soft *", source: "rail-item active: the count in text-muted-foreground on bg-primary-soft (every mode)" },
  { id: "rail-live", core: "live-ground", source: "rail-item live (Figma: Alert): icon and count in text-secondary-live" },
  // PageHead and TopBar
  { id: "head-overline", core: "label-ground", source: "page-head: the overline in text-text-label" },
  { id: "head-title", core: "body-ground", source: "page-head: the title (display, display/compact, title) in text-text-body; top-bar title (subtitle)" },
  { id: "head-side", core: "label-ground", source: "page-head: count and meta in text-text-label (folio, code/display)" },
  { id: "head-switcher-hover", core: "body-ground-hover *", source: "page-head switcher: hover:bg-state-hover over the title (stone)" },
  { id: "head-switcher-hover-side", core: "label-ground-hover *", source: "page-head switcher: hover:bg-state-hover over the overline and the side meta (graphite)" },
  // Focus, every part: the stylesheet's ring, measured by the core (ring-ground, ring-raised, ring-soft, ring-needs-you).
  { id: "focus", core: "ring-ground, ring-raised, ring-soft, ring-needs-you", source: "every chrome control: :focus-visible outline in --ring; on the yellow strip, on-needs-you" },
]

export const exceptions = []
