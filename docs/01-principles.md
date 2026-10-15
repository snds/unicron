# 01 · Principles

## One system, three products

unicron is the shared design system for **Mailbird** (mail, calendar, contacts, notes),
**Synapse** and **Lockdown** (password manager, passkey provider, authenticator). They look like
siblings because they draw from the same tokens and primitives, and they behave like natives
because behaviour follows the platform each one ships on.

- **Brand in tokens.** Colour, type, radius, motion and iconography are tokens
  (`@unicron/tokens`). A product never hard-codes a visual value; it aliases a token.
- **Behaviour per platform.** Focus order, gestures, keyboard shortcuts, sheet-vs-dialog choices
  and system integrations are decided by the platform the app runs on, not by the system.
- **One spec, three builds later.** Today unicron ships one build: React + Tailwind for the web
  and Tauri shells. The token source is DTCG JSON so the same spec can later feed a SwiftUI build
  and an Android build without changing the source of truth.

## How the layers sit

```
tier 1  global     --g-*   raw values                 (theme-agnostic)
tier 2  semantic   --*     roles = the shadcn contract (light/dark swap here)
tier 3  component  --c-*   knobs the primitives read   (alias tier 2)
app extension              roles only one product has (declared by that product)
primitives                 @unicron/ui: shadcn/ui on Base UI + Material Symbols
patterns                   compositions promoted by people from dsa suggestions
```

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

## Planned: security components (from Lockdown's brief §5.7)

These are not built yet. They are listed so that nothing product-local grows in their place.

| Component | Job |
|---|---|
| **Approval sheet with number matching** | Confirm a sign-in or action by picking the matching number shown on the other device; resists approval fatigue. |
| **Risk-tier badge** | A fixed vocabulary of risk levels (low / elevated / crown-jewel) with one colour and one icon each, never reinterpreted per product. |
| **Secret field with clipboard timer** | Reveal-on-hold, copy with an automatic clipboard clear and a visible countdown. |
| **Code display** | 6- and 8-digit one-time codes and Steam's 5-character codes, grouped for reading, with time-remaining ring and copy. |
| **Large-type view** | A full-screen, high-contrast rendering of a secret for reading across a room or typing on another device. |
| **Crown-jewel styling** | The treatment for secrets that never autofill and never reach agents: distinct surface, lock iconography, extra confirmation. |

They will follow the same rules as every other primitive: tokens only, Base UI behaviour where
a primitive exists, Material Symbols, and a playground entry in light and dark.
