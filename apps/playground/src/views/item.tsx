// Item, the generic row: a rule on top, selected = primary-soft with the 2px edge, a hover wash. View: ?view=item
import { Button, Icon, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMain, ItemMedia, ItemTitle } from "@unicron/ui"

import { Column, InitialTile, Page, Specimen } from "./_primitives"

export default function ItemView() {
  return (
    <Page>
      <Specimen label="Rows // at rest, selected, as buttons (hover and press wash)">
        <Column wide>
          <ItemGroup>
            <Item render={<button type="button" />}>
              <ItemMedia>
                <InitialTile initials="MC" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Mira Chen</ItemTitle>
                <ItemDescription>Cabin for the 20th, confirmed</ItemDescription>
              </ItemContent>
            </Item>
            <Item render={<button type="button" />} data-selected="true">
              <ItemMedia>
                <InitialTile initials="LB" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Ledger Bank</ItemTitle>
                <ItemDescription>Your November statement is ready</ItemDescription>
              </ItemContent>
            </Item>
            <Item render={<button type="button" />}>
              <ItemMedia>
                <InitialTile initials="TP" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Theo Park</ItemTitle>
                <ItemDescription>Re: Saturday carpool</ItemDescription>
              </ItemContent>
            </Item>
          </ItemGroup>
        </Column>
      </Specimen>

      <Specimen label="Row // a main action with buttons of its own; icon media">
        <Column wide>
          <ItemGroup>
            <Item>
              <ItemMain>
                <ItemMedia variant="icon">
                  <Icon name="link" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Booking link</ItemTitle>
                  <ItemDescription>cal.vale.dev/mira</ItemDescription>
                </ItemContent>
              </ItemMain>
              <ItemActions>
                <Button variant="secondary" size="sm">
                  Copy
                </Button>
              </ItemActions>
            </Item>
            <Item>
              <ItemMain>
                <ItemMedia variant="icon">
                  <Icon name="calendar" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>Design crit</ItemTitle>
                  <ItemDescription>Thu 11.12 // 16:30 – 17:15</ItemDescription>
                </ItemContent>
              </ItemMain>
              <ItemActions>
                <Button size="sm">Join</Button>
              </ItemActions>
            </Item>
          </ItemGroup>
        </Column>
      </Specimen>

      <Specimen label="Variant // outline, muted; size sm">
        <Column>
          <Item variant="outline">
            <ItemContent>
              <ItemTitle>Personal</ItemTitle>
              <ItemDescription>mira.chen@fastmail.com</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted">
            <ItemContent>
              <ItemTitle>Work</ItemTitle>
              <ItemDescription>mira@studio.dev</ItemDescription>
            </ItemContent>
          </Item>
          <Item size="sm" render={<button type="button" />}>
            <ItemContent>
              <ItemTitle>Drafts</ItemTitle>
            </ItemContent>
          </Item>
        </Column>
      </Specimen>
    </Page>
  )
}
