/**
 * How wide a list is, apart from or tied to the control that opens it. Shared by
 * `DropdownMenuContent` and `SelectContent`. Every mode keeps at least `--c-menu-min-width` (8rem).
 *
 * | width     | the list is                                                      | for                         |
 * |-----------|------------------------------------------------------------------|-----------------------------|
 * | `trigger` | exactly as wide as its trigger (the default, as before)          | a select-style field        |
 * | `fit`     | as wide as its items, never narrower than the trigger, up to `--c-menu-max-width` | a small button opening longer choices |
 * | `auto`    | as wide as its items, whatever the trigger, up to `--c-menu-max-width` | an icon button, a submenu   |
 *
 * Past the max width an item's label wraps instead of widening the list.
 */
export const MENU_WIDTHS = {
  trigger: "min-w-(--c-menu-min-width) w-(--anchor-width)",
  fit: "w-max min-w-[max(var(--c-menu-min-width),var(--anchor-width))] max-w-[min(var(--c-menu-max-width),var(--available-width))]",
  auto: "w-max min-w-(--c-menu-min-width) max-w-[min(var(--c-menu-max-width),var(--available-width))]",
} as const

export type MenuWidth = keyof typeof MENU_WIDTHS
