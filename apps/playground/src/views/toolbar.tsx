// Toolbar (contract 5.1b #35): ghost icon buttons and separators, one Tab stop. View: ?view=toolbar
import { Page, Specimen, Toolbar, ToolbarButton, ToolbarGroup, ToolbarSeparator, ToolbarToggle } from "./_primitives"

export default function ToolbarView() {
  return (
    <Page>
      <Specimen label="Message actions // on the meta line (Vale M4)">
        <Toolbar aria-label="Message actions">
          <ToolbarButton label="Archive" icon="archive" shortcut="E" />
          <ToolbarToggle label="Snooze" icon="time" />
          <ToolbarToggle label="Star" icon="star" defaultPressed />
          <ToolbarButton label="Mark unread" icon="email--new" />
          <ToolbarSeparator />
          <ToolbarButton label="More" icon="overflow-menu--horizontal" />
        </Toolbar>
      </Specimen>

      <Specimen label="Format bar // toggles in groups, size default (40)">
        <Toolbar aria-label="Format" size="default">
          <ToolbarGroup>
            <ToolbarToggle label="Bold" icon="text--bold" shortcut="⌘B" defaultPressed />
            <ToolbarToggle label="Italic" icon="text--italic" shortcut="⌘I" />
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToolbarGroup>
            <ToolbarToggle label="List" icon="list--bulleted" />
            <ToolbarButton label="Link" icon="link" shortcut="⌘K" />
          </ToolbarGroup>
        </Toolbar>
      </Specimen>

      <Specimen label="Words // a toolbar of text actions; disabled">
        <Toolbar aria-label="Note actions">
          <ToolbarButton label="Pin" />
          <ToolbarButton label="Remind" />
          <ToolbarButton label="Share" disabled />
        </Toolbar>
      </Specimen>

      <Specimen label="Map // zoom, vertical">
        <Toolbar aria-label="Map" orientation="vertical">
          <ToolbarButton label="Zoom in" icon="zoom--in" />
          <ToolbarButton label="Zoom out" icon="zoom--out" />
          <ToolbarSeparator />
          <ToolbarButton label="Fit" icon="fit-to-screen" />
        </Toolbar>
      </Specimen>
    </Page>
  )
}
