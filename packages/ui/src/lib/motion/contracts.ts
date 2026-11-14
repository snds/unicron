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
    id: "dialog",
    recipe: "motion-pop (popup) + motion-fade (backdrop)",
    trigger: "the dialog opens or closes",
    properties: ["opacity", "scale"],
    duration: "--motion-base",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "occasional",
    interrupted: "Transitions: dismissed mid-open, popup and backdrop turn round from where they are.",
    reduced: "Popup and backdrop fade in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="dialog-content"]', '[data-slot="dialog-overlay"]'],
  },
  {
    id: "popover",
    recipe: "motion-pop",
    trigger: "the popover opens from its trigger, or closes",
    properties: ["opacity", "scale"],
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
    recipe: "motion-pop + motion-pop-fast",
    trigger: "hover or focus, after the delay; no motion when moving between neighbouring tooltips",
    properties: ["opacity", "scale"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: the pointer leaves mid-open and it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="tooltip-content"]'],
  },
  {
    id: "menu",
    recipe: "motion-pop + motion-pop-fast + motion-pop-pointer",
    trigger: "the menu opens by pointer, or closes; opened or closed from the keyboard it does not animate",
    properties: ["opacity", "scale"],
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
    recipe: "motion-pop + motion-pop-fast + motion-pop-pointer",
    trigger: "the list opens by pointer, or closes; opened or closed from the keyboard it does not animate",
    properties: ["opacity", "scale"],
    duration: "--motion-fast",
    easing: ["--motion-ease-enter", "--motion-ease-exit"],
    frequency: "frequent",
    interrupted: "A transition: closed mid-open, it turns round from where it is.",
    reduced: "Fades in place.",
    reducedProperties: ["opacity"],
    surfaces: ['[data-slot="select-content"]'],
  },
] as const satisfies readonly MotionContract[]

export type MotionContractId = (typeof motionContracts)[number]["id"]
