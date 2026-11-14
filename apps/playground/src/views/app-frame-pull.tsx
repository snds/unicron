// Pull to refresh (contract 5.1c C9, Lockdown LA6): `onRefresh` on a phone column. A pull down from
// the top past 64 runs it; the content follows with resistance (it does not move under reduced
// motion); the app's live status shows in the status strip while it runs; a plain "Check again"
// stays beside it for everyone the gesture does not suit. The three still frames are held mid-pull
// by real pointer events, so the picture shows the frame's own drawing. View: ?view=app-frame-pull
import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameTopRow,
  AppLockup,
  Button,
  FloatButton,
  ListRow,
  TabBar,
  TabBarItem,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

const ITEMS = [
  { name: "Steam", meta: "mira.chen // steampowered.com", status: "Reused" },
  { name: "Fastmail", meta: "mira.chen@fastmail.com", status: "Strong" },
  { name: "Ledger Bank", meta: "mchen // ledger.co", status: "Strong" },
  { name: "Figma", meta: "mira@ledger.co // figma.com", status: "Weak" },
  { name: "Pine Hollow Cabins", meta: "mira.chen // pinehollow.com", status: "Strong" },
]

/** Lockdown's Health list: a pull checks for breaches again; so does the plain action in the head. */
function Health({ onRefresh, checking }: { onRefresh: () => unknown; checking: boolean }) {
  return (
    <>
      <AppFrameTopRow lockup={<AppLockup name="Lockdown" />} actions={<FloatButton label="Settings" icon="settings" size="l" />} />
      <AppFrameMain>
        <AppFrameList aria-label="Health" onRefresh={onRefresh}>
          <AppFramePageHead
            overline="Health // 248 items"
            title="Health"
            actions={
              <Button variant="ghost" size="sm" loading={checking} onClick={() => void onRefresh()}>
                Check again
              </Button>
            }
          />
          <ul aria-label="Items" className="flex flex-col">
            {ITEMS.map((item) => (
              <ListRow key={item.name} render={<li />} title={item.name} meta={item.meta} status={item.status} href="#item" />
            ))}
          </ul>
        </AppFrameList>
      </AppFrameMain>
      {checking ? <AppFrameAccessory tone="live" meta="Checking // 248 items" title="Checking for breaches" announce="Checking 248 items for breaches." /> : null}
      <AppFrameBottomRow
        start={<FloatButton label="Search" icon="search" size="l" />}
        tabs={
          <TabBar label="Sections" value="health">
            <TabBarItem value="items" icon="password" label="Items" />
            <TabBarItem value="codes" icon="time" label="Codes" />
            <TabBarItem value="health" icon="security" label="Health" />
          </TabBar>
        }
        end={<FloatButton label="New item" icon="add" kind="primary" size="l" />}
      />
    </>
  )
}

/** A phone frame whose list holds a pull of `travel` px from the top (and lets go, with `release`). */
function Held({ label, travel, release = false }: { label: string; travel: number; release?: boolean }) {
  const [checking, setChecking] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const onRefresh = () => {
    setChecking(true)
    // Held for the picture; an app's check settles and the strip goes.
    return new Promise<void>(() => {})
  }

  useEffect(() => {
    if (travel <= 0) return
    let frame = 0
    let tries = 0
    const drive = () => {
      const list = box.current?.querySelector<HTMLElement>('[data-slot="app-frame-list"][data-pull-ready]')
      if (!list) {
        if (tries++ < 120) frame = requestAnimationFrame(drive)
        return
      }
      const at = list.getBoundingClientRect()
      const x = at.left + at.width / 2
      const y = at.top + 160
      const send = (type: string, dy: number) =>
        list.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 41, isPrimary: true, button: 0, pointerType: "touch", clientX: x, clientY: y + dy }))
      send("pointerdown", 0)
      send("pointermove", 12)
      send("pointermove", travel)
      if (release) send("pointerup", travel)
    }
    frame = requestAnimationFrame(drive)
    return () => cancelAnimationFrame(frame)
  }, [travel, release])

  return (
    <div ref={box}>
      <FrameBox width={390} height={640} layout="phone" label={label}>
        <Health onRefresh={onRefresh} checking={checking} />
      </FrameBox>
    </div>
  )
}

function Row({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-6">{children}</div>
}

export default function AppFramePullView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Pull to refresh // from the top of a phone column; a plain Check again beside it">
        <Row>
          <Held label="At rest // pull down from the top, or press Check again" travel={0} />
          <Held label="Pulling // short of the line: the down arrow" travel={44} />
          <Held label="Past 64 // let go to check: the renew glyph" travel={110} />
          <Held label="Let go // the strip shows the app's live status while it runs" travel={110} release />
        </Row>
      </Specimen>
    </div>
  )
}
