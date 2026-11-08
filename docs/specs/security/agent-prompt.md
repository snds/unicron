# AgentPrompt

_Spec v0.1 · 2026-11-07 · Hand-raised from the Mercury review (U5) · Status: built in `@unicron/ui` (this PR)_

## Purpose and the user job

An agent running a task needs the person: allow this, continue, or pick one. The person needs to see that at a glance, answer in one click, tap or key, and keep reading. `ApprovalSheet` covers pairing a device with matched digits, not an agent's questions.

## Uniqueness check

Composes `Button`, `Item` rows, `Kbd`, `RiskTierBadge`, and `Sheet` with `AdaptiveSheetContent`. It's a component because it owns behaviour none of those has: keys that only the newest prompt hears, the buttons-or-rows rule, a sheet on a phone, and one announcement.

## Anatomy

```
agent-prompt              section[aria-labelledby=title], data-kind, data-answered; an attention edge on the left
├─ header                 Icon (the kind's) · h3 title ("Allow?" · "Continue?" · "Choose") · RiskTierBadge (optional)
├─ body                   what's asked (children), type-body, wraps
├─ agent-prompt-options   data-layout="buttons": Buttons, the first primary, a Kbd hint each with a fine pointer
│                         data-layout="rows": ol of Item buttons, number · title · detail, wrapping
├─ (compact) Answer       a Button that reopens the sheet; the options live in agent-prompt-sheet
└─ (sr-only) status       "Waiting for you", once
```

## Props

| Prop | Values | Notes |
|---|---|---|
| `kind` | `permission` · `continue` · `choice` | Sets the title, the icon and the default options |
| `options` | `{ id, label, detail? }[]` | Default for permission: Allow / Deny. For continue: Continue / Stop. A choice needs its own |
| `tier`, `verified` | `RiskTier`, boolean | Passed to `RiskTierBadge` |
| `onAnswer` | `(id) => void` | |
| `answer` | an option id | Answered: marked, disabled, quiet edge, not listening |
| `listen` | boolean, default true | False for an older prompt the host keeps listed |

Layout: up to 3 options with no detail and labels of 24 characters or fewer make a button row. Anything else makes numbered rows, never truncated.

## States

| State | What changes |
|---|---|
| waiting | Attention edge (`--c-agent-prompt-edge-color`), attention icon, keys live, announced once |
| answered | Quiet edge (`--c-agent-prompt-edge-answered`), muted icon, options disabled, the answer `aria-pressed` with a check |
| compact width | The options move into a bottom sheet that opens by itself; closing it leaves an Answer button |

## Keyboard and screen reader

- Y and N answer the first and second options of `permission` and `continue`. 1 to 9 answer any option.
- Keys count only when focus isn't in an input, a textarea, a select or an editable region, and with no modifier key.
- Only the newest listening prompt takes keys.
- Key hints (`Kbd`) show only with a fine pointer, and are aria-hidden.
- Tab reaches every option. The region is named by its title.
- A polite `role="status"` says "Waiting for you" once, when the prompt appears.
- Pair it with the `indicator` prop (`attention`) on the nav item and the row, so the place shows it's waiting too.

## Tokens

- `--c-agent-prompt-edge` (width), `--c-agent-prompt-edge-color` (`attention`) and `--c-agent-prompt-edge-answered` (`border`).
- The icon uses `text-attention-foreground`.
- The card uses `bg-card` and `ring-foreground/10`.
