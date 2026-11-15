// Empty State (Figma 32:64): overline, title, body, one secondary action, left aligned; tone
// critical; and the same built from its parts, with a glyph tile. View: ?view=empty-state
import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyOverline,
  EmptyState,
  EmptyTitle,
  Icon,
} from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

export default function EmptyStateView() {
  return (
    <Page>
      <Specimen label="Empty State // as Figma draws it; tone critical">
        <Column>
          <EmptyState
            overline="Inbox // 000 unread"
            title="Nothing left today."
            body="New mail lands here. Snoozed messages come back at 8:00 AM."
            actionLabel="Open snoozed"
          />
        </Column>
        <Column>
          <EmptyState tone="critical" overline="Tasks // 00" title="Can't reach Warpcore." body="The server didn't answer. Your tasks are safe there." actionLabel="Try again" />
        </Column>
      </Specimen>
      <Specimen label="Empty, sm // a column with nothing open">
        <Column>
          <Empty size="sm">
            <EmptyHeader>
              <EmptyOverline>Mail // inbox</EmptyOverline>
              <EmptyTitle>Nothing open.</EmptyTitle>
              <EmptyDescription>Pick a message to see it here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent />
          </Empty>
        </Column>
      </Specimen>
      <Specimen label="Empty, composed // the parts by hand: a glyph tile, a title, a line, one action">
        <Column>
          <Empty size="sm">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Icon name="email" />
              </EmptyMedia>
              <EmptyTitle>No messages</EmptyTitle>
              <EmptyDescription>When something arrives it shows up here.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button variant="secondary">Compose</Button>
            </EmptyContent>
          </Empty>
        </Column>
      </Specimen>
    </Page>
  )
}
