// The two theme axes, as Figma's eight modes split in code (docs/02-tokens.md → Theme model):
//   app     warpcore | vale | lockdown | synapse   <html data-theme="…">
//   ground  graphite (dark) | stone (light)        <html class="dark"> or class="light"
// So Figma's `vale / stone` is ?theme=vale&ground=stone. The address is the state (./address.ts);
// ./use-playground-theme.ts applies it to the document, and this file draws the switcher.
import { ToggleGroup, ToggleGroupItem } from "@unicron/ui"

import { APP_THEMES, GROUNDS, setAddress, type AppTheme, type Ground } from "./address"
import type { PlaygroundTheme } from "./use-playground-theme"

const APP_NAMES: Record<AppTheme, string> = {
  warpcore: "Warpcore",
  vale: "Vale",
  lockdown: "Lockdown",
  synapse: "Synapse",
}
const GROUND_NAMES: Record<Ground, string> = { graphite: "Graphite", stone: "Stone" }

/** Two groups of pressed buttons: which app, which ground. One of each is always on. */
export function ThemeSwitcher({ theme, ground }: PlaygroundTheme) {
  return (
    <>
      <ToggleGroup
        aria-label="App"
        data-switch="theme"
        variant="outline"
        size="sm"
        spacing={0}
        value={[theme]}
        // Pressing the one that is on would turn it off; a theme is never off, so that is ignored.
        onValueChange={([next]) => {
          if (next) setAddress({ theme: next as AppTheme })
        }}
      >
        {APP_THEMES.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {APP_NAMES[name]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <ToggleGroup
        aria-label="Ground"
        data-switch="ground"
        variant="outline"
        size="sm"
        spacing={0}
        value={[ground]}
        onValueChange={([next]) => {
          if (next) setAddress({ ground: next as Ground })
        }}
      >
        {GROUNDS.map((name) => (
          <ToggleGroupItem key={name} value={name}>
            {GROUND_NAMES[name]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </>
  )
}
