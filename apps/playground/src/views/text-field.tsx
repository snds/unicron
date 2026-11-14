// Text Field, as Figma draws it (32:48), and the states, slots and forms it leaves out. View: ?view=text-field
import { useState } from "react"
import { Button, Icon, TextField } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function TextFieldView() {
  const [length, setLength] = useState<number | null>(20)
  const [shown, setShown] = useState(false)
  return (
    <Page>
      <Specimen label="State // default, focus, error (Figma 32:48)">
        <Column>
          <TextField label="Email" defaultValue="mira.chen@fastmail.com" helper="Used for replies from this account." />
        </Column>
        <Column>
          <TextField label="Email" defaultValue="mira.chen@fastmail.com" helper="Used for replies from this account." autoFocus />
        </Column>
        <Column>
          <TextField label="Email" defaultValue="mira.chen@fastmail.com" helper="Used for replies from this account." invalid />
        </Column>
      </Specimen>

      <Specimen label="State // placeholder, error with its own words, read-only">
        <Column>
          <TextField label="Display name" placeholder="Mira Chen" helper="Shown on mail you send." />
        </Column>
        <Column>
          <TextField label="Email" defaultValue="mira.chen@" error="That isn't a full address." />
        </Column>
        <Column>
          <TextField label="Username" defaultValue="kestrel.04" readOnly helper="Set by your server." />
        </Column>
      </Specimen>

      <Specimen label="State // disabled, disabled with a reason (stays in the tab order)">
        <Column>
          <TextField label="Relay" defaultValue="relay.vale.dev" disabled />
        </Column>
        <Column>
          <TextField label="Relay" defaultValue="relay.vale.dev" disabled disabledReason="Turn on instant push to set a relay." />
        </Column>
      </Specimen>

      <Specimen label="Slots // leading icon, trailing button">
        <Column>
          <TextField
            label="Fastmail password"
            type={shown ? "text" : "password"}
            defaultValue="correct-horse-battery"
            leading={<Icon name="password" />}
            trailing={
              <Button variant="ghost" size="icon-sm" aria-label={shown ? "Hide password" : "Show password"} onClick={() => setShown((s) => !s)}>
                <Icon name={shown ? "view--off" : "view"} />
              </Button>
            }
            helper="An app password, not your sign-in password."
          />
        </Column>
        <Column>
          <TextField label="Booking link" defaultValue="cal.vale.dev/mira" leading={<Icon name="link" />} trailing={<Icon name="launch" />} />
        </Column>
      </Specimen>

      <Specimen label="Number // steppers, 8 to 128 (Lockdown's generator)">
        <Column>
          <TextField type="number" label="Length" min={8} max={128} value={length} onValueChange={setLength} helper="8 to 128 characters." />
        </Column>
        <Column>
          <TextField type="number" label="Words" min={3} max={20} defaultValue={5} />
        </Column>
      </Specimen>

      <Specimen label="Multiline // a message field starts at 6 lines and grows with its text">
        <Column wide>
          <TextField
            multiline
            label="Message"
            placeholder="Reply to Mira"
            defaultValue={"Hi Mira,\n\nThe cabin looks great. I'll bring the board games and pick up groceries for the first night."}
          />
        </Column>
        <Column>
          <TextField multiline minRows={3} label="Note" placeholder="What should the agent know?" />
        </Column>
      </Specimen>
    </Page>
  )
}
