// Owned component (not generated): rendered Markdown or HTML text (a reply, a note) styled from the type roles alone.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #41; not drawn in Figma; no app PR, no DSA record)
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

// Every rule below styles plain elements (what a Markdown renderer writes) from a type role, a
// colour role and the 4px spacing scale. No size, weight or colour is picked by hand.
const FLOW = [
  // Blocks 16 apart; a heading 32 after what precedes it and 8 before what it heads, so a
  // section reads as a group (rules 5.4: space inside a group is half the space between).
  "[&>*+*]:mt-4 [&>*+:is(h1,h2,h3,h4,h5,h6)]:mt-8 [&>:is(h1,h2,h3,h4,h5,h6)+*]:mt-2",
].join(" ")

const HEADINGS = [
  "[&_:is(h1,h2,h3,h4,h5,h6)]:text-text-body",
  "[&_h1]:type-lead",
  "[&_:is(h2,h3)]:type-subtitle",
  // h4 to h6 and bold text: the variant's own size and leading, in the strong weight (contract
  // 5.1c C20: no 24th role; a reply's bold reads at the reply's size).
  "[&_:is(h4,h5,h6,strong,b)]:[font-weight:var(--type-body-strong-weight)]",
].join(" ")

const LISTS = [
  // Square markers: marks are squares (contract §1.6). Numbers line up.
  "[&_ul]:list-[square] [&_ol]:list-decimal [&_ol]:tabular-nums [&_:is(ul,ol)]:pl-6",
  "[&_li]:pl-1 [&_li+li]:mt-1 [&_li>:is(ul,ol)]:mt-1 [&_li::marker]:text-text-label",
].join(" ")

const INLINE = [
  // A link is the identity text colour, underlined, so colour never carries it alone.
  "[&_a]:text-primary-text [&_a]:underline [&_a]:underline-offset-3 [&_a:hover]:text-text-body",
  // Inline code: the mono code role in a raised hairline box.
  "[&_:not(pre)>code]:type-code-inline [&_:not(pre)>code]:bg-surface-raised [&_:not(pre)>code]:rule-box [&_:not(pre)>code]:rounded-sm [&_:not(pre)>code]:px-1",
].join(" ")

const BLOCKS = [
  // A quote: secondary ink behind a hairline on its left.
  "[&_blockquote]:text-text-secondary [&_blockquote]:rule-l [&_blockquote]:pl-4",
  // A code block the host did not hand to CodeBlock: the same box CodeBlock draws, without its header.
  "[&_pre]:type-code-inline [&_pre]:text-text-body [&_pre]:bg-surface-raised [&_pre]:rule-box [&_pre]:rounded-lg [&_pre]:p-3 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre",
  // A table scrolls sideways inside itself. Overline heads, body rows under hairlines.
  "[&_table]:block [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:border-separate [&_table]:border-spacing-0",
  "[&_th]:type-overline [&_th]:text-text-label [&_th]:text-left [&_th]:align-bottom [&_th]:rule-b [&_th]:py-2 [&_th]:pr-4",
  "[&_td]:type-body [&_td]:align-top [&_td]:rule-b [&_td]:py-2 [&_td]:pr-4",
  // A thematic break is one hairline. Its 1px comes out of the space under it, so it adds no
  // height and every line after it stays on the 4px grid (contract §1.6).
  "[&_hr]:h-(--stroke-rule) [&_hr]:-mb-(--stroke-rule) [&_hr]:border-0 [&_hr]:bg-line-rule",
].join(" ")

const proseVariants = cva(cn("min-w-0 text-text-body break-words", FLOW, HEADINGS, LISTS, INLINE, BLOCKS), {
  variants: {
    variant: {
      // A note, a description, a mail body: the body role.
      body: "type-body",
      // What a model wrote: the response role, a little larger and looser.
      response: "type-response",
    },
  },
  defaultVariants: { variant: "body" },
})

export type ProseVariant = NonNullable<VariantProps<typeof proseVariants>["variant"]>

export interface ProseProps extends React.ComponentProps<"div">, VariantProps<typeof proseVariants> {}

/**
 * Rendered text: what a Markdown renderer or a sanitiser hands over (headings, paragraphs, lists,
 * links, quotes, inline code, code blocks, tables, rules), styled from the type roles alone.
 * `variant="body"` for notes and mail; `variant="response"` for what a model wrote. h1 takes the
 * lead role; h2 and h3 subtitle; h4 to h6 and bold text keep the variant's size in the strong
 * weight. The host renders the elements and decides what is safe (no raw HTML from a model, images
 * as links); Prose only draws them. Put a code block that should copy in a CodeBlock.
 */
function Prose({ variant = "body", className, ...props }: ProseProps) {
  return <div data-slot="prose" data-variant={variant} className={cn(proseVariants({ variant }), className)} {...props} />
}

export { Prose, proseVariants }
