// Owned component (not generated): a code shown in groups, to read aloud or to compare with another
// screen: a pairing code, six digits, a phrase, a fingerprint, a device code, a server's key.
// Spec: docs/specs/security/digit-groups.md.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Lockdown brief L-23, contract 5.1b row 52; no app PR, no DSA record)
import * as React from "react"

import { cn } from "../../lib/utils"

export type DigitGroupsSize = "sm" | "md" | "lg"

export interface DigitGroupsProps extends Omit<React.ComponentProps<"span">, "children"> {
  /**
   * The code. Spaces, dashes and dots in it are where it breaks ("7KQ2M-9XH4P", "482 913"); a code
   * with none is cut into groups of `groupSize`.
   */
  value: string
  /** Characters per group when `value` has no breaks of its own. Default: 3 up to twelve characters, then 5 or 4 where they divide it (a 60-digit fingerprint reads in fives). */
  groupSize?: number
  /**
   * `sm` reads in a Field Row (code/inline, 15/20); `md` stands on its own line (number/count,
   * 24/28); `lg` is the code to compare across a room (code/display, 36/40).
   */
  size?: DigitGroupsSize
  /** What it is, said before the characters: "Pairing code". */
  label?: string
}

const SIZE: Record<DigitGroupsSize, string> = {
  sm: "type-code-inline",
  md: "type-number-count",
  lg: "type-code-display",
}

/** The default group size for a code with no breaks of its own. */
export function digitGroupSize(length: number): number {
  if (length <= 12 && length % 3 === 0) return 3
  if (length >= 20 && length % 5 === 0) return 5
  if (length % 4 === 0) return 4
  return 3
}

/** Cut a code into its groups: at its own breaks, or every `groupSize` characters. */
export function splitDigitGroups(value: string, groupSize?: number): string[] {
  const trimmed = value.trim()
  if (!trimmed) return []
  if (/[\s.-]/.test(trimmed)) return trimmed.split(/[\s.-]+/).filter(Boolean)
  const chars = Array.from(trimmed)
  const size = Math.max(1, Math.round(groupSize ?? digitGroupSize(chars.length)))
  const groups: string[] = []
  for (let i = 0; i < chars.length; i += size) groups.push(chars.slice(i, i + size).join(""))
  return groups
}

/** "482913" → "4 8 2, 9 1 3": one character at a time, a pause between groups, never a number. */
export function spellDigitGroups(groups: string[]): string {
  return groups.map((g) => Array.from(g).join(" ")).join(", ")
}

/**
 * A code in groups, in mono with tabular figures and a slashed zero, so two screens can be
 * compared group by group and a code can be read out without losing the place. A screen reader
 * hears it one character at a time, with a pause at each group, never as a number. It is text, so
 * it can be selected; the groups' gaps are space, not characters.
 */
export function DigitGroups({ value, groupSize, size = "md", label, className, ...props }: DigitGroupsProps) {
  const groups = React.useMemo(() => splitDigitGroups(value, groupSize), [value, groupSize])
  const spelled = spellDigitGroups(groups)
  return (
    <span
      data-slot="digit-groups"
      data-size={size}
      className={cn(
        "text-text-body inline-flex max-w-full flex-wrap items-baseline gap-x-(--c-digit-groups-gap) gap-y-1 [font-feature-settings:'zero']",
        SIZE[size],
        className
      )}
      {...props}
    >
      {groups.map((g, i) => (
        <span key={i} data-slot="digit-groups-group" aria-hidden className="whitespace-nowrap">
          {g}
        </span>
      ))}
      <span className="sr-only">{label ? `${label}: ${spelled}` : spelled}</span>
    </span>
  )
}
