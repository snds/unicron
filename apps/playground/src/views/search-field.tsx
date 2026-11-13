// Search Field (contract 5.1a): a Text Field with the search icon and a clear button. View: ?view=search-field
import { Column, Page, SearchField, Specimen } from "./_primitives"

export default function SearchFieldView() {
  return (
    <Page>
      <Specimen label="Search // empty, with words (clear shows), labelled">
        <Column>
          <SearchField placeholder="Search mail" />
        </Column>
        <Column>
          <SearchField placeholder="Search mail" defaultValue="cabin" />
        </Column>
        <Column>
          <SearchField label="Find a setting" placeholder="Theme, signature, relay" />
        </Column>
      </Specimen>
      <Specimen label="Search // focus, disabled">
        <Column>
          <SearchField placeholder="Search items" defaultValue="ticketmaster" autoFocus />
        </Column>
        <Column>
          <SearchField placeholder="Search items" disabled />
        </Column>
      </Specimen>
    </Page>
  )
}
