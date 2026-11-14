// Numbers and times as every part writes them (cross-app decisions §13). One home, so a count in a
// nav item, a list row, a filter chip and an indicator, and a countdown in a status line, an agent
// prompt and a security row, always read the same.

/**
 * A count: two digits (`07`), three from 100 (`146`), a comma from 1,000 (`1,204`). With `cap`, a
 * mark on an icon stops at `99+`.
 */
export function formatCount(count: number, { cap = false }: { cap?: boolean } = {}): string {
  if (!Number.isFinite(count)) return String(count)
  const n = Math.max(0, Math.floor(count))
  if (cap && n > 99) return "99+"
  if (n >= 1000) return n.toLocaleString("en-US")
  return String(n).padStart(2, "0")
}

/** Seconds left: `MM:SS` with a leading zero, and `NN S` under a minute (`08 S`, `04:12`). */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  if (s < 60) return `${String(s).padStart(2, "0")} S`
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
