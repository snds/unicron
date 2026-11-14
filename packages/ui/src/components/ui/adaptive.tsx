// Owned component (not generated): AdaptiveDialog, AdaptiveMenu and AdaptivePopover, a dialog, a menu or a popover on a desktop and a bottom sheet on a phone, chosen by the useViewport width class.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract §5.1b row 16 and the cross-app decisions §10 and §14; Vale U1, Lockdown L-01, Synapse SY-18, Warpcore N-16; no Figma component; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon, type IconName } from "../icon"
import { useViewport } from "../use-viewport"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverline,
  DialogTitle,
  DialogTrigger,
  type DialogSize,
} from "./dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  type DropdownMenuWidth,
} from "./dropdown-menu"
import { Popover, PopoverContent, PopoverHeader, PopoverTrigger } from "./popover"
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverline,
  SheetTitle,
  SheetTrigger,
  type SheetHeight,
} from "./sheet"

/**
 * Which form a layer takes. `auto` (the default) follows the screen: a bottom sheet in the compact
 * width class (a phone), the desktop form from medium up. The fixed values are for a host that
 * knows better, and for showing both forms side by side.
 */
export type AdaptivePresentation = "auto" | "desktop" | "sheet"

/** True when a layer should be a sheet: asked for, or `auto` on a compact screen. */
export function useAdaptiveSheet(presentation: AdaptivePresentation = "auto"): boolean {
  const { widthClass } = useViewport()
  if (presentation === "sheet") return true
  if (presentation === "desktop") return false
  return widthClass === "compact"
}

/** Open state that a host may hold (`open` and `onOpenChange`) or leave to the layer (`defaultOpen`). */
export function useLayerOpen(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined) {
  const [own, setOwn] = React.useState(defaultOpen ?? false)
  const value = open ?? own
  const set = React.useCallback(
    (next: boolean) => {
      if (open === undefined) setOwn(next)
      onOpenChange?.(next)
    },
    [open, onOpenChange]
  )
  return [value, set] as const
}

// ── AdaptiveDialog ─────────────────────────────────────────────────────────────────────────────

type FocusTarget = React.ComponentProps<typeof DialogContent>["initialFocus"]

export interface AdaptiveDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The control that opens it, if the layer owns one (`<Button>New login</Button>`). */
  trigger?: React.ReactElement<Record<string, unknown>>
  presentation?: AdaptivePresentation
  /** The dialog's width by name: `form` (640) by default (cross-app decisions §14). */
  size?: DialogSize
  /** The sheet's height on a phone: `content` (the default) or `full` (a list, a long form). */
  height?: SheetHeight
  /** The mono caps line above the title: the thing it is about. */
  overline?: React.ReactNode
  /** The title, in the lead role. It names the layer for assistive tech. */
  title: React.ReactNode
  /** One sentence under the header. It describes the layer for assistive tech. */
  description?: React.ReactNode
  /** The actions: one primary at most, last. Right-aligned in a dialog; sharing the width on a phone. */
  footer?: React.ReactNode
  /** What the layer holds. */
  children?: React.ReactNode
  /** Close on a press outside. On by default; turn it off for a form with unsaved work. */
  closeOnOutsideClick?: boolean
  showCloseButton?: boolean
  closeLabel?: string
  /** Where focus starts: the first field by default (Base UI), or the element this names. */
  initialFocus?: FocusTarget
  /** Where focus goes when it closes: the control that opened it by default. */
  finalFocus?: React.ComponentProps<typeof DialogContent>["finalFocus"]
  /** Where the portal goes: `<body>` by default. */
  container?: React.ComponentProps<typeof DialogContent>["container"]
  /** On the dialog popup, or the sheet. */
  className?: string
}

/**
 * AdaptiveDialog: a dialog on a desktop (header with an overline, a lead title and the close
 * button; a body; the actions at the right), a bottom sheet on a phone (the Sheet Header, the body,
 * the actions sharing the width). One component, so a form or a question is written once.
 */
function AdaptiveDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  presentation = "auto",
  size = "form",
  height = "content",
  overline,
  title,
  description,
  footer,
  children,
  closeOnOutsideClick = true,
  showCloseButton = true,
  closeLabel = "Close",
  initialFocus,
  finalFocus,
  container,
  className,
}: AdaptiveDialogProps) {
  const sheet = useAdaptiveSheet(presentation)
  const root = {
    open,
    defaultOpen,
    onOpenChange: onOpenChange ? (next: boolean) => onOpenChange(next) : undefined,
    closeOnOutsideClick,
  }
  const shared = { showCloseButton, closeLabel, initialFocus, finalFocus, container, className }

  if (sheet) {
    return (
      <Sheet {...root}>
        {trigger ? <SheetTrigger render={trigger} /> : null}
        <SheetContent side="bottom" height={height} data-adaptive="dialog" {...shared}>
          <SheetHeader>
            {overline ? <SheetOverline>{overline}</SheetOverline> : null}
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {description ? <SheetDescription>{description}</SheetDescription> : null}
            {children}
          </SheetBody>
          {footer ? <SheetFooter>{footer}</SheetFooter> : null}
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Dialog {...root}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent size={size} data-adaptive="dialog" {...shared}>
        <DialogHeader>
          {overline ? <DialogOverline>{overline}</DialogOverline> : null}
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {description || children ? (
          <DialogBody>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
            {children}
          </DialogBody>
        ) : null}
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  )
}

// ── AdaptivePopover ────────────────────────────────────────────────────────────────────────────

export interface AdaptivePopoverProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The control that opens it. A popover is anchored to it on a desktop. */
  trigger: React.ReactElement<Record<string, unknown>>
  presentation?: AdaptivePresentation
  /** The mono caps line above the title. */
  overline?: React.ReactNode
  /** The title: in a PopoverHeader on a desktop, a Sheet Header on a phone. It names the layer. */
  title: React.ReactNode
  /** What it holds: a picker, a few controls. */
  children?: React.ReactNode
  side?: React.ComponentProps<typeof PopoverContent>["side"]
  align?: React.ComponentProps<typeof PopoverContent>["align"]
  /** Dim the page behind the popover with the menu scrim (a phone sheet always has its own). */
  scrim?: boolean
  /** The sheet's height on a phone. */
  height?: SheetHeight
  showCloseButton?: boolean
  closeLabel?: string
  container?: React.ComponentProps<typeof PopoverContent>["container"]
  /** On the popover, or the sheet. */
  className?: string
}

/**
 * AdaptivePopover: a popover with a PopoverHeader on a desktop (a picker, a link, a legend), a
 * bottom sheet with a Sheet Header on a phone.
 */
function AdaptivePopover({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  presentation = "auto",
  overline,
  title,
  children,
  side,
  align,
  scrim = false,
  height = "content",
  showCloseButton = true,
  closeLabel = "Close",
  container,
  className,
}: AdaptivePopoverProps) {
  const sheet = useAdaptiveSheet(presentation)
  const change = onOpenChange ? (next: boolean) => onOpenChange(next) : undefined
  if (sheet) {
    return (
      <Sheet open={open} defaultOpen={defaultOpen} onOpenChange={change}>
        <SheetTrigger render={trigger} />
        <SheetContent side="bottom" height={height} data-adaptive="popover" showCloseButton={showCloseButton} closeLabel={closeLabel} container={container} className={className}>
          <SheetHeader>
            {overline ? <SheetOverline>{overline}</SheetOverline> : null}
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <SheetBody>{children}</SheetBody>
        </SheetContent>
      </Sheet>
    )
  }
  return (
    <Popover open={open} defaultOpen={defaultOpen} onOpenChange={change}>
      <PopoverTrigger render={trigger} />
      <PopoverContent side={side} align={align} scrim={scrim} container={container} data-adaptive="popover" className={className}>
        <PopoverHeader overline={overline} title={title} showCloseButton={showCloseButton} closeLabel={closeLabel} />
        {children}
      </PopoverContent>
    </Popover>
  )
}

// ── AdaptiveMenu ───────────────────────────────────────────────────────────────────────────────

type MenuForm = { sheet: boolean; close: () => void }
const AdaptiveMenuContext = React.createContext<MenuForm | null>(null)

function useMenuForm(part: string): MenuForm {
  const form = React.useContext(AdaptiveMenuContext)
  if (!form) throw new Error(`${part} must be inside an AdaptiveMenu.`)
  return form
}

export interface AdaptiveMenuProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The control that opens it (an overflow button, `CHANGE`, the create button). */
  trigger: React.ReactElement<Record<string, unknown>>
  presentation?: AdaptivePresentation
  /** The mono caps line above the title on a phone, and the menu's first line on a desktop (`CREATE // LONG PRESS`). */
  overline?: React.ReactNode
  /** What the menu is: the sheet's title on a phone, the menu's accessible name on a desktop. */
  title: string
  /** The rows: AdaptiveMenuItem, AdaptiveMenuGroup, AdaptiveMenuSeparator, AdaptiveMenuRadioGroup, AdaptiveMenuCheckboxItem. */
  children: React.ReactNode
  /** Dim the page behind the desktop menu with the menu scrim: quick create. */
  scrim?: boolean
  width?: DropdownMenuWidth
  side?: React.ComponentProps<typeof DropdownMenuContent>["side"]
  align?: React.ComponentProps<typeof DropdownMenuContent>["align"]
  /** The sheet's height on a phone: `content` by default, `full` for a long list. */
  height?: SheetHeight
  container?: React.ComponentProps<typeof DropdownMenuContent>["container"]
}

/** Arrow keys move between the rows of a phone sheet's list, as they do in a menu. */
function onListKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
  const keys = ["ArrowDown", "ArrowUp", "Home", "End"]
  if (!keys.includes(event.key)) return
  const rows = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("[data-slot=adaptive-menu-item]:not(:disabled)"))
  if (rows.length === 0) return
  const at = rows.indexOf(document.activeElement as HTMLElement)
  const next =
    event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : event.key === "ArrowDown" ? (at + 1) % rows.length : (at - 1 + rows.length) % rows.length
  event.preventDefault()
  rows[next]?.focus()
}

/**
 * AdaptiveMenu: a DropdownMenu on a desktop, a bottom sheet of rows under a Sheet Header on a
 * phone (Lockdown 3.5: "a sheet of Nav Items with a Sheet Header"). Write the rows once with the
 * AdaptiveMenu parts; each draws as a menu item or as a sheet row. Picking a row closes it.
 */
function AdaptiveMenu({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  presentation = "auto",
  overline,
  title,
  children,
  scrim = false,
  width = "auto",
  side,
  align,
  height = "content",
  container,
}: AdaptiveMenuProps) {
  const sheet = useAdaptiveSheet(presentation)
  const [isOpen, setOpen] = useLayerOpen(open, defaultOpen, onOpenChange)
  const form = React.useMemo<MenuForm>(() => ({ sheet, close: () => setOpen(false) }), [sheet, setOpen])

  if (sheet) {
    return (
      <AdaptiveMenuContext.Provider value={form}>
        <Sheet open={isOpen} onOpenChange={(next) => setOpen(next)}>
          <SheetTrigger render={trigger} />
          <SheetContent side="bottom" height={height} data-adaptive="menu" container={container}>
            <SheetHeader>
              {overline ? <SheetOverline>{overline}</SheetOverline> : null}
              <SheetTitle>{title}</SheetTitle>
            </SheetHeader>
            <SheetBody>
              <div data-slot="adaptive-menu-list" aria-label={title} role="group" className="flex flex-col gap-1" onKeyDown={onListKeyDown}>
                {children}
              </div>
            </SheetBody>
          </SheetContent>
        </Sheet>
      </AdaptiveMenuContext.Provider>
    )
  }
  return (
    <AdaptiveMenuContext.Provider value={form}>
      <DropdownMenu open={isOpen} onOpenChange={(next) => setOpen(next)}>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent width={width} side={side} align={align} scrim={scrim} container={container} aria-label={title} data-adaptive="menu">
          {overline ? <DropdownMenuLabel>{overline}</DropdownMenuLabel> : null}
          {children}
        </DropdownMenuContent>
      </DropdownMenu>
    </AdaptiveMenuContext.Provider>
  )
}

/** A sheet row: the menu row's look, at 44 on a touch screen, a button. */
const SHEET_ROW =
  "type-ui text-text-body relative flex min-h-9 w-full cursor-default items-center gap-2.5 rounded px-2.5 py-2 text-left select-none pointer-coarse:min-h-touch-min hover:bg-accent active:bg-state-pressed disabled:pointer-events-none disabled:opacity-50 aria-checked:bg-primary-soft [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5"

export interface AdaptiveMenuItemProps {
  /** A 20px glyph before the words. */
  icon?: IconName
  children: React.ReactNode
  /** What picking it does. The menu closes after. */
  onSelect?: () => void
  /** `destructive`: the words and glyph in the critical ink. */
  variant?: "default" | "destructive"
  disabled?: boolean
  /** Its keys, shown in a Kbd at the end on a desktop (`⌘N`). A phone has no keys, so it shows none. */
  shortcut?: string
  /** Keep the menu open after picking it. */
  keepOpen?: boolean
}

function AdaptiveMenuItem({ icon, children, onSelect, variant = "default", disabled, shortcut, keepOpen = false }: AdaptiveMenuItemProps) {
  const form = useMenuForm("AdaptiveMenuItem")
  if (form.sheet) {
    return (
      <button
        type="button"
        data-slot="adaptive-menu-item"
        data-variant={variant}
        disabled={disabled}
        className={cn(SHEET_ROW, variant === "destructive" && "text-critical-text")}
        onClick={() => {
          onSelect?.()
          if (!keepOpen) form.close()
        }}
      >
        {icon ? <Icon name={icon} /> : null}
        {children}
      </button>
    )
  }
  return (
    <DropdownMenuItem variant={variant} disabled={disabled} closeOnClick={!keepOpen} onClick={() => onSelect?.()}>
      {icon ? <Icon name={icon} /> : null}
      {children}
      {shortcut ? <DropdownMenuShortcut>{shortcut}</DropdownMenuShortcut> : null}
    </DropdownMenuItem>
  )
}

/** A labelled run of rows. The label is an overline. */
function AdaptiveMenuGroup({ label, children }: { label?: React.ReactNode; children: React.ReactNode }) {
  const form = useMenuForm("AdaptiveMenuGroup")
  const id = React.useId()
  if (form.sheet) {
    return (
      <div role="group" aria-labelledby={label ? id : undefined} data-slot="adaptive-menu-group" className="flex flex-col gap-1">
        {label ? (
          <p id={id} className="type-overline text-text-label pt-2">
            {label}
          </p>
        ) : null}
        {children}
      </div>
    )
  }
  return (
    <DropdownMenuGroup>
      {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
      {children}
    </DropdownMenuGroup>
  )
}

function AdaptiveMenuSeparator() {
  const form = useMenuForm("AdaptiveMenuSeparator")
  if (form.sheet) return <div role="separator" data-slot="adaptive-menu-separator" className="bg-line-rule my-1 h-px shrink-0" />
  return <DropdownMenuSeparator />
}

const RadioContext = React.createContext<{ value: string | undefined; pick: (value: string) => void } | null>(null)

/** One of a few: the picked row carries a check on a desktop and the selected fill on a phone. */
function AdaptiveMenuRadioGroup({
  label,
  value,
  onValueChange,
  children,
}: {
  label?: React.ReactNode
  value: string | undefined
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  const form = useMenuForm("AdaptiveMenuRadioGroup")
  const id = React.useId()
  const pick = React.useCallback(
    (next: string) => {
      onValueChange(next)
      form.close()
    },
    [onValueChange, form]
  )
  const radio = React.useMemo(() => ({ value, pick }), [value, pick])
  if (form.sheet) {
    return (
      <RadioContext.Provider value={radio}>
        <div role="radiogroup" aria-labelledby={label ? id : undefined} data-slot="adaptive-menu-radio-group" className="flex flex-col gap-1">
          {label ? (
            <p id={id} className="type-overline text-text-label pt-2">
              {label}
            </p>
          ) : null}
          {children}
        </div>
      </RadioContext.Provider>
    )
  }
  return (
    <RadioContext.Provider value={radio}>
      <DropdownMenuRadioGroup value={value} onValueChange={(next) => onValueChange(String(next))}>
        {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
        {children}
      </DropdownMenuRadioGroup>
    </RadioContext.Provider>
  )
}

function AdaptiveMenuRadioItem({ value, icon, children, disabled }: { value: string; icon?: IconName; children: React.ReactNode; disabled?: boolean }) {
  const form = useMenuForm("AdaptiveMenuRadioItem")
  const radio = React.useContext(RadioContext)
  if (!radio) throw new Error("AdaptiveMenuRadioItem must be inside an AdaptiveMenuRadioGroup.")
  if (form.sheet) {
    const checked = radio.value === value
    return (
      <button
        type="button"
        role="radio"
        aria-checked={checked}
        data-slot="adaptive-menu-item"
        disabled={disabled}
        className={SHEET_ROW}
        onClick={() => radio.pick(value)}
      >
        {icon ? <Icon name={icon} /> : null}
        {children}
        {checked ? (
          <span className="ml-auto flex">
            <Icon name="checkmark" size="sm" />
          </span>
        ) : null}
      </button>
    )
  }
  return (
    <DropdownMenuRadioItem value={value} disabled={disabled} closeOnClick>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </DropdownMenuRadioItem>
  )
}

/** On or off, without closing the menu. */
function AdaptiveMenuCheckboxItem({
  checked,
  onCheckedChange,
  icon,
  children,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  icon?: IconName
  children: React.ReactNode
  disabled?: boolean
}) {
  const form = useMenuForm("AdaptiveMenuCheckboxItem")
  if (form.sheet) {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        data-slot="adaptive-menu-item"
        disabled={disabled}
        className={SHEET_ROW}
        onClick={() => onCheckedChange(!checked)}
      >
        {icon ? <Icon name={icon} /> : null}
        {children}
        {checked ? (
          <span className="ml-auto flex">
            <Icon name="checkmark" size="sm" />
          </span>
        ) : null}
      </button>
    )
  }
  return (
    <DropdownMenuCheckboxItem checked={checked} onCheckedChange={(next) => onCheckedChange(Boolean(next))} disabled={disabled}>
      {icon ? <Icon name={icon} /> : null}
      {children}
    </DropdownMenuCheckboxItem>
  )
}

export {
  AdaptiveDialog,
  AdaptiveMenu,
  AdaptiveMenuCheckboxItem,
  AdaptiveMenuGroup,
  AdaptiveMenuItem,
  AdaptiveMenuRadioGroup,
  AdaptiveMenuRadioItem,
  AdaptiveMenuSeparator,
  AdaptivePopover,
}
