# Contributing: how unicron is federated

_Lockdown decision D17, 2026-10-15. Contribution is open. Ownership is not._

> Unicron is a personal project. "Contribution" here means Sean's own apps, the consumers in the
> table below. Pull requests from outside contributors aren't accepted ([CONTRIBUTING.md](../CONTRIBUTING.md)).

## Roles

| Role | Who | Owns |
|---|---|---|
| **Core** | unicron code owners (`.github/CODEOWNERS`: `@snds`) | tokens, primitives, the pattern catalog, releases |
| **Contributing consumer** | Mailbird, Synapse, Lockdown, and any later app | its own app-extension layer; proposals upstream |

An app-extension layer is the set of tokens and components that belong to one app alone (see `packages/tokens/examples/app-extension.css`). It never has to go upstream.

## The loop

1. **Build locally.** A consumer builds the component or recipe in its app-extension layer. Ship it there first.
2. **Let DSA flag it.** `pnpm ds:patterns` raises a candidate when a composition repeats 3+ times across 2+ hosts. Across *apps* is the strong signal; within one app is a hint.
3. **Propose upstream.** Open a unicron PR with: the component, a one-page spec (anatomy, states, keyboard and screen-reader behaviour), the DSA suggestion record as evidence, and the app it came from. The PR template (`.github/pull_request_template.md`) is that page; the **Promotion candidate** issue template is for asking for a steer first.
4. **Core arbitrates.** Against the uniqueness rule: different job and anatomy → pattern; shares a parent → variant of that parent; one-off → snowflake, declined. Against the token rules: no raw values, semantic tokens only. Merge, or decline with the reason written on the PR.
5. **Release.** SemVer. A breaking change ships with a codemod or it does not ship. Consumers bump inside the support window (current and previous minor).

## Contracts, not goodwill

- The **DSA ratchet** in each consumer's CI fails when override counts grow. Promotion is how a consumer lowers its count.
- **Token lint** (`pnpm lint:tokens`, `packages/tokens/scripts/lint.mjs`) in unicron's CI refuses raw values: every colour in the semantic and component tiers is a `{reference}` to a lower tier, and `packages/ui/src` carries no hex / `rgb()` / `hsl()` / `oklch()` literals (Tailwind arbitrary values that read `var(--…)` are fine).
- **Published artifacts.** Consumers depend on a versioned package, not a submodule, so three apps can sit on three versions during a migration. Each release is a git tag, a GitHub Release with the tarball attached, and (when npm is configured) an npm version — see [Releasing](#releasing). The submodule Mailbird used first was the week-one exception; `docs/05-consuming.md` has the recipe for moving off it.

## Provenance

Every promoted component records where it came from: a `Promoted from:` line in its header comment (app, PR, DSA record id). The catalog in `docs/04-patterns.md` links back to it.

The line is the third header comment of the module, after the two generation lines, so a reader (or
`grep -r "Promoted from:" packages/ui/src`) finds it without opening the file:

```
// Promoted from: <app repo> · PR <owner/repo#n> · DSA <record id>
```

- `<app repo>` is the consumer it came from (`snds/mailbird`, `snds/synapse`, …).
- `PR` is the unicron PR that merged it, so the one-page spec and the arbitration are one click away.
- `DSA` is the suggestion record id from that app's `.dsa/patterns.json` (`pattern-0007`); write
  `none` when it was hand-raised.

Do not invent provenance. The primitives copied in at the start have no PR and no DSA record; they
carry the seeded form instead, and only the one that changed on the way in says so. Worked example,
`packages/ui/src/components/ui/sheet.tsx`:

```
// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded from snds/mailbird (initial copy; AdaptiveSheetContent and its wide variant arrived with the set)
```

A component promoted through the loop reads, for example:

```
// Promoted from: snds/mailbird · PR snds/unicron#42 · DSA pattern-0007
```

## Releasing

Versions are mechanical. The tools are [Changesets](https://github.com/changesets/changesets) and
`.github/workflows/release.yml`; the rules are SemVer and the support window above.

1. **Changeset per PR.** Any PR that changes `packages/tokens` or `packages/ui` runs
   `pnpm changeset` and commits the generated `.changeset/*.md`: which packages, which bump
   (`patch` · `minor` · `major`), and one line a consumer can act on. The PR template has a box for
   it. Docs-only and CI-only PRs need none. `@unicron/ui` depends on `@unicron/tokens`, so a tokens
   release bumps `ui` at least a patch (`updateInternalDependencies`).
2. **Version Packages PR.** On every push to `main` with changesets pending, the workflow runs
   `pnpm run version` (`changeset version`) on a branch and opens or updates a PR titled
   **Version Packages**: bumped `package.json` versions, `CHANGELOG.md` entries, changesets consumed.
   It keeps accumulating until core merges it. Review it like any PR; a code-owner review is
   required.
3. **Tag.** Merging that PR pushes `main` with no changesets and untagged versions. The workflow
   builds, packs (`pnpm pack:packages`), creates one annotated git tag per package
   (`@unicron/tokens@0.1.0`, `@unicron/ui@0.1.0`) and one **GitHub Release** per tag with the
   package's changelog entry as notes and its tarball attached.
4. **Publish.** In the same run the packages go to npm **only if** the repository has an
   `NPM_TOKEN` secret (or the `NPM_TRUSTED_PUBLISHING` variable is `true` and npm trusted publishing
   is set up for this repo). Without either, the run still succeeds with tags and GitHub Releases;
   consumers install from the release tarballs (`docs/05-consuming.md`). npm provenance is on when
   publishing from CI.

Locally: `pnpm changeset` (add), `pnpm run version` (apply, normally left to the PR), `pnpm release`
(build + `changeset publish`, needs `npm login`; the workflow does this for you).
`pnpm pack:packages` writes the tarballs to `artifacts/` (gitignored) so you can smoke-test a
consumer before releasing.

A breaking change is a `major` changeset and ships with a codemod link in the PR; the support
window is the current and previous minor.

## What core will decline

- A component that exists to avoid writing an app-extension token.
- A wrapper whose only job is a default prop value (a variant, not a component).
- Anything carrying an app's domain nouns in its name.
- Any change that makes a consumer's ratchet count go up.

## Why this shape

Federation without an arbiter becomes N sources of truth. Here the *contribution* is federated and the *ownership* is not: anyone proposes, core decides, the ratchet and the lint make the rules mechanical, and versioned releases let apps move at their own pace.
