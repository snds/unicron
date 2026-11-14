// NeedsYou: Figma's Needs You (15:517), one per screen, as each app fills it; the // +1 suffix and two text actions (contract 5.1b #40). View: ?view=needs-you
import type { ReactNode } from "react"
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogOverline,
  DialogTitle,
  NeedsYou,
  NeedsYouProvider,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetOverline,
  SheetTitle,
  TextField,
} from "@unicron/ui"

import { Stage } from "./_stage"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-[648px] flex-col">{children}</div>
    </section>
  )
}

export default function NeedsYouView() {
  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // 24 in, one solid action, one text action">
        <NeedsYou
          announce={false}
          title="Awaiting your review // SEA-51"
          body="Claude Code changed 6 files."
          action={<Button variant="needs-you">Review diff</Button>}
          secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
        />
      </Specimen>

      <Specimen label="One more waits // the title ends +1">
        <NeedsYou
          announce={false}
          title="Awaiting your review // SEA-51"
          more={1}
          body="Claude Code changed 6 files: 212 lines added, 48 removed. All 128 tests pass."
          action={<Button variant="needs-you">Review diff</Button>}
          secondaryAction={<Button variant="needs-you-text">Pause task</Button>}
        />
      </Specimen>

      <Specimen label="Two text actions // an invitation">
        <NeedsYou
          announce={false}
          title="Invitation // Wed 11.18"
          body="Dentist, 16:30 – 17:15, Sierra Dental, Roseville"
          action={<Button variant="needs-you">Accept</Button>}
          secondaryActions={[
            <Button key="maybe" variant="needs-you-text">
              Maybe
            </Button>,
            <Button key="decline" variant="needs-you-text">
              Decline
            </Button>,
          ]}
        />
      </Specimen>

      <Specimen label="Lockdown // a sign-in request; Synapse // two harness changes">
        <div className="flex flex-col gap-8">
          <NeedsYou
            announce={false}
            title="Sign-in request // 00:40 ago"
            body="Steam on a Windows PC is asking to sign in as kestrel.04."
            action={<Button variant="needs-you">Review sign-in</Button>}
            secondaryAction={<Button variant="needs-you-text">Deny</Button>}
          />
          <NeedsYou
            announce={false}
            title="Awaiting your review // 02 harness changes"
            body="Claude Code and Codex proposed changes to visual-qa and the UI harness."
            action={<Button variant="needs-you">Review H-09</Button>}
            secondaryAction={<Button variant="needs-you-text">See both</Button>}
          />
        </div>
      </Specimen>

      {/* Each compact specimen has a scope of its own, so it hides only the block beside it. */}
      <Specimen label="Compact // one 48 line, the title and one solid action, for the top of an open dialog or sheet (Lockdown LA8)">
        <div className="flex flex-col gap-4">
          <NeedsYouProvider>
            <NeedsYou size="compact" announce={false} title="Sign-in request // 01:40 left" action={<Button variant="needs-you" size="sm">Review</Button>} />
          </NeedsYouProvider>
          <NeedsYouProvider>
            <NeedsYou size="compact" announce={false} more={1} title="Pairing request // Chrome on Linux // 01:12 left" action={<Button variant="needs-you" size="sm">Review</Button>} />
          </NeedsYouProvider>
        </div>
      </Specimen>

      <div className="flex flex-wrap gap-6">
        <NeedsYouProvider>
          <Stage label="Before // the request waits as the block on the page" width={760} height={560} app="lockdown">
            {() => <PageBlock />}
          </Stage>
        </NeedsYouProvider>
        <NeedsYouProvider>
          <Stage label="A form is open // the request shows as the line at the dialog's top; the block behind the scrim hides: one yellow shape" width={760} height={560} app="lockdown">
            {(container) => (
              <>
                <PageBlock />
                <Dialog open modal={false}>
                  <DialogContent size="question" container={container} notice={<RequestLine />}>
                    <DialogHeader>
                      <DialogOverline>Edit // personal vault</DialogOverline>
                      <DialogTitle>Steam</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                      <TextField label="Username" defaultValue="kestrel.04" />
                    </DialogBody>
                    <DialogFooter>
                      <Button variant="secondary">Cancel</Button>
                      <Button>Save</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </Stage>
        </NeedsYouProvider>
        <NeedsYouProvider>
          <Stage label="Phone // the line at the top of a sheet" width={390} height={640} app="lockdown">
            {(container) => (
              <Sheet open modal={false}>
                <SheetContent side="bottom" container={container} notice={<RequestLine />}>
                  <SheetHeader>
                    <SheetOverline>Edit // personal vault</SheetOverline>
                    <SheetTitle>Steam</SheetTitle>
                  </SheetHeader>
                  <SheetBody>
                    <TextField label="Username" defaultValue="kestrel.04" />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </Stage>
        </NeedsYouProvider>
      </div>
    </div>
  )
}

/** The sign-in request as the page's block, at the top of the content (Lockdown X3 row 1). */
function PageBlock() {
  return (
    <div className="absolute inset-x-0 top-0 p-4">
      <NeedsYou
        announce={false}
        title="Sign-in request // 01:40 left"
        body="A browser on this Mac asks to use the passkey for github.com."
        action={<Button variant="needs-you">Review</Button>}
        secondaryAction={<Button variant="needs-you-text">Decline</Button>}
      />
    </div>
  )
}

/** The same request as the compact line on a layer. */
function RequestLine() {
  return <NeedsYou size="compact" announce={false} title="Sign-in request // 01:40 left" action={<Button variant="needs-you" size="sm">Review</Button>} />
}
