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
        // List 432 + 12, the rule, the detail.
        const list = (await page.locator('[data-slot="app-frame-list"]').boundingBox())!
        expect(Math.round(list.width)).toBe(444)
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
    // The detail keeps its least width beside the list.
    expect((await rail.locator('[data-slot="app-frame-detail"]').boundingBox())!.width).toBeGreaterThanOrEqual(480)

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
