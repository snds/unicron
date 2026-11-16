// Numbers and times as every part writes them (cross-app decisions §13). One home, so a count in a
// nav item, a list row, a filter chip and an indicator, and a countdown in a status line, an agent
// prompt and a security row, always read the same.

/**
 * A count, as every Figma sidebar draws it: three digits (`007`, `012`, `146`), a comma from 1,000
 * (`1,204`) (Unicron 13, decided 2026-11-16; it was two digits before). With `cap`, a mark on an
 * icon keeps the two digits Figma draws in its badges (`01`, `12`) and stops at `99+`, so it is
 * never wider than three characters. A count inside a sentence is a plain number ("3 new senders"), which this
 * does not write (Vale 6).
 */
export function formatCount(count: number, { cap = false }: { cap?: boolean } = {}): string {
  if (!Number.isFinite(count)) return String(count)
  const n = Math.max(0, Math.floor(count))
  if (cap) return n > 99 ? "99+" : String(n).padStart(2, "0")
  if (n >= 1000) return n.toLocaleString("en-US")
  return String(n).padStart(3, "0")
}

/** Seconds left: `MM:SS` with a leading zero, and `NN S` under a minute (`08 S`, `04:12`). */
export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  if (s < 60) return `${String(s).padStart(2, "0")} S`
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}
