// Shared parts for the overlay views (dialog, sheet, popover, dropdown-menu, command, toaster,
// adaptive, confirm-dialog). Not a view: the file name starts with "_".
//
// A Stage is a small screen: a box that holds fixed-position descendants (a transform makes it
// their containing block), so a dialog, a sheet or a toast portalled into it sits in it as it
// would on a real screen, scrim and all. Several open layers can then be seen side by side.
import { useState, type ReactNode } from "react"

export function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** Rows of a real list, drawn behind a layer so its scrim has something to dim. */
export function PageBehind({ app = "lockdown" }: { app?: "lockdown" | "vale" | "warpcore" | "synapse" }) {
  const rows = {
    lockdown: [
      ["Spotify", "spotify.com", "Passkey"],
      ["Steam", "store.steampowered.com", "Passkey + code"],
      ["Stripe", "dashboard.stripe.com", "Login"],
      ["Synology", "quickconnect.to", "Login + code"],
      ["Tailscale", "login.tailscale.com", "Passkey"],
      ["Ticketmaster", "ticketmaster.com", "Login // weak"],
    ],
    vale: [
      ["Mira Chen", "Cabin for the 20th, confirmed", "09:14"],
      ["Ledger Bank", "Your November statement is ready", "08:02"],
      ["Theo Park", "Re: Saturday carpool", "Wed"],
      ["Figma", "3 comments on Theme Studies", "Wed"],
      ["Calendar", "Dentist moved to 16:30", "Tue"],
      ["Pine Hollow", "Your booking for Nov 20 to 22", "Mon"],
    ],
    warpcore: [
      ["SEA-48", "Add baseline drift check", "Running 04:12"],
      ["SEA-51", "OPAQUE migration diff", "Review"],
      ["SEA-47", "Budget for audits", "Done"],
      ["SEA-46", "Company registry source", "Done"],
      ["SEA-45", "Spend cap for paid models", "Done"],
      ["SEA-44", "Monitor for BND-001", "Paused"],
    ],
    synapse: [
      ["identity.unique", "Every persona has one id", "Failing"],
      ["docs.links", "No dead links in skills", "Passing"],
      ["harness.gate", "Gates run before merge", "Passing"],
      ["memory.tiers", "Batons stay under 12 KB", "Stale"],
      ["skills.load", "Load sets resolve", "Passing"],
      ["notes.frontmatter", "Every note has a type", "Passing"],
    ],
  }[app]
  return (
    <div aria-hidden className="flex flex-col px-4 pt-4 sm:px-6">
      <p className="type-overline">{app === "vale" ? "Inbox // 012 unread" : app === "lockdown" ? "Items // all" : app === "warpcore" ? "Tasks // 06" : "Checks // 06"}</p>
      <p className="type-display-compact pb-4">{app === "vale" ? "Today" : app === "lockdown" ? "Items" : app === "warpcore" ? "Tasks" : "Checks"}</p>
      {rows.map(([title, meta, status]) => (
        <div key={title} className="rule-t flex items-baseline justify-between gap-4 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="type-subtitle truncate">{title}</span>
            <span className="type-meta truncate">{meta}</span>
          </div>
          <span className="type-overline shrink-0">{status}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * A screen for layers. `children` gets the stage's element, to pass as a layer's `container`.
 * Width and height are the screen's; on a narrow window the stage narrows with it.
 */
export function Stage({
  label,
  width,
  height,
  app,
  children,
}: {
  label: string
  width: number
  height: number
  app?: "lockdown" | "vale" | "warpcore" | "synapse"
  children: (container: HTMLElement) => ReactNode
}) {
  const [el, setEl] = useState<HTMLElement | null>(null)
  return (
    <Specimen label={label}>
      <div
        ref={setEl}
        data-stage=""
        className="bg-surface-ground rule-box relative max-w-full overflow-hidden [transform:translateZ(0)]"
        style={{ width, height }}
      >
        <PageBehind app={app} />
        {el ? children(el) : null}
      </div>
    </Specimen>
  )
}
