import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DiffBlock, parseDiffLines, parseUnifiedDiff, type DiffLine } from "./diff-block"

const LOGIN: DiffLine[] = [
  { kind: "context", text: "export async function login(req: LoginRequest) {" },
  { kind: "removed", text: "  const hash = await argon2.hash(req.password)" },
  { kind: "added", text: "  const msg1 = req.opaqueStart" },
  { kind: "context", text: "}" },
]

const slots = (container: HTMLElement, name: string) => [...container.querySelectorAll(`[data-slot="${name}"]`)] as HTMLElement[]

describe("parseDiffLines and parseUnifiedDiff", () => {
  it("reads marks and numbers from a hunk", () => {
    const lines = parseDiffLines("@@ -1,2 +1,2 @@\n {\n-  \"version\": \"0.15.0\",\n+  \"version\": \"0.16.0\",\n")
    expect(lines.map((l) => l.kind)).toEqual(["hunk", "context", "removed", "added"])
    expect(lines[1]).toMatchObject({ oldNumber: 1, newNumber: 1, text: "{" })
    expect(lines[2]).toMatchObject({ oldNumber: 2, text: '  "version": "0.15.0",' })
    expect(lines[3]).toMatchObject({ newNumber: 2 })
  })

  it("names each file's state: added, deleted, renamed, modified", () => {
    const files = parseUnifiedDiff(
      [
        "diff --git a/a.md b/a.md",
        "new file mode 100644",
        "--- /dev/null",
        "+++ b/a.md",
        "@@ -0,0 +1 @@",
        "+hello",
        "diff --git a/b.md b/b.md",
        "deleted file mode 100644",
        "--- a/b.md",
        "+++ /dev/null",
        "@@ -1 +0,0 @@",
        "-bye",
        "diff --git a/old.ts b/new.ts",
        "similarity index 100%",
        "rename from old.ts",
        "rename to new.ts",
        "diff --git a/c.json b/c.json",
        "--- a/c.json",
        "+++ b/c.json",
        "@@ -1 +1 @@",
        "-1",
        "+2",
      ].join("\n")
    )
    expect(files.map((f) => [f.path, f.state])).toEqual([
      ["a.md", "added"],
      ["b.md", "deleted"],
      ["new.ts", "renamed"],
      ["c.json", "modified"],
    ])
    expect(files[2].previousPath).toBe("old.ts")
  })
})

describe("DiffBlock (contract 5.1a, 5.1b #43)", () => {
  it("added lines on the neutral diff-added wash, removed on diff-removed; the + and − marks always show", () => {
    const { container } = render(<DiffBlock path="server/auth/login.ts" lines={LOGIN} />)
    const lines = slots(container, "diff-block-line")
    expect(lines.map((l) => l.dataset.kind)).toEqual(["context", "removed", "added", "context"])
    expect(lines[1].innerHTML).toContain("bg-diff-removed")
    expect(lines[2].innerHTML).toContain("bg-diff-added")
    expect(lines[0].innerHTML).not.toMatch(/bg-diff-/)
    const marks = slots(container, "diff-block-mark")
    expect(marks.map((m) => m.textContent)).toEqual(["", "−", "+", ""])
    expect(marks[1].className).toContain("text-critical-text")
    expect(marks[2].className).toContain("text-foreground")
    // Read, not only seen: the change is in words for a screen reader.
    expect(lines[1]).toHaveTextContent("Removed:")
    expect(lines[2]).toHaveTextContent("Added:")
  })

  it("code-inline type, 28 a line, in a raised box with a hairline that scrolls sideways", () => {
    const { container } = render(<DiffBlock lines={LOGIN} />)
    const box = slots(container, "diff-block-box")[0]
    expect(box.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box", "overflow-x-auto", "py-2.5"]))
    expect(slots(container, "diff-block-line")[0].className).toContain("type-code-inline")
    expect(slots(container, "diff-block-line")[0].innerHTML).toContain("py-1")
    expect(slots(container, "diff-block-code")[0].className).toContain("whitespace-pre")
    expect(slots(container, "diff-block-lines")[0].className).toContain("w-max")
  })

  it("the header: the path as typed, +n −n counted, a state Badge", () => {
    const { container } = render(<DiffBlock path="server/auth/login.ts" state="modified" lines={LOGIN} />)
    expect(screen.getByRole("region", { name: "Changes to server/auth/login.ts" })).toBeInTheDocument()
    const path = slots(container, "diff-block-path")[0]
    expect(path).toHaveTextContent("server/auth/login.ts")
    expect(path.className).toContain("type-meta")
    expect(path.className).not.toContain("type-overline")
    expect(slots(container, "diff-block-stats")[0]).toHaveTextContent("+1 −1")
    expect(slots(container, "diff-block-stats")[0]).toHaveTextContent("1 lines added, 1 removed")
    expect(slots(container, "badge")[0]).toHaveTextContent("Modified")
  })

  it("counts may be given for a file whose lines are not all here", () => {
    const { container } = render(<DiffBlock path="server/auth/login.ts" additions={34} deletions={41} lines={LOGIN} />)
    expect(slots(container, "diff-block-stats")[0]).toHaveTextContent("+34 −41")
  })

  it("a renamed file shows old → new", () => {
    render(<DiffBlock path="new.ts" previousPath="old.ts" state="renamed" lines={[]} />)
    expect(screen.getByText(/old\.ts/)).toHaveTextContent("old.ts → renamed to new.ts")
  })

  it("line numbers in a gutter outside the wash", () => {
    const { container } = render(<DiffBlock lines={parseDiffLines("@@ -9,2 +9,2 @@\n-a\n+b\n")} lineNumbers />)
    const gutters = slots(container, "diff-block-numbers")
    expect(gutters).toHaveLength(3)
    expect(gutters[1]).toHaveTextContent("9")
    expect(gutters[1].className).not.toMatch(/bg-diff/)
    expect(gutters[1]).toHaveAttribute("aria-hidden", "true")
  })

  it("foldable: the path is a disclosure button; folded, the lines are hidden and Wrap and Copy go", async () => {
    const onOpenChange = vi.fn()
    const { container } = render(<DiffBlock path="docs/auth.md" lines={LOGIN} foldable defaultOpen={false} onOpenChange={onOpenChange} />)
    const fold = screen.getByRole("button", { name: /docs\/auth\.md/ })
    expect(fold).toHaveAttribute("aria-expanded", "false")
    expect(slots(container, "diff-block-box")[0]).not.toBeVisible()
    expect(screen.queryByRole("button", { name: "Copy" })).toBeNull()
    await userEvent.click(fold)
    expect(fold).toHaveAttribute("aria-expanded", "true")
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(slots(container, "diff-block-box")[0]).toBeVisible()
    expect(fold).toHaveAttribute("aria-controls", slots(container, "diff-block-box")[0].id)
  })

  it("past maxLines the rest wait behind a button", async () => {
    const many: DiffLine[] = Array.from({ length: 12 }, (_, i) => ({ kind: "added", text: `line ${i + 1}` }))
    const { container } = render(<DiffBlock lines={many} maxLines={10} />)
    expect(slots(container, "diff-block-line")).toHaveLength(10)
    await userEvent.click(screen.getByRole("button", { name: "Show 2 more lines" }))
    expect(slots(container, "diff-block-line")).toHaveLength(12)
  })

  it("Wrap is a toggle button; wrapped lines break instead of scrolling", async () => {
    const { container } = render(<DiffBlock path="harness/visual-qa/config.ts" lines={LOGIN} />)
    const wrap = screen.getByRole("button", { name: "Wrap", pressed: false })
    await userEvent.click(wrap)
    expect(wrap).toHaveAttribute("aria-pressed", "true")
    expect(slots(container, "diff-block-code")[0].className).toContain("whitespace-pre-wrap")
    expect(slots(container, "diff-block-lines")[0].className).toContain("w-full")
  })

  it("Copy puts the diff on the clipboard with its marks, says Copied for 2 s, raises no toast", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
    render(<DiffBlock path="server/auth/login.ts" lines={LOGIN} />)
    await act(async () => {
      screen.getByRole("button", { name: "Copy" }).click()
    })
    expect(writeText).toHaveBeenCalledWith(" export async function login(req: LoginRequest) {\n-  const hash = await argon2.hash(req.password)\n+  const msg1 = req.opaqueStart\n }")
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent("Copied")
    await act(async () => {
      vi.advanceTimersByTime(2000)
    })
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument()
    vi.useRealTimers()
  })
})

describe("DiffBlock's box when a line is wider than it", () => {
  /** jsdom has no layout: give every element the widths a browser would measure. */
  function widths(scrollWidth: number, clientWidth: number) {
    const spies = [
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(scrollWidth),
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(clientWidth),
    ]
    return () => spies.forEach((spy) => spy.mockRestore())
  }
  const box = (container: HTMLElement) => container.querySelector('[data-slot="diff-block-box"]') as HTMLElement

  it("takes focus, is a group and has a name, so a keyboard can scroll it in every engine", () => {
    const restore = widths(900, 320)
    const { container } = render(<DiffBlock path="apps/web/src/auth/login.ts" lines={LOGIN} />)
    expect(box(container)).toHaveAttribute("tabindex", "0")
    expect(box(container)).toHaveAttribute("data-scrolls")
    expect(screen.getByRole("group", { name: "Changes to apps/web/src/auth/login.ts, lines" })).toBe(box(container))
    restore()
  })

  it("the same with no header, where there is no Wrap button to fall back on", () => {
    const restore = widths(900, 320)
    const { container } = render(<DiffBlock lines={LOGIN} />)
    expect(screen.queryByRole("button", { name: "Wrap" })).toBeNull()
    expect(box(container)).toHaveAttribute("tabindex", "0")
    expect(screen.getByRole("group", { name: "Changes, lines" })).toBe(box(container))
    restore()
  })

  it("a box whose lines fit is no tab stop and has no role", () => {
    const restore = widths(320, 320)
    const { container } = render(<DiffBlock path="apps/web/src/auth/login.ts" lines={LOGIN} />)
    expect(box(container)).not.toHaveAttribute("tabindex")
    expect(box(container)).not.toHaveAttribute("role")
    expect(box(container)).not.toHaveAttribute("aria-label")
    restore()
  })
})
