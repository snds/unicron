// AppFrameFocus: the whole app is closed until the person signs in, unlocks or finishes the first
// run (decisions §4): no chrome, one centred column of 432 with the lockup at its top and one
// primary. A flow of several steps shows a folio. View: ?view=app-frame-focus
import { AppFrameFocus, AppLockup, Button } from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"
import { StandInSearch } from "./_shell-parts"

function Unlock() {
  return (
    <AppFrameFocus lockup={<AppLockup name="Lockdown" />}>
      <div className="flex flex-col gap-2">
        <p className="type-overline text-text-label">Personal vault // locked</p>
        <h1 className="type-title text-text-body">Unlock Personal</h1>
      </div>
      <StandInSearch placeholder="Master password" />
      <Button block size="lg">
        Unlock
      </Button>
    </AppFrameFocus>
  )
}

function FirstRun() {
  return (
    <AppFrameFocus lockup={<AppLockup name="Vale" />} folio="Step 01 // 02">
      <div className="flex flex-col gap-2">
        <p className="type-overline text-text-label">Welcome</p>
        <h1 className="type-title text-text-body">Add your first account.</h1>
        <p className="type-body text-text-secondary">Vale reads your mail on this device. Nothing leaves it unless you send it.</p>
      </div>
      <div className="flex items-center gap-4">
        <Button>Continue</Button>
        <Button variant="ghost">Not now</Button>
      </div>
    </AppFrameFocus>
  )
}

export default function AppFrameFocusView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Unlock // one step, no folio (Lockdown Phone 13 and Desktop 10)">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={1180} height={560} layout="expanded" label="Desktop">
            <Unlock />
          </FrameBox>
          <FrameBox width={390} height={560} layout="phone" label="Phone">
            <Unlock />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="First run // the folio at the end of the lockup's row">
        <FrameBox width={1180} height={480} layout="expanded" label="Vale // step 01 of 02">
          <FirstRun />
        </FrameBox>
      </Specimen>
    </div>
  )
}
