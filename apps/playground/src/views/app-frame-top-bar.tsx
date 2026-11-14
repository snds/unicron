// AppFrameTopBar: Warpcore's desktop bar (Desktop 01): the lockup, the top tabs, the spend status,
// the primary and the float buttons, 64 high over a hairline. Narrower, it gives up room in
// Warpcore's order (U-01): the status's short form, the wordmark, the primary's word, the tab
// numbers, the tab words. The status never hides. View: ?view=app-frame-top-bar
import {
  AppFrameColumn,
  AppFrameMain,
  AppFrameTopBar,
  AppLockup,
  FloatButton,
  StatusItem,
  TopTab,
  TopTabs,
} from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"

function Bar({ tab = "tasks", action = "New task" }: { tab?: string; action?: string }) {
  return (
    <>
      <AppFrameTopBar
        lockup={<AppLockup name="Warpcore" />}
        tabs={
          <TopTabs label="Sections">
            <TopTab label="Chat" index="01" icon="chat" current={tab === "chat"} href="#chat" />
            <TopTab label="Docs" index="02" icon="document" current={tab === "docs"} href="#docs" />
            <TopTab label="Tasks" index="03" icon="task" current={tab === "tasks"} href="#tasks" mark={{ count: 2, tone: "needs-you" }} />
          </TopTabs>
        }
        status={<StatusItem text="Spend // $3.40 of $10.00" short="$3.40" href="#spend" />}
        action={{ label: action, icon: "add" }}
        actions={
          <>
            <FloatButton label="Search" icon="search" />
            <FloatButton label="Settings" icon="settings" mark={{ count: 1, label: "Update ready" }} />
          </>
        }
      />
      <AppFrameMain>
        <AppFrameColumn aria-label="Content" />
      </AppFrameMain>
    </>
  )
}

export default function AppFrameTopBarView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Expanded // 1440: everything, the lockup in the sidebar's column, the tabs on the content's line">
        <FrameBox width={1440} height={120} layout="expanded" label="Warpcore // Tasks">
          <Bar />
        </FrameBox>
      </Specimen>
      <Specimen label="Chat workspace // the primary follows the tab">
        <FrameBox width={1440} height={120} layout="expanded" label="Warpcore // Chat">
          <Bar tab="chat" action="New chat" />
        </FrameBox>
      </Specimen>
      <Specimen label="Medium // the bar gives up room one step at a time, in Warpcore's order">
        <div className="flex flex-col gap-4">
          {[1000, 860, 760, 680, 600].map((width) => (
            <FrameBox key={width} width={width} height={120} layout="medium" label={`${width} wide`}>
              <Bar />
            </FrameBox>
          ))}
        </div>
      </Specimen>
    </div>
  )
}
