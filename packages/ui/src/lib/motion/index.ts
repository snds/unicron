// @unicron/ui/motion: the helpers and the contracts behind styles/motion.css.
export { useMediaQuery, useReducedMotion } from "./use-reduced-motion"
export { useShake, type Shake } from "./use-shake"
export { rubberBand } from "./rubber-band"
export {
  DISMISS_SHARE,
  FLICK_SPEED,
  RELEASE_WINDOW_MS,
  releaseShare,
  releaseVelocity,
  shouldDismiss,
  type DragSample,
} from "./drag-release"
export { withViewTransition } from "./view-transition"
export {
  motionContracts,
  type MotionContract,
  type MotionContractId,
  type MotionDurationRole,
  type MotionFrequency,
} from "./contracts"
