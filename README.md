# unicron

Sean Sands' shared design system. One set of tokens and one set of React components that four
apps build on: Vale, Warpcore, Lockdown and Synapse. Public, personal, Apache-2.0.

> **A personal project.** Unicron is public so that Sean's apps can install it without logging in.
> It isn't a community project: pull requests from outside contributors aren't accepted, and issues
> may go unanswered. You're welcome to read it, fork it and use it under Apache-2.0. See
> [CONTRIBUTING.md](CONTRIBUTING.md).

| Package | What it is |
|---|---|
| `@unicron/tokens` (`packages/tokens`) | Design tokens as DTCG JSON in three tiers (global → semantic → component), for four app themes (`warpcore`, `vale`, `lockdown`, `synapse`) on two grounds (graphite is dark, stone is light), with 23 type roles. Built to `dist/tokens.css` (CSS custom properties and a Tailwind v4 `@theme inline` map), `dist/plain.css` (the same, for a page with no Tailwind) and `dist/tokens.json` (flat). |
| `@unicron/ui` (`packages/ui`) | The React components: the app frame and its chrome, rows, forms, overlays, chat and security parts. Base UI for behaviour, IBM Carbon icons as inline SVG, Tailwind v4 classes bound to the tokens. The small primitives began as shadcn/ui (`base-nova`); all of it is owned source, compiled with `tsc`, no bundler. Ships two tools: `unicron-codemod` (moves an app's icon names to Carbon) and `unicron-sources` (writes a smaller stylesheet entry). |
| `playground` (`apps/playground`) | Vite + React 19 page: one view per file in `src/views`, with a switcher for the app theme and the ground, `scripts/shots.mjs` for screenshots, and the browser checks in `tests/`. It is also what `dsa` scans. |

Docs: [principles](docs/01-principles.md) · [tokens](docs/02-tokens.md) · [components](docs/03-components.md) ·
[patterns](docs/04-patterns.md) · [consuming](docs/05-consuming.md) · [contributing and releasing](docs/06-contributing.md) ·
[migrating to 1.0](docs/07-migrating-to-1.0.md) · [DESIGN.md](DESIGN.md) (the look).

## Stack

React 19 · Vite 8 · Tailwind v4 (`@tailwindcss/vite`) · `@base-ui/react` (shadcn/ui `base-nova` as the
starting anatomy) · `class-variance-authority` · `clsx` · `tailwind-merge` · Geist and Geist Mono ·
IBM Carbon icons · `oxlint` · TypeScript ~5.9 · pnpm 10 · Node 22 · ESM throughout.

## Develop

```bash
pnpm install
pnpm tokens:build        # DTCG JSON → dist/tokens.css, dist/plain.css, dist/tokens.json
pnpm typecheck
pnpm lint                # oxlint
pnpm lint:tokens         # roles and knobs alias lower tiers; no colour, motion or px literals in packages/ui/src
pnpm build               # tokens → ui (tsc + styles copy) → playground (vite), in dependency order
pnpm test                # tokens: round trip, Figma parity, contrast in all 8 modes. ui: icon data, the codemod, unit tests
pnpm --filter playground test:motion   # the browser checks (run pnpm build first; needs `playwright install chromium` once)
pnpm dev                 # builds @unicron/ui (+tokens), then the playground on http://localhost:5180
```

The browser checks cover the motion contracts, every view mounting, the foundations, the shells
and the rules of the look (the 4px grid, the type roles, the spacing scale, no blur). Set
`PW_PORT` to a port that is free: the config reuses a server already on its port, and would then
test another build ([contributing](docs/06-contributing.md#contracts-not-goodwill)).

### Release

```bash
pnpm changeset           # one per PR that touches packages/*: bump type + one actionable line
pnpm run version         # changeset version — normally done by the Version Packages PR
pnpm pack:packages       # tarballs into artifacts/ (gitignored) for a consumer smoke test
pnpm release             # pnpm build && changeset publish — the release workflow runs this
```

Flow and the npm/GitHub-Release split: [docs/06-contributing.md → Releasing](docs/06-contributing.md#releasing).
Consuming either way: [docs/05-consuming.md](docs/05-consuming.md).

### Design-system analytics (dsa)

`@snds/dsa` is wired in as a git dev-dependency and configured by `dsa.config.json`
(`system.packages: ["@unicron/ui"]`, `localAliases: ["@/components/ui"]`).

```bash
pnpm ds:scan             # component inventory, adoption and correct-use metrics → .dsa/scan.json
pnpm ds:patterns         # pattern-candidate suggestion records → .dsa/patterns.json
pnpm ds:ratchet          # fail if correct-use violations grew vs .dsa/baseline.json
pnpm ds:ratchet --init   # write the first baseline (commit .dsa/baseline.json)
```

`.dsa/` is gitignored except `baseline.json`, which is committed. It freezes the correct-use
counts: `className` overrides on system components, style overrides, spread props, look-alikes,
and raw HTML controls such as a plain `<button>`. CI fails when any count grows. Lower it with
`pnpm ds:ratchet --update` as files are cleaned up. Pass flags straight through (`pnpm ds:patterns --all`), without a `--`
separator: pnpm 10 forwards `--` literally and dsa then reads it as the directory.

## Regenerating components

shadcn's CLI only ships Lucide, Tabler, Hugeicons, Phosphor and Remix icons, so the primitives
are produced by a local transform, [`tools/shadcn-material`](tools/shadcn-material/README.md). It
reads a checkout of `shadcn-ui/ui`, inlines the `base-nova` style classes, swaps every Lucide icon
for a Carbon icon name, and writes the package-relative imports `@unicron/ui` uses:

```bash
git clone --depth 1 https://github.com/shadcn-ui/ui /tmp/shadcn
pnpm regen /tmp/shadcn /tmp/out calendar popover
# review, move into packages/ui/src/components/ui, and export from packages/ui/src/index.ts
```

If a component uses a Lucide icon that is not mapped yet, the transform stops; add the mapping to
`tools/shadcn-material/icon-map.json`. The tool's README covers regenerating over an owned file.

A file fresh from the transform is in shadcn's look, with raw sizes, type classes and durations.
Token lint fails on it until it is restyled to the direction: type roles, rules instead of
borders, the 2px corner, the motion roles ([what a component needs](docs/06-contributing.md#what-a-new-or-changed-component-needs)).

## Layout

```
packages/tokens/tokens/{global,semantic,component}.json   DTCG sources (the truth)
packages/tokens/tokens/themes/<app>.json                  the 28 theme slots of one app
packages/tokens/tokens/type.json                          the 23 type roles
packages/tokens/tokens/component/<area>.json              component knobs, one file per area
packages/tokens/tokens/figma/theme-2026-11.json           a snapshot of Figma, for the parity check
packages/tokens/scripts/{build,check,figma-parity,contrast,lint}.mjs   the builder and the gates
packages/tokens/scripts/recipes/<area>.mjs                contrast recipes, one file per area
packages/tokens/examples/app-extension.css                how an app adds its own roles
packages/ui/src/components/ui/*.tsx                       the components (owned source)
packages/ui/src/components/security/*.tsx                 the security components (specs in docs/specs/security)
packages/ui/src/components/icon.tsx                       Carbon <Icon> (curated set: src/icons/names.json)
packages/ui/src/styles/index.css                          Tailwind entry: tokens, type utilities, rules, base layer
packages/ui/codemod/                                      unicron-codemod (Material → Carbon icon names)
packages/ui/bin/ · packages/ui/vendor/                    unicron-sources · sonner without its style tag
apps/playground/src/views/                                one view per file; 4 app themes × 2 grounds
apps/playground/tests/                                    the browser checks
docs/                                                     principles, tokens, components, patterns, consuming, contributing, migrating
dsa.config.json · .github/workflows/ci.yml                analytics wiring · CI
.changeset/ · .github/workflows/release.yml               changesets · Version Packages PR → tags, GitHub Releases, npm
.github/CODEOWNERS · pull_request_template.md · ISSUE_TEMPLATE/promotion.md   governance (docs/06-contributing.md)
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Portions are derived from
[snds/mailbird](https://github.com/snds/mailbird) (Apache-2.0) and [shadcn/ui](https://ui.shadcn.com) (MIT).
The icon drawings are [IBM Carbon](https://github.com/carbon-design-system/carbon)'s (Apache-2.0).
The toast module is a copy of [sonner](https://github.com/emilkowalski/sonner) (MIT). The fonts,
Geist and Geist Mono (SIL Open Font License 1.1), are installed as packages and are not
redistributed here.
