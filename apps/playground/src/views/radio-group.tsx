// RadioGroup and RadioRow (contract 5.1b #23). View: ?view=radio-group
import { Field, FieldLabel, RadioGroup, RadioGroupItem, RadioRow } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function RadioGroupView() {
  return (
    <Page>
      <Specimen label="RadioRow // a choice that needs a sentence (Vale, Remote images)">
        <Column wide>
          <RadioGroup aria-label="Remote images" defaultValue="ask">
            <RadioRow value="ask" label="Ask" description="Blocked until you load them, message by message. Images can tell a sender you opened their mail, and when." />
            <RadioRow value="contacts" label="From contacts" description="Loaded for people in your contacts; asked for everyone else." />
            <RadioRow value="always" label="Always" description="Every message loads its images. Senders can see when you open their mail." />
            <RadioRow value="relay" label="Through your relay" description="Needs a relay. Set one in Server." disabled />
          </RadioGroup>
        </Column>
      </Specimen>
      <Specimen label="RadioGroup // square radios beside their labels (Lockdown, Keep which?)">
        <Column>
          <RadioGroup aria-label="Keep which?" defaultValue="mine">
            <Field orientation="horizontal">
              <RadioGroupItem value="mine" id="view-radio-mine" />
              <FieldLabel htmlFor="view-radio-mine">Mine (edited 09:14)</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="disk" id="view-radio-disk" />
              <FieldLabel htmlFor="view-radio-disk">The disk's (edited 08:02)</FieldLabel>
            </Field>
            <Field orientation="horizontal">
              <RadioGroupItem value="both" id="view-radio-both" aria-invalid />
              <FieldLabel htmlFor="view-radio-both">Both, as two items</FieldLabel>
            </Field>
          </RadioGroup>
        </Column>
      </Specimen>
    </Page>
  )
}
