import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Button,
  CodeDisplay,
  CodeDisplayList,
  CrownJewelGate,
  CrownJewelMark,
  CrownJewelSurface,
  Icon,
  LargeTypeView,
  type CrownJewelProof,
} from "@unicron/ui"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  )
}

/** A fake core: deterministic codes for the playground, ticked once a second. The real one lives in Lockdown. */
function useFakeClock(period = 30) {
  const [now, setNow] = useState(() => Date.now() / 1000)
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() / 1000), 1000)
    return () => clearInterval(id)
  }, [])
  const step = Math.floor(now / period)
  const code = (n: number, step: number) => String((step * 7919 + n * 104729) % 10 ** n).padStart(n, "0")
  const steam = (step: number) => {
    const A = "23456789BCDFGHJKMNPQRTVWXY"
    let x = step * 2654435761
    let out = ""
    for (let i = 0; i < 5; i++) {
      out += A[Math.abs(x) % A.length]
      x = Math.floor(x / A.length) + 17
    }
    return out
  }
  return {
    now,
    period,
    expiresAt: (step + 1) * period,
    six: { code: code(6, step), next: code(6, step + 1) },
    eight: { code: code(8, step), next: code(8, step + 1) },
    steam: { code: steam(step), next: steam(step + 1) },
  }
}

const copy = (value: string, which: "code" | "next") => {
  toast(`Copied ${which === "next" ? "the next code" : "the code"}: ${value}`)
}
const secret = () => Promise.resolve(new TextEncoder().encode("Tr4-9lO0_bZ2"))

export function SecurityShowcase() {
  const clock = useFakeClock()
  const [hotpCounter, setHotpCounter] = useState(41)
  const [largeOpen, setLargeOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [gateOpen, setGateOpen] = useState<"biometric" | "password" | null>(null)
  const [gateError, setGateError] = useState<string>()
  const [gateTries, setGateTries] = useState(3)

  // Frozen clocks for the threshold states, so every state is visible at once: `now` is 1000 - seconds left.

  const confirm = async (proof: CrownJewelProof) => {
    // The playground's "core": the password is "unicron"; biometrics always pass.
    if (proof.level === "biometric") return true
    return proof.password === "unicron"
  }

  return (
    <div>
      <Section title="CodeDisplay (security)">
        <CodeDisplayList>
          <CodeDisplay
            issuer="GitHub"
            account="sean"
            media={<Icon name="code" />}
            code={clock.six.code}
            next={clock.six.next}
            now={clock.now}
            expiresAt={clock.expiresAt}
            period={clock.period}
            onCopy={copy}
          />
          <CodeDisplay
            density="list"
            issuer="Fastmail"
            account="sean@example.com"
            digits={8}
            media={<Icon name="mail" />}
            code={clock.eight.code}
            next={clock.eight.next}
            now={clock.now}
            expiresAt={clock.expiresAt}
            period={clock.period}
            onCopy={copy}
          />
          <CodeDisplay
            density="compact"
            variant="steam"
            issuer="Steam"
            code={clock.steam.code}
            next={clock.steam.next}
            now={clock.now}
            expiresAt={clock.expiresAt}
            period={clock.period}
            onCopy={copy}
          />
        </CodeDisplayList>
        <p className="text-muted-foreground text-xs">Frozen clocks: next shown (9 s) · expiring (4 s) · copy takes the next code (2 s)</p>
        <CodeDisplay density="list" issuer="Next shown" code="482917" next="330558" now={991} expiresAt={1000} period={30} onCopy={copy} />
        <CodeDisplay density="list" issuer="Expiring" code="482917" next="330558" now={996} expiresAt={1000} period={30} onCopy={copy} />
        <CodeDisplay density="list" issuer="Copy takes next" code="482917" next="330558" now={998} expiresAt={1000} period={30} onCopy={copy} />
        <CodeDisplay
          density="list"
          variant="hotp"
          issuer="Router"
          counter={hotpCounter}
          code={String((hotpCounter * 7919) % 1000000).padStart(6, "0")}
          onAdvance={() => new Promise<void>((r) => setTimeout(() => (setHotpCounter((c) => c + 1), r()), 600))}
          onCopy={copy}
        />
        <CodeDisplay density="list" issuer="Concealed" code="482917" next="330558" now={980} expiresAt={1000} period={30} concealed onCopy={copy} />
        <CodeDisplay density="list" issuer="Clock skew" code="482917" now={980} expiresAt={1000} period={30} skewSeconds={42} onFixClock={() => toast("Fix clock")} onCopy={copy} />
        <CodeDisplay density="list" issuer="Same as login" code="482917" now={980} expiresAt={1000} period={30} warnings={["issuer-equals-login"]} onCopy={copy} />
        <CodeDisplay density="list" issuer="Loading" loading />
        <CodeDisplay density="list" issuer="Error" error="unsupported algorithm" />
      </Section>

      <Section title="LargeTypeView (security)">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setLargeOpen(true)}>
            <Icon name="fullscreen" data-icon="inline-start" />
            Show large type
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen((v) => !v)}>
            <Icon name="print" data-icon="inline-start" />
            {printOpen ? "Hide" : "Show"} print variant
          </Button>
        </div>
        <LargeTypeView
          open={largeOpen}
          onOpenChange={setLargeOpen}
          getSecret={secret}
          title="Wi-Fi password · Home"
          allowCopy
          onCopy={() => {
            toast("Copied")
          }}
          onKeepAwake={(on) => console.info("keep awake", on)}
          onBrightness={(max) => console.info("brightness max", max)}
        />
        {printOpen && (
          <div className="rounded-xl border">
            <LargeTypeView print getSecret={secret} title="Recovery kit · Secret Key" groupSize={4} showIndex />
          </div>
        )}
      </Section>

      <Section title="CrownJewel (security)">
        <p className="text-sm">
          Ledger recovery phrase <CrownJewelMark size="sm" /> · the mark in a row title
        </p>
        <CrownJewelSurface host="app" title="Ledger recovery phrase" appName="Lockdown" onConfirm={confirm} onBiometric={async () => "ok"} onLock={() => toast("Vault locked")}>
          <p className="text-muted-foreground text-xs">A CodeDisplay inside is concealed and its copy asks for proof first. Password: unicron.</p>
          <CodeDisplay density="list" issuer="Ledger" account="2FA" code="482917" next="330558" now={980} expiresAt={1000} period={30} onCopy={copy} />
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              Secondary inside
            </Button>
            <Button variant="outline" size="sm">
              Outline inside
            </Button>
          </div>
        </CrownJewelSurface>
        <CrownJewelSurface host="app" title="Seed phrase" deviceOnly loading />
        <CrownJewelSurface host="app" title="Old wallet" error="This item could not be decrypted." />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => (setGateError(undefined), setGateTries(3), setGateOpen("biometric"))}>
            Gate · biometric
          </Button>
          <Button variant="outline" size="sm" onClick={() => (setGateError("Password incorrect."), setGateTries(1), setGateOpen("password"))}>
            Gate · denied, one try left
          </Button>
        </div>
        <CrownJewelGate
          open={gateOpen !== null}
          onOpenChange={(o) => !o && setGateOpen(null)}
          level={gateOpen ?? "password"}
          reason="To show the recovery phrase for Ledger"
          attemptsLeft={gateTries}
          error={gateError}
          onBiometric={() => new Promise((r) => setTimeout(() => r("ok"), 800))}
          onConfirm={(proof) => {
            toast(`Proof handed to the host: ${proof.level}`)
            setGateOpen(null)
          }}
        />
      </Section>
    </div>
  )
}
