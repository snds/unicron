// Command: the palette in the 2026-11 look (the search field as a Text Field box, overline group
// labels, menu rows, keys in a Kbd), inline and as the ⌘K dialog. View: ?view=command
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandItemAction,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Icon,
} from "@unicron/ui"

import { Specimen, Stage } from "./_stage"

function Palette() {
  return (
    <>
      <CommandInput placeholder="Search Lockdown" />
      <CommandList>
        <CommandEmpty>Nothing matches. Search everything instead.</CommandEmpty>
        <CommandGroup heading="Go to">
          <CommandItem value="Health">
            <Icon name="checkmark--outline" />
            Health
          </CommandItem>
          <CommandItem value="Settings">
            <Icon name="settings" />
            Settings
            <CommandShortcut>⌘,</CommandShortcut>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Items // 03">
          <CommandItem value="Steam" keywords={["store.steampowered.com"]}>
            <Icon name="password" />
            Steam
            <CommandItemAction label="Copy password" icon="copy" onAction={() => {}} />
          </CommandItem>
          <CommandItem value="Spotify" keywords={["spotify.com"]}>
            <Icon name="password" />
            Spotify
            <CommandItemAction label="Copy password" icon="copy" onAction={() => {}} />
          </CommandItem>
          <CommandItem value="Stripe" keywords={["dashboard.stripe.com"]}>
            <Icon name="password" />
            Stripe
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem value="Lock">
            <Icon name="locked" />
            Lock
            <CommandShortcut>⌘L</CommandShortcut>
          </CommandItem>
          <CommandItem value="Search everything for st">
            <Icon name="search" />
            Search everything for “st”
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </>
  )
}

export default function CommandView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <Specimen label="Inline // quick access in its own window">
        <div className="rule-box w-[560px] max-w-full">
          <Command label="Quick access">
            <Palette />
          </Command>
        </div>
      </Specimen>

      <Stage label="⌘K // the command menu, form size, a third of the way down" width={1392} height={720} app="lockdown">
        {(container) => (
          <CommandDialog open modal={false} container={container} title="Command menu" description="Do or go by name">
            <Command label="Command menu">
              <Palette />
            </Command>
          </CommandDialog>
        )}
      </Stage>
    </div>
  )
}
