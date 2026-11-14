// Dialog, as the app pages draw it (Lockdown D05 and D09, Vale D02): header with an overline, a
// lead title and the close button; body; actions at the right. Sizes by name. View: ?view=dialog
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverline,
  DialogTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Icon,
  Input,
  Switch,
  Textarea,
} from "@unicron/ui"

import { Specimen, Stage } from "./_stage"

/** A label over a value with a rule above, as the review dialog draws its Field Rows. */
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rule-t grid grid-cols-[156px_1fr] items-center gap-4 py-6 max-sm:grid-cols-1 max-sm:gap-1 max-sm:py-3">
      <span className="type-overline">{label}</span>
      <span className="type-code-inline">{value}</span>
    </div>
  )
}

export default function DialogView() {
  return (
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <Stage label="Form // 640, the default (Lockdown D05)" width={1392} height={720} app="lockdown">
        {(container) => (
          <Dialog open modal={false}>
            <DialogContent container={container}>
              <DialogHeader>
                <DialogOverline>New login // personal vault</DialogOverline>
                <DialogTitle>github.com</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel htmlFor="d-website">Website</FieldLabel>
                  <Input id="d-website" defaultValue="github.com" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-username">Username</FieldLabel>
                  <Input id="d-username" defaultValue="kestrel04" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-password">Password</FieldLabel>
                  <Input id="d-password" defaultValue="q7#Vw2!mLx9@Rk4$Tz8&Hn3p" />
                  <FieldDescription>Generated // 24 characters, symbols on. Strong.</FieldDescription>
                </Field>
                <div className="rule-b flex items-center justify-between gap-4 pb-4">
                  <div className="flex flex-col">
                    <span className="type-body">Add a one-time code</span>
                    <span className="type-caption text-text-secondary">Scan the QR code GitHub shows after sign-in.</span>
                  </div>
                  <Switch defaultChecked aria-label="Add a one-time code" />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button variant="secondary">Cancel</Button>
                <Button>
                  <Icon name="checkmark" />
                  Save login
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Stage>

      <Stage label="Review // 560 (Lockdown D09)" width={1392} height={640} app="lockdown">
        {(container) => (
          <Dialog open modal={false}>
            <DialogContent size="review" container={container}>
              <DialogHeader>
                <DialogOverline>Sign-in request // 00:40 ago</DialogOverline>
                <DialogTitle>Steam on a Windows PC</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <div className="flex flex-col">
                  <Row label="Account" value="kestrel.04" />
                  <Row label="Device" value="Windows 11 // Edge 131" />
                  <Row label="Near" value="Sacramento, CA" />
                  <Row label="Time" value="14:31" />
                </div>
                <DialogDescription>Not you? Deny, and Lockdown locks this login until you change the password.</DialogDescription>
              </DialogBody>
              <DialogFooter>
                <Button variant="secondary">
                  <Icon name="close" />
                  Deny
                </Button>
                <Button>
                  <Icon name="fingerprint-recognition" />
                  Approve with Touch ID
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Stage>

      <Stage label="Compose // 720, with a sticky footer (Vale D02)" width={1392} height={480} app="vale">
        {(container) => (
          <Dialog open modal={false}>
            <DialogContent size="compose" container={container}>
              <DialogHeader>
                <DialogOverline>New message // personal</DialogOverline>
                <DialogTitle>Board games for the cabin</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Field>
                  <FieldLabel htmlFor="d-to">To</FieldLabel>
                  <Input id="d-to" defaultValue="Theo Park <theo.park@hey.com>" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-subject">Subject</FieldLabel>
                  <Input id="d-subject" defaultValue="Board games for the cabin" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="d-message">Message</FieldLabel>
                  <Textarea
                    id="d-message"
                    rows={6}
                    defaultValue="Theo, can you bring Ticket to Ride and Wingspan? Mira has groceries covered for the first night."
                  />
                </Field>
              </DialogBody>
              <DialogFooter sticky>
                <Button variant="secondary">Save draft</Button>
                <Button>
                  <Icon name="send" />
                  Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Stage>

      <Specimen label="Sizes by name // question 480, review 560, form 640, compose 720, viewer 960, full; each capped at the screen less 24 a side">
        <div className="grid grid-cols-6 gap-2 max-sm:grid-cols-2">
          {[
            ["question", "480", "a confirmation, one field"],
            ["review", "560", "read one thing, answer"],
            ["form", "640", "a form (the default)"],
            ["compose", "720", "writing at length"],
            ["viewer", "960", "a diff, a page to read"],
            ["full", "all", "the window less 24"],
          ].map(([name, width, job]) => (
            <div key={name} className="rule-box flex flex-col gap-1 p-3">
              <span className="type-overline">{name}</span>
              <span className="type-number-count">{width}</span>
              <span className="type-caption text-text-secondary">{job}</span>
            </div>
          ))}
        </div>
      </Specimen>
    </div>
  )
}
