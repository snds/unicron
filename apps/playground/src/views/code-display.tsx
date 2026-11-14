// CodeDisplay in Lockdown's four places: the field on an item (40:357, 41:720), the phone's Codes
// rows (40:954), the desktop tiles (41:2487) and one compact line; the counter kind; the states.
// The clock is held still (`now`), so the picture shows the frames' seconds. View: ?view=code-display
import type { ReactNode } from "react"
import { CodeDisplay, CodeDisplayList, CrownJewelSurface } from "@unicron/ui"

const AT = 1_800_000_000

function Specimen({ label, children, width = "40.5rem" }: { label: string; children: ReactNode; width?: "40.5rem" | "22.375rem" | "full" }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className={width === "full" ? "w-full" : width === "22.375rem" ? "w-full max-w-[22.375rem]" : "w-full max-w-[40.5rem]"}>{children}</div>
    </section>
  )
}

const CODES = [
  { issuer: "Steam", account: "kestrel.04", code: "R7K2N", variant: "steam" as const, s: 18 },
  { issuer: "GitHub", account: "kestrel04", code: "482193", s: 23 },
  { issuer: "Fastmail", account: "kestrel.04@proton.me", code: "019552", s: 4 },
  { issuer: "Synology", account: "admin", code: "330918", s: 23 },
  { issuer: "Stripe", account: "kestrel.04", code: "771404", s: 23 },
  { issuer: "Cloudflare", account: "kestrel.04", code: "204667", s: 23 },
]

export default function CodeDisplayView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Field // on an item: Field Row, Display size, with the 30-cell countdown">
        <CodeDisplay layout="field" label="Steam Guard" variant="steam" issuer="Steam" account="kestrel.04" code="R7K2N" period={30} expiresAt={AT} now={AT - 18} />
        <CodeDisplay layout="field" label="One-time code" issuer="Fastmail" account="kestrel.04@proton.me" code="019552" next="771930" period={30} expiresAt={AT} now={AT - 4} />
      </Specimen>

      <Specimen label="Field // counter kind: no countdown, the counter and Next code" >
        <CodeDisplay layout="field" variant="hotp" label="One-time code" issuer="Router admin" code="330918" counter={14} onAdvance={() => {}} />
      </Specimen>

      <Specimen label="Phone // Codes rows: issuer and account, the code, the cells and seconds" width="22.375rem">
        <CodeDisplayList>
          {CODES.slice(0, 5).map((c) => (
            <CodeDisplay key={c.issuer} layout="row" variant={c.variant} issuer={c.issuer} account={c.account} code={c.code} period={30} expiresAt={AT} now={AT - c.s} />
          ))}
        </CodeDisplayList>
      </Specimen>

      <Specimen label="Desktop // Codes tiles: as many columns as fit" width="full">
        <CodeDisplayList layout="grid">
          {CODES.map((c) => (
            <CodeDisplay key={c.issuer} layout="tile" variant={c.variant} issuer={c.issuer} account={c.account} code={c.code} period={30} expiresAt={AT} now={AT - c.s} />
          ))}
        </CodeDisplayList>
      </Specimen>

      <Specimen label="Compact // one line: a popup, a list in a sheet" width="22.375rem">
        <CodeDisplay layout="compact" issuer="GitHub" account="kestrel04" code="482193" period={30} expiresAt={AT} now={AT - 23} />
        <CodeDisplay layout="compact" issuer="Fastmail" account="kestrel.04@proton.me" code="019552" period={30} expiresAt={AT} now={AT - 4} />
      </Specimen>

      <Specimen label="States // the next code early, the clock notice, a warning, loading, an error">
        <CodeDisplay layout="field" label="One-time code" issuer="GitHub" code="482193" next="330918" period={30} expiresAt={AT} now={AT - 8} />
        <CodeDisplay layout="field" label="One-time code" issuer="Synology" code="330918" skewSeconds={-42} onFixClock={() => {}} period={30} expiresAt={AT} now={AT - 23} />
        <CodeDisplay layout="field" label="One-time code" issuer="Stripe" code="771404" warnings={["issuer-equals-login"]} period={30} expiresAt={AT} now={AT - 23} />
        <CodeDisplay layout="field" label="One-time code" issuer="Cloudflare" loading period={30} expiresAt={AT} now={AT - 23} />
        <CodeDisplay layout="field" label="One-time code" issuer="Tailscale" error="the site's algorithm is not supported" period={30} expiresAt={AT} now={AT - 23} />
      </Specimen>

      <Specimen label="Concealed // inside a crown jewel: dots until shown, every copy asks first">
        <CrownJewelSurface host="app" title="Ledger recovery code" requestProof={() => Promise.resolve(true)}>
          <CodeDisplay layout="field" label="One-time code" issuer="Ledger" code="204667" period={30} expiresAt={AT} now={AT - 23} />
        </CrownJewelSurface>
      </Specimen>
    </div>
  )
}
