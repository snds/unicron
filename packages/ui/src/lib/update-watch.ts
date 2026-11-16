// The build watch: how an open web page learns that its server has a newer front end, and when it
// may reload by itself. One copy for every app (Updates 5), beside UpdateStatusRow. It holds no app
// logic: each app passes its own `canReloadNow()`, its own reload rule and its storage key prefix.
// Promoted from: snds/warpcore, snds/Vale, snds/lockdown · PR snds/unicron (1.1) · DSA none (hand-raised in the unified updates plan, Updates 5)
//
// The app's build writes `build.json` (`{"build": "<id>"}`) beside the page and the same id into the
// page (`<meta name="<prefix>-build">`). The page fetches `build.json` again later. Another id means
// a new version is ready.
//
// - An answer that is not JSON with a plain `build` string (a sign-in page, an error, a proxy's page)
//   means "can't tell". It never means "new", and it never takes an offer back.
// - The page reloads by itself only when every rule says yes: the moment is quiet (the tab hidden for
//   a minute, or nobody has typed, clicked, touched or scrolled with the wheel for five), the app
//   says nothing would be lost (`canReload`), the app's own rule allows it (`mayReload`, asked last:
//   Lockdown's is "nobody is signed in"), and this tab has not already reloaded for that id, so a bad
//   deploy cannot loop.
// - A page whose next file is gone with the old build is blocked (`needed`): it no longer waits for a
//   quiet moment, since there is nothing left to disturb, only for every other rule.
// - Otherwise it keeps offering Reload, for as long as it takes.

/** How often the page asks while it is visible. */
export const CHECK_EVERY_MS = 15 * 60 * 1000
/** How long the tab must have been hidden before a reload by itself. */
export const HIDDEN_FOR_MS = 60 * 1000
/** How long nobody must have used the page before a reload by itself. */
export const IDLE_FOR_MS = 5 * 60 * 1000
/** How often a waiting reload looks for its moment. */
export const QUIET_EVERY_MS = 30 * 1000
/** Asks closer together than this are dropped (several events often fire at once). */
export const MIN_GAP_MS = 5 * 1000
/** The largest `build.json` read (the real one is under 100 bytes). */
export const BUILD_JSON_LIMIT = 4096
/**
 * What counts as someone using the page. The wheel too: reading down a long page is use, with no
 * key or click (only Warpcore counted it before).
 */
export const BUILD_WATCH_INPUTS = ["keydown", "pointerdown", "touchstart", "wheel"] as const

/** What the page shows. Plain data. */
export interface BuildWatchState {
  /** This page's own build id. */
  current: string
  /** The server's id when it differs from this page's, else null. */
  latest: string | null
  /** A new version is ready: offer Reload. */
  ready: boolean
  /** A file this page needs is gone with the old build: say "Reload to continue". */
  needed: boolean
  /** When the server last gave a readable answer (ms since 1970). */
  checkedAt: number | null
}

/** Everything the rules need from outside, so a test can stand in for it. */
export interface BuildWatchEnv {
  /** This page's build id. */
  current: string
  /** The body of `build.json`, fetched past every cache; null or a throw when it could not be read. */
  fetchText: () => Promise<string | null>
  now: () => number
  /** Whether the tab is hidden right now. */
  hidden: () => boolean
  /** The app's `canReloadNow()`: nothing typed, nothing open, nothing in flight. A throw counts as no. */
  canReload: () => boolean
  /**
   * The app's own rule, asked last and only when everything else says yes. Anything but `true`, or
   * a throw, counts as no. Lockdown: nobody is signed in. Warpcore: updating by itself is on.
   * Without it, the other rules decide.
   */
  mayReload?: () => boolean | Promise<boolean>
  /** Saves what the app keeps (drafts) just before any reload. A throw does not stop the reload. */
  save?: () => void
  reload: () => void
  /** The id this tab already reloaded for, and where to note the next. `sessionStorage` in the page. */
  reloadedFor: () => string | null
  noteReloaded: (id: string) => void
}

export interface BuildWatch {
  state: () => BuildWatchState
  subscribe: (listener: () => void) => () => void
  /** Asks the server now. `force` skips the minimum gap (an update or a restart just finished). */
  check: (force?: boolean) => Promise<BuildWatchState>
  /** Someone typed, clicked, touched or scrolled. */
  activity: () => void
  /** The tab became hidden or visible. Becoming visible asks the server. */
  visibility: () => void
  /** The device came back online. */
  online: () => void
  /**
   * A lazy file failed to load (`vite:preloadError`). With a new build that explains it, the page is
   * blocked: it reloads when the rules allow, and otherwise says "Reload to continue". True when it
   * is reloading.
   */
  preloadFailed: () => Promise<boolean>
  /** The clock: asks when a check is due, and reloads when every rule says yes. True when it reloaded. */
  tick: () => Promise<boolean>
  /** Reload was pressed: saves, then reloads at once, whatever the moment and whatever the rule. */
  reloadNow: () => void
}

/**
 * The build id in a `build.json` body, or null when the body is anything else. Ids are short and
 * plain (letters, digits, dot, dash, underscore), so a page of HTML or a huge answer is never taken
 * for one.
 */
export function readBuild(body: string | null | undefined): string | null {
  if (typeof body !== "string" || body.length > BUILD_JSON_LIMIT) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(body)
  } catch {
    return null
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return null
  const build = (parsed as { build?: unknown }).build
  return typeof build === "string" && /^[A-Za-z0-9._-]{1,64}$/.test(build) ? build : null
}

/** Whether this is a quiet moment, by the clock alone: hidden for a minute, or idle for five. */
export function quietByTheClock(now: number, hiddenSince: number | null, lastActivity: number): boolean {
  if (hiddenSince !== null && now - hiddenSince >= HIDDEN_FOR_MS) return true
  return now - lastActivity >= IDLE_FOR_MS
}

/** The rules. No DOM: every outside thing is passed in. `startBuildWatch` wires them to a page. */
export function createBuildWatch(env: BuildWatchEnv): BuildWatch {
  let state: BuildWatchState = { current: env.current, latest: null, ready: false, needed: false, checkedAt: null }
  const listeners = new Set<() => void>()
  let lastAsked: number | null = null
  let asking: Promise<BuildWatchState> | null = null
  let lastActivity = env.now()
  let hiddenSince: number | null = env.hidden() ? env.now() : null
  let reloading = false
  let deciding: Promise<boolean> | null = null

  const set = (patch: Partial<BuildWatchState>) => {
    const next = { ...state, ...patch }
    const same = (Object.keys(next) as (keyof BuildWatchState)[]).every((k) => next[k] === state[k])
    if (same) return
    state = next
    for (const listener of listeners) listener()
  }

  const doReload = () => {
    if (reloading) return
    reloading = true
    try {
      env.save?.()
    } catch {
      // Saving is the app's; a failure there is no reason to keep an old page.
    }
    env.reload()
  }

  const pageSaysYes = (): boolean => {
    try {
      return env.canReload() === true
    } catch {
      return false
    }
  }

  /** Quiet enough: by the clock, or blocked (nothing left to disturb). */
  const moment = () => state.needed || quietByTheClock(env.now(), hiddenSince, lastActivity)

  /** Reloads by itself when every rule says yes. */
  const decide = async (): Promise<boolean> => {
    if (reloading) return true
    const id = state.latest
    if (!state.ready || id === null) return false
    if (env.reloadedFor() === id) return false
    if (!moment()) return false
    if (!pageSaysYes()) return false
    if (env.mayReload) {
      // The app's rule is asked last, and it may be the only wait. Whatever happened during it (a
      // key, a click, the tab shown) is weighed again after.
      const before = lastActivity
      let allowed = false
      try {
        allowed = (await env.mayReload()) === true
      } catch {
        allowed = false
      }
      if (!allowed || reloading) return reloading
      if (lastActivity !== before || state.latest !== id) return false
      if (!moment() || !pageSaysYes()) return false
    }
    // Once per id. If the note cannot be kept (no session storage), never reload by itself: without
    // it a bad deploy could reload this tab again and again.
    env.noteReloaded(id)
    if (env.reloadedFor() !== id) return false
    doReload()
    return true
  }

  const reloadIfAllowed = (): Promise<boolean> => {
    deciding ??= decide().finally(() => {
      deciding = null
    })
    return deciding
  }

  const ask = async (): Promise<BuildWatchState> => {
    let body: string | null = null
    try {
      body = await env.fetchText()
    } catch {
      body = null
    }
    const id = readBuild(body)
    // Can't tell: keep what is known. An unreadable answer never clears or raises the offer.
    if (id === null) return state
    if (id === env.current) set({ latest: null, ready: false, needed: false, checkedAt: env.now() })
    else set({ latest: id, ready: true, checkedAt: env.now() })
    return state
  }

  const check = (force = false): Promise<BuildWatchState> => {
    // A forced ask that arrives during another waits for it, then asks afresh: the one in flight may
    // have left before the server changed.
    if (asking) return force ? asking.then(() => check(true)) : asking
    const now = env.now()
    if (!force && lastAsked !== null && now - lastAsked < MIN_GAP_MS) return Promise.resolve(state)
    lastAsked = now
    asking = ask().finally(() => {
      asking = null
    })
    return asking
  }

  return {
    state: () => state,
    subscribe: (listener) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    check,
    activity: () => {
      lastActivity = env.now()
    },
    visibility: () => {
      if (env.hidden()) {
        if (hiddenSince === null) hiddenSince = env.now()
        return
      }
      // Coming back counts as someone being here: no reload under their eyes.
      hiddenSince = null
      lastActivity = env.now()
      void check()
    },
    online: () => {
      void check()
    },
    preloadFailed: async () => {
      await check(true)
      if (!state.ready) return false
      set({ needed: true })
      return reloadIfAllowed()
    },
    tick: () => {
      if (reloading) return Promise.resolve(true)
      const now = env.now()
      if (!env.hidden() && (lastAsked === null || now - lastAsked >= CHECK_EVERY_MS)) void check()
      return reloadIfAllowed()
    },
    reloadNow: doReload,
  }
}

/** Where a tab notes the id it reloaded for: `<prefix>.build.reloadedFor`. A build id is public. */
export function buildWatchReloadedKey(storagePrefix: string): string {
  return `${storagePrefix}.build.reloadedFor`
}

/** The page's own build id from `<meta name="<prefix>-build">`, or null (`vite dev`, the tests). */
export function pageBuild(storagePrefix: string, doc: Document = document): string | null {
  const id = doc.querySelector(`meta[name="${storagePrefix}-build"]`)?.getAttribute("content")?.trim()
  return id ? id : null
}

export interface StartBuildWatchOptions {
  /** The app's short name, for its storage key and its page tag: `vale`, `lockdown`, `warpcore`. */
  storagePrefix: string
  /** The app's say: nothing typed, nothing open, nothing in flight. */
  canReloadNow: () => boolean
  /** The app's reload rule (see `BuildWatchEnv.mayReload`). */
  mayReload?: () => boolean | Promise<boolean>
  /** Saves what the app keeps before any reload. */
  save?: () => void
  /** Where `build.json` is. Default: `build.json` beside the page (the document's base). */
  url?: string
  /**
   * Whether the request carries cookies. Default `omit`: it says nothing but its address. An app
   * behind a sign-in gateway passes `same-origin`.
   */
  credentials?: RequestCredentials
  /** This page's build id. Default: the page's `<meta name="<prefix>-build">`. */
  current?: string | null
}

/** A running watch: the rules plus `stop()`, which removes every listener and the clock. */
export type RunningBuildWatch = BuildWatch & { stop: () => void }

function session(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

/**
 * Wires the rules to the page and starts them. It asks `build.json` at once, when the tab becomes
 * visible, when the device comes back online, every 15 minutes while visible, and when a lazy file
 * fails to load. Returns null, and watches nothing, in a page with no build id.
 */
export function startBuildWatch(options: StartBuildWatchOptions): RunningBuildWatch | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null
  const current = options.current === undefined ? pageBuild(options.storagePrefix) : options.current
  if (!current) return null
  const key = buildWatchReloadedKey(options.storagePrefix)
  const url = options.url ?? new URL("build.json", document.baseURI).toString()

  const watch = createBuildWatch({
    current,
    fetchText: async () => {
      // `no-store`: past the browser's cache. No referrer, and no cookie unless the app asks.
      const res = await fetch(url, {
        cache: "no-store",
        credentials: options.credentials ?? "omit",
        redirect: "error",
        referrerPolicy: "no-referrer",
        headers: { accept: "application/json" },
      })
      return res.ok ? await res.text() : null
    },
    now: () => Date.now(),
    hidden: () => document.visibilityState === "hidden",
    canReload: options.canReloadNow,
    mayReload: options.mayReload,
    save: options.save,
    reload: () => window.location.reload(),
    reloadedFor: () => {
      try {
        return session()?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    noteReloaded: (id) => {
      try {
        session()?.setItem(key, id)
      } catch {
        // The rules read the note back before reloading: with no note kept, the page only offers.
      }
    },
  })

  const onActivity = () => watch.activity()
  const onVisibility = () => watch.visibility()
  const onOnline = () => watch.online()
  // Back from the browser's page cache, which fires no load.
  const onShown = (event: PageTransitionEvent) => {
    if (event.persisted) void watch.check()
  }
  // A lazy file of the old build is gone. The failed import still throws to the screen that asked.
  const onPreloadError = () => void watch.preloadFailed()
  for (const name of BUILD_WATCH_INPUTS) window.addEventListener(name, onActivity, { capture: true, passive: true })
  document.addEventListener("visibilitychange", onVisibility)
  window.addEventListener("online", onOnline)
  window.addEventListener("pageshow", onShown)
  window.addEventListener("vite:preloadError", onPreloadError)
  const timer = window.setInterval(() => void watch.tick(), QUIET_EVERY_MS)
  void watch.check()

  return {
    ...watch,
    stop: () => {
      for (const name of BUILD_WATCH_INPUTS) window.removeEventListener(name, onActivity, { capture: true })
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("pageshow", onShown)
      window.removeEventListener("vite:preloadError", onPreloadError)
      window.clearInterval(timer)
    },
  }
}
