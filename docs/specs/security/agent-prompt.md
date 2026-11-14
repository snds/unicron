# AgentPrompt

_Spec v0.1 · 2026-11-07 · Hand-raised from the Mercury review (U5) · Status: built in `@unicron/ui` (this PR)_

## 1.0: the 2026-11 look (contract 5.1b row 44, 5.1c C15)

While it waits, the prompt is **the needs-you block**: the yellow field, 24 of padding, 16
between parts, its text in the yellow's own ink. It is the screen's one yellow shape. Once
answered it turns quiet: the raised surface with a hairline, the answer marked. The header icon
and the attention edge on the left are gone. The sections below describe the behaviour, which
1.0 kept, with these changes:

| Prop | Values | Notes |
|---|---|---|
| `overline` | node | The mono caps line that names the prompt ("Question", "Ask first // GitHub"). Default: the kind's title. The countdown and `// +1` follow it |
| `more` | number | More questions wait behind this one: `// +1` after the overline |
| `options[].safe` | boolean | The answer that does no harm (Deny, Stop). It is the one solid button, and it takes focus when the prompt arrives |
| `options[].key` | `"y"`, `"n"`, `"3"`, … | The key that answers this option, by meaning, not by place |
| `options[].standing` | boolean | An answer that keeps applying ("Always"). Its key works only with focus inside the prompt |
| `autoFocus` | boolean, default true | Moves focus to the safe answer on arrival, but only when nothing else has focus |
| `sendLabel` | string, default "Send" | The word on a reply's send button |
| `layout` | `adaptive` (default) · `inline` | `adaptive`: on a phone an Answer button opens the options in a bottom sheet. `inline`: the options stay in place at every width |

- **The safe answer is first and solid** (`Button variant="needs-you"`); every other answer is a
  text button (`needs-you-text`). The defaults changed order and words to match: **Deny, Allow
  once** for a permission, **Stop, Continue** for a continue. A reply keeps its send button
  solid.
- **Keys answer by meaning** (`agentPromptKeys`). An option's own `key` wins. Otherwise N is the
  safe answer and Y the first other one. Only an option left with no key answers to its place,
  1 to 9, and never to a digit another option claims. So with the defaults, 1 and 2 answer
  nothing.
- **The countdown** follows the system's one form: `01:05`, then `45 S` under a minute
  (`formatPromptCountdown`). It sits after the overline.
- **The trust tier** is a `RiskTierBadge` with `surface="needs-you"`, so its word, glyph and edge
  take the yellow's ink.
- **A reply's field** is `TextField multiline`.
- **The body** shows six lines, then scrolls. Long or detailed options are numbered rows that
  wrap.
- **Tokens.** `--c-agent-prompt-edge`, `-edge-color` and `-edge-answered` are gone. The one knob
  is `--c-agent-prompt-arm-delay` (500ms). The colours are the needs-you roles.

Not built: timed announcements of the countdown (Warpcore asks for 5 and 1 minutes left, Synapse
for 60, 30 and 10 seconds).

## Purpose and the user job

An agent running a task needs the person: allow this, continue, or pick one. The person needs to see that at a glance, answer in one click, tap or key, and keep reading. `ApprovalSheet` covers pairing a device with matched digits, not an agent's questions.

## Uniqueness check

Composes `Button`, `Item` rows, `Kbd`, `RiskTierBadge`, and `Sheet` with `AdaptiveSheetContent`. It's a component because it owns behaviour none of those has: keys that only the newest prompt hears, the buttons-or-rows rule, a sheet on a phone, and one announcement.

## Anatomy

```
agent-prompt              section[aria-labelledby=title], data-kind, data-answered, data-layout; the needs-you field while it waits
├─ header                 the overline ("Allow?" · "Continue?" · "Choose", or `overline`) · countdown · `// +n` · RiskTierBadge (optional)
├─ body                   what's asked (children), type-body, six lines then it scrolls
├─ agent-prompt-options   data-layout="buttons": Buttons, the safe one solid and first, a Kbd hint each with a fine pointer
│                         data-layout="rows": ol of Item buttons, number · title · detail, wrapping
├─ (compact) Answer       a Button that reopens the sheet; the options live in agent-prompt-sheet
└─ (sr-only) status       "Waiting for you", once
```

## Props

| Prop | Values | Notes |
|---|---|---|
| `kind` | `permission` · `continue` · `choice` · `reply` | Sets the title, the icon and the default options. `reply` adds a field for words; its options are the other ways out |
| `options` | `{ id, label, detail?, safe?, key?, standing? }[]` | Default for permission: Deny / Allow once. For continue: Stop / Continue. A choice needs its own |
| `tier`, `verified` | `RiskTier`, boolean | Passed to `RiskTierBadge` |
| `onAnswer` | `(id, text?) => void` | A reply arrives as `AGENT_PROMPT_REPLY` and its words |
| `answer` | an option id, or `AGENT_PROMPT_REPLY` | Answered: marked, disabled, quiet edge, not listening |
| `pending` | boolean | With `answer`: it's being sent. The chosen option spins, the rest are disabled, the edge still waits |
| `error` | node | Sending failed. The host clears `answer` and `pending`; this line says why, in an alert |
| `expiresAt`, `safeAnswer` | epoch ms, an option id | A countdown to the safe answer. When it runs out the prompt shows that answer, marked, and calls `onExpire` |
| `onExpire` | `() => void` | Default: `onAnswer(safeAnswer)`. A host whose server answers on its own passes a no-op |
| `listen` | boolean, default true | False for an older prompt the host keeps listed |

Layout: up to 3 options with no detail and labels of 24 characters or fewer make a button row. Anything else makes numbered rows, never truncated.

## States

| State | What changes |
|---|---|
| waiting | The needs-you yellow, keys live, announced once |
| answered | The raised surface with a hairline, options disabled, the answer `aria-pressed` with a check |
| sending | `data-pending`; the chosen option shows a Spinner ("Sending"); nothing else can be picked |
| failed | The error line (`role="alert"`, destructive ink) under the options; waiting again |
| counting down | A timer after the overline: the time on screen (`04:59`, then `45 S`), "Deny in 04:59" as its name |
| timed out | `data-expired`, answered with the safe option; the timer reads "Timed out" |
| compact width | `layout="adaptive"`: the options move into a bottom sheet that opens by itself; closing it leaves an Answer button. `layout="inline"`: they stay in place |

## Keyboard and screen reader

- Y answers the yes and N the safe answer of `permission` and `continue`; an option's own `key` wins. An option with no key answers to its place, 1 to 9 (see 1.0, above).
- A reply's field: Enter sends, Shift+Enter is a new line. Keys typed there never answer an option.
- The timer is `role="timer"`, so it isn't read out on every tick; its name says what happens and when.
- Keys count only when focus isn't in something that takes text (an input, a textarea, a select, an editable region, or a part with the role `textbox`, `combobox`, `searchbox` or `spinbutton`), and with no modifier key. A held key (auto-repeat) does not count.
- Only the newest listening prompt takes keys.
- A stray key never answers (added 2026-11-14, after review):
  - The keys are inert for `--c-agent-prompt-arm-delay` (500ms) after a prompt starts listening: when it arrives, and when the prompt after it is answered. The same window as `ApprovalSheet`.
  - An option marked `standing` (an answer that keeps applying, "Always for Lockdown") takes its key only while focus is inside the prompt. The safe answer and a one-time yes keep the plain key. Mark every "always" answer `standing`.
  - `listen={false}` turns the single-key answers off (WCAG 2.1.4). Every option is still a button.
- Each option says its key through `aria-keyshortcuts`. Key hints (`Kbd`) show only with a fine pointer, and are aria-hidden.
- Tab reaches every option. The region is named by its title.
- A polite `role="status"` says "Waiting for you" once, when the prompt appears.
- Pair it with the `indicator` prop (`attention`) on the nav item and the row, so the place shows it's waiting too.

## Tokens

- Waiting: `needs-you-fill` and `needs-you-on-fill`. Answered: `surface-raised` with a `line-rule` hairline.
- `--c-agent-prompt-arm-delay` (500ms): how long the keys stay inert after a prompt starts listening.
