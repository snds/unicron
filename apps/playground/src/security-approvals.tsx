import { useState } from "react"
import {
  ApprovalSheet,
  Button,
  Icon,
  IconButton,
  RiskTierBadge,
  SecretField,
  riskTiers,
  type ApprovalSheetProps,
  type SecretFieldHost,
} from "@unicron/ui"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

// A demo host: nothing reaches a real clipboard. The real one is the core on Tauri and native.
const demoHost: SecretFieldHost = {
  copy: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  clipboardHolds: () => Promise.resolve(true),
  gate: () => Promise.resolve(true),
}
const hostWithoutClipboardRead: SecretFieldHost = { copy: demoHost.copy, clear: demoHost.clear }
const secret = (text: string) => () => Promise.resolve(new TextEncoder().encode(text))
const failing = () => Promise.reject(new Error("vault locked"))

const context = [
  { label: "What", value: "Sign in to the vault" },
  { label: "Who", value: "Sean's MacBook" },
  { label: "Where", value: "Berlin" },
  { label: "When", value: "just now" },
]
const deviceCodeContext = [
  { label: "What", value: "Activate a streaming app" },
  { label: "Domain", value: "tv.example.com", emphasis: true },
  { label: "Where", value: "Living room TV" },
  { label: "When", value: "just now" },
]

type Scenario = {
  label: string
  props: Omit<ApprovalSheetProps, "onApprove" | "onDeny" | "onReport" | "open" | "onOpenChange" | "expiresAt">
  /** Milliseconds from open; the sheet's default is 60 s. */
  expiresIn?: number
}
const scenarios: Scenario[] = [
  { label: "device (enter 42)", props: { kind: "device", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" } } },
  { label: "agent · 3 digits (enter 731)", props: { kind: "agent", origin: "push", context, matching: { mode: "enter", digits: 3, expected: "731" } } },
  { label: "device-code · scan", props: { kind: "device-code", origin: "scan", context: deviceCodeContext, matching: { mode: "enter", digits: 2, expected: "42" } } },
  { label: "device-code · push (origin refused)", props: { kind: "device-code", origin: "push", context: deviceCodeContext, matching: { mode: "enter", digits: 2, expected: "42" } } },
  { label: "contact-request · choose", props: { kind: "contact-request", origin: "push", context, matching: { mode: "choose", digits: 2, expected: "42", choices: ["17", "42", "88"] } } },
  { label: "bridge (tolerated tier)", props: { kind: "bridge", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" } } },
  { label: "busy", props: { kind: "device", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" }, busy: true } },
  { label: "error", props: { kind: "device", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" }, error: "Too many attempts. Try again in a minute." } },
  { label: "10 s left (urgent)", props: { kind: "device", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" } }, expiresIn: 10_000 },
  { label: "expired", props: { kind: "device", origin: "pairing", context, matching: { mode: "enter", digits: 2, expected: "42" } }, expiresIn: -1 },
]

export function SecurityApprovalsShowcase() {
  const [open, setOpen] = useState<{ scenario: Scenario; expiresAt?: number } | null>(null)
  const [log, setLog] = useState<string[]>([])
  const note = (line: string) => setLog((l) => [line, ...l].slice(0, 4))
  const [draft, setDraft] = useState("correct horse")
  const [locked, setLocked] = useState(false)

  return (
    <div>
      <Section title="RiskTierBadge (Data Display · security)">
        {riskTiers.map((tier) => (
          <RiskTierBadge key={tier} tier={tier} verified />
        ))}
        {riskTiers.map((tier) => (
          <RiskTierBadge key={tier} tier={tier} verified size="md" explain disclosures={tier === "tolerated" ? ["Uses an unofficial endpoint.", "May break when the vendor changes its site."] : []} />
        ))}
        <RiskTierBadge tier="official" />
        <RiskTierBadge tier="official" verified={false} />
        <RiskTierBadge tier="standard" verified explain explainDisabled />
      </Section>

      <Section title="SecretField (Form · security)">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <SecretField label="Password" getSecret={secret("correct-horse-Battery-9")} host={demoHost} locked={locked} onReveal={() => note("reveal")} onCopy={() => note("copy")} />
          <SecretField label="Secret Key" getSecret={secret("A3-K7PQ2M-9XZ4R-W8H6N")} host={demoHost} revealMode="toggle" locked={locked} description="Toggle mode: hides itself after 30 s." />
          <SecretField label="Card number" getSecret={secret("4242424242424242")} host={hostWithoutClipboardRead} format="groups-of-4" clipboardTimer={10} locked={locked} description="A host that cannot read the clipboard: the clear is unconditional." />
          <SecretField label="Recovery code" getSecret={secret("tiger lamp river coat")} host={demoHost} gate="password" format="words" locked={locked} description="Gated: the host confirms it's you before the value moves.">
            <IconButton icon="open_in_full" label="Large type" size="icon-sm" />
          </SecretField>
          <SecretField label="PIN" getSecret={failing} host={demoHost} revealMode="toggle" description="A failing handle: reveal to see the error state." />
          <SecretField mode="edit" label="New password" value={draft} onChange={setDraft} strength={draft.length < 8 ? "weak" : draft.length < 16 ? "fair" : "strong"} description="Edit mode with the strength word.">
            <IconButton icon="casino" label="Generate" size="icon-sm" onClick={() => setDraft("Xq7-vL2m-Tz9p-Rw4K")} />
          </SecretField>
          <SecretField mode="edit" label="Disabled" value="unchangeable" onChange={() => {}} disabled />
          <SecretField mode="edit" label="With an error" value="12345" onChange={() => {}} strength="weak" error="Choose something longer." />
          <div className="flex items-center gap-2 text-xs">
            <Button size="xs" variant="outline" onClick={() => setLocked((l) => !l)}>
              <Icon name={locked ? "lock" : "lock_open"} data-icon="inline-start" />
              {locked ? "Unlock" : "Lock the vault"}
            </Button>
            <span className="text-muted-foreground">{log.length ? log.join(" · ") : "Audit: reveal and copy land here."}</span>
          </div>
        </div>
      </Section>

      <Section title="ApprovalSheet (Overlay · security)">
        {scenarios.map((s) => (
          <Button key={s.label} variant="outline" size="sm" onClick={() => setOpen({ scenario: s, expiresAt: s.expiresIn === undefined ? undefined : Date.now() + s.expiresIn })}>
            {s.label}
          </Button>
        ))}
        {open && (
          <ApprovalSheet
            kind={open.scenario.props.kind}
            origin={open.scenario.props.origin}
            context={open.scenario.props.context}
            matching={open.scenario.props.matching}
            busy={open.scenario.props.busy}
            error={open.scenario.props.error}
            expiresAt={open.expiresAt}
            open
            onOpenChange={(o) => {
              if (!o) setOpen(null)
            }}
            onApprove={() => {
              note("approve")
              setOpen(null)
            }}
            onDeny={(reason) => note(`deny: ${reason}`)}
            onReport={() => note("report")}
          />
        )}
        <p className="text-muted-foreground w-full text-xs">{log.length ? log.join(" · ") : "Decisions land here."}</p>
      </Section>
    </div>
  )
}
