// The frame in a real browser: the four shell demos (src/views/shell-*.tsx) at a phone's size,
// scrolled, the way rules.md 6.5 describes it: the chrome minimizes (the wordmark hides, the small
// centred title shows, a hairline under the top row, the tab bar shrinks to the active tab, the
// strip joins the bottom row), never more than two bars sit at the bottom, and it all comes back
// at the top. Then the width switching at the contract's lines (5.2), and the scroll edge's mask.
import { expect, test, type Page } from "@playwright/test"

const view = (page: Page) => page.locator('[data-slot="playground-view"]')

async function open(page: Page, name: string, theme: string) {
  await page.goto(`/?view=${name}&theme=${theme}&ground=graphite&chrome=0`)
  await expect(view(page)).toHaveAttribute("data-view-state", "ready")
  // The checks below measure text, so the fonts must be in before they run.
  await page.evaluate(() => document.fonts.ready)
}

/** The column showing now: the frame's one scroller on a phone. */
const shownColumn = (page: Page) => page.locator('[data-slot="app-frame-main"] [data-column][data-shown]').first()

/** Bars at the foot of the screen: the status strip above the row, and the row itself. */
async function bottomBars(page: Page) {
  return page.evaluate(() => {
    const dock = document.querySelector('[data-slot="app-frame-bottom-row"]')
    if (!dock) return { bars: 0, rows: [] as number[] }
    const strip = dock.querySelector('[data-slot="app-frame-strip"]')
    const row = dock.querySelector('[data-slot="app-frame-bottom-row-bar"]')
    const tops = [strip, row]
      .filter((el): el is Element => Boolean(el) && (el as HTMLElement).offsetHeight > 0)
      .map((el) => Math.round(el.getBoundingClientRect().top))
    return { bars: tops.length, rows: tops }
  })
}

async function scrollShown(page: Page, to: number) {
  await shownColumn(page).evaluate((el, y) => {
    el.scrollTop = y
  }, to)
}

test.describe("the phone's chrome on scroll (rules.md 6.5)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  for (const [name, theme] of [
    ["shell-vale", "vale"],
    ["shell-warpcore", "warpcore"],
    ["shell-lockdown", "lockdown"],
    ["shell-synapse", "synapse"],
  ] as const) {
    test(`${name}: minimizes when scrolled, keeps two bars at most at the bottom, and comes back at the top`, async ({ page }) => {
      await open(page, name, theme)
      const frame = page.locator('[data-slot="app-frame"]')
      const topRow = page.locator('[data-slot="app-frame-top-row"]')
      const tabBar = page.locator('[data-slot="app-frame-bottom-row"] [data-slot="tab-bar"]')
      await expect(frame).toHaveAttribute("data-layout", "phone")
      await expect(frame).not.toHaveAttribute("data-minimized")
      expect((await bottomBars(page)).bars).toBeLessThanOrEqual(2)

      // At rest the wordmark shows; the tab bar holds all its tabs.
      await expect(topRow.locator('[data-slot="app-lockup-name"]')).toBeVisible()
      const restWidth = (await tabBar.boundingBox())!.width
      expect(restWidth).toBeGreaterThan(100)

      await scrollShown(page, 400)
      await expect(frame).toHaveAttribute("data-minimized", "")
      // The wordmark hides (its name stays for assistive tech), the small centred title shows, a hairline appears.
      await expect(topRow.locator('[data-slot="app-lockup-name"]')).toHaveClass(/sr-only/)
      await expect(topRow.locator('[data-slot="app-frame-top-row-title"]')).toBeVisible()
      const shadow = await topRow.evaluate((el) => getComputedStyle(el).boxShadow)
      expect(shadow).not.toBe("none")
      // The tab bar shrinks to the active tab: one control's width.
      await expect(tabBar).toHaveAttribute("data-minimized", "")
      await expect.poll(async () => Math.round((await tabBar.boundingBox())!.width)).toBe(48)
      // The strip, if there is one, has joined the row: one bar, never more than two.
      const { bars, rows } = await bottomBars(page)
      expect(bars).toBeLessThanOrEqual(2)
      expect(new Set(rows).size).toBe(bars)
      const strip = page.locator('[data-slot="app-frame-bottom-row-bar"] [data-slot="accessory"]')
      if (await strip.count()) {
        await expect(strip).toHaveAttribute("data-compact", "")
        expect(bars).toBe(1)
      }
      // Every bar sits inside the screen, above its foot.
      const dock = (await page.locator('[data-slot="app-frame-bottom-row"]').boundingBox())!
      expect(dock.y + dock.height).toBeLessThanOrEqual(844)

      await scrollShown(page, 0)
      await expect(frame).not.toHaveAttribute("data-minimized")
      await expect(topRow.locator('[data-slot="app-lockup-name"]')).not.toHaveClass(/sr-only/)
      await expect.poll(async () => (await tabBar.boundingBox())!.width).toBeGreaterThan(100)
      expect((await bottomBars(page)).bars).toBeLessThanOrEqual(2)
    })
  }

  test("a scroll that stays under the threshold does not minimize, and a small scroll back up does not restore", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    const frame = page.locator('[data-slot="app-frame"]')
    await scrollShown(page, 40)
    await page.waitForTimeout(100)
    await expect(frame).not.toHaveAttribute("data-minimized")
    await scrollShown(page, 300)
    await expect(frame).toHaveAttribute("data-minimized", "")
    await scrollShown(page, 30)
    await page.waitForTimeout(100)
    await expect(frame).toHaveAttribute("data-minimized", "")
  })

  test("the content scrolls clear of the floating rows, and the bottom fade is a mask on the ground, not a blur", async ({ page }) => {
    await open(page, "shell-lockdown", "lockdown")
    const clear = await shownColumn(page).evaluate((el) => ({ top: getComputedStyle(el).paddingTop, bottom: getComputedStyle(el).paddingBottom }))
    const topRow = (await page.locator('[data-slot="app-frame-top-row"]').boundingBox())!
    expect(Number.parseFloat(clear.top)).toBeGreaterThanOrEqual(topRow.y + topRow.height)
    const dock = (await page.locator('[data-slot="app-frame-bottom-row"]').boundingBox())!
    expect(Number.parseFloat(clear.bottom)).toBeGreaterThanOrEqual(dock.height)
    const edge = await page.locator('[data-slot="app-frame-scroll-edge"][data-edge="bottom"]').first().evaluate((el) => {
      const s = getComputedStyle(el)
      return { mask: s.maskImage || s.getPropertyValue("-webkit-mask-image"), filter: s.backdropFilter, background: s.backgroundColor }
    })
    expect(edge.mask).toContain("linear-gradient")
    expect(edge.filter === "" || edge.filter === "none").toBe(true)
    expect(edge.background).not.toBe("rgba(0, 0, 0, 0)")
  })
})

test.describe("the shell the width picks (contract 5.2)", () => {
  for (const [width, height, layout] of [
    [390, 844, "phone"],
    [844, 390, "rail"],
    [820, 1180, "medium"],
    [1440, 900, "expanded"],
  ] as const) {
    test(`${width} × ${height} is ${layout}`, async ({ page }) => {
      await page.setViewportSize({ width, height })
      await open(page, "shell-vale", "vale")
      await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", layout)
      const sidebar = page.locator('[data-slot="app-frame-sidebar"]')
      if (layout === "expanded") {
        await expect(sidebar).toHaveAttribute("data-state", "expanded")
        expect(Math.round((await sidebar.boundingBox())!.width)).toBe(204)
        // List 432 + 12, the rule, the detail. As the first column its box also keeps 4 before the
        // content (a focus ring's reach), taken with a negative margin: the content is 432 as before.
        const list = (await page.locator('[data-slot="app-frame-list"]').boundingBox())!
        const startRoom = await page.locator('[data-slot="app-frame-list"]').evaluate((el) => Number.parseFloat(getComputedStyle(el).paddingLeft))
        expect(startRoom).toBe(4)
        expect(Math.round(list.width - startRoom)).toBe(444)
        await expect(page.locator('[data-slot="app-frame-detail"]')).toHaveAttribute("data-shown", "")
      } else if (layout === "medium") {
        await expect(sidebar).toHaveAttribute("data-state", "rail")
        expect(Math.round((await sidebar.boundingBox())!.width)).toBe(48)
      } else {
        await expect(sidebar).toHaveCount(0)
        await expect(page.locator('[data-slot="app-frame-bottom-row"]')).toBeVisible()
      }
      if (layout === "rail") {
        await expect(page.locator('[data-slot="app-frame-rail-bottom"] [data-slot="tab-bar"]')).toHaveAttribute("data-orientation", "vertical")
      }
    })
  }
})

// ── Late additions (contract 5.1c, lane c-shell) ─────────────────────────────────────────────────

const contained = (page: Page, label: string) => page.locator(`[data-slot="app-frame-contained"][aria-label^="${label}"]`)

/** A toast's box once it has arrived: it slides in, so wait until two reads agree. */
async function settledBox(locator: ReturnType<Page["locator"]>) {
  let last = ""
  await expect
    .poll(async () => {
      const b = await locator.boundingBox()
      const now = b ? `${Math.round(b.x)},${Math.round(b.y)},${Math.round(b.width)},${Math.round(b.height)}` : ""
      const same = now !== "" && now === last
      last = now
      return same
    })
    .toBe(true)
  return (await locator.boundingBox())!
}

test.describe("toasts in the frame (C6)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test("phone: a toast takes the strip's slot above the bottom row, as wide as the strip; never a third bar", async ({ page }) => {
    await open(page, "app-frame-toasts", "vale")
    const frame = contained(page, "No strip")
    const toast = frame.locator("[data-sonner-toast]")
    await expect(toast).toHaveCount(1)
    await expect(toast).toBeVisible()
    const f = (await frame.boundingBox())!
    const bar = (await frame.locator('[data-slot="app-frame-bottom-row-bar"]').boundingBox())!
    const t = await settledBox(toast)
    // 8 above the bar, the strip's place; 16 from each side.
    expect(Math.abs(bar.y - (t.y + t.height) - 8)).toBeLessThanOrEqual(2)
    expect(Math.abs(t.x - f.x - 16)).toBeLessThanOrEqual(2)
    expect(Math.abs(t.width - (f.width - 32))).toBeLessThanOrEqual(2)
  })

  test("a live strip without an action gives way while the toast shows; the toast stands where it stood", async ({ page }) => {
    await open(page, "app-frame-toasts", "vale")
    const frame = contained(page, "Live strip, no action")
    const toast = frame.locator("[data-sonner-toast]")
    await expect(toast).toBeVisible()
    const strip = frame.locator('[data-slot="accessory"]')
    await expect(strip).toHaveAttribute("data-yield", "")
    await expect(strip).toBeHidden()
    const s = (await strip.boundingBox())!
    const t = await settledBox(toast)
    expect(Math.abs(s.y + s.height - (t.y + t.height))).toBeLessThanOrEqual(2)
  })

  test("a live strip with an action is never covered: no toast shows while it is up", async ({ page }) => {
    await open(page, "app-frame-toasts", "vale")
    const frame = contained(page, "Live strip with an action")
    await expect(frame).toHaveAttribute("data-strip", "live-action")
    await page.waitForTimeout(400)
    await expect(frame.locator("[data-sonner-toast]")).toHaveCount(0)
    await expect(frame.locator('[data-slot="accessory"]')).toBeVisible()
  })

  test("a needs-you strip never gives way: the toast sits just under the top row", async ({ page }) => {
    await open(page, "app-frame-toasts", "vale")
    const frame = contained(page, "Needs-you strip")
    const toast = frame.locator("[data-sonner-toast]")
    await expect(toast).toBeVisible()
    await expect(frame.locator('[data-slot="accessory"]')).toBeVisible()
    const top = (await frame.locator('[data-slot="app-frame-top-row"]').boundingBox())!
    const t = await settledBox(toast)
    expect(t.y).toBeGreaterThanOrEqual(top.y + top.height - 1)
    expect(t.y - (top.y + top.height)).toBeLessThanOrEqual(4)
  })
})

test.describe("toasts on a desktop (C6)", () => {
  test("stay at the bottom left of the content", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "app-frame-toasts", "vale")
    const frame = contained(page, "Vale // beside")
    const toast = frame.locator("[data-sonner-toast]")
    await expect(toast).toBeVisible()
    const main = (await frame.locator('[data-slot="app-frame-main"]').boundingBox())!
    const f = (await frame.boundingBox())!
    const t = await settledBox(toast)
    expect(Math.abs(t.x - main.x)).toBeLessThanOrEqual(2)
    expect(Math.abs(f.y + f.height - (t.y + t.height) - 24)).toBeLessThanOrEqual(3)
  })
})

test.describe("list + detail shrink order (C8)", () => {
  test("the sidebar's rail first, then the detail pushed; the frames say which", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "app-frame-shrink", "synapse")
    const room = contained(page, "1180")
    await expect(room).not.toHaveAttribute("data-shrink")
    await expect(room.locator('nav[data-slot="app-frame-sidebar"]')).toHaveAttribute("data-state", "expanded")

    const rail = contained(page, "1050 // content")
    await expect(rail).toHaveAttribute("data-shrink", "rail")
    const sidebar = rail.locator('nav[data-slot="app-frame-sidebar"]')
    await expect(sidebar).toHaveAttribute("data-state", "rail")
    expect(Math.round((await sidebar.boundingBox())!.width)).toBe(48)
    await expect(rail.locator('[data-slot="app-frame-list"]')).toHaveAttribute("data-shown", "")
    await expect(rail.locator('[data-slot="app-frame-detail"]')).toHaveAttribute("data-shown", "")
    // The detail keeps its least width beside the list. Its box, less the room it keeps past the
    // content line as the last column (padding at its end; none before that room existed).
    const beside = rail.locator('[data-slot="app-frame-detail"]')
    const kept = await beside.evaluate((el) => parseFloat(getComputedStyle(el).paddingInlineEnd))
    expect((await beside.boundingBox())!.width - kept).toBeGreaterThanOrEqual(480)

    const push = contained(page, "1050, the least detail")
    await expect(push).toHaveAttribute("data-shrink", "push")
    await expect(push.locator('[data-slot="app-frame-detail"]')).toHaveAttribute("data-pushed", "")
    await expect(push.locator('[data-slot="app-frame-list"]')).not.toHaveAttribute("data-shown")
    await expect(push.getByRole("button", { name: "Back" })).toBeVisible()
  })

  for (const [width, state] of [
    [1440, "expanded"],
    [1100, "expanded"],
    [1099, "rail"],
    [1024, "rail"],
  ] as const) {
    test(`a real window at ${width}: the Vale inbox's sidebar is ${state}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 860 })
      await open(page, "shell-vale", "vale")
      await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", "expanded")
      await expect(page.locator('nav[data-slot="app-frame-sidebar"]')).toHaveAttribute("data-state", state)
      await expect(page.locator('[data-slot="app-frame-detail"]')).toHaveAttribute("data-shown", "")
    })
  }
})

test.describe("pull to refresh (C9)", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  /** A real touch drag through Chromium's input pipeline, so touch-action decides who gets it. */
  async function drag(page: Page, x: number, y: number, dy: number, { lift = true } = {}) {
    const cdp = await page.context().newCDPSession(page)
    const point = (py: number) => [{ x, y: py, id: 1 }]
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: point(y) })
    const steps = 12
    for (let i = 1; i <= steps; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: point(y + (dy * i) / steps) })
    }
    if (lift) await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] })
    return cdp
  }

  async function atRest(page: Page) {
    await open(page, "app-frame-pull", "lockdown")
    const frame = contained(page, "At rest")
    const list = frame.locator('[data-slot="app-frame-list"]')
    await expect(list).toHaveAttribute("data-pull-ready", "")
    const box = (await list.boundingBox())!
    return { frame, list, x: box.x + box.width / 2, y: box.y + 260 }
  }

  test("a pull past 64 from the top runs the refresh; the app's live strip shows; the chrome does not minimize", async ({ page }) => {
    const { frame, list, x, y } = await atRest(page)
    // At the top, a finger moving down is the column's, not the browser's.
    expect(await list.evaluate((el) => getComputedStyle(el).touchAction)).toContain("pan-down")
    await drag(page, x, y, 140)
    await expect(frame.locator('[data-slot="accessory"]')).toBeVisible()
    await expect(frame.locator('[data-slot="accessory"]')).toContainText("Checking for breaches")
    await expect(list).toHaveAttribute("aria-busy", "true")
    expect(await list.evaluate((el) => el.scrollTop)).toBe(0)
    await expect(frame).not.toHaveAttribute("data-minimized")
    // The content went back.
    await expect.poll(() => list.evaluate((el) => getComputedStyle(el).transform)).toBe("none")
  })

  test("a pull short of the line does nothing", async ({ page }) => {
    const { frame, x, y } = await atRest(page)
    await drag(page, x, y, 40)
    await page.waitForTimeout(200)
    await expect(frame.locator('[data-slot="accessory"]')).toHaveCount(0)
  })

  test("a finger moving up scrolls the list as always, and is not a pull", async ({ page }) => {
    const { frame, list, x, y } = await atRest(page)
    await drag(page, x, y + 200, -220)
    await expect.poll(() => list.evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
    await expect(frame.locator('[data-slot="accessory"]')).toHaveCount(0)
  })

  test("under reduced motion the list does not stretch; the mark still shows and changes at the line", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { list, frame, x, y } = await atRest(page)
    await drag(page, x, y, 140, { lift: false })
    await expect(list).toHaveAttribute("data-pull", "armed")
    expect(await list.evaluate((el) => getComputedStyle(el).transform)).toBe("none")
    const mark = frame.locator('[data-slot="app-frame-pull-mark"]')
    await expect(mark).toBeVisible()
    await expect(mark).toHaveAttribute("data-state", "armed")
  })
})

// The late additions inside the real shell demos, where the two 5.1c lanes meet: a part from one
// lane in a frame from the other.
test.describe("the late additions in the shell demos (5.1c)", () => {
  test("Vale on a phone: Archive raises its toast in the frame's own Toaster, in the strip's slot; Undo brings the message back", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, "shell-vale", "vale")
    const row = page.locator("li", { hasText: "Mira Chen" })
    await row.locator('[data-slot="list-row-main"]').click()
    await page.getByRole("button", { name: "Archive", exact: true }).click()
    const toast = page.locator("[data-sonner-toast]")
    await expect(toast).toHaveCount(1)
    await expect(toast).toContainText("Archived Cabin for the 20th, confirmed")
    await expect(row).toHaveCount(0)
    const bar = (await page.locator('[data-slot="app-frame-bottom-row-bar"]').boundingBox())!
    const t = await settledBox(toast)
    expect(Math.abs(bar.y - (t.y + t.height) - 8)).toBeLessThanOrEqual(2)
    expect(Math.abs(t.x - 16)).toBeLessThanOrEqual(2)
    await toast.getByRole("button", { name: "Undo" }).click()
    await expect(row).toHaveCount(1)
  })

  test("Vale on a desktop: Search names its key; Settings carries the update mark in its name", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "shell-vale", "vale")
    await expect(page.getByRole("link", { name: "Search" })).toHaveAttribute("aria-keyshortcuts", "/")
    await expect(page.getByRole("link", { name: /^Settings.*Update ready/ })).toHaveCount(1)
  })

  test("Lockdown on a desktop: the password's and the code's ⋯ open menus with Show large type first; no click slides the detail sideways", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "shell-lockdown", "lockdown")
    const detail = page.locator('[data-slot="app-frame-detail"]')
    const sideways = () => detail.evaluate((el) => el.scrollLeft)
    for (const name of ["More actions for Password", "More actions for Steam Guard"]) {
      await page.getByRole("button", { name }).click()
      const menu = page.getByRole("menu", { name })
      await expect(menu).toBeVisible()
      await expect(menu.getByRole("menuitem").first()).toHaveText("Show large type")
      expect(await sideways()).toBe(0)
      await page.keyboard.press("Escape")
      await expect(menu).toBeHidden()
    }
    // The username's Copy reaches 12 past the row's end too; a click on it does not slide either.
    await detail.getByRole("button", { name: "Copy", exact: true }).first().click()
    expect(await sideways()).toBe(0)
  })

  for (const width of [1440, 1100]) {
    test(`Lockdown at ${width}: Copy and the ⋯ reach past the row's end, and the detail column cuts neither them nor their focus rings`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await open(page, "shell-lockdown", "lockdown")
      const detail = page.locator('[data-slot="app-frame-detail"]')
      const shows = (await detail.boundingBox())!
      const main = (await page.locator('[data-slot="app-frame-main"]').boundingBox())!
      // The content still ends on the content line: a row ends where the main area does.
      const row = (await detail.locator('[data-slot="field-row"]').first().boundingBox())!
      expect(Math.abs(row.x + row.width - (main.x + main.width))).toBeLessThanOrEqual(1)
      const actions = [
        detail.getByRole("button", { name: "Copy", exact: true }).first(),
        page.getByRole("button", { name: "More actions for Password" }),
        page.getByRole("button", { name: "More actions for Steam Guard" }),
      ]
      for (const action of actions) {
        const box = (await action.boundingBox())!
        // Its words (or glyph) line up with the row's end, so its box reaches past it ...
        expect(box.x + box.width).toBeGreaterThan(row.x + row.width)
        // ... and the box with the ring around it (2 + 2) is inside what the column shows.
        expect(box.x + box.width + 4).toBeLessThanOrEqual(shows.x + shows.width)
      }
      // And the room is the page gutter's: the column stays inside the window.
      expect(shows.x + shows.width).toBeLessThanOrEqual(width)
    })
  }

  test("the compact needs-you line on a phone: a title cut to one line keeps its hidden words inside, so the page does not scroll sideways", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await open(page, "needs-you", "lockdown")
    // The line whose title is too long for a phone and ends "// +1" (", 1 more waiting" for a screen reader).
    const title = page.locator('[data-slot="needs-you"][data-size="compact"] [data-slot="needs-you-title"]', { hasText: "Pairing request" }).first()
    await expect(title).toBeVisible()
    expect(await title.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true)
    const pageBox = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    expect(pageBox.scroll).toBeLessThanOrEqual(pageBox.client)
  })
})

// ── Review fixes (2026-11-14): what the frame does that a unit test cannot see ───────────────────

/** A column's or a part's box, rounded. */
async function box(locator: ReturnType<Page["locator"]>) {
  const b = (await locator.boundingBox())!
  return { x: Math.round(b.x), y: Math.round(b.y), right: Math.round(b.x + b.width), bottom: Math.round(b.y + b.height), width: Math.round(b.width), height: Math.round(b.height) }
}

test.describe("the phone's bottom row", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test("detail: the fill slot fills the row (Vale Mobile / 02: the composer runs from 16 to 374)", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    await page.locator('[data-slot="list-row"]').first().click()
    const row = page.locator('[data-slot="app-frame-bottom-row"][data-variant="detail"] [data-slot="app-frame-bottom-row-bar"]')
    await expect(row).toBeVisible()
    const bar = await box(row)
    const composer = await box(row.locator('[data-slot="composer"]'))
    expect(bar.x).toBe(16)
    expect(bar.right).toBe(374)
    // It hugged its own width before and stopped at 268.
    expect(composer.x).toBe(bar.x)
    expect(composer.right).toBe(bar.right)
    // Its send button sits at the row's end.
    const send = await box(row.locator('[data-slot="composer-send"]'))
    expect(bar.right - send.right).toBeLessThanOrEqual(8)
  })

  /** Every animation frame's boxes of the row's parts, from now until they have stood still for a while. */
  async function sampleRow(page: Page, act: () => Promise<void>) {
    await page.evaluate(() => {
      const row = document.querySelector('[data-slot="app-frame-bottom-row-bar"]')!
      const read = () => {
        const of = (sel: string) => {
          const r = row.querySelector(sel)?.getBoundingClientRect()
          return r ? [Math.round(r.left * 10) / 10, Math.round(r.right * 10) / 10] : null
        }
        return { tab: of('[data-slot="tab-bar"]'), end: of('[data-slot="app-frame-bottom-row-end"] [data-slot="float-button"]'), strip: of('[data-slot="app-frame-bottom-row-strip"]') }
      }
      const frames: ReturnType<typeof read>[] = [read()]
      ;(window as unknown as { __frames: typeof frames }).__frames = frames
      const start = performance.now()
      const tick = () => {
        frames.push(read())
        if (performance.now() - start < 900) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    await act()
    await page.waitForTimeout(1000)
    return page.evaluate(() => (window as unknown as { __frames: { tab: number[] | null; end: number[] | null; strip: number[] | null }[] }).__frames)
  }

  for (const [name, theme] of [
    ["shell-vale", "vale"],
    ["shell-lockdown", "lockdown"],
    ["shell-warpcore", "warpcore"],
  ] as const) {
    test(`${name}: minimizing and restoring trade room smoothly, and the create button never moves`, async ({ page }) => {
      await open(page, name, theme)
      const frame = page.locator('[data-slot="app-frame"]')
      const down = await sampleRow(page, () => scrollShown(page, 400))
      await expect(frame).toHaveAttribute("data-minimized", "")
      const rest = down[0]
      expect(rest.tab).not.toBeNull()
      expect(rest.end).not.toBeNull()
      const restWidth = rest.tab![1] - rest.tab![0]
      // The app's primary button stays at the trailing edge through every frame.
      for (const f of down) expect(f.end, "create while minimizing").toEqual(rest.end)
      // The bar gives its room up along the motion, not in one frame: its first frame after the
      // change is still (nearly) its old width. It lost 139 of 198px at once before.
      const widths = down.map((f) => f.tab![1] - f.tab![0])
      const firstChange = widths.findIndex((w) => Math.abs(w - restWidth) > 0.5)
      expect(firstChange).toBeGreaterThan(0)
      expect(restWidth - widths[firstChange]).toBeLessThan(restWidth * 0.35)
      // No frame jumps by more than a third of the way.
      for (let i = 1; i < widths.length; i++) expect(Math.abs(widths[i] - widths[i - 1]), `frame ${i}: ${widths.slice(0, i + 1).join(", ")}`).toBeLessThan(restWidth * 0.35)
      expect(Math.round(widths[widths.length - 1])).toBe(48)
      // The strip's slot opens out of nothing beside the bar and never reaches under the create
      // button; with a strip in it, the two fill the row between the ends at every frame.
      for (const f of down) {
        expect(f.strip![1], "the strip's slot ends before the create button").toBeLessThanOrEqual(rest.end![0] - 7.5)
        expect(f.strip![0], "the strip's slot starts after the bar").toBeGreaterThanOrEqual(f.tab![1] - 0.5)
      }
      const last = down[down.length - 1]
      if (await page.locator('[data-slot="app-frame-bottom-row-strip"] [data-slot="accessory"]').count()) {
        expect(Math.round(last.strip![0] - last.tab![1])).toBe(8)
        expect(Math.round(rest.end![0] - last.strip![1])).toBe(8)
      }

      const up = await sampleRow(page, () => scrollShown(page, 0))
      await expect(frame).not.toHaveAttribute("data-minimized")
      // On the way back the create button jumped 198px to the left, then slid home.
      for (const f of up) expect(f.end, "create while restoring").toEqual(rest.end)
      const back = up.map((f) => f.tab![1] - f.tab![0])
      expect(Math.abs(back[back.length - 1] - restWidth)).toBeLessThan(1)
      for (let i = 1; i < back.length; i++) expect(Math.abs(back[i] - back[i - 1]), `frame ${i} back`).toBeLessThan(restWidth * 0.35)
    })
  }

  test("the active tab's icon is primary-text, as Figma's Dock Tab and the phone frames draw it", async ({ page }) => {
    for (const [name, theme, ink] of [
      ["shell-warpcore", "warpcore", "rgb(161, 174, 255)"],
      ["shell-lockdown", "lockdown", "rgb(103, 202, 133)"],
    ] as const) {
      await open(page, name, theme)
      const active = page.locator('[data-slot="tab-bar"] [data-active]')
      // Warpcore graphite #A1AEFF, Lockdown graphite #67CA85: sampled from the Figma phone frames.
      expect(await active.evaluate((el) => getComputedStyle(el).color)).toBe(ink)
    }
  })
})

test.describe("a pushed detail at medium width has a way back in every shell", () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  for (const [name, theme, bar] of [
    ["shell-warpcore", "warpcore", "app-frame-top-bar"],
    ["shell-vale", "vale", "app-frame-status-line"],
    ["shell-lockdown", "lockdown", "app-frame-status-line"],
  ] as const) {
    test(`${name}: Back in the ${bar === "app-frame-top-bar" ? "top bar" : "status line"}'s leading slot returns to the list`, async ({ page }) => {
      await open(page, name, theme)
      await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", "medium")
      const list = page.locator('[data-slot="app-frame-list"]')
      const detail = page.locator('[data-slot="app-frame-detail"]')
      if (!(await detail.getAttribute("data-pushed"))) await list.locator('[data-slot="list-row"]').first().click()
      await expect(detail).toHaveAttribute("data-pushed", "")
      await expect(list).not.toHaveAttribute("data-shown")
      // Warpcore had no control named Back at all: only the status line drew the frame's back.
      const back = page.locator(`[data-slot="${bar}"]`).getByRole("button", { name: "Back" })
      await expect(back).toBeVisible()
      const b = await box(back)
      const header = await box(page.locator(`[data-slot="${bar}"]`))
      expect(b.x - header.x).toBeLessThan(120)
      // Nothing in the bar is pushed out of it by the button.
      expect(await page.locator(`[data-slot="${bar}"]`).evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
      await back.click()
      await expect(list).toHaveAttribute("data-shown", "")
      await expect(page.locator(`[data-slot="${bar}"]`).getByRole("button", { name: "Back" })).toHaveCount(0)
    })
  }

  test("the sidebar's drawer hands focus back to the expand control on Esc and on Close", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    const expand = page.getByRole("button", { name: "Expand sidebar" })
    const drawer = page.locator('[data-slot="app-frame-sidebar-drawer"]')
    // By keyboard, as the finding was found: focus fell to the body, because the rail under the
    // drawer was still inert when focus() was called.
    await expand.focus()
    await page.keyboard.press("Enter")
    await expect(drawer).toBeVisible()
    expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press("Escape")
    await expect(drawer).toHaveCount(0)
    await expect(expand).toBeFocused()

    await page.keyboard.press("Enter")
    await expect(drawer).toBeVisible()
    await drawer.getByRole("button", { name: "Close sidebar" }).focus()
    await page.keyboard.press("Enter")
    await expect(drawer).toHaveCount(0)
    await expect(expand).toBeFocused()
  })
})

test.describe("the side panel with no room (Synapse, 1024 to 1070 wide)", () => {
  for (const width of [1024, 1040, 1070]) {
    test(`shell-synapse at ${width}: no sheet opens by itself; the page stays usable`, async ({ page }) => {
      await page.setViewportSize({ width, height: 768 })
      await open(page, "shell-synapse", "synapse")
      await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", "expanded")
      // The Activity column has no room: it was drawn as an open modal sheet at load, the page inert under a scrim.
      await page.waitForTimeout(300)
      await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0)
      await expect(page.locator('[data-slot="app-frame-side-panel"]')).toHaveCount(0)
      expect(await page.locator('[data-slot="app-frame-main"]').evaluate((el) => !el.closest("[inert]") && !el.closest('[aria-hidden="true"]'))).toBe(true)
    })
  }

  test("shell-synapse: the column stands when there is room, steps aside when the window narrows, and comes back", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "shell-synapse", "synapse")
    const column = page.locator('aside[data-slot="app-frame-side-panel"]')
    await expect(column).toBeVisible()
    await page.setViewportSize({ width: 1040, height: 900 })
    await expect(column).toHaveCount(0)
    await expect(page.locator('[data-slot="sheet-content"]')).toHaveCount(0)
    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(column).toBeVisible()
  })

  test("as a sheet it opens on a press, and its content keeps the sheet's inset", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await open(page, "app-frame-columns", "synapse")
    const frame = contained(page, "Vale at 1024")
    await frame.scrollIntoViewIfNeeded()
    const sheet = page.locator('[data-slot="sheet-content"]')
    await expect(sheet).toHaveCount(0)
    const button = frame.getByRole("button", { name: "Sender" })
    // `open` was true from the start; the part handed it back, so the button is not pressed.
    await expect(button).toHaveAttribute("aria-pressed", "false")
    await button.click()
    await expect(sheet).toBeVisible()
    const title = await box(sheet.locator('[data-slot="sheet-title"]'))
    const content = await box(sheet.locator('[data-slot="app-frame-side-panel"]'))
    const s = await box(sheet)
    // The first text started on the sheet's own edge (x 640 of a sheet at 640); the title was 16 in.
    expect(content.x).toBe(title.x)
    expect(content.x - s.x).toBe(16)
    await page.keyboard.press("Escape")
    await expect(sheet).toHaveCount(0)
    await expect(button).toHaveAttribute("aria-pressed", "false")
  })
})

test.describe("the desktop demos against their Figma frames (1440 wide)", () => {
  test.use({ viewport: { width: 1440, height: 1024 } })

  test("Warpcore: top tabs 28 apart; the chips 16 under the head and the first row at y 248 (Desktop / 01)", async ({ page }) => {
    await open(page, "shell-warpcore", "warpcore")
    // All 19 desktop frames: tab boxes at x 276, 374, 472 (70 wide, 28 between). They were 32 apart.
    // The gap and the first tab's x are layout, and are pinned exactly. A later tab's x also carries
    // the label's glyph widths, which differ by a few px between machines (this container draws the
    // first tab 70.27 wide and the tabs at 276, 374, 473; the CI runner drew 276, 377, 477), so a
    // tab's width is held to Figma's 70 within 4 px instead.
    const tabs = await page.locator('[data-slot="top-tab"]').evaluateAll((all) =>
      all.slice(0, 3).map((el) => {
        const r = el.firstElementChild!.getBoundingClientRect()
        return { left: r.left, right: r.right, width: r.width }
      }),
    )
    expect(Math.round(tabs[0].left)).toBe(276)
    expect(tabs[1].left - tabs[0].right).toBeCloseTo(28, 1)
    expect(tabs[2].left - tabs[1].right).toBeCloseTo(28, 1)
    // CHAT and DOCS are 70 wide in the frames; TASKS carries a count and is wider.
    for (const tab of tabs.slice(0, 2)) expect(Math.abs(tab.width - 70)).toBeLessThanOrEqual(4)
    const list = page.locator('[data-slot="app-frame-list"]')
    const head = await box(list.locator('[data-slot="page-head"]'))
    const chips = await box(list.locator('[data-slot="filter-chip-group"]'))
    const first = await box(list.locator('[data-slot="list-row"]').first())
    expect([head.bottom, chips.y, chips.bottom, first.y]).toEqual([180, 196, 220, 248])
    // rules.md 5.4: the chips sit closer to their title than to the list (16 to 28). It was 32 to 28.
    expect(chips.y - head.bottom).toBeLessThan(first.y - chips.bottom)
    // The detail: the task's line, its title, what it does, the steps, 32 apart; the first step at y 356.
    const detail = page.locator('[data-slot="app-frame-detail"]')
    const title = await box(detail.locator('[data-slot="page-head-title"]'))
    const prose = await box(detail.locator('[data-slot="prose"]').first())
    const steps = await box(detail.locator('[data-slot="steps"]'))
    expect([title.y, title.bottom, prose.y, steps.y]).toEqual([144, 180, 212, 356])
    // The title is no further from its description than the blocks are from each other (it was 64 to 32).
    expect(prose.y - title.bottom).toBe(32)
  })

  test("Vale: the title 24 over the summary, as every block of the message (Desktop / 01)", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    const detail = page.locator('[data-slot="app-frame-detail"]')
    const meta = await box(detail.locator('[data-slot="meta-list"]'))
    const title = await box(detail.locator('[data-slot="page-head-title"]'))
    const summary = await box(detail.locator('[data-slot="summary-block"]'))
    const body = await box(detail.locator('[data-slot="prose"]').first())
    // Figma: the meta at y 96, the title's line 160 to 196, the summary's bar 220 to 328.
    expect([meta.y, title.y, title.bottom, summary.y, summary.bottom]).toEqual([96, 160, 196, 220, 328])
    // It was 64 from title to summary with 32 between the other blocks.
    expect(summary.y - title.bottom).toBe(24)
    expect(body.y - summary.bottom).toBe(24)
  })

  test("Lockdown: the request 16 under the head at y 216, the fields 24 under it (Desktop / 01)", async ({ page }) => {
    await open(page, "shell-lockdown", "lockdown")
    const detail = page.locator('[data-slot="app-frame-detail"]')
    const head = await box(detail.locator('[data-slot="page-head"]'))
    const request = await box(detail.locator('[data-slot="needs-you"]'))
    const field = await box(detail.locator('[data-slot="field-row"]').first())
    // Figma draws the yellow block from y 216 to 376 and the first field's rule at y 400. It was at 264.
    expect([head.bottom, request.y, request.bottom, field.y]).toEqual([200, 216, 376, 400])
    expect(request.y - head.bottom).toBeLessThan(field.y - request.bottom)
  })

  test("Synapse: the Failing checks header stays with its list; the request at y 452 (Desktop / 01)", async ({ page }) => {
    await open(page, "shell-synapse", "synapse")
    const column = page.locator('[data-slot="app-frame-main"] [data-column="content"]').first()
    const request = await box(column.locator('[data-slot="needs-you"]'))
    const header = await box(column.locator('[data-slot="section-header"]').filter({ hasText: "Failing checks" }))
    const first = await box(column.locator('[data-slot="list-row"]').first())
    // Figma: the request 452 to 612, the header's line over the first row's rule at y 672.
    expect([request.y, request.bottom, header.bottom, first.y]).toEqual([452, 612, 672, 672])
    // The header was 32 from its own list, the same as the space between blocks.
    expect(first.y - header.bottom).toBeLessThan(header.y - request.bottom)
  })
})

test.describe("the phone demos' heads", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  test("Warpcore: the chips 16 under the title and the list 16 under the chips (Mobile / 06)", async ({ page }) => {
    await open(page, "shell-warpcore", "warpcore")
    const list = page.locator('[data-slot="app-frame-list"]')
    const head = await box(list.locator('[data-slot="page-head"]'))
    const chips = await box(list.locator('[data-slot="filter-chip-group"]'))
    const first = await box(list.locator('[data-slot="list-row"]').first())
    expect(chips.y - head.bottom).toBe(16)
    expect(first.y - chips.bottom).toBe(16)
    expect(chips.x).toBe(16)
  })

  test("Synapse: the Failing checks header sits on its list", async ({ page }) => {
    await open(page, "shell-synapse", "synapse")
    const header = await box(page.locator('[data-slot="section-header"]').filter({ hasText: "Failing checks" }))
    const first = await box(page.locator('[data-slot="list-row"]').first())
    expect(first.y - header.bottom).toBe(0)
  })
})

// ── the second review pass (2026-11-14, should-fix) ─────────────────────────────────────────────

test.describe("the short-screen rule is for scarce height", () => {
  for (const [width, height, layout] of [
    [430, 667, "phone"],
    [528, 844, "phone"],
    [560, 844, "phone"],
    [599, 844, "phone"],
    [599, 900, "phone"],
    [375, 667, "phone"],
    [382, 580, "rail"],
    [385, 571, "rail"],
    [844, 390, "rail"],
  ] as const) {
    test(`${width} × ${height} is ${layout}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true })
      const page = await context.newPage()
      await open(page, "shell-vale", "vale")
      await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", layout)
      await context.close()
    })
  }
})

test.describe("the short screen's trailing column has a floor", () => {
  for (const [name, theme] of [
    ["shell-vale", "vale"],
    ["shell-synapse", "synapse"],
    ["shell-warpcore", "warpcore"],
  ] as const) {
    for (const [width, height] of [
      [667, 320],
      [740, 340],
      [844, 345],
      [844, 390],
    ] as const) {
      test(`${name} at ${width} × ${height}: create stays on screen, and every tab is still there`, async ({ browser }) => {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: true, isMobile: true })
        const page = await context.newPage()
        await open(page, name, theme)
        await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", "rail")
        const seen = await page.locator('[data-slot="app-frame-rail"]').evaluate((rail) => {
          const buttons = [...rail.querySelectorAll('[data-slot="float-button"]')].map((el) => el.getBoundingClientRect())
          const tabs = [...rail.querySelectorAll('[data-slot="tab-bar-item"]')].map((el) => el.getBoundingClientRect().height)
          const create = buttons[buttons.length - 1]!
          return { createTop: create.top, createBottom: create.bottom, buttonHeights: buttons.map((b) => b.height), tabs }
        })
        // The app's primary action: whole, and 16 clear of the screen's end.
        expect(seen.createBottom).toBeLessThanOrEqual(height - 16)
        expect(seen.createTop).toBeGreaterThanOrEqual(0)
        // The buttons never shrink; the tabs share what is left, 24 at least, 40 where there is room.
        for (const h of seen.buttonHeights) expect(h).toBe(48)
        expect(seen.tabs.length).toBeGreaterThanOrEqual(3)
        for (const h of seen.tabs) expect(h).toBeGreaterThanOrEqual(24)
        if (height >= 390) for (const h of seen.tabs) expect(h).toBe(40)
        await context.close()
      })
    }
  }
})

test.describe("the bottom fade is fixed to the bottom row", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })

  for (const [name, theme, strip] of [
    ["shell-vale", "vale", false],
    ["shell-lockdown", "lockdown", true],
    ["shell-warpcore", "warpcore", true],
  ] as const) {
    test(`${name}: it fades over 80 and is solid from 40 above the row${strip ? ", with a strip on the row" : ""}`, async ({ page }) => {
      await open(page, name, theme)
      const seen = await page.evaluate(() => {
        const row = document.querySelector('[data-slot="app-frame-bottom-row-bar"]')!.getBoundingClientRect()
        const edge = document.querySelector('[data-slot="app-frame-scroll-edge"][data-edge="bottom"]')!
        const box = edge.getBoundingClientRect()
        const strip = document.querySelector('[data-slot="app-frame-strip"] > *')
        const column = document.querySelector("[data-column][data-shown]")!
        return {
          fadeFrom: row.top - box.top,
          left: box.left,
          right: innerWidth - box.right,
          toTheEnd: box.bottom >= innerHeight,
          mask: getComputedStyle(edge).maskImage,
          strip: strip !== null && strip.getBoundingClientRect().height > 0,
          clear: Number.parseFloat(getComputedStyle(column).paddingBottom) - (innerHeight - row.top),
        }
      })
      // Figma (Vale Mobile / 01, Lockdown Mobile / 01): 640 to 720 with the row at 760.
      expect(seen.fadeFrom).toBe(120)
      expect(seen.mask).toContain("80px")
      expect([seen.left, seen.right, seen.toTheEnd]).toEqual([0, 0, true])
      expect(seen.strip).toBe(strip)
      // The content rests clear of the whole fade, strip or no strip.
      expect(seen.clear).toBe(120)
    })
  }
})

test.describe("focus after the shell's own controls", () => {
  test("the sidebar: Collapse hands focus to Expand, and Expand to Collapse", async ({ page }) => {
    await open(page, "app-frame-sidebar", "vale")
    const collapse = page.getByRole("button", { name: "Collapse sidebar" }).first()
    await collapse.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Expand sidebar" }).first()).toBeFocused()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Collapse sidebar" }).first()).toBeFocused()
  })

  test("the context panel: Collapse hands focus to Expand, and a rail item to its tab", async ({ page }) => {
    await open(page, "context-panel", "warpcore")
    const collapse = page.getByRole("button", { name: "Collapse panel" }).first()
    await collapse.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("button", { name: "Expand panel" }).first()).toBeFocused()
    const item = page.getByRole("button", { name: /^Artifacts/ }).first()
    await item.focus()
    await page.keyboard.press("Enter")
    await expect(page.getByRole("tab", { name: /^Artifacts/ }).first()).toBeFocused()
  })

  test.describe("at medium width", () => {
    test.use({ viewport: { width: 768, height: 1024 } })

    for (const [name, theme] of [
      ["shell-vale", "vale"],
      ["shell-synapse", "synapse"],
    ] as const) {
      test(`${name}: Tab out of the sidebar's drawer closes it, and focus stays where Tab went`, async ({ page }) => {
        await open(page, name, theme)
        await page.getByRole("button", { name: "Expand sidebar" }).first().click()
        const drawer = page.locator('[data-slot="app-frame-sidebar-drawer"]')
        await expect(drawer).toBeVisible()
        let left = false
        for (let i = 0; i < 40 && !left; i++) {
          await page.keyboard.press("Tab")
          left = await page.evaluate(() => {
            const open = document.querySelector('[data-slot="app-frame-sidebar-drawer"]')
            return open === null || !open.contains(document.activeElement)
          })
        }
        expect(left).toBe(true)
        await expect(drawer).toHaveCount(0)
        // Not back on the expand control, and not on the body: on the page, where Tab sent it.
        const active = await page.evaluate(() => ({ body: document.activeElement === document.body, expand: document.activeElement?.getAttribute("aria-label") === "Expand sidebar" }))
        expect(active).toEqual({ body: false, expand: false })
      })
    }

    test("a list that is the only column reaches the content line, where the header's rule ends", async ({ page }) => {
      for (const [name, theme] of [
        ["shell-vale", "vale"],
        ["shell-lockdown", "lockdown"],
        ["shell-warpcore", "warpcore"],
      ] as const) {
        await open(page, name, theme)
        const seen = await page.evaluate(() => {
          const list = document.querySelector('[data-slot="app-frame-list"]')!
          const row = list.querySelector('[data-slot="list-row"]')!.getBoundingClientRect()
          const head = (document.querySelector('[data-slot="app-frame-status-line"]') ?? document.querySelector('[data-slot="app-frame-top-bar"]'))!.getBoundingClientRect()
          return { row: Math.round(row.right), head: Math.round(head.right) }
        })
        expect(seen.row, name).toBe(seen.head)
      }
    })
  })

  test("a control at a column's start edge has room for its focus ring", async ({ page }) => {
    await open(page, "shell-warpcore", "warpcore")
    const seen = await page.evaluate(() => {
      const chip = document.querySelector('[data-slot="filter-chip"]')!
      const column = chip.closest("[data-column]")!
      return { room: chip.getBoundingClientRect().left - column.getBoundingClientRect().left, clip: getComputedStyle(column).overflowX }
    })
    // A 2px ring, 2px clear of the chip.
    expect(seen.room).toBeGreaterThanOrEqual(4)
  })
})

test("Lockdown scrolled on a phone: the small title is the page head's own, Items", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  await open(page, "shell-lockdown", "lockdown")
  await scrollShown(page, 400)
  await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-minimized", "")
  await expect(page.locator('[data-slot="app-frame-top-row"]')).toContainText("Items")
  await expect(page.locator('[data-slot="app-frame-top-row"]')).not.toContainText("Personal")
  await context.close()
})

test("the chat workspace's heads against Figma cw-01: the conversation's overline at y 84, its lead title, the panel's controls from y 88", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1024 })
  await open(page, "context-panel", "warpcore")
  const seen = await page.evaluate(() => {
    const frame = document.querySelector('[data-slot="app-frame-contained"], [data-slot="app-frame"]')!
    const top = frame.getBoundingClientRect().top
    const y = (selector: string) => {
      const box = frame.querySelector(selector)!.getBoundingClientRect()
      return [Math.round(box.top - top), Math.round(box.bottom - top)]
    }
    const title = getComputedStyle(frame.querySelector('[data-slot="page-head-title"]')!)
    return {
      overline: y('[data-slot="page-head-overline"]'),
      title: y('[data-slot="page-head-title"]'),
      font: `${title.fontWeight} ${title.fontSize}/${title.lineHeight}`,
      collapse: y('[data-slot="context-panel"] [data-slot="float-button"]'),
      tab: y('[data-slot="context-panel-tab"]'),
      firstMessage: y('[data-slot="chat-message"]')[0],
    }
  })
  expect(seen).toEqual({ overline: [84, 100], title: [104, 136], font: "500 24px/32px", collapse: [88, 132], tab: [98, 122], firstMessage: 156 })
})
