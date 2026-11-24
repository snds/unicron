// The two theme axes, and a split view (docs/02-tokens.md → Two axes):
//   theme   Unicron (no data-theme: the core's own default) | warpcore | vale | lockdown | synapse | fontface
//           The four apps' themes are the apps' own; the playground loads its copies of them
//           (./app-themes/, Unicron 1) so they can be shown here.
//   ground  graphite (dark) | stone (light)        <html class="dark"> or class="light"
//   split   both grounds side by side (Unicron 113)
// So Figma's `vale / stone` is ?theme=vale&ground=stone. The address is the state (./address.ts);
// ./use-playground-theme.ts applies it to the document, and this file draws the switcher.
import { Toggle, ToggleGroup, ToggleGroupItem } from "@unicron/ui"

import { APP_THEMES, GROUNDS, THEME_NAMES, setAddress, type AppTheme, type Ground } from "./address"
import type { PlaygroundTheme } from "./use-playground-theme"

const THEMES = ["default", ...APP_THEMES] as const
const GROUND_NAMES: Record<Ground, string> = { graphite: "Graphite", stone: "Stone" }

/** Two groups of pressed buttons, which theme and which ground (one of each is always on), and the split toggle. */
export function ThemeSwitcher({ theme, ground, split }: PlaygroundTheme) {
  return (
    <>
      <ToggleGroup
        aria-label="Theme"
        data-switch="theme"
        // Six themes since Fontface: on a phone the group scrolls inside itself, never the page.
        className="min-w-0 max-w-full overflow-x-auto"
        variant="outline"
        size="sm"
        spacing={0}
        value={[theme ?? "default"]}
        // Pressing the one that is on would turn it off; a theme is never off, so that is ignored.
        onValueChange={([next]) => {
          if (next) setAddress({ theme: next === "default" ? null : (next as AppTheme) })
        }}
      >
        {THEMES.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {THEME_NAMES[name]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        aria-label="Ground"
        data-switch="ground"
        variant="outline"
        size="sm"
        spacing={0}
        value={split ? [] : [ground]}
        onValueChange={([next]) => {
          if (next) setAddress({ ground: next as Ground, split: false })
        }}
      >
        {GROUNDS.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {GROUND_NAMES[name]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Toggle
        data-switch="split"
        variant="outline"
        size="sm"
        pressed={split}
        onPressedChange={(pressed) => setAddress({ split: pressed })}
      >
        Both grounds
      </Toggle>
    </>
  )
}
