#!/usr/bin/env node
// Contrast gate: every pair the system paints, judged by what it is for, on both grounds.
// APCA first, WCAG 2 for borders and rings (docs/02-tokens.md → Contrast).
//
// Two ways to run it:
//   - with no theme, it measures Unicron's own default theme (graphite and stone). That is the
//     core gate in `pnpm test`.
//   - with themes, it measures each one: the tool an app runs on its own theme (Unicron 1). The
//     package's bin is `unicron-contrast`:
//
//       unicron-contrast src/theme.json --exceptions src/theme.exceptions.json
//       unicron-contrast src/theme.css
//       unicron-contrast src/themes/          every <app>.json in it, with <app>.exceptions.json
//
//     A theme is the 10 accent slots (--g-theme-*), as a JSON file shaped like global.json's `theme`
//     group, or as CSS (`[data-theme="acme"] { --g-theme-graphite-ground: #…; … }`). The tool lays
//     the slots over the core's built roles and knobs, so it measures what the app's pages draw.
//
// The method is Emphasis Engine's (snds/emphasis-engine, docs/architecture.md): measure outcomes,
// not variables. A recipe is a pair as a component paints it, through its own opacity modifiers
// and mixes (a hover wash, a solid at 90%), over the stack it sits on. Its element kind sets its
// floor.
//
// What it reads: dist/tokens.css (run scripts/build.mjs first; `pnpm test` does). For each mode
// it takes the variables a browser would see (the theme's slots, then the ground's roles) and
// follows var() chains across all three tiers, so the numbers are the ones a browser renders.
//
// A miss is never hidden. It is gated, or it is a named exception with its reason, reported and
// not gated. The core's own list (EXCEPTIONS below, and each recipe file's `exceptions`) holds
// only misses that are not a theme's: values every theme shares (the critical and needs-you
// colours). An app's misses are in the exceptions file it passes. An exception that starts
// passing fails the run, so no list can go stale.
//
// Recipes: the core table below, plus every file in scripts/recipes/*.mjs (one per component
// area; see scripts/recipes/README.md).
//
// Colour math is in scripts/lib/color.mjs. APCA Lc comes from the reference `apca-w3` package
// (licensed for checking web content). Nothing from it is copied here.
//
// Run: pnpm --filter @unicron/tokens contrast · exit 1 on any miss that is not a named exception.
//   <theme.json|theme.css|dir> …   measure these themes instead of the default
//   --exceptions <file.json>       an exceptions file ({ "app"?, "exceptions": [{ id, modes, reason }] });
//                                  repeat it for several. With "app", it applies to that theme only.
//   --rows[=text]                  also print one row per recipe and mode (drawn colours, WCAG,
//                                  APCA), for every recipe or only those whose id contains `text`
//   --print-exceptions             print every miss as an exception entry, to paste and then justify
//   --write-docs                   write the short table of the core's exceptions into
//                                  docs/02-tokens.md (a default run checks that table against its
//                                  own numbers, and fails when it differs)

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { APCAcontrast, sRGBtoY } from "apca-w3"

import { composite, difference, hex, oklabL, parseColor, to8, toSrgb, wcagRatio } from "./lib/color.mjs"
import { allModes, parseTokensCss, readTheme, resolveValue } from "./lib/css.mjs"

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const rowsArg = args.find((a) => a === "--rows" || a.startsWith("--rows="))
const printExceptions = args.includes("--print-exceptions")
const exceptionFiles = []
const themeArgs = []
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--exceptions") {
    if (!args[i + 1]) throw new Error("--exceptions needs a file")
    exceptionFiles.push(path.resolve(args[++i]))
  } else if (!args[i].startsWith("--")) themeArgs.push(path.resolve(args[i]))
}

// ── Floors, by element kind ──────────────────────────────────────────────────────────────────
// The text floors are the direction's (design-direction-2026-11 §2, APCA 0.0.98G): the Figma
// values were solved to them against the ground. A floor belongs to what a paint is for.
const KINDS = {
  "text-body": { metric: "lc", min: 90, rule: "body text" },
  "text-secondary": { metric: "lc", min: 75, rule: "secondary text" },
  "text-label": { metric: "lc", min: 60, rule: "labels and coloured text" },
  "text-display": { metric: "lc", min: 45, rule: "large display, 36px and up" },
  "on-fill": { metric: "lc", min: 75, rule: "text on a fill" },
  // A solid with no words on it (a progress cell, a dot, an edge, a tab indicator) has only its
  // lightness to show it, so it holds Lc 30 (WCAG 1.4.11). A fill that holds a label (a button)
  // is found by its label, which is gated as on-fill; the fill itself is reported (Unicron 19).
  solid: { metric: "lc", min: 30, rule: "a mark with no words against what it sits on" },
  // Text under 16px where an app holds it to APCA Lc 75 and WCAG 4.5:1 (the small-* inks; Synapse 1).
  "text-small": { metric: "lc", min: 75, ratioMin: 4.5, rule: "small text, Lc 75 and 4.5:1" },
  // A coloured ink used as small text where WCAG 1.4.3's 4.5:1 is the rule (the warning ink; Warpcore 2).
  "text-aa": { metric: "ratio", min: 4.5, rule: "small coloured text, 4.5:1 (WCAG 1.4.3)" },
  // Non-text keeps the WCAG 1.4.11 ratio: APCA has no calibrated target for thin lines and rings.
  focus: { metric: "ratio", min: 3, rule: "a focus ring or focus border, 3:1 (WCAG 1.4.11)" },
  "border-error": { metric: "ratio", min: 3, rule: "an error border, 3:1 (WCAG 1.4.11)" },
  // The edge that alone shows a control, where nothing else (a glyph, a knob, a label inside it)
  // does: an unchecked checkbox. WCAG 1.4.11 holds it to 3:1, as a focus or error border.
  "control-edge": { metric: "ratio", min: 3, rule: "the edge that alone shows a control, 3:1 (WCAG 1.4.11)" },
  // Reported, not gated.
  fill: { metric: "lc" }, // a fill that holds a label: the label carries it (Unicron 19)
  "text-faint": { metric: "lc" }, // disabled words and decoration only, which WCAG exempts (Unicron 25)
  "border-rest": { metric: "ratio" }, // a 1px edge that is decoration: a button's edge, a hairline box
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
// a two-role mix. The opacity is a number, or the name of a number knob (`r("surface-scrim",
// "c-scrim-dialog")`), read per mode, for a layer whose strength differs by ground. `over` is the stack it sits on, bottom first. Measured as a browser draws it:
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
  { id: "primary-button-ground", source: "bg-primary-fill on the ground: the primary button, the create button (a fill that holds a label)", kind: "fill", paint: r("primary-fill"), over: GROUND },
  { id: "primary-button-raised", source: "bg-primary-fill on bg-surface-raised: the primary button in a dialog (a fill that holds a label)", kind: "fill", paint: r("primary-fill"), over: RAISED },
  // The identity as a mark with no words draws primary-mark: the fill on stone, the identity text
  // colour on graphite (Unicron 19).
  { id: "primary-mark-ground", source: "bg-primary-mark on the ground: the tab indicator, an edge, a progress cell", kind: "solid", paint: r("primary-mark"), over: GROUND },
  { id: "primary-mark-raised", source: "bg-primary-mark on bg-surface-raised: the tab indicator, the selected-row edge in a panel", kind: "solid", paint: r("primary-mark"), over: RAISED },
  { id: "primary-edge-soft", source: "the 2px primary-mark edge of a selected row, against bg-primary-soft", kind: "solid", paint: r("primary-mark"), over: SOFT },

  // Small-text inks (Synapse 1): Lc 75 and 4.5:1 on the ground, a raised surface and both washes.
  ...[["label", "small-label"], ["primary", "small-primary"], ["critical", "small-critical"], ["live", "small-live"]].flatMap(([name, role]) =>
    [["ground", GROUND], ["raised", RAISED], ["soft", SOFT], ["critical-soft", [r("critical-soft")]]].map(([on, stack]) => ({
      id: `small-${name}-${on}`, source: `text-${role} (under 16px) on ${on === "ground" ? "the ground" : on === "raised" ? "bg-surface-raised" : `bg-${on === "soft" ? "primary-soft" : "critical-soft"}`}`, kind: "text-small", paint: r(role), over: stack,
    }))
  ),

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
  { id: "critical-fill-ground", source: "bg-critical-fill on the ground: the destructive button (a fill that holds a label)", kind: "fill", paint: r("critical-fill"), over: GROUND },
  { id: "critical-fill-raised", source: "bg-critical-fill on bg-surface-raised: the destructive button in a dialog", kind: "fill", paint: r("critical-fill"), over: RAISED },
  // A critical edge with no words of its own (a Banner's, a Badge's, an Accessory's, a File Chip's)
  // draws line-invalid, which is the critical text colour on graphite (Unicron 17 and 19).
  { id: "critical-edge-ground", source: "a critical edge: inset-ring-line-invalid on the ground", kind: "solid", paint: r("line-invalid"), over: GROUND },
  { id: "critical-edge-raised", source: "a critical edge: inset-ring-line-invalid on bg-surface-raised", kind: "solid", paint: r("line-invalid"), over: RAISED },

  // Focus, error and resting borders hold 3:1 against both sides of the edge (WCAG 1.4.11):
  // line-focus and line-invalid (Unicron 17), and the 1px line-field (Unicron 18).
  { id: "field-focus-raised", source: "a text field's focus border: 2px line-focus, against its bg-surface-raised box", kind: "focus", paint: r("line-focus"), over: RAISED },
  { id: "field-focus-ground", source: "a text field's focus border, against the ground outside it", kind: "focus", paint: r("line-focus"), over: GROUND },
  { id: "field-error-raised", source: "an invalid field's border: 2px line-invalid, against its bg-surface-raised box", kind: "border-error", paint: r("line-invalid"), over: RAISED },
  { id: "field-error-ground", source: "an invalid field's border, against the ground outside it", kind: "border-error", paint: r("line-invalid"), over: GROUND },
  { id: "field-rest-raised", source: "a field's resting border: 1px line-field (--input), against its bg-surface-raised box", kind: "control-edge", paint: r("line-field"), over: RAISED },
  { id: "field-rest-ground", source: "a field's resting border, against the ground outside it", kind: "control-edge", paint: r("line-field"), over: GROUND },
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
  // A solid shows hover as itself at 90% over what is behind it, and pressed at 85% (80% before
  // 1.1; Unicron 28).
  ...BASES.flatMap(([base, stack]) =>
    [["hover", 0.9], ["pressed", 0.85]].flatMap(([state, alpha]) => [
      { id: `primary-on-fill-${state}-${base}`, source: `the primary button, ${state}: bg-primary-fill/${Math.round(alpha * 100)} over ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "on-fill", paint: r("primary-on-fill"), over: [...stack, r("primary-fill", alpha)] },
      { id: `critical-on-fill-${state}-${base}`, source: `the destructive button, ${state}: bg-critical-fill/${Math.round(alpha * 100)} over ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "on-fill", paint: r("critical-on-fill"), over: [...stack, r("critical-fill", alpha)] },
    ])
  ),
  ...[["hover", 0.9], ["pressed", 0.85]].map(([state, alpha]) => ({
    id: `needs-you-button-${state}`, source: `the solid needs-you button, ${state}: bg-needs-you-on-fill/${Math.round(alpha * 100)} over the yellow block`, kind: "on-fill", paint: r("needs-you-fill"), over: [r("needs-you-fill"), r("needs-you-on-fill", alpha)],
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
  // The warning ink as small text on stone (a status line's warning word, a budget's mark): WCAG
  // 1.4.3's 4.5:1, which apps hold small text to (Warpcore 2).
  ...BASES.map(([base, stack]) => ({
    id: `warning-ink-${base}`, source: `text-warning, small, on ${base === "ground" ? "the ground" : "bg-surface-raised"} (stone)`, kind: "text-aa", modes: ["stone"], paint: r("warning"), over: stack,
  })),
  // The inverted surface (CrownJewel): the ground's colour as ink on the ink's colour.
  { id: "protected-fg", source: "bg-protected text-protected-foreground", kind: "on-fill", paint: r("protected-foreground"), over: [r("protected")] },
  // Progress fills that are not the live one (live-progress, above), on the empty part of the bar.
  ...["success", "warning", "destructive"].map((role) => ({
    id: `progress-${role}`, source: `progress: bg-(--c-progress-*) = ${role}, against bg-line-rule, the empty part`, kind: "solid", paint: r(role), over: [r("line-rule")],
  })),

  // ── Unicron 2.0: status marks, counts and severities (shared by every app) ──
  // A status colour draws a mark and colours its word, on the ground and on a raised surface.
  ...["done", "working", "failed", "idle"].flatMap((state) => BASES.map(([base, stack]) => ({
    id: `status-${state}-${base}`, source: `text-status-${state} (the mark and its word) on ${base === "ground" ? "the ground" : "bg-surface-raised"}`, kind: "solid", paint: r(`status-${state}`), over: stack,
  }))),
  // A count badge or unread dot: the label on its fill.
  { id: "count-important", source: "Count Badge Important: text-info-on-fill on bg-info-fill", kind: "on-fill", paint: r("info-on-fill"), over: [...GROUND, r("info-fill")] },
  { id: "count-concerning", source: "Count Badge Concerning: text-severity-concerning-on-fill on its fill", kind: "on-fill", paint: r("severity-concerning-on-fill"), over: [...GROUND, r("severity-concerning-fill")] },
  { id: "count-urgent", source: "Count Badge Urgent: text-severity-urgent-on-fill on its fill", kind: "on-fill", paint: r("severity-urgent-on-fill"), over: [...GROUND, r("severity-urgent-fill")] },
  ...["info-fill", "severity-concerning-fill", "severity-urgent-fill"].map((fill) => ({
    id: `${fill}-mark-ground`, source: `bg-${fill} as a dot or badge on the ground`, kind: "solid", paint: r(fill), over: GROUND,
  })),
]

// ── Emphasis levels ──────────────────────────────────────────────────────────────────────────
// A floor only says how faint a role may get. The three neutral text levels also have to read
// apart, or a screen's hierarchy flattens: each at least Lc 10 from the next on every surface
// they share. The coded gap stands in for the drawn one; apps check the levels as drawn.
const LEVEL_GAP = 10
const LEVEL_PAIRS = ["ground", "raised", "soft"].flatMap((s) => [[`body-${s}`, `secondary-${s}`], [`secondary-${s}`, `label-${s}`]])
// The small label ink stays under secondary on the ground and a raised surface (Synapse 1): its
// gap may be nothing (on stone the apps leave it no room: see small-label), never below zero.
const ORDER_PAIRS = ["ground", "raised"].map((s) => [`secondary-${s}`, `small-label-${s}`])

// ── Must differ (reported, not gated) ────────────────────────────────────────────────────────
// An identity must not pass for a status: a green identity can read as "success", a red or
// magenta one as "critical" (the decision record's watch items for Lockdown and Synapse). Each row
// measures how far apart the two colours are, in every mode the run measures.
const MUST_DIFFER = [
  { a: "primary-fill", b: "success", why: "the identity beside the success fill" },
  { a: "primary-text", b: "success-foreground", why: "the identity as text beside success text" },
  { a: "primary-soft", b: "success-surface", why: "a selected row beside a success wash" },
  { a: "primary-fill", b: "critical-fill", why: "the identity beside the critical fill" },
  { a: "primary-text", b: "critical-text", why: "the identity as text beside error text" },
  { a: "primary-soft", b: "critical-soft", why: "a selected row beside a critical banner" },
  { a: "primary-fill", b: "critical-soft", why: "the selected-row edge on a critical wash" },
  { a: "primary-soft", b: "critical-fill", why: "a critical edge or button on a selected row" },
]
// A reading aid, not a floor. ΔEOK is the distance between two colours in OKLab, where about 0.02
// is the least difference an eye picks up side by side. Under 0.05 two colours read as the same
// at a glance; under 0.15 they are close enough to be taken for each other when seen apart.
const SAME = 0.05
const CLOSE = 0.15

// ── Exceptions (reported, not gated) ─────────────────────────────────────────────────────────
// The core's own list: misses in the default theme that are not the theme's, so every theme has
// them. `modes` is "all", a ground ("graphite", "stone"), or mode names. The list must match the
// default run's misses exactly: an entry that no longer misses fails the run. An app's theme
// lists its own misses in the exceptions file it passes.
const SHARED_CRITICAL = "Figma's critical colours, which every theme shares: critical-text was solved to Lc 60 on the graphite ground with no room, and black ink tops out at Lc 88.6 on the stone critical-soft; flagged for Sean"
const SHARED_YELLOW = "Figma's needs-you yellow, which every theme shares: on stone it is as light as the surfaces and differs from them by hue alone, so it always pairs with a shape or its ink edge; flagged for Sean"
// Unicron 2.0's shared neutrals, status and count colours are Figma's (published 2026-11-24). They
// were solved to WCAG 2 (4.5:1 for text, 3:1 for marks; the 2026-11-22 proposal), not to the APCA
// floors this gate holds, so secondary and label ink on graphite, washes stacked on a selected row
// and the amber needs-you label read under their Lc floors. Reported, not gated; flagged for Sean.
const FIGMA_2 = "Unicron 2.0's shared Figma value (published 2026-11-24), solved to WCAG 2 4.5:1 rather than this gate's APCA floor"
const EXCEPTIONS = [
  { id: "body-critical-soft", modes: ["stone"], reason: SHARED_CRITICAL },
  { id: "secondary-critical-soft", modes: ["stone"], reason: FIGMA_2 },
  { id: "small-label-critical-soft", modes: ["stone"], reason: FIGMA_2 },
  { id: "small-critical-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "small-critical-critical-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "small-live-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "small-live-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "small-live-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "small-live-critical-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "live-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "live-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "live-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "needs-you-on-fill", modes: "all", reason: FIGMA_2 },
  { id: "needs-you-button", modes: "all", reason: FIGMA_2 },
  { id: "critical-text-raised", modes: ["graphite"], reason: SHARED_CRITICAL },
  { id: "critical-text-soft", modes: ["graphite"], reason: SHARED_CRITICAL },
  { id: "field-rest-raised", modes: "all", reason: FIGMA_2 },
  { id: "field-rest-ground", modes: "all", reason: FIGMA_2 },
  { id: "body-soft-hover", modes: ["stone"], reason: FIGMA_2 },
  { id: "secondary-soft-hover", modes: "all", reason: FIGMA_2 },
  { id: "label-soft-hover", modes: "all", reason: FIGMA_2 },
  { id: "critical-text-accent", modes: ["graphite"], reason: SHARED_CRITICAL },
  { id: "needs-you-button-hover", modes: "all", reason: FIGMA_2 },
  { id: "needs-you-button-pressed", modes: "all", reason: FIGMA_2 },
  { id: "body-diff-removed", modes: ["stone"], reason: SHARED_CRITICAL },
  { id: "success-text-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "success-text-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "success-text-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "success-text-surface", modes: ["graphite"], reason: FIGMA_2 },
  { id: "attention-on-soft", modes: ["stone"], reason: SHARED_YELLOW },
  { id: "attention-on-surface", modes: ["stone"], reason: SHARED_YELLOW },
  { id: "running-text-surface", modes: ["graphite"], reason: FIGMA_2 },
  { id: "warning-fg", modes: "all", reason: FIGMA_2 },
  { id: "warning-on-ground", modes: ["stone"], reason: FIGMA_2 },
  { id: "warning-on-raised", modes: ["stone"], reason: FIGMA_2 },
  { id: "warning-on-soft", modes: ["stone"], reason: FIGMA_2 },
  { id: "info-on-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "info-on-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "info-on-soft", modes: ["graphite"], reason: FIGMA_2 },
  { id: "warning-ink-ground", modes: ["stone"], reason: FIGMA_2 },
  { id: "warning-ink-raised", modes: ["stone"], reason: FIGMA_2 },
  { id: "progress-warning", modes: ["stone"], reason: FIGMA_2 },
  { id: "status-failed-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "status-failed-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "count-concerning", modes: "all", reason: FIGMA_2 },
  { id: "count-urgent", modes: ["graphite"], reason: FIGMA_2 },
  { id: "info-fill-mark-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "severity-concerning-fill-mark-ground", modes: ["stone"], reason: FIGMA_2 },
  { id: "chat:message-agent-meta", modes: ["graphite"], reason: FIGMA_2 },
  { id: "chat:summary-overline", modes: ["graphite"], reason: FIGMA_2 },
  { id: "chat:orb-done-ground", modes: ["graphite"], reason: FIGMA_2 },
  { id: "chat:orb-done-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "chat:indicator-attention-count", modes: "all", reason: FIGMA_2 },
  { id: "chat:trace-running", modes: ["graphite"], reason: FIGMA_2 },
  { id: "chat:prompt-ink", modes: "all", reason: FIGMA_2 },
  { id: "chat:prompt-row-solid", modes: "all", reason: FIGMA_2 },
  { id: "chat:prompt-row-solid-hover", modes: "all", reason: FIGMA_2 },
  { id: "chat:prompt-row-hover", modes: "all", reason: FIGMA_2 },
  { id: "chat:prompt-row-press", modes: "all", reason: FIGMA_2 },
  { id: "chat:prompt-kbd", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny-hover", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny-press", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny-ink", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny-ink-hover", modes: "all", reason: FIGMA_2 },
  { id: "controls:btn-ny-ink-press", modes: "all", reason: FIGMA_2 },
  { id: "controls:float-current-press", modes: ["graphite"], reason: FIGMA_2 },
  { id: "controls:badge-live", modes: ["graphite"], reason: FIGMA_2 },
  { id: "controls:badge-needs-you", modes: "all", reason: FIGMA_2 },
  { id: "controls:badge-critical", modes: ["stone"], reason: FIGMA_2 },
  { id: "controls:badge-success", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:success-glyph-raised", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:live-ground-hover", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:live-raised-hover", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:critical-text-ground-hover", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:body-critical-soft-hover", modes: ["stone"], reason: FIGMA_2 },
  { id: "data-b:live-ground-pressed", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:live-raised-pressed", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:critical-text-ground-pressed", modes: ["graphite"], reason: FIGMA_2 },
  { id: "data-b:body-critical-soft-pressed", modes: "all", reason: FIGMA_2 },
  { id: "data-b:body-soft-pressed", modes: "all", reason: FIGMA_2 },
  { id: "data-b:secondary-soft-pressed", modes: "all", reason: FIGMA_2 },
  { id: "data-b:label-soft-pressed", modes: "all", reason: FIGMA_2 },
  { id: "primitives:progress-warning-ground", modes: ["stone"], reason: FIGMA_2 },
  { id: "primitives:progress-warning-raised", modes: ["stone"], reason: FIGMA_2 },
  { id: "primitives:progress-warning-track", modes: ["stone"], reason: FIGMA_2 },
  { id: "security:secret-meter-fair", modes: ["stone"], reason: FIGMA_2 },
  { id: "security:jewel-ink-pressed", modes: ["graphite"], reason: FIGMA_2 },
  { id: "security:tier-on-needs-you", modes: "all", reason: FIGMA_2 },
  { id: "shell-chrome:strip-ny-hover", modes: "all", reason: FIGMA_2 },
  { id: "shell-chrome:strip-ny-press", modes: "all", reason: FIGMA_2 },
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

// ── Modes: the default theme, or the themes given ────────────────────────────────────────────
const parsed = parseTokensCss()
const slotNames = [...parsed.root.keys()].filter((n) => n.startsWith("--g-theme-"))
if (slotNames.length !== 10) throw new Error(`expected the 10 theme slots on :root in dist/tokens.css, found ${slotNames.length}`)
const themes = []
for (const arg of themeArgs) {
  if (fs.statSync(arg).isDirectory()) {
    // A folder: every <app>.json in it that holds a `theme` group, with <app>.exceptions.json beside
    // it when there is one. A <app>.css beside it must declare the same slots.
    // In the order each file asks for ($extensions["unicron.app"].order), then by name.
    const files = fs.readdirSync(arg).filter((f) => f.endsWith(".json") && !f.endsWith(".exceptions.json"))
      .map((f) => ({ f, json: JSON.parse(fs.readFileSync(path.join(arg, f), "utf8")) }))
      .filter(({ json }) => json.theme)
      .sort((a, b) => (a.json.$extensions?.["unicron.app"]?.order ?? Infinity) - (b.json.$extensions?.["unicron.app"]?.order ?? Infinity) || a.f.localeCompare(b.f))
    for (const { f: file } of files) {
      const full = path.join(arg, file)
      const theme = readTheme(full, slotNames)
      themes.push(theme)
      const sheet = full.replace(/\.json$/, ".css")
      if (fs.existsSync(sheet)) {
        const css = readTheme(sheet, slotNames)
        for (const [n, v] of theme.slots) {
          if (css.slots.get(n).toUpperCase() !== v.toUpperCase()) throw new Error(`${path.basename(sheet)} ${n} is ${css.slots.get(n)}, but ${file} says ${v}: the two must agree`)
        }
        if (css.name !== theme.name) throw new Error(`${path.basename(sheet)} themes [data-theme="${css.name}"], but ${file} is "${theme.name}"`)
      }
      const own = full.replace(/\.json$/, ".exceptions.json")
      if (fs.existsSync(own) && !exceptionFiles.includes(own)) exceptionFiles.push(own)
    }
  } else themes.push(readTheme(arg, slotNames))
}
if (themeArgs.length && !themes.length) throw new Error(`no theme found in ${themeArgs.join(", ")}`)
const CORE_RUN = themes.length === 0
const MODES = allModes(parsed, themes)
// Legacy, unthemed recipes run on the defaults only.
const DEFAULTS = allModes(parsed)
const short = (mode) => (mode.app ?? "default").slice(0, 2) + "/" + mode.ground[0]

// An app's own exceptions. Its ids are written in full, as a run prints them ("controls:btn-ink").
for (const file of exceptionFiles) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"))
  const list = Array.isArray(json) ? json : json.exceptions
  if (!Array.isArray(list)) throw new Error(`${file}: expected { "app"?, "exceptions": [{ id, modes, reason }] }`)
  for (const e of list) ALL_EXCEPTIONS.push({ ...e, area: "app", app: json.app ?? null, file: path.basename(file) })
}

/** Which modes a recipe or an exception names: "all", a ground, an app, "light"/"dark", or mode names. */
function modeFilter(spec, app = null) {
  if (app) {
    const inner = modeFilter(spec)
    return (mode) => mode.app === app && inner(mode)
  }
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

/** A paint's own opacity in one mode: 1, a number, or a number knob read from that mode's tokens. */
function alphaOf(p, mode) {
  if (p.alpha === undefined) return 1
  if (typeof p.alpha === "number") return p.alpha
  const raw = mode.vars.get(`--${p.alpha}`)
  const n = raw === undefined ? Number.NaN : Number(resolveValue(raw, mode.vars))
  if (!Number.isFinite(n) || n < 0 || n > 1) throw new Error(`--${p.alpha} is not a number knob between 0 and 1 (${raw})`)
  return n
}

/** A paint → { rgb (0..255), alpha, clipped }. */
function paintColor(p, mode) {
  const css = p.mix
    ? `color-mix(in oklab, ${roleCss(p.mix[0], mode)}, ${roleCss(p.mix[1], mode)} ${p.k * 100}%)`
    : roleCss(p.role, mode)
  const lab = parseColor(css)
  const { rgb, clipped } = toSrgb(lab)
  return { rgb, alpha: lab.alpha * alphaOf(p, mode), clipped }
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

const label = (p) => (p.mix ? `mix(${p.mix[0]},${p.mix[1]} ${p.k * 100}%)` : typeof p.alpha === "string" ? `${p.role}/${p.alpha}` : p.alpha !== undefined ? `${p.role}/${Math.round(p.alpha * 100)}` : p.role)

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
      meets: floor === null || (value >= floor && (kind.ratioMin === undefined || ratio >= kind.ratioMin)),
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

for (const [hi, lo] of ORDER_PAIRS) {
  for (const mode of MODES) {
    const a = rows.find((row) => row.mode === mode && row.id === hi)
    const b = rows.find((row) => row.mode === mode && row.id === lo)
    if (!a || !b) throw new Error(`order: ${mode.name} ${hi} or ${lo} isn't measured`)
    const gap = a.lc - b.lc
    rows.push({
      id: `order:${hi}/${lo}`, area: "core", mode, kind: "level-order", metric: "gap", value: gap, floor: 0, meets: gap >= -0.05,
      paint: hi, on: lo, lc: gap, ratio: 0, note: `Lc ${a.lc.toFixed(1)} over Lc ${b.lc.toFixed(1)}`,
    })
  }
}

// ── Exceptions against the misses ────────────────────────────────────────────────────────────
for (const row of rows) {
  if (row.floor === null) row.status = "info"
  else if (row.meets) row.status = "pass"
  else {
    const exception = ALL_EXCEPTIONS.find((e) => e.id === row.id && modeFilter(e.modes, e.app)(row.mode))
    row.status = exception ? "exception" : "FAIL"
    row.reason = exception?.reason
  }
}
for (const e of ALL_EXCEPTIONS) {
  if (!e.reason) errors.push(`exception "${e.id}" has no reason`)
  // The core's own list is checked on the core run; an app's list on the run that passes it.
  if ((e.area === "app") === CORE_RUN) continue
  const where = e.file ? ` (${e.file})` : ""
  const covered = rows.filter((row) => row.id === e.id && modeFilter(e.modes, e.app)(row.mode))
  if (!covered.length) errors.push(`exception "${e.id}"${where} names no measured recipe and mode`)
  for (const row of covered) {
    if (row.meets) errors.push(`exception "${e.id}"${where} in ${row.mode.name} now clears its floor (${fmt(row)} against ${floorText(row)}): remove it from the list`)
  }
}

// ── Print ────────────────────────────────────────────────────────────────────────────────────
function fmt(row) {
  if (row.metric === "ratio") return `${row.value.toFixed(2)}:1`
  if (row.metric === "dL") return `ΔL ${row.value.toFixed(3)}`
  return `Lc ${row.value.toFixed(1)}${KINDS[row.kind]?.ratioMin ? ` and ${row.ratio.toFixed(2)}:1` : ""}`
}
function floorText(row) {
  if (row.floor === null) return "—"
  if (row.metric === "ratio") return `${row.floor}:1`
  return `Lc ${row.floor}${KINDS[row.kind]?.ratioMin ? ` and ${KINDS[row.kind].ratioMin}:1` : ""}`
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
// One docs row per reason: the core list's entries grouped by why they miss (Unicron 2.0).
const SUMMARY = [
  { what: "`critical-text` and `text-body` on the critical washes (Figma's shared critical colours)", ids: EXCEPTIONS.filter((e) => e.reason === SHARED_CRITICAL).map((e) => e.id) },
  { what: "`attention` (the needs-you amber) as a mark on a wash", ids: EXCEPTIONS.filter((e) => e.reason === SHARED_YELLOW).map((e) => e.id) },
  { what: "Unicron 2.0's shared neutrals, status and count colours under an APCA floor (solved to WCAG 2 4.5:1)", ids: EXCEPTIONS.filter((e) => e.reason === FIGMA_2).map((e) => e.id) },
].filter((row) => row.ids.length)
const DOCS = path.join(here, "..", "..", "..", "docs", "02-tokens.md")
const DOCS_START = "<!-- contrast:exceptions start · written by `node scripts/contrast.mjs --write-docs` (packages/tokens); do not edit by hand -->"
const DOCS_END = "<!-- contrast:exceptions end -->"
if (CORE_RUN) {
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
    for (const mode of MODES) {
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
  // In an app's run, the misses the core's own list already names are not the app's to list.
  const coreNamed = (row) => ALL_EXCEPTIONS.some((e) => e.area !== "app" && e.id === row.id && modeFilter(e.modes)(row.mode))
  const groups = CORE_RUN ? [[null, MODES]] : themes.map((t) => [t.name, MODES.filter((m) => m.app === t.name)])
  for (const [app, modesOf] of groups) {
    const mine = missed.filter((row) => modesOf.includes(row.mode) && (CORE_RUN || !coreNamed(row)))
    if (app) console.log(`// ${app}: { "app": ${JSON.stringify(app)}, "exceptions": [`)
    for (const id of new Set(mine.map((row) => row.id))) {
      const modes = mine.filter((row) => row.id === id).map((row) => row.mode)
      const all = (ground) => modesOf.filter((m) => m.ground === ground).every((m) => modes.includes(m))
      const names = modes.length === modesOf.length ? `"all"` : JSON.stringify([
        ...["graphite", "stone"].filter(all),
        ...modes.filter((m) => !all(m.ground)).map((m) => m.name),
      ])
      if (CORE_RUN) console.log(`  { id: ${JSON.stringify(id)}, modes: ${names}, reason: FIGMA },`)
      else console.log(`    { "id": ${JSON.stringify(id)}, "modes": ${names}, "reason": "…" },`)
    }
    if (app) console.log("  ] }")
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
  `\n✓ contrast${CORE_RUN ? " (the Unicron default theme)" : ` (${themes.map((t) => t.name).join(", ")})`}: ${gated.length - excepted.length} gated measures clear their floor in ${MODES.length} modes` +
    ` (${excepted.length} named exceptions reported, ${rows.length - gated.length} measures reported only)`
)
