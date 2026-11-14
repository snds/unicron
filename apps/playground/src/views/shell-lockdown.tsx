// Lockdown's first screen, the items with a sign-in request, as one composition of the frame's
// parts: the sidebar, the status line, list + detail at 1440 (Desktop 01, 41:720); the floating
// rows, the needs-you strip and the scrolled chrome at 390 (Phone 01, 40:45; States 02, 51:8443).
// It switches by width. Rows, fields and the needs-you block are stand-ins (./_shell-parts) until
// data-a, data-b and security land. View: ?view=shell-lockdown
import { Fragment, useState } from "react"
import {
  AppFrame,
  AppFrameAccessory,
  AppFrameBottomRow,
  AppFrameDetail,
  AppFrameInset,
  AppFrameList,
  AppFrameMain,
  AppFramePageHead,
  AppFrameSidebar,
  AppFrameStatusLine,
  AppFrameTopRow,
  Button,
  FloatButton,
  StatusItem,
  useAppFrame,
} from "@unicron/ui"
import { AppLockup } from "@unicron/ui/app-lockup"
import { NavItem, NavSection } from "@unicron/ui/nav-item"
import { TabBar, TabBarItem } from "@unicron/ui/tab-bar"
import { TopBar } from "@unicron/ui/top-bar"

import { StandInChips, StandInField, StandInInlineRow, StandInLetter, StandInNeedsYou, StandInRows, StandInSearch } from "./_shell-parts"

const ITEMS = [
  { letter: "S", id: "spotify", title: "Spotify", meta: "spotify.com", status: "Passkey" },
  { letter: "S", id: "steam", title: "Steam", meta: "store.steampowered.com", status: "Passkey + Code" },
  { letter: "S", id: "stripe", title: "Stripe", meta: "dashboard.stripe.com", status: "Login" },
  { letter: "S", id: "synology", title: "Synology", meta: "quickconnect.to", status: "Login + Code" },
  { letter: "T", id: "tailscale", title: "Tailscale", meta: "login.tailscale.com", status: "Passkey" },
  { letter: "T", id: "ticketmaster", title: "Ticketmaster", meta: "ticketmaster.com", status: "Login // Weak" },
]

function Items() {
  const frame = useAppFrame()
  const [section, setSection] = useState("items")
  const [picked, setPicked] = useState<string | null>(null)
  const open = picked ?? (frame.split ? "steam" : null)
  const pushed = open !== null && !frame.split
  // The phone draws Steam first (the item with the request); the desktop list is A to Z under letters.
  const phoneOrder = ["steam", "spotify", "stripe", "synology", "tailscale", "ticketmaster"]
  const rows = frame.split ? ITEMS : phoneOrder.map((id) => ITEMS.find((i) => i.id === id)!)

  return (
    <>
      <AppFrameSidebar
        lockup={<AppLockup name="Lockdown" />}
        action={{ label: "New item", icon: "add" }}
        footer={<NavItem label="Settings" icon="settings" href="#settings" />}
      >
        <NavSection title="Items // 06 types">
          <NavItem label="All items" icon="folder" count={248} current href="#all" />
          <NavItem label="Logins" icon="password" count={142} href="#logins" />
          <NavItem label="Passkeys" icon="locked" count={61} href="#passkeys" />
          <NavItem label="Codes" icon="time" count={18} href="#codes" />
          <NavItem label="Cards" icon="wallet" count={4} href="#cards" />
          <NavItem label="Notes" icon="document" count={23} href="#notes" />
        </NavSection>
        <NavSection title="Vaults" count={2}>
          <NavItem label="Personal" icon="user--avatar" count={231} href="#personal" />
          <NavItem label="Family" icon="user--multiple" count={17} href="#family" />
        </NavSection>
        <NavSection title="Tools">
          <NavItem label="Health" icon="checkmark--outline" count={92} href="#health" />
        </NavSection>
      </AppFrameSidebar>

      <AppFrameStatusLine crumbs={[{ label: "Items", href: "#items" }, { label: "All" }]}>
        <StatusItem text="Health // 092 // 3 weak" />
      </AppFrameStatusLine>

      {pushed ? (
        <AppFrameTopRow>
          <TopBar onBack={() => setPicked(null)} actions={<FloatButton label="Edit" icon="edit" size="l" />} />
        </AppFrameTopRow>
      ) : (
        <AppFrameTopRow lockup={<AppLockup name="Lockdown" />} title="Personal" actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
      )}

      <AppFrameMain>
        <AppFrameList aria-label="Items">
          {frame.split ? (
            <StandInSearch placeholder="Search 248 items" />
          ) : (
            <>
              <AppFramePageHead overline="Personal vault // 6 types" title="Items" count={248} />
              <AppFrameInset>
              <div className="pb-4">
                <StandInChips label="Show" chips={["All 248", "Logins", "Passkeys", "Cards"]} active="All 248" />
              </div>
            </AppFrameInset>
            </>
          )}
          <StandInRows label="Items">
            {rows.map((item, i) => (
              <Fragment key={item.id}>
                {frame.split && (i === 0 || rows[i - 1].letter !== item.letter) ? (
                  <li className="flex flex-col">
                    <StandInLetter letter={item.letter} count={item.letter === "S" ? "04" : "02"} />
                  </li>
                ) : null}
                <StandInInlineRow title={item.title} meta={item.meta} status={item.status} selected={frame.split && item.id === open} onOpen={() => setPicked(item.id)} />
              </Fragment>
            ))}
          </StandInRows>
        </AppFrameList>
        <AppFrameDetail open={picked !== null} onBack={() => setPicked(null)} aria-label="Steam">
          {open ? (
            <AppFrameInset>
              <div className="flex flex-col gap-6">
              <AppFramePageHead size={frame.split ? "lg" : "md"} overline="Login // Passkey + Code // Steam Guard" title="Steam" meta="store.steampowered.com // added 2024.03.11" metaPosition="below" />
              {frame.split ? (
                <StandInNeedsYou
                  overline="Sign-in request // 00:40 ago"
                  body="Steam on a Windows PC is asking to sign in as kestrel.04."
                  actions={
                    <>
                      <Button variant="needs-you">Review sign-in</Button>
                      <Button variant="needs-you-text">Deny</Button>
                    </>
                  }
                />
              ) : null}
              <div className="flex flex-col">
                <StandInField label="Username" value="kestrel.04" action="Copy" />
                <StandInField label="Password" value="••••••••••••••" action="Reveal" />
                <StandInField label="Passkey" value="Lockdown // 2026.10.02" />
              </div>
            </div>
            </AppFrameInset>
          ) : null}
        </AppFrameDetail>
      </AppFrameMain>

      <AppFrameAccessory
        tone="needs-you"
        meta={frame.minimized ? "Personal // 1 request" : "Sign-in request // 00:40 ago"}
        title="Steam on a Windows PC"
        action={{ label: "Review" }}
        announce="Steam on a Windows PC is asking to sign in."
      />

      {pushed ? (
        <AppFrameBottomRow
          variant="detail"
          start={<FloatButton label="Copy username" icon="copy" size="l" />}
          end={<FloatButton label="Copy password" icon="copy" kind="primary" size="l" extended />}
        />
      ) : (
        <AppFrameBottomRow
          start={<FloatButton label="Search" icon="search" size="l" />}
          tabs={
            <TabBar label="Sections" value={section} onValueChange={setSection}>
              <TabBarItem value="items" icon="password" label="Items" />
              <TabBarItem value="codes" icon="time" label="Codes" />
              <TabBarItem value="health" icon="checkmark--outline" label="Health" />
            </TabBar>
          }
          end={<FloatButton label="New item" icon="add" kind="primary" size="l" longPressLabel="Quick create" onLongPress={() => {}} />}
        />
      )}
    </>
  )
}

export default function ShellLockdown() {
  return (
    <AppFrame>
      <Items />
    </AppFrame>
  )
}
