# 01 · Principles

## One system, four products

unicron is the shared design system for four apps: **Vale** (mail, calendar, contacts, notes;
it was called Mailbird), **Warpcore** (agent work), **Lockdown** (password manager, passkey
provider, authenticator) and **Synapse**. They look like siblings because they draw from the
same tokens and primitives, and they behave like natives because behaviour follows the platform
each one ships on.

- **Brand in tokens.** Colour, type, radius, motion and iconography are tokens
  (`@unicron/tokens`). A product never hard-codes a visual value; it aliases a token.
- **Behaviour per platform.** Focus order, gestures, keyboard shortcuts, sheet-vs-dialog choices
  and system integrations are decided by the platform the app runs on, not by the system.
- **One spec, three builds later.** Today unicron ships one build: React + Tailwind for the web
  and Tauri shells. The token source is DTCG JSON so the same spec can later feed a SwiftUI build
  and an Android build without changing the source of truth.

## How the layers sit

```
tier 1  global     --g-*     raw values, and one set of theme slots per app
tier 2  semantic   --*       roles: Figma's names, with the shadcn names as aliases (the ground swaps here)
type roles         --type-*  23 text styles, one set for every app
tier 3  component  --c-*     knobs the components read (alias tier 2)
app extension                roles only one product has (declared by that product)
components                   @unicron/ui: Base UI behaviour, IBM Carbon icons
patterns                     compositions promoted by people from dsa suggestions
```

An app picks its theme with `data-theme` on `<html>`, and its ground (graphite or stone) with the
`dark` class. A component never sets either ([02 · Tokens](02-tokens.md#two-axes)).

## Rules we keep

1. **Core stays generic.** If a role only makes sense in one product (`--unread`,
   `--vertical-mail`, `--surface-chrome`), it is an app extension, not a core token.
2. **Primitives are owned source.** They are generated once from shadcn/ui and then edited
   like any code. Regeneration is a diff to review, not a silent overwrite.
3. **Compose before you create.** A new need is first a composition of primitives (a pattern).
   It becomes a component only when `dsa` shows it repeating and a person promotes it.
4. **Measure correct use.** `dsa ratchet` counts `className`/`style` overrides on system
   components, spread props on them, and local look-alikes of system names. The count may
   only go down.
5. **Security-grade components are system components.** Lockdown needs UI that is safe by
   construction; those pieces live here so every product gets the same guarantees.

### Where 1.0 bends rule 1 (open, for Sean)

Rule 1 is not rewritten. Two things in 1.0 go against it as it is written, and Sean has not
ruled on either:

- **The four app themes live in the core.** `packages/tokens/tokens/themes/` holds a file each
  for `warpcore`, `vale`, `lockdown` and `synapse`, so the core names four products. It was done
  because Figma's `Unicron / Theme` collection holds all eight modes, and because the contrast
  gate can then measure every app in one place. Each file sets the same 28 slots and nothing
  else, and the roles stay generic. The other way: each app declares its two hues in its own
  layer, and the contrast gate runs in four repos.
- **`CalendarEvent` is a core component.** Only Vale has a calendar. It is here because it is on
  Figma's `Unicron / Components` page. The other way: it moves to Vale's own layer.

Both are in the questions list for the 1.0 release. Until Sean answers, do not treat either as a
precedent: a fifth app theme, or another component named for one product's domain, is not
something core accepts.

Rule 3 was also set aside once, for the same release. The components 1.0 added were seeded from
the 2026-11 design direction, not promoted from a `dsa` record; the
[promotion log](04-patterns.md#promotion-log) says which. After 1.0 the loop is the way in again.

## Security components (from Lockdown's brief §5.7)

All of these are built. Each has a one-page spec under [`docs/specs/security/`](specs/security/README.md),
and [03 · Components](03-components.md#security-components) has the summary. They are listed
here so that nothing product-local grows in their place.

| Component | Job |
|---|---|
| **ApprovalSheet**, with number matching | Confirm a sign-in or an action by matching the number the other device shows; resists approval fatigue. |
| **RiskTierBadge** | A fixed vocabulary of trust tiers, shown as plain words: **Built in** (`standard`), **Verified** (`official`), **Use with care** (`tolerated`), with one word and one glyph each, never reinterpreted per product. Crown jewel is an item class with its own treatment, not a tier. |
| **SecretField**, with a clipboard timer | Reveal on hold, copy with an automatic clipboard clear and a visible countdown. |
| **CodeDisplay** | 6- and 8-digit one-time codes and Steam's 5-character codes, grouped for reading, with the time left as a row of cells, and copy. |
| **LargeTypeView** | A secret in large type, for reading across a room or typing on another device. |
| **CrownJewel** treatment | For secrets that never autofill and never reach agents: its own surface, a lock mark, an extra confirmation. |
| **AgentPrompt** | An agent's question in a conversation, answered once, safely, by a press or a key. |
| **DigitGroups**, **QrCode** | Digits in groups for reading aloud and comparing; a code another device reads from the screen. |

They follow the same rules as every other part: tokens only, Base UI behaviour where a primitive
exists, Carbon icons, and a playground view in the app themes on both grounds.
