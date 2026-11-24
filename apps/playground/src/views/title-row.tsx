// Title Row: the 48px desktop title row every app shares (Figma 192:589). View: ?view=title-row
import { useState } from "react"
import { IconButton, StatusOrb, TitleRow } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

function Live() {
  const [sidebar, setSidebar] = useState(true)
  const [panel, setPanel] = useState(false)
  return (
    <TitleRow
      windowButtons
      parent={{ label: "Projects", onClick: () => {} }}
      current="Warpcore"
      sidebarToggle={{ label: sidebar ? "Hide sidebar" : "Show sidebar", onClick: () => setSidebar(!sidebar), pressed: sidebar }}
      actions={<IconButton icon="filter" label="Filter" />}
      panelToggle={{ label: panel ? "Hide panel" : "Show panel", onClick: () => setPanel(!panel), pressed: panel, needsYou: !panel }}
    />
  )
}

export default function TitleRowView() {
  return (
    <Page>
      <Specimen label="Breadcrumb, status, settings" column>
        <div className="flex w-180 flex-col gap-4">
          <Live />
          <TitleRow parent={{ label: "Sessions", href: "#" }} current="Sign-in helper" status={<StatusOrb state="working" />} />
          <TitleRow kind="settings" parent={{ label: "Settings" }} current="Accounts" />
        </div>
      </Specimen>
    </Page>
  )
}
