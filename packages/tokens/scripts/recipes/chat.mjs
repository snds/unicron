// Contrast recipes for the chat area: Composer, ChatMessage, ArtifactCard, SummaryBlock, Prose,
// CodeBlock, CopyButton, StatusOrb, IndicatorMark, RunTrace and AgentPrompt (packages/ui). One pair
// per row as the component paints it: the paint, the stack it sits on (bottom first), and what it
// is for. The kind follows the ink (scripts/recipes/README.md): body ink is `text-body`, secondary
// ink `text-secondary`, label ink and any coloured ink `text-label`, text on a solid fill
// `on-fill`, a mark, an edge or a bar `solid`.
//
// Every pair below passes. Some pairs these parts paint are Figma's own and miss their floor; the
// core table already measures each of them under the same roles and reports it as a named
// exception ("Figma value, flagged for Sean"), so they are not measured a second time here (a
// second copy would need its own row in contrast.mjs's docs summary). Each is listed, with the core
// recipe that holds it:
//
//   text-label on surface-raised: the Composer's placeholder, the Artifact Card's meta and arrow,
//     the CodeBlock's label, a StatusOrb glyph on a raised panel, an answered AgentPrompt's
//     overline ............................................................ label-raised
//   primary-fill as a focused field's 2px border, on surface-raised: the Composer box ... field-focus-raised
//   secondary-live on surface-raised: an agent's meta or a SummaryBlock overline in a raised
//     panel ............................................................... live-raised
//   critical-text on surface-raised: a failed StatusOrb glyph on a raised panel . critical-text-raised
//   primary-text on primary-soft: the Artifact Card's tile ............... primary-text-soft
//   the open Artifact Card and an answered AgentPrompt row (the selected look, contract §6.5):
//     text-body and text-label on primary-soft ...................... body-soft, label-soft
//     the tile's primary-text on surface-raised .............................. primary-text-raised
//     the 2px primary-fill edge on primary-soft ............................ primary-edge-soft
//   the Artifact Card's hover and pressed (state-hover, state-pressed over the card's fill):
//     body and label ink ...... body-raised-pressed, label-raised-hover, label-raised-pressed,
//                               body-soft-hover, label-soft-hover
//   the needs-you yellow on stone as a mark ......................... needs-you-fill-ground, -raised
//     (the StatusOrb and the IndicatorMark outline it in the yellow's ink; that outline is measured
//     below, on stone, where it carries the shape)

const r = (role, alpha) => ({ role, alpha })

const GROUND = [r("surface-ground")]
const RAISED = [r("surface-raised")]
const SOFT = [r("surface-raised"), r("primary-soft")]
const NEEDS_YOU = [r("needs-you-fill")]

export const recipes = [
  // ── Composer (Figma 32:91) ───────────────────────────────────────────────────────────────────
  { id: "composer-text", source: "composer field: type-ui text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "composer-send", source: "composer send: Button default (bg-primary, the send--alt glyph in primary-foreground)", kind: "on-fill", paint: r("primary-on-fill"), over: [...RAISED, r("primary-fill")] },
  { id: "composer-reason", source: "composer reason line: type-caption text-text-secondary on the ground", kind: "text-secondary", paint: r("text-secondary"), over: GROUND },

  // ── ChatMessage (Figma 32:103) ───────────────────────────────────────────────────────────────
  { id: "message-user-meta", source: "chat message user: meta type-overline text-text-label on the ground", kind: "text-label", paint: r("text-label"), over: GROUND },
  { id: "message-bubble", source: "chat message user: the bubble, type-body text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "message-agent-meta", source: "chat message agent: meta type-overline text-secondary-live on the ground", kind: "text-label", paint: r("secondary-live"), over: GROUND },
  { id: "message-agent-body", source: "chat message agent: type-response text-text-body on the ground", kind: "text-body", paint: r("text-body"), over: GROUND },
  { id: "message-caret", source: "chat message streaming: the 8px live square, bg-secondary-live, on the ground", kind: "solid", paint: r("secondary-live"), over: GROUND },
  { id: "message-error", source: "chat message error: type-caption text-critical-text on the ground", kind: "text-label", paint: r("critical-text"), over: GROUND },

  // ── ArtifactCard (Figma 44:85) ───────────────────────────────────────────────────────────────
  { id: "artifact-title", source: "artifact card: title type-ui-emphasis text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },

  // ── SummaryBlock (Figma 53:2448, Vale) ──────────────────────────────────────────────────────
  { id: "summary-overline", source: "summary block: overline type-overline text-secondary-live on the ground", kind: "text-label", paint: r("secondary-live"), over: GROUND },
  { id: "summary-edge", source: "summary block: the 2px edge, bg-secondary-live, on the ground", kind: "solid", paint: r("secondary-live"), over: GROUND },
  { id: "summary-line", source: "summary block: a line, type-body text-text-body on the ground", kind: "text-body", paint: r("text-body"), over: GROUND },
  { id: "summary-footer", source: "summary block: footer type-overline text-text-label on the ground", kind: "text-label", paint: r("text-label"), over: GROUND },
  { id: "summary-caption", source: "summary block: caption type-caption text-text-secondary on the ground", kind: "text-secondary", paint: r("text-secondary"), over: GROUND },
  { id: "summary-error", source: "summary block error: type-body text-critical-text on the ground", kind: "text-label", paint: r("critical-text"), over: GROUND },
  { id: "summary-loading-bar", source: "summary block loading: a bar, bg-running-surface, on the ground", kind: "surface", paint: r("running-surface"), over: GROUND },

  // ── Prose and CodeBlock ─────────────────────────────────────────────────────────────────────
  { id: "prose-link", source: "prose: a, text-primary-text underline, on the ground", kind: "text-label", paint: r("primary-text"), over: GROUND },
  { id: "prose-quote", source: "prose: blockquote text-text-secondary on the ground", kind: "text-secondary", paint: r("text-secondary"), over: GROUND },
  { id: "prose-head", source: "prose: th type-overline text-text-label, and a list marker, on the ground", kind: "text-label", paint: r("text-label"), over: GROUND },
  { id: "prose-code", source: "prose: inline code, type-code-inline text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
  { id: "code-block-text", source: "code block: type-code-inline text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },

  // ── StatusOrb (component knobs, chat.json) ──────────────────────────────────────────────────
  // Dots, halos and rings are marks (solid, Lc 30); glyphs are drawn ink (text-label, Lc 60).
  ...[["ground", GROUND], ["raised", RAISED]].flatMap(([on, stack]) => [
    { id: `orb-live-${on}`, source: "status orb thinking and working: --c-status-orb-working (secondary-live)", kind: "solid", paint: r("c-status-orb-working"), over: stack },
    { id: `orb-idle-${on}`, source: "status orb idle and offline: --c-status-orb-idle (text-label), a square", kind: "solid", paint: r("c-status-orb-idle"), over: stack },
    ...(on === "raised" ? [] : [{ id: `orb-glyph-${on}`, source: "status orb queued, paused, stopped: the glyph in --c-status-orb-queued (text-label)", kind: "text-label", paint: r("c-status-orb-queued"), over: stack }]),
    { id: `orb-done-${on}`, source: "status orb done: the check glyph in --c-status-orb-done (success-foreground)", kind: "text-label", paint: r("c-status-orb-done"), over: stack },
    ...(on === "raised" ? [] : [{ id: `orb-failed-${on}`, source: "status orb failed: the glyph in --c-status-orb-failed (critical-text)", kind: "text-label", paint: r("c-status-orb-failed"), over: stack }]),
    // The needs-you square reads by its yellow on graphite and by its ink outline on stone; each
    // part is measured on the ground where it carries the shape.
    { id: `orb-needs-you-${on}`, modes: "graphite", source: "status orb needs-you on graphite: the square in --c-status-orb-needs-you (the yellow)", kind: "solid", paint: r("c-status-orb-needs-you"), over: stack },
    { id: `orb-needs-you-edge-${on}`, modes: "stone", source: "status orb needs-you on stone: the 1px outline in --c-status-orb-needs-you-edge (the yellow's ink)", kind: "solid", paint: r("c-status-orb-needs-you-edge"), over: stack },
  ]),

  // ── IndicatorMark (component knobs, chat.json) ──────────────────────────────────────────────
  ...[["ground", GROUND], ["raised", RAISED], ["soft", SOFT]].flatMap(([on, stack]) => [
    { id: `indicator-unread-${on}`, source: "indicator unread: the 6px square in --c-indicator-unread (text-body)", kind: "solid", paint: r("c-indicator-unread"), over: stack },
    { id: `indicator-attention-${on}`, modes: "graphite", source: "indicator attention on graphite: the square in --c-indicator-attention (the yellow)", kind: "solid", paint: r("c-indicator-attention"), over: stack },
    { id: `indicator-attention-edge-${on}`, modes: "stone", source: "indicator attention on stone: the 1px ring in --c-indicator-attention-edge (the yellow's ink)", kind: "solid", paint: r("c-indicator-attention-edge"), over: stack },
  ]),
  { id: "indicator-unread-count", source: "indicator badge unread: the count in --c-indicator-unread-badge-ink on --c-indicator-unread-badge-bg", kind: "on-fill", paint: r("c-indicator-unread-badge-ink"), over: [...GROUND, r("c-indicator-unread-badge-bg")] },
  { id: "indicator-attention-count", source: "indicator badge attention: the count in --c-indicator-attention-badge-ink on --c-indicator-attention-badge-bg", kind: "on-fill", paint: r("c-indicator-attention-badge-ink"), over: [...GROUND, r("c-indicator-attention-badge-bg")] },

  // ── RunTrace ────────────────────────────────────────────────────────────────────────────────
  { id: "trace-running", source: "run trace: the running step's label, type-meta text-secondary-live, on the ground", kind: "text-label", paint: r("secondary-live"), over: GROUND },
  { id: "trace-step", source: "run trace: a step's label, type-meta text-text-body, on the ground", kind: "text-body", paint: r("text-body"), over: GROUND },
  { id: "trace-reasoning", source: "run trace: reasoning, type-caption text-text-secondary, on the ground", kind: "text-secondary", paint: r("text-secondary"), over: GROUND },
  { id: "trace-failed", source: "run trace: the failed count, text-critical-text, on the ground", kind: "text-label", paint: r("critical-text"), over: GROUND },

  // ── AgentPrompt (the needs-you look, Figma 15:517) ──────────────────────────────────────────
  { id: "prompt-ink", source: "agent prompt waiting: overline, body, timer and text options in text-needs-you-on-fill on bg-needs-you-fill", kind: "on-fill", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  { id: "prompt-row-solid", source: "agent prompt row, the safe one: text-needs-you-fill on bg-needs-you-on-fill", kind: "on-fill", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill")] },
  { id: "prompt-row-solid-hover", source: "agent prompt row, the safe one: hover:bg-needs-you-on-fill/90", kind: "on-fill", paint: r("needs-you-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.9)] },
  { id: "prompt-row-hover", source: "agent prompt row: text-needs-you-on-fill under hover:bg-needs-you-on-fill/5", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.05)] },
  { id: "prompt-row-press", source: "agent prompt row: text-needs-you-on-fill under active:bg-needs-you-on-fill/9", kind: "on-fill", paint: r("needs-you-on-fill"), over: [...NEEDS_YOU, r("needs-you-on-fill", 0.09)] },
  { id: "prompt-row-edge", source: "agent prompt row: inset-ring-needs-you-on-fill, the 1px edge of a row that is not the safe one", kind: "border-rest", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  { id: "prompt-kbd", source: "agent prompt key hint on the yellow: text-inherit (the yellow's ink) on bg-transparent", kind: "on-fill", paint: r("needs-you-on-fill"), over: NEEDS_YOU },
  { id: "prompt-answered-body", source: "agent prompt answered: text-text-body on bg-surface-raised", kind: "text-body", paint: r("text-body"), over: RAISED },
]

// Nothing here misses: see the list at the top for the Figma pairs the core reports.
export const exceptions = []
