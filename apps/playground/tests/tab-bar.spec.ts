// The tab bar in a real browser (Unicron 29, 64, 65): on a very short screen the vertical bar keeps
// every tab at the 44px touch floor and scrolls instead of squeezing them, and the create button
// under it stays on screen; a minimized bar opens up for the keyboard.
import { expect, test, type Page } from "@playwright/test"

const view = (page: Page) => page.locator('[data-slot="playground-view"]')

async function open(page: Page, name: string, theme: string) {
  await page.goto(`/?view=${name}&theme=${theme}&ground=graphite&chrome=0`)
  await expect(view(page)).toHaveAttribute("data-view-state", "ready")
  await page.evaluate(() => document.fonts.ready)
}

test.describe("a phone on its side, 667 × 320, with four tabs (Unicron 29, 64)", () => {
  test.use({ viewport: { width: 667, height: 320 }, hasTouch: true, isMobile: true })

  test("every tab is 44 tall, the bar scrolls to reach the last one, and create stays on screen", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    await expect(page.locator('[data-slot="app-frame"]')).toHaveAttribute("data-layout", "rail")
    const bar = page.locator('[data-slot="app-frame-rail-bottom"] [data-slot="tab-bar"]')
    await expect(bar).toHaveAttribute("data-orientation", "vertical")
    const tabs = bar.getByRole("tab")
    await expect(tabs).toHaveCount(4)
    for (const tab of await tabs.all()) {
      expect(Math.round((await tab.boundingBox())!.height)).toBe(44)
    }
    // Four 44s do not fit in what the column leaves: the bar scrolls, a slide along it scrolls it.
    await expect(bar).toHaveAttribute("data-scrolls", "")
    expect(await bar.evaluate((el) => getComputedStyle(el).overflowY)).toBe("auto")
    expect(await bar.evaluate((el) => getComputedStyle(el).touchAction)).toBe("pan-y")
    expect(await bar.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true)

    // The column's last button, the app's create, is whole and on screen.
    const create = page.locator('[data-slot="app-frame-rail-bottom"] > :last-child')
    const c = (await create.boundingBox())!
    expect(c.y).toBeGreaterThanOrEqual(0)
    expect(c.y + c.height).toBeLessThanOrEqual(320)

    // The last tab is reached by scrolling the bar, at full size, and it picks its section.
    const last = tabs.last()
    await last.scrollIntoViewIfNeeded()
    const b = (await bar.boundingBox())!
    const l = (await last.boundingBox())!
    expect(l.y + l.height).toBeLessThanOrEqual(b.y + b.height + 1)
    expect(Math.round(l.height)).toBe(44)
    await last.tap()
    await expect(last).toHaveAttribute("aria-selected", "true")
  })

  test("the keyboard reaches every tab: arrow keys move along the bar and scroll it", async ({ page }) => {
    await open(page, "shell-vale", "vale")
    const bar = page.locator('[data-slot="app-frame-rail-bottom"] [data-slot="tab-bar"]')
    const first = bar.getByRole("tab").first()
    await first.focus()
    for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowDown")
    const last = bar.getByRole("tab").last()
    await expect(last).toBeFocused()
    await expect(last).toHaveAttribute("aria-selected", "true")
    const b = (await bar.boundingBox())!
    const l = (await last.boundingBox())!
    expect(l.y).toBeGreaterThanOrEqual(b.y - 1)
    expect(l.y + l.height).toBeLessThanOrEqual(b.y + b.height + 1)
  })
})

test.describe("a minimized bar and the keyboard (Unicron 65)", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("Tab into the scrolled bar: it expands, the arrow keys move; Tab out: it minimizes again", async ({ page }) => {
    await open(page, "tab-bar", "vale")
    const scrolled = page.locator("section", { hasText: "Scrolled //" })
    const bar = scrolled.locator('[data-slot="tab-bar"]')
    await expect(bar).toHaveAttribute("data-minimized", "")
    await scrolled.getByRole("button", { name: "Search" }).focus()
    await page.keyboard.press("Tab")
    await expect(bar).not.toHaveAttribute("data-minimized")
    await expect(bar.getByRole("tab")).toHaveCount(4)
    await page.keyboard.press("ArrowRight")
    await expect(bar.getByRole("tab", { name: "Calendar" })).toBeFocused()
    await expect(bar.getByRole("tab", { name: "Calendar" })).toHaveAttribute("aria-selected", "true")
    // On out of the bar: minimized again, on the newly picked tab.
    await page.keyboard.press("Tab")
    await expect(bar).toHaveAttribute("data-minimized", "")
  })
})
