// Each motion contract, checked in a real browser against the playground's Motion view.
//
// The contracts are data (packages/ui/src/lib/motion/contracts.ts). For each one this file
// triggers it, reads the live animations, and asserts that it moves only what the contract lists,
// for no longer than its role allows, and never past the 400ms ceiling. It then repeats the run
// under reduced motion, checks that a reversal carries on from where it was, and saves a start,
// middle and end frame of every entrance to the test output.
//
// A recipe is shown on a specimen inside its card. A component (a contract with `surfaces`) is
// the real thing, and its moving parts are found in the document, since most render in a portal.
import { expect, test, type Locator, type Page } from "@playwright/test"

import { motionContracts, type MotionContract } from "../../../packages/ui/src/lib/motion/contracts"

const CEILING_MS = 400
/** Contracts that open and close, so they have an exit and can be reversed mid-way. */
const TOGGLES = new Set(["pop", "slide", "collapse", "dialog", "popover", "tooltip", "menu", "select"])
/** Frosted-glass surfaces: the surface itself must never fade, or its backdrop blur switches off. */
const GLASS = new Set(["menu", "select"])
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

/** Where a contract's motion happens: its surfaces in the document, or the specimen in its card. */
function roots(contract: MotionContract): string {
  return contract.surfaces?.join(", ") ?? `[data-contract="${contract.id}"] [data-specimen]`
}

/** Pause the contract's animations where they are and describe them. */
async function freeze(page: Page, contract: MotionContract): Promise<Seen[]> {
  return page.evaluate((selector) => {
    const kebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
    const seen: { property: string; duration: number; end: number }[] = []
    const animations = [...document.querySelectorAll(selector)].flatMap((el) => el.getAnimations({ subtree: true }))
    for (const animation of new Set(animations)) {
      const effect = animation.effect as KeyframeEffect | null
      if (!effect) continue
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
  }, roots(contract))
}

/** Move every paused animation of the contract to a share of the whole run (0 = start, 1 = end). */
async function seek(page: Page, contract: MotionContract, share: number) {
  await page.evaluate(
    ({ selector, at }) => {
      const animations = [...new Set([...document.querySelectorAll(selector)].flatMap((el) => el.getAnimations({ subtree: true })))]
      const total = Math.max(0, ...animations.map((a) => Number(a.effect!.getComputedTiming().endTime)))
      for (const animation of animations) {
        animation.currentTime = Math.min(total * at, Number(animation.effect!.getComputedTiming().endTime))
      }
    },
    { selector: roots(contract), at: share }
  )
}

/** Let everything on the page finish at once. */
async function release(page: Page) {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) animation.finish()
  })
}

async function roleMs(page: Page, role: string): Promise<number> {
  const raw = await page.evaluate((name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim(), role)
  const match = /^([\d.]+)(ms|s)$/.exec(raw)
  if (!match) throw new Error(`${role} is not a duration: "${raw}"`)
  return Number(match[1]) * (match[2] === "s" ? 1000 : 1)
}

function card(page: Page, contract: MotionContract): Locator {
  return page.locator(`[data-contract="${contract.id}"]`)
}

/** The part that moves: the first surface of a component, or the specimen of a recipe. */
function surface(page: Page, contract: MotionContract): Locator {
  return contract.surfaces ? page.locator(contract.surfaces[0]!) : card(page, contract).locator("[data-specimen]")
}

/** Start the contract's motion with the pointer: press is held, a tooltip is hovered, the rest are clicked. */
async function open(page: Page, contract: MotionContract) {
  const box = card(page, contract)
  await box.scrollIntoViewIfNeeded()
  if (contract.id === "press") {
    await box.locator("[data-specimen]").hover()
    await page.mouse.down()
  } else if (contract.id === "tooltip") {
    await box.locator("[data-trigger]").hover()
  } else {
    await box.locator("[data-trigger]").click()
  }
  if (contract.surfaces) await entered(page, contract)
}

/**
 * A popup mounts in its starting state and begins to move a frame later, when Base UI lifts
 * `data-starting-style`. Wait for that, so a reading never lands in the frame before.
 */
async function entered(page: Page, contract: MotionContract) {
  const popup = surface(page, contract)
  await popup.waitFor({ state: "attached" })
  await expect(popup).not.toHaveAttribute("data-starting-style", /.*/)
}

/** Send it away again, still with the pointer. */
async function close(page: Page, contract: MotionContract) {
  if (contract.id === "tooltip") await page.mouse.move(2, 2)
  else if (contract.surfaces) await page.mouse.click(2, 2)
  else await card(page, contract).locator("[data-trigger]").click()
}

function expectWithinContract(seen: Seen[], contract: MotionContract, allowed: readonly string[], limitMs: number) {
  for (const { property, duration, end } of seen) {
    expect(allowed, `${contract.id} animates ${property}`).toContain(property)
    expect(duration, `${contract.id}: ${property} runs ${duration}ms, over ${contract.duration}`).toBeLessThanOrEqual(limitMs + 1)
    expect(end, `${contract.id}: ${property} ends at ${end}ms, past the ceiling`).toBeLessThanOrEqual(CEILING_MS + 1)
  }
}

test.beforeEach(async ({ page }) => {
  // Run every animation at a fiftieth of its speed, so a 120ms entrance is still under way when
  // it is read. This slows the clock, not the animation: its own duration is unchanged.
  const devtools = await page.context().newCDPSession(page)
  await devtools.send("Animation.enable")
  await devtools.send("Animation.setPlaybackRate", { playbackRate: 0.02 })
  await page.goto("/?view=motion")
  await expect(page.locator('[data-slot="motion-view"]')).toBeVisible()
})

test("every contract has a card, and every card a contract", async ({ page }) => {
  const ids = await page.locator("[data-contract]").evaluateAll((cards) => cards.map((c) => c.getAttribute("data-contract")))
  expect([...ids].sort()).toEqual(motionContracts.map((c) => c.id).sort())
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
      await open(page, contract)
      const seen = await freeze(page, contract)
      expect(seen.length, `${contract.id} did not animate`).toBeGreaterThan(0)
      expectWithinContract(seen, contract, contract.properties, limit)
      // At least one thing it promises to move is moving.
      expect(seen.some((s) => contract.properties.includes(s.property))).toBe(true)

      // Start, middle and end of the entrance, as pictures.
      const shot = contract.surfaces ? page : card(page, contract)
      for (const [name, share] of [["start", 0], ["middle", 0.5], ["end", 1]] as const) {
        await seek(page, contract, share)
        const file = testInfo.outputPath(`${contract.id}-${name}.png`)
        await shot.screenshot({ path: file })
        await testInfo.attach(`${contract.id} ${name}`, { path: file, contentType: "image/png" })
      }
      await release(page)
      if (contract.id === "press") await page.mouse.up()

      if (TOGGLES.has(contract.id)) {
        await close(page, contract)
        const leaving = await freeze(page, contract)
        expect(leaving.length, `${contract.id} did not animate on the way out`).toBeGreaterThan(0)
        expectWithinContract(leaving, contract, contract.properties, limit)
        await release(page)
      }
    })

    test("does not move under reduced motion", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" })
      await open(page, contract)
      const seen = await freeze(page, contract)
      for (const { property } of seen) {
        expect([...contract.reducedProperties, ...COLOUR_ONLY], `${contract.id} still animates ${property} under reduced motion`).toContain(property)
      }
      await release(page)
      if (contract.id === "press") {
        // Held down and reduced: the control keeps its size.
        expect(await surface(page, contract).evaluate((el) => getComputedStyle(el).scale)).toBe("none")
        await page.mouse.up()
      } else {
        // The end state is there all the same: nothing is lost with the movement.
        await expect(surface(page, contract)).toBeVisible()
        expect(await surface(page, contract).evaluate((el) => getComputedStyle(el).scale)).toBe("none")
      }
    })

    // The box is the Motion view; a component in a portal renders outside it, so this is for recipes.
    if (!contract.surfaces) {
      test("does not move inside a data-motion=reduced box", async ({ page }) => {
        await page.locator('[data-mode="reduced"]').click()
        await open(page, contract)
        const seen = await freeze(page, contract)
        for (const { property } of seen) {
          expect([...contract.reducedProperties, ...COLOUR_ONLY], `${contract.id} still animates ${property} in a reduced box`).toContain(property)
        }
        await release(page)
        if (contract.id === "press") await page.mouse.up()
      })
    }

    if (TOGGLES.has(contract.id)) {
      test("reversed mid-way, it carries on from where it was", async ({ page }) => {
        await open(page, contract)
        await freeze(page, contract)
        await seek(page, contract, 0.5)
        // What fades: the surface, or for frosted glass its content.
        const fading = GLASS.has(contract.id) ? surface(page, contract).locator("> *").first() : surface(page, contract)
        const mid = Number(await fading.evaluate((el) => getComputedStyle(el).opacity))
        expect(mid).toBeGreaterThan(0)
        expect(mid).toBeLessThan(1)
        // Send it away while it is half open. The new transition must start from the half-way
        // value, not jump to either end.
        await close(page, contract)
        const reversing = await freeze(page, contract)
        expect(reversing.length).toBeGreaterThan(0)
        const after = Number(await fading.evaluate((el) => getComputedStyle(el).opacity))
        expect(Math.abs(after - mid)).toBeLessThan(0.1)
        await release(page)
      })
    }

    if (GLASS.has(contract.id)) {
      test("keeps its backdrop blur all the way through", async ({ page }) => {
        await open(page, contract)
        await freeze(page, contract)
        for (const share of [0, 0.5, 1]) {
          await seek(page, contract, share)
          const { opacity, blur } = await surface(page, contract).evaluate((el) => ({
            opacity: getComputedStyle(el).opacity,
            blur: getComputedStyle(el, "::before").backdropFilter,
          }))
          // A faded surface cannot blur what is behind it, so the surface itself stays solid.
          expect(opacity, `${contract.id} surface at ${share}`).toBe("1")
          expect(blur, `${contract.id} glass layer at ${share}`).toContain("blur(")
        }
        await release(page)
      })

      test("does not animate when opened and closed from the keyboard", async ({ page }) => {
        const trigger = card(page, contract).locator("[data-trigger]")
        await trigger.scrollIntoViewIfNeeded()
        await trigger.focus()
        await page.keyboard.press("Enter")
        await entered(page, contract)
        expect(await freeze(page, contract), `${contract.id} animated on keyboard open`).toEqual([])
        await expect(surface(page, contract)).toBeVisible()
        await page.keyboard.press("Escape")
        expect(await freeze(page, contract), `${contract.id} animated on keyboard close`).toEqual([])
        await expect(surface(page, contract)).toBeHidden()
      })
    }
  })
}
