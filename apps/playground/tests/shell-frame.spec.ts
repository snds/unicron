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
