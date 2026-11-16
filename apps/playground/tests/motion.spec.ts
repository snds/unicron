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
const TOGGLES = new Set(["pop", "slide", "collapse", "fade", "anchor", "dialog", "popover", "tooltip", "menu", "select", "collapsible", "sheet"])
/** Components closed by their own trigger, not by a click outside. */
const SELF_CLOSING = new Set(["collapsible"])
/** Where scale is the value itself (a Progress fill), not a zoom. */
const SCALE_IS_VALUE = new Set(["progress"])
/** Lists opened and closed many times a day: from the keyboard they do not animate at all. */
const KEYBOARD_INSTANT = new Set(["menu", "select"])
/**
 * Under reduced motion the system still lets colour fade (index.css → reduced motion): a colour
 * change moves nothing. So a colour may animate there whatever the recipe; anything else may not.
 */
/** Contracts started by holding a control down, not by a click. */
const HOLD = new Set(["press", "push", "button-press", "expressive-press"])
/** Of those, the ones that press in by translate rather than by scale. */
const PUSH = new Set(["push", "button-press", "expressive-press"])
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
  if (HOLD.has(contract.id)) {
    await (contract.surfaces ? box.locator("[data-trigger]") : box.locator("[data-specimen]")).hover()
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
  // A part that is already on the page (a secret's value, a strength rule) starts to move once the
  // host answers and React re-renders: give it a moment to begin. Nothing to wait for is fine too
  // (a keyboard-opened menu does not animate).
  await page
    .waitForFunction((selector) => [...document.querySelectorAll(selector)].some((el) => el.getAnimations({ subtree: true }).length > 0), roots(contract), { timeout: 1500 })
    .catch(() => {})
}

/** Send it away again, still with the pointer. */
async function close(page: Page, contract: MotionContract) {
  if (contract.id === "tooltip") await page.mouse.move(2, 2)
  else if (contract.surfaces && !SELF_CLOSING.has(contract.id)) await page.mouse.click(2, 2)
  else await card(page, contract).locator("[data-trigger]").click()
  // Base UI marks a closing panel (data-ending-style) a frame after the click: wait for it to move.
  if (SELF_CLOSING.has(contract.id)) {
    await page
      .waitForFunction((selector) => [...document.querySelectorAll(selector)].some((el) => el.getAnimations({ subtree: true }).length > 0), roots(contract), { timeout: 1500 })
      .catch(() => {})
  }
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
      if (HOLD.has(contract.id)) await page.mouse.up()

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
      if (HOLD.has(contract.id)) {
        // Held down and reduced: the control keeps its size and its place.
        const held = await surface(page, contract).evaluate((el) => ({ scale: getComputedStyle(el).scale, translate: getComputedStyle(el).translate }))
        expect(held.scale).toBe("none")
        if (PUSH.has(contract.id)) expect(held.translate).toBe("none")
        await page.mouse.up()
      } else {
        // The end state is there all the same: nothing is lost with the movement.
        await expect(surface(page, contract)).toBeVisible()
        if (!SCALE_IS_VALUE.has(contract.id)) expect(await surface(page, contract).evaluate((el) => getComputedStyle(el).scale)).toBe("none")
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
        if (HOLD.has(contract.id)) await page.mouse.up()
      })
    }

    if (TOGGLES.has(contract.id)) {
      test("reversed mid-way, it carries on from where it was", async ({ page }) => {
        await open(page, contract)
        await freeze(page, contract)
        await seek(page, contract, 0.5)
        const fading = surface(page, contract)
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

    // The 1.0 look: every layer is solid and square, and fades (or fades and moves a step). None
    // zooms or blurs at any point of its entrance.
    if (contract.surfaces) {
      test("keeps the 1.0 look all the way through: no zoom, no blur", async ({ page }) => {
        await open(page, contract)
        await freeze(page, contract)
        for (const share of [0, 0.5, 1]) {
          await seek(page, contract, share)
          const look = await surface(page, contract).evaluate((el) => ({
            scale: getComputedStyle(el).scale,
            blur: getComputedStyle(el).backdropFilter,
          }))
          if (!SCALE_IS_VALUE.has(contract.id)) expect(look.scale, `${contract.id} scale at ${share}`).toBe("none")
          expect(look.blur, `${contract.id} backdrop filter at ${share}`).toBe("none")
        }
        await release(page)
      })
    }

    if (KEYBOARD_INSTANT.has(contract.id)) {
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

// ── the clipboard countdown ────────────────────────────────────────────────────────────────────
// The words fade in when the countdown starts, and then hold still: each second's new number is
// not a new entrance (the span is keyed by the phase, not by the seconds).
test("copy-words: the seconds tick without motion", async ({ page }) => {
  const contract = motionContracts.find((c) => c.id === "copy-words")! as MotionContract
  await open(page, contract)
  await release(page)
  const words = surface(page, contract)
  const first = await words.textContent()
  await expect(words).not.toHaveText(first ?? "", { timeout: 4000 })
  expect(await freeze(page, contract), "the words moved when the seconds changed").toEqual([])
})

// ── loops ──────────────────────────────────────────────────────────────────────────────────────
// Nothing loops under reduced motion, whatever variant puts the loop on: the indeterminate Progress
// pulses through `group-data-indeterminate/progress:animate-pulse`, which a rule on the bare class
// name would miss (index.css → reduced motion).
test("no loop runs under reduced motion, or in a data-motion=reduced box, a variant's loop included", async ({ page }) => {
  const loops = () =>
    page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("[class*='animate-spin'], [class*='animate-pulse'], [class*='animate-ping'], [class*='animate-bounce']")]
        .filter((el) => getComputedStyle(el).animationName !== "none")
        .map((el) => el.getAttribute("data-slot") ?? el.tagName.toLowerCase())
    )
  const open = async () => {
    await page.goto("/?view=progress&chrome=0")
    await expect(page.locator('[data-slot="playground-view"]')).toHaveAttribute("data-view-state", "ready")
  }
  await open()
  const indeterminate = page.locator('[data-slot="progress"][data-indeterminate] [data-slot="progress-track"]').first()
  expect(await indeterminate.evaluate((el) => getComputedStyle(el).animationName), "the indeterminate track pulses").toBe("pulse")
  expect(await loops()).toContain("progress-track")

  await page.emulateMedia({ reducedMotion: "reduce" })
  await open()
  expect(await indeterminate.evaluate((el) => getComputedStyle(el).animationName)).toBe("none")
  expect(await loops(), "loops still running under reduced motion").toEqual([])

  await page.emulateMedia({ reducedMotion: "no-preference" })
  await open()
  await page.evaluate(() => document.body.setAttribute("data-motion", "reduced"))
  expect(await loops(), "loops still running in a data-motion=reduced box").toEqual([])
})

// ── StatusOrb ──────────────────────────────────────────────────────────────────────────────────
// The needs-you ping is a copy of the ring that grows and fades: transform and opacity only, never
// an animated shadow. Under reduced motion the copy is not drawn at all.
test("status orb: the needs-you ping grows on scale and fades, and is gone under reduced motion", async ({ page }) => {
  const pings = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a instanceof CSSAnimation && a.animationName === "status-orb-ping")
        .map((a) => ({
          target: (a.effect as KeyframeEffect).pseudoElement,
          properties: [...new Set((a.effect as KeyframeEffect).getKeyframes().flatMap((f) => Object.keys(f)))].filter(
            (k) => !["offset", "computedOffset", "easing", "composite"].includes(k)
          ),
        }))
    )
  await page.goto("/?view=status-orb&chrome=0")
  await expect(page.locator('[data-slot="status-orb"][data-state="needs-you"]').first()).toBeVisible()
  const running = await pings()
  expect(running.length, "no needs-you ping is running").toBeGreaterThan(0)
  for (const ping of running) {
    expect(ping.target).toBe("::after")
    expect(ping.properties.sort()).toEqual(["opacity", "scale"])
  }
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/?view=status-orb&chrome=0")
  await expect(page.locator('[data-slot="status-orb"][data-state="needs-you"]').first()).toBeVisible()
  expect(await pings(), "the ping still runs under reduced motion").toEqual([])
})

// ── the phone sheet's drag ─────────────────────────────────────────────────────────────────────
// On a phone the sheet follows the grabber 1:1 down and resists up; let go short, it settles back
// on the firm spring; flicked, it goes, faster than a let-go.
test.describe("sheet drag", () => {
  test.use({ viewport: { width: 375, height: 812 } })

  async function openSheet(page: Page) {
    const sheet = page.locator('[data-slot="sheet-content"]')
    await card(page, motionContracts.find((c) => c.id === "sheet")! as MotionContract).locator("[data-trigger]").click()
    await sheet.waitFor()
    await expect(sheet).not.toHaveAttribute("data-starting-style", /.*/)
    await release(page)
    const bar = await sheet.locator('[data-slot="sheet-grabber"]').boundingBox()
    return { sheet, x: bar!.x + bar!.width / 2, y: bar!.y + bar!.height / 2 }
  }
  const offset = (sheet: Locator) => sheet.evaluate((el) => Number.parseFloat(getComputedStyle(el).translate.split(" ")[1] ?? "0") || 0)
  const transitions = (sheet: Locator) =>
    sheet.evaluate((el) =>
      el.getAnimations().map((a) => ({
        property: (a as CSSTransition).transitionProperty,
        duration: Number(a.effect!.getComputedTiming().duration),
      }))
    )

  test("pulled up past open it resists; let go, it settles back on the firm spring", async ({ page }) => {
    const { sheet, x, y } = await openSheet(page)
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 200, { steps: 8 })
    const up = await offset(sheet)
    expect(up).toBeLessThan(0)
    expect(up).toBeGreaterThan(-24)
    await expect(sheet).toHaveAttribute("data-release", "drag")
    // Hold still a moment, so the release is a let-go, not a flick.
    await page.waitForTimeout(150)
    await page.mouse.up()
    await expect(sheet).toHaveAttribute("data-release", "settle")
    const settle = await transitions(sheet)
    expect(settle.map((t) => t.property)).toEqual(["translate"])
    expect(settle[0]!.duration).toBe(await roleMs(page, "--motion-spring-firm-duration"))
    await release(page)
    expect(await offset(sheet)).toBe(0)
  })

  test("a short slow drag down settles back; a short flick down dismisses it, in under --motion-base", async ({ page }) => {
    const { sheet, x, y } = await openSheet(page)
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (const step of [10, 20, 30, 40]) {
      await page.mouse.move(x, y + step)
      await page.waitForTimeout(150)
    }
    expect(await offset(sheet)).toBeCloseTo(40, 0)
    await page.mouse.up()
    await expect(sheet).toHaveAttribute("data-release", "settle")
    await release(page)
    await expect(sheet).toBeVisible()

    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y + 40, { steps: 2 })
    await page.mouse.up()
    await expect(sheet).toHaveAttribute("data-release", "dismiss")
    const out = await transitions(sheet)
    expect(out.map((t) => t.property)).toContain("translate")
    for (const t of out) expect(t.duration).toBeLessThan(await roleMs(page, "--motion-base"))
    await release(page)
    await expect(sheet).toBeHidden()
  })

  test("under reduced motion the drag still follows the finger, and the release is instant", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    const { sheet, x, y } = await openSheet(page)
    await page.mouse.move(x, y)
    await page.mouse.down()
    for (const step of [15, 30]) {
      await page.mouse.move(x, y + step)
      await page.waitForTimeout(150)
    }
    expect(await offset(sheet)).toBeCloseTo(30, 0)
    await page.mouse.up()
    expect((await transitions(sheet)).filter((t) => t.property === "translate")).toEqual([])
    expect(await offset(sheet)).toBe(0)
  })
})

// ── toasts ─────────────────────────────────────────────────────────────────────────────────────
// sonner moves a dismissed toast for 500ms by its own stylesheet; on the roles it leaves within
// --motion-fast, whichever of sonner's states it is in.
test("toast: leaves on --motion-fast", async ({ page }) => {
  const contract = motionContracts.find((c) => c.id === "toast")! as MotionContract
  await open(page, contract)
  await release(page)
  await card(page, contract).locator("[data-dismiss]").click()
  await page.waitForFunction(() => document.querySelector('[data-sonner-toast][data-removed="true"]') !== null)
  const leaving = await freeze(page, contract)
  expect(leaving.length, "the toast did not animate on the way out").toBeGreaterThan(0)
  expectWithinContract(leaving, contract, contract.properties, await roleMs(page, "--motion-fast"))
  await release(page)
})

// ── the expressive layer on an overlay ─────────────────────────────────────────────────────────
// With data-motion="expressive" on <html>, a dialog arrives from 0.96 on the emphasis curve; without
// it (every other check here), the dialog only fades.
test("expressive: a dialog under an expressive <html> scales in as it fades, within the ceiling", async ({ page }) => {
  const contract = motionContracts.find((c) => c.id === "dialog")! as MotionContract
  await page.evaluate(() => document.documentElement.setAttribute("data-motion", "expressive"))
  await open(page, contract)
  const seen = await freeze(page, contract)
  expect(seen.map((s) => s.property)).toContain("scale")
  expectWithinContract(seen, contract, ["opacity", "scale"], CEILING_MS)
  await release(page)
})
