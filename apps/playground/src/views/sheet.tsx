// Sheet, as Figma draws it (32:122 Sheet Header; Lockdown 11, Vale 05): a bottom sheet on the
// raised surface with the grabber, the Sheet Header and its close, two heights; the side panel of
// AdaptiveSheetContent on a desktop. View: ?view=sheet
import {
  AdaptiveSheetContent,
  Button,
  FieldRow,
  Icon,
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverline,
  SheetTitle,
} from "@unicron/ui"

import { Stage } from "./_stage"

export default function SheetView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-6">
        <Stage label="Content height // the review sheet (Lockdown 11)" width={390} height={844} app="lockdown">
          {(container) => (
            <Sheet open modal={false}>
              <SheetContent side="bottom" container={container}>
                <SheetHeader>
                  <SheetOverline>Sign-in request // 00:40 ago</SheetOverline>
                  <SheetTitle>Steam on a Windows PC</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  <div className="flex flex-col">
                    <FieldRow size="stacked" label="Account">kestrel.04</FieldRow>
                    <FieldRow size="stacked" label="Device">Windows 11 // Edge 131</FieldRow>
                    <FieldRow size="stacked" label="Near">Sacramento, CA</FieldRow>
                    <FieldRow size="stacked" label="Time">14:31</FieldRow>
                  </div>
                  <SheetDescription>Not you? Deny, and Lockdown locks this login until you change the password.</SheetDescription>
                </SheetBody>
                <SheetFooter>
                  <Button variant="secondary">
                    <Icon name="close" />
                    Deny
                  </Button>
                  <Button>
                    <Icon name="fingerprint-recognition" />
                    Approve with Face ID
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </Stage>

        <Stage label="Full height // a long form or a list" width={390} height={844} app="vale">
          {(container) => (
            <Sheet open modal={false}>
              <SheetContent side="bottom" height="full" container={container}>
                <SheetHeader>
                  <SheetOverline>Mail // personal</SheetOverline>
                  <SheetTitle>Signatures</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  {["Personal // Mira Chen", "Work // Mira Chen, Pine Hollow Lodge", "Short // MC"].map((line) => (
                    <div key={line} className="rule-t flex flex-col gap-1 py-3">
                      <span className="type-ui-emphasis">{line.split(" // ")[0]}</span>
                      <span className="type-caption text-text-secondary">{line.split(" // ")[1]}</span>
                    </div>
                  ))}
                </SheetBody>
                <SheetFooter>
                  <Button>
                    <Icon name="add" />
                    New signature
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </Stage>

        <Stage label="No close button // a sheet closed by its own action" width={390} height={844} app="warpcore">
          {(container) => (
            <Sheet open modal={false}>
              <SheetContent side="bottom" showCloseButton={false} container={container}>
                <SheetHeader>
                  <SheetOverline>SEA-48 // running 04:12</SheetOverline>
                  <SheetTitle>Add baseline drift check</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  <SheetDescription size="body">Claude Code is running the check against main. It writes nothing until you approve.</SheetDescription>
                </SheetBody>
                <SheetFooter>
                  <Button variant="secondary">Stop</Button>
                  <Button>Open task</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          )}
        </Stage>
      </div>

      <Stage label="Desktop // AdaptiveSheetContent from sm up: a panel on the right" width={1392} height={560} app="synapse">
        {(container) => (
          <Sheet open modal={false}>
            <AdaptiveSheetContent container={container}>
              <SheetHeader>
                <SheetOverline>Check // failing</SheetOverline>
                <SheetTitle>identity.unique</SheetTitle>
              </SheetHeader>
              <SheetBody>
                <SheetDescription size="body">Every persona has one id. Two personas in this workspace share the id “reviewer”.</SheetDescription>
              </SheetBody>
              <SheetFooter>
                <Button variant="secondary">Open in Checks</Button>
                <Button>Fix with an agent</Button>
              </SheetFooter>
            </AdaptiveSheetContent>
          </Sheet>
        )}
      </Stage>
    </div>
  )
}
