// Spinner: an SVG arc that turns on its own motion, never the agent's working ring. View: ?view=spinner
import { Button, Spinner, StatusOrb } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function SpinnerView() {
  return (
    <Page>
      <Specimen label="Spinner // 16 in text, 20 beside a field, in a button">
        <span className="type-ui flex items-center gap-2">
          <Spinner label="Checking for updates" />
          Checking for updates
        </span>
        <span className="type-ui flex items-center gap-2 text-support-foreground">
          <Spinner label="Saving" />
          Saving
        </span>
        <Button variant="secondary" loading>
          Reload server
        </Button>
      </Specimen>
      <Specimen label="Not this // the agent's working ring is its own (StatusOrb), never a spinner">
        <span className="type-ui flex items-center gap-2">
          <StatusOrb state="working" />
          Claude Code // running 04:12
        </span>
      </Specimen>
    </Page>
  )
}
