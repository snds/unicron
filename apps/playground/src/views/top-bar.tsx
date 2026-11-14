// Top bar of a phone detail screen, as the apps draw it (no Figma component): back, a small centred
// title once the head has scrolled away, up to two actions. View: ?view=top-bar
import { useState, type ReactNode } from "react"
import { FloatButton, PageHead, TopBar } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-sm flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

export default function TopBarView() {
  const [said, setSaid] = useState("Back goes to the list")
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Task detail // back and more; the head below holds the title (Warpcore)">
        <TopBar onBack={() => setSaid("Back to Tasks")} actions={<FloatButton label="More" icon="overflow-menu--horizontal" size="l" />} />
        <PageHead size="sm" overline="SEA-51 // Lockdown // Risk 2" title="Migrate vault login to OPAQUE" />
      </Specimen>

      <Specimen label="Item detail // back, edit and more (Lockdown)">
        <TopBar
          onBack={() => setSaid("Back to Items")}
          actions={
            <>
              <FloatButton label="Edit" icon="edit" size="l" />
              <FloatButton label="More" icon="overflow-menu--horizontal" size="l" />
            </>
          }
        />
        <PageHead overline="Login // passkey + code" title="Steam" meta="store.steampowered.com" />
      </Specimen>

      <Specimen label="Scrolled // the small centred title arrives in the bar">
        <TopBar
          onBack={() => setSaid("Back to Items")}
          title="Steam"
          actions={
            <>
              <FloatButton label="Edit" icon="edit" size="l" />
              <FloatButton label="More" icon="overflow-menu--horizontal" size="l" />
            </>
          }
        />
        <TopBar onBack={() => setSaid("Back to Tasks")} title="Migrate vault login to OPAQUE" actions={<FloatButton label="More" icon="overflow-menu--horizontal" size="l" />} />
      </Specimen>

      <Specimen label="Full-screen form // close instead of back; the title is the screen's heading (Vale)">
        <TopBar
          title="New message"
          titleAs="h1"
          start={<FloatButton label="Close" icon="close" size="l" onClick={() => setSaid("Closed the draft")} />}
          actions={<FloatButton label="Send" icon="send--alt" kind="primary" size="l" onClick={() => setSaid("Sent")} />}
        />
      </Specimen>

      <p className="type-caption text-support-foreground" aria-live="polite">
        {said}
      </p>
    </div>
  )
}
