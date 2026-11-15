// App Lockup, as Figma draws it (28:2297), and in the phone top row, scrolled and not. View: ?view=app-lockup
import type { ReactNode } from "react"
import { AppLockup, FloatButton } from "@unicron/ui"

import { DEFAULT_APP_THEME, useAddress, type AppTheme } from "../address"

const APP: Record<AppTheme, { name: string; right: { label: string; icon: "user--avatar" | "settings" } }> = {
  warpcore: { name: "Warpcore", right: { label: "Settings", icon: "settings" } },
  vale: { name: "Vale", right: { label: "Profile", icon: "user--avatar" } },
  lockdown: { name: "Lockdown", right: { label: "Profile", icon: "user--avatar" } },
  synapse: { name: "Synapse", right: { label: "Profile", icon: "user--avatar" } },
}

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-6">{children}</div>
    </section>
  )
}

export default function AppLockupView() {
  const theme = useAddress().theme ?? DEFAULT_APP_THEME
  const app = APP[theme]
  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Lockup // mark 32 and wordmark, 10 apart, 48 high">
        <AppLockup name={app.name} />
      </Specimen>

      <Specimen label="Show name // off: the mark stays, the name is still its name">
        <AppLockup name={app.name} showName={false} />
      </Specimen>

      <Specimen label="As the way home // a link">
        <AppLockup name={app.name} render={<a href="#home" />} />
      </Specimen>

      <Specimen label="Phone top row // at rest, then scrolled">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <div className="flex items-center justify-between">
            <AppLockup name={app.name} />
            <FloatButton label={app.right.label} icon={app.right.icon} size="l" />
          </div>
          <div className="flex items-center justify-between">
            <AppLockup name={app.name} showName={false} />
            <FloatButton label={app.right.label} icon={app.right.icon} size="l" />
          </div>
        </div>
      </Specimen>
    </div>
  )
}
