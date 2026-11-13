// Each motion contract, checked in a real browser against the playground's Motion view.
//
// The contracts are data (packages/ui/src/lib/motion/contracts.ts). For each one this file
// triggers its specimen, reads the live animations, and asserts that it moves only what the
// contract lists, for no longer than its role allows, and never past the 400ms ceiling. It then
// repeats the run under reduced motion, checks that a reversal carries on from where it was, and
// saves a start, middle and end frame of every entrance to the test output.
import { expect, test, type Locator, type Page } from "@playwright/test"

import { motionContracts, type MotionContract } from "../../../packages/ui/src/lib/motion/contracts"

const CEILING_MS = 400
/** Recipes that open and close, so they have an exit and can be reversed mid-way. */
const TOGGLES = new Set(["pop", "slide", "collapse"])

/**
 * Under reduced motion the system still lets colour fade (index.css → reduced motion): a colour
 * change moves nothing. So a colour may animate there whatever the recipe; anything else may not.
 */
const COLOUR_ONLY = ["color", "background-color", "border-color", "outline-color", "text-decoration-color", "fill", "stroke"]

interface Seen {
  property: string
  duration: number
  /** Delay plus duration: when this animation is over. */
  end: number
}

/** Pause the specimen's animations where they are and describe them. */
async function freeze(card: Locator): Promise<Seen[]> {
  return card.evaluate((el) => {
    const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
    const seen: { property: string; duration: number; end: number }[] = []
    for (const animation of el.getAnimations({ subtree: true })) {
      const effect = animation.effect as KeyframeEffect | null
      if (!effect?.target?.closest("[data-specimen]")) continue
      animation.pause()
      const timing = effect.getComputedTiming()
      const duration = Number(timing.duration)
      const end = Number(timing.delay ?? 0) + duration
      const properties =
        animation instanceof CSSTransition
          ? [animation.transitionProperty]
          : [...new Set(effect.getKeyframes().flatMap((frame) => Object.keys(frame)))]
              .filter((key) => !["offset", "computedOffset", "easing", "composite"].includes(key))
              .map(kebab)
      // A transition reports each side of a border on its own; the contract says "border-color".
      const named = properties.map((property) => property.replace(/^border-(top|right|bottom|left)-color$/, "border-color"))
      for (const property of new Set(named)) seen.push({ property, duration, end })
    }
    return seen
  })
}

/** Move every paused specimen animation to a share of the whole run (0 = start, 1 = end). */
async function seek(card: Locator, share: number) {
  await card.evaluate((el, at) => {
    const animations = el
      .getAnimations({ subtree: true })
      .filter((a) => (a.effect as KeyframeEffect | null)?.target?.closest("[data-specimen]"))
    const total = Math.max(0, ...animations.map((a) => Number(a.effect!.getComputedTiming().endTime)))
    for (const animation of animations) {
      animation.currentTime = Math.min(total * at, Number(animation.effect!.getComputedTiming().endTime))
    }
  }, share)
}

async function release(card: Locator) {
  await card.evaluate((el) => {
    for (const animation of el.getAnimations({ subtree: true })) animation.finish()
  })
}

async function roleMs(page: Page, role: string): Promise<number> {
  const raw = await page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), role)
  const match = /^([\d.]+)(ms|s)$/.exec(raw)
  if (!match) throw new Error(`${role} is not a duration: "${raw}"`)
  return Number(match[1]) * (match[2] === "s" ? 1000 : 1)
}

/** Start the contract's motion and return its card. Press is held; everything else is a click. */
async function trigger(page: Page, contract: MotionContract): Promise<Locator> {
  const card = page.locator(`[data-contract="${contract.id}"]`)
  await card.scrollIntoViewIfNeeded()
  if (contract.id === "press") {
    await card.locator("[data-specimen]").hover()
    await page.mouse.down()
  } else {
    await card.locator("[data-trigger]").click()
  }
  return card
}

function expectWithinContract(seen: Seen[], contract: MotionContract, allowed: readonly string[], limitMs: number) {
  for (const { property, duration, end } of seen) {
    expect(allowed, `${contract.id} animates ${property}`).toContain(property)
    expect(duration, `${contract.id}: ${property} runs ${duration}ms, over ${contract.duration}`).toBeLessThanOrEqual(limitMs + 1)
    expect(end, `${contract.id}: ${property} ends at ${end}ms, past the ceiling`).toBeLessThanOrEqual(CEILING_MS + 1)
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/?view=motion")
  await expect(page.locator('[data-slot="motion-view"]')).toBeVisible()
})

test("every contract has a card, and every card a contract", async ({ page }) => {
  const ids = await page.locator("[data-contract]").evaluateAll((cards) => cards.map((c) => c.getAttribute("data-contract")))
  expect(ids).toEqual(motionContracts.map((c) => c.id))
})

test("the roles resolve, and none of the transition roles is over the ceiling", async ({ page }) => {
  for (const role of ["--motion-press", "--motion-fast", "--motion-base", "--motion-state", "--motion-move"]) {
    expect(await roleMs(page, role), role).toBeLessThanOrEqual(CEILING_MS)
  }
  // Each curve is drawn from the value the stylesheet resolved, so an empty one would show here.
  for (const figure of await page.locator("[data-curve] path").all()) {
    expect((await figure.getAttribute("d"))?.length ?? 0).toBeGreaterThan(20)
  }
})

for (const contract of motionContracts as readonly MotionContract[]) {
  test.describe(contract.id, () => {
    test("moves only what it says, for as long as it says", async ({ page }, testInfo) => {
      const limit = await roleMs(page, contract.duration)
      const card = await trigger(page, contract)
      const seen = await freeze(card)
      expect(seen.length, `${contract.id} did not animate`).toBeGreaterThan(0)
      expectWithinContract(seen, contract, contract.properties, limit)
      // At least one thing it promises to move is moving.
      expect(seen.some((s) => contract.properties.includes(s.property))).toBe(true)

      // Start, middle and end of the entrance, as pictures.
      for (const [name, share] of [["start", 0], ["middle", 0.5], ["end", 1]] as const) {
        await seek(card, share)
        const file = testInfo.outputPath(`${contract.id}-${name}.png`)
        await card.screenshot({ path: file })
        await testInfo.attach(`${contract.id} ${name}`, { path: file, contentType: "image/png" })
      }
      await release(card)
      if (contract.id === "press") await page.mouse.up()

      if (TOGGLES.has(contract.id)) {
        await card.locator("[data-trigger]").click()
        const leaving = await freeze(card)
        expect(leaving.length, `${contract.id} did not animate on the way out`).toBeGreaterThan(0)
        expectWithinContract(leaving, contract, contract.properties, limit)
        await release(card)
      }
    })

    test("does not move under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      const card = await trigger(page, contract)
      const seen = await freeze(card)
      for (const { property } of seen) {
        expect([...contract.reducedProperties, ...COLOUR_ONLY], `${contract.id} still animates ${property} under reduced motion`).toContain(property)
      }
      await release(card)
      if (contract.id === "press") {
        // Held down and reduced: the control keeps its size.
        expect(await card.locator("[data-specimen]").evaluate((el) => getComputedStyle(el).scale)).toBe("none")
        await page.mouse.up()
      } else {
        // The end state is there all the same: nothing is lost with the movement.
        await expect(card.locator("[data-specimen]")).toBeVisible()
      }
    })

    test("does not move inside a data-motion=reduced box", async ({ page }) => {
      await page.locator('[data-mode="reduced"]').click()
      const card = await trigger(page, contract)
      const seen = await freeze(card)
      for (const { property } of seen) {
        expect([...contract.reducedProperties, ...COLOUR_ONLY], `${contract.id} still animates ${property} in a reduced box`).toContain(property)
      }
      await release(card)
      if (contract.id === "press") await page.mouse.up()
    })

    if (TOGGLES.has(contract.id)) {
      test("reversed mid-way, it carries on from where it was", async ({ page }) => {
        const card = await trigger(page, contract)
        await freeze(card)
        await seek(card, 0.5)
        const specimen = card.locator("[data-specimen]")
        const mid = Number(await specimen.evaluate((el) => getComputedStyle(el).opacity))
        expect(mid).toBeGreaterThan(0)
        expect(mid).toBeLessThan(1)
        // Close it while it is half open. The new transition must start from the half-way value,
        // not jump to either end.
        await card.locator("[data-trigger]").click()
        const reversing = await freeze(card)
        expect(reversing.length).toBeGreaterThan(0)
        const after = Number(await specimen.evaluate((el) => getComputedStyle(el).opacity))
        expect(Math.abs(after - mid)).toBeLessThan(0.1)
        await release(card)
      })
    }
  })
}
