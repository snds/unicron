// DropdownMenu, solid: the quick-create menu over the menu scrim (Vale and Lockdown States 03),
// and a row menu with keys, a submenu, checks and choices. View: ?view=dropdown-menu
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  FloatButton,
  Icon,
} from "@unicron/ui"

import { Specimen, Stage } from "./_stage"

export default function DropdownMenuView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-6">
        <Stage label="Quick create // long press on create, over the menu scrim (Vale States 03)" width={390} height={844} app="vale">
          {(container) => (
            <div className="absolute right-4 bottom-8 flex flex-col items-end">
              <DropdownMenu open modal={false}>
                <DropdownMenuTrigger render={<FloatButton label="Close quick create" icon="close" kind="primary" size="l" />} />
                <DropdownMenuContent container={container} width="auto" side="top" align="end" sideOffset={8} scrim aria-label="Create">
                  <DropdownMenuLabel>Create // long press</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Icon name="edit" />
                    New message
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="calendar" />
                    New event
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="user--multiple" />
                    New contact
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="notebook" />
                    New note
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </Stage>

        <Specimen label="Row menu // keys in a Kbd, a submenu, a destructive row, checks and one-of-a-few">
          <div className="h-[640px] w-[640px] max-w-full">
            <DropdownMenu open modal={false}>
              <DropdownMenuTrigger render={<Button variant="secondary" />}>Steam</DropdownMenuTrigger>
              <DropdownMenuContent width="auto" aria-label="Steam">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Steam // personal vault</DropdownMenuLabel>
                  <DropdownMenuItem>
                    <Icon name="copy" />
                    Copy password
                    <DropdownMenuShortcut>⌘C</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="time" />
                    Copy one-time code
                    <DropdownMenuShortcut>⌘⇧C</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Icon name="launch" />
                    Open store.steampowered.com
                  </DropdownMenuItem>
                  <DropdownMenuSub open>
                    <DropdownMenuSubTrigger>
                      <Icon name="folder" />
                      Move to vault
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>
                        <Icon name="user--avatar" />
                        Personal
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Icon name="user--multiple" />
                        Family
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuItem disabled>
                    <Icon name="share" />
                    Share
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked>Favorite</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value="kind">
                  <DropdownMenuLabel>Group by</DropdownMenuLabel>
                  <DropdownMenuRadioItem value="kind">Kind</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="letter">Letter</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <Icon name="trash-can" />
                  Move to Recently deleted
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Specimen>
      </div>
    </div>
  )
}
