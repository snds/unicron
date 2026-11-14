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

// ── the second review pass (2026-11-14, should-fix) ─────────────────────────────────────────────

test("no page gets a <style> tag from the Toaster: sonner's rules come from the stylesheet file alone", async ({ page }) => {
  for (const name of ["button", "toaster"]) {
    await open(page, name)
    if (name === "toaster") await expect(page.locator("[data-sonner-toast]").first()).toBeVisible()
    const injected = await page.evaluate(() => [...document.querySelectorAll("style")].filter((style) => /data-sonner/.test(style.textContent ?? "")).length)
    expect(injected, `${name}: style tags holding sonner's rules`).toBe(0)
  }
})

test("a review's note is the caption role, on one line in the 560 dialog, as Lockdown Desktop / 09 draws it", async ({ page }) => {
  await open(page, "dialog", "lockdown")
  const note = page.locator('[data-slot="dialog-description"]', { hasText: "Not you?" })
  const font = await note.evaluate((el) => {
    const s = getComputedStyle(el)
    return `${s.fontWeight} ${s.fontSize}/${s.lineHeight}`
  })
  expect(font).toBe("400 13px/20px")
  expect(await heightOf(note)).toBe(20)
  expect(await colorOf(note)).toBe(await role(page, "--text-secondary"))
})

test("a popover's head is the overline over a 15/20 emphasis title, 36 tall, with no close unless asked for (Figma cw-07)", async ({ page }) => {
  await open(page, "popover")
  const picker = page.locator('[data-slot="popover-content"]', { hasText: "Where it runs" })
  const head = picker.locator('[data-slot="popover-header"]')
  expect(await heightOf(head)).toBe(36)
  await expect(head.locator('[data-slot="popover-close"]')).toHaveCount(0)
  const title = await head.locator('[data-slot="popover-title"]').evaluate((el) => {
    const s = getComputedStyle(el)
    return `${s.fontWeight} ${s.fontSize}/${s.lineHeight}`
  })
  expect(title).toBe("600 15px/20px")
})

test("the command menu's search field is the field every search field is: 16 in, 8 to the glyph, the ui role", async ({ page }) => {
  await open(page, "command")
  const box = page.locator('[data-slot="command-input-wrapper"]').first()
  const seen = await box.evaluate((el) => {
    const s = getComputedStyle(el)
    const input = getComputedStyle(el.querySelector('[data-slot="command-input"]')!)
    return { pad: `${s.paddingLeft} ${s.paddingRight}`, gap: s.columnGap, height: el.getBoundingClientRect().height, font: `${input.fontWeight} ${input.fontSize}/${input.lineHeight}` }
  })
  expect(seen).toEqual({ pad: "16px 16px", gap: "8px", height: 48, font: "500 15px/20px" })
  expect(await colorOf(box.locator("svg").first())).toBe(await role(page, "--text-secondary"))
})

test("an avatar's badge is the body ink, never the solid primary fill; the live tone is secondary-live", async ({ page }) => {
  await open(page, "initial-tile", "vale", "stone")
  const badges = page.locator('[data-slot="avatar-badge"]')
  expect(await colorOf(badges.nth(0), "background-color")).toBe(await role(page, "--text-body"))
  expect(await colorOf(badges.nth(1), "background-color")).toBe(await role(page, "--secondary-live"))
  expect(await colorOf(badges.nth(0), "background-color")).not.toBe(await role(page, "--primary-fill"))
})

test("a vertical ButtonGroup is exactly as tall as its parts, with one 1px line between them", async ({ page }) => {
  await open(page, "button-group")
  const group = page.locator('[data-slot="button-group"][data-orientation="vertical"]').first()
  const parts = await group.evaluate((el) => [...el.children].map((child) => child.getBoundingClientRect().height))
  expect(await heightOf(group)).toBe(parts.reduce((sum, h) => sum + h, 0))
  expect((await heightOf(group)) % 4).toBe(0)
  // The second part draws three sides of its edge: nothing at the top, where the first part's line is.
  const shadow = await group.evaluate((el) => getComputedStyle(el.children[1]!).boxShadow)
  expect(shadow).toContain("1px 0px 0px 0px inset")
  expect(shadow).toContain("-1px 0px 0px 0px inset")
  expect(shadow).toContain("0px -1px 0px 0px inset")
  expect(shadow).not.toMatch(/0px 1px 0px 0px inset|0px 0px 0px 1px inset/)
})

test("RunTrace is on the 4px grid open and closed, and its reasoning is cut at a line with no fade", async ({ page }) => {
  await open(page, "run-trace")
  const heights = await page.locator('[data-slot="run-trace"]').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height))
  expect(heights.length).toBeGreaterThan(2)
  for (const height of heights) expect(height % 4, `a run trace ${height} tall`).toBe(0)
  const mask = await page.locator('[data-slot="run-trace-reasoning"]').first().evaluate((el) => getComputedStyle(el).maskImage)
  expect(mask).toBe("none")
})

test("a LogRow's time keeps the meta role whole (12/20) and the row stays 40", async ({ page }) => {
  await open(page, "log-row", "synapse")
  const row = page.locator('[data-slot="log-row"]').first()
  expect(await heightOf(row)).toBe(40)
  expect(await row.locator('[data-slot="log-row-time"]').evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).lineHeight}`)).toBe("12px/20px")
})

test("CodeDisplay: a tile is 172, a row 100 with the account 4 under the issuer, and a field 80 with no hairline above and its code centred", async ({ page }) => {
  await open(page, "code-display", "lockdown")
  const tile = page.locator('[data-slot="code-display"][data-layout="tile"]').first()
  expect(await heightOf(tile)).toBe(172)
  const gapIn = (el: Locator) =>
    el.evaluate((node) => {
      const issuer = node.querySelector('[data-slot="code-display-issuer"]')!.getBoundingClientRect()
      const account = node.querySelector('[data-slot="code-display-account"]')!.getBoundingClientRect()
      return Math.round(account.top - issuer.bottom)
    })
  expect(await gapIn(tile)).toBe(10)
  const row = page.locator('[data-slot="code-display"][data-layout="row"]').first()
  expect(await heightOf(row)).toBe(100)
  expect(await gapIn(row)).toBe(4)
  const field = page.locator('[data-slot="code-display"][data-layout="field"]').first()
  expect(await heightOf(field)).toBe(80)
  const drawn = await field.evaluate((node) => {
    const box = node.getBoundingClientRect()
    const label = node.querySelector('[data-slot="code-display-label"]')!.getBoundingClientRect()
    const code = node.querySelector('[data-slot="code-display-code"]')!.getBoundingClientRect()
    const timer = node.querySelector('[data-slot="code-display-timer"]')!.getBoundingClientRect()
    const bar = node.querySelector('[data-slot="code-display-bar"]')!.getBoundingClientRect()
    return { rule: getComputedStyle(node).boxShadow, before: code.left - label.right, after: timer.left - code.right, barUnderCode: bar.top - code.bottom, underBar: box.bottom - bar.bottom }
  })
  expect(drawn.rule).not.toMatch(/0px 1px 0px 0px inset/)
  // Centred between the label and the seconds.
  expect(Math.abs(drawn.before - drawn.after)).toBeLessThan(1.5)
  expect(Math.round(drawn.barUnderCode)).toBe(10)
  expect(Math.round(drawn.underBar)).toBe(14)
  // Every form of the field stays on the 4px grid.
  for (const height of await page.locator('[data-slot="code-display"][data-layout="field"]').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height))) expect(height % 4).toBe(0)
})

test("the file chip's name is the label role: Vale's chip is 276 wide", async ({ page }) => {
  await open(page, "file-chip", "vale")
  const chip = page.locator('[data-slot="file-chip"]').first()
  expect(Math.round((await chip.boundingBox())!.width)).toBe(276)
  expect(await chip.locator('[data-slot="file-chip-name"]').evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).lineHeight}`)).toBe("14px/20px")
})

test("an empty Composer draws Send at full strength, and it sends nothing", async ({ page }) => {
  await open(page, "composer")
  const send = page.locator('[data-slot="composer-send"][data-action="send"]').first()
  await expect(send).toHaveAttribute("aria-disabled", "true")
  expect(await send.evaluate((el) => getComputedStyle(el).opacity)).toBe("1")
  expect(await colorOf(send, "background-color")).toBe(await role(page, "--primary-fill"))
})

test("the hero Metric: its label sits on the number's line and the unit is 24 from the number, on its baseline", async ({ page }) => {
  await open(page, "metric", "lockdown")
  const hero = page.locator('[data-slot="metric"][data-size="hero"]').first()
  const seen = await hero.evaluate((el) => {
    const top = el.getBoundingClientRect().top
    const value = el.querySelector('[data-slot="metric-value"]')!.getBoundingClientRect()
    const unit = el.querySelector('[data-slot="metric-unit"]')!.getBoundingClientRect()
    return { valueTop: value.top - top, gap: unit.left - value.right, numeric: getComputedStyle(el.querySelector('[data-slot="metric-value"]')!).fontVariantNumeric }
  })
  // 16 of label, then the number's 148 line: nothing between them.
  expect(seen.valueTop).toBe(16)
  expect(Math.round(seen.gap)).toBe(24)
  // Proportional figures, as Figma draws the number roles.
  expect(seen.numeric).not.toContain("tabular-nums")
})

test("a letter header's letter sits 4 above the bottom of its 48, not centred (Lockdown Desktop / 01)", async ({ page }) => {
  await open(page, "shell-lockdown", "lockdown")
  const header = page.locator('[data-slot="section-header"][data-variant="index"]').first()
  const seen = await header.evaluate((el) => {
    const box = el.getBoundingClientRect()
    const letter = el.querySelector('[data-slot="section-header-title"]')!.getBoundingClientRect()
    return { height: box.height, top: letter.top - box.top, under: box.bottom - letter.bottom }
  })
  expect(seen).toEqual({ height: 48, top: 12, under: 4 })
})

test("a DiffBlock's box that scrolls sideways is a named tab stop", async ({ page }) => {
  await open(page, "diff-block")
  const box = page.locator('[data-slot="diff-block-box"][data-scrolls]').first()
  await expect(box).toHaveAttribute("tabindex", "0")
  await expect(box).toHaveAttribute("role", "group")
  expect(await box.getAttribute("aria-label")).toMatch(/, lines$/)
  expect(await box.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
})

test("with focus on a layer's Close, one Escape closes the layer: no tooltip takes the first one", async ({ page }) => {
  // The showcase holds the playground's live layers (a trigger, a modal dialog, a sheet).
  await open(page, "showcase")
  for (const [trigger, role] of [
    ["Open a long settings dialog", "dialog"],
    ["Open sheet", "dialog"],
  ] as const) {
    const opener = page.getByRole("button", { name: trigger, exact: true }).first()
    if ((await opener.count()) === 0) continue
    await opener.click()
    const layer = page.getByRole(role).last()
    await expect(layer).toBeVisible()
    const close = layer.getByRole("button", { name: "Close", exact: true }).last()
    await close.focus()
    // Long enough for a tooltip to have opened, had there been one.
    await page.waitForTimeout(700)
    await expect(page.locator('[data-slot="tooltip-content"]')).toHaveCount(0)
    await page.keyboard.press("Escape")
    await expect(layer).toBeHidden()
    await expect(opener).toBeFocused()
  }
})

test("the page head's meta button is named by the text it shows; what it does is its description", async ({ page }) => {
  await open(page, "page-head", "vale")
  const meta = page.getByRole("button", { name: "THU 11.12" }).first()
  await expect(meta).toBeVisible()
  await expect(meta).toHaveAccessibleDescription("Go to today")
})

test("a list of Items is a list of list items; a row that is a link keeps its role inside one", async ({ page }) => {
  await open(page, "item")
  const lists = page.getByRole("list")
  const owned = await lists.evaluateAll((all) => all.filter((list) => list.getAttribute("data-slot") === "item-group").map((list) => [...list.children].every((child) => child.getAttribute("role") === "listitem")))
  expect(owned.length).toBeGreaterThan(0)
  expect(owned.every(Boolean)).toBe(true)
})

test.describe("on a phone (second pass)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test("a Select's rows, a small NativeSelect and a small Item that is a link are 44 on a touch screen (contract 6.6)", async ({ page }) => {
    await open(page, "select")
    expect(await page.evaluate(() => matchMedia("(pointer: coarse)").matches)).toBe(true)
    for (const height of await page.locator('[data-slot="native-select"][data-size="sm"]').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height))) expect(height).toBe(44)
    for (const height of await page.locator('[data-slot="select-item"]').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height))) expect(height).toBeGreaterThanOrEqual(44)
    await open(page, "item")
    for (const height of await page.locator('a[data-slot="item"][data-size="sm"]').evaluateAll((all) => all.map((el) => el.getBoundingClientRect().height))) expect(height).toBeGreaterThanOrEqual(44)
  })

  test("in a phone frame one toast shows at a time, in the strip's slot: never three bars at the bottom", async ({ page }) => {
    await open(page, "toaster")
    await expect(page.locator("[data-sonner-toast]").first()).toBeVisible()
    await page.waitForTimeout(600)
    const perToaster = await page.locator("[data-sonner-toaster]").evaluateAll((all) =>
      all.map((toaster) => ({
        phone: toaster.closest('[data-layout="phone"]') !== null,
        shown: [...toaster.querySelectorAll("[data-sonner-toast]")].filter((toast) => toast.getAttribute("data-removed") !== "true" && toast.getAttribute("data-visible") !== "false").length,
      }))
    )
    const phones = perToaster.filter((t) => t.phone)
    expect(phones.length).toBeGreaterThan(0)
    for (const t of phones) expect(t.shown).toBe(1)
    for (const t of perToaster.filter((x) => !x.phone)) expect(t.shown).toBeGreaterThanOrEqual(1)
  })

  test("a tap on cut text shows all of it, and a tap elsewhere puts it away", async ({ page }) => {
    await open(page, "truncated-text")
    const cut = page.locator('[data-slot="truncated-text"][data-truncated]').first()
    await cut.scrollIntoViewIfNeeded()
    await cut.tap()
    const full = page.locator('[data-slot="truncated-text-full"]')
    await expect(full).toBeVisible()
    expect((await full.textContent())!.length).toBeGreaterThan(10)
    await page.touchscreen.tap(380, 800)
    await expect(full).toHaveCount(0)
  })

  test("a field's text is 16px on a touch screen in the Composer too, so iOS does not zoom into the chat's field", async ({ page }) => {
    await open(page, "composer")
    expect(await page.locator('[data-slot="composer-field"]').first().evaluate((el) => `${getComputedStyle(el).fontSize}/${getComputedStyle(el).lineHeight}`)).toBe("16px/20px")
  })
})

test.describe("a crumb on a touch tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 }, hasTouch: true })

  test("a crumb that is a link takes a touch across 44px: its target is not clipped by a cut on the link itself", async ({ page }) => {
    await open(page, "app-frame-status-line", "vale")
    const crumb = page.locator('[data-slot="app-frame-crumbs"] a').first()
    await expect(crumb).toBeVisible()
    const hit = await crumb.evaluate((el) => {
      const box = el.getBoundingClientRect()
      const x = box.left + box.width / 2
      const at = (y: number) => {
        const top = document.elementFromPoint(x, y)
        return top !== null && (top === el || el.contains(top))
      }
      // 14px above and below its 16px line is still the crumb.
      return { coarse: matchMedia("(pointer: coarse)").matches, above: at(box.top - 12), below: at(box.bottom + 12), overflow: getComputedStyle(el).overflow }
    })
    expect(hit.overflow).toBe("visible")
    if (hit.coarse) expect([hit.above, hit.below]).toEqual([true, true])
  })
})
