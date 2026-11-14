// The rules a built screen is held to (rules.md section 12, decision record section 10), measured
// on the components themselves: every view, at 1440 (a pointer) and at 390 (a touch phone).
//
//   - a component's box is a multiple of 4px tall;
//   - every piece of text is one of the 23 type roles (family, weight, size, line height);
//   - a gap between a component's parts is on the spacing scale (4px steps; 2, 6, 10, 14 inside);
//   - nothing is blurred, and the one gradient is the scroll edge's mask.
//
// And on the four shell demos, the signal rules: the solid primary fill covers under 10% of the
// screen, and at most one needs-you block or strip shows.
//
// What is left out is named below, each with its reason, and the lists are exact: an entry that no
// longer occurs fails the run, so a fixed exception has to be taken off its list.
//
// Not measured here: the grouping ratio (space inside a group against space between two, 1:2 or
// wider, rules.md 5.4). It needs a notion of "group" this file does not have.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { expect, test, type Page } from "@playwright/test"

const here = path.dirname(fileURLToPath(import.meta.url))
const viewsDir = path.resolve(here, "../src/views")

/**
 * Views that are not a component's specimens: the foundations and their probes, the icon sheet and
 * the motion cards (their own timed demos).
 */
const NOT_COMPONENT_VIEWS = new Set(["foundations", "plain-css", "icons", "swatches", "edges", "motion"])
const VIEWS = fs
  .readdirSync(viewsDir)
  .filter((file) => /^[^_].*\.tsx$/.test(file) && !/\.test\.tsx$/.test(file))
  .map((file) => file.replace(/\.tsx$/, ""))
  .filter((name) => !NOT_COMPONENT_VIEWS.has(name))
  .sort()

const SIZES = [
  { name: "1440", width: 1440, height: 900, touch: false },
  { name: "390", width: 390, height: 844, touch: true },
] as const
type SizeName = (typeof SIZES)[number]["name"]

// ── The 23 roles, read from the tokens ──────────────────────────────────────────────────────────
type RoleToken = { $value: { fontFamily: string; fontWeight: number; fontSize: string; lineHeight: string } }
const typeTokens = JSON.parse(fs.readFileSync(path.resolve(here, "../../../packages/tokens/tokens/type.json"), "utf8")).type as Record<string, RoleToken>
const ROLE_FONTS = new Set(
  Object.entries(typeTokens)
    .filter(([name]) => !name.startsWith("$"))
    .map(([, token]) => {
      const v = token.$value
      return `${v.fontFamily.includes("mono") ? "mono" : "sans"} ${v.fontWeight} ${Number.parseFloat(v.fontSize)}/${Number.parseFloat(v.lineHeight)}`
    })
)

// ── What is left out, and why ───────────────────────────────────────────────────────────────────

/**
 * Parts whose height is not theirs to choose. A frame part and a pane take the room their frame
 * gives them; the rest are text or a wrapper that flows with the line it sits in.
 */
const NOT_A_BOX =
  /^(playground|app-frame|settings-frame|context-panel|fold-panes|resizable|scroll-area|foundations|icon$|spinner$|kbd$|highlight$|truncated-text|tooltip|collapsible|prose$|large-type-view)/

interface Exception {
  why: string
  /** A view and a size where it shows, so the list can be checked for entries that are gone. */
  view: string
  size: SizeName
}

/** Component boxes that are not a multiple of 4px tall. */
const OFF_GRID: Record<string, Exception> = {
  indicator: { why: "a 6px square mark, as Figma draws the Unread mark: a mark, not a box in the layout's rhythm", view: "indicator", size: "1440" },
  "nav-mark": { why: "the same 6px mark, at a navigation glyph's corner", view: "nav-item", size: "1440" },
}

/** Text that is not one of the 23 roles, as `family weight size/leading`. */
const OFF_ROLE: Record<string, Exception> = {
  "sans 500 16/20": {
    why: "a field's value on a touch screen: 16px, so iOS does not zoom the page into it, on the ui role's weight and line (docs/02-tokens.md, Type)",
    view: "text-field",
    size: "390",
  },
  "mono 400 16/20": { why: "the same for a mono field: the code-inline role at 16px on touch", view: "secret-field", size: "390" },
  "sans 500 17/28": {
    why: "bold text in response prose: the response role's size and line in the strong weight (contract 5.1c C20: not a 24th role)",
    view: "prose",
    size: "1440",
  },
}
/** Text sized by something other than a role, by its part's slot. */
const NOT_A_ROLE: Record<string, string> = {
  "large-type-view-char": "the one fitted size in the system: a character as large as the width allows, 40 to 96px in steps of 8",
}

/** Gaps off the spacing scale, by the slot of the part that sets them. */
const OFF_SCALE: Record<string, Exception> = {
  "split-button": { why: "the 1px seam between its two halves (--stroke-rule): a stroke, not a space", view: "split-button", size: "1440" },
  "code-display-code": { why: "the space between a code's groups is a space of its own type (0.3em), as the Lockdown frames draw it", view: "code-display", size: "1440" },
  "digit-groups": { why: "the same, between the groups of digits read aloud", view: "digit-groups", size: "1440" },
  "approval-sheet-match-code": { why: "the same, between the groups of the number to match", view: "approval-sheet-pairing", size: "1440" },
  "large-type-view-group": { why: "the space between two large characters is a tenth of their fitted size (--c-large-type-char-gap), sideways only", view: "large-type-view", size: "1440" },
}

/** The one gradient: the phone's scroll edge, a mask on the ground (rules.md 1.1 and 6.6). */
const GRADIENT_ALLOWED = new Set(["app-frame-scroll-edge"])

// ── The measure, in the page ────────────────────────────────────────────────────────────────────

interface Measured {
  offGrid: Record<string, number[]>
  fonts: Record<string, string[]>
  gaps: Record<string, number[]>
  effects: string[]
}

async function open(page: Page, view: string, theme = "warpcore", ground = "graphite") {
  await page.goto(`/?view=${view}&theme=${theme}&ground=${ground}&chrome=0`)
  await expect(page.locator('[data-slot="playground-view"]')).toHaveAttribute("data-view", view)
  await expect(page.locator('[data-slot="playground-view"]')).toHaveAttribute("data-view-state", "ready")
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  })
}

function measure(page: Page): Promise<Measured> {
  return page.evaluate(
    ({ notABox, notARole }) => {
      const skipBox = new RegExp(notABox)
      const slotOf = (el: Element) => el.getAttribute("data-slot") ?? ""
      const shown = (el: Element) => {
        if (!(el as HTMLElement).checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
        const box = el.getBoundingClientRect()
        return box.width > 1.5 && box.height > 1.5
      }
      // A part (not a root) has an ancestor whose slot is its prefix: `list-row-title` in `list-row`.
      const isRoot = (el: Element) => {
        const slot = slotOf(el)
        for (let up = el.parentElement; up && up !== document.body; up = up.parentElement) {
          const outer = slotOf(up)
          if (outer && slot !== outer && slot.startsWith(`${outer}-`)) return false
        }
        return true
      }
      const ownSlot = (el: Element) => slotOf(el.closest("[data-slot]") ?? el)
      const out: Measured = { offGrid: {}, fonts: {}, gaps: {}, effects: [] }
      // Every component on the page, the layers a portal draws outside the view included.
      const parts = [...document.body.querySelectorAll("[data-slot]")].filter((el) => !slotOf(el).startsWith("playground"))

      for (const el of parts) {
        const slot = slotOf(el)
        if (skipBox.test(slot) || !shown(el) || !isRoot(el)) continue
        const display = getComputedStyle(el).display
        if (display === "inline" || display === "contents") continue
        const height = el.getBoundingClientRect().height
        if (Math.abs(height - Math.round(height / 4) * 4) > 0.05) (out.offGrid[slot] ??= []).push(Math.round(height * 100) / 100)
      }

      const inComponent = (el: Element) => el.closest("[data-slot]") !== null && !slotOf(el.closest("[data-slot]")!).startsWith("playground")
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.nodeValue?.trim()) continue
        const el = node.parentElement
        if (!el || !inComponent(el) || !shown(el) || el.closest(".sr-only, [hidden]")) continue
        if (Object.keys(notARole).some((slot) => el.closest(`[data-slot="${slot}"]`))) continue
        const style = getComputedStyle(el)
        const mono = /mono/i.test(style.fontFamily.split(",")[0] ?? "")
        const font = `${mono ? "mono" : "sans"} ${style.fontWeight} ${Number.parseFloat(style.fontSize)}/${Number.parseFloat(style.lineHeight)}`
        const list = (out.fonts[font] ??= [])
        const slot = ownSlot(el)
        if (!list.includes(slot)) list.push(slot)
      }

      const within = new Set<Element>()
      for (const part of parts) {
        within.add(part)
        for (const el of part.querySelectorAll("*")) within.add(el)
      }
      for (const el of within) {
        const style = getComputedStyle(el)
        const slot = ownSlot(el)
        if (/flex|grid/.test(style.display)) {
          for (const gap of [style.rowGap, style.columnGap]) {
            const px = Number.parseFloat(gap)
            if (!Number.isFinite(px) || px === 0) continue
            // 4px steps, and the half steps 2, 6, 10, 14 for the inside of a component.
            const onScale = Math.abs(px - Math.round(px / 4) * 4) < 0.05 || [2, 6, 10, 14].some((half) => Math.abs(px - half) < 0.05)
            if (!onScale && !(out.gaps[slot] ??= []).includes(px)) out.gaps[slot]!.push(px)
          }
        }
        // A filter that changes nothing is not a blur: an enter animation that fades a layer in
        // leaves `blur(0px)` computed on it (tw-animate-css animates the property from 0 to 0).
        const real = (value: string) => Boolean(value) && value !== "none" && !/^(blur\(0(px)?\)\s*)+$/.test(value.trim())
        const backdrop = style.backdropFilter || style.getPropertyValue("-webkit-backdrop-filter")
        if (real(backdrop)) out.effects.push(`${slot}: backdrop-filter ${backdrop}`)
        if (real(style.filter)) out.effects.push(`${slot}: filter ${style.filter}`)
        const mask = style.maskImage || style.getPropertyValue("-webkit-mask-image")
        if (mask && mask !== "none") out.effects.push(`${slot}: gradient mask`)
        if (/gradient/.test(style.backgroundImage)) out.effects.push(`${slot}: gradient background`)
      }
      out.effects = [...new Set(out.effects)]
      return out
    },
    { notABox: NOT_A_BOX.source, notARole: NOT_A_ROLE }
  )
}

// ── Every view ──────────────────────────────────────────────────────────────────────────────────

for (const size of SIZES) {
  test.describe(`the components at ${size.name}${size.touch ? " (touch)" : ""}`, () => {
    test.use({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch, reducedMotion: "reduce" })

    for (const view of VIEWS) {
      test(`${view}: on the 4px grid, in the type roles, on the spacing scale, no blur`, async ({ page }) => {
        await open(page, view)
        const seen = await measure(page)

        const offGrid = Object.fromEntries(Object.entries(seen.offGrid).filter(([slot]) => !(slot in OFF_GRID)))
        expect(offGrid, "component boxes that are not a multiple of 4px tall").toEqual({})

        const offRole = Object.fromEntries(Object.entries(seen.fonts).filter(([font]) => !ROLE_FONTS.has(font) && !(font in OFF_ROLE)))
        expect(offRole, "text outside the 23 type roles (family weight size/leading: the parts that draw it)").toEqual({})
        // The touch exception is for a touch screen only.
        if (!size.touch) for (const font of ["sans 500 16/20", "mono 400 16/20"]) expect(seen.fonts[font] ?? [], `${font} away from a touch screen`).toEqual([])

        const offScale = Object.fromEntries(Object.entries(seen.gaps).filter(([slot]) => !(slot in OFF_SCALE)))
        expect(offScale, "gaps off the spacing scale").toEqual({})

        const effects = seen.effects.filter((line) => !(line.endsWith("gradient mask") && GRADIENT_ALLOWED.has(line.split(":")[0]!)))
        expect(effects, "blur, backdrop filters, and gradients other than the scroll edge").toEqual([])
      })
    }
  })
}

test.describe("the lists of what is left out are exact", () => {
  const entries = [
    ...Object.entries(OFF_GRID).map(([key, e]) => ({ kind: "offGrid" as const, key, ...e })),
    ...Object.entries(OFF_ROLE).map(([key, e]) => ({ kind: "fonts" as const, key, ...e })),
    ...Object.entries(OFF_SCALE).map(([key, e]) => ({ kind: "gaps" as const, key, ...e })),
  ]
  for (const entry of entries) {
    test(`${entry.key} still occurs (${entry.view} at ${entry.size})`, async ({ browser }) => {
      const size = SIZES.find((s) => s.name === entry.size)!
      const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch, reducedMotion: "reduce" })
      const page = await context.newPage()
      await open(page, entry.view)
      const seen = await measure(page)
      expect(Object.keys(seen[entry.kind]), `${entry.key}: ${entry.why}. If it is fixed, take it off its list.`).toContain(entry.key)
      await context.close()
    })
  }

  test("every view is one this file knows", () => {
    for (const e of [...Object.values(OFF_GRID), ...Object.values(OFF_ROLE), ...Object.values(OFF_SCALE)]) expect(VIEWS).toContain(e.view)
  })
})

// ── The four shell demos: signal ────────────────────────────────────────────────────────────────

test.describe("the shell demos keep the signal rules (rules.md 2.5 and 12)", () => {
  for (const app of ["warpcore", "vale", "lockdown", "synapse"]) {
    for (const ground of ["graphite", "stone"]) {
      for (const size of SIZES) {
        test(`shell-${app} on ${ground} at ${size.name}: the primary fill covers under 10% of the screen, and at most one needs-you block or strip shows`, async ({ browser }) => {
          const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, hasTouch: size.touch, isMobile: size.touch, reducedMotion: "reduce" })
          const page = await context.newPage()
          await open(page, `shell-${app}`, app, ground)
          const signal = await page.evaluate(() => {
            const colorOf = (name: string) => {
              const probe = document.createElement("div")
              probe.style.backgroundColor = `var(--${name})`
              document.body.append(probe)
              const value = getComputedStyle(probe).backgroundColor
              probe.remove()
              return value
            }
            const primary = colorOf("primary-fill")
            const needsYou = colorOf("needs-you-fill")
            const screen = { width: innerWidth, height: innerHeight }
            const filled = (color: string) =>
              [...document.body.querySelectorAll("*")].filter((el) => {
                if (!(el as HTMLElement).checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false
                return getComputedStyle(el).backgroundColor === color
              })
            // The outermost shapes only: a fill inside the same fill is one shape.
            const outermost = (all: Element[]) => all.filter((el) => !all.some((other) => other !== el && other.contains(el)))
            const onScreen = (el: Element) => {
              const box = el.getBoundingClientRect()
              const width = Math.max(0, Math.min(box.right, screen.width) - Math.max(box.left, 0))
              const height = Math.max(0, Math.min(box.bottom, screen.height) - Math.max(box.top, 0))
              return width * height
            }
            const primaryShapes = outermost(filled(primary))
            // A block or a strip (rules.md 2.5.7: at most one per screen). A count mark or a badge in
            // the needs-you tone is not one: it points at the block, it is not a second one.
            const needsYouShapes = outermost(filled(needsYou)).filter((el) => {
              const box = el.getBoundingClientRect()
              return onScreen(el) > 0 && box.width >= 120 && box.height >= 40
            })
            return {
              primaryShare: primaryShapes.reduce((sum, el) => sum + onScreen(el), 0) / (screen.width * screen.height),
              needsYou: needsYouShapes.length,
            }
          })
          expect(signal.primaryShare, "the share of the screen under the solid primary fill").toBeLessThan(0.1)
          expect(signal.needsYou, "needs-you blocks and strips on screen").toBeLessThanOrEqual(1)
          await context.close()
        })
      }
    }
  }
})
