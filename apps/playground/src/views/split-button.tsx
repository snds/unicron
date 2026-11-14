// SplitButton (contract 5.1b #36): a primary pair that counts as one primary. View: ?view=split-button
import { DropdownMenuItem, SplitButton } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

const LATER = (
  <>
    <DropdownMenuItem>Tomorrow 08:00</DropdownMenuItem>
    <DropdownMenuItem>Monday 08:00</DropdownMenuItem>
    <DropdownMenuItem>Pick date and time…</DropdownMenuItem>
  </>
)

export default function SplitButtonView() {
  return (
    <Page>
      <Specimen label="Send // M 40, S 32, L 48">
        <SplitButton menuLabel="Send later" menu={LATER}>
          Send
        </SplitButton>
        <SplitButton size="sm" menuLabel="Send later" menu={LATER}>
          Send
        </SplitButton>
        <SplitButton size="lg" menuLabel="Send later" menu={LATER}>
          Send
        </SplitButton>
      </Specimen>
      <Specimen label="State // sending, scheduled, disabled with a reason">
        <SplitButton loading menuLabel="Send later" menu={LATER}>
          Send
        </SplitButton>
        <SplitButton menuLabel="Change the send time" menu={LATER}>
          Schedule
        </SplitButton>
        <SplitButton disabled disabledReason="Fix or remove the address in red." menuLabel="Send later" menu={LATER}>
          Send
        </SplitButton>
      </Specimen>
    </Page>
  )
}
