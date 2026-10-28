# unicron

Sean Sands' shared design system. One set of tokens and one set of React primitives that
Mailbird, Synapse and Lockdown build on. Public, personal, Apache-2.0.

> **A personal project.** Unicron is public so that Sean's apps can install it without logging in.
> It isn't a community project: pull requests from outside contributors aren't accepted, and issues
> may go unanswered. You're welcome to read it, fork it and use it under Apache-2.0. See
> [CONTRIBUTING.md](CONTRIBUTING.md).

| Package | What it is |
|---|---|
| `@unicron/tokens` (`packages/tokens`) | Design tokens as DTCG JSON in three tiers (global → semantic → component), built to `dist/tokens.css` (CSS custom properties + a Tailwind v4 `@theme inline` map) and `dist/tokens.json` (flat). |
| `@unicron/ui` (`packages/ui`) | shadcn/ui primitives (style `base-nova`) on Base UI, with Material Symbols Rounded instead of Lucide. Owned source, compiled with `tsc`, no bundler. |
| `playground` (`apps/playground`) | Vite + React 19 page that renders every primitive in light and dark, side by side, with a theme toggle. It is also what `dsa` scans. |

Docs: [principles](docs/01-principles.md) · [tokens](docs/02-tokens.md) · [components](docs/03-components.md) ·
[patterns](docs/04-patterns.md) · [consuming](docs/05-consuming.md) · [contributing and releasing](docs/06-contributing.md) · [DESIGN.md](DESIGN.md) (visual identity anchor).

## Stack

React 19 · Vite 8 · Tailwind v4 (`@tailwindcss/vite`) · shadcn/ui `base-nova` on `@base-ui/react` ·
`class-variance-authority` · `clsx` · `tailwind-merge` · Material Symbols Rounded · `oxlint` ·
TypeScript ~5.9 · pnpm 10 · Node 22 · ESM throughout.

## Develop

```bash
pnpm install
pnpm tokens:build        # DTCG JSON → dist/tokens.css + dist/tokens.json
pnpm typecheck
pnpm lint                # oxlint
pnpm lint:tokens         # tiers 2/3 alias lower tiers; no colour literals in packages/ui/src
pnpm build               # tokens → ui (tsc + styles copy) → playground (vite), in dependency order
pnpm test                # token round-trip check (core semantic set present, no app roles)
pnpm dev                 # builds @unicron/ui (+tokens), then the playground on http://localhost:5180
```

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

`.dsa/` is gitignored except `baseline.json`, which is committed; it freezes today's correct-use
counts (13 `className` overrides on DS components, 0 style overrides, 0 spread props, 0 look-alikes,
0 raw HTML controls such as a plain `<button>`) and CI fails when any count grows. Lower it with `pnpm ds:ratchet --update`
as files are cleaned up. Pass flags straight through (`pnpm ds:patterns --all`), without a `--`
separator: pnpm 10 forwards `--` literally and dsa then reads it as the directory.

## Regenerating components

shadcn's CLI only ships Lucide, Tabler, Hugeicons, Phosphor and Remix icons, so the primitives
are produced by a local transform, [`tools/shadcn-material`](tools/shadcn-material/README.md). It
reads a checkout of `shadcn-ui/ui`, inlines the `base-nova` style classes, swaps every Lucide icon
for a Material Symbol, and writes the package-relative imports `@unicron/ui` uses:

```bash
git clone --depth 1 https://github.com/shadcn-ui/ui /tmp/shadcn
pnpm regen /tmp/shadcn /tmp/out calendar popover
# review, move into packages/ui/src/components/ui, and export from packages/ui/src/index.ts
```

If a component uses a Lucide icon that is not mapped yet, the transform stops; add the mapping to
`tools/shadcn-material/icon-map.json`. The tool's README covers regenerating over an owned file.

## Layout

```
packages/tokens/tokens/{global,semantic,component}.json   DTCG sources (the truth)
packages/tokens/scripts/build.mjs                         tiny builder (Style Dictionary planned)
packages/tokens/scripts/lint.mjs                          token lint (pnpm lint:tokens)
packages/tokens/examples/app-extension.css                how an app adds its own roles
packages/ui/src/components/ui/*.tsx                       the primitives (owned source)
packages/ui/src/components/icon.tsx                       Material Symbols <Icon>
packages/ui/src/styles/index.css                          Tailwind entry: tokens + base layer
apps/playground/                                          every primitive, light + dark
docs/                                                     principles, tokens, components, patterns, consuming
dsa.config.json · .github/workflows/ci.yml                analytics wiring · CI
.changeset/ · .github/workflows/release.yml               changesets · Version Packages PR → tags, GitHub Releases, npm
.github/CODEOWNERS · pull_request_template.md · ISSUE_TEMPLATE/promotion.md   governance (docs/06-contributing.md)
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE): portions derived from
[snds/mailbird](https://github.com/snds/mailbird) (Apache-2.0) and [shadcn/ui](https://ui.shadcn.com) (MIT).
