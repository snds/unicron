# unicron

Sean Sands' shared design system. One set of tokens and one set of React primitives that
Mailbird, Synapse and Lockdown build on. Public, personal, Apache-2.0.

| Package | What it is |
|---|---|
| `@unicron/tokens` (`packages/tokens`) | Design tokens as DTCG JSON in three tiers (global → semantic → component), built to `dist/tokens.css` (CSS custom properties + a Tailwind v4 `@theme inline` map) and `dist/tokens.json` (flat). |
| `@unicron/ui` (`packages/ui`) | shadcn/ui primitives (style `base-nova`) on Base UI, with Material Symbols Rounded instead of Lucide. Owned source, compiled with `tsc`, no bundler. |
| `playground` (`apps/playground`) | Vite + React 19 page that renders every primitive in light and dark, side by side, with a theme toggle. It is also what `dsa` scans. |

Docs: [principles](docs/01-principles.md) · [tokens](docs/02-tokens.md) · [components](docs/03-components.md) ·
[patterns](docs/04-patterns.md) · [consuming](docs/05-consuming.md) · [DESIGN.md](DESIGN.md) (visual identity anchor).

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
pnpm build               # tokens → ui (tsc) → playground (vite), in dependency order
pnpm test                # token round-trip check (core semantic set present, no app roles)
pnpm dev                 # playground on http://localhost:5180
```

### Design-system analytics (dsa)

`@snds/dsa` is wired in as a git dev-dependency and configured by `dsa.config.json`
(`system.packages: ["@unicron/ui"]`, `localAliases: ["@/components/ui"]`).

```bash
pnpm ds:scan             # component inventory, adoption and correct-use metrics → .dsa/scan.json
pnpm ds:patterns         # pattern-candidate suggestion records → .dsa/patterns.json
pnpm ds:ratchet          # fail if correct-use violations grew vs .dsa/baseline.json
pnpm ds:ratchet --init   # write the first baseline (commit .dsa/baseline.json)
```

`.dsa/` is gitignored except `baseline.json`. CI runs `pnpm ds:ratchet` with `continue-on-error`
until a baseline exists. Until `snds/dsa` has a `main` branch, `pnpm install` cannot resolve the
dependency: install with it temporarily removed from `package.json` (and put it back), or wait for
the push. CI uses `--no-frozen-lockfile` for the same reason; switch back to `--frozen-lockfile`
once the lockfile carries `@snds/dsa`.

## Regenerating components

shadcn's CLI only ships Lucide, Tabler, Hugeicons, Phosphor and Remix icons, so the primitives
are produced by a local transform that reads a checkout of `shadcn-ui/ui`, inlines the `base-nova`
style classes and swaps every Lucide icon for a Material Symbol. The tool lives in Mailbird
(`tools/shadcn-material/transform.mjs` + `icon-map.json`, in
[snds/mailbird](https://github.com/snds/mailbird)); it is not copied here because it is still
Mailbird-shaped (it writes `@/…` alias imports). To add or refresh a primitive:

```bash
git clone --depth 1 https://github.com/shadcn-ui/ui /tmp/shadcn
git clone --depth 1 https://github.com/snds/mailbird /tmp/mailbird
node /tmp/mailbird/tools/shadcn-material/transform.mjs /tmp/shadcn /tmp/out calendar popover
# then move /tmp/out/*.tsx into packages/ui/src/components/ui and rewrite the aliases:
#   "@/lib/utils"            → "../../lib/utils"
#   "@/components/ui/<x>"    → "./<x>"
#   "@/components/icon"      → "../icon"
# and add an `export * from "./components/ui/<x>"` line to packages/ui/src/index.ts.
```

If a component uses a Lucide icon that is not mapped yet, the transform stops; add the mapping to
`icon-map.json`. Moving the transform into this repo (with a `--alias relative` flag) is the plan
once a second consumer needs it.

## Layout

```
packages/tokens/tokens/{global,semantic,component}.json   DTCG sources (the truth)
packages/tokens/scripts/build.mjs                         tiny builder (Style Dictionary planned)
packages/tokens/examples/app-extension.css                how an app adds its own roles
packages/ui/src/components/ui/*.tsx                       the primitives (owned source)
packages/ui/src/components/icon.tsx                       Material Symbols <Icon>
packages/ui/src/styles/index.css                          Tailwind entry: tokens + base layer
apps/playground/                                          every primitive, light + dark
docs/                                                     principles, tokens, components, patterns, consuming
dsa.config.json · .github/workflows/ci.yml                analytics wiring · CI
```

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE): portions derived from
[snds/mailbird](https://github.com/snds/mailbird) (Apache-2.0) and [shadcn/ui](https://ui.shadcn.com) (MIT).
