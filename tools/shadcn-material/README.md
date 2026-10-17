# shadcn-material

The transform that produces unicron's primitives. shadcn's CLI ships only Lucide, Tabler, Hugeicons, Phosphor, and Remix icons, and it fetches pre-built code from ui.shadcn.com. This script does the same job locally, from a checkout of [shadcn-ui/ui](https://github.com/shadcn-ui/ui), so the output is reproducible and reviewable:

1. It reads the Base UI base components (`apps/v4/registry/bases/base/ui/*.tsx`).
2. It inlines the style file's classes (`styles/style-nova.css` by default).
3. It swaps every `<IconPlaceholder lucide="…">` for `<Icon name="…">`, a Material Symbol, using `icon-map.json`.
4. It rewrites the imports. `--alias-mode package` (the default) writes the relative imports `@unicron/ui` uses. `--alias-mode app` writes an app's `@/…` aliases.
5. It adds every Material Symbol it emitted to `.material-symbols.json` in the output folder, the seed for subsetting the icon font.

## Add or refresh a primitive

```bash
git clone --depth 1 https://github.com/shadcn-ui/ui /tmp/shadcn
pnpm regen /tmp/shadcn /tmp/out popover calendar      # writes /tmp/out/popover.tsx, calendar.tsx
```

Then:

1. **Review** the diff against `packages/ui/src/components/ui/`. To write straight into the package, pass that folder as the output.
2. **Export it:** add `export * from "./components/ui/<name>"` to `packages/ui/src/index.ts`, and a row to `docs/03-components.md`.
3. **Keep the header.** The two generated lines stay first. A primitive that came through the promotion loop adds its `Promoted from:` line after them (`docs/06-contributing.md` → Provenance).

`SHADCN_STYLE=vega pnpm regen …` picks another style. The transform stops if a component uses a Lucide icon that isn't mapped yet; add the mapping to `icon-map.json`.

## Regenerating over an owned file

The primitives are owned source, so many carry edits on top of the generated code: unicron's variants, `AdaptiveSheetContent`, `DialogActions`, and the `Promoted from:` lines. Regenerating over them would drop those edits. Generate to a scratch folder and carry upstream changes over by hand.

## Overrides that survive a regen

`overrides.json` holds the edits the transform applies after inlining the style, keyed by output file: a list of exact substring replacements and a `why`, which the transform writes as a third header line of the file. Put a change to a generated primitive there when it should survive `pnpm regen` (the pressed state of `toggle.tsx` is one). The transform stops if a `from` string is no longer in the upstream source, so upstream drift shows up instead of silently dropping the edit.

## Check that it still reproduces the package

On an unedited primitive (and one whose only edits are in `overrides.json`), the output matches the committed file byte for byte. Today that's `button` (on main), `kbd`, `separator`, `toggle`, `toggle-group`, and `tooltip` (`dialog` left the list with `DialogActions` and the `beforeContent` slot):

```bash
pnpm regen /tmp/shadcn /tmp/check kbd separator tooltip && diff -r /tmp/check packages/ui/src/components/ui --include='*.tsx' -q | grep -v 'Only in packages'
```

It was first written in [snds/mailbird](https://github.com/snds/mailbird) (`tools/shadcn-material`) and is maintained here now.
