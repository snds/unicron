// Owned helper (not generated): a shared-element change on the motion roles.

interface ViewTransitionLike {
  finished: Promise<unknown>
}
type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void | Promise<void>) => ViewTransitionLike
}

/**
 * Run a DOM change as a view transition: elements that share a `view-transition-name` before and
 * after travel between their two places, on `--motion-move` and `--motion-ease-move`
 * (styles/motion.css). Where the browser has no View Transitions, or the user asks for reduced
 * motion, the change simply happens. Resolves when the change is on screen and settled.
 */
export async function withViewTransition(update: () => void | Promise<void>): Promise<void> {
  const doc = typeof document === "undefined" ? undefined : (document as DocumentWithViewTransition)
  const reduced =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!doc || typeof doc.startViewTransition !== "function" || reduced) {
    await update()
    return
  }
  const root = doc.documentElement
  root.setAttribute("data-motion-transition", "")
  try {
    await doc.startViewTransition(update).finished
  } finally {
    root.removeAttribute("data-motion-transition")
  }
}
