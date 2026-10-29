---
"@unicron/tokens": minor
"@unicron/ui": minor
---

Visual QA fixes from 2026-10-28, and a pressed state for buttons and rows.

- **`DropdownMenuLabel` no longer crashes outside a group.** On its own it draws a plain label; inside
  `DropdownMenuGroup` or `DropdownMenuRadioGroup` it still names the group.
- **Rings clear 3:1.** The destructive Button and Badge use the shared focus ring (theirs was 1.43:1
  in light). The `aria-invalid` ring on every control is now `ring-destructive/60` (dark `/50`), up
  from `/20` (`/40`). Both are in the contrast gate. Invalid fields draw a stronger red ring.
- **`Button size="inline"` is underlined at rest.**
- **`.light` scope.** Light tokens are emitted on `:root, .light`, and the `dark:` variant stops at a
  nested `.light`, so a light box inside a dark page stays light.
- **Command scrolls only its list.** cmdk's `scrollIntoView` used to scroll the page to an inline
  Command on mount.
- **ghost-destructive hovers on its own tint** (`bg-destructive/10`, dark `/20`), so the hover shows
  on a muted footer.
- **Motion roles.** New `--motion-fast` (120ms), `--motion-base` (200ms), `--motion-ease`. Tailwind's
  default transition runs on them (`--default-transition-duration`, `-timing-function`,
  `ease-standard`). Dialogs enter in 120ms (were 100ms); toasts move on 200ms (sonner's 400ms ease);
  Button transitions only the properties it changes.
- **Pressed (`active:`) state** on every Button variant and interactive `Item` row, different from
  hover, with its contrast gated.
- Docs: the disabled-control contrast exemption, `.light`, motion and pressed states.
