// Owned component (not generated): code or output to read and copy, in mono on a raised hairline box, with an optional label and a copy button.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, contract 5.1b #42; not drawn in Figma; no app PR, no DSA record)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { IconButton, type IconButtonProps } from "../icon-button"

/** Every word the copy button draws or says. Swap for another language. */
export const copyButtonCopy = {
  copy: "Copy",
  copied: "Copied",
  failed: "Couldn't copy",
}

/**
 * How long a copy button shows "Copied" before it goes back (cross-app decisions §1: "A control
 * with its own copy button shows 'Copied' for 2 s and raises no toast"). A behaviour timer, not a
 * motion: nothing moves in that time.
 */
export const COPIED_FOR_MS = 2000

export interface CopyButtonProps extends Omit<IconButtonProps, "label" | "icon" | "onClick" | "children" | "render"> {
  /** What is copied, or a function that returns it at the moment of the press. */
  text: string | (() => string)
  /** The name and the tooltip at rest. Name what is copied when more than one copy button is near ("Copy code"). */
  label?: string
  /** The name for the two seconds after a copy. */
  copiedLabel?: string
  /** After the text is on the clipboard. */
  onCopied?: () => void
  /** The clipboard refused (no permission, not a secure page). The button says so for two seconds. */
  onCopyError?: (error: unknown) => void
}

/**
 * Copies a text. For two seconds it shows a check and is named "Copied", and a polite status says
 * so once; no toast (cross-app decisions §1). A ghost 32px icon button, 16px icon, so it sits in a
 * header row, a message's actions or a code block. Not for secrets: those copy through
 * SecretField and CodeDisplay, which clear the clipboard.
 */
export function CopyButton({
  text,
  label = copyButtonCopy.copy,
  copiedLabel = copyButtonCopy.copied,
  onCopied,
  onCopyError,
  variant = "ghost",
  size = "icon-sm",
  ...props
}: CopyButtonProps) {
  const [state, setState] = React.useState<"idle" | "copied" | "failed">("idle")
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  React.useEffect(() => () => clearTimeout(timer.current), [])

  const settle = (next: "copied" | "failed") => {
    setState(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setState("idle"), COPIED_FOR_MS)
  }
  const copy = async () => {
    const value = typeof text === "function" ? text() : text
    try {
      if (!navigator.clipboard?.writeText) throw new Error("The clipboard is not available here.")
      await navigator.clipboard.writeText(value)
      settle("copied")
      onCopied?.()
    } catch (error) {
      settle("failed")
      onCopyError?.(error)
    }
  }

  const name = state === "copied" ? copiedLabel : state === "failed" ? copyButtonCopy.failed : label
  return (
    <>
      <IconButton
        data-slot="copy-button"
        data-state={state}
        variant={variant}
        size={size}
        label={name}
        icon={state === "copied" ? "checkmark" : state === "failed" ? "warning--alt" : "copy"}
        onClick={copy}
        {...props}
      />
      <span role="status" className="sr-only">
        {state === "idle" ? "" : name}
      </span>
    </>
  )
}

export interface CodeBlockProps extends Omit<React.ComponentProps<"figure">, "children"> {
  /** The code or output, exactly as it should be copied. Shown as text, never as markup. */
  code: string
  /**
   * A mono caps line above the code: what it is and where it came from
   * ("What the agent wrote // not checked", "SSH key // ED25519", "src/auth.ts:42"). Type it in
   * sentence case; the overline role sets the capitals. Without one, `language` is shown.
   */
  label?: React.ReactNode
  /** The language, for the host's highlighter and as the label's fallback ("ts", "shell"). */
  language?: string
  /** A copy button in the header. Default true. */
  copy?: boolean
  /** The copy button's name. Default "Copy code". */
  copyLabel?: string
  /** Long lines wrap instead of scrolling sideways. Default false: code keeps its lines. */
  wrap?: boolean
  /** The code's own name for a screen reader, when the label is not plain text. */
  codeLabel?: string
}

/** The words CodeBlock says when the host gives none. */
export const codeBlockCopy = {
  copy: "Copy code",
  code: "Code",
}

/**
 * Code to read and copy: a raised box with a hairline, a header with a mono caps label and a copy
 * button, and the code in `code-inline` mono below. Long lines scroll sideways inside the block,
 * and the code can take focus so a keyboard can scroll it. The code is always text, so an agent's
 * words can never render as anything else.
 */
export function CodeBlock({
  code,
  label,
  language,
  copy = true,
  copyLabel = codeBlockCopy.copy,
  wrap = false,
  codeLabel,
  className,
  ...props
}: CodeBlockProps) {
  const captionId = React.useId()
  const caption = label ?? language
  const hasHeader = caption !== undefined || copy
  return (
    <figure
      data-slot="code-block"
      data-language={language}
      data-wrap={wrap ? "" : undefined}
      // Named by the label alone, not by the copy button that shares its caption.
      aria-labelledby={caption !== undefined ? captionId : undefined}
      className={cn("bg-surface-raised rule-box flex min-w-0 flex-col rounded-lg", className)}
      {...props}
    >
      {hasHeader ? (
        <figcaption data-slot="code-block-header" className="rule-b flex min-h-10 items-center gap-2 pr-1 pl-3">
          <span id={captionId} className="type-overline text-text-label min-w-0 flex-1 truncate">
            {caption}
          </span>
          {copy ? <CopyButton text={code} label={copyLabel} /> : null}
        </figcaption>
      ) : null}
      <pre
        data-slot="code-block-code"
        // Focusable so a keyboard can scroll a long line; a named group, so the stop says what it is.
        tabIndex={0}
        role="group"
        aria-label={codeLabel ?? (typeof caption === "string" ? caption : codeBlockCopy.code)}
        className={cn(
          "type-code-inline text-text-body m-0 min-w-0 overflow-x-auto p-3 [tab-size:2]",
          wrap ? "break-words whitespace-pre-wrap" : "whitespace-pre"
        )}
      >
        <code>{code}</code>
      </pre>
    </figure>
  )
}
