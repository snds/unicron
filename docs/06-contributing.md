# Contributing: how unicron is federated

_Lockdown decision D17, 2026-10-15. Contribution is open. Ownership is not._

## Roles

| Role | Who | Owns |
|---|---|---|
| **Core** | unicron code owners (`CODEOWNERS`) | tokens, primitives, the pattern catalog, releases |
| **Contributing consumer** | Mailbird, Synapse, Lockdown, and any later app | its own app-extension layer; proposals upstream |

An app-extension layer is the set of tokens and components that belong to one app alone (see `packages/tokens/examples/app-extension.css`). It never has to go upstream.

## The loop

1. **Build locally.** A consumer builds the component or recipe in its app-extension layer. Ship it there first.
2. **Let DSA flag it.** `pnpm ds:patterns` raises a candidate when a composition repeats 3+ times across 2+ hosts. Across *apps* is the strong signal; within one app is a hint.
3. **Propose upstream.** Open a unicron PR with: the component, a one-page spec (anatomy, states, keyboard and screen-reader behaviour), the DSA suggestion record as evidence, and the app it came from.
4. **Core arbitrates.** Against the uniqueness rule: different job and anatomy → pattern; shares a parent → variant of that parent; one-off → snowflake, declined. Against the token rules: no raw values, semantic tokens only. Merge, or decline with the reason written on the PR.
5. **Release.** SemVer. A breaking change ships with a codemod or it does not ship. Consumers bump inside the support window (current and previous minor).

## Contracts, not goodwill

- The **DSA ratchet** in each consumer's CI fails when override counts grow. Promotion is how a consumer lowers its count.
- **Token lint** in unicron's CI refuses raw values in primitives.
- **Published artifacts.** Consumers depend on a versioned package, not a submodule, so three apps can sit on three versions during a migration. The submodule Mailbird used first is the week-one exception; publishing is a prerequisite before a second consumer joins.

## Provenance

Every promoted component records where it came from: a `Promoted from` line in its header comment (app, PR, DSA record id). The catalog in `docs/04-patterns.md` links back to it.

## What core will decline

- A component that exists to avoid writing an app-extension token.
- A wrapper whose only job is a default prop value (a variant, not a component).
- Anything carrying an app's domain nouns in its name.
- Any change that makes a consumer's ratchet count go up.

## Why this shape

Federation without an arbiter becomes N sources of truth. Here the *contribution* is federated and the *ownership* is not: anyone proposes, core decides, the ratchet and the lint make the rules mechanical, and versioned releases let apps move at their own pace.
