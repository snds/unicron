# DigitGroups

_Spec v1.0 · 2026-11-13 · Proposed by Lockdown (undrawn-area brief L-23; contract 5.1b row 52) · Status: built in `@unicron/ui` 1.0; this spec describes the build_

## Purpose and the user job

A person reads a code aloud to someone, or compares it with the code on another screen: a pairing code, six digits from a key exchange, a nine-digit phrase, a fingerprint, a device code, a server's key. Groups keep the place: "482, 913" is read and compared a group at a time, and a group that differs stands out.

## Uniqueness check

`CodeDisplay` is a one-time code with a clock, a copy and a crown-jewel gate; `LargeTypeView` is a secret across a room, one character at a time with captions. Neither fits a code that is neither secret nor timed and sits in a sentence, a Field Row or a review. DigitGroups owns the grouping rule and the spoken form, so every product groups and speaks the same code the same way.

## Anatomy

```
digit-groups              span, data-size; type role of the size; mono, tabular, slashed zero
├─ digit-groups-group     span per group, aria-hidden, no wrap inside a group
└─ (sr-only)              "Pairing code: 4 8 2, 9 1 3"
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `value` | string | Spaces, dashes and dots in it are where it breaks ("7KQ2M-9XH4P"); a value with none is cut by `groupSize` |
| `groupSize` | number | Default `digitGroupSize(length)`: 3 up to twelve characters, then 5 or 4 where they divide it (a 60-digit fingerprint reads in fives), else 3 |
| `size` | `sm` · `md` (default) · `lg` | `sm` reads in a Field Row (`type-code-inline`); `md` on its own line (`type-number-count`); `lg` to compare across a room (`type-code-display`) |
| `label` | string | Said before the characters: "Pairing code" |

Exports: `DigitGroups`, `digitGroupSize`, `splitDigitGroups`, `spellDigitGroups`, `DigitGroupsProps`, `DigitGroupsSize`.

## States

None of its own: it is text. It wraps between groups, never inside one. High contrast and forced colours need nothing: it is ink on the ground.

## Tokens

Tier 3: `--c-digit-groups-gap` (0.6em, wider than a space so groups read apart). Roles: `text-body`; the size's type role.

## Keyboard and screen reader

Not focusable. A screen reader hears the sr-only line: the label, then one character at a time with a pause at each group ("4 8 2, 9 1 3"), never a number. The groups can be selected as text; the gaps are space, not characters.

## Security notes

It is for codes meant to be read and compared. A secret goes in `SecretField` or `LargeTypeView`, which mask it and bound how long it shows.

## Provenance and release

DSA record: none (first principles, Lockdown undrawn-area brief L-23). Shipped: `@unicron/ui` 1.0; subpath `@unicron/ui/security/digit-groups`.

## Acceptance tests

**Vitest (`digit-groups.test.tsx`):** a code's own breaks are kept; a code with none is cut by the default rule (6 → 3, 9 → 3, 8 → 4, 60 → 5, 7 → 3) or by `groupSize`; the spoken form is one character at a time with a comma at each group; groups are aria-hidden and the sr-only line carries the label; each size takes its type role with the slashed zero and the gap knob.

**Still needs a browser:** wrapping at a narrow width; the slashed zero in Geist Mono in WebKit.
