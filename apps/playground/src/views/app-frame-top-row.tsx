// AppFrameTopRow: the phone's floating top row, as the phone frames draw it (Vale Mobile / 01,
// Lockdown Phone 01, Warpcore Mobile 06), its scrolled form (States 02: mark only, the small
// centred title, a hairline), a pushed screen's TopBar, the switcher as the small title, and the
// short screen, where its buttons move to the trailing column. View: ?view=app-frame-top-row
import { AppFrameList, AppFrameMain, AppFramePageHead, AppFrameTopRow, FloatButton } from "@unicron/ui"
import { AppLockup } from "@unicron/ui/app-lockup"
import { TopBar } from "@unicron/ui/top-bar"

import { FrameBox, Specimen } from "./_frame-boxes"

function Head({ title = "Today", overline = "Inbox // 012 unread", meta, switcher }: { title?: string; overline?: string; meta?: string; switcher?: boolean }) {
  return (
    <AppFrameMain>
      <AppFrameList aria-label={title}>
        <AppFramePageHead overline={overline} title={title} meta={meta} switcher={switcher ? { label: "Switch workspace" } : undefined} />
      </AppFrameList>
    </AppFrameMain>
  )
}

export default function AppFrameTopRowView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="At rest // the lockup, one float button, 16 from the edges, 48 high">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={240} layout="phone" label="Vale // lockup and profile">
            <AppFrameTopRow lockup={<AppLockup name="Vale" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
            <Head meta="THU 11.12" />
          </FrameBox>
          <FrameBox width={390} height={240} layout="phone" label="Warpcore // two float buttons">
            <AppFrameTopRow
              lockup={<AppLockup name="Warpcore" />}
              actions={
                <>
                  <FloatButton label="Search" icon="search" size="l" />
                  <FloatButton label="Settings" icon="settings" size="l" mark={{ square: true, label: "Update ready" }} />
                </>
              }
            />
            <Head title="Tasks" overline="Tasks // 03 running // 01 waiting on you" />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Scrolled // the wordmark hides, the small centred title shows, a hairline under the row">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={160} layout="phone" minimized label="Vale // Inbox">
            <AppFrameTopRow lockup={<AppLockup name="Vale" />} title="Inbox" actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
            <Head />
          </FrameBox>
          <FrameBox width={390} height={160} layout="phone" minimized label="Synapse // the small title is the switcher">
            <AppFrameTopRow lockup={<AppLockup name="Synapse" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
            <Head title="Overview" overline="Personal // Workspace health" switcher />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="A pushed screen // TopBar in the row; the head's title arrives once it has scrolled away">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={240} layout="phone" label="Lockdown // Steam, at rest">
            <AppFrameTopRow>
              <TopBar onBack={() => {}} actions={<FloatButton label="Edit" icon="edit" size="l" />} />
            </AppFrameTopRow>
            <Head title="Steam" overline="Login // Passkey + Code" />
          </FrameBox>
          <FrameBox width={390} height={160} layout="phone" minimized label="Lockdown // Steam, scrolled">
            <AppFrameTopRow>
              <TopBar onBack={() => {}} actions={<FloatButton label="Edit" icon="edit" size="l" />} />
            </AppFrameTopRow>
            <Head title="Steam" overline="Login // Passkey + Code" />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Short screen // no top row: its buttons lead the trailing column; the head is its small title">
        <FrameBox width={844} height={390} layout="rail" label="Vale // 844 × 390">
          <AppFrameTopRow lockup={<AppLockup name="Vale" />} actions={<FloatButton label="Settings" icon="user--avatar" size="l" />} />
          <Head />
        </FrameBox>
      </Specimen>
    </div>
  )
}
