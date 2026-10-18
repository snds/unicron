---
"@unicron/ui": minor
---

`SheetContent size` gives a side sheet the dialog's widths (`sm` 24rem by default, `md`, `lg`, `xl` 42rem, `2xl` 48rem), so a size means the same width on a sheet as on a dialog. The header now keeps clear of the close button (a long title wraps before it, not under it), titles and descriptions wrap long words, and `SheetFooter` puts its actions in a row from `sm` up, right-aligned like `DialogFooter` (still stacked on phones). Found building Synapse's detail sheets, which needed five class overrides for these.
