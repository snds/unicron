// Toggle and ToggleGroup: pressed is inverted ink, as an active Filter Chip, never the identity colour. View: ?view=toggle
import { Icon, Toggle, ToggleGroup, ToggleGroupItem } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function ToggleView() {
  return (
    <Page>
      <Specimen label="Toggle // off, on; sizes 32, 40, 48">
        <Toggle size="sm" aria-label="Bold">
          <Icon name="text--bold" />
        </Toggle>
        <Toggle size="sm" defaultPressed aria-label="Italic">
          <Icon name="text--italic" />
        </Toggle>
        <Toggle aria-label="Pin">
          <Icon name="pin" />
        </Toggle>
        <Toggle defaultPressed aria-label="Star">
          <Icon name="star" />
        </Toggle>
        <Toggle size="lg" defaultPressed aria-label="Flag">
          <Icon name="flag" />
        </Toggle>
        <Toggle defaultPressed>Unlinked notes</Toggle>
        <Toggle disabled>Unlinked notes</Toggle>
      </Specimen>

      <Specimen label="Toggle // outline">
        <Toggle variant="outline" aria-label="Filter">
          <Icon name="filter" />
        </Toggle>
        <Toggle variant="outline" defaultPressed aria-label="Filter">
          <Icon name="filter" />
        </Toggle>
      </Specimen>

      <Specimen label="ToggleGroup // apart (2px), joined outline (one edge between)">
        <ToggleGroup defaultValue={["pen"]} aria-label="Sketch tools">
          <ToggleGroupItem value="pen">Pen</ToggleGroupItem>
          <ToggleGroupItem value="marker">Marker</ToggleGroupItem>
          <ToggleGroupItem value="eraser">Eraser</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup spacing={0} variant="outline" defaultValue={["system"]} aria-label="Theme">
          <ToggleGroupItem value="system">System</ToggleGroupItem>
          <ToggleGroupItem value="stone">Stone</ToggleGroupItem>
          <ToggleGroupItem value="graphite">Graphite</ToggleGroupItem>
        </ToggleGroup>
        <ToggleGroup spacing={0} variant="outline" size="sm" multiple defaultValue={["bold"]} aria-label="Format">
          <ToggleGroupItem value="bold" aria-label="Bold">
            <Icon name="text--bold" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Italic">
            <Icon name="text--italic" />
          </ToggleGroupItem>
          <ToggleGroupItem value="list" aria-label="List">
            <Icon name="list--bulleted" />
          </ToggleGroupItem>
        </ToggleGroup>
      </Specimen>
    </Page>
  )
}
