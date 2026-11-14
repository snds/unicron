// Composer, as Figma draws it (32:91), and the states Figma leaves out. View: ?view=composer
import { useState, type ReactNode } from "react"
import { Badge, Button, Composer, IconButton } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-150 flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** A stand-in for the status strip (an Accessory, shell-chrome's part) in the composer's status slot. */
function StatusStandIn({ meta, title }: { meta: string; title: string }) {
  return (
    <div className="bg-surface-raised rule-box flex min-h-12 flex-col justify-center rounded-lg px-4 py-1">
      <p className="type-overline text-secondary-live">{meta}</p>
      <p className="type-ui">{title}</p>
    </div>
  )
}

export default function ComposerView() {
  const [sent, setSent] = useState("Nothing sent yet")
  const [streaming, setStreaming] = useState(false)
  const [draft, setDraft] = useState("")

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Empty // Figma 32:91, the send button off">
        <Composer placeholder="Reply to Mira" onSend={(text) => setSent(text)} />
      </Specimen>

      <Specimen label="Typing // Enter sends, Shift+Enter makes a line">
        <Composer
          placeholder="Ask about SEA-51"
          defaultValue="Split the OPAQUE migration into a diff I can review, and run the full test suite in the background."
          onSend={(text) => setSent(text)}
        />
        <p className="type-caption text-text-secondary" aria-live="polite">
          Last sent: {sent}
        </p>
      </Specimen>

      <Specimen label="Typing // grows to ten lines, then scrolls inside">
        <Composer
          placeholder="Reply to Mira"
          defaultValue={[
            "Hi Mira,",
            "",
            "The two-bedroom for the 20th through the 22nd works for us.",
            "We'll bring the board games, and I can drive up after 3.",
            "Is there anything else we should pick up on the way?",
            "",
            "Also: does the cabin have a grill, or should we bring the small one?",
            "And is the road still fine without chains this time of year?",
            "",
            "Thanks for booking it,",
            "Sean",
          ].join("\n")}
        />
      </Specimen>

      <Specimen label="Sending // Send keeps its name and is busy">
        <Composer placeholder="Ask about SEA-51" defaultValue="Does an old app version still log in?" sending />
      </Specimen>

      <Specimen label="Streaming // the button is Stop while a reply is written">
        <Composer
          placeholder="Ask about SEA-51"
          value={draft}
          onValueChange={setDraft}
          streaming={streaming}
          onStop={() => setStreaming(false)}
          onSend={() => {
            setDraft("")
            setStreaming(true)
          }}
        />
        <div className="flex gap-3">
          <Button size="sm" variant="secondary" onClick={() => setStreaming((on) => !on)}>
            {streaming ? "End the reply" : "Start a reply"}
          </Button>
        </div>
      </Specimen>

      <Specimen label="Streaming // Stop pressed, the reply is ending">
        <Composer placeholder="Ask about SEA-51" streaming stopping />
      </Specimen>

      <Specimen label="Waiting // offline: a clock that cancels, and the status slot says why">
        <Composer
          placeholder="Ask anything"
          defaultValue="Draw the new login flow so I can share it with the team."
          waiting
          status={<StatusStandIn meta="Offline // waiting to send" title="Sends when you're back online." />}
        />
      </Specimen>

      <Specimen label="Disabled with a line // Send is off; the line says why and stays in reach">
        <Composer
          placeholder="Ask anything"
          sendDisabled
          disabledReason={
            <>
              <span>No models connected.</span>
              <Button size="inline" variant="link">
                Connect
              </Button>
            </>
          }
        />
      </Specimen>

      <Specimen label="Disabled // the whole box">
        <Composer placeholder="Reply to Mira" disabled />
      </Specimen>

      <Specimen label="Slots // status strip, chips, then the box; attach and expand lead the field">
        <Composer
          placeholder="Ask about SEA-51, or @ a file"
          status={<StatusStandIn meta="Background // finished 14:26 // $0.61" title="Full test suite passed: 128 of 128" />}
          chips={
            <>
              <Badge>snds/lockdown</Badge>
              <Badge>claude/opaque-login</Badge>
              <Badge>Cloud sandbox</Badge>
            </>
          }
          attach={<IconButton icon="attachment" label="Attach a file" />}
          leadingAction={<IconButton icon="maximize" label="Open the full message" />}
        />
      </Specimen>

      <Specimen label="One-line size // a phone held sideways">
        <Composer size="line" placeholder="Ask about SEA-51" defaultValue="Does an old app version still log in?" />
      </Specimen>

      <Specimen label="Phone width // 358, as drawn">
        <div className="w-full max-w-90">
          <Composer placeholder="Reply to Mira" />
        </div>
      </Specimen>
    </div>
  )
}
