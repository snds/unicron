// QrCode: one SVG path on a light square, dark on light in both grounds (Lockdown brief I9, Vale
// P2). View: ?view=qr-code
import type { ReactNode } from "react"
import { QrCode, encodeQrModules } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline text-text-label">{label}</h3>
      <div className="flex flex-wrap items-start gap-8">{children}</div>
    </section>
  )
}

// A host's own grid, as Lockdown's core hands it over: rows of 0 and 1 (made here with the same
// encoder, so the picture is a real code: a device link as Lockdown writes one).
const DEVICE_ROWS = encodeQrModules("lockdown:link:v1?s=https%3A%2F%2Fvault.example&c=7KQ2M9XH4P").map((row) => row.map((dark) => (dark ? "1" : "0")).join(""))

const VCARD = ["BEGIN:VCARD", "VERSION:3.0", "N:Chen;Mira;;;", "FN:Mira Chen", "EMAIL:mira.chen@fastmail.com", "END:VCARD"].join("\n")

export default function QrCodeView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Wi-Fi guest card // 240, the default size">
        <div className="flex flex-col gap-3">
          <QrCode value="WIFI:T:WPA;S:PineHollow-Guest;P:cedar-lantern-42;;" label="QR code to join PineHollow-Guest" />
          <p className="type-caption text-text-secondary">Scan with a phone camera to join.</p>
        </div>
      </Specimen>
      <Specimen label="A contact, and a device code at 160 // drawn from the host's own grid too">
        <QrCode value={VCARD} label="QR code to add Mira Chen" size={160} />
        <QrCode
          label="QR code to add this device"
          size={160}
          modules={DEVICE_ROWS}
        />
      </Specimen>
    </div>
  )
}
