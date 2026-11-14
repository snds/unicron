// The update rows of Settings → About, in the Field Row and Toggle Row looks: every state the
// update kit reports. View: ?view=update-status
import type { ReactNode } from "react"
import { AutoCheckSwitch, UpdateStatusRow, type UpdateStatus } from "@unicron/ui"

const base: UpdateStatus = {
  version: "0.1.0-main.20261107093000",
  channel: "main",
  enabled: true,
  off: null,
  auto_check: true,
  state: "idle",
  percent: null,
  offered: null,
  error: null,
  link: null,
  link_why: null,
  asked: false,
}
const noop = () => {}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className="flex w-full max-w-[40.5rem] flex-col">{children}</div>
    </section>
  )
}

export default function UpdateStatusView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="This app // up to date, and the automatic check">
        <UpdateStatusRow status={{ ...base, state: "up_to_date" }} appName="Lockdown" onCheck={noop} onRestart={noop} onReload={noop} />
        <AutoCheckSwitch status={base} onCheckedChange={noop} />
      </Specimen>
      <Specimen label="States // downloading, ready, available by hand, failed, off">
        <UpdateStatusRow status={{ ...base, state: "downloading", offered: "0.1.0-main.20261112081500", percent: 42 }} appName="Lockdown" onCheck={noop} onRestart={noop} onReload={noop} />
        <UpdateStatusRow
          status={{ ...base, state: "ready", offered: "0.1.0-main.20261112081500" }}
          appName="Lockdown"
          onCheck={noop}
          onRestart={noop}
          onReload={noop}
          restartNote="Restarting locks Lockdown."
        />
        <UpdateStatusRow
          status={{ ...base, channel: "stable", state: "available", offered: "1.4.0", link: "https://github.com/snds/lockdown/releases", link_why: "This build can't update itself." }}
          appName="Lockdown"
          onCheck={noop}
          onRestart={noop}
          onReload={noop}
        />
        <UpdateStatusRow status={{ ...base, state: "failed", error: "The update server didn't answer." }} appName="Lockdown" onCheck={noop} onRestart={noop} onReload={noop} />
        <UpdateStatusRow status={{ ...base, channel: "local", enabled: false, off: "Updates are off in a build made on this Mac." }} appName="Synapse" onCheck={noop} onRestart={noop} onReload={noop} />
      </Specimen>
      <Specimen label="Server // the same row for a server, in its own words">
        <UpdateStatusRow
          status={{ ...base, channel: "stable", version: "2.3.1", state: "up_to_date" }}
          appName="Lockdown server"
          words={{ label: "Server", reload: "Reload server" }}
          onCheck={noop}
          onRestart={noop}
          onReload={noop}
        />
      </Specimen>
    </div>
  )
}
