// The foundations, measured in a real browser on the playground's Foundations view: the theme's two
// axes reach the pixels, every color role resolves, the 23 type roles draw the Figma text styles,
// rules add no height, scrims are never opaque, and the focus ring and touch target are the sizes
// the system promises.
//
// The numbers below are the Figma file's (Unicron explorations, `Unicron / Theme` and
// `Unicron Type/`), not the tokens': this file checks that the tokens, the stylesheet's utilities
// and Tailwind's theme map agree with the design, end to end.
import { expect, test, type Locator, type Page } from "@playwright/test"

const APPS = ["warpcore", "vale", "lockdown", "synapse"] as const
const GROUNDS = ["graphite", "stone"] as const

/** `Unicron / Theme`, three roles in each of the eight modes: enough to prove both axes switch. */
const MODES: Record<string, Record<string, string>> = {
  "warpcore/graphite": { "surface-ground": "#18191D", "primary-fill": "#5146EE", "secondary-live": "#1EC5E4", "text-body": "#EFF0F3" },
  "warpcore/stone": { "surface-ground": "#EFF0F5", "primary-fill": "#4837E0", "secondary-live": "#007491", "text-body": "#151618" },
  "vale/graphite": { "surface-ground": "#161A1C", "primary-fill": "#27728F", "secondary-live": "#87C0A6", "text-body": "#EDF1F3" },
  "vale/stone": { "surface-ground": "#ECF1F4", "primary-fill": "#186683", "secondary-live": "#397059", "text-body": "#141618" },
  "lockdown/graphite": { "surface-ground": "#171A18", "primary-fill": "#008231", "secondary-live": "#7CBBF0", "text-body": "#EEF1EE" },
  "lockdown/stone": { "surface-ground": "#EDF1EE", "primary-fill": "#007625", "secondary-live": "#296898", "text-body": "#141715" },
  "synapse/graphite": { "surface-ground": "#1C181A", "primary-fill": "#B90D75", "secondary-live": "#31C8C9", "text-body": "#F3EFF0" },
  "synapse/stone": { "surface-ground": "#F4EEF0", "primary-fill": "#AB006A", "secondary-live": "#007778", "text-body": "#181516" },
}
/** The same in every app: one set per ground, and the yellow that never changes. */
const SHARED: Record<(typeof GROUNDS)[number], Record<string, string>> = {
  graphite: { "needs-you-fill": "#EDE54A", "needs-you-on-fill": "#1C1C1C", "critical-fill": "#BE2323", "critical-text": "#FF978A", "critical-soft": "#3E1F1B", "surface-scrim": "#000000" },
  stone: { "needs-you-fill": "#EDE54A", "needs-you-on-fill": "#1C1C1C", "critical-fill": "#B7191C", "critical-text": "#B6322D", "critical-soft": "#FFD9D3", "surface-scrim": "#141618 @ 64%" },
}

/** `Unicron Type/`: family, weight, size, line height (px) and letter spacing (share of the size). */
const TYPE: Record<string, [family: "Geist" | "Geist Mono", weight: number, size: number, leading: number, tracking: number]> = {
  display: ["Geist", 700, 72, 68, -0.04],
  "display-compact": ["Geist", 700, 48, 48, -0.03],
  title: ["Geist", 700, 32, 36, -0.015],
  lead: ["Geist", 500, 24, 32, -0.01],
  subtitle: ["Geist", 500, 18, 28, -0.005],
  body: ["Geist", 400, 16, 24, 0],
  "body-strong": ["Geist", 500, 16, 24, 0],
  response: ["Geist", 400, 17, 28, 0],
  ui: ["Geist", 500, 15, 20, 0],
  "ui-emphasis": ["Geist", 600, 15, 20, 0],
  label: ["Geist", 500, 14, 20, 0],
  caption: ["Geist", 400, 13, 20, 0],
  overline: ["Geist Mono", 500, 11, 16, 0.04],
  folio: ["Geist Mono", 500, 12, 20, 0],
  meta: ["Geist Mono", 400, 12, 20, 0],
  "code-inline": ["Geist Mono", 400, 15, 20, 0],
  "code-display": ["Geist Mono", 500, 36, 40, 0.12],
  "number-hero": ["Geist", 700, 168, 148, -0.05],
  "number-metric": ["Geist", 700, 44, 44, -0.02],
  "number-index": ["Geist", 700, 28, 32, -0.02],
  "number-count": ["Geist Mono", 400, 24, 28, 0],
  "brand-wordmark": ["Geist", 700, 13, 16, 0.12],
  "icon-glyph": ["Geist", 400, 32, 32, 0],
}
/** Number roles and mono roles line their figures up. */
const TABULAR = ["overline", "folio", "meta", "code-inline", "code-display", "number-hero", "number-metric", "number-index", "number-count"]
/** Names from before 1.0, and the role each now draws. */
const KEPT = { "page-title": "title", "section-title": "subtitle", "group-title": "label", support: "caption" }

const SPACE = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 96]

async function open(page: Page, theme: string, ground: string) {
  await page.goto(`/?view=foundations&theme=${theme}&ground=${ground}&chrome=0`)
  await expect(page.locator('[data-slot="playground-view"]')).toHaveAttribute("data-view-state", "ready")
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
  if (ground === "graphite") await expect(page.locator("html")).toHaveClass(/(^|\s)dark(\s|$)/)
  else await expect(page.locator("html")).not.toHaveClass(/(^|\s)dark(\s|$)/)
  await page.evaluate(() => document.fonts.ready)
}

const reading = (part: Locator) => part.locator("[data-reading]").first()
const swatch = (page: Page, role: string) => page.locator(`[data-swatch="${role}"]`)

/** The computed background of a swatch: the color a role resolved to, as the browser holds it. */
async function roleColor(page: Page, role: string) {
  return swatch(page, role).locator("div").first().evaluate((el) => getComputedStyle(el).backgroundColor)
}

interface Font {
  family: string
  weight: string
  size: number
  leading: number
  tracking: number
  transform: string
  numeric: string
  color: string
}

function font(specimen: Locator): Promise<Font> {
  return specimen.evaluate((el) => {
    const style = getComputedStyle(el)
    return {
      family: style.fontFamily,
      weight: style.fontWeight,
      size: parseFloat(style.fontSize),
      leading: parseFloat(style.lineHeight),
      tracking: style.letterSpacing === "normal" ? 0 : parseFloat(style.letterSpacing),
      transform: style.textTransform,
      numeric: style.fontVariantNumeric,
      color: style.color,
    }
  })
}

// ── the two axes ───────────────────────────────────────────────────────────────────────────────

for (const app of APPS) {
  for (const ground of GROUNDS) {
    test(`${app} / ${ground} shows its Figma mode`, async ({ page }) => {
      await open(page, app, ground)
      for (const [role, value] of Object.entries({ ...MODES[`${app}/${ground}`], ...SHARED[ground] })) {
        await expect(reading(swatch(page, role)), role).toHaveText(value)
      }
      // The browser's own parts follow the ground.
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(ground === "graphite" ? "dark" : "light")
      // The page itself: the ground under body ink, in the body role.
      const body = await page.evaluate(() => {
        const style = getComputedStyle(document.body)
        return { background: style.backgroundColor, color: style.color, size: style.fontSize, leading: style.lineHeight, family: style.fontFamily }
      })
      expect(body.background).toBe(await roleColor(page, "surface-ground"))
      expect(body.color).toBe(await roleColor(page, "text-body"))
      expect(body.size).toBe("16px")
      expect(body.leading).toBe("24px")
      expect(body.family).toMatch(/^"?Geist Variable/)
    })
  }
}

test("with no data-theme the tokens show Warpcore, on both grounds", async ({ page }) => {
  for (const ground of GROUNDS) {
    await page.goto(`/?view=foundations&ground=${ground}&chrome=0`)
    await expect(page.locator('[data-slot="playground-view"]')).toHaveAttribute("data-view-state", "ready")
    await expect(page.locator("html")).not.toHaveAttribute("data-theme")
    for (const [role, value] of Object.entries(MODES[`warpcore/${ground}`]!)) {
      await expect(reading(swatch(page, role)), `${role} on ${ground}`).toHaveText(value)
    }
  }
})

test("every color role resolves, on both grounds", async ({ page }) => {
  for (const ground of GROUNDS) {
    await open(page, "vale", ground)
    const unset = await page.locator("[data-swatch]").evaluateAll((all) =>
      all.filter((el) => el.querySelector("[data-reading]")?.textContent?.trim() === "not set").map((el) => el.getAttribute("data-swatch"))
    )
    expect(unset, `roles with no color on ${ground}`).toEqual([])
  }
})

// ── nesting ────────────────────────────────────────────────────────────────────────────────────
// A box takes the ground of its nearest `.dark` or `.light` box. A `data-theme` box with no ground
// class of its own finds it by selector, three dark boxes deep (docs/02-tokens.md → Two axes), and
// the stylesheet's `dark:` variant reaches as far. Each case builds the boxes inside the page and
// reads the roles on a probe in the innermost one.

type Box = { cls?: "dark" | "light"; theme?: (typeof APPS)[number] }
const NESTING: [page: (typeof GROUNDS)[number], boxes: Box[], want: string][] = [
  ["graphite", [{ theme: "synapse" }], "synapse/graphite"],
  ["graphite", [{ cls: "light" }, { theme: "synapse" }], "synapse/stone"],
  ["graphite", [{ cls: "light" }, { cls: "dark" }, { theme: "synapse" }], "synapse/graphite"],
  ["graphite", [{ cls: "light" }, { cls: "dark" }, { cls: "light" }, { theme: "synapse" }], "synapse/stone"],
  ["graphite", [{ cls: "light" }, { cls: "dark" }, { cls: "light" }, { cls: "dark" }, { theme: "synapse" }], "synapse/graphite"],
  ["graphite", [{ cls: "light" }, { cls: "dark", theme: "synapse" }], "synapse/graphite"],
  ["graphite", [{ cls: "light" }, { cls: "dark" }, { cls: "light", theme: "synapse" }], "synapse/stone"],
  ["graphite", [{ theme: "vale" }, { theme: "synapse" }], "synapse/graphite"],
  ["graphite", [{ cls: "light" }, { theme: "vale" }, { theme: "synapse" }], "synapse/stone"],
  ["graphite", [{ cls: "light" }, { cls: "dark" }], "warpcore/graphite"],
  ["stone", [{ theme: "lockdown" }], "lockdown/stone"],
  ["stone", [{ cls: "dark" }, { theme: "lockdown" }], "lockdown/graphite"],
  ["stone", [{ cls: "dark" }, { cls: "light" }, { theme: "lockdown" }], "lockdown/stone"],
  ["stone", [{ cls: "dark" }, { cls: "light" }, { cls: "dark" }, { theme: "lockdown" }], "lockdown/graphite"],
  ["stone", [{ cls: "dark" }, { cls: "light" }, { cls: "dark" }, { cls: "light" }, { cls: "dark" }, { theme: "lockdown" }], "lockdown/graphite"],
  ["stone", [{ cls: "dark" }, { cls: "dark" }, { cls: "light" }, { cls: "light" }, { cls: "dark" }, { theme: "vale" }], "vale/graphite"],
]

const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`

for (const ground of GROUNDS) {
  test(`a box takes its nearest ground, nested, in a ${ground} page`, async ({ page }) => {
    await open(page, "warpcore", ground)
    for (const [pageGround, boxes, want] of NESTING) {
      if (pageGround !== ground) continue
      const name = ["html", ...boxes.map((b) => `div${b.cls ? `.${b.cls}` : ""}${b.theme ? `[${b.theme}]` : ""}`)].join(" > ")
      const seen = await page.evaluate((boxes) => {
        // The `dark:` variant as the stylesheet compiled it: the selector of any `dark:` rule,
        // after its class.
        let variant = ""
        const walk = (rules: CSSRuleList) => {
          for (const rule of rules) {
            if (variant) return
            if (rule instanceof CSSStyleRule) {
              const m = /^\.dark\\:[\w\\/.-]+(:is\(\.dark \*\).*)$/.exec(rule.selectorText)
              if (m && !/:(hover|focus|active|disabled)|\[|::/.test(m[1])) variant = `*${m[1]}`
            } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules)
          }
        }
        for (const sheet of document.styleSheets) walk(sheet.cssRules)
        let parent: HTMLElement = document.body
        const outer = document.createElement("div")
        parent.append(outer)
        parent = outer
        for (const box of boxes) {
          const el = document.createElement("div")
          if (box.cls) el.className = box.cls
          if (box.theme) el.setAttribute("data-theme", box.theme)
          parent.append(el)
          parent = el
        }
        const probe = document.createElement("span")
        parent.append(probe)
        const read = (role: string) => {
          probe.style.color = `var(--${role})`
          return getComputedStyle(probe).color
        }
        const out = { ground: read("surface-ground"), fill: read("primary-fill"), body: read("text-body"), variant, dark: variant ? probe.matches(variant) : null }
        outer.remove()
        return out
      }, boxes)
      const mode = MODES[want]!
      expect(seen.ground, `${name}: surface-ground`).toBe(rgb(mode["surface-ground"]!))
      expect(seen.fill, `${name}: primary-fill`).toBe(rgb(mode["primary-fill"]!))
      expect(seen.body, `${name}: text-body`).toBe(rgb(mode["text-body"]!))
      expect(seen.variant, "the stylesheet has a dark: variant to test").not.toBe("")
      expect(seen.dark, `${name}: the dark: variant`).toBe(want.endsWith("/graphite"))
    }
  })
}

// ── type ───────────────────────────────────────────────────────────────────────────────────────

test("Geist and Geist Mono load", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  const loaded = await page.evaluate(() => [...new Set([...document.fonts].filter((face) => face.status === "loaded").map((face) => face.family.replace(/["']/g, "")))])
  expect(loaded).toContain("Geist Variable")
  expect(loaded).toContain("Geist Mono Variable")
})

test("the 23 type roles draw the Figma text styles", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  expect(await page.locator("[data-type-role]").evaluateAll((all) => all.map((el) => el.getAttribute("data-type-role")))).toEqual(Object.keys(TYPE))
  for (const [role, [family, weight, size, leading, tracking]] of Object.entries(TYPE)) {
    const seen = await font(page.locator(`[data-type-role="${role}"] [data-specimen]`))
    expect(seen.family, `${role} family`).toMatch(family === "Geist Mono" ? /^"?Geist Mono Variable/ : /^"?Geist Variable/)
    expect(seen.weight, `${role} weight`).toBe(String(weight))
    expect(seen.size, `${role} size`).toBeCloseTo(size, 1)
    expect(seen.leading, `${role} line height`).toBeCloseTo(leading, 1)
    expect(seen.tracking, `${role} letter spacing`).toBeCloseTo(size * tracking, 1)
    // Overline is the only role with a case.
    expect(seen.transform, `${role} case`).toBe(role === "overline" ? "uppercase" : "none")
    if (TABULAR.includes(role)) expect(seen.numeric, `${role} figures`).toContain("tabular-nums")
    else expect(seen.numeric, `${role} figures`).not.toContain("tabular-nums")
    // Every line height sits on the 4px grid.
    expect(seen.leading % 4, `${role} line height on the grid`).toBe(0)
  }
})

test("a role sets no ink, except overline and meta, which default to label ink", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  const body = await roleColor(page, "text-body")
  const label = await roleColor(page, "text-label")
  for (const role of Object.keys(TYPE)) {
    const seen = await font(page.locator(`[data-type-role="${role}"] [data-specimen]`))
    expect(seen.color, `${role} ink`).toBe(role === "overline" || role === "meta" ? label : body)
  }
  // A color class on the same element wins over the default.
  const named = await page.locator('[data-type-role="display"] .type-meta.text-text-body').first().evaluate((el) => getComputedStyle(el).color)
  expect(named).toBe(body)
})

test("the names from before 1.0 still draw, as their new roles", async ({ page }) => {
  await open(page, "warpcore", "stone")
  for (const [name, role] of Object.entries(KEPT)) {
    const kept = await font(page.locator(`[data-type-alias="${name}"] [data-specimen]`))
    const now = await font(page.locator(`[data-type-role="${role}"] [data-specimen]`))
    expect({ ...kept, color: "" }, `type-${name} is type-${role}`).toEqual({ ...now, color: "" })
  }
  // type-support keeps the support ink it always carried.
  const support = await font(page.locator('[data-type-alias="support"] [data-specimen]'))
  expect(support.color).toBe(await roleColor(page, "support-foreground"))
})

// The page that shows the 4px system sits on it: at desktop width, where the type rows put the
// label beside the specimen, every section, its title and every type row start on the grid.
test.describe("at desktop width", () => {
  test.use({ viewport: { width: 1440, height: 900 } })

  test("the foundations sit on the 4px grid", async ({ page }) => {
    await open(page, "vale", "stone")
    const off = await page.locator('[data-slot="foundations"]').evaluate((root) => {
      const top0 = root.getBoundingClientRect().top
      const boxes = root.querySelectorAll("section, section > header, h2, [data-type-role], [data-type-alias]")
      const out: string[] = []
      for (const el of boxes) {
        const box = el.getBoundingClientRect()
        const top = +(box.top - top0).toFixed(2)
        const height = +box.height.toFixed(2)
        if (top % 4 || height % 4) {
          out.push(`${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""} ${el.getAttribute("data-type-role") ?? el.getAttribute("data-type-alias") ?? ""} at ${top}, ${height} tall`)
        }
      }
      return { out, count: boxes.length }
    })
    expect(off.count).toBeGreaterThan(40)
    expect(off.out, "boxes off the 4px grid").toEqual([])
  })
})

// ── space, radius, stroke, size ────────────────────────────────────────────────────────────────

test("spacing, radius, strokes and sizes measure what Figma says", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  for (const step of SPACE) {
    await expect(reading(page.locator(`[data-space="${step}"]`)), `space/${step}`).toHaveText(`${step} px`)
  }
  const measures = {
    "radius/none": "0 px",
    "radius/control": "2 px",
    "radius/round": "round",
    "stroke-rule": "1 px",
    "stroke-emphasis": "2 px",
    "size/control": "48 px",
    "size/touch-min": "44 px",
  }
  for (const [name, value] of Object.entries(measures)) {
    await expect(reading(page.locator(`[data-measure="${name}"]`)), name).toHaveText(value)
  }
  // The bare `rounded` and every step of Tailwind's radius scale is the control radius.
  for (const name of ["rounded", ...["sm", "md", "lg", "xl", "2xl", "3xl", "4xl"].map((step) => `rounded-${step}`)]) {
    await expect(reading(page.locator(`[data-measure="${name}"]`)), name).toHaveText("2 px")
  }
})

// ── rules ──────────────────────────────────────────────────────────────────────────────────────

test("a rule never adds height, and is never a border", async ({ page }) => {
  await open(page, "vale", "stone")
  const rows = await page.locator("[data-rule]").evaluateAll((all) =>
    all.map((figure) => {
      const row = figure.firstElementChild as HTMLElement
      const style = getComputedStyle(row)
      return { name: figure.getAttribute("data-rule"), height: row.getBoundingClientRect().height, border: style.borderTopWidth + style.borderRightWidth + style.borderBottomWidth + style.borderLeftWidth, shadow: style.boxShadow }
    })
  )
  const plain = rows.find((row) => row.name === "no rule")!
  expect(plain.shadow).toBe("none")
  expect(plain.height % 4, "the bare row is on the 4px grid").toBe(0)
  expect(rows.length).toBeGreaterThan(8)
  for (const row of rows) {
    expect(row.height, `${row.name} height`).toBe(plain.height)
    expect(row.border, `${row.name} border`).toBe("0px0px0px0px")
    if (row !== plain) expect(row.shadow, `${row.name} draws`).toContain("inset")
  }
})

test("each rule draws its own line, in its own color", async ({ page }) => {
  await open(page, "vale", "stone")
  const rule = await roleColor(page, "line-rule")
  const primary = await roleColor(page, "primary-fill")
  const critical = await roleColor(page, "critical-fill")
  const shadow = (name: string) => page.locator(`[data-rule="${name}"] > :first-child`).evaluate((el) => getComputedStyle(el).boxShadow)

  expect(await shadow("rule-t")).toContain(`${rule} 0px 1px 0px 0px inset`)
  expect(await shadow("rule-b")).toContain(`${rule} 0px -1px 0px 0px inset`)
  expect(await shadow("rule-l")).toContain(`${rule} 1px 0px 0px 0px inset`)
  expect(await shadow("rule-r")).toContain(`${rule} -1px 0px 0px 0px inset`)
  expect(await shadow("rule-box")).toContain(`${rule} 0px 0px 0px 1px inset`)
  expect(await shadow("rule-box-emphasis")).toContain(`${primary} 0px 0px 0px 2px inset`)
  expect(await shadow("rule-box-emphasis // --rule-color")).toContain(`${critical} 0px 0px 0px 2px inset`)
  expect(await shadow("edge-l")).toContain(`${primary} 2px 0px 0px 0px inset`)
  // They compose: two utilities, two lines, one box-shadow.
  const both = await shadow("rule-t rule-b")
  expect(both).toContain(`${rule} 0px 1px 0px 0px inset`)
  expect(both).toContain(`${rule} 0px -1px 0px 0px inset`)
  const selected = await shadow("rule-b edge-l")
  expect(selected).toContain(`${primary} 2px 0px 0px 0px inset`)
  expect(selected).toContain(`${rule} 0px -1px 0px 0px inset`)
  // A ring or an inset ring that arrives with a state keeps the rules beside it: a state only
  // changes Tailwind's ring variables, and the rule's list draws every layer.
  const onState = await shadow("rule-b // + a ring on a state")
  expect(onState).toContain(`${rule} 0px -1px 0px 0px inset`)
  expect(onState).toContain(`${primary} 0px 0px 0px 1px`)
  const invalid = await shadow("rule-box // + an invalid edge")
  expect(invalid).toContain(`${critical} 0px 0px 0px 2px inset`)
  expect(invalid).toContain(`${rule} 0px 0px 0px 1px inset`)
  const pointer = page.locator('[data-rule="edge-l // + a ring under the pointer"] > :first-child')
  expect(await shadow("edge-l // + a ring under the pointer")).not.toContain(`${primary} 0px 0px 0px 1px,`)
  await pointer.hover()
  const hovered = await shadow("edge-l // + a ring under the pointer")
  expect(hovered).toContain(`${primary} 2px 0px 0px 0px inset`)
  expect(hovered).toMatch(new RegExp(`${primary.replace(/[()]/g, "\\$&")} 0px 0px 0px 1px(,|$)`))
  // A parent's rule does not leak into a child that has a rule of its own.
  const leaked = await page.evaluate(() => {
    const parent = document.createElement("div")
    parent.className = "rule-t"
    const child = document.createElement("div")
    child.className = "rule-b"
    parent.append(child)
    document.body.append(parent)
    const seen = getComputedStyle(child).boxShadow
    parent.remove()
    return seen
  })
  expect(leaked).toContain("0px -1px 0px 0px inset")
  expect(leaked).not.toContain("0px 1px 0px 0px inset")
})

// ── scrim ──────────────────────────────────────────────────────────────────────────────────────

test("a scrim is the scrim role at its knob: never opaque, never blurred", async ({ page }) => {
  const KNOBS = { "scrim-sheet": 0.5, "scrim-dialog": 0.6, "scrim-menu": 0.32 }
  for (const ground of GROUNDS) {
    await open(page, "warpcore", ground)
    // Stone's role already carries 64%; the knob multiplies it.
    const base = ground === "stone" ? 0.64 : 1
    for (const [name, knob] of Object.entries(KNOBS)) {
      const layer = page.locator(`[data-scrim="${name}"] .${name}`)
      const seen = await layer.evaluate((el) => {
        const style = getComputedStyle(el)
        return { color: style.backgroundColor, blur: style.backdropFilter, filter: style.filter, opacity: style.opacity }
      })
      const alpha = /[,/]\s*([\d.]+)\)$/.exec(seen.color)
      expect(alpha, `${name} on ${ground} has an alpha (${seen.color})`).not.toBeNull()
      expect(Number(alpha![1]), `${name} on ${ground}`).toBeCloseTo(base * knob, 2)
      expect(seen.blur).toBe("none")
      expect(seen.filter).toBe("none")
      // The alpha is in the color, so opacity is free for the fade.
      expect(seen.opacity).toBe("1")
      await expect(reading(page.locator(`[data-scrim="${name}"]`))).toHaveText(`${ground === "stone" ? "#141618" : "#000000"} @ ${Math.round(base * knob * 100)}%`)
    }
  }
})

test("no glass: nothing in the built stylesheet blurs what is behind it", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  // The playground's stylesheet holds the ui stylesheet and every class the primitives use, so a
  // `backdrop-blur-*` left on any component shows up here, by its selector.
  const blurred = await page.evaluate(() => {
    const found: string[] = []
    const walk = (rules: CSSRuleList) => {
      for (const rule of rules) {
        if (rule instanceof CSSStyleRule) {
          const style = rule.style
          const values = ["backdrop-filter", "-webkit-backdrop-filter", "--tw-backdrop-blur"].map((name) => style.getPropertyValue(name))
          if (values.some((value) => /blur\(/.test(value))) found.push(rule.selectorText)
        } else if ("cssRules" in rule) walk((rule as CSSGroupingRule).cssRules)
      }
    }
    for (const sheet of document.styleSheets) walk(sheet.cssRules)
    return found
  })
  expect(blurred, "selectors that still blur the backdrop").toEqual([])
})

// ── focus and touch ────────────────────────────────────────────────────────────────────────────

async function ring(page: Page, target: Locator) {
  // A key press puts the page in keyboard mode, so the focus that follows is a visible one.
  await page.keyboard.press("Tab")
  await target.focus()
  return target.evaluate((el) => {
    const style = getComputedStyle(el)
    return { visible: el.matches(":focus-visible"), style: style.outlineStyle, width: style.outlineWidth, offset: style.outlineOffset, color: style.outlineColor }
  })
}

for (const ground of GROUNDS) {
  test(`the focus ring is 2px of ink, 2px clear, on ${ground}`, async ({ page }) => {
    await open(page, "synapse", ground)
    const seen = await ring(page, page.locator('[data-focus="ground"]'))
    expect(seen.visible).toBe(true)
    expect(seen).toMatchObject({ style: "solid", width: "2px", offset: "2px", color: await roleColor(page, "text-body") })
    expect(seen.color).toBe(await roleColor(page, "ring"))

    // Inside a needs-you block the ring takes the ink that sits on the yellow.
    const onYellow = await ring(page, page.locator('[data-focus="needs-you"]'))
    expect(onYellow.visible).toBe(true)
    expect(onYellow).toMatchObject({ style: "solid", width: "2px", offset: "2px", color: await roleColor(page, "needs-you-on-fill") })
  })
}

test("a mouse press draws no ring", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  const target = page.locator('[data-focus="ground"]')
  await target.click()
  expect(await target.evaluate((el) => el.matches(":focus-visible"))).toBe(false)
  expect(await target.evaluate((el) => getComputedStyle(el).outlineStyle)).toBe("none")
})

test.describe("on a touch screen", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })

  test("a small control takes a touch across size/touch-min", async ({ page }) => {
    await open(page, "warpcore", "graphite")
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
    const target = page.locator("[data-touch]")
    const seen = await target.evaluate((el) => {
      const before = getComputedStyle(el, "::before")
      const box = el.getBoundingClientRect()
      return { drawn: box.height, wide: box.width, content: before.content, height: parseFloat(before.height), width: parseFloat(before.width), position: before.position }
    })
    expect(seen.drawn).toBe(32)
    expect(seen.content).not.toBe("none")
    expect(seen.position).toBe("absolute")
    expect(seen.height).toBe(44)
    expect(seen.width).toBeGreaterThanOrEqual(44)
    expect(seen.width).toBeGreaterThanOrEqual(Math.floor(seen.wide))
    // A touch in the widened band, above and below the drawn control, lands on it.
    await target.scrollIntoViewIfNeeded()
    const hits = await target.evaluate((el) => {
      const box = el.getBoundingClientRect()
      const at = (y: number) => document.elementFromPoint(box.left + box.width / 2, y) === el
      return { above: at(box.top - 4), below: at(box.bottom + 4), beyond: at(box.top - 10) }
    })
    expect(hits).toEqual({ above: true, below: true, beyond: false })
  })
})

test("with a mouse the control is only as large as it is drawn", async ({ page }) => {
  await open(page, "warpcore", "graphite")
  expect(await page.locator("[data-touch]").evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none")
})
