# Component knobs, one file per component area

Tier 3. The build merges every `*.json` file in this folder with `../component.json`, and emits
each token as `--c-<path>`: `{ "tab-bar": { "gap": … } }` becomes `--c-tab-bar-gap`.

- One file per area: `primitives.json`, `overlays.json`, `security.json`, `shell.json`,
  `data.json`, `chat.json`. `../component.json` keeps the cross-cutting knobs (the scrim
  opacities) and the ones from before 1.0.
- A colour is a `{reference}` to a role, or a `color-mix()` of references:
  `"{primary-soft}"`, `"color-mix(in oklab, {text-body} 45%, transparent)"`. Never a raw colour,
  and never a tier 1 value: `{needs-you-fill}` is the role, `{needs-you.fill}` is the raw value.
- A size may be a literal (`"2.5rem"`) or a reference (`"{size-control}"`).
- A knob that times a motion ends in `-duration` and is a reference to a motion role
  (`"{motion-base}"`).
- A file here may re-declare a knob that `../component.json` holds: the area that restyles a
  component owns its knobs from then on, and the build prints a note. Two files here may not
  declare the same knob.

```json
{
  "tab-bar": {
    "$description": "TabBar: the icon-only bar in the phone's bottom row.",
    "gap": { "$type": "dimension", "$value": "0.25rem" },
    "active": { "$type": "color", "$value": "{primary-soft}", "$description": "The tile behind the current tab." }
  }
}
```

Run `pnpm tokens:build && pnpm lint:tokens` after a change. Rules and reasons:
[docs/02-tokens.md](../../../../docs/02-tokens.md).
