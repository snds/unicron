// The playground shell: the address is the state. A view is a file in src/views, the theme is two
// axes on <html> (data-theme for the app, the `dark` class for the ground), and every later check
// and every screenshot (scripts/shots.mjs) reaches a page through these parameters.
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import { expect, test, type Page } from "@playwright/test"

const viewsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src/views")
const VIEW_FILES = fs
  .readdirSync(viewsDir)
  .filter((file) => /\.tsx$/.test(file) && !/\.test\.tsx$/.test(file))
  .map((file) => file.replace(/\.tsx$/, ""))
  .sort()

const view = (page: Page) => page.locator('[data-slot="playground-view"]')
const html = (page: Page) => page.locator("html")

async function ready(page: Page, name: string) {
  await expect(view(page)).toHaveAttribute("data-view", name)
  await expect(view(page)).toHaveAttribute("data-view-state", "ready")
}

test("with no parameters it shows Foundations, and sets no data-theme", async ({ page }) => {
  await page.goto("/")
  await ready(page, "foundations")
  await expect(page.locator('[data-slot="foundations"]')).toBeVisible()
  // No attribute: the tokens' own default mode shows, and the switcher names it.
  await expect(html(page)).not.toHaveAttribute("data-theme")
  await expect(page.locator('[data-switch="theme"]').getByRole("button", { name: "Warpcore" })).toHaveAttribute("aria-pressed", "true")
})

test("every file in src/views is a view, and the picker lists them all", async ({ page }) => {
  await page.goto("/")
  await ready(page, "foundations")
  const options = await page.getByRole("combobox", { name: "View" }).locator("option").evaluateAll((all) => all.map((option) => (option as HTMLOptionElement).value))
  expect([...options].sort()).toEqual(VIEW_FILES)
  // Foundations leads the list.
  expect(options[0]).toBe("foundations")
})

for (const name of VIEW_FILES) {
  test(`?view=${name} mounts`, async ({ page }) => {
    const errors: string[] = []
    page.on("pageerror", (error) => errors.push(error.message))
    await page.goto(`/?view=${name}`)
    await ready(page, name)
    expect(errors).toEqual([])
  })
}

test("the address sets both axes on <html>", async ({ page }) => {
  await page.goto("/?view=foundations&theme=vale&ground=stone")
  await ready(page, "foundations")
  await expect(html(page)).toHaveAttribute("data-theme", "vale")
  await expect(html(page)).not.toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page.locator('[data-switch="ground"]').getByRole("button", { name: "Stone" })).toHaveAttribute("aria-pressed", "true")

  await page.goto("/?view=foundations&theme=synapse&ground=graphite")
  await ready(page, "foundations")
  await expect(html(page)).toHaveAttribute("data-theme", "synapse")
  await expect(html(page)).toHaveClass(/(^|\s)dark(\s|$)/)
})

test("the ground in the address wins over the system's color scheme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" })
  await page.goto("/?ground=graphite")
  await expect(html(page)).toHaveClass(/(^|\s)dark(\s|$)/)
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/?ground=stone")
  await expect(html(page)).not.toHaveClass(/(^|\s)dark(\s|$)/)
})

test("the switcher writes the address and the document, without a page load", async ({ page }) => {
  await page.goto("/?view=foundations")
  await ready(page, "foundations")
  await page.evaluate(() => ((window as unknown as { stayed: boolean }).stayed = true))

  const themes = page.locator('[data-switch="theme"]')
  await themes.getByRole("button", { name: "Lockdown" }).click()
  await expect(html(page)).toHaveAttribute("data-theme", "lockdown")
  await expect(page).toHaveURL(/[?&]theme=lockdown(&|$)/)
  await expect(themes.getByRole("button", { name: "Lockdown" })).toHaveAttribute("aria-pressed", "true")
  await expect(themes.getByRole("button", { name: "Warpcore" })).toHaveAttribute("aria-pressed", "false")

  // A theme is never off: pressing the one that is on changes nothing.
  await themes.getByRole("button", { name: "Lockdown" }).click()
  await expect(html(page)).toHaveAttribute("data-theme", "lockdown")
  await expect(themes.getByRole("button", { name: "Lockdown" })).toHaveAttribute("aria-pressed", "true")

  const grounds = page.locator('[data-switch="ground"]')
  await grounds.getByRole("button", { name: "Graphite" }).click()
  await expect(html(page)).toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page).toHaveURL(/[?&]ground=graphite(&|$)/)
  await grounds.getByRole("button", { name: "Stone" }).click()
  await expect(html(page)).not.toHaveClass(/(^|\s)dark(\s|$)/)
  await expect(page).toHaveURL(/[?&]ground=stone(&|$)/)
  // The view and the theme are still in the address.
  await expect(page).toHaveURL(/[?&]view=foundations(&|$)/)
  await expect(page).toHaveURL(/[?&]theme=lockdown(&|$)/)

  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true)
})

test("picking a view changes the address, and Back returns", async ({ page }) => {
  await page.goto("/?view=foundations&theme=vale")
  await ready(page, "foundations")
  await page.getByRole("combobox", { name: "View" }).selectOption("motion")
  await ready(page, "motion")
  await expect(page.locator('[data-slot="motion-view"]')).toBeVisible()
  await expect(page).toHaveURL(/[?&]view=motion(&|$)/)
  await expect(html(page)).toHaveAttribute("data-theme", "vale")
  await page.goBack()
  await ready(page, "foundations")
})

test("a view that does not exist says so, and the picker still works", async ({ page }) => {
  await page.goto("/?view=no-such-view")
  await expect(view(page)).toHaveAttribute("data-view-state", "missing")
  await expect(page.getByRole("heading", { name: /No view named/ })).toBeVisible()
  await page.getByRole("combobox", { name: "View" }).selectOption("foundations")
  await ready(page, "foundations")
})

test("?chrome=0 leaves only the view", async ({ page }) => {
  await page.goto("/?view=foundations&chrome=0")
  await ready(page, "foundations")
  await expect(page.locator('[data-slot="playground-bar"]')).toHaveCount(0)
  await page.goto("/?view=foundations")
  await expect(page.locator('[data-slot="playground-bar"]')).toBeVisible()
})

test("the bar fits a phone without scrolling sideways", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/?view=foundations")
  await ready(page, "foundations")
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})
