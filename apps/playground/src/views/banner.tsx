// Banner: Figma's Banner (32:89), critical and info as drawn, warning and success from the existing roles, compact (contract 5.1b #27), dismiss. View: ?view=banner
import { useState, type ReactNode } from "react"
import { Banner, Button } from "@unicron/ui"

function Specimen({ label, children, width = "max-w-[358px]" }: { label: string; children: ReactNode; width?: string }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className={`flex w-full flex-col gap-4 ${width}`}>{children}</div>
    </section>
  )
}

export default function BannerView() {
  const [web, setWeb] = useState(true)
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 358 wide; critical, info">
        <Banner
          tone="critical"
          title="Sync failed"
          body="Fastmail refused the password. Mail from 09:16 on is not here yet."
          action={<Button variant="secondary" size="sm">Sign in</Button>}
        />
        <Banner
          tone="info"
          title="Sync failed"
          body="Fastmail refused the password. Mail from 09:16 on is not here yet."
          action={<Button variant="secondary" size="sm">Sign in</Button>}
        />
      </Specimen>

      <Specimen label="At the top of a section // Vale, Warpcore" width="max-w-[1116px]">
        <Banner
          tone="critical"
          title="Work account stopped syncing"
          body="Google refused the sign-in at 09:16. Work mail after that time is missing until you sign in again."
          action={<Button variant="secondary" size="sm">Sign in</Button>}
        />
        <div className="max-w-[534px]">
          <Banner
            tone="critical"
            title="Stopped at the budget cap"
            body="Codex used $2.00 at 03:12 while resolving 14 packages. Nothing was merged."
            action={<Button variant="secondary" size="sm">Raise cap</Button>}
          />
        </div>
      </Specimen>

      <Specimen label="Tones // info dismissable, warning, success" width="max-w-[534px]">
        {web ? (
          <Banner
            tone="info"
            title="In the desktop app"
            body="Checks for weak, reused and breached passwords are in the desktop app."
            onDismiss={() => setWeb(false)}
          />
        ) : (
          <Button variant="ghost" size="sm" onClick={() => setWeb(true)}>
            Show the banner again
          </Button>
        )}
        <Banner
          tone="warning"
          title="This run may reach its limit"
          body="Files past the limit aren't started."
          action={<Button variant="secondary" size="sm">Raise limit</Button>}
        />
        <Banner tone="success" title="Work account syncing again" body="Mail from 09:16 on is here." onDismiss={() => undefined} />
      </Specimen>

      <Specimen label="Compact // inside a form, a pane, a dialog; the text wraps, never cut" width="max-w-[432px]">
        <Banner size="compact" tone="info" body="Caps Lock is on." />
        <Banner size="compact" tone="info" body="You're offline. Sharing needs the server." />
        <Banner
          size="compact"
          tone="warning"
          body="This file changed on disk while you were editing. Your next save merges the two; nothing is overwritten."
          action={<Button variant="secondary" size="sm">Review merge</Button>}
        />
        <Banner size="compact" tone="critical" title="Couldn't save." body="The vault is locked on another device." action={<Button variant="secondary" size="sm">Try again</Button>} />
        <Banner
          size="compact"
          tone="info"
          body="You're exploring the demo. Nothing here is real."
          action={<Button variant="secondary" size="sm">Leave the demo</Button>}
        />
      </Specimen>

      <Specimen label="Compact // a server's long message in a 320 form column: every word shows, a long token breaks (Vale NA7)" width="max-w-[320px]">
        <Banner
          size="compact"
          tone="critical"
          title="Couldn't add the account."
          body="imap.fastmail.com said: AUTHENTICATIONFAILED_INVALID_CREDENTIALS for sean@fastmail.com. Make an app password in Fastmail's settings, then try again."
          action={<Button variant="secondary" size="sm">Try again</Button>}
        />
        <Banner
          size="compact"
          tone="info"
          body="Google shows a warning page first because this build's sign-in is not verified yet. Choose Advanced, then Go to Vale."
        />
      </Specimen>
    </div>
  )
}
