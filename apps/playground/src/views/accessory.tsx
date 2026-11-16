// Accessory, the status strip, as Figma draws it (20:1713), with the tones and forms the apps add.
// View: ?view=accessory
import { useEffect, useState, type ReactNode } from "react"
import { Accessory, Banner, Button, FloatButton, TabBar, TabBarItem } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex w-full max-w-sm flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      {children}
    </section>
  )
}

/** A request whose time runs down for real, so a screen reader hears the marks: 01:15, then said at 60, 30 and 10. */
function TickingRequest({ onReview }: { onReview: () => void }) {
  const [left, setLeft] = useState(75)
  useEffect(() => {
    const id = setInterval(() => setLeft((s) => (s <= 1 ? 75 : s - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <Accessory
      tone="needs-you"
      meta="Sign-in request"
      countdown={left}
      announceAt={[60, 30, 10]}
      title="Chrome on Windows"
      announce="Sign-in request from Chrome on Windows."
      action={{ label: "Review", onClick: onReview }}
    />
  )
}

export default function AccessoryView() {
  const [said, setSaid] = useState("Tap a strip, or swipe up on it")
  const [finished, setFinished] = useState(true)

  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="Neutral // raised, a hairline, label meta">
        <Accessory meta="SEA-48 // Running 04:12" title="Add baseline drift check" action={{ label: "Review diff", onClick: () => setSaid("Review diff") }} />
      </Specimen>

      <Specimen label="Live // the 8px square, live meta">
        <Accessory
          tone="live"
          meta="SEA-48 // Running 04:12"
          title="Add baseline drift check"
          action={{ label: "Review diff", onClick: () => setSaid("Review diff") }}
          onOpen={() => setSaid("Opened the task sheet")}
          openLabel="Open the task"
        />
      </Specimen>

      <Specimen label="Needs you // the yellow, one solid action, never dismissed">
        <Accessory
          tone="needs-you"
          meta="SEA-48 // Running 04:12"
          title="Add baseline drift check"
          action={{ label: "Review diff", onClick: () => setSaid("Review diff") }}
          onDismiss={() => setSaid("This never runs")}
        />
      </Specimen>

      <Specimen label="Broken // never a strip: a critical Banner at the top of its section (Unicron 67)">
        <Banner
          tone="critical"
          title="Spend paused at $10.00"
          body="New tasks wait until you raise the cap."
          action={
            <Button variant="secondary" size="sm" onClick={() => setSaid("Open spend")}>
              Open spend
            </Button>
          }
        />
      </Specimen>

      <Specimen label="Progress // the undo-send window, 10 segments">
        <Accessory
          tone="live"
          meta="Sending // 08 s"
          title="Cabin for the 20th, confirmed"
          action={{ label: "Undo", onClick: () => setSaid("Send undone") }}
          progress={{ value: 8, max: 10 }}
          announce="Sending. 10 seconds to undo."
          onOpen={() => setSaid("Opened the Outbox")}
          openLabel="Open the Outbox"
        />
      </Specimen>

      <Specimen label="Countdown // the seconds follow the meta, hidden from screen readers; one sentence is said">
        <Accessory
          tone="live"
          meta="Sending"
          countdown={8}
          title="Board games for the cabin"
          action={{ label: "Undo", onClick: () => setSaid("Send undone") }}
          progress={{ value: 8, max: 10 }}
          announce="Sending. 10 seconds to undo."
          onOpen={() => setSaid("Opened the Outbox")}
          openLabel="Open the Outbox"
        />
        <Accessory tone="needs-you" meta="Sign-in request" countdown={94} title="Chrome on Windows" action={{ label: "Review", onClick: () => setSaid("Review") }} onOpen={() => setSaid("Opened the request")} />
      </Specimen>

      <Specimen label="Warned before time runs out // announceAt [60, 30, 10]: each mark is said once (Unicron 33)">
        <TickingRequest onReview={() => setSaid("Review")} />
      </Specimen>

      <Specimen label="Dismissable // a finished background task">
        {finished ? (
          <Accessory
            tone="live"
            meta="Background // Finished 14:26 // $0.61"
            title="Full test suite passed: 128 of 128"
            action={{ label: "Open report", onClick: () => setSaid("Open report") }}
            onDismiss={() => setFinished(false)}
          />
        ) : (
          <FloatButton label="Show it again" icon="renew" onClick={() => setFinished(true)} />
        )}
      </Specimen>

      <Specimen label="Compact // inside the bottom row once scrolled: text cut, no action, or its glyph">
        <div className="flex items-center gap-2">
          <FloatButton label="Search" icon="search" size="l" />
          <TabBar label="Sections" value="tasks" minimized>
            <TabBarItem value="chat" icon="chat" label="Chat" />
            <TabBarItem value="docs" icon="document" label="Docs" />
            <TabBarItem value="tasks" icon="task" label="Tasks" />
          </TabBar>
          <Accessory compact tone="live" meta="Tasks // 03 running" title="SEA-48 running 04:12" onOpen={() => setSaid("Opened the task")} />
          <FloatButton label="New task" icon="add" kind="primary" size="l" />
        </div>
        <div className="flex items-center gap-2">
          <FloatButton label="Search" icon="search" size="l" />
          <Accessory compact tone="needs-you" meta="Lockdown // Sign-in request" title="Steam on a Windows PC" action={{ label: "Review sign-in", icon: "launch" }} />
          <FloatButton label="New item" icon="add" kind="primary" size="l" />
        </div>
      </Specimen>

      <p className="type-caption text-support-foreground" aria-live="polite">
        {said}
      </p>
    </div>
  )
}
