// The adaptive layers: one component, a dialog, a menu or a popover on a desktop and a bottom
// sheet on a phone (by the useViewport width class; fixed here to show both). View: ?view=adaptive
import {
  AdaptiveDialog,
  AdaptiveMenu,
  AdaptiveMenuGroup,
  AdaptiveMenuItem,
  AdaptiveMenuSeparator,
  AdaptivePopover,
  Button,
  FloatButton,
  Icon,
  type AdaptivePresentation,
  TextField,
} from "@unicron/ui"

import { Stage } from "./_stage"

function NewEvent({ presentation, container }: { presentation: AdaptivePresentation; container: HTMLElement }) {
  return (
    <AdaptiveDialog
      open
      presentation={presentation}
      container={container}
      overline="New event // personal"
      title="Cabin trip"
      footer={
        <>
          <Button variant="secondary">Cancel</Button>
          <Button>
            <Icon name="checkmark" />
            Save event
          </Button>
        </>
      }
    >
      <TextField label="Title" defaultValue="Cabin trip" />
      <TextField label="Location" defaultValue="Pine Hollow Lodge, Truckee" />
    </AdaptiveDialog>
  )
}

function Folders({ presentation, container }: { presentation: AdaptivePresentation; container: HTMLElement }) {
  return (
    <AdaptiveMenu
      open
      presentation={presentation}
      container={container}
      overline="Mail // personal"
      title="Folders"
      width="auto"
      align="end"
      trigger={<Button variant="secondary">Folders</Button>}
    >
      {/* Vale Mobile / 05: Nav Item rows with counts, the open folder and account on the primary-soft tile. */}
      <AdaptiveMenuItem icon="email" count={12} current>
        Inbox
      </AdaptiveMenuItem>
      <AdaptiveMenuItem icon="star" count={4}>
        Starred
      </AdaptiveMenuItem>
      <AdaptiveMenuItem icon="edit" count={2}>
        Drafts
      </AdaptiveMenuItem>
      <AdaptiveMenuItem icon="send">Sent</AdaptiveMenuItem>
      <AdaptiveMenuItem icon="archive">Archive</AdaptiveMenuItem>
      <AdaptiveMenuItem icon="warning--alt" count={3}>
        Spam
      </AdaptiveMenuItem>
      <AdaptiveMenuSeparator />
      <AdaptiveMenuGroup label="Accounts // 02">
        <AdaptiveMenuItem icon="user--avatar" count={12} current>
          Personal
        </AdaptiveMenuItem>
        <AdaptiveMenuItem icon="document" count={31}>
          Work
        </AdaptiveMenuItem>
      </AdaptiveMenuGroup>
    </AdaptiveMenu>
  )
}

function Legend({ presentation, container }: { presentation: AdaptivePresentation; container: HTMLElement }) {
  return (
    <AdaptivePopover
      open
      presentation={presentation}
      container={container}
      overline="Graph // 04 kinds"
      title="Legend"
      align="end"
      trigger={<FloatButton label="Legend" icon="information" size="l" />}
    >
      <div className="flex flex-col">
        {[
          ["Skill", "what an agent can do"],
          ["Check", "a rule the workspace keeps"],
          ["Harness", "how a run is held"],
          ["Note", "what the workspace knows"],
        ].map(([kind, line]) => (
          <div key={kind} className="rule-t flex items-baseline justify-between gap-4 py-3">
            <span className="type-ui">{kind}</span>
            <span className="type-caption text-text-secondary">{line}</span>
          </div>
        ))}
      </div>
    </AdaptivePopover>
  )
}

export default function AdaptiveView() {
  return (
    // Anchored layers first: a menu measures the room it has against the window, so it is
    // pictured where the window is.
    <div className="flex flex-col gap-10 p-6 max-sm:p-4">
      <div className="flex flex-wrap gap-6">
        <Stage label="AdaptiveMenu // desktop: a dropdown menu" width={960} height={560} app="vale">
          {(container) => (
            <div className="absolute top-4 right-6">
              <Folders presentation="desktop" container={container} />
            </div>
          )}
        </Stage>
        <Stage label="AdaptiveMenu // phone: a sheet of rows (Vale 05)" width={390} height={844} app="vale">
          {(container) => (
            <div className="absolute top-4 right-4">
              <Folders presentation="sheet" container={container} />
            </div>
          )}
        </Stage>
      </div>

      <div className="flex flex-wrap gap-6">
        <Stage label="AdaptiveDialog // desktop: a form dialog" width={960} height={560} app="vale">
          {(container) => <NewEvent presentation="desktop" container={container} />}
        </Stage>
        <Stage label="AdaptiveDialog // phone: a sheet" width={390} height={844} app="vale">
          {(container) => <NewEvent presentation="sheet" container={container} />}
        </Stage>
      </div>

      <div className="flex flex-wrap gap-6">
        <Stage label="AdaptivePopover // desktop: a popover with its header" width={960} height={560} app="synapse">
          {(container) => (
            <div className="absolute top-4 right-6">
              <Legend presentation="desktop" container={container} />
            </div>
          )}
        </Stage>
        <Stage label="AdaptivePopover // phone: a sheet" width={390} height={844} app="synapse">
          {(container) => (
            <div className="absolute top-4 right-4">
              <Legend presentation="sheet" container={container} />
            </div>
          )}
        </Stage>
      </div>
    </div>
  )
}
