#!/usr/bin/env node
// Contrast gate: every pair the system paints, judged by what it is for, in all 8 modes
// (4 apps × 2 grounds). APCA first, WCAG 2 for borders and rings (docs/02-tokens.md → Contrast).
//
// The method is Emphasis Engine's (snds/emphasis-engine, docs/architecture.md): measure outcomes,
// not variables. A recipe is a pair as a component paints it, through its own opacity modifiers
// and mixes (a hover wash, a solid at 90%), over the stack it sits on. Its element kind sets its
// floor.
//
// What it reads: dist/tokens.css (run scripts/build.mjs first; `pnpm test` does). For each mode
// it takes the variables a browser would see (the app's theme slots, then the ground's roles) and
// follows var() chains across all three tiers, so the numbers are the ones a browser renders.
//
// Figma is the source of truth for the theme values. A Figma value that misses a floor is not
// changed here and not hidden: it is listed by name under "Exceptions" with what it measures,
// reported and not gated, for Sean to decide. Everything else is gated. An exception that starts
// passing fails the run, so the list cannot go stale.
//
// Recipes: the core table below, plus every file in scripts/recipes/*.mjs (one per component
// area; see scripts/recipes/README.md).
//
// Colour math is in scripts/lib/color.mjs. APCA Lc comes from the reference `apca-w3` package
// (devDependency; licensed for checking web content). Nothing from it is copied here.
//
// Run: pnpm --filter @unicron/tokens contrast · exit 1 on any miss that is not a named exception.
//   --rows[=text]         also print one row per recipe and mode (drawn colours, WCAG, APCA),
//                         for every recipe or only those whose id contains `text`
//   --print-exceptions    print every miss as an exception entry, to paste and then justify
//   --write-docs          write the short table of exceptions into docs/02-tokens.md (every run
//                         checks that table against its own numbers, and fails when it differs)

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { APCAcontrast, sRGBtoY } from "apca-w3"

import { composite, difference, hex, oklabL, parseColor, to8, toSrgb, wcagRatio } from "./lib/color.mjs"
import { allModes, modeVars, parseTokensCss, resolveValue } from "./lib/css.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const rowsArg = args.find((a) => a === "--rows" || a.startsWith("--rows="))
const printExceptions = args.includes("--print-exceptions")

// ── Floors, by element kind ──────────────────────────────────────────────────────────────────
// The text floors are the direction's (design-direction-2026-11 §2, APCA 0.0.98G): the Figma
// values were solved to them against the ground. A floor belongs to what a paint is for.
const KINDS = {
  "text-body": { metric: "lc", min: 90, rule: "body text" },
  "text-secondary": { metric: "lc", min: 75, rule: "secondary text" },
  "text-label": { metric: "lc", min: 60, rule: "labels and coloured text" },
  "text-display": { metric: "lc", min: 45, rule: "large display, 36px and up" },
  "on-fill": { metric: "lc", min: 75, rule: "text on a fill" },
  solid: { metric: "lc", min: 30, rule: "a solid against what it sits on" },
  // Non-text keeps the WCAG 1.4.11 ratio: APCA has no calibrated target for thin lines and rings.
  focus: { metric: "ratio", min: 3, rule: "a focus ring or focus border, 3:1 (WCAG 1.4.11)" },
  "border-error": { metric: "ratio", min: 3, rule: "an error border, 3:1 (WCAG 1.4.11)" },
  // The edge that alone shows a control, where nothing else (a glyph, a knob, a label inside it)
  // does: an unchecked checkbox. WCAG 1.4.11 holds it to 3:1, as a focus or error border.
  "control-edge": { metric: "ratio", min: 3, rule: "the edge that alone shows a control, 3:1 (WCAG 1.4.11)" },
  // Reported, not gated.
  "text-faint": { metric: "lc" }, // the direction sets no target for the faintest ink
  "border-rest": { metric: "ratio" }, // a field's resting border is a hairline (contract §9.4)
  "border-decorative": { metric: "dL" },
  state: { metric: "dL" },
  surface: { metric: "dL" },
}
// Kind names from before 1.0, for recipe files written against the old table. `border-control`
// has no successor: a resting border is `border-rest` (reported), a focus or error border is
// `focus` or `border-error` (3:1).
const KIND_ALIASES = { "text-primary": "text-body", "text-on-tint": "text-label", "on-solid": "on-fill" }

// ── Recipes ──────────────────────────────────────────────────────────────────────────────────
// A paint is a role, a role at an opacity (Tailwind's `/90` is color-mix towards transparent), or
// a two-role mix. `over` is the stack it sits on, bottom first. Measured as a browser draws it:
// each layer composited over the one below, then the paint over the top.
const r = (role, alpha) => ({ role, alpha })
const mix = (a, b, k) => ({ mix: [a, b], k })

const GROUND = [r("surface-ground")]
const RAISED = [r("surface-raised")]
const SOFT = [r("primary-soft")]
const BASES = [["ground", GROUND], ["raised", RAISED]]
// The three neutral text levels, and the kind that gates each.
const LEVELS = [["body", "text-body"], ["secondary", "text-secondary"], ["label", "text-label"]]

const CORE = [
  // ── Figma roles, as the components draw them ──
  // Surfaces (reported)
  { id: "raised", source: "bg-surface-raised on the ground: a field, a card, a menu", kind: "surface", paint: r("surface-raised"), over: GROUND },
  { id: "primary-soft", source: "bg-primary-soft on the ground: a selected row, the current nav item", kind: "surface", paint: r("primary-soft"), over: GROUND },
  { id: "primary-soft-raised", source: "bg-primary-soft on a raised surface", kind: "surface", paint: r("primary-soft"), over: RAISED },
  { id: "critical-soft", source: "bg-critical-soft on the ground: a critical banner", kind: "surface", paint: r("critical-soft"), over: GROUND },

  // The three neutral text levels on every surface they share
  ...LEVELS.flatMap(([level, kind]) => [
    { id: `${level}-ground`, source: `text-text-${level} on the ground`, kind, paint: r(`text-${level}`), over: GROUND },
    { id: `${level}-raised`, source: `text-text-${level} on bg-surface-raised`, kind, paint: r(`text-${level}`), over: RAISED },
    { id: `${level}-soft`, source: `text-text-${level} in a selected row (bg-primary-soft)`, kind, paint: r(`text-${level}`), over: SOFT },
  ]),
  { id: "body-critical-soft", source: "a critical banner's title: text-text-body on bg-critical-soft", kind: "text-body", paint: r("text-body"), over: [r("critical-soft")] },
  { id: "secondary-critical-soft", source: "a critical banner's body: text-text-secondary on bg-critical-soft", kind: "text-secondary", paint: r("text-secondary"), over: [r("critical-soft")] },
  // The faintest ink (reported: no target)
  { id: "faint-ground", source: "text-text-faint on the ground: an index number", kind: "text-faint", paint: r("text-faint"), over: GROUND },
  { id: "faint-raised", source: "text-text-faint on bg-surface-raised", kind: "text-faint", paint: r("text-faint"), over: RAISED },
  { id: "faint-soft", source: "text-text-faint on the current nav item (bg-primary-soft)", kind: "text-faint", paint: r("text-faint"), over: SOFT },

  // Identity
  { id: "primary-text-ground", source: "text-primary-text on the ground", kind: "text-label", paint: r("primary-text"), over: GROUND },
  { id: "primary-text-raised", source: "text-primary-text on bg-surface-raised", kind: "text-label", paint: r("primary-text"), over: RAISED },
  { id: "primary-text-soft", source: "text-primary-text, or an icon, on bg-primary-soft", kind: "text-label", paint: r("primary-text"), over: SOFT },
  { id: "primary-display-ground", source: "text-primary-display on the ground, 36px and up", kind: "text-display", paint: r("primary-display"), over: GROUND },
  { id: "primary-display-raised", source: "text-primary-display on bg-surface-raised, 36px and up", kind: "text-display", paint: r("primary-display"), over: RAISED },
  { id: "primary-on-fill", source: "the primary button: bg-primary-fill text-primary-on-fill", kind: "on-fill", paint: r("primary-on-fill"), over: [r("primary-fill")] },
  { id: "primary-fill-ground", source: "bg-primary-fill on the ground: the primary button, the create button, a switch that is on", kind: "solid", paint: r("primary-fill"), over: GROUND },
  { id: "primary-fill-raised", source: "bg-primary-fill on bg-surface-raised: the tab indicator, the selected-row edge", kind: "solid", paint: r("primary-fill"), over: RAISED },
  { id: "primary-edge-soft", source: "the 2px primary-fill edge of a selected row, against bg-primary-soft", kind: "solid", paint: r("primary-fill"), over: SOFT },

  // Live activity
  { id: "live-ground", source: "text-secondary-live on the ground: live status text", kind: "text-label", paint: r("secondary-live"), over: GROUND },
  { id: "live-raised", source: "text-secondary-live on bg-surface-raised: an agent message's meta", kind: "text-label", paint: r("secondary-live"), over: RAISED },
  { id: "live-soft", source: "text-secondary-live in a selected row (bg-primary-soft)", kind: "text-label", paint: r("secondary-live"), over: SOFT },
  { id: "live-mark-ground", source: "bg-secondary-live on the ground: the live mark", kind: "solid", paint: r("secondary-live"), over: GROUND },
  { id: "live-mark-raised", source: "bg-secondary-live on bg-surface-raised", kind: "solid", paint: r("secondary-live"), over: RAISED },
  { id: "live-progress", source: "progress: bg-secondary-live, the filled part, against bg-line-rule, the empty part", kind: "solid", paint: r("secondary-live"), over: [r("line-rule")] },

  // Needs you
  { id: "needs-you-on-fill", source: "the needs-you block: bg-needs-you-fill text-needs-you-on-fill", kind: "on-fill", paint: r("needs-you-on-fill"), over: [r("needs-you-fill")] },
  { id: "needs-you-button", source: "the solid needs-you button: bg-needs-you-on-fill text-needs-you-fill", kind: "on-fill", paint: r("needs-you-fill"), over: [r("needs-you-on-fill")] },
  { id: "needs-you-fill-ground", source: "bg-needs-you-fill on the ground: the block, a strip, a mark", kind: "solid", paint: r("needs-you-fill"), over: GROUND },
  { id: "needs-you-fill-raised", source: "bg-needs-you-fill on bg-surface-raised", kind: "solid", paint: r("needs-you-fill"), over: RAISED },

  // Critical
  { id: "critical-on-fill", source: "the destructive button: bg-critical-fill text-critical-on-fill", kind: "on-fill", paint: r("critical-on-fill"), over: [r("critical-fill")] },
  { id: "critical-text-ground", source: "text-critical-text on the ground: a field's error line", kind: "text-label", paint: r("critical-text"), over: GROUND },
  { id: "critical-text-raised", source: "text-critical-text on bg-surface-raised", kind: "text-label", paint: r("critical-text"), over: RAISED },
  { id: "critical-text-soft", source: "a critical banner's icon: text-critical-text on bg-critical-soft", kind: "text-label", paint: r("critical-text"), over: [r("critical-soft")] },
  { id: "critical-fill-ground", source: "bg-critical-fill on the ground", kind: "solid", paint: r("critical-fill"), over: GROUND },
  { id: "critical-fill-raised", source: "bg-critical-fill on bg-surface-raised", kind: "solid", paint: r("critical-fill"), over: RAISED },

  // Focus and error borders hold 3:1 against both sides of the edge. A field's resting border is
  // a hairline: reported, not gated (contract §9.4).
  { id: "field-focus-raised", source: "a text field's focus border: 2px primary-fill, against its bg-surface-raised box", kind: "focus", paint: r("primary-fill"), over: RAISED },
  { id: "field-focus-ground", source: "a text field's focus border, against the ground outside it", kind: "focus", paint: r("primary-fill"), over: GROUND },
  { id: "field-error-raised", source: "an invalid field's border: 2px critical-fill, against its bg-surface-raised box", kind: "border-error", paint: r("critical-fill"), over: RAISED },
  { id: "field-error-ground", source: "an invalid field's border, against the ground outside it", kind: "border-error", paint: r("critical-fill"), over: GROUND },
  { id: "field-rest-raised", source: "a field's resting border: 1px line-rule, against its bg-surface-raised box", kind: "border-rest", paint: r("line-rule"), over: RAISED },
  { id: "field-rest-ground", source: "a field's resting border, against the ground outside it", kind: "border-rest", paint: r("line-rule"), over: GROUND },
  { id: "ring-ground", source: "focus-visible: a solid 2px outline in --ring, on the ground", kind: "focus", paint: r("ring"), over: GROUND },
  { id: "ring-raised", source: "focus-visible outline on bg-surface-raised", kind: "focus", paint: r("ring"), over: RAISED },
  { id: "ring-soft", source: "focus-visible outline beside a selected row (bg-primary-soft)", kind: "focus", paint: r("ring"), over: SOFT },
  { id: "ring-needs-you", source: "focus-visible inside a needs-you block: needs-you-on-fill on bg-needs-you-fill", kind: "focus", paint: r("needs-you-on-fill"), over: [r("needs-you-fill")] },

  // Separators (reported)
  { id: "rule-ground", source: "border-line-rule on the ground", kind: "border-decorative", paint: r("line-rule"), over: GROUND },
  { id: "rule-raised", source: "border-line-rule on bg-surface-raised", kind: "border-decorative", paint: r("line-rule"), over: RAISED },
  { id: "grid-dot-ground", source: "bg-line-grid-dot on the ground: the dot grid, a sheet's grabber", kind: "border-decorative", paint: r("line-grid-dot"), over: GROUND },

  // ── States (contract §6: not drawn in Figma) ──
  // Hover and pressed are washes of the ink over whatever is underneath. Text must hold its floor
  // on the washed surface too.
  ...BASES.flatMap(([base, stack]) =>
    [["hover", "state-hover"], ["pressed", "state-pressed"]].flatMap(([state, wash]) =>
      LEVELS.map(([level, kind]) => ({
        id: `${level}-${base}-${state}`, source: `text-text-${level} on a ${state} row or control (bg-${wash}) over ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind, paint: r(`text-${level}`), over: [...stack, r(wash)],
      }))
    )
  ),
  ...LEVELS.map(([level, kind]) => ({
    id: `${level}-soft-hover`, source: `text-text-${level} in a selected row under the pointer (bg-primary-soft, then bg-state-hover)`, kind, paint: r(`text-${level}`), over: [...SOFT, r("state-hover")],
  })),
  // The opaque hover and highlight fill (the shadcn `accent`): 8% of the ink in surface-raised.
  ...LEVELS.map(([level, kind]) => ({
    id: `${level}-accent`, source: `text-text-${level} on a highlighted menu or list item (bg-accent)`, kind, paint: r(`text-${level}`), over: [r("accent")],
  })),
  { id: "critical-text-accent", source: "text-destructive on a highlighted menu item (bg-accent)", kind: "text-label", paint: r("critical-text"), over: [r("accent")] },
  // A solid shows hover as itself at 90% over what is behind it, and pressed at 80%.
  ...BASES.flatMap(([base, stack]) =>
    [["hover", 0.9], ["pressed", 0.8]].flatMap(([state, alpha]) => [
      { id: `primary-on-fill-${state}-${base}`, source: `the primary button, ${state}: bg-primary-fill/${alpha * 100} over ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "on-fill", paint: r("primary-on-fill"), over: [...stack, r("primary-fill", alpha)] },
      { id: `critical-on-fill-${state}-${base}`, source: `the destructive button, ${state}: bg-critical-fill/${alpha * 100} over ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "on-fill", paint: r("critical-on-fill"), over: [...stack, r("critical-fill", alpha)] },
    ])
  ),
  ...[["hover", 0.9], ["pressed", 0.8]].map(([state, alpha]) => ({
    id: `needs-you-button-${state}`, source: `the solid needs-you button, ${state}: bg-needs-you-on-fill/${alpha * 100} over the yellow block`, kind: "on-fill", paint: r("needs-you-fill"), over: [r("needs-you-fill"), r("needs-you-on-fill", alpha)],
  })),
  // Diffs (contract §1.4; cross-app decisions §11): a line's text, with its + or − mark, on the
  // added wash (neutral, 8% of the ink in the ground) and the removed wash (critical-soft).
  ...[["added", "+"], ["removed", "−"]].flatMap(([line, sign]) => [
    { id: `body-diff-${line}`, source: `a diff's ${line} line and its ${sign} mark: text-text-body on bg-diff-${line}`, kind: "text-body", paint: r("text-body"), over: [r(`diff-${line}`)] },
    { id: `diff-${line}`, source: `bg-diff-${line} against the ground: how far the line stands out`, kind: "surface", paint: r(`diff-${line}`), over: GROUND },
  ]),
  // How far a state moves the surface (reported)
  { id: "hover-ground", source: "bg-state-hover against the ground at rest", kind: "state", paint: r("state-hover"), over: GROUND },
  { id: "hover-raised", source: "bg-state-hover against bg-surface-raised at rest", kind: "state", paint: r("state-hover"), over: RAISED },
  { id: "pressed-vs-hover", source: "bg-state-pressed against bg-state-hover, on bg-surface-raised", kind: "state", paint: r("state-pressed"), over: [...RAISED, r("state-hover")] },
  { id: "accent-raised", source: "bg-accent against bg-surface-raised: a highlighted item in a menu", kind: "state", paint: r("accent"), over: RAISED },
  { id: "primary-hover", source: "bg-primary-fill/90 against the fill at rest", kind: "state", paint: r("surface-ground", 0.1), over: [r("primary-fill")] },

  // ── Roles the tokens package solves (not Figma's, not plain aliases) ──
  // A plain alias (background, foreground, muted-foreground, primary, running, attention …) is
  // not measured twice: scripts/check.mjs pins each to its Figma role, and that role is above.
  //
  // Status roles: done, waiting on you. The foreground is coloured text, on every surface a status
  // sits on, its own wash included. The fill carries no text (a mark, an orb, a bar), so it is a
  // solid.
  ...["success", "attention"].flatMap((role) => [
    ...BASES.map(([base, stack]) => ({
      id: `${role}-text-${base}`, source: `text-${role}-foreground on ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "text-label", paint: r(`${role}-foreground`), over: stack,
    })),
    { id: `${role}-text-soft`, source: `text-${role}-foreground in a selected row (bg-primary-soft)`, kind: "text-label", paint: r(`${role}-foreground`), over: SOFT },
    { id: `${role}-text-surface`, source: `bg-${role}-surface text-${role}-foreground`, kind: "text-label", paint: r(`${role}-foreground`), over: [r(`${role}-surface`)] },
    // `attention` on the ground and on a raised surface is needs-you-fill-ground and -raised, above.
    ...(role === "attention" ? [] : BASES).map(([base, stack]) => ({
      id: `${role}-on-${base}`, source: `bg-${role} (a mark, an orb, a bar) on ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "solid", paint: r(role), over: stack,
    })),
    { id: `${role}-on-soft`, source: `bg-${role} (a mark, an orb, a bar) in a selected row (bg-primary-soft)`, kind: "solid", paint: r(role), over: SOFT },
    { id: `${role}-on-surface`, source: `bg-${role} on bg-${role}-surface`, kind: "solid", paint: r(role), over: [r(`${role}-surface`)] },
    { id: `${role}-surface`, source: `bg-${role}-surface on the ground`, kind: "surface", paint: r(`${role}-surface`), over: GROUND },
  ]),
  // Working now: `running` and `running-foreground` are secondary-live, measured above as live-*.
  // Its wash is the contract's mix (§1.4), so the pairs on it are measured here.
  { id: "running-text-surface", source: "bg-running-surface text-running-foreground", kind: "text-label", paint: r("running-foreground"), over: [r("running-surface")] },
  { id: "running-on-surface", source: "bg-running on bg-running-surface", kind: "solid", paint: r("running"), over: [r("running-surface")] },
  { id: "running-surface", source: "bg-running-surface on the ground", kind: "surface", paint: r("running-surface"), over: GROUND },
  // Warning and info are fills that hold a label, and inks for a glyph or a digit on a surface.
  ...["warning", "info"].flatMap((fill) => [
    { id: `${fill}-fg`, source: `bg-${fill} text-${fill}-foreground`, kind: "on-fill", paint: r(`${fill}-foreground`), over: [r(fill)] },
    ...BASES.map(([base, stack]) => ({
      id: `${fill}-on-${base}`, source: `bg-${fill}, or text-${fill}, on ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "text-label", paint: r(fill), over: stack,
    })),
    { id: `${fill}-on-soft`, source: `bg-${fill} in a selected row (bg-primary-soft)`, kind: "solid", paint: r(fill), over: SOFT },
  ]),
  // The inverted surface (CrownJewel): the ground's colour as ink on the ink's colour.
  { id: "protected-fg", source: "bg-protected text-protected-foreground", kind: "on-fill", paint: r("protected-foreground"), over: [r("protected")] },
  // Progress fills that are not the live one (live-progress, above), on the empty part of the bar.
  ...["success", "warning", "destructive"].map((role) => ({
    id: `progress-${role}`, source: `progress: bg-(--c-progress-*) = ${role}, against bg-line-rule, the empty part`, kind: "solid", paint: r(role), over: [r("line-rule")],
  })),

  // ── Legacy accent ramps as text ──
  // Apps alias the accent hues from their own layers and draw them as text on the legacy neutral
  // ramp: 600 in light and 300 in dark (red: 700 and 200), held to Lc 75 as before. Not themed,
  // so measured once per ground.
  ...["blue", "coral", "green", "amber", "red"].flatMap((hue) => [
    ...["0", "50", "100"].map((step) => ({
      id: `${hue}-text-on-${step}`, source: `${hue}.${hue === "red" ? 700 : 600} as text on neutral.${step}`, kind: "text-secondary", themed: false, modes: ["stone"], paint: r(`g-${hue}-${hue === "red" ? 700 : 600}`), over: [r(`g-neutral-${step}`)],
    })),
    ...["950", "900", "800"].map((step) => ({
      id: `${hue}-text-on-${step}`, source: `${hue}.${hue === "red" ? 200 : 300} as text on neutral.${step}`, kind: "text-secondary", themed: false, modes: ["graphite"], paint: r(`g-${hue}-${hue === "red" ? 200 : 300}`), over: [r(`g-neutral-${step}`)],
    })),
  ]),
]

// ── Emphasis levels ──────────────────────────────────────────────────────────────────────────
// A floor only says how faint a role may get. The three neutral text levels also have to read
// apart, or a screen's hierarchy flattens: each at least Lc 10 from the next on every surface
// they share. The coded gap stands in for the drawn one; apps check the levels as drawn.
const LEVEL_GAP = 10
const LEVEL_PAIRS = ["ground", "raised", "soft"].flatMap((s) => [[`body-${s}`, `secondary-${s}`], [`secondary-${s}`, `label-${s}`]])

// ── Must differ (reported, not gated) ────────────────────────────────────────────────────────
// Two watch items from the decision record: Lockdown's green can read as "success", and Synapse's
// magenta sits close to critical red. Each row measures how far apart the two colours are.
const MUST_DIFFER = [
  { app: "lockdown", a: "primary-fill", b: "success", why: "the identity green beside the success fill" },
  { app: "lockdown", a: "primary-text", b: "success-foreground", why: "the identity as text beside success text" },
  { app: "lockdown", a: "primary-soft", b: "success-surface", why: "a selected row beside a success wash" },
  { app: "synapse", a: "primary-fill", b: "critical-fill", why: "the identity magenta beside the critical fill" },
  { app: "synapse", a: "primary-text", b: "critical-text", why: "the identity as text beside error text" },
  { app: "synapse", a: "primary-soft", b: "critical-soft", why: "a selected row beside a critical banner" },
  { app: "synapse", a: "primary-fill", b: "critical-soft", why: "the selected-row edge on a critical wash" },
  { app: "synapse", a: "primary-soft", b: "critical-fill", why: "a critical edge or button on a selected row" },
]
// A reading aid, not a floor. ΔEOK is the distance between two colours in OKLab, where about 0.02
// is the least difference an eye picks up side by side. Under 0.05 two colours read as the same
// at a glance; under 0.15 they are close enough to be taken for each other when seen apart.
const SAME = 0.05
const CLOSE = 0.15

// ── Exceptions (reported, not gated) ─────────────────────────────────────────────────────────
// A Figma value under its floor. The value is Figma's and stays as it is; the miss is listed with
// what it measures. `modes` is "all", a ground ("graphite", "stone"), or mode names. The list
// must match the misses exactly: an entry that no longer misses fails the run.
const FIGMA = "Figma value, flagged for Sean"
const ON_STATE = "Figma value under a contract state (§6), flagged for Sean"
const BY_CONTRACT = "Figma value in a contract role (§1.4), flagged for Sean"
const g = (app) => `${app} / graphite`
const st = (app) => `${app} / stone`
const EXCEPTIONS = [
  // Figma solved each text role against the ground, with no room to spare (on the graphite
  // ground, label measures Lc 60.4 to 60.7). On any surface nearer the text's own lightness it
  // lands just under.
  { id: "label-raised", modes: "graphite", reason: FIGMA },
  { id: "label-soft", modes: "all", reason: FIGMA },
  { id: "body-soft", modes: "stone", reason: FIGMA },
  { id: "body-critical-soft", modes: "stone", reason: FIGMA },
  { id: "primary-text-raised", modes: [g("warpcore"), g("synapse")], reason: FIGMA },
  { id: "primary-text-soft", modes: ["graphite", st("lockdown")], reason: FIGMA },
  { id: "primary-display-raised", modes: [g("vale"), g("lockdown"), g("synapse")], reason: FIGMA },
  { id: "live-raised", modes: [g("vale"), g("lockdown")], reason: FIGMA },
  { id: "live-soft", modes: ["graphite", st("warpcore"), st("synapse")], reason: FIGMA },
  { id: "critical-text-raised", modes: "graphite", reason: FIGMA },
  { id: "critical-text-soft", modes: "graphite", reason: FIGMA },
  // In stone, body and secondary text sit Lc 9.6 to 9.8 apart, a little under the 10 that keeps
  // two levels reading as two.
  { id: "gap:body-ground/secondary-ground", modes: "stone", reason: FIGMA },
  { id: "gap:body-raised/secondary-raised", modes: "stone", reason: FIGMA },
  { id: "gap:body-soft/secondary-soft", modes: "stone", reason: FIGMA },
  // The solid fills are mid-lightness (OKLCH L about 52 in graphite), so against the graphite
  // surfaces they measure Lc 19 to 27, under the Lc 30 a solid needs to show by lightness alone.
  { id: "primary-fill-ground", modes: "graphite", reason: FIGMA },
  { id: "primary-fill-raised", modes: "graphite", reason: FIGMA },
  { id: "primary-edge-soft", modes: "graphite", reason: FIGMA },
  { id: "critical-fill-ground", modes: "graphite", reason: FIGMA },
  { id: "critical-fill-raised", modes: "graphite", reason: FIGMA },
  // The yellow is as light as the stone surfaces: it differs from them by hue, not lightness.
  { id: "needs-you-fill-ground", modes: "stone", reason: FIGMA },
  { id: "needs-you-fill-raised", modes: "stone", reason: FIGMA },
  // The same fills as 2px borders: a field's focus border (primary-fill) and its error border
  // (critical-fill) are under 3:1 against the graphite surfaces.
  { id: "field-focus-raised", modes: [g("warpcore"), g("vale"), g("synapse")], reason: FIGMA },
  { id: "field-focus-ground", modes: [g("warpcore"), g("synapse")], reason: FIGMA },
  { id: "field-error-raised", modes: "graphite", reason: FIGMA },
  { id: "field-error-ground", modes: "graphite", reason: FIGMA },

  // The contract's states (§6, a proposal for Sean): a hover or pressed wash of the ink, the opaque
  // highlight fill, a solid at 80% when pressed. Each moves the surface towards the text, and the
  // Figma values have no room for that.
  { id: "body-ground-hover", modes: "stone", reason: ON_STATE },
  { id: "label-ground-hover", modes: "graphite", reason: ON_STATE },
  { id: "body-ground-pressed", modes: "stone", reason: ON_STATE },
  { id: "secondary-ground-pressed", modes: "stone", reason: ON_STATE },
  { id: "label-ground-pressed", modes: "all", reason: ON_STATE },
  { id: "label-raised-hover", modes: "graphite", reason: ON_STATE },
  { id: "body-raised-pressed", modes: "stone", reason: ON_STATE },
  { id: "secondary-raised-pressed", modes: "graphite", reason: ON_STATE },
  { id: "label-raised-pressed", modes: ["graphite", st("warpcore")], reason: ON_STATE },
  { id: "body-soft-hover", modes: "stone", reason: ON_STATE },
  { id: "secondary-soft-hover", modes: ["stone", g("vale"), g("lockdown")], reason: ON_STATE },
  { id: "label-soft-hover", modes: "all", reason: ON_STATE },
  { id: "body-accent", modes: "stone", reason: ON_STATE },
  { id: "label-accent", modes: "graphite", reason: ON_STATE },
  { id: "critical-text-accent", modes: "graphite", reason: ON_STATE },
  { id: "primary-on-fill-pressed-ground", modes: [st("lockdown")], reason: ON_STATE },
  { id: "primary-on-fill-pressed-raised", modes: [st("vale"), st("lockdown")], reason: ON_STATE },

  // Contract §1.4 points `attention` at the yellow on both grounds, and makes the running wash
  // 14% of the live colour in the ground.
  { id: "attention-on-soft", modes: "stone", reason: BY_CONTRACT },
  { id: "attention-on-surface", modes: "stone", reason: BY_CONTRACT },
  { id: "running-text-surface", modes: "all", reason: BY_CONTRACT },
  // Diffs: the added wash is the contract's neutral wash (§1.4, 8% of the ink in the ground), so
  // body text on it lands where it does on a hover wash. The removed wash is Figma's critical-soft,
  // the critical Banner's own pair (body-critical-soft, above).
  { id: "body-diff-added", modes: "stone", reason: BY_CONTRACT },
  { id: "body-diff-removed", modes: "stone", reason: FIGMA },
]

// ── Recipe files, one per component area ─────────────────────────────────────────────────────
const recipeDir = path.join(here, "recipes")
const recipeFiles = fs.existsSync(recipeDir) ? fs.readdirSync(recipeDir).filter((f) => f.endsWith(".mjs")).sort() : []
const RECIPES = CORE.map((rec) => ({ ...rec, area: "core" }))
const ALL_EXCEPTIONS = EXCEPTIONS.map((e) => ({ ...e, area: "core" }))
for (const file of recipeFiles) {
  const area = path.basename(file, ".mjs")
  const mod = await import(pathToFileURL(path.join(recipeDir, file)).href)
  let list = mod.default ?? mod.recipes ?? mod.RECIPES
  if (typeof list === "function") list = list({ r, mix })
  if (!Array.isArray(list)) {
    throw new Error(`recipes/${file}: export default an array of recipes, or a function ({ r, mix }) => recipes (see scripts/recipes/README.md)`)
  }
  for (const rec of list) RECIPES.push({ ...rec, id: `${area}:${rec.id}`, area })
  for (const e of mod.exceptions ?? mod.EXCEPTIONS ?? []) ALL_EXCEPTIONS.push({ ...e, id: `${area}:${e.id}`, area })
}

// ── Modes ────────────────────────────────────────────────────────────────────────────────────
const parsed = parseTokensCss()
const MODES = allModes(parsed)
if (MODES.length !== 8) throw new Error(`expected 8 modes (4 apps × 2 grounds) in dist/tokens.css, found ${MODES.length}`)
// No data-theme attribute has to be a mode too: the defaults. Legacy, unthemed recipes run there.
const DEFAULTS = ["graphite", "stone"].map((ground) => ({ name: `default / ${ground}`, app: null, ground, vars: modeVars(parsed, null, ground) }))
const short = (mode) => (mode.app ?? "default").slice(0, 2) + "/" + mode.ground[0]

/** Which modes a recipe or an exception names: "all", a ground, an app, "light"/"dark", or mode names. */
function modeFilter(spec) {
  if (spec === undefined || spec === "all") return () => true
  const list = (Array.isArray(spec) ? spec : [spec]).map((s) => String(s).trim())
  const ground = { light: "stone", dark: "graphite" }
  return (mode) =>
    list.some((s) => {
      const g = ground[s] ?? s
      return g === mode.ground || s === mode.app || s.replace(/\s*\/\s*/, " / ") === mode.name
    })
}

/** A paint as written → { role, alpha } or { mix, k }. Strings are allowed: "text-body", "primary-fill/90". */
function paintOf(p, where) {
  if (typeof p === "string") {
    const [role, pct] = p.split("/")
    return pct === undefined ? { role } : { role, alpha: Number(pct) / 100 }
  }
  if (p && (typeof p.role === "string" || Array.isArray(p.mix))) return p
  throw new Error(`${where}: a paint is r(role, alpha), mix(a, b, k), or a string such as "primary-fill/90"`)
}

// ── Measure ──────────────────────────────────────────────────────────────────────────────────
/** A role, as a literal CSS colour, in one mode. */
function roleCss(role, mode) {
  const raw = mode.vars.get(`--${role}`)
  if (raw === undefined) throw new Error(`--${role} is not a token (${mode.name})`)
  return resolveValue(raw, mode.vars)
}

/** A paint → { rgb (0..255), alpha, clipped }. */
function paintColor(p, mode) {
  const css = p.mix
    ? `color-mix(in oklab, ${roleCss(p.mix[0], mode)}, ${roleCss(p.mix[1], mode)} ${p.k * 100}%)`
    : roleCss(p.role, mode)
  const lab = parseColor(css)
  const { rgb, clipped } = toSrgb(lab)
  return { rgb, alpha: lab.alpha * (p.alpha ?? 1), clipped }
}

/** The stack, bottom first, flattened to one opaque colour. A translucent base sits on the ground. */
function flatten(stack, mode) {
  let clipped = false
  const base = paintColor(stack[0], mode)
  clipped ||= base.clipped
  let rgb = base.rgb
  if (base.alpha < 1) rgb = composite(base.rgb, base.alpha, paintColor({ role: "surface-ground" }, mode).rgb)
  for (const layer of stack.slice(1)) {
    const c = paintColor(layer, mode)
    clipped ||= c.clipped
    rgb = composite(c.rgb, c.alpha, rgb)
  }
  return { rgb, clipped }
}

const label = (p) => (p.mix ? `mix(${p.mix[0]},${p.mix[1]} ${p.k * 100}%)` : p.alpha !== undefined ? `${p.role}/${Math.round(p.alpha * 100)}` : p.role)

const errors = []
const seenIds = new Set()
const rows = []
for (const rec of RECIPES) {
  if (seenIds.has(rec.id)) errors.push(`recipe id "${rec.id}" is used twice`)
  seenIds.add(rec.id)
  const kindName = KIND_ALIASES[rec.kind] ?? rec.kind
  const kind = KINDS[kindName]
  if (!kind) {
    const hint = rec.kind === "border-control" ? " (it was split: border-rest for a resting border, focus or border-error for one held to 3:1)" : ""
    throw new Error(`${rec.id}: unknown element kind "${rec.kind}"${hint}. Kinds: ${Object.keys(KINDS).join(", ")}`)
  }
  const paint = paintOf(rec.paint, rec.id)
  const over = (Array.isArray(rec.over) ? rec.over : [rec.over]).map((p) => paintOf(p, rec.id))
  const wanted = modeFilter(rec.modes)
  for (const mode of rec.themed === false ? DEFAULTS : MODES) {
    if (!wanted(mode)) continue
    let under, p
    try {
      under = flatten(over, mode)
      p = paintColor(paint, mode)
    } catch (error) {
      throw new Error(`${rec.id} (${mode.name}): ${error.message}`)
    }
    const drawn = to8(composite(p.rgb, p.alpha, under.rgb))
    const bg = to8(under.rgb)
    const lc = Math.abs(APCAcontrast(sRGBtoY(drawn), sRGBtoY(bg)))
    const ratio = wcagRatio(drawn, bg)
    const dL = Math.abs(oklabL(drawn) - oklabL(bg))
    const floor = kind.min ?? null
    const value = kind.metric === "lc" ? lc : kind.metric === "ratio" ? ratio : dL
    rows.push({
      id: rec.id, area: rec.area, mode, kind: kindName, metric: kind.metric, value, floor,
      meets: floor === null || value >= floor,
      paint: label(paint), on: over.map(label).join(" > "),
      fgHex: hex(drawn), bgHex: hex(bg), lc, ratio, dL,
      note: [rec.source, p.clipped || under.clipped ? "gamut-clamped" : null].filter(Boolean).join("; "),
    })
  }
}

// Emphasis levels, as rows of their own: the gap is the measure, LEVEL_GAP the floor.
for (const [hi, lo] of LEVEL_PAIRS) {
  for (const mode of MODES) {
    const a = rows.find((row) => row.mode === mode && row.id === hi)
    const b = rows.find((row) => row.mode === mode && row.id === lo)
    if (!a || !b) throw new Error(`levels: ${mode.name} ${hi} or ${lo} isn't measured`)
    const gap = a.lc - b.lc
    rows.push({
      id: `gap:${hi}/${lo}`, area: "core", mode, kind: "level-gap", metric: "gap", value: gap, floor: LEVEL_GAP, meets: gap >= LEVEL_GAP,
      paint: hi, on: lo, lc: gap, note: `Lc ${a.lc.toFixed(1)} over Lc ${b.lc.toFixed(1)}`,
    })
  }
}

// ── Exceptions against the misses ────────────────────────────────────────────────────────────
for (const row of rows) {
  if (row.floor === null) row.status = "info"
  else if (row.meets) row.status = "pass"
  else {
    const exception = ALL_EXCEPTIONS.find((e) => e.id === row.id && modeFilter(e.modes)(row.mode))
    row.status = exception ? "exception" : "FAIL"
    row.reason = exception?.reason
  }
}
for (const e of ALL_EXCEPTIONS) {
  if (!e.reason) errors.push(`exception "${e.id}" has no reason`)
  const covered = rows.filter((row) => row.id === e.id && modeFilter(e.modes)(row.mode))
  if (!covered.length) errors.push(`exception "${e.id}" names no measured recipe and mode`)
  for (const row of covered) {
    if (row.meets) errors.push(`exception "${e.id}" in ${row.mode.name} now clears its floor (${fmt(row)} against ${floorText(row)}): remove it from the list`)
  }
}

// ── Print ────────────────────────────────────────────────────────────────────────────────────
function fmt(row) {
  if (row.metric === "ratio") return `${row.value.toFixed(2)}:1`
  if (row.metric === "dL") return `ΔL ${row.value.toFixed(3)}`
  return `Lc ${row.value.toFixed(1)}`
}
function floorText(row) {
  if (row.floor === null) return "—"
  if (row.metric === "ratio") return `${row.floor}:1`
  return `Lc ${row.floor}`
}
const pad = (s, n, right = false) => (right ? String(s).padStart(n) : String(s).padEnd(n))
const cell = (row) => {
  if (!row) return "·"
  const missed = row.status === "FAIL" || row.status === "exception"
  // A miss that would round up to its floor is written with one more digit.
  const lcDigits = missed && Number(row.value.toFixed(1)) >= row.floor ? 2 : 1
  const n = row.metric === "dL" ? row.value.toFixed(3) : row.metric === "ratio" ? row.value.toFixed(2) : row.value.toFixed(lcDigits)
  return n + (row.status === "FAIL" ? "!" : row.status === "exception" ? "*" : "")
}

const columns = MODES
const head = `${pad("recipe", 34)} ${pad("kind", 17)} ${pad("floor", 6, true)}  ${columns.map((m) => pad(short(m), 7, true)).join(" ")}   source`
console.log(`contrast: ${RECIPES.length} recipes (${recipeFiles.length ? `core + ${recipeFiles.join(", ")}` : "core"}) in ${MODES.length} modes — ${MODES.map((m) => `${short(m)} = ${m.name}`).join(", ")}`)
console.log(`each cell is the measure in that mode: APCA Lc for text, fills and solids; a WCAG ratio for focus, error and resting borders; OKLCH ΔL for surfaces, states and separators.  * = named exception, reported   ! = miss`)
console.log(head)
console.log("-".repeat(head.length))
const ids = [...new Set(rows.map((row) => row.id))]
for (const id of ids) {
  const mine = rows.filter((row) => row.id === id)
  const first = mine[0]
  const cells = columns.map((mode) => {
    const row = mine.find((x) => x.mode === mode) ?? (first.mode.app === null ? mine.find((x) => x.mode.ground === mode.ground && mode.app === MODES[0].app) : undefined)
    return pad(cell(row), 7, true)
  })
  console.log(`${pad(id, 34)} ${pad(first.kind, 17)} ${pad(floorText(first), 6, true)}  ${cells.join(" ")}   ${first.note}`)
}
console.log("-".repeat(head.length))
console.log(
  `floors: ${Object.entries(KINDS).filter(([, k]) => k.min !== undefined).map(([name, k]) => `${name} ${k.metric === "ratio" ? `${k.min}:1` : `Lc ${k.min}`}`).join(" · ")} · ` +
    `level-gap Lc ${LEVEL_GAP} (body over secondary over label, on the same surface) · reported only: ${Object.entries(KINDS).filter(([, k]) => k.min === undefined).map(([name]) => name).join(", ")}`
)

if (rowsArg) {
  const only = rowsArg.split("=")[1]
  const h = `${pad("mode", 20)} ${pad("recipe", 34)} ${pad("kind", 17)} ${pad("drawn", 8)} ${pad("on", 8)} ${pad("measure", 10, true)} ${pad("floor", 6, true)} ${pad("WCAG", 8, true)} ${pad("APCA", 8, true)}  ${pad("", 9)} paint on stack`
  console.log(`\n${h}\n${"-".repeat(h.length)}`)
  for (const row of rows) {
    if (row.kind === "level-gap" || (only && !row.id.includes(only))) continue
    console.log(
      `${pad(row.mode.name, 20)} ${pad(row.id, 34)} ${pad(row.kind, 17)} ${pad(row.fgHex, 8)} ${pad(row.bgHex, 8)} ${pad(fmt(row), 10, true)} ${pad(floorText(row), 6, true)} ${pad(`${row.ratio.toFixed(2)}:1`, 8, true)} ${pad(`Lc ${row.lc.toFixed(0)}`, 8, true)}  ${pad(row.status, 9)} ${row.paint} on ${row.on}`
    )
  }
}

// Exceptions: each miss by role, mode, measure and floor.
const excepted = rows.filter((row) => row.status === "exception")
if (excepted.length) {
  const exceptedIds = [...new Set(excepted.map((row) => row.id))]
  console.log(`\nExceptions: ${excepted.length} measures under their floor in ${exceptedIds.length} recipes. Reported, not gated. The values are not changed and not hidden.`)
  const h = `${pad("recipe", 34)} ${pad("role, on what", 56)} ${pad("floor", 6, true)}  measured, by mode`
  console.log(`${h}\n${"-".repeat(h.length + 60)}`)
  // A measure that would round to its floor is written with one more digit, so a miss reads as one.
  const digits = (row) => (row.metric === "ratio" ? 2 : Number(row.value.toFixed(1)) >= row.floor ? 2 : 1)
  for (const reason of new Set(excepted.map((row) => row.reason))) {
    console.log(`── ${reason} ──`)
    for (const id of exceptedIds) {
      const mine = excepted.filter((row) => row.id === id && row.reason === reason)
      if (!mine.length) continue
      const what = mine[0].kind === "level-gap" ? `${mine[0].paint} over ${mine[0].on}` : `${mine[0].paint} on ${mine[0].on}`
      const unit = mine[0].metric === "ratio" ? ":1" : ""
      const measured = mine.map((row) => `${row.mode.name} ${row.value.toFixed(digits(row))}${unit}`).join(" · ")
      console.log(`${pad(id, 34)} ${pad(what, 56)} ${pad(floorText(mine[0]), 6, true)}  ${measured}`)
    }
  }
}

// ── The exceptions, in short, for docs/02-tokens.md ─────────────────────────────────────────
// The docs carry a short table of the exceptions: what misses, where, by how much. It is written
// from this run (`--write-docs`) and checked against it on every run, so its numbers cannot go
// stale. Each excepted recipe belongs to one row; a new exception needs a row, and a row whose
// recipes all pass again has to go.
const SUMMARY = [
  { what: "`text-label` on `surface-raised` (a field's placeholder)", ids: ["label-raised"] },
  { what: "`text-label`, `primary-text`, `secondary-live` on `primary-soft`", ids: ["label-soft", "primary-text-soft", "live-soft"] },
  { what: "`text-body` on `primary-soft` and on `critical-soft` (a selected row; a critical banner or badge; a removed diff line)", ids: ["body-soft", "body-critical-soft", "controls:badge-critical", "body-diff-removed"] },
  { what: "`primary-text`, `secondary-live`, `critical-text` on `surface-raised`", ids: ["primary-text-raised", "live-raised", "critical-text-raised"] },
  { what: "`critical-text` on `critical-soft`", ids: ["critical-text-soft"] },
  { what: "`primary-display` on `surface-raised`", ids: ["primary-display-raised"] },
  { what: "body over secondary text", ids: ["gap:body-ground/secondary-ground", "gap:body-raised/secondary-raised", "gap:body-soft/secondary-soft"] },
  { what: "`primary-fill` and `critical-fill` as solids, progress cells included", ids: ["primary-fill-ground", "primary-fill-raised", "primary-edge-soft", "critical-fill-ground", "critical-fill-raised", "controls:progress-primary-track", "controls:progress-primary-page", "controls:progress-critical-track", "controls:progress-critical-page"] },
  { what: "the same fills as a 2px focus or error edge (a field; an invalid button, switch or checkbox)", ids: ["field-focus-raised", "field-focus-ground", "field-error-raised", "field-error-ground", "controls:ctl-invalid-page", "controls:ctl-invalid-raised"] },
  { what: "`needs-you-fill` as a solid, and so `attention` as a mark", ids: ["needs-you-fill-ground", "needs-you-fill-raised", "attention-on-soft", "attention-on-surface"] },
  { what: "text on a hover or pressed wash, and on `accent` (rows, menu items, buttons, a float button, a select trigger)", ids: ["body-ground-hover", "label-ground-hover", "body-ground-pressed", "secondary-ground-pressed", "label-ground-pressed", "label-raised-hover", "body-raised-pressed", "secondary-raised-pressed", "label-raised-pressed", "body-soft-hover", "secondary-soft-hover", "label-soft-hover", "body-accent", "label-accent", "critical-text-accent", "controls:btn-ink-hover-page", "controls:btn-ink-press-page", "controls:btn-ink-press-raised", "controls:float-glyph-hover", "controls:float-glyph-press", "data-b:live-ground-hover", "data-b:live-ground-pressed", "data-b:live-raised-hover", "data-b:live-raised-pressed", "data-b:critical-text-ground-hover", "data-b:critical-text-ground-pressed", "data-b:primary-display-ground-hover", "data-b:primary-display-ground-pressed", "data-b:body-critical-soft-hover", "data-b:body-critical-soft-pressed", "data-b:body-soft-pressed", "data-b:secondary-soft-pressed", "data-b:label-soft-pressed"] },
  { what: "`text-body` on `diff-added`, the neutral wash", ids: ["body-diff-added"] },
  { what: "the label on a pressed solid (80%): a primary button, the create float button", ids: ["primary-on-fill-pressed-ground", "primary-on-fill-pressed-raised", "controls:btn-primary-press-page", "controls:btn-primary-press-raised", "controls:float-primary-press"] },
  { what: "the current (inverted) float button, pressed (80%)", ids: ["controls:float-current-press"] },
  { what: "`running-foreground` on `running-surface`", ids: ["running-text-surface"] },
]
const DOCS = path.join(here, "..", "..", "..", "docs", "02-tokens.md")
const DOCS_START = "<!-- contrast:exceptions start · written by `node scripts/contrast.mjs --write-docs` (packages/tokens); do not edit by hand -->"
const DOCS_END = "<!-- contrast:exceptions end -->"
{
  const exceptedIds = new Set(excepted.map((row) => row.id))
  const grouped = new Map()
  for (const group of SUMMARY) {
    for (const id of group.ids) {
      if (grouped.has(id)) errors.push(`docs summary: "${id}" is in two rows`)
      grouped.set(id, group)
      if (!exceptedIds.has(id)) errors.push(`docs summary: "${id}" is no longer an exception; take it out of SUMMARY in contrast.mjs`)
    }
  }
  for (const id of exceptedIds) {
    if (!grouped.has(id)) errors.push(`docs summary: the exception "${id}" has no row; add it to SUMMARY in contrast.mjs`)
  }
  /** Which modes, in words: "both", a ground, or the apps on a ground. */
  const where = (modes) => {
    const grounds = ["graphite", "stone"].map((ground) => {
      const apps = MODES.filter((m) => m.ground === ground && modes.has(m)).map((m) => m.app)
      if (!apps.length) return null
      if (apps.length === MODES.filter((m) => m.ground === ground).length) return ground
      return `${apps.length === 1 ? apps[0] : `${apps.slice(0, -1).join(", ")} and ${apps.at(-1)}`} ${ground}`
    })
    return grounds[0] === "graphite" && grounds[1] === "stone" ? "both" : grounds.filter(Boolean).join("; ")
  }
  const num = (row) => (row.metric === "ratio" ? `${row.value.toFixed(2)}:1` : `Lc ${row.value.toFixed(Number(row.value.toFixed(1)) >= row.floor ? 2 : 1)}`)
  const lines = [
    `The run lists ${excepted.length} measures in ${exceptedIds.size} recipes. In short:`,
    "",
    "| What | Where | Measures | Floor |",
    "|---|---|---|---|",
  ]
  for (const group of SUMMARY) {
    const mine = excepted.filter((row) => group.ids.includes(row.id))
    if (!mine.length) continue
    const floors = [...new Set(mine.map((row) => row.floor))].sort((a, b) => b - a)
    let measures
    let floor
    if (floors.length === 1) {
      const sorted = [...mine].sort((a, b) => a.value - b.value)
      const [lo, hi] = [num(sorted[0]), num(sorted.at(-1))]
      const gap = mine[0].kind === "level-gap"
      measures = (lo === hi ? lo : `${lo} to ${hi.replace(/^Lc /, "")}`) + (gap ? " apart" : "")
      floor = mine[0].metric === "ratio" ? `${floors[0]}:1` : `Lc ${floors[0]}`
    } else {
      const under = Math.max(...mine.map((row) => row.floor - row.value))
      measures = `up to Lc ${under.toFixed(1)} under`
      floor = `Lc ${floors.join(", ")}`
    }
    lines.push(`| ${group.what} | ${where(new Set(mine.map((row) => row.mode)))} | ${measures} | ${floor} |`)
  }
  const section = `${DOCS_START}\n${lines.join("\n")}\n${DOCS_END}`
  if (fs.existsSync(DOCS)) {
    const docs = fs.readFileSync(DOCS, "utf8")
    const at = docs.indexOf(DOCS_START)
    const end = docs.indexOf(DOCS_END)
    if (at < 0 || end < at) errors.push(`docs/02-tokens.md: the exceptions summary markers are missing (expected "${DOCS_START}" … "${DOCS_END}")`)
    else if (docs.slice(at, end + DOCS_END.length) !== section) {
      if (args.includes("--write-docs")) {
        fs.writeFileSync(DOCS, docs.slice(0, at) + section + docs.slice(end + DOCS_END.length))
        console.log("\nwrote the exceptions summary into docs/02-tokens.md")
      } else {
        errors.push("docs/02-tokens.md: the exceptions summary differs from this run; run `node scripts/contrast.mjs --write-docs` in packages/tokens")
      }
    }
  }
}

// Must differ.
console.log(`\nMust differ (reported, not gated): how far two colours that must not be confused sit apart. ΔEOK is the OKLab distance: under ${SAME} reads as the same at a glance, under ${CLOSE} as close.`)
{
  const h = `${pad("mode", 20)} ${pad("pair", 40)} ${pad("a", 8)} ${pad("b", 8)} ${pad("ΔEOK", 6, true)} ${pad("ΔL", 6, true)} ${pad("Δhue", 6, true)}  ${pad("", 6)} what`
  console.log(`${h}\n${"-".repeat(h.length)}`)
  for (const pair of MUST_DIFFER) {
    for (const mode of MODES.filter((m) => m.app === pair.app)) {
      const a = to8(flatten([paintOf(pair.a)], mode).rgb)
      const b = to8(flatten([paintOf(pair.b)], mode).rgb)
      const d = difference(a, b)
      const verdict = d.dE < SAME ? "same" : d.dE < CLOSE ? "close" : "apart"
      console.log(`${pad(mode.name, 20)} ${pad(`${pair.a} / ${pair.b}`, 40)} ${pad(hex(a), 8)} ${pad(hex(b), 8)} ${pad(d.dE.toFixed(3), 6, true)} ${pad(d.dL.toFixed(3), 6, true)} ${pad(`${d.dH.toFixed(0)}°`, 6, true)}  ${pad(verdict, 6)} ${pair.why}`)
    }
  }
}

if (printExceptions) {
  console.log("\n// Misses, as exception entries (justify each before keeping it):")
  const missed = rows.filter((row) => row.floor !== null && !row.meets)
  for (const id of new Set(missed.map((row) => row.id))) {
    const modes = missed.filter((row) => row.id === id).map((row) => row.mode)
    const all = (ground) => MODES.filter((m) => m.ground === ground).every((m) => modes.includes(m))
    const names = modes.length === MODES.length ? `"all"` : JSON.stringify([
      ...["graphite", "stone"].filter(all),
      ...modes.filter((m) => !all(m.ground)).map((m) => m.name),
    ])
    console.log(`  { id: ${JSON.stringify(id)}, modes: ${names}, reason: FIGMA },`)
  }
}

const failed = rows.filter((row) => row.status === "FAIL")
for (const row of failed) errors.push(`${row.id} in ${row.mode.name}: ${fmt(row)} is under its floor of ${floorText(row)} (${row.paint} on ${row.on})`)
const gated = rows.filter((row) => row.floor !== null)
if (errors.length) {
  console.error(`\n✗ contrast: ${errors.length} problem${errors.length === 1 ? "" : "s"}`)
  for (const e of errors) console.error(`  ${e}`)
  process.exit(1)
}
console.log(
  `\n✓ contrast: ${gated.length - excepted.length} gated measures clear their floor in ${MODES.length} modes` +
    ` (${excepted.length} named exceptions reported, ${rows.length - gated.length} measures reported only)`
)
