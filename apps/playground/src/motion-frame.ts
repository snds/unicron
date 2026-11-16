// Plain data, no imports: the Motion view draws these cards and tests/motion.spec.ts checks them.
/**
 * The frame's own moving parts (Unicron 112). They run on the motion roles inside the frame, not as
 * a recipe on a specimen, so they are cards of their own here, beside the contracts in @unicron/ui:
 * the same facts, and the same checks in tests/motion.spec.ts (by `data-frame-contract`).
 */
export const frameMotionContracts = [
  {
    id: "tab-bar-minimize",
    title: "Tab bar minimize",
    recipe: "TabBar minimized: the bar folds to its active tab",
    trigger: "The page scrolls past 64: the frame sets `minimized`, and clears it as the chrome comes back",
    // `gap` reaches the browser as its two longhands.
    properties: ["flex-grow", "flex-basis", "column-gap", "row-gap", "height", "opacity", "visibility", "color", "background-color"],
    // The system's reduced rule keeps a fade (opacity at --motion-fast): the folding tabs fade in place.
    reducedProperties: ["opacity"] as string[],
    duration: "--motion-state",
    easing: ["--motion-ease-move", "--motion-ease"],
    frequency: "constant",
    interrupted: "Reverses from where it is: the flex values are transitions",
    reduced: "Snaps to the folded bar; nothing moves",
  },
  {
    id: "pull-release",
    title: "Pull to refresh",
    recipe: "AppFrameList onRefresh: the content follows the finger, then goes back",
    trigger: "A pull down from the top of a phone column, let go",
    properties: ["transform"],
    reducedProperties: [] as string[],
    duration: "--motion-state",
    easing: ["--motion-ease-move"],
    frequency: "occasional",
    interrupted: "A new touch stops the way back where it is and follows the finger again",
    reduced: "The content does not move; the mark shows over its top and changes at the line",
  },
] as const

export type FrameMotionContract = (typeof frameMotionContracts)[number]
