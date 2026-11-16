// Owned helper (not generated): scheduled countdown announcements (Unicron 33, WCAG 2.2.1). One home,
// so the status strip, a status line item and an agent prompt warn a screen-reader user the same way
// before time runs out, at the times each app sets, and never on every tick.
"use client"

import * as React from "react"

/**
 * The time left in words, for a screen reader: "5 minutes left", "1 minute left", "30 seconds left",
 * "1 minute 30 seconds left". Whole seconds, rounded up, as the visible countdown is.
 */
export function countdownLeftWords(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const minutes = Math.floor(s / 60)
  const rest = s % 60
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
  if (minutes === 0) return `${unit(rest, "second")} left`
  if (rest === 0) return `${unit(minutes, "minute")} left`
  return `${unit(minutes, "minute")} ${unit(rest, "second")} left`
}

/**
 * Which of the `announceAt` marks (seconds left) a countdown passed going from `previous` to
 * `current`: the smallest one it passed, or null. A mark counts as passed when the countdown was
 * above it and is now at or below it, so a tick that skips a second (a throttled timer, a tab in the
 * background) still says it, and two marks passed at once are said once, as the nearer one. Nothing
 * is passed on the first reading (`previous` undefined) or while the time goes up (a restart).
 */
export function passedCountdownMark(previous: number | undefined, current: number | undefined, announceAt: readonly number[] | undefined): number | null {
  if (previous === undefined || current === undefined || !announceAt || announceAt.length === 0) return null
  const before = Math.ceil(previous)
  const now = Math.ceil(current)
  if (now >= before) return null
  let passed: number | null = null
  for (const mark of announceAt) {
    if (!(mark > 0)) continue
    if (before > mark && now <= mark && (passed === null || mark < passed)) passed = mark
  }
  return passed
}

/**
 * The sentence to say when a countdown passes one of its `announceAt` marks (seconds left: Warpcore
 * `[300, 60]`, Synapse `[60, 30, 10]`), or null until the first one. `words` turns the mark into the
 * sentence (default: `countdownLeftWords`). The part says it once, through the frame's one polite
 * region in an AppFrame (`useFrameAnnouncement`) or its own outside one; the visible countdown stays
 * hidden from assistive tech, so a screen reader is never told every tick.
 */
export function useCountdownAnnouncement(
  seconds: number | undefined,
  announceAt: readonly number[] | undefined,
  words: (secondsLeft: number) => string = countdownLeftWords
): string | null {
  const previous = React.useRef<number | undefined>(undefined)
  const [said, setSaid] = React.useState<string | null>(null)
  const wordsRef = React.useRef(words)
  React.useEffect(() => {
    wordsRef.current = words
  })
  React.useEffect(() => {
    const mark = passedCountdownMark(previous.current, seconds, announceAt)
    previous.current = seconds
    if (mark === null) return
    const next = wordsRef.current(mark)
    // The same sentence again (a countdown that restarted) still changes, so it is said again.
    setSaid((prev) => (prev === next ? `${next}\u00a0` : next))
  }, [seconds, announceAt])
  return seconds === undefined ? null : said
}
