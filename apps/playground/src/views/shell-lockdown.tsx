// Lockdown's first screen, the items with a sign-in request, as one composition of the frame's
// parts: the sidebar, the status line, list + detail at 1440 (Desktop 01, 41:720); the floating
// rows, the needs-you strip and the scrolled chrome at 390 (Phone 01, 40:45; States 02, 51:8443).
// It switches by width. The search, letters, rows, field rows, secret, code and the needs-you block
// are the system's own parts. Beyond the frames, the screen carries what the decisions and the late
// asks add: Search with its key above the first group (decisions §6), and the trailing ⋯ on the
// password and the code (5.1c C18, LA5) with Show large type first (D242); its copy and show rows
// are the parts' own, so the vault's rules hold. View: ?view=shell-lockdown
import { Fragment, useState } from "react"
import {
  AdaptiveMenuItem,
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
  AppLockup,
  Button,
  CodeDisplay,
  CodeDisplayMenuItem,
  FieldRow,
  FieldRowAction,
  FilterChip,
  FilterChipGroup,
  FloatButton,
  ListRow,
  NavItem,
  NavSection,
  NeedsYou,
  SearchField,
  SecretField,
  SecretFieldMenuItem,
  SectionHeader,
  StatusItem,
  TabBar,
  TabBarItem,
  TopBar,
  useAppFrame,
  type SecretFieldHost,
} from "@unicron/ui"

const ITEMS = [
  { letter: "S", id: "spotify", title: "Spotify", meta: "spotify.com", status: "Passkey" },
  { letter: "S", id: "steam", title: "Steam", meta: "store.steampowered.com", status: "Passkey + Code" },
  { letter: "S", id: "stripe", title: "Stripe", meta: "dashboard.stripe.com", status: "Login" },
  { letter: "S", id: "synology", title: "Synology", meta: "quickconnect.to", status: "Login + Code" },
  { letter: "T", id: "tailscale", title: "Tailscale", meta: "login.tailscale.com", status: "Passkey" },
  { letter: "T", id: "ticketmaster", title: "Ticketmaster", meta: "ticketmaster.com", status: "Login // Weak" },
]

// The demo's vault: a password that is never fetched from anywhere real, a clipboard that only
// pretends, and a code clock held still at 18 seconds left (as the frame draws it).
const host: SecretFieldHost = {
  copy: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  clipboardHolds: () => Promise.resolve(true),
  gate: () => Promise.resolve(true),
}
const getPassword = () => Promise.resolve(new TextEncoder().encode("larch-ember-quartz-17"))
const AT = 1_800_000_000
const LETTER_COUNTS: Record<string, number> = { S: 4, T: 2 }

function Items() {
  const frame = useAppFrame()
  const [section, setSection] = useState("items")
  const [picked, setPicked] = useState<string | null>(null)
  const [show, setShow] = useState("all")
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
        <NavItem label="Search" icon="search" mark={{ keys: "/" }} href="#search" />
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
            <AppFrameInset>
              <SearchField aria-label="Search items" placeholder="Search 248 items" />
            </AppFrameInset>
          ) : (
            <>
              <AppFramePageHead overline="Personal vault // 6 types" title="Items" count={248} />
              <AppFrameInset>
                <div className="pb-4">
                  <FilterChipGroup label="Show" scroll value={show} onValueChange={setShow}>
                    <FilterChip value="all" count={248}>All</FilterChip>
                    <FilterChip value="logins">Logins</FilterChip>
                    <FilterChip value="passkeys">Passkeys</FilterChip>
                    <FilterChip value="cards">Cards</FilterChip>
                  </FilterChipGroup>
                </div>
              </AppFrameInset>
            </>
          )}
          {(frame.split ? ["S", "T"] : [null]).map((letter) => {
            const group = rows.filter((item) => letter === null || item.letter === letter)
            return (
              <Fragment key={letter ?? "all"}>
                {letter ? <SectionHeader variant="index" title={letter} count={LETTER_COUNTS[letter]} level={3} /> : null}
                <ul aria-label={letter ? `Items, ${letter}` : "Items"} className="flex flex-col">
                  {group.map((item) => (
                    <ListRow
                      key={item.id}
                      render={<li />}
                      title={item.title}
                      meta={item.meta}
                      metaStyle="plain"
                      status={item.status}
                      selected={frame.split && item.id === open}
                      onClick={() => setPicked(item.id)}
                    />
                  ))}
                </ul>
              </Fragment>
            )
          })}
        </AppFrameList>
        <AppFrameDetail open={picked !== null} onBack={() => setPicked(null)} aria-label="Steam">
          {open ? (
            <AppFrameInset>
              <div className="flex flex-col gap-6">
              <AppFramePageHead size={frame.split ? "lg" : "md"} overline="Login // Passkey + Code // Steam Guard" title="Steam" meta="store.steampowered.com // added 2024.03.11" metaPosition="below" />
              {frame.split ? (
                <NeedsYou
                  title="Sign-in request // 00:40 ago"
                  body="Steam on a Windows PC is asking to sign in as kestrel.04."
                  action={<Button variant="needs-you">Review sign-in</Button>}
                  secondaryAction={<Button variant="needs-you-text">Deny</Button>}
                />
              ) : null}
              <div className="flex flex-col">
                <FieldRow size={frame.split ? "default" : "stacked"} label="Username" action={<FieldRowAction>Copy</FieldRowAction>}>
                  kestrel.04
                </FieldRow>
                <SecretField
                  label="Password"
                  getSecret={getPassword}
                  host={host}
                  menu={
                    <>
                      <AdaptiveMenuItem icon="text--scale">Show large type</AdaptiveMenuItem>
                      <SecretFieldMenuItem action="reveal" />
                      <SecretFieldMenuItem action="copy" />
                    </>
                  }
                />
                <FieldRow size={frame.split ? "default" : "stacked"} label="Passkey">Lockdown // 2026.10.02</FieldRow>
                <CodeDisplay
                  layout="field"
                  label="Steam Guard"
                  variant="steam"
                  issuer="Steam"
                  account="kestrel.04"
                  code="R7K2N"
                  period={30}
                  expiresAt={AT}
                  now={AT - 18}
                  menu={
                    <>
                      <AdaptiveMenuItem icon="text--scale">Show large type</AdaptiveMenuItem>
                      <CodeDisplayMenuItem action="copy" />
                    </>
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <p className="type-overline text-text-label">Protected</p>
                <p className="type-caption text-text-secondary">The recovery secret has its own key. It never autofills and never reaches an agent.</p>
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
