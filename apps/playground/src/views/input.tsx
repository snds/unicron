// The Text Field box under the older names: Input, Textarea, InputGroup. View: ?view=input
import { Icon, Input, InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, Kbd, Label, Textarea } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function InputView() {
  return (
    <Page>
      <Specimen label="Input // rest, invalid, disabled, read-only">
        <Column>
          <div className="flex flex-col gap-1">
            <Label htmlFor="view-input-email">Email</Label>
            <Input id="view-input-email" defaultValue="mira.chen@fastmail.com" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="view-input-invalid">Email</Label>
            <Input id="view-input-invalid" defaultValue="mira.chen@" aria-invalid />
          </div>
        </Column>
        <Column>
          <div className="flex flex-col gap-1">
            <Label htmlFor="view-input-disabled">Server</Label>
            <Input id="view-input-disabled" defaultValue="imap.fastmail.com" disabled />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="view-input-readonly">Username</Label>
            <Input id="view-input-readonly" defaultValue="kestrel.04" readOnly />
          </div>
        </Column>
      </Specimen>

      <Specimen label="Textarea // starts at its rows">
        <Column wide>
          <div className="flex flex-col gap-1">
            <Label htmlFor="view-textarea">The fix as you'd have it</Label>
            <Textarea id="view-textarea" rows={4} defaultValue="Check the baseline drift before the nightly run, not after it." />
          </div>
        </Column>
      </Specimen>

      <Specimen label="InputGroup // add-ons inside the box, 8px apart">
        <Column>
          <InputGroup>
            <InputGroupAddon>
              <Icon name="search" />
            </InputGroupAddon>
            <InputGroupInput aria-label="Search mail" placeholder="Search mail" />
            <InputGroupAddon align="inline-end">
              <Kbd>/</Kbd>
            </InputGroupAddon>
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>$</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput aria-label="Stop each pass at" defaultValue="0.40" inputMode="decimal" />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>Set</InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Column>
        <Column wide>
          <InputGroup>
            <InputGroupTextarea aria-label="Reply" rows={3} placeholder="Reply to Mira" />
            <InputGroupAddon align="block-end">
              <InputGroupButton size="icon-sm" aria-label="Attach">
                <Icon name="attachment" />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </Column>
      </Specimen>
    </Page>
  )
}
