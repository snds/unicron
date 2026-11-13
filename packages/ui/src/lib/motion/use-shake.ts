// Owned helper (not generated): arms the `data-shake` recipe in styles/motion.css.
import * as React from "react"

export interface Shake {
  /** Spread on the element that should shake: `<div {...shake.props}>`. */
  props: {
    "data-shake": "a" | "b" | undefined
    onAnimationEnd: (event: React.AnimationEvent) => void
  }
  /** True from `shake()` until the animation ends. */
  shaking: boolean
  /** Shake once. Called again mid-shake, it starts over. */
  shake: () => void
}

/**
 * A refusal the user can see: a wrong code, a rejected field. Pair it with the error colour and
 * the error text, which are what remain under reduced motion (the stylesheet stills the shake).
 */
export function useShake(): Shake {
  const [count, setCount] = React.useState(0)
  const shake = React.useCallback(() => setCount((n) => (n <= 0 ? 1 : n + 1)), [])
  // The recipe has two identical keyframe sets; flipping between them restarts the animation.
  const name = count <= 0 ? undefined : count % 2 === 1 ? "a" : "b"
  const onAnimationEnd = React.useCallback((event: React.AnimationEvent) => {
    if (event.target !== event.currentTarget) return
    // Another animation on the same element ending is not ours to act on.
    const name = event.animationName
    if (name && !name.startsWith("motion-shake")) return
    setCount(0)
  }, [])
  return { props: { "data-shake": name, onAnimationEnd }, shaking: count > 0, shake }
}
