// Contrast recipes for the shell's frame parts (packages/ui/src/components/ui: app-frame*.tsx,
// context-panel.tsx, settings-frame.tsx). One pair per row as the part paints it: the paint, the
// stack it sits on (bottom first), and what it is for. The kind follows the ink
// (scripts/recipes/README.md).
//
// The frame paints little of its own: it places the chrome parts (measured in shell-chrome.mjs)
// and the content on the page's ground. Its own pairs are the status item's marks, the context
// panel's chips, the drawer and the rules between the columns. Every other pair it paints is a core
// pair exactly (same paint, same stack): `sameAsCore` names each with the core recipe that measures
// it; `*` marks the core's named exceptions (Figma's value, or a contract wash over one).
// None of the recipes here misses; there is no exception in this file.

const r = (role, alpha) => ({ role, alpha })

const GROUND = [r("surface-ground")]

export const recipes = [
  // ── StatusItem's square mark: a mark, held as a solid against the page ─────────────────────
  { id: "status-mark-neutral", source: "status-item mark=square tone=neutral: bg-text-label on the page", kind: "solid", paint: r("text-label"), over: GROUND },
  { id: "status-mark-live", source: "status-item mark=square tone=live: bg-secondary-live on the page", kind: "solid", paint: r("secondary-live"), over: GROUND },
  { id: "status-mark-critical", source: "status-item mark=square tone=critical: bg-critical-text on the page", kind: "solid", paint: r("critical-text"), over: GROUND },

  // ── ContextPanel's tabs, drawn as Filter Chips (Figma 15:503) ──────────────────────────────
  { id: "context-tab-active", source: "context-panel tab active: the label in text-surface-ground on bg-text-body (inverted ink)", kind: "on-fill", paint: r("surface-ground"), over: [...GROUND, r("text-body")] },
  { id: "context-tab-active-fill", source: "context-panel tab active: the bg-text-body chip on the page", kind: "solid", paint: r("text-body"), over: GROUND },

  // ── The sidebar's drawer at medium width ───────────────────────────────────────────────────
  { id: "drawer-rule", source: "app-frame sidebar drawer: rule-r between the drawer and the dimmed content", kind: "border-decorative", paint: r("line-rule"), over: GROUND },
]

export default recipes

/**
 * The pairs the frame paints that a core recipe in contrast.mjs (or shell-chrome.mjs, marked
 * `chrome:`) already measures: `id` is the part and state, `core` the recipe that measures that
 * exact pair. `*` marks a named exception in the core.
 */
export const sameAsCore = [
  // StatusItem and AppFrameStatusLine
  { id: "status-neutral", core: "label-ground", source: "status-item tone=neutral: type-overline text-text-label" },
  { id: "status-live", core: "live-ground", source: "status-item tone=live: text-secondary-live" },
  { id: "status-warning", core: "warning-on-ground", source: "status-item tone=warning: text-warning, and the bg-warning square" },
  { id: "status-critical", core: "critical-text-ground", source: "status-item tone=critical: text-critical-text" },
  { id: "status-hover", core: "label-ground-hover *", source: "status-item as a button or link: hover:bg-state-hover under label ink (graphite)" },
  { id: "status-press", core: "label-ground-pressed *", source: "status-item as a button or link: active:bg-state-pressed under label ink (every mode)" },
  { id: "crumbs", core: "body-ground", source: "status-line crumbs: type-overline text-text-body" },
  { id: "status-line-rule", core: "rule-ground", source: "status-line and top-bar: rule-b, the hairline under the line" },
  // AppFrameTopRow and AppFrameBottomRow (the phone)
  { id: "top-row-title", core: "body-ground", source: "top-row small title: type-subtitle text-text-body on the row's ground" },
  { id: "top-row-switcher-hover", core: "body-ground-hover *", source: "top-row small title as the switcher: hover:bg-state-hover (stone)" },
  { id: "top-row-hairline", core: "rule-ground", source: "top-row scrolled: rule-b under the row" },
  { id: "scroll-edge", core: "body-ground", source: "scroll edges: the content fades into bg-surface-ground, the same ground it sits on" },
  // The columns and the sidebar's rail
  { id: "column-rule", core: "rule-ground", source: "the rule between columns: rule-l" },
  { id: "rail-group-rule", core: "rule-ground", source: "the sidebar's rail: rule-t between the groups" },
  // AppFrameSwitcher, AppFramePeek, SettingsFrame, AppFrameFocus
  { id: "switcher-overline", core: "label-ground", source: "app-frame-switcher: the overline in text-text-label" },
  { id: "switcher-title", core: "body-ground", source: "app-frame-switcher: the name in type-lead text-text-body" },
  { id: "peek-head", core: "body-ground", source: "app-frame-peek: the title in text-text-body, the overline in label ink (label-ground)" },
  { id: "settings-head", core: "secondary-ground", source: "settings-frame section head: the one line in text-text-secondary" },
  { id: "focus-folio", core: "label-ground", source: "app-frame-focus: the folio in text-text-label" },
  // ContextPanel's resting and hovered chips
  { id: "context-tab", core: "label-ground", source: "context-panel tab at rest: type-overline text-text-label" },
  { id: "context-tab-hover", core: "body-ground-hover *", source: "context-panel tab: hover:bg-state-hover, the label to text-text-body (stone)" },
  { id: "context-tab-press", core: "body-ground-pressed *", source: "context-panel tab: active:bg-state-pressed (stone)" },
  // Focus, every part: the stylesheet's ring, measured by the core.
  { id: "focus", core: "ring-ground, ring-raised, ring-soft", source: "every frame control: :focus-visible outline in --ring" },
]

export const exceptions = []
