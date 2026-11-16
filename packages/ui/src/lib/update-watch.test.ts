// The build watch (Updates 5). Ported from the three apps' own tests, so each app's behaviour holds
// in the shared copy: Lockdown apps/web/src/core/build-watch(.dom).test.ts (the rules, the reload
// rule asked last, the page wiring), Vale apps/web/test/build-watch.test.mjs (save first, a failing
// saver, the hidden minute) and Warpcore apps/web/src/shell/build-watch.test.ts (the page's events,
// the wheel, a blocked page).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  BUILD_JSON_LIMIT,
  CHECK_EVERY_MS,
  HIDDEN_FOR_MS,
  IDLE_FOR_MS,
  MIN_GAP_MS,
  buildWatchReloadedKey,
  createBuildWatch,
  pageBuild,
  quietByTheClock,
  readBuild,
  startBuildWatch,
  type BuildWatchEnv,
  type RunningBuildWatch,
} from "./update-watch"

/** A page on build `a`, a server that answers what `w.body` says, and a clock the test moves. */
function world(over: Partial<BuildWatchEnv> = {}) {
  const w = {
    now: 1_000_000,
    body: '{"build":"a"}' as string | null,
    hidden: false,
    allowed: true as boolean | "throws",
    atRest: true,
    asked: 0,
    askedRule: 0,
    saved: 0,
    reloads: 0,
    note: null as string | null,
    keepsNotes: true,
  }
  const env: BuildWatchEnv = {
    current: "a",
    fetchText: async () => {
      w.asked += 1
      return w.body
    },
    now: () => w.now,
    hidden: () => w.hidden,
    mayReload: async () => {
      w.askedRule += 1
      if (w.allowed === "throws") throw new Error("the worker is gone")
      return w.allowed
    },
    canReload: () => w.atRest,
    save: () => {
      w.saved += 1
    },
    reload: () => {
      w.reloads += 1
    },
    reloadedFor: () => w.note,
    noteReloaded: (id) => {
      if (w.keepsNotes) w.note = id
    },
    ...over,
  }
  return { w, watch: createBuildWatch(env) }
}

/** A page that knows of build `b`. */
async function ready(over: Partial<BuildWatchEnv> = {}) {
  const made = world(over)
  made.w.body = '{"build":"b"}'
  await made.watch.check(true)
  return made
}

describe("build.json", () => {
  it("reads a build id and nothing else", () => {
    expect(readBuild('{"build":"3f9a0c1d2e4b5a6978f0"}')).toBe("3f9a0c1d2e4b5a6978f0")
    expect(readBuild('{"build":"2c8d5fba86553f02"}\n')).toBe("2c8d5fba86553f02")
    expect(readBuild('{"build":"0.1.0-main.20261107093000","more":1}')).toBe("0.1.0-main.20261107093000")
    for (const body of [null, undefined, "", "not json", "<!doctype html><title>Sign in</title>", "[]", "null", '"a"', "{}", '{"build":3}', '{"build":""}', '{"build":"a b"}', '{"build":"<script>"}', '{"version":"0.1.0"}', `{"build":"${"a".repeat(65)}"}`])
      expect(readBuild(body), String(body)).toBeNull()
    expect(readBuild(`{"build":"a","pad":"${"x".repeat(BUILD_JSON_LIMIT)}"}`)).toBeNull()
  })

  it("the same id is no news; another id is a new version", async () => {
    const { w, watch } = world()
    expect((await watch.check()).ready).toBe(false)
    expect(watch.state()).toMatchObject({ current: "a", latest: null, ready: false, checkedAt: w.now })
    w.body = '{"build":"b"}'
    expect(await watch.check(true)).toMatchObject({ latest: "b", ready: true })
  })

  it("an answer it can't read never means new, and never takes an offer back", async () => {
    const { w, watch } = world()
    for (const body of ["<html>sign in</html>", null, "{}"]) {
      w.body = body
      expect((await watch.check(true)).ready).toBe(false)
    }
    expect(watch.state().checkedAt).toBeNull()
    w.body = '{"build":"b"}'
    await watch.check(true)
    w.body = "<html>bad gateway</html>"
    expect(await watch.check(true)).toMatchObject({ latest: "b", ready: true })
    const failing = world({ fetchText: () => Promise.reject(new Error("offline")) })
    expect((await failing.watch.check()).ready).toBe(false)
  })

  it("a deploy rolled back takes the offer back", async () => {
    const { w, watch } = world()
    w.body = '{"build":"b"}'
    await watch.check(true)
    w.body = '{"build":"a"}'
    expect(await watch.check(true)).toMatchObject({ latest: null, ready: false, needed: false })
  })

  it("asks at most once per few seconds unless forced, and tells its listeners once per change", async () => {
    const { w, watch } = world()
    let told = 0
    watch.subscribe(() => {
      told += 1
    })
    await watch.check()
    await watch.check()
    expect(w.asked).toBe(1)
    w.now += MIN_GAP_MS
    await watch.check()
    expect(w.asked).toBe(2)
    await watch.check(true)
    expect(w.asked).toBe(3)
    // Told when something changed: the first answer, and the later one (its time). Not for a repeat.
    expect(told).toBe(2)
  })

  it("a forced ask during another waits for it, then asks afresh", async () => {
    let answer: (body: string) => void = () => {}
    let asked = 0
    const { watch } = world({
      fetchText: () => {
        asked += 1
        return asked === 1 ? new Promise<string>((resolve) => (answer = resolve)) : Promise.resolve('{"build":"b"}')
      },
    })
    const first = watch.check()
    const forced = watch.check(true)
    answer('{"build":"a"}')
    expect((await first).ready).toBe(false)
    expect((await forced).latest).toBe("b")
    expect(asked).toBe(2)
  })
})

describe("when it asks", () => {
  it("every 15 minutes while visible, never while hidden", async () => {
    const { w, watch } = world()
    await watch.tick()
    expect(w.asked).toBe(1)
    w.now += CHECK_EVERY_MS - 1
    await watch.tick()
    expect(w.asked).toBe(1)
    w.now += 1
    await watch.tick()
    expect(w.asked).toBe(2)
    w.hidden = true
    watch.visibility()
    w.now += CHECK_EVERY_MS * 3
    await watch.tick()
    expect(w.asked).toBe(2)
  })

  it("when the tab is shown again and when the device is back online", async () => {
    const { w, watch } = world()
    w.hidden = true
    watch.visibility()
    expect(w.asked).toBe(0)
    w.hidden = false
    watch.visibility()
    expect(w.asked).toBe(1)
    await watch.check()
    w.now += MIN_GAP_MS
    watch.online()
    expect(w.asked).toBe(2)
  })
})

describe("a reload by itself", () => {
  it("is by the clock: hidden for a minute, or idle for five", () => {
    expect(quietByTheClock(IDLE_FOR_MS, null, 0)).toBe(true)
    expect(quietByTheClock(IDLE_FOR_MS - 1, null, 0)).toBe(false)
    expect(quietByTheClock(HIDDEN_FOR_MS, 0, HIDDEN_FOR_MS)).toBe(true)
    expect(quietByTheClock(HIDDEN_FOR_MS - 1, 0, HIDDEN_FOR_MS - 1)).toBe(false)
  })

  it("happens when the app's rule allows it, the page is at rest and the moment is quiet; it saves first", async () => {
    const { w, watch } = await ready()
    expect(await watch.tick()).toBe(false)
    expect(w.askedRule, "the rule isn't asked before the clock says yes").toBe(0)
    w.now += IDLE_FOR_MS
    expect(await watch.tick()).toBe(true)
    expect(w.reloads).toBe(1)
    expect(w.saved).toBe(1)
    expect(w.note).toBe("b")
    // Reloading already: nothing more happens.
    expect(await watch.tick()).toBe(true)
    expect(w.reloads).toBe(1)
  })

  it("someone's activity starts the idle wait again", async () => {
    const { w, watch } = await ready()
    w.now += IDLE_FOR_MS - 1
    watch.activity()
    w.now += IDLE_FOR_MS - 1
    expect(await watch.tick()).toBe(false)
    w.now += 1
    expect(await watch.tick()).toBe(true)
  })

  it("a hidden tab reloads after a minute; coming back cancels the wait", async () => {
    const { w, watch } = await ready()
    w.hidden = true
    watch.visibility()
    w.now += HIDDEN_FOR_MS - 1
    expect(await watch.tick()).toBe(false)
    w.hidden = false
    watch.visibility()
    w.now += HIDDEN_FOR_MS
    expect(await watch.tick(), "visible again: the hidden minute no longer counts").toBe(false)
    w.hidden = true
    watch.visibility()
    w.now += HIDDEN_FOR_MS
    expect(await watch.tick()).toBe(true)
  })

  it("never happens while the app's rule says no (Lockdown: someone is signed in): it only offers", async () => {
    const { w, watch } = await ready()
    w.allowed = false
    w.hidden = true
    watch.visibility()
    for (let i = 0; i < 20; i++) {
      w.now += IDLE_FOR_MS * 12
      expect(await watch.tick()).toBe(false)
    }
    expect(w.reloads).toBe(0)
    expect(watch.state()).toMatchObject({ ready: true, latest: "b" })
    // The rule allows it later (signed out, by the person or the server): now it may.
    w.allowed = true
    expect(await watch.tick()).toBe(true)
    expect(w.reloads).toBe(1)
  })

  it("never happens when the rule can't be asked", async () => {
    const { w, watch } = await ready()
    w.allowed = "throws"
    w.now += IDLE_FOR_MS
    expect(await watch.tick()).toBe(false)
    expect(w.reloads).toBe(0)
  })

  it("without a rule, the other rules decide", async () => {
    const { w, watch } = await ready({ mayReload: undefined })
    w.now += IDLE_FOR_MS
    expect(await watch.tick()).toBe(true)
    expect(w.askedRule).toBe(0)
  })

  it("never happens while the page holds anything, or its check breaks", async () => {
    const { w, watch } = await ready()
    w.atRest = false
    w.now += IDLE_FOR_MS * 10
    expect(await watch.tick()).toBe(false)
    expect(w.askedRule, "the rule isn't asked either").toBe(0)
    expect(w.note, "nothing is noted for a reload that did not happen").toBeNull()
    expect(watch.state().ready, "it keeps offering").toBe(true)
    const throwing = await ready({
      canReload: () => {
        throw new Error("a check broke")
      },
    })
    throwing.w.now += IDLE_FOR_MS
    expect(await throwing.watch.tick()).toBe(false)
    expect(throwing.w.reloads).toBe(0)
  })

  it("never happens under someone's eyes: activity, or the tab shown, while the rule answers", async () => {
    for (const interrupt of ["a key", "the tab shown", "typing began"] as const) {
      let answer: (allowed: boolean) => void = () => {}
      const { w, watch } = await ready({ mayReload: () => new Promise<boolean>((resolve) => (answer = resolve)) })
      w.hidden = true
      watch.visibility()
      w.now += HIDDEN_FOR_MS
      const ticking = watch.tick()
      await Promise.resolve()
      if (interrupt === "a key") watch.activity()
      if (interrupt === "the tab shown") {
        w.hidden = false
        watch.visibility()
      }
      if (interrupt === "typing began") w.atRest = false
      answer(true)
      expect(await ticking, interrupt).toBe(false)
      expect(w.reloads, interrupt).toBe(0)
    }
  })

  it("happens once per build, so a bad deploy can't loop", async () => {
    // The same tab after that reload, still on build `a` (the deploy is broken): the note is kept.
    const again = await ready()
    again.w.note = "b"
    again.w.now += IDLE_FOR_MS * 10
    expect(await again.watch.tick()).toBe(false)
    expect(again.w.reloads).toBe(0)
    expect(again.watch.state().ready, "it still offers").toBe(true)
    // A later build is another matter.
    again.w.body = '{"build":"c"}'
    await again.watch.check(true)
    expect(await again.watch.tick()).toBe(true)
    expect(again.w.note).toBe("c")
  })

  it("never happens when the note can't be kept (no session storage)", async () => {
    const { w, watch } = await ready()
    w.keepsNotes = false
    w.now += IDLE_FOR_MS
    expect(await watch.tick()).toBe(false)
    expect(w.reloads).toBe(0)
  })

  it("never happens without a new build", async () => {
    const { w, watch } = world()
    await watch.check()
    w.now += IDLE_FOR_MS * 10
    expect(await watch.tick()).toBe(false)
    expect(w.reloads + w.askedRule).toBe(0)
  })
})

describe("Reload, pressed", () => {
  it("saves, then reloads at once, whatever the rule and the page say, and only once", () => {
    const { w, watch } = world()
    w.allowed = false
    w.atRest = false
    watch.reloadNow()
    watch.reloadNow()
    expect(w.reloads).toBe(1)
    expect(w.saved).toBe(1)
    expect(w.askedRule).toBe(0)
  })

  it("a failing saver does not stop it", () => {
    const { w, watch } = world({
      save: () => {
        throw new Error("disk full")
      },
    })
    watch.reloadNow()
    expect(w.reloads).toBe(1)
  })
})

describe("a lazy file that failed to load", () => {
  it("with no new build, or none that can be told, changes nothing", async () => {
    const { w, watch } = world()
    expect(await watch.preloadFailed()).toBe(false)
    w.body = null
    expect(await watch.preloadFailed()).toBe(false)
    expect(watch.state().needed).toBe(false)
    expect(w.reloads).toBe(0)
  })

  it("with a new build and the rule saying no, says Reload to continue", async () => {
    const { w, watch } = world()
    w.body = '{"build":"b"}'
    w.allowed = false
    w.now += IDLE_FOR_MS
    expect(await watch.preloadFailed()).toBe(false)
    expect(watch.state()).toMatchObject({ ready: true, needed: true })
    expect(w.reloads).toBe(0)
  })

  it("with a new build and nothing to lose, reloads at once, without waiting for a quiet moment", async () => {
    const { w, watch } = world()
    w.body = '{"build":"b"}'
    expect(await watch.preloadFailed()).toBe(true)
    expect(w.reloads).toBe(1)
  })

  it("blocked while work would be lost, goes as soon as it wouldn't, with no quiet moment", async () => {
    const { w, watch } = world()
    w.body = '{"build":"b"}'
    w.atRest = false
    expect(await watch.preloadFailed()).toBe(false)
    expect(watch.state()).toMatchObject({ latest: "b", needed: true })
    w.atRest = true
    expect(await watch.tick()).toBe(true)
    expect(w.reloads).toBe(1)
  })
})

describe("the watch in the page", () => {
  let running: RunningBuildWatch | null = null

  function stamp(id: string) {
    const meta = document.createElement("meta")
    meta.name = "warpcore-build"
    meta.content = id
    document.head.append(meta)
  }

  function setVisible(state: "visible" | "hidden") {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state })
    document.dispatchEvent(new Event("visibilitychange"))
  }

  let served: string
  let fetched: ReturnType<typeof vi.fn>
  let reload: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    served = '{"build":"old"}'
    fetched = vi.fn(async () => new Response(served))
    vi.stubGlobal("fetch", fetched)
    reload = vi.fn()
    vi.stubGlobal("location", { ...window.location, reload })
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" })
    window.sessionStorage.clear()
  })

  afterEach(() => {
    running?.stop()
    running = null
    vi.useRealTimers()
    vi.unstubAllGlobals()
    document.head.querySelectorAll('meta[name$="-build"]').forEach((m) => m.remove())
  })

  const start = (over: Partial<Parameters<typeof startBuildWatch>[0]> = {}) => {
    running = startBuildWatch({ storagePrefix: "warpcore", canReloadNow: () => true, ...over })
    return running
  }
  /** Lets a look at build.json finish. */
  const settle = () => vi.advanceTimersByTimeAsync(0)

  it("reads the page's own id from its tag", () => {
    expect(pageBuild("warpcore")).toBeNull()
    stamp("  3f9a0c1d2e4b5a6978f0 ")
    expect(pageBuild("warpcore")).toBe("3f9a0c1d2e4b5a6978f0")
    expect(pageBuild("vale")).toBeNull()
  })

  it("does not run in a page with no build id (vite dev, the tests)", async () => {
    expect(start()).toBeNull()
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 2)
    expect(fetched).not.toHaveBeenCalled()
  })

  it("asks for build.json beside the page, past the cache, with no cookie and no referrer", async () => {
    stamp("old")
    expect(start()).not.toBeNull()
    await settle()
    expect(fetched).toHaveBeenCalledTimes(1)
    const [url, init] = fetched.mock.calls[0] as unknown as [string, RequestInit]
    expect(new URL(url).origin).toBe(window.location.origin)
    expect(new URL(url).pathname.endsWith("/build.json")).toBe(true)
    expect(init).toMatchObject({ cache: "no-store", credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" })
    expect(running!.state()).toMatchObject({ current: "old", latest: null, ready: false })
  })

  it("an app behind a sign-in gateway may send its cookie", async () => {
    stamp("old")
    start({ credentials: "same-origin" })
    await settle()
    expect((fetched.mock.calls[0] as unknown as [string, RequestInit])[1]).toMatchObject({ credentials: "same-origin" })
  })

  it("looks again every 15 minutes in view, when it comes back into view, when the connection returns, and back from the page cache", async () => {
    stamp("old")
    start()
    await settle()
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS - 60_000)
    expect(fetched).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetched).toHaveBeenCalledTimes(2)

    setVisible("hidden")
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 2)
    expect(fetched).toHaveBeenCalledTimes(2)
    setVisible("visible")
    await settle()
    expect(fetched).toHaveBeenCalledTimes(3)

    await vi.advanceTimersByTimeAsync(MIN_GAP_MS)
    window.dispatchEvent(new Event("online"))
    await settle()
    expect(fetched).toHaveBeenCalledTimes(4)

    await vi.advanceTimersByTimeAsync(MIN_GAP_MS)
    const shown = new Event("pageshow") as PageTransitionEvent
    Object.defineProperty(shown, "persisted", { value: true })
    window.dispatchEvent(shown)
    await settle()
    expect(fetched).toHaveBeenCalledTimes(5)
  })

  it("reloads by itself once nobody has touched the page for five minutes, and notes the build", async () => {
    stamp("old")
    start()
    await settle()
    served = '{"build":"new"}'
    await running!.check(true)
    await vi.advanceTimersByTimeAsync(IDLE_FOR_MS - 60_000)
    expect(reload).not.toHaveBeenCalled()
    // Someone touches it: the wait starts over.
    window.dispatchEvent(new Event("keydown"))
    await vi.advanceTimersByTimeAsync(IDLE_FOR_MS - 60_000)
    expect(reload).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(90_000)
    expect(reload).toHaveBeenCalledTimes(1)
    expect(window.sessionStorage.getItem(buildWatchReloadedKey("warpcore"))).toBe("new")
  })

  it("counts scrolling with the wheel as use: someone reading isn't away", async () => {
    stamp("old")
    start()
    await settle()
    served = '{"build":"new"}'
    await running!.check(true)
    await vi.advanceTimersByTimeAsync(IDLE_FOR_MS - 60_000)
    window.dispatchEvent(new Event("wheel"))
    await vi.advanceTimersByTimeAsync(IDLE_FOR_MS - 60_000)
    expect(reload).not.toHaveBeenCalled()
  })

  it("the app's rule holds in the page: with it saying no, it never reloads by itself", async () => {
    for (const allowed of [false, true]) {
      window.sessionStorage.clear()
      stamp("old")
      served = '{"build":"new"}'
      reload.mockClear()
      const rule = vi.fn(async () => allowed)
      start({ storagePrefix: "warpcore", mayReload: rule })
      await vi.advanceTimersByTimeAsync(6 * 60 * 1000)
      expect(reload, `allowed: ${allowed}`).toHaveBeenCalledTimes(allowed ? 1 : 0)
      expect(window.sessionStorage.getItem(buildWatchReloadedKey("warpcore"))).toBe(allowed ? "new" : null)
      running!.stop()
      running = null
      document.head.querySelectorAll('meta[name$="-build"]').forEach((m) => m.remove())
    }
  })

  it("a lazy file gone with the old build reloads when nothing would be lost", async () => {
    stamp("old")
    start()
    await settle()
    served = '{"build":"new"}'
    window.dispatchEvent(new Event("vite:preloadError"))
    await settle()
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it("stops: no more looks after stop()", async () => {
    stamp("old")
    start()
    await settle()
    running!.stop()
    await vi.advanceTimersByTimeAsync(CHECK_EVERY_MS * 2)
    window.dispatchEvent(new Event("online"))
    await settle()
    expect(fetched).toHaveBeenCalledTimes(1)
  })
})
