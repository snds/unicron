import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { resolve } from "node:path"
import { act, fireEvent, render, screen } from "@testing-library/react"
import type * as React from "react"
import { compile } from "tailwindcss"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { Command, CommandDialog, CommandInput, CommandList } from "./command"
import {
  Dialog,
  DialogAction,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverline,
  DialogTitle,
  dialogSizeName,
} from "./dialog"

// The strip a desktop app renders so its window stays draggable while a dialog is open (issue #7).
const strip = <div aria-hidden data-testid="drag-strip" className="fixed inset-x-0 top-0 z-50 h-13" data-tauri-drag-region="deep" />

const overlay = () => document.querySelector('[data-slot="dialog-overlay"]') as HTMLElement
const popup = () => document.querySelector('[data-slot="dialog-content"]') as HTMLElement

function Subject({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent beforeContent={strip}>
        <DialogHeader>
          <DialogTitle>Delete thread?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

describe("DialogContent beforeContent", () => {
  it("renders the slot between the backdrop and the popup, in document order", () => {
    render(<Subject />)
    const slot = screen.getByTestId("drag-strip")
    expect(slot).toHaveAttribute("data-tauri-drag-region", "deep")
    // Backdrop → slot → popup: at the same z-index the later element paints on top.
    expect(overlay().compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(popup()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Outside the popup, so it is not part of the dialog's content.
    expect(popup().contains(slot)).toBe(false)
    expect(slot.parentElement).toBe(popup().parentElement)
  })

  it("a press on the slot does not dismiss; a press on the backdrop does", () => {
    const onOpenChange = vi.fn()
    render(<Subject onOpenChange={onOpenChange} />)
    fireEvent.click(screen.getByTestId("drag-strip"))
    expect(onOpenChange).not.toHaveBeenCalled()
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("renders nothing extra when the slot is empty", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Plain</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    // Between the backdrop and the popup there is only Base UI's own focus guard.
    const children = Array.from(popup().parentElement!.children)
    const between = children.slice(children.indexOf(overlay()) + 1, children.indexOf(popup()))
    expect(between.every((el) => el.hasAttribute("data-base-ui-focus-guard"))).toBe(true)
  })

  it("CommandDialog threads the slot through to its DialogContent", () => {
    render(
      <CommandDialog open beforeContent={strip}>
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    const slot = screen.getByTestId("drag-strip")
    expect(overlay().compareDocumentPosition(slot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(slot.compareDocumentPosition(popup()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(popup().contains(slot)).toBe(false)
  })
})

describe("DialogContent size", () => {
  // Sizes by name (cross-app decisions §14, contract §5.1b row 15). Each is a range between two
  // knobs; both are the drawn width by default.
  const tokens = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component/overlays.json"), "utf8")
  )
  it.each([
    ["question", "30rem"],
    ["review", "35rem"],
    ["form", "40rem"],
    ["compose", "45rem"],
    ["viewer", "60rem"],
  ] as const)("%s is %s, read from its two knobs", (size, width) => {
    render(
      <Dialog open>
        <DialogContent size={size}>
          <DialogTitle>Sized</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const cls = popup().className.split(" ")
    expect(popup()).toHaveAttribute("data-size", size)
    expect(cls).toContain(`[--dialog-min-width:var(--c-dialog-${size}-min-width)]`)
    expect(cls).toContain(`[--dialog-max-width:var(--c-dialog-${size}-max-width)]`)
    expect(tokens.dialog[size]["min-width"].$value).toBe(width)
    expect(tokens.dialog[size]["max-width"].$value).toBe(width)
  })

  it("never outgrows the screen less --c-dialog-margin on each side, at any width (Synapse SNA5)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Capped</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const cls = popup().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining([
        "w-max",
        "min-w-[min(var(--dialog-min-width),calc(100%-2*var(--c-dialog-margin)))]",
        "max-w-[min(var(--dialog-max-width),calc(100%-2*var(--c-dialog-margin)))]",
        "max-h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]",
      ])
    )
    // Not only from sm up: a phone keeps the margin too.
    expect(cls.some((c) => c.startsWith("sm:"))).toBe(false)
    expect(tokens.dialog.margin.$value).toBe("1.5rem")
  })

  it("full takes the whole window less the margin, both ways", () => {
    render(
      <Dialog open>
        <DialogContent size="full">
          <DialogTitle>Kit page</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const cls = popup().className.split(" ")
    expect(cls).toEqual(
      expect.arrayContaining([
        "[--dialog-min-width:100%]",
        "[--dialog-max-width:100%]",
        "h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]",
      ])
    )
  })

  it("is form (640) by default", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Default</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(popup()).toHaveAttribute("data-size", "form")
  })

  it.each([
    ["xs", "question"],
    ["sm", "question"],
    ["md", "review"],
    ["lg", "form"],
    ["xl", "compose"],
    ["2xl", "viewer"],
  ] as const)("the old name %s takes %s", (old, name) => {
    expect(dialogSizeName(old)).toBe(name)
    render(
      <Dialog open>
        <DialogContent size={old}>
          <DialogTitle>Old</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const all = document.querySelectorAll<HTMLElement>('[data-slot="dialog-content"]')
    expect(all[all.length - 1]).toHaveAttribute("data-size", name)
  })

  it("CommandDialog keeps a fixed width, the size's min, so it doesn't resize as results change", () => {
    render(
      <CommandDialog open size="review">
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    const cls = popup().className.split(" ")
    expect(cls).toContain("w-[min(var(--dialog-min-width),calc(100%-2*var(--c-dialog-margin)))]")
    expect(cls).not.toContain("w-max")
  })
})

describe("Dialog closeOnOutsideClick", () => {
  function Editor(props: React.ComponentProps<typeof Dialog>) {
    return (
      <Dialog open {...props}>
        <DialogContent>
          <DialogTitle>Edit note</DialogTitle>
        </DialogContent>
      </Dialog>
    )
  }

  it("closes on a backdrop click by default", () => {
    const onOpenChange = vi.fn()
    render(<Editor onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("stays open on a backdrop click when turned off (unsaved work, a destructive step)", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick={false} onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("still closes on Escape when turned off", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick={false} onOpenChange={onOpenChange} />)
    fireEvent.keyDown(popup(), { key: "Escape" })
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("Base UI's disablePointerDismissal, if passed, wins", () => {
    const onOpenChange = vi.fn()
    render(<Editor closeOnOutsideClick disablePointerDismissal onOpenChange={onOpenChange} />)
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it("CommandDialog passes it through", () => {
    const onOpenChange = vi.fn()
    render(
      <CommandDialog open closeOnOutsideClick={false} onOpenChange={onOpenChange}>
        <Command>
          <CommandInput placeholder="Type a command" />
          <CommandList />
        </Command>
      </CommandDialog>
    )
    fireEvent.click(overlay())
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe("DialogFooter sticky", () => {
  const footer = () => document.querySelector('[data-slot="dialog-footer"]') as HTMLElement

  it("is not sticky by default: the actions at the right, 16 apart, no fill and no rule (as drawn)", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Plain</DialogTitle>
          <DialogFooter>Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    const cls = footer().className.split(" ")
    expect(footer()).not.toHaveAttribute("data-sticky")
    expect(cls).not.toContain("sticky")
    expect(cls).toEqual(expect.arrayContaining(["flex", "justify-end", "gap-4"]))
    expect(cls.some((c) => c.startsWith("bg-") || c.startsWith("border") || c.startsWith("rule-"))).toBe(false)
  })

  it("pins to the popup's bottom edge, over its padding, opaque, with a hairline above", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Long</DialogTitle>
          <DialogFooter sticky>Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    const cls = footer().className.split(" ")
    expect(footer()).toHaveAttribute("data-sticky", "true")
    expect(cls).toEqual(expect.arrayContaining(["sticky", "-bottom-(--c-dialog-padding)", "bg-surface-raised", "rule-t"]))
  })

  it("DialogActions takes it too", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Long</DialogTitle>
          <DialogActions sticky>
            <DialogAction>Save</DialogAction>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
    expect(footer()).toHaveAttribute("data-sticky", "true")
  })
})

describe("Dialog padding (--c-dialog-padding)", () => {
  // A sticky footer reaches out by the content's padding to run edge to edge. Both read one
  // variable, so a dialog that changes it keeps its footer flush. jsdom applies no Tailwind, so
  // compile each element's classes with Tailwind itself and resolve the variable the way the
  // browser would: the popup's own override, else the token.
  const require = createRequire(import.meta.url)
  const tokens = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../../../../tokens/tokens/component/overlays.json"), "utf8")
  )
  const utilities = readFileSync(require.resolve("tailwindcss/utilities.css"), "utf8")

  /** The declarations an element's unconditional classes set (no sm:, data-open: and so on). */
  async function declarations(el: HTMLElement) {
    const out = new Map<string, string>()
    for (const c of el.className.split(" ").filter((c) => c && !/^[\w-]+:/.test(c))) {
      // A fresh compiler per class: build() keeps every class it has seen and returns them all.
      const tw = await compile('@import "tailwindcss/utilities";', {
        loadStylesheet: async (_id, base) => ({ path: "utilities.css", base, content: utilities }),
      })
      for (const [, prop, value] of tw.build([c]).matchAll(/^\s*([-\w]+): ([^;]+);$/gm)) out.set(prop, value)
    }
    return out
  }

  async function measure(className?: string) {
    render(
      <Dialog open>
        <DialogContent className={className}>
          <DialogTitle>Padded</DialogTitle>
          <DialogFooter sticky>Actions</DialogFooter>
        </DialogContent>
      </Dialog>
    )
    // The newest popup: the last test's may still be in the portal, closing.
    const el = Array.from(document.querySelectorAll<HTMLElement>('[data-slot="dialog-content"]')).at(-1)!
    const popupCss = await declarations(el)
    const scrollCss = await declarations(el.querySelector('[data-slot="dialog-scroll"]') as HTMLElement)
    const footerCss = await declarations(el.querySelector('[data-slot="dialog-footer"]') as HTMLElement)
    const pad = popupCss.get("--c-dialog-padding") ?? tokens.dialog.padding.$value
    const value = (v?: string) => v?.replaceAll("var(--c-dialog-padding)", pad).replace(/^calc\((.+) \* -1\)$/, "-$1")
    return {
      pad,
      contentPadding: value(scrollCss.get("padding")),
      footer: {
        marginInline: value(footerCss.get("margin-inline")),
        marginTop: value(footerCss.get("margin-top")),
        marginBottom: value(footerCss.get("margin-bottom")),
        padding: value(footerCss.get("padding")),
        bottom: value(footerCss.get("bottom")),
      },
    }
  }

  it("is 1.5rem by default, the 24 Figma's dialogs draw, with 1rem above the header", async () => {
    expect(tokens.dialog.padding.$value).toBe("1.5rem")
    expect(tokens.dialog["padding-top"].$value).toBe("1rem")
    expect(await measure()).toEqual({
      pad: "1.5rem",
      contentPadding: "1.5rem",
      footer: { marginInline: "-1.5rem", marginTop: "-1.5rem", marginBottom: "-1.5rem", padding: "1.5rem", bottom: "-1.5rem" },
    })
  })

  it.each(["1rem", "0px", "2rem"])("an override to %s keeps the footer's bleed equal to the padding", async (pad) => {
    const m = await measure(`[--c-dialog-padding:${pad}]`)
    expect(m.contentPadding).toBe(pad)
    expect(m.footer).toEqual({ marginInline: `-${pad}`, marginTop: `-${pad}`, marginBottom: `-${pad}`, padding: pad, bottom: `-${pad}` })
  })
})

describe("Dialog motion", () => {
  // The 2026-10-28 review moved the dialog off Tailwind's 100ms onto a motion role (120ms both
  // ways). On 2026-11-12 Sean set the entrance to the pop recipe's own pace: 200ms in, 120ms out.
  // The timing now lives in the recipes (styles/motion.css), not in a duration class here, and
  // the browser checks (apps/playground/tests) measure it.
  it("opens and closes on the pop and fade recipes, with no raw duration", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Timed</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(overlay().className.split(" ")).toContain("motion-fade")
    expect(popup().className.split(" ")).toContain("motion-pop")
    for (const el of [overlay(), popup()]) {
      const cls = el.className.split(" ")
      // The full pop, not the short one: 200ms in.
      expect(cls).not.toContain("motion-pop-fast")
      expect(cls.some((c) => /^duration-/.test(c))).toBe(false)
      // Transitions, not keyframes: dismissed mid-open, it turns round instead of restarting.
      expect(cls.some((c) => c.includes("animate-in") || c.includes("animate-out"))).toBe(false)
    }
  })
})

describe("Dialog anatomy (2026-11: Lockdown D05, D09; Vale D02)", () => {
  function NewLogin({ onOpenChange, showCloseButton }: { onOpenChange?: (open: boolean) => void; showCloseButton?: boolean }) {
    return (
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent showCloseButton={showCloseButton}>
          <DialogHeader>
            <DialogOverline>New login // personal vault</DialogOverline>
            <DialogTitle>github.com</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <label>
              Website
              <input defaultValue="github.com" />
            </label>
          </DialogBody>
          <DialogActions>
            <DialogAction kind="cancel">Cancel</DialogAction>
            <DialogAction icon="checkmark">Save login</DialogAction>
          </DialogActions>
        </DialogContent>
      </Dialog>
    )
  }

  it("is named by its title, with the overline above it in the overline role", () => {
    render(<NewLogin />)
    expect(screen.getByRole("dialog", { name: "github.com" })).toBeInTheDocument()
    expect(screen.getByText("New login // personal vault").className.split(" ")).toEqual(
      expect.arrayContaining(["type-overline", "text-text-label"])
    )
    expect(screen.getByRole("heading", { name: "github.com" }).className.split(" ")).toEqual(
      expect.arrayContaining(["type-lead", "text-text-body"])
    )
  })

  it("is solid and square: the raised surface, the 2px corner, a 1px rule drawn over the content, no blur or shadow", () => {
    render(<NewLogin />)
    const cls = popup().className.split(" ")
    expect(cls).toEqual(expect.arrayContaining(["bg-surface-raised", "rounded"]))
    expect(cls.some((c) => /blur|shadow|ring-|rounded-(xl|lg|md)/.test(c))).toBe(false)
    const rule = popup().querySelector('[data-slot="dialog-rule"]') as HTMLElement
    expect(rule.className.split(" ")).toEqual(expect.arrayContaining(["rule-box", "absolute", "inset-0", "pointer-events-none"]))
    expect(rule).toHaveAttribute("aria-hidden")
    expect(overlay().className.split(" ")).toContain("scrim-dialog")
  })

  it("closes from a neutral FloatButton M named Close, drawn at the header's top right, and the header keeps clear of it", () => {
    const onOpenChange = vi.fn()
    render(<NewLogin onOpenChange={onOpenChange} />)
    const close = screen.getByRole("button", { name: "Close" })
    expect(close).toHaveAttribute("data-slot", "dialog-close")
    expect(close).toHaveAttribute("data-kind", "neutral")
    expect(close).toHaveAttribute("data-size", "m")
    expect(close.querySelector('[data-icon-name="close"]')).not.toBeNull()
    expect(close.parentElement!.className.split(" ")).toEqual(expect.arrayContaining(["absolute", "top-5", "right-4"]))
    const header = document.querySelector('[data-slot="dialog-header"]') as HTMLElement
    expect(header.className.split(" ")).toContain("pr-12")
    fireEvent.click(close)
    expect(onOpenChange).toHaveBeenCalledWith(false, expect.anything())
  })

  it("without a close button, the header takes the full width", () => {
    render(<NewLogin showCloseButton={false} />)
    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
    const header = document.querySelector('[data-slot="dialog-header"]') as HTMLElement
    expect(header.className.split(" ")).not.toContain("pr-12")
  })

  it("starts focus in the content, not on the close button, which comes last in the tab order", async () => {
    render(<NewLogin />)
    const close = screen.getByRole("button", { name: "Close" })
    const save = screen.getByRole("button", { name: "Save login" })
    expect(save.compareDocumentPosition(close) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    await vi.waitFor(() => expect(screen.getByRole("textbox")).toHaveFocus())
  })

  it("with focus on Close, one Escape closes the dialog: the close button has no tooltip to take it first", async () => {
    const onOpenChange = vi.fn()
    function Live() {
      return (
        <Dialog defaultOpen onOpenChange={(open) => onOpenChange(open)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a login</DialogTitle>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )
    }
    render(<Live />)
    const close = screen.getByRole("button", { name: "Close" })
    await act(async () => {
      close.focus()
      await new Promise((r) => setTimeout(r, 50))
    })
    // No tooltip opened for it, so nothing stands between Escape and the dialog.
    expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull()
    await act(async () => {
      fireEvent.keyDown(close, { key: "Escape" })
    })
    expect(onOpenChange).toHaveBeenCalledWith(false)
    await vi.waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
  })

  it("actions keep their words at every width; an icon comes before them, at 16", () => {
    render(<NewLogin />)
    const save = screen.getByRole("button", { name: "Save login" })
    expect(save).toHaveAttribute("data-kind", "confirm")
    expect(save).toHaveAttribute("data-variant", "default")
    expect(save.querySelector('[data-icon-name="checkmark"]')).not.toBeNull()
    expect(save.className).not.toMatch(/max-sm:|rounded-full|sr-only/)
    const cancel = screen.getByRole("button", { name: "Cancel" })
    expect(cancel).toHaveAttribute("data-variant", "secondary")
    expect(cancel.querySelector("svg")).toBeNull()
  })

  it("the content scrolls inside the rule, 24 at the sides and bottom and 16 above the header", () => {
    render(<NewLogin />)
    const scroll = popup().querySelector('[data-slot="dialog-scroll"]') as HTMLElement
    expect(scroll.className.split(" ")).toEqual(
      expect.arrayContaining(["overflow-y-auto", "p-(--c-dialog-padding)", "pt-(--c-dialog-padding-top)", "gap-6"])
    )
    expect(popup().className.split(" ")).toContain("overflow-hidden")
  })

  it("a description is the caption note Figma draws under a review's rows, in secondary ink, and describes the dialog", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Steam on a Windows PC</DialogTitle>
          </DialogHeader>
          <DialogDescription>Not you? Deny, and Lockdown locks this login until you change the password.</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    const dialog = screen.getByRole("dialog", { name: "Steam on a Windows PC" })
    expect(dialog).toHaveAccessibleDescription("Not you? Deny, and Lockdown locks this login until you change the password.")
    const classes = screen.getByText(/Not you/).className.split(" ")
    expect(classes).toEqual(expect.arrayContaining(["type-caption", "text-text-secondary"]))
    expect(classes).not.toContain("type-body")
  })

  it('size="body" keeps the body role, for a question whose sentence is its content', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Steam for good?</DialogTitle>
          </DialogHeader>
          <DialogDescription size="body">It can't be brought back from Recently deleted.</DialogDescription>
        </DialogContent>
      </Dialog>
    )
    const classes = screen.getByText(/brought back/).className.split(" ")
    expect(classes).toEqual(expect.arrayContaining(["type-body", "text-text-secondary"]))
    expect(classes).not.toContain("type-caption")
  })
})

describe("DialogContent fits the window: below a size's own width it draws full (contract 5.1c C10, Synapse SNA5)", () => {
  // The knobs as the stylesheet sets them; jsdom has no stylesheet, so the test sets them on :root.
  const knobs: Record<string, string> = {
    "--c-dialog-margin": "1.5rem",
    "--c-dialog-question-min-width": "30rem",
    "--c-dialog-form-min-width": "40rem",
    "--c-dialog-viewer-min-width": "60rem",
  }
  const width = (px: number) => Object.defineProperty(window, "innerWidth", { configurable: true, value: px })
  beforeEach(() => {
    for (const [k, v] of Object.entries(knobs)) document.documentElement.style.setProperty(k, v)
  })
  afterEach(() => {
    for (const k of Object.keys(knobs)) document.documentElement.style.removeProperty(k)
    width(1024)
    window.dispatchEvent(new Event("resize"))
  })

  it.each([
    // The size's width plus 24 on each side is the least window that holds it.
    [1440, "viewer", "viewer"],
    [1008, "viewer", "viewer"],
    [1007, "viewer", "full"],
    [800, "viewer", "full"],
    [800, "form", "form"],
    [688, "form", "form"],
    [687, "form", "full"],
    [600, "question", "question"],
    [528, "question", "question"],
    [527, "question", "full"],
  ] as const)("at %ipx, %s draws %s", (px, size, drawn) => {
    width(px)
    render(
      <Dialog open>
        <DialogContent size={size}>
          <DialogTitle>Merge two notes</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(popup()).toHaveAttribute("data-size", drawn)
    // The name it was asked for stays readable when it had to draw full.
    if (drawn === "full") expect(popup()).toHaveAttribute("data-size-asked", size)
    else expect(popup()).not.toHaveAttribute("data-size-asked")
    // Full is the window less the margin both ways, so the cap holds at every width.
    if (drawn === "full") expect(popup().className.split(" ")).toContain("h-[calc(100%-2*var(--c-dialog-margin)-var(--c-dialog-titlebar-inset))]")
  })

  it("follows the window as it is resized, both ways", () => {
    width(1440)
    render(
      <Dialog open>
        <DialogContent size="viewer">
          <DialogTitle>Review the diff</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(popup()).toHaveAttribute("data-size", "viewer")
    act(() => {
      width(900)
      window.dispatchEvent(new Event("resize"))
    })
    expect(popup()).toHaveAttribute("data-size", "full")
    act(() => {
      width(1280)
      window.dispatchEvent(new Event("resize"))
    })
    expect(popup()).toHaveAttribute("data-size", "viewer")
  })

  it("measures the container it opens in, when it is given one", () => {
    width(1440)
    const stage = document.createElement("div")
    Object.defineProperty(stage, "clientWidth", { configurable: true, value: 700 })
    document.body.appendChild(stage)
    render(
      <Dialog open>
        <DialogContent size="form" container={stage}>
          <DialogTitle>New login</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    // 700 − 48 = 652 ≥ 640: the form fits the stage, whatever the window.
    expect(popup()).toHaveAttribute("data-size", "form")
    stage.remove()
  })

  it("keeps the size it was given without the knobs (no stylesheet)", () => {
    for (const k of Object.keys(knobs)) document.documentElement.style.removeProperty(k)
    width(400)
    render(
      <Dialog open>
        <DialogContent size="viewer">
          <DialogTitle>Plain</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(popup()).toHaveAttribute("data-size", "viewer")
  })

  it("forwards a ref to the popup", () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <Dialog open>
        <DialogContent ref={ref}>
          <DialogTitle>Ref</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    expect(ref.current).toBe(popup())
  })
})

describe("DialogContent notice (contract 5.1c C19)", () => {
  it("draws a line across the top, outside the scroll, and moves the close button under it", () => {
    render(
      <Dialog open>
        <DialogContent notice={<div data-testid="line">Sign-in request</div>}>
          <DialogTitle>New login</DialogTitle>
        </DialogContent>
      </Dialog>
    )
    const notice = document.querySelector('[data-slot="dialog-notice"]') as HTMLElement
    expect(notice).toContainElement(screen.getByTestId("line"))
    // Before the scroll area, so it never scrolls away.
    expect(notice.compareDocumentPosition(document.querySelector('[data-slot="dialog-scroll"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    const anchor = document.querySelector('[data-slot="dialog-close-anchor"]') as HTMLElement
    expect(anchor.className).toContain("top-[calc(var(--size-control)+var(--spacing)*5)]")
    expect(anchor.className.split(" ")).not.toContain("top-5")
  })
})
