// Initial Tile (Figma 32:121) and the square Avatar. View: ?view=initial-tile
import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, InitialTile } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function InitialTileView() {
  return (
    <Page>
      <Specimen label="Initial Tile // S 24, M 40, L 64">
        <div className="flex items-end gap-4">
          <InitialTile initials="MC" size="s" />
          <InitialTile initials="MC" />
          <InitialTile initials="MC" size="l" />
        </div>
      </Specimen>
      <Specimen label="Initial Tile // named on its own; in a row of people">
        <InitialTile initials="TP" name="Theo Park" />
        <div className="flex items-center gap-1">
          <InitialTile initials="MC" size="s" />
          <InitialTile initials="TP" size="s" />
          <InitialTile initials="SB" size="s" />
        </div>
      </Specimen>
      <Specimen label="Avatar // square on the 2px corner: sm 24, default 32, lg 40; a badge in the ink, or live for presence">
        <div className="flex items-end gap-4">
          <Avatar size="sm">
            <AvatarFallback>MC</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>MC</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>MC</AvatarFallback>
            <AvatarBadge />
          </Avatar>
          <Avatar size="lg">
            <AvatarFallback>TP</AvatarFallback>
            <AvatarBadge tone="live" />
          </Avatar>
          <AvatarGroup>
            <Avatar>
              <AvatarFallback>MC</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>TP</AvatarFallback>
            </Avatar>
            <AvatarGroupCount>+3</AvatarGroupCount>
          </AvatarGroup>
        </div>
      </Specimen>
    </Page>
  )
}
