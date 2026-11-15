// AppFrame: one composition, four shells, picked by the width (contract 5.2). The same Vale inbox
// in a contained frame of each size: phone (390), short (a phone on its side, 844 × 390), medium
// (820: the sidebar as its rail, one column) and expanded (1280: sidebar, list + detail). Nothing
// in the composition is a media query. View: ?view=app-frame
import { FrameBox, Specimen } from "./_frame-boxes"
import { ValeInbox } from "./shell-vale"

export default function AppFrameView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="Compact // under 600: the phone chrome">
        <div className="flex flex-wrap gap-6">
          <FrameBox width={390} height={844} label="Phone // 390 × 844">
            <ValeInbox />
          </FrameBox>
          <FrameBox width={390} height={844} minimized label="Phone, scrolled // the chrome minimized">
            <ValeInbox />
          </FrameBox>
        </div>
      </Specimen>
      <Specimen label="Short // a phone on its side: the bottom row as a trailing column">
        <FrameBox width={844} height={390} label="Short // 844 × 390">
          <ValeInbox />
        </FrameBox>
      </Specimen>
      <Specimen label="Medium // 600 to 1023: the sidebar as its rail, one content column">
        <FrameBox width={820} height={640} label="Medium // 820 × 640">
          <ValeInbox />
        </FrameBox>
      </Specimen>
      <Specimen label="Expanded // 1024 up: the sidebar, list + detail">
        <FrameBox width={1280} height={800} label="Expanded // 1280 × 800">
          <ValeInbox />
        </FrameBox>
      </Specimen>
    </div>
  )
}
