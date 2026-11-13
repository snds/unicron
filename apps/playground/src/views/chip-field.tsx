// ChipField (contract 5.1b #24): the Text Field box holding chips. View: ?view=chip-field
import { ChipField, Column, Page, Specimen } from "./_primitives"

const ADDRESS = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function ChipFieldView() {
  return (
    <Page>
      <Specimen label="ChipField // values, a helper; one wrong value">
        <Column>
          <ChipField label="Labels" defaultValue={["trip", "family", "cabin"]} placeholder="Add a label" helper="Enter or a comma after each." />
        </Column>
        <Column>
          <ChipField
            label="To"
            defaultValue={["mira.chen@fastmail.com", "theo@", "sam.beck@studio.dev"]}
            isInvalid={(value) => !ADDRESS.test(value)}
            error="Fix or remove the address in red."
          />
        </Column>
      </Specimen>
      <Specimen label="ChipField // empty with focus; disabled with a reason">
        <Column>
          <ChipField label="From" placeholder="An address, or a domain with @ in front" helper="Mail from these lands in this split." autoFocus />
        </Column>
        <Column>
          <ChipField label="Tags" defaultValue={["shared"]} disabled disabledReason="Tags on a shared note are the owner's." />
        </Column>
      </Specimen>
    </Page>
  )
}
