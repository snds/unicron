---
"@unicron/ui": patch
---

`buttonVariants` merges its own classes, so a link drawn as a button keeps its outline. Before, the
base's `border-transparent` and the outline variant's `border-border` both landed in the class list,
and the transparent one won in light mode: a `<Link className={buttonVariants({ variant: "outline" })}>`
had no edge beside a real `Button`.
