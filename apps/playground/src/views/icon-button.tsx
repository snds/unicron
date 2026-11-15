// IconButton: an icon-only control with one label, used twice: as its accessible name and as its
// tooltip, so the two cannot drift apart. `shortcut` adds the key to the tooltip, `render` swaps
// the control underneath (a Toggle, a menu's trigger), `indicator` puts a mark at its corner and
// the words in its name. View: ?view=icon-button
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Icon, IconButton, Toggle } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function IconButtonView() {
  return (
    <Page>
      <Specimen label="Label // the name and the tooltip; a key; a longer line when the label undersells it">
        <IconButton icon="archive" label="Archive" />
        <IconButton icon="archive" label="Archive" shortcut="E" />
        <IconButton icon="time" label="Snooze" tooltip="Snooze until tomorrow, 08:00" />
      </Specimen>

      <Specimen label="Sizes // Button's icon sizes: 32, 40, 48">
        <IconButton icon="search" label="Search" size="icon-sm" />
        <IconButton icon="search" label="Search" />
        <IconButton icon="search" label="Search" size="icon-lg" />
      </Specimen>

      <Specimen label="Kinds // ghost by default; any Button kind">
        <IconButton icon="edit" label="Edit" />
        <IconButton icon="edit" label="Edit" variant="secondary" />
        <IconButton icon="trash-can" label="Delete" variant="ghost-destructive" />
        <IconButton icon="edit" label="Edit" disabled />
      </Specimen>

      <Specimen label="As a toggle // render swaps the control; pressed is inverted ink">
        <IconButton label="Pin" render={<Toggle size="sm" defaultPressed />}>
          <Icon name="pin--filled" />
        </IconButton>
        <IconButton label="Bold" shortcut="⌘B" render={<Toggle size="sm" />}>
          <Icon name="text--bold" />
        </IconButton>
      </Specimen>

      <Specimen label="As a menu's trigger // the menu's trigger renders it, so the tooltip and the menu share one button">
        <DropdownMenu>
          <DropdownMenuTrigger render={<IconButton icon="overflow-menu--horizontal" label="More actions for Steam" />} />
          <DropdownMenuContent width="auto" align="start">
            <DropdownMenuItem>Open item</DropdownMenuItem>
            <DropdownMenuItem>Move to another vault</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Specimen>

      <Specimen label="With a mark // a square at the corner; its words follow the label in the name">
        <IconButton icon="chat" label="Chats" indicator={{ kind: "unread", count: 3 }} />
        <IconButton icon="task" label="Tasks" indicator={{ kind: "attention", count: 1 }} />
      </Specimen>
    </Page>
  )
}
