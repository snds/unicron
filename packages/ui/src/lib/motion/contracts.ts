// Owned source (not generated): the motion contracts as data. The docs, the playground's Motion
// view and the browser checks (apps/playground/tests) all read this one list, so a recipe cannot
// say one thing and do another.

/** How often a user meets the motion. It caps how much motion is allowed (docs/02-tokens.md). */
export type MotionFrequency = "constant" | "frequent" | "occasional" | "rare"

/** A duration role: the custom property that holds how long the motion may run. */
export type MotionDurationRole =
  | "--motion-press"
  | "--motion-fast"
  | "--motion-base"
  | "--motion-state"
  | "--motion-move"
  | "--motion-spring-settle-duration"
  | "--motion-spring-firm-duration"

export interface MotionContract {
  /** Stable id: the playground card's `data-contract` and the browser check's name. */
  id: string
  /** The class or attribute that applies it. */
  recipe: string
  /** What starts it. */
  trigger: string
  /** Every CSS property it may animate. Anything else moving is a defect. */
  properties: readonly string[]
  /** The longest any part of it runs, as a role. */
  duration: MotionDurationRole
  /** Curves and springs it uses, as roles. */
  easing: readonly string[]
  /** Delay between siblings, when they enter in turn. */
  stagger?: "--motion-stagger"
  frequency: MotionFrequency
  /** What happens when it is triggered again, or reversed, before it ends. */
  interrupted: string
  /** What is left under reduced motion. */
  reduced: string
  /** Properties that may still animate under reduced motion (none = it is instant or still). */
  reducedProperties: readonly string[]
  /** Why it animates something other than transform and opacity, when it does. */
  exception?: string
  /**
   * A component's contract: the `data-slot` selectors of the parts that move. A recipe has none
   * (it is shown on a specimen); a component's surfaces are found in the document, since most
   * of them render in a portal.
   */
  surfaces?: readonly string[]
}

const COLOURS = ["color", "background-color", "border-color", "box-shadow"] as const

/**
 * The recipes in styles/motion.css, then the components built on them. A component joins this
 * list when its motion is built, so the list is also the record of what is done.
 */
export const motionContracts = [
  {
    id: "press",
    recipe: "motion-press · motion-press-sm",
    trigger: "pointer down, Space or Enter held (:active)",
    properties: ["scale", ...COLOURS],
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "A transition: release mid-press and it turns round from where it is.",
    reduced: "No scale. Colour still changes.",
    reducedProperties: COLOURS,
  },
  {
    id: "push",
    recipe: "motion-push",
    trigger: "pointer down, Space or Enter held (:active), on a control that opens no popup",
    properties: ["translate", ...COLOURS],
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "A transition: release mid-press and it comes back from where it is.",
    reduced: "No movement. Colour still changes.",
    reducedProperties: COLOURS,
  },
  {
    id: "indicator",
    recipe: "motion-indicator",
    trigger: "the chosen item changes, and the mark under it moves there",
    properties: ["translate", "width", "height"],
    duration: "--motion-base",
    easing: ["--motion-ease-move"],
    frequency: "frequent",
    interrupted: "A transition: chosen again mid-way, it turns toward the newest item from where it is.",
    reduced: "The mark is under the new item at once.",
    reducedProperties: [],
    exception: "Its length (width or height) changes with the item it marks. The mark is placed absolutely, so nothing reflows, and it is a 2px bar.",
  },
  {
    id: "pop",
    recipe: "motion-pop",
    trigger: "a small surface opens or closes (data-starting-style, data-ending-style, or mount)",
    properties: ["opacity", "scale"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
  },
  {
    id: "slide",
    recipe: "motion-slide + motion-slide-from-{top,bottom,left,right}",
    trigger: "a surface arrives from an edge, or leaves to it",
    properties: ["opacity", "translate"],
    duration: "--motion-spring-firm-duration",
    easing: ["--motion-spring-firm", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "A transition: reversed mid-way, it starts the other curve from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
  },
  {
    id: "collapse",
    recipe: "motion-collapse",
    trigger: "a panel opens or closes",
    properties: ["height", "opacity"],
    duration: "--motion-state",
    easing: ["--motion-ease-move"],
    frequency: "occasional",
    interrupted: "A transition: toggled mid-way, it turns round from the current height.",
    reduced: "Height changes at once; the content fades.",
    reducedProperties: ["opacity"],
    exception: "Height, not transform: the content below has to move with the panel.",
  },
  {
    id: "stagger",
    recipe: "motion-stagger (on the parent)",
    trigger: "a list appears for the first time",
    properties: ["opacity", "translate"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter"],
    stagger: "--motion-stagger",
    frequency: "rare",
    interrupted: "Runs once on mount. Rows after the fourth step start together, so the whole list is in within 400ms.",
    reduced: "Every row is there at once.",
    reducedProperties: [],
  },
  {
    id: "draw",
    recipe: "motion-draw (CheckDraw)",
    trigger: "something succeeds: copied, checked, approved",
    properties: ["stroke-dashoffset"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter"],
    frequency: "occasional",
    interrupted: "Runs once on mount. Mounted again, it draws again.",
    reduced: "The check is simply there.",
    reducedProperties: [],
    exception: "A stroke offset, not transform: it is the only way to draw a line, and the area is one glyph.",
  },
  {
    id: "shake",
    recipe: "data-shake (useShake)",
    trigger: "a refusal: a wrong code, a rejected field",
    properties: ["translate"],
    duration: "--motion-state",
    easing: ["--motion-ease-move"],
    frequency: "rare",
    interrupted: "Refused again mid-shake, it starts over.",
    reduced: "No movement. The error colour and the error text carry it.",
    reducedProperties: [],
  },
  {
    id: "fade",
    recipe: "motion-fade (+ motion-fade-fast)",
    trigger: "a surface appears where it is, or goes",
    properties: ["opacity"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
  },
  {
    id: "anchor",
    recipe: "motion-anchor (+ motion-anchor-fast)",
    trigger: "a surface opens off its trigger, on the side it is placed (data-side), or closes",
    properties: ["opacity", "translate"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
  },
  {
    id: "dialog",
    recipe: "motion-fade (popup and backdrop)",
    trigger: "the dialog opens or closes",
    properties: ["opacity"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "Transitions: dismissed mid-open, popup and backdrop turn round from where they are.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="dialog-content"]', '[data-slot="dialog-overlay"]'],
  },
  {
    id: "popover",
    recipe: "motion-anchor",
    trigger: "the popover opens from its trigger, or closes",
    properties: ["opacity", "translate"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="popover-content"]'],
  },
  {
    id: "tooltip",
    recipe: "motion-fade + motion-fade-fast",
    trigger: "hover or focus, after the delay; no motion when moving between neighbouring tooltips",
    properties: ["opacity"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: the pointer leaves mid-open and it turns round from where it is.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="tooltip-content"]'],
  },
  {
    id: "menu",
    recipe: "motion-anchor + motion-anchor-fast",
    trigger: "the menu opens by pointer, or closes; opened or closed from the keyboard it does not animate",
    properties: ["opacity", "translate"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="dropdown-menu-content"]'],
  },
  {
    id: "select",
    recipe: "motion-anchor + motion-anchor-fast",
    trigger: "the list opens by pointer, or closes; opened or closed from the keyboard it does not animate",
    properties: ["opacity", "translate"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="select-content"]'],
  },
  {
    id: "copy-words",
    recipe: "motion-fade + motion-fade-fast, keyed by the copy's phase",
    trigger: "a copy starts the clipboard countdown (\"Clears in 28 s\"), and the clear ends it (\"Cleared\"); SecretField and CodeDisplay",
    properties: ["opacity"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter"],
    frequency: "frequent",
    interrupted: "A second copy restarts the countdown; the words are already there, so nothing fades again. The seconds tick without motion.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-contract="copy-words"] [data-slot="secret-field-copy-countdown"]'],
  },
  {
    id: "reveal",
    recipe: "motion-appear (the shown value) · motion-fade + motion-fade-fast (the dots)",
    trigger: "Show or Hide on a SecretField: the value fades in where the dots were, and the dots fade back in",
    properties: ["opacity"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter"],
    frequency: "frequent",
    interrupted: "Hidden mid-fade, the dots replace the value at once and fade in themselves.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-contract="reveal"] [data-slot="secret-field-revealed"]'],
  },
  {
    id: "strength",
    recipe: "motion-fill-in-turn",
    trigger: "the strength the host computes changes (weak, fair, strong): the rule's cells change colour one after another",
    properties: ["background-color"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter"],
    stagger: "--motion-stagger",
    frequency: "frequent",
    interrupted: "A transition per cell: a new level mid-way retargets each cell from the colour it has now.",
    reduced: "The cells change colour together, with no stagger.",
    reducedProperties: ["background-color"],
    surfaces: ['[data-contract="strength"] [data-slot="secret-field-meter-cells"]'],
  },
  {
    id: "button-press",
    recipe: "motion-push (Button, IconButton, Toggle)",
    trigger: "a button held down by pointer, Space or Enter; a menu or popover trigger does not move",
    properties: ["translate", ...COLOURS],
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "Released mid-press, it comes back from where it is.",
    reduced: "The wash still darkens; the button does not move.",
    reducedProperties: COLOURS,
    surfaces: ['[data-contract="button-press"] [data-slot="button"]'],
  },
  {
    id: "switch",
    recipe: "the knob's own transition (transition-transform, --motion-fast)",
    trigger: "the switch is turned on or off",
    properties: ["translate"],
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "A transition: turned back mid-way, the knob turns round from where it is.",
    reduced: "The knob is at its new end at once; the track's fill still changes.",
    reducedProperties: [],
    surfaces: ['[data-contract="switch"] [data-slot="switch-thumb"]'],
  },
  {
    id: "checkbox",
    recipe: "motion-fade + motion-fade-fast (the mark)",
    trigger: "the box is checked, cleared, or set to some (indeterminate)",
    properties: ["opacity"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: cleared mid-fade, the mark turns round from where it is.",
    reduced: "The same: it only fades.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-contract="checkbox"] [data-slot="checkbox-indicator"]'],
  },
  {
    id: "tabs",
    recipe: "a colour change (the 2.0 Pill Tab fills the chosen tab in place)",
    trigger: "another tab is chosen, by pointer or keyboard",
    properties: COLOURS,
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "A transition: a third tab chosen mid-fade, each fill turns round from where it is.",
    reduced: "The same: only colour changes, and nothing moves.",
    reducedProperties: COLOURS,
    surfaces: ['[data-contract="tabs"] [data-slot="tabs-trigger"][data-trigger]'],
  },
  {
    id: "collapsible",
    recipe: "motion-collapse (CollapsibleContent; RunTrace's steps)",
    trigger: "the trigger opens or closes the panel; its chevron (RunTrace) turns on --motion-fast",
    properties: ["height", "opacity"],
    duration: "--motion-state",
    easing: ["--motion-ease-move"],
    frequency: "occasional",
    interrupted: "A transition: toggled mid-way, it turns round from the current height.",
    reduced: "Height changes at once; the content fades.",
    reducedProperties: ["opacity"],
    exception: "Height, not transform: the content below has to move with the panel.",
    surfaces: ['[data-contract="collapsible"] [data-slot="collapsible-content"]'],
  },
  {
    id: "progress",
    recipe: "the fill's own transition (scale from the start edge, --motion-base)",
    trigger: "the value changes",
    properties: ["scale", "background-color"],
    duration: "--motion-base",
    easing: ["--motion-ease-move"],
    frequency: "occasional",
    interrupted: "A transition: a new value mid-way retargets from where the fill is.",
    reduced: "The fill is at the new value at once; its colour still changes.",
    reducedProperties: ["background-color"],
    surfaces: ['[data-contract="progress"] [data-slot="progress-indicator"]'],
  },
  {
    id: "sheet",
    recipe: "AdaptiveSheetContent's own entrance · data-release (the phone sheet's drag)",
    trigger: "the sheet opens or closes; on a phone, the grabber is dragged and let go",
    properties: ["translate", "opacity"],
    duration: "--motion-spring-firm-duration",
    easing: ["--motion-ease-enter", "--motion-ease-exit", "--motion-spring-firm"],
    frequency: "occasional",
    interrupted: "Open and close are transitions and turn round mid-way. Grabbed again while it settles, the sheet carries on from where it is.",
    reduced: "It fades in place. A drag still follows the finger; let go, the sheet is back, or gone, at once.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="sheet-content"]'],
  },
  {
    id: "toast",
    recipe: "sonner's own motion, on the roles (index.css → Toasts)",
    trigger: "a toast arrives, the stack moves up for it, or it is dismissed",
    properties: ["transform", "opacity", "height", "box-shadow"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "Transitions: a new toast mid-entrance restacks the others from where they are. A swipe follows the finger.",
    reduced: "It fades in place; a swipe still works.",
    reducedProperties: ["opacity"],
    exception: "sonner moves the stack by height as toasts come and go; it is its own engine, kept on the roles and inside the ceiling.",
    surfaces: ['[data-sonner-toast]'],
  },
  {
    id: "rolling-number",
    recipe: "motion-roll-in, motion-roll-out (RollingNumber)",
    trigger: "the value changes: each changed character rolls, up when it grew and down when it shrank",
    properties: ["translate", "opacity"],
    duration: "--motion-state",
    easing: ["--motion-ease-move"],
    frequency: "occasional",
    interrupted: "Changed again mid-roll, the changed characters start a new roll from the newest value.",
    reduced: "The new value is there at once.",
    reducedProperties: [],
    surfaces: ['[data-contract="rolling-number"] [data-slot="rolling-number"]'],
  },
  {
    id: "expressive-press",
    recipe: "motion-push inside data-motion=\"expressive\" (styles/motion-expressive.css)",
    trigger: "a control held down, in an expressive box",
    properties: ["scale", ...COLOURS],
    duration: "--motion-fast",
    easing: ["--motion-ease"],
    frequency: "frequent",
    interrupted: "A transition: released mid-press, it comes back from where it is. No spring: it is met too often to bounce.",
    reduced: "The mechanical press, without its movement: colour only.",
    reducedProperties: COLOURS,
  },
  {
    id: "burst",
    recipe: "motion-burst inside data-motion=\"expressive\" (styles/motion-expressive.css)",
    trigger: "a success mark is mounted (sent, paired, saved)",
    properties: ["scale", "opacity"],
    duration: "--motion-move",
    easing: ["--motion-spring-pop", "--motion-ease-exit"],
    frequency: "rare",
    interrupted: "Runs once on mount. Mounted again, it bursts again.",
    reduced: "The mark is simply there.",
    reducedProperties: [],
  },
] as const satisfies readonly MotionContract[]

export type MotionContractId = (typeof motionContracts)[number]["id"]
