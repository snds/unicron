// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: snds/lockdown · PR snds/unicron (host-contract slice 4) · DSA none (match="keywords" and CommandItemAction; Lockdown 10-desktop-shell §10.6 gaps 4 and 5)
"use client"

import * as React from "react"
import { Command as CommandPrimitive, defaultFilter } from "cmdk"
import { cn } from "../../lib/utils"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog"
import {
  InputGroup,
  InputGroupAddon,
} from "./input-group"
import { Icon, type IconName } from "../icon"
import { IconButton } from "../icon-button"

/**
 * What a search is matched against. `value` is cmdk's default: an item's `value` and its
 * `keywords` together. `keywords` matches an item that has keywords on those alone, so an
 * item keyed by an id (`value={item.id}`) is never found by the id's letters; an item
 * without keywords is still matched on its `value`. Both use cmdk's own ranking.
 */
export type CommandMatch = "value" | "keywords"

/** cmdk's ranking over an item's keywords only, or its value when it has none. */
function keywordsFilter(value: string, search: string, keywords?: string[]) {
  return keywords && keywords.length > 0 ? defaultFilter(keywords.join(" "), search) : defaultFilter(value, search)
}

/** The highlighted item's secondary action, if it has one. */
function selectedItemAction(root: HTMLElement) {
  const item = root.querySelector<HTMLElement>('[cmdk-item][data-selected="true"]:not([data-disabled="true"])')
  return item?.querySelector<HTMLButtonElement>('[data-slot="command-item-action"]') ?? null
}

function isDisabled(button: HTMLButtonElement) {
  return button.disabled || button.getAttribute("aria-disabled") === "true" || button.hasAttribute("data-disabled")
}

function Command({
  className,
  match = "value",
  filter,
  onKeyDown,
  ...props
}: React.ComponentProps<typeof CommandPrimitive> & {
  /** What a search matches: `value` (cmdk's default, value and keywords) or `keywords` alone. A `filter` wins over this. */
  match?: CommandMatch
}) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground rounded-xl! p-1 flex size-full flex-col overflow-hidden",
        className
      )}
      filter={filter ?? (match === "keywords" ? keywordsFilter : undefined)}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        // ⌘↵ / Ctrl+Enter runs the highlighted item's CommandItemAction. A host that handles
        // the keys itself calls preventDefault and this steps aside; an item with no action
        // keeps cmdk's Enter (it selects).
        if (e.defaultPrevented || e.key !== "Enter" || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return
        if (e.nativeEvent.isComposing) return
        const action = selectedItemAction(e.currentTarget)
        if (!action) return
        // A disabled action swallows the keys rather than falling through to the main action.
        e.preventDefault()
        if (!isDisabled(action)) action.click()
      }}
      {...props}
    />
  )
}

function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  showCloseButton = false,
  beforeContent,
  ...props
}: Omit<React.ComponentProps<typeof Dialog>, "children"> & {
  title?: string
  description?: string
  className?: string
  showCloseButton?: boolean
  /** Passed to `DialogContent`: rendered between the backdrop and the popup (a desktop app's drag strip). */
  beforeContent?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          // A third of the way down the area below --c-dialog-titlebar-inset (0px by default).
          "rounded-xl! top-[calc(var(--c-dialog-titlebar-inset)+(100%-var(--c-dialog-titlebar-inset))/3)] translate-y-0 overflow-hidden p-0",
          className
        )}
        showCloseButton={showCloseButton}
        beforeContent={beforeContent}
        // Straight to the search field, so typing right after ⌘K isn't lost.
        initialFocus={() => document.querySelector<HTMLElement>("[cmdk-input]") ?? true}
      >
        {/* Inside the popup, so the dialog takes its accessible name from it. */}
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="bg-muted border-transparent h-8! rounded-lg! shadow-none! *:data-[slot=input-group-addon]:pl-2!">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "w-full text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
        <InputGroupAddon>
          <Icon className="size-4 shrink-0 opacity-50" name="search" />
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 outline-none overflow-x-hidden overflow-y-auto",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  )
}

function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn("text-foreground **:[[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 **:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium", className)}
      {...props}
    />
  )
}

function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  )
}

type CommandItemActionRegistration = { description: string; shortcut: string }
const CommandItemActionContext = React.createContext<((action: CommandItemActionRegistration) => () => void) | null>(null)

/**
 * One result. `value` is its key (what `onSelect` and `Command`'s `value` hand back) and, by
 * default, what a search matches; `keywords` are more words it is found by (a title, a username,
 * a host). With `Command match="keywords"` an item that has keywords is found by those alone,
 * so `value` can be an id. A `CommandItemAction` child adds a second action.
 */
function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  const descriptionId = React.useId()
  const [action, setAction] = React.useState<CommandItemActionRegistration | null>(null)
  const register = React.useCallback((next: CommandItemActionRegistration) => {
    setAction(next)
    return () => setAction((current) => (current === next ? null : current))
  }, [])
  const describedBy = [props["aria-describedby"], action && descriptionId].filter(Boolean).join(" ") || undefined
  return (
    <>
      <CommandPrimitive.Item
        data-slot="command-item"
        data-has-action={action ? "true" : undefined}
        aria-keyshortcuts={action?.shortcut}
        className={cn(
          "data-selected:bg-muted data-selected:text-foreground data-selected:*:[svg]:text-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none in-data-[slot=dialog-content]:rounded-lg! [&_svg:not([class*='size-'])]:size-4 group/command-item data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
          className
        )}
        {...props}
        aria-describedby={describedBy}
      >
        <CommandItemActionContext.Provider value={register}>{children}</CommandItemActionContext.Provider>
        <Icon className="ml-auto opacity-0 group-has-data-[slot=command-shortcut]/command-item:hidden group-has-data-[slot=command-item-action]/command-item:hidden group-data-[checked=true]/command-item:opacity-100" name="check" />
      </CommandPrimitive.Item>
      {/* Outside the item, so cmdk's text-derived value never takes these words in. */}
      {action && (
        <span id={descriptionId} data-slot="command-item-action-description" hidden>
          {action.description}
        </span>
      )}
    </>
  )
}

function isApplePlatform() {
  if (typeof navigator === "undefined") return false
  const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? ""
  return /mac|iphone|ipad|ipod/i.test(platform)
}

/** The key that runs a CommandItemAction, as shown and as spoken: ⌘↵ on Apple platforms, Ctrl+Enter elsewhere. */
export function commandItemActionShortcut() {
  return isApplePlatform()
    ? { label: "⌘↵", spoken: "Command Enter", aria: "Meta+Enter" }
    : { label: "Ctrl+Enter", spoken: "Control Enter", aria: "Control+Enter" }
}

export interface CommandItemActionProps {
  /** What the action does ("Copy password"). The button's name and tooltip, and what the item announces. */
  label: string
  icon: IconName
  /** Runs on a click of the button, or ⌘↵ / Ctrl+Enter while its item is highlighted. Never selects the item. */
  onAction: () => void
  disabled?: boolean
  className?: string
}

/**
 * A second action on a `CommandItem` (copy, open in a new window), beside its main one (`onSelect`).
 *
 * cmdk keeps focus in the search field and moves a highlight through the items
 * (`aria-activedescendant`), and an item is a `role="option"`, whose content is presentational:
 * a button inside it can't be reached by Tab or announced as a button. So the action is reached
 * three ways instead. A pointer clicks the button, which is out of the item's selection: the
 * click never runs the item's `onSelect` and focus stays in the search field. The keyboard
 * presses ⌘↵ (Ctrl+Enter off Apple platforms) while the item is highlighted; `Command` runs it.
 * A screen reader hears it with the item: the item is described by "Copy password, Command
 * Enter" and carries `aria-keyshortcuts`. The button itself is hidden from assistive tech,
 * since the description already says it. One action per item.
 */
function CommandItemAction({ label, icon, onAction, disabled, className }: CommandItemActionProps) {
  const register = React.useContext(CommandItemActionContext)
  const shortcut = commandItemActionShortcut()

  React.useLayoutEffect(() => {
    if (!register || disabled) return
    return register({ description: `${label}, ${shortcut.spoken}`, shortcut: shortcut.aria })
  }, [register, label, shortcut.spoken, shortcut.aria, disabled])

  // Keep focus (and the highlight) in the search field, and keep cmdk from seeing the press or
  // the click, even a click on the disabled button, which some engines pass to its ancestors.
  const hold = (e: React.SyntheticEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  return (
    <span
      data-slot="command-item-action-wrapper"
      className={cn("ml-auto inline-flex shrink-0", className)}
      onPointerDown={hold}
      onMouseDown={hold}
      onClick={(e) => e.stopPropagation()}
    >
      <IconButton
        data-slot="command-item-action"
        label={label}
        icon={icon}
        shortcut={shortcut.label}
        size="icon-xs"
        disabled={disabled}
        tabIndex={-1}
        aria-hidden
        onClick={() => {
          if (!disabled) onAction()
        }}
      />
    </span>
  )
}

function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn("text-muted-foreground group-data-selected/command-item:text-foreground ml-auto text-xs tracking-widest", className)}
      {...props}
    />
  )
}

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandItemAction,
  CommandShortcut,
  CommandSeparator,
}
