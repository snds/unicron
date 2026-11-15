// Layers a person opens. The other overlay views hold their layers open in a Stage, for the
// picture. Here each one starts closed behind a real trigger: focus moves in, Escape closes, and
// focus goes back to what opened it (tests/parts.spec.ts drives these). Also here, because they
// only show on a live layer: a footer that stays put while its dialog scrolls, a dialog that a
// press outside does not close, a popover's own Done, the three menu widths, and a toast raised
// by a press. View: ?view=live-layers
import {
  Button,
  Dialog,
  DialogAction,
  DialogActions,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogOverline,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  FieldRow,
  Icon,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetOverline,
  SheetTitle,
  SheetTrigger,
  TextField,
  ToggleRow,
  toast,
} from "@unicron/ui"

import { Page, Specimen } from "./_primitives"

/** Vale's notification settings: more rows than a window holds, so the dialog scrolls inside itself. */
const NOTICES = [
  ["New mail", "One line for each message that lands in Inbox."],
  ["Mentions", "When someone writes your name in a shared note."],
  ["Calendar invites", "A new invite, and a change to one you accepted."],
  ["Reminders", "At the time an event's reminder is set for."],
  ["Snoozed mail", "When a snoozed message comes back."],
  ["Send failures", "A message that could not be sent."],
  ["Sign-in requests", "A new device asks to sign in to this account."],
  ["Sync errors", "An account that stopped syncing."],
  ["Storage", "The mailbox is nearly full."],
  ["Weekly digest", "Monday at 08:00: what waits on you."],
  ["Shared notes", "A change to a note you share."],
  ["Birthdays", "On the day, for contacts with a birthday."],
] as const

/** Lockdown's filters for the item list: a sheet's body scrolls and its footer stays in view. */
const KINDS = ["Logins", "Passkeys", "One-time codes", "Cards", "Notes", "Identities", "Wi-Fi", "Server keys", "Recovery codes", "Licences"] as const

export default function LiveLayersView() {
  return (
    <Page>
      <Specimen label="Dialog // a real trigger, a modal layer; the footer stays put while the rows scroll">
        <Dialog>
          <DialogTrigger render={<Button variant="secondary" />}>Open a long settings dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogOverline>Settings // mail</DialogOverline>
              <DialogTitle>Notifications</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col">
                {NOTICES.map(([label, description], index) => (
                  <ToggleRow key={label} label={label} description={description} defaultChecked={index < 7} />
                ))}
              </div>
            </DialogBody>
            <DialogActions sticky>
              <DialogAction kind="destructive">Turn all off</DialogAction>
              <DialogClose render={<DialogAction kind="cancel" />}>Cancel</DialogClose>
              <DialogClose render={<DialogAction icon="checkmark" />}>Save</DialogClose>
            </DialogActions>
          </DialogContent>
        </Dialog>

        <Dialog closeOnOutsideClick={false}>
          <DialogTrigger render={<Button variant="secondary" />}>Open an editor</DialogTrigger>
          <DialogContent size="review">
            <DialogHeader>
              <DialogOverline>Note // cabin trip</DialogOverline>
              <DialogTitle>Packing list</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <TextField
                label="Note"
                multiline
                minRows={4}
                defaultValue="Ticket to Ride and Wingspan (Theo). Groceries for the first night (Mira). Firewood is at the lodge."
                helper="A press outside keeps this open, so a stray click cannot throw the draft away. Escape, Cancel and the close button still close it."
              />
            </DialogBody>
            <DialogActions>
              <DialogClose render={<DialogAction kind="cancel" />}>Cancel</DialogClose>
              <DialogClose render={<DialogAction />}>Save note</DialogClose>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </Specimen>

      <Specimen label="Sheet // a panel at the side; its body scrolls, its footer does not">
        <Sheet>
          <SheetTrigger render={<Button variant="secondary" />}>Open sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetOverline>Items // filter</SheetOverline>
              <SheetTitle>Show these kinds</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <div className="flex flex-col">
                {KINDS.map((kind, index) => (
                  <ToggleRow key={kind} label={kind} defaultChecked={index < 4} />
                ))}
              </div>
            </SheetBody>
            <SheetFooter>
              <SheetClose render={<Button variant="secondary" />}>Cancel</SheetClose>
              <SheetClose render={<Button />}>Apply</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Specimen>

      <Specimen label="Popover // closed by a press outside, by Escape, or by its own Done">
        <Popover>
          <PopoverTrigger render={<Button variant="secondary" />}>Route details</PopoverTrigger>
          <PopoverContent align="start">
            <PopoverHeader>
              <PopoverTitle>Route</PopoverTitle>
              <PopoverDescription>Runs on sean-mbp, and falls back to a cloud model when that Mac is off.</PopoverDescription>
            </PopoverHeader>
            <div className="flex flex-col">
              <FieldRow size="stacked" label="Model">qwen3-32b</FieldRow>
              <FieldRow size="stacked" label="Fallback">Claude Opus 5.5</FieldRow>
            </div>
            <div className="flex justify-end">
              <PopoverClose render={<Button variant="secondary" size="sm" />}>Done</PopoverClose>
            </div>
          </PopoverContent>
        </Popover>
      </Specimen>

      <Specimen label="Menu width // trigger: as wide as its field; fit: its items, never under the trigger; auto: its items, whatever opens it">
        <div className="w-56">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="secondary" block />}>
              Clears after
              <Icon name="chevron--down" data-icon="inline-end" />
            </DropdownMenuTrigger>
            <DropdownMenuContent width="trigger">
              <DropdownMenuItem>30 seconds</DropdownMenuItem>
              <DropdownMenuItem>90 seconds</DropdownMenuItem>
              <DropdownMenuItem>5 minutes</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="secondary" size="sm" />}>Change</DropdownMenuTrigger>
          <DropdownMenuContent width="fit" align="start">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Layout</DropdownMenuLabel>
              <DropdownMenuItem>Follow the system setting</DropdownMenuItem>
              <DropdownMenuItem>Always use the compact layout, even on a large screen with room to spare</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More actions for Steam" />}>
            <Icon name="overflow-menu--horizontal" />
          </DropdownMenuTrigger>
          <DropdownMenuContent width="auto" align="start">
            <DropdownMenuItem>Rename</DropdownMenuItem>
            <DropdownMenuItem>Move to another vault</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Specimen>

      <Specimen label="Toast // raised by a press: one action, then gone by itself">
        <Button variant="secondary" onClick={() => toast("Archived Budget for audits", { action: { label: "Undo", onClick: () => {} } })}>
          Archive, with Undo
        </Button>
        <Button variant="secondary" onClick={() => toast.success("Saved", { description: "Your changes are on every device." })}>
          Save
        </Button>
      </Specimen>
    </Page>
  )
}
