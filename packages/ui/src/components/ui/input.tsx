// Generated from shadcn/ui (MIT) by the shadcn-material transform (base: Base UI, style: nova). See README → Regenerating components.
// Edit freely — this is owned source, like any shadcn component.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Figma 32:48 "Text Field" box; no app PR, no DSA record)
import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"
import { cva } from "class-variance-authority"
import { cn } from "../../lib/utils"

/**
 * On a touch screen a field's text is 16px, the body size, not the `ui` role's 15: iOS zooms the
 * page into any field set under 16px when it takes focus. The line height stays the role's 20.
 */
export const fieldTextOnTouch = "pointer-coarse:text-(length:--type-body-size)"

/**
 * The Text Field's box (Figma 32:48), for every field: Input, Textarea, InputGroup, the Select and
 * NativeSelect triggers, TextField and ChipField. The raised surface with a 1px rule drawn inside
 * it (a stroke never adds height), at least the control height (48), 16px in from the sides, the
 * value in the `ui` role. Focus is Figma's 2px inside border in the primary fill, and no outer
 * ring; invalid is the same border in the critical fill, and it stays while focused. Read-only
 * drops the fill and keeps the rule. Disabled is half strength.
 *
 * `focus` is the box's own focus (an input); `within` is a box that holds the control (a group).
 */
const fieldBoxVariants = cva(
  cn("rounded-lg bg-surface-raised type-ui text-foreground rule-box outline-none transition-[box-shadow,background-color]", fieldTextOnTouch),
  {
    variants: {
      focus: {
        self: "focus:rule-box-emphasis aria-invalid:rule-box-emphasis aria-invalid:[--rule-color:var(--critical-fill)] [&[readonly]:not([aria-disabled=true])]:bg-transparent disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
        within:
          "focus-within:rule-box-emphasis has-[[aria-invalid=true]]:rule-box-emphasis has-[[aria-invalid=true]]:[--rule-color:var(--critical-fill)] has-[[data-slot$=-control][readonly]:not([aria-disabled=true])]:bg-transparent has-[[data-slot$=-control]:disabled]:opacity-50 has-[[data-slot$=-control][aria-disabled=true]]:opacity-50",
      },
    },
    defaultVariants: { focus: "self" },
  }
)

// The placeholder is the label ink (Figma has no placeholder; the label ink is the quietest ink
// that is still read). A file input keeps its own button, in the overline.
const INPUT =
  "h-control w-full min-w-0 px-4 placeholder:text-muted-foreground file:mr-3 file:inline-flex file:h-full file:border-0 file:bg-transparent file:type-overline file:text-foreground"

/** A one-line field in the Text Field's box. Pair it with a `Label` (or use `TextField`). */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <InputPrimitive type={type} data-slot="input" className={cn(fieldBoxVariants(), INPUT, className)} {...props} />
}

export { Input, fieldBoxVariants }
