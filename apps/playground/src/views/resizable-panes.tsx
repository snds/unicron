// ResizablePanes: the handle is the 1px rule, ink under the pointer, a square grip for touch. View: ?view=resizable-panes
import { ResizableHandle, ResizablePane, ResizablePanes } from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

export default function ResizablePanesView() {
  return (
    <Page>
      <Specimen label="Side by side // with a grip; stacked">
        <div className="h-64 w-full max-w-3xl rule-box">
          <ResizablePanes>
            <ResizablePane defaultSize="45%" minSize="25%">
              <div className="flex h-full flex-col gap-1 p-4">
                <p className="type-overline">Conversation</p>
                <p className="type-ui">Add baseline drift check</p>
              </div>
            </ResizablePane>
            <ResizableHandle label="Resize the conversation" withGrip />
            <ResizablePane defaultSize="55%" minSize="25%">
              <div className="flex h-full flex-col gap-1 p-4">
                <p className="type-overline">Artifact // diff</p>
                <p className="type-ui">OPAQUE migration diff</p>
              </div>
            </ResizablePane>
          </ResizablePanes>
        </div>
        <div className="h-64 w-full max-w-md rule-box">
          <ResizablePanes orientation="vertical">
            <ResizablePane defaultSize="60%">
              <p className="type-ui p-4">Cabin for the 20th, confirmed</p>
            </ResizablePane>
            <ResizableHandle label="Resize the preview" />
            <ResizablePane defaultSize="40%">
              <p className="type-caption p-4 text-support-foreground">Booked the two-bedroom. Check-in is after 3.</p>
            </ResizablePane>
          </ResizablePanes>
        </div>
      </Specimen>
    </Page>
  )
}
