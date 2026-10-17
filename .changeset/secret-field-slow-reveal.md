---
"@unicron/ui": patch
---

`SecretField`: a reveal whose `getSecret` resolves after the loading render has committed (any host that fetches over a bridge) no longer falls back to masked. The value span stays mounted while loading, with the skeleton drawn inside it. Found by the Lockdown desktop; its pnpm patch can be dropped.
