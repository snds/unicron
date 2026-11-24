import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// The named sizes from @unicron/tokens' spacing map (h-control-m, size-icon, min-h-touch-min…),
// so a caller's `h-auto` or `size-8` replaces a variant's `h-control-m` instead of landing beside it.
const twMerge = extendTailwindMerge({
  extend: { theme: { spacing: ["control", "control-s", "control-m", "control-l", "touch-min", "icon"] } },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
