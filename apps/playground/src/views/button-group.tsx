// ButtonGroup: joined buttons share one 1px edge (the double edge is gone). View: ?view=button-group
import { Button, ButtonGroup, ButtonGroupSeparator, ButtonGroupText, Icon, Input } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function ButtonGroupView() {
  return (
    <Page>
      <Specimen label="Outlined // one edge between">
        <ButtonGroup aria-label="Zoom">
          <Button variant="secondary" size="sm" aria-label="Zoom out">
            <Icon name="zoom--out" />
          </Button>
          <Button variant="secondary" size="sm">
            Fit
          </Button>
          <Button variant="secondary" size="sm" aria-label="Zoom in">
            <Icon name="zoom--in" />
          </Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Reply">
          <Button variant="secondary">Reply</Button>
          <Button variant="secondary">Reply all</Button>
          <Button variant="secondary">Forward</Button>
        </ButtonGroup>
        <ButtonGroup orientation="vertical" aria-label="Order">
          <Button variant="secondary" size="sm">
            Move up
          </Button>
          <Button variant="secondary" size="sm">
            Move down
          </Button>
        </ButtonGroup>
      </Specimen>

      <Specimen label="With text, a field and a separator">
        <ButtonGroup aria-label="Port">
          <ButtonGroupText>Port</ButtonGroupText>
          <Input aria-label="Port" defaultValue="8080" />
          <Button variant="secondary" size="lg">
            Check
          </Button>
        </ButtonGroup>
        <ButtonGroup aria-label="Run">
          <Button size="sm">Start</Button>
          <ButtonGroupSeparator />
          <Button size="sm" aria-label="Start options">
            <Icon name="chevron--down" />
          </Button>
        </ButtonGroup>
      </Specimen>
    </Page>
  )
}
