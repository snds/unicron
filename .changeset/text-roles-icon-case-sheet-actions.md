---
"@unicron/ui": minor
---

Text roles, icons that keep their case, and sheet actions beside the close button.

- **Text roles** (`type-page-title`, `type-section-title`, `type-group-title`, `type-body`,
  `type-body-strong`, `type-support`, `type-meta`, `type-overline`, `type-measure`), documented
  in DESIGN.md: every size comes from a role, never a hand-picked pixel size.
- **`Icon`** never takes the surrounding text's case or tracking: in an uppercase label, "link"
  became "LINK", which isn't an icon, and the letters showed.
- **`SheetHeaderActions`**: a sheet's own actions in one row with its close button, at its top
  and size (`IconButton size="icon-sm"`), so the icons line up; the header keeps clear of both.
