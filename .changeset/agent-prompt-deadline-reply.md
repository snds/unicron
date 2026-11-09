---
"@unicron/ui": minor
---

AgentPrompt: `kind="reply"` takes words (Enter sends); `pending` and `error` cover sending and a failed send; `expiresAt` + `safeAnswer` count down and answer with the safe option when time runs out (`onExpire` to let the server do it). `onAnswer` gets the reply text as a second argument.
