# Contributing: how unicron is federated

_Lockdown decision D17, 2026-10-15. Contribution is open. Ownership is not._

> Unicron is a personal project. "Contribution" here means Sean's own apps, the consumers in the
> table below. Pull requests from outside contributors aren't accepted ([CONTRIBUTING.md](../CONTRIBUTING.md)).

## Roles

| Role | Who | Owns |
|---|---|---|
| **Core** | unicron code owners (`.github/CODEOWNERS`: `@snds`) | tokens, primitives, the pattern catalog, releases |
| **Contributing consumer** | Vale, Warpcore, Lockdown, Synapse, and any later app | its own app-extension layer; proposals upstream |

An app-extension layer is the set of tokens and components that belong to one app alone (see `packages/tokens/examples/app-extension.css`). It never has to go upstream.

## The loop

1. **Build locally.** A consumer builds the component or recipe in its app-extension layer. Ship it there first.
2. **Let DSA flag it.** `pnpm ds:patterns` raises a candidate when a composition repeats 3+ times across 2+ hosts. Across *apps* is the strong signal; within one app is a hint.
3. **Propose upstream.** Open a unicron PR with: the component, a one-page spec (anatomy, states, keyboard and screen-reader behaviour), the DSA suggestion record as evidence, and the app it came from. The PR template (`.github/pull_request_template.md`) is that page; the **Promotion candidate** issue template is for asking for a steer first.
4. **Core arbitrates.** Against the uniqueness rule: different job and anatomy → pattern; shares a parent → variant of that parent; one-off → snowflake, declined. Against the token rules: no raw values, semantic tokens only. Merge, or decline with the reason written on the PR.
5. **Release.** SemVer. A breaking change ships with a codemod or it does not ship. Consumers bump inside the support window (current and previous minor).

## Contracts, not goodwill

- The **DSA ratchet** in each consumer's CI fails when override counts grow. Promotion is how a consumer lowers its count.
- **Token lint** (`pnpm lint:tokens`, `packages/tokens/scripts/lint.mjs`) in unicron's CI refuses raw values: every colour in the semantic and component tiers is a `{reference}` to a lower tier, and `packages/ui/src` carries no hex / `rgb()` / `hsl()` / `oklch()` literals (Tailwind arbitrary values that read `var(--…)` are fine). A component knob that times a motion (its name ends in `-duration`) is a `{reference}` to a motion role, never a literal. The same lint keeps motion literals out of `packages/ui/src` (tests aside): no raw Tailwind duration or delay (`duration-200`), no generic curve (`ease-in`, `ease-out`, `ease-in-out`), no hand-written `cubic-bezier()` or `linear()`, no raw time in a `transition` or `animation`, no tier 1 motion variable (`--g-duration-*`, `--g-ease-*`, `--g-spring-*`), and no `transition-all`. Write a motion role instead (`duration-(--motion-base)`, `ease-exit`); `ease-linear` is allowed for a value that tracks a real quantity. A primitive fresh from `pnpm regen` arrives with shadcn's raw durations, so the lint flags it until they are re-pointed. Since 1.0 it also holds the theme files (`tokens/themes/<app>.json`, the 28 slots each), `tokens/type.json` (the 23 type roles) and the area knob files (`tokens/component/<area>.json`; two files may not declare the same knob); no role or knob may reference the legacy `--g-neutral-*` ramp (except `success*`, `warning*`, `info*`), and a knob's colour may not reference tier 1 (`{needs-you-fill}` is the role, `{needs-you.fill}` the raw value). A knob for a corner is the bare `{radius}`. And the classes in `packages/ui/src` carry no raw values either: no px or rem number in an arbitrary value (`w-[13px]`), no colour from Tailwind's own palette (`text-white`, `bg-red-500`), no raw type (`text-sm`, `font-medium`, `leading-5`: write a type role), no `rounded-full`, and no blur or drop shadow. What it allows is listed in the script, each with its reason.
- **Figma parity and the contrast gate** run in `pnpm test`. `figma-parity` compares every built theme value, type role, size and the radius with the checked-in Figma read-out (`tokens/figma/theme-2026-11.json`). The contrast gate measures every recipe (core plus each area's `scripts/recipes/<area>.mjs`) in all 8 modes. A miss that is Figma's own value goes in that file's `exceptions` with a reason, so it is reported for a decision, never silently passed; anything else fails. `node packages/tokens/scripts/contrast.mjs --print-exceptions` prints the current list.
- **Playground and browser checks.** A view is a file in `apps/playground/src/views/` (picked up with no registration; a file starting with `_` is shared parts). The address is the state: `?view=<name>&theme=<app>&ground=<graphite|stone>`. `pnpm --filter playground test:motion` runs every spec in `apps/playground/tests/` against the built playground, in a real browser:
  - `motion.spec.ts`: each motion contract moves only what it lists, for no longer than its role, and not at all under reduced motion.
  - `shell.spec.ts`: the address, the switcher, and every view mounts with no page error.
  - `foundations.spec.ts`: the 8 Figma modes reach the pixels, the type roles match, rules add no height, scrims are never opaque, nothing blurs a backdrop.
  - `shell-frame.spec.ts`: the four shells at phone, short, medium and desktop sizes; the scrolled chrome; toasts; the shrink order; pull to refresh.
  - `parts.spec.ts`: one check per review finding, so a fixed defect stays fixed.
  - `rules.spec.ts`: **the rules of the look, on every view** at 1440 and at 390: each component's box is a multiple of 4px tall, every piece of text is one of the 23 type roles, every gap is on the spacing scale, nothing is blurred. Its lists of exceptions are exact: an exception that no longer occurs fails the run. A new view has to pass it.

  Three rules for these checks. **Pick a free port.** The config reuses a server that is already on its port, so a busy port silently tests another checkout's build: set `PW_PORT` to a port nothing listens on, and check that the server on it runs from your checkout. **Do not pin glyph widths.** Pin gaps, paddings, heights and a first x exactly; give a text width a few px of tolerance, because CI's runner draws text a little wider. **Wait for the fonts** (`document.fonts.ready`) before measuring. `PW_EXECUTABLE_PATH` uses a Chromium that is already on the machine. Screenshots: `node apps/playground/scripts/shots.mjs <dir> --views … --modes vale-stone,warpcore-graphite` after `pnpm build`.
- **Design detector, report only.** CI's `design-detect` job runs Impeccable's detector (`impeccable detect --json`, pinned) over `packages/ui/src` and the playground, and writes its findings to the run summary and an `impeccable` artifact. It never fails a build: it is a second opinion for review, not a gate. Its live mode and its skill and hook installs are not used.
- **What `pnpm test` holds in `packages/ui`.** Besides the unit tests: the generated icon data and the Material-to-Carbon map are current (`icons:check`), the copy of sonner matches the installed one (`sonner:check`), and the codemod and `unicron-sources` pass their own tests. After a change to `src/icons/names.json` run `pnpm --filter @unicron/ui icons:build`; after a sonner bump, `sonner:build`.
- **Published artifacts.** Consumers depend on a versioned package, not a submodule, so four apps can sit on four versions during a migration. Each release is a git tag, a GitHub Release with the tarball attached, and (when npm is configured) an npm version — see [Releasing](#releasing). The submodule Mailbird used first was the week-one exception; `docs/05-consuming.md` has the recipe for moving off it.

## What a new or changed component needs

1. **A test beside it** (`*.test.tsx`): roles, names, ARIA state, keyboard, and the classes that
   matter. Tests cannot see styles, so a restyle that drops a pinned class fails on purpose.
2. **Its knobs in its area's file**, `packages/tokens/tokens/component/<area>.json`. The build
   merges the folder. No colour, px or motion literal in the component itself.
3. **Its painted pairs in its area's recipes**, `packages/tokens/scripts/recipes/<area>.mjs`, so
   the contrast gate measures them in all 8 modes.
4. **A view** in `apps/playground/src/views/`, with real data: the text the app would show, no
   lorem and no fake codes. Look at it in at least `vale / stone` and `warpcore / graphite`.
5. **An export** in `packages/ui/src/index.ts`, and **a row** in [03 · Components](03-components.md).
6. **A header** that says where it came from ([Provenance](#provenance)).
7. **It works under a strict policy and in WebKit.** No `<style>` tag at run time, no `style`
   attribute written into markup, nothing from a `data:` URL (Lockdown's web vault runs
   `style-src 'self'`). The Mac apps run in WKWebView: nothing Chromium-only.

### Docs that move with a change

| Change | Update |
|---|---|
| any token | [02 · Tokens](02-tokens.md); `DESIGN.md` (its front matter and the role list at its end) |
| a new or changed component | [03 · Components](03-components.md) (the module table and the notes); `packages/ui/src/index.ts` |
| a promotion or a reversed decision | the promotion log in [04 · Patterns](04-patterns.md) |
| anything a consumer does differently | [05 · Consuming](05-consuming.md); for a breaking change, a migration guide like [07](07-migrating-to-1.0.md) |
| process, lint or release rules | this file |
| a security component | its spec in `docs/specs/security/` |
| the look | `DESIGN.md` |

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

A hand-written component starts with one line that says so, then the same provenance line. Work
that came from a design direction, with no app PR behind it, says that too. Every part 1.0 added
reads like this:

```
// Owned component (not generated): the square icon-only button of the floating phone chrome, also the close button of a sheet or a dialog; extended, it shows its word.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 20:1690; no app PR, no DSA record)
```

`grep -r "Promoted from:" packages/ui/src/components` finds every component.

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
window is the current and previous minor. A major also ships a migration guide in `docs/`, and
its changeset links to it: 1.0's is [07 · Migrating to 1.0](07-migrating-to-1.0.md), with
`unicron-codemod icons` as its codemod.

## What core will decline

- A component that exists to avoid writing an app-extension token.
- A wrapper whose only job is a default prop value (a variant, not a component).
- Anything carrying an app's domain nouns in its name.
- Any change that makes a consumer's ratchet count go up.

## Why this shape

Federation without an arbiter becomes N sources of truth. Here the *contribution* is federated and the *ownership* is not: anyone proposes, core decides, the ratchet and the lint make the rules mechanical, and versioned releases let apps move at their own pace.
