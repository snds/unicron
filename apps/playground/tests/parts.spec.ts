// Single parts in a real browser: what a unit test in jsdom cannot see. jsdom lays nothing out,
// draws no outline and runs no form submission after a click, so these read the computed style and
// the boxes of the built playground: focus rings, heights on the 4px grid, touch targets, a button
// that fits its label, a press that must not become a submit, and the Toaster under a strict
// style-src. Each check names the review finding (2026-11-14) it holds.
import { expect, test, type Locator, type Page } from "@playwright/test"

const view = (page: Page) => page.locator('[data-slot="playground-view"]')

async function open(page: Page, name: string, theme = "warpcore", ground: "graphite" | "stone" = "graphite") {
  await page.goto(`/?view=${name}&theme=${theme}&ground=${ground}&chrome=0`)
  await expect(view(page)).toHaveAttribute("data-view", name)
  await expect(view(page)).toHaveAttribute("data-view-state", "ready")
  await page.evaluate(() => document.fonts.ready)
}

/** "#RRGGBB" for an opaque computed colour. */
async function colorOf(el: Locator, property = "color") {
  return el.evaluate((node, prop) => {
    const value = getComputedStyle(node).getPropertyValue(prop)
    const [r, g, b] = (value.match(/[\d.]+/g) ?? []).map(Number)
    return "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()
  }, property)
}

/** A role's colour as the page resolves it now, "#RRGGBB". */
async function role(page: Page, name: string) {
  return page.evaluate((variable) => {
    const probe = document.createElement("span")
    probe.style.color = `var(${variable})`
    document.body.append(probe)
    const [r, g, b] = (getComputedStyle(probe).color.match(/[\d.]+/g) ?? []).map(Number)
    probe.remove()
    return "#" + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, "0")).join("").toUpperCase()
  }, name)
}

/** The focus ring an element draws now. */
const ringOf = (el: Locator) =>
  el.evaluate((node) => {
    const s = getComputedStyle(node)
    return { visible: node.matches(":focus-visible"), style: s.outlineStyle, width: s.outlineWidth, offset: s.outlineOffset, color: s.outlineColor, shadow: s.boxShadow }
  })

const heightOf = (el: Locator) => el.evaluate((node) => Math.round(node.getBoundingClientRect().height * 100) / 100)

// ── focus rings ────────────────────────────────────────────────────────────────────────────────

for (const [theme, ground] of [
  ["warpcore", "graphite"],
  ["vale", "stone"],
] as const) {
  test(`a chip's remove and its action show the 2px ink ring, inside the chip (${theme} / ${ground})`, async ({ page }) => {
    await open(page, "chip", theme, ground)
    const ink = await role(page, "--ring")
    for (const slot of ["chip-remove", "chip-action"]) {
      const control = page.locator(`[data-slot="${slot}"]`).first()
      // Reached by the keyboard, as a person would: focus-visible is only true then.
      await control.focus()
      await page.keyboard.press("Shift+Tab")
      await page.keyboard.press("Tab")
      await expect(control).toBeFocused()
      const ring = await ringOf(control)
      expect(ring.visible, slot).toBe(true)
      // `outline-none` beside `outline-2` drew no ring at all in Tailwind 4: the style stayed `none`.
      expect(ring.style, slot).toBe("solid")
      expect(ring.width, slot).toBe("2px")
      expect(ring.offset, slot).toBe("-2px")
      expect(await colorOf(control, "outline-color"), slot).toBe(ink)
    }
  })

  test(`in a ChipField each chip's remove shows which one has focus (${theme} / ${ground})`, async ({ page }) => {
    await open(page, "chip-field", theme, ground)
    const removes = page.locator('[data-slot="chip-field"] [data-slot="chip-remove"]')
    expect(await removes.count()).toBeGreaterThan(1)
    const first = removes.first()
    await first.focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    await expect(first).toBeFocused()
    expect((await ringOf(first)).style).toBe("solid")
  })

  test(`a focused toast keeps its 1px rule and shows the ink ring; its description is text-secondary (${theme} / ${ground})`, async ({ page }) => {
    await open(page, "toaster", theme, ground)
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Couldn't move Steam" }).first()
    await expect(toast).toBeVisible()
    const atRest = await ringOf(toast)
    // sonner's own key takes focus to the toasts, then Tab walks them: each toast is a tab stop.
    await toast.focus()
    await page.keyboard.press("Shift+Tab")
    await page.keyboard.press("Tab")
    await expect(toast).toBeFocused()
    const ring = await ringOf(toast)
    expect(ring.visible).toBe(true)
    expect(ring.style).toBe("solid")
    expect(ring.width).toBe("2px")
    expect(ring.offset).toBe("2px")
    expect(await colorOf(toast, "outline-color")).toBe(await role(page, "--ring"))
    // sonner's focus rule swapped the toast's shadow for a soft drop shadow and a faint black ring.
    expect(ring.shadow).toBe(atRest.shadow)
    expect(ring.shadow).not.toMatch(/12px/)
    // On a dark theme sonner's own grey (#E8E8E8) reached the description of an unstyled toast.
    expect(await colorOf(toast.locator("[data-description]"))).toBe(await role(page, "--text-secondary"))
  })
}

// ── the Toaster under a strict style-src (contract §7) ─────────────────────────────────────────

test("under style-src 'self' the toasts still take their place: sonner's rules arrive in the stylesheet file", async ({ page }) => {
  // Lockdown's web vault: no inline style tag is allowed. sonner adds its sheet in one as it loads.
  await page.route(
    (url) => url.pathname === "/",
    async (route) => {
      const response = await route.fetch()
      await route.fulfill({ response, headers: { ...response.headers(), "content-security-policy": "style-src 'self'; font-src 'self'; script-src 'self'" } })
    }
  )
  const blocked: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error" && /Content Security Policy/.test(message.text())) blocked.push(message.text())
  })
  await open(page, "toaster", "lockdown", "graphite")
  const toaster = page.locator("[data-sonner-toaster]").first()
  const toast = toaster.locator("[data-sonner-toast]").first()
  await expect(toast).toBeVisible()
  // The policy is on: sonner's own style tag was refused.
  expect(blocked.some((text) => /style/i.test(text))).toBe(true)
  // The refused tag is in the document but styles nothing: it has no sheet.
  expect(await page.evaluate(() => [...document.querySelectorAll("style")].filter((tag) => /data-sonner-toaster/.test(tag.textContent ?? "")).every((tag) => tag.sheet === null))).toBe(true)
  // And the toasts are placed all the same: fixed at the frame's slot, stacked in their column.
  expect(await toaster.evaluate((el) => getComputedStyle(el).position)).toBe("fixed")
  expect(await toast.evaluate((el) => getComputedStyle(el).position)).toBe("absolute")
  // Bottom left of the content column, not in the page's flow at the top of it.
  const place = await toast.evaluate((el) => {
    const frame = el.closest("figure")!.firstElementChild!.getBoundingClientRect()
    const box = el.getBoundingClientRect()
    return { top: box.top - frame.top, height: frame.height, left: box.left - frame.left }
  })
  expect(place.top).toBeGreaterThan(place.height / 2)
  // Past the 204 sidebar and its gap: in the content column.
  expect(place.left).toBeGreaterThan(204)
})

// ── menus ──────────────────────────────────────────────────────────────────────────────────────

test("menu rows are Nav Items, as Figma draws the quick-create menu: label 14/20 Medium in secondary ink", async ({ page }) => {
  await open(page, "dropdown-menu", "vale", "graphite")
  const row = page.locator('[data-slot="dropdown-menu-item"]').filter({ hasText: "New message" }).first()
  await expect(row).toBeVisible()
  const type = await row.evaluate((el) => {
    const s = getComputedStyle(el)
    return { size: s.fontSize, leading: s.lineHeight, weight: s.fontWeight }
  })
  expect(type).toEqual({ size: "14px", leading: "20px", weight: "500" })
  const secondary = await role(page, "--text-secondary")
  // Vale States / 03: the row's words and glyph are #D0D5D7, text/secondary on vale / graphite.
  expect(secondary).toBe("#D0D5D7")
  expect(await colorOf(row)).toBe(secondary)
  expect(await colorOf(row.locator('[data-slot="icon"]').first())).toBe(secondary)
  expect(await heightOf(row)).toBe(36)
})

test("a folder sheet can be built from AdaptiveMenu: counts, and the open folder on the primary-soft tile in body ink", async ({ page }) => {
  await open(page, "adaptive", "vale", "graphite")
  const rows = page.locator('[data-slot="adaptive-menu-item"]')
  const inbox = rows.filter({ hasText: "Inbox" }).first()
  const starred = rows.filter({ hasText: "Starred" }).first()
  await expect(inbox).toBeVisible()
  expect(await inbox.getAttribute("aria-current")).toBe("true")
  expect(await colorOf(inbox, "background-color")).toBe(await role(page, "--primary-soft"))
  expect(await colorOf(inbox)).toBe(await role(page, "--text-body"))
  expect(await colorOf(starred)).toBe(await role(page, "--text-secondary"))
  await expect(inbox.locator('[data-slot="adaptive-menu-item-count"]')).toHaveText("12")
  await expect(starred.locator('[data-slot="adaptive-menu-item-count"]')).toHaveText("04")
  expect(await starred.evaluate((el) => getComputedStyle(el).fontSize)).toBe("14px")
})

// ── the 4px grid: nothing baseline-aligned grows its row, and a stroke adds no height ──────────

const onGrid = (n: number) => Math.abs(n / 4 - Math.round(n / 4)) < 0.001

test("rows stay on the 4px grid with a Badge, a Kbd, a description or a gated action in them", async ({ page }) => {
  await open(page, "field-row")
  const fieldRows = await page.locator('[data-slot="field-row"]').evaluateAll((rows) =>
    rows.map((row) => ({
      height: Math.round(row.getBoundingClientRect().height * 100) / 100,
      size: row.getAttribute("data-size"),
      badge: Boolean(row.querySelector('[data-slot="field-row-badge"]')),
      kbd: Boolean(row.querySelector('[data-slot="field-row-label"] [data-slot="kbd"]')),
      description: Boolean(row.querySelector('[data-slot="field-row-description"]')),
      wrapped: row.scrollHeight > 0 && getComputedStyle(row).flexWrap === "wrap" && [...row.children].some((c, i, all) => i > 0 && c.getBoundingClientRect().top > all[0].getBoundingClientRect().bottom),
    }))
  )
  expect(fieldRows.some((r) => r.badge)).toBe(true)
  expect(fieldRows.some((r) => r.kbd)).toBe(true)
  for (const row of fieldRows) expect(onGrid(row.height), `field row ${JSON.stringify(row)}`).toBe(true)
  // Figma's Field Row is 52 (default) and 64 (display, stacked); a description line adds 20.
  for (const row of fieldRows.filter((r) => r.size === "default" && !r.wrapped)) {
    expect([52, 72, 84], `default field row ${JSON.stringify(row)}`).toContain(row.height)
    if (!row.description && (row.badge || row.kbd)) expect(row.height, `a Badge or a Kbd must not grow the row ${JSON.stringify(row)}`).toBe(52)
    if (row.description && row.badge) expect(row.height).toBe(72)
  }

  await open(page, "toggle-row")
  const toggles = await page.locator('[data-slot="toggle-row"]').evaluateAll((rows) =>
    rows.map((row) => ({
      height: Math.round(row.getBoundingClientRect().height * 100) / 100,
      badge: Boolean(row.querySelector('[data-slot="toggle-row-badge"]')),
      top: row.getBoundingClientRect().top,
      switchTop: row.querySelector('[data-slot="switch"]')?.getBoundingClientRect().top ?? 0,
    }))
  )
  expect(toggles.some((r) => r.badge)).toBe(true)
  for (const row of toggles) {
    expect(onGrid(row.height), `toggle row ${JSON.stringify(row)}`).toBe(true)
    // The switch sits on a whole pixel, centred in the row.
    expect(Number.isInteger(row.switchTop - row.top), `switch ${JSON.stringify(row)}`).toBe(true)
  }
  expect(toggles.filter((r) => r.badge).map((r) => r.height)).toEqual(toggles.filter((r) => r.badge).map(() => 64))

  await open(page, "steps")
  for (const folio of await page.locator('[data-slot="steps-folio"]').all()) expect(await heightOf(folio)).toBe(20)
})

test("a SecretField row is 52 with gated actions and while it loads, and its actions sit on the row's baseline", async ({ page }) => {
  await open(page, "crown-jewel", "lockdown", "graphite")
  const gated = page.locator('[data-slot="crown-jewel-surface"] [data-slot="secret-field"]')
  expect(await gated.count()).toBeGreaterThan(0)
  for (const row of await gated.all()) expect(await heightOf(row)).toBe(52)
  // "Show" and "Copy" start with a lock glyph. The word gives the action its baseline, not the glyph's bottom edge.
  const baselines = await gated.first().evaluate((row) => {
    const baselineOf = (el: Element | null) => {
      if (!el) return null
      const range = document.createRange()
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
      let node = walker.nextNode()
      while (node && !node.textContent?.trim()) node = walker.nextNode()
      if (!node) return null
      range.selectNodeContents(node)
      // The bottom of a text line box less its descent is not exposed; the box bottom of same-leading
      // lines moves with the baseline, so compare each against its own role's leading.
      const box = range.getBoundingClientRect()
      return Math.round((box.top + box.height / 2) * 2) / 2
    }
    return {
      label: baselineOf(row.querySelector('[data-slot="secret-field-label"]')),
      actions: [...row.querySelectorAll('[data-slot="secret-field-actions"] button')].map((a) => baselineOf(a)),
    }
  })
  expect(baselines.label).not.toBeNull()
  expect(baselines.actions.length).toBeGreaterThan(0)
  // The label and the actions are both the overline role: on one baseline their text boxes share a centre.
  for (const action of baselines.actions) expect(Math.abs((action ?? 0) - (baselines.label ?? 0)), JSON.stringify(baselines)).toBeLessThanOrEqual(0.5)

  await open(page, "secret-field", "lockdown", "graphite")
  const loading = page.locator('[data-slot="secret-field"]').filter({ has: page.locator('[data-slot="secret-field-loading"]') }).first()
  await expect(loading).toBeVisible()
  expect(await heightOf(loading)).toBe(52)
})

test("separators add no height: a menu, a select list, a vertical toolbar and prose stay on the 4px grid", async ({ page }) => {
  await open(page, "dropdown-menu", "vale", "graphite")
  const menus = page.locator('[data-slot="dropdown-menu-content"]').filter({ has: page.locator('[data-slot="dropdown-menu-separator"]') })
  expect(await menus.count()).toBeGreaterThan(0)
  for (const menu of await menus.all()) expect(onGrid(await heightOf(menu)), `menu ${await heightOf(menu)}`).toBe(true)

  await open(page, "adaptive", "vale", "graphite")
  for (const list of await page.locator('[data-slot="sheet-content"], [data-slot="dropdown-menu-content"]').filter({ has: page.locator('[role="separator"]') }).all()) {
    expect(onGrid(await heightOf(list)), `adaptive menu ${await heightOf(list)}`).toBe(true)
  }

  await open(page, "toolbar")
  const vertical = page.locator('[data-slot="toolbar"][data-orientation="vertical"]').first()
  await expect(vertical).toBeVisible()
  expect(onGrid(await heightOf(vertical)), `vertical toolbar ${await heightOf(vertical)}`).toBe(true)

  await open(page, "prose")
  const withRule = page.locator('[data-slot="prose"]').filter({ has: page.locator("hr") }).first()
  await expect(withRule).toBeVisible()
  expect(onGrid(await heightOf(withRule)), `prose ${await heightOf(withRule)}`).toBe(true)
  // Every block after the rule still starts on the grid, measured from the prose's top.
  const offsets = await withRule.evaluate((root) => {
    const top = root.getBoundingClientRect().top
    const rule = root.querySelector("hr")!
    const after: number[] = []
    for (let el = rule.nextElementSibling; el; el = el.nextElementSibling) after.push(Math.round((el.getBoundingClientRect().top - top) * 100) / 100)
    return after
  })
  expect(offsets.length).toBeGreaterThan(0)
  for (const offset of offsets) expect(onGrid(offset), `after the rule: ${offsets.join(", ")}`).toBe(true)

  // The generic Separator: 1px of paint that takes no room of its own.
  const taken = await page.evaluate(() => {
    const host = document.createElement("div")
    host.style.cssText = "display:flex;flex-direction:column;width:200px"
    host.innerHTML = '<div style="height:40px"></div><div data-slot="separator" data-orientation="horizontal" role="separator"></div><div style="height:40px"></div>'
    const model = document.querySelector('[data-slot="separator"][data-orientation="horizontal"]')
    document.body.append(host)
    const rule = host.children[1] as HTMLElement
    if (model) rule.className = model.className
    const result = { styled: Boolean(model), height: host.getBoundingClientRect().height, line: rule.getBoundingClientRect().height }
    host.remove()
    return result
  })
  if (taken.styled) {
    expect(taken.line).toBe(1)
    expect(taken.height).toBe(80)
  }
})

// ── buttons that keep their label; touch targets ───────────────────────────────────────────────

test.describe("on a phone", () => {
  test.use({ hasTouch: true, isMobile: true })

  for (const width of [390, 360, 320]) {
    test(`ApprovalSheet at ${width}: Deny hugs, Approve fills, and "Approve with Face ID" stays inside its fill`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 })
      await open(page, "approval-sheet", "lockdown", "graphite")
      const actions = page.locator('[data-slot="approval-sheet-actions"]')
      await expect(actions).toBeVisible()
      const approve = actions.locator('[data-action="approve"]')
      const deny = actions.locator('[data-action="deny"]')
      await expect(approve).toContainText("Approve with Face ID")
      const fit = await approve.evaluate((button) => {
        const box = button.getBoundingClientRect()
        const range = document.createRange()
        range.selectNodeContents(button)
        const content = range.getBoundingClientRect()
        const style = getComputedStyle(button)
        return { left: content.left - box.left, right: box.right - content.right, scroll: button.scrollWidth - button.clientWidth, height: box.height, padding: Number.parseFloat(style.paddingLeft) }
      })
      // Nothing spills out of the green fill, and the label keeps clear of its edges.
      expect(fit.scroll, JSON.stringify(fit)).toBeLessThanOrEqual(0)
      expect(fit.left, JSON.stringify(fit)).toBeGreaterThanOrEqual(fit.padding - 0.5)
      expect(fit.right, JSON.stringify(fit)).toBeGreaterThanOrEqual(fit.padding - 0.5)
      const a = (await approve.boundingBox())!
      const d = (await deny.boundingBox())!
      const row = (await actions.boundingBox())!
      // Lockdown Mobile / 11: the no hugs its word at the left, the yes takes the rest, 16 apart.
      expect(Math.round(d.x)).toBe(Math.round(row.x))
      expect(Math.round(a.x - (d.x + d.width))).toBe(16)
      expect(Math.round(a.x + a.width)).toBe(Math.round(row.x + row.width))
      expect(a.width).toBeGreaterThan(d.width)
      // One line where it fits (40 tall); a second line is the last resort, and the no grows with it.
      if (width >= 360) expect(Math.round(a.height)).toBe(40)
      expect(Math.round(d.height)).toBe(Math.round(a.height))
    })
  }

  test("a NavItem takes a touch across 44px (contract 6.6): a phone's settings list is made of them", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, "settings-vale", "vale", "graphite")
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
    const rows = page.locator('[data-slot="nav-item-main"]')
    expect(await rows.count()).toBeGreaterThan(2)
    const second = rows.nth(1)
    await second.scrollIntoViewIfNeeded()
    const box = (await second.boundingBox())!
    // Drawn 36 tall, as Figma draws it.
    expect(Math.round(box.height)).toBe(36)
    const target = await second.evaluate((row) => {
      const before = getComputedStyle(row, "::before")
      return { content: before.content, height: Number.parseFloat(before.height) }
    })
    expect(target.content).not.toBe("none")
    expect(target.height).toBeGreaterThanOrEqual(44)
    // A touch 3px above the drawn row still lands on it (its 44px target reaches 4px past each edge).
    const hit = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('[data-slot="nav-item-main"]')?.textContent ?? null, { x: box.x + box.width / 2, y: box.y + box.height + 3 })
    expect(hit).not.toBeNull()
  })
})

// ── a press that must not become a submit ──────────────────────────────────────────────────────

test("Composer: Stop does not send the draft, and cancelling a wait does not send the message", async ({ page }) => {
  await open(page, "composer")
  const log = page.locator("[data-composer-log]")
  const streamingBox = page.locator('[data-slot="composer"]').filter({ has: page.getByPlaceholder("Ask about SEA-51") }).nth(2)
  const field = streamingBox.getByRole("textbox")
  // Start a reply, then type a draft while it streams.
  await field.fill("first")
  await field.press("Enter")
  await expect(streamingBox).toHaveAttribute("data-state", "streaming")
  await field.fill("a draft typed while the reply streams")
  // The host ends streaming inside the press: the same node is then the submit button.
  await streamingBox.getByRole("button", { name: "Stop" }).click()
  await expect(log).toHaveText("send: first // stop")
  await expect(field).toHaveValue("a draft typed while the reply streams")
  await expect(streamingBox).not.toHaveAttribute("data-state", "streaming")
  // The same by keyboard: Enter on Stop is a click too.
  await streamingBox.getByRole("button", { name: "Send" }).click()
  await expect(streamingBox).toHaveAttribute("data-state", "streaming")
  await field.fill("next")
  await streamingBox.getByRole("button", { name: "Stop" }).focus()
  await page.keyboard.press("Enter")
  await expect(log).toHaveText("send: first // stop // send: a draft typed while the reply streams // stop")
  await expect(field).toHaveValue("next")

  // The clock that cancels a wait: the message it holds must stay unsent.
  const waiting = page.locator('[data-slot="composer"][data-state="waiting"]').first()
  const held = await waiting.getByRole("textbox").inputValue()
  expect(held.length).toBeGreaterThan(0)
  await waiting.locator('[data-action="waiting"]').click()
  await expect(log).toHaveText("send: first // stop // send: a draft typed while the reply streams // stop // cancel waiting")
})

// ── ink on the needs-you yellow ────────────────────────────────────────────────────────────────

for (const theme of ["warpcore", "lockdown"] as const) {
  test(`AgentPrompt: the tier badge on the yellow is drawn in the yellow's own ink (${theme} / graphite)`, async ({ page }) => {
    await open(page, "agent-prompt", theme, "graphite")
    const prompt = page.locator('[data-slot="agent-prompt"]').filter({ has: page.locator('[data-slot="risk-tier-badge"]') }).first()
    await expect(prompt).toBeVisible()
    const yellow = await role(page, "--needs-you-fill")
    const onYellow = await role(page, "--needs-you-on-fill")
    expect(await colorOf(prompt, "background-color")).toBe(yellow)
    const pill = prompt.locator('[data-slot="risk-tier-badge-pill"]')
    // It was the page's ink: near-white on the yellow, 1.15:1.
    expect(await colorOf(pill)).toBe(onYellow)
    expect(await colorOf(pill.locator('[data-slot="icon"]'))).toBe(onYellow)
    expect(await colorOf(pill.locator('[data-slot="risk-tier-badge-label"]'))).toBe(onYellow)
  })
}

// ── the security review frame follows the shared Dialog and the adaptive layers ────────────────

test.describe("the review frame", () => {
  for (const [width, form] of [
    [599, "sheet"],
    [600, "dialog"],
    [639, "dialog"],
    [700, "dialog"],
  ] as const) {
    test(`ApprovalSheet at ${width}: a ${form}, where every adaptive layer switches (600)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await open(page, "approval-sheet", "lockdown", "graphite")
      const frame = page.locator('[data-slot="review-frame"]')
      await expect(frame).toBeVisible()
      await expect(frame).toHaveAttribute("data-form", form)
      const box = (await frame.boundingBox())!
      if (form === "sheet") {
        expect(Math.round(box.x)).toBe(0)
        expect(Math.round(box.width)).toBe(width)
      } else {
        // A dialog keeps --c-dialog-margin (24) clear on each side, and is 560 where that fits.
        expect(Math.round(box.width)).toBe(Math.min(560, width - 48))
        expect(Math.round(box.x)).toBe(Math.round((width - Math.min(560, width - 48)) / 2))
      }
    })
  }

  for (const width of [1100, 1000, 900, 700]) {
    test(`LargeTypeView at ${width}: 960, or the screen less 24 on every side (contract 5.1c C10)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      // The view opens the viewer as it loads.
      await open(page, "large-type-view", "lockdown", "graphite")
      // The viewer names its own slot on the review frame.
      const frame = page.locator('[data-slot="large-type-view"][data-form]')
      await expect(frame).toBeVisible()
      const box = (await frame.boundingBox())!
      const fits = width - 48 >= 960
      expect(Math.round(box.width)).toBe(fits ? 960 : width - 48)
      expect(Math.round(box.x)).toBe(fits ? Math.round((width - 960) / 2) : 24)
      // Below its own width it draws `full`, as the shared Dialog does, and says which size it was asked for.
      await expect(frame).toHaveAttribute("data-size", fits ? "viewer" : "full")
      if (!fits) {
        await expect(frame).toHaveAttribute("data-size-asked", "viewer")
        expect(Math.round(box.y)).toBe(24)
        expect(Math.round(box.height)).toBe(800 - 48)
      }
    })
  }
})
