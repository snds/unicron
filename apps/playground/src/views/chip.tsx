// Chip: square on the 2px corner, 24 tall, a 24px remove; tone critical. View: ?view=chip
import { Chip, ChipAction, ChipRemove, Icon } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function ChipView() {
  return (
    <Page>
      <Specimen label="Variant // muted, secondary, outline">
        <Chip>Work</Chip>
        <Chip variant="secondary">trip</Chip>
        <Chip variant="outline">Mira Chen</Chip>
      </Specimen>
      <Specimen label="Parts // remove; a main action; both">
        <Chip variant="secondary">
          <span>Remind in 3 days</span>
          <ChipRemove label="Remove the reminder" />
        </Chip>
        <Chip variant="outline">
          <ChipAction>
            <Icon name="calendar" />
            <span>Design crit</span>
          </ChipAction>
        </Chip>
        <Chip variant="outline">
          <ChipAction>
            <Icon name="user--avatar" />
            <span>Theo Park</span>
          </ChipAction>
          <ChipRemove label="Remove Theo Park" />
        </Chip>
      </Specimen>
      <Specimen label="Tone // critical (an address that is not one)">
        <Chip variant="outline" tone="critical">
          <span>mira.chen@</span>
          <ChipRemove label="Remove mira.chen@" />
        </Chip>
        <Chip tone="critical">Over 25 MB</Chip>
      </Specimen>
    </Page>
  )
}
