// Field, Label and their parts: the label, the control, the help, the error, a group. View: ?view=field
import { Checkbox, Field, FieldContent, FieldDescription, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet, FieldTitle, Input, Switch } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function FieldView() {
  return (
    <Page>
      <Specimen label="Field // label, control, help; invalid">
        <Column>
          <Field>
            <FieldLabel htmlFor="view-field-server">Server</FieldLabel>
            <Input id="view-field-server" defaultValue="imap.fastmail.com" aria-describedby="view-field-server-help" />
            <FieldDescription id="view-field-server-help">Fastmail fills this in for you.</FieldDescription>
          </Field>
        </Column>
        <Column>
          <Field data-invalid>
            <FieldLabel htmlFor="view-field-port">Port</FieldLabel>
            <Input id="view-field-port" defaultValue="99999" aria-invalid aria-describedby="view-field-port-error" />
            <FieldError id="view-field-port-error">A port is 1 to 65535.</FieldError>
          </Field>
        </Column>
      </Specimen>

      <Specimen label="Field // beside a checkbox or a switch, the label is the choice">
        <Column>
          <FieldSet>
            <FieldLegend>Backups</FieldLegend>
            <FieldGroup>
              <Field orientation="horizontal">
                <Checkbox id="view-field-jewels" defaultChecked />
                <FieldLabel htmlFor="view-field-jewels">Include crown jewels</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Back up every night</FieldTitle>
                  <FieldDescription>At 02:00, while this Mac is awake.</FieldDescription>
                </FieldContent>
                <Switch aria-label="Back up every night" defaultChecked />
              </Field>
            </FieldGroup>
          </FieldSet>
        </Column>
        <Column>
          <FieldLabel htmlFor="view-field-card">
            <Field orientation="horizontal">
              <Checkbox id="view-field-card" defaultChecked />
              <FieldContent>
                <FieldTitle>Keep a copy on this Mac</FieldTitle>
                <FieldDescription>Opens without the network.</FieldDescription>
              </FieldContent>
            </Field>
          </FieldLabel>
        </Column>
      </Specimen>
    </Page>
  )
}
