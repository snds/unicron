import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DropdownMenuItem } from "./dropdown-menu"
import { formatListCount, ListRow } from "./list-row"

const TASK = { index: "01", title: "Migrate vault login to OPAQUE", meta: "SEA-51 // Lockdown // Claude Code", status: "Queued" }

const slot = (container: HTMLElement, name: string) => container.querySelector(`[data-slot="${name}"]`) as HTMLElement | null

describe("ListRow (Figma 9:181)", () => {
  it("inline: folio index, ui-emphasis title, meta and status in the meta role, label ink", () => {
    const { container } = render(<ListRow {...TASK} />)
    const row = slot(container, "list-row")!
    expect(row).toHaveAttribute("data-layout", "inline")
    expect(row).toHaveAttribute("data-tone", "neutral")
    expect(row).toHaveAttribute("data-meta-style", "label")
    expect(slot(container, "list-row-index")).toHaveTextContent("01")
    expect(slot(container, "list-row-index")!.className).toContain("type-folio")
    expect(slot(container, "list-row-index")!.className).toContain("w-(--c-list-row-leading-width)")
    expect(slot(container, "list-row-title")!.className).toContain("type-ui-emphasis")
    expect(slot(container, "list-row-meta")!.className).toEqual(expect.stringContaining("type-meta"))
    expect(slot(container, "list-row-meta")!.className).toContain("truncate")
    const status = slot(container, "list-row-status")!
    expect(status.className).toEqual(expect.stringContaining("type-meta"))
    expect(status.className).toContain("text-text-label")
    expect(status.className).toContain("whitespace-nowrap")
  })

  it("keeps Figma's 2.0 paddings and gaps: 8 / 10, gap 12, body gap 4 (label), gap 6 and 2 under the body (plain), no divider", () => {
    const { container, rerender } = render(<ListRow {...TASK} />)
    const row = () => slot(container, "list-row")!.className.split(/\s+/)
    expect(row()).toEqual(expect.arrayContaining(["px-2.5", "gap-3", "py-2", "items-baseline", "rounded-md"]))
    expect(row()).not.toContain("rule-t")
    expect(slot(container, "list-row-body")!.className).toContain("gap-1")
    rerender(<ListRow {...TASK} metaStyle="plain" />)
    expect(row()).toEqual(expect.arrayContaining(["py-2"]))
    expect(slot(container, "list-row-body")!.className.split(/\s+/)).toEqual(expect.arrayContaining(["gap-1.5", "pb-0.5"]))
    expect(slot(container, "list-row-meta")!.className).toContain("type-meta")
  })

  it("live (retired) colours only the status, in the working ink", () => {
    const { container } = render(<ListRow {...TASK} tone="live" status="Running 04:12" />)
    expect(slot(container, "list-row-status")!.className).toContain("text-status-working")
    expect(slot(container, "list-row-title")!.className).toContain("text-text-body")
  })

  it("selected is the 8% fill with the 2px inset bar, default text colours, and says aria-current", () => {
    const { container } = render(<ListRow {...TASK} selected onClick={() => undefined} />)
    const row = slot(container, "list-row")!
    expect(row.className.split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-selected", "rounded-md"]))
    const bar = slot(container, "list-row-bar")!
    expect(bar).toHaveAttribute("aria-hidden", "true")
    expect(bar.className.split(/\s+/)).toEqual(expect.arrayContaining(["inset-y-2", "start-1.5", "w-0.5", "bg-primary-text"]))
    expect(row).toHaveAttribute("data-selected")
    expect(row.className).not.toMatch(/(^|\s)bg-primary(\s|$)/)
    expect(screen.getByRole("button", { name: TASK.title })).toHaveAttribute("aria-current", "true")
  })

  it("is a link with href: named by the title, described by meta and status, stretched over the row", () => {
    render(<ListRow {...TASK} href="/tasks/sea-51" />)
    const link = screen.getByRole("link", { name: TASK.title })
    expect(link).toHaveAttribute("href", "/tasks/sea-51")
    expect(link).toHaveAccessibleDescription(`${TASK.meta} ${TASK.status}`)
    expect(link.className).toContain("after:absolute")
    expect(link.className).toContain("after:inset-0")
  })

  it("is a button with onClick, Enter and Space included; the ring is redrawn on the row, inset", async () => {
    const onClick = vi.fn()
    const { container } = render(<ListRow {...TASK} onClick={onClick} />)
    const button = screen.getByRole("button", { name: TASK.title })
    // An inline span with the button role, so a wrapping title keeps the row's baseline on its first line.
    expect(button.tagName).toBe("SPAN")
    await userEvent.click(button)
    button.focus()
    await userEvent.keyboard("{Enter}")
    await userEvent.keyboard(" ")
    expect(onClick).toHaveBeenCalledTimes(3)
    const row = slot(container, "list-row")!.className
    expect(row).toContain("has-[[data-slot=list-row-main]:focus-visible]:outline-ring")
    expect(row).toContain("has-[[data-slot=list-row-main]:focus-visible]:outline-offset-[calc(var(--stroke-emphasis)*-1)]")
    expect(row).toContain("has-[[data-slot=list-row-main]:hover]:not-data-selected:bg-surface-hover")
  })

  it("is plain text, not a control, with no href, onClick or mainRender", () => {
    const { container } = render(<ListRow {...TASK} />)
    expect(screen.queryByRole("link")).toBeNull()
    expect(screen.queryByRole("button")).toBeNull()
    expect(slot(container, "list-row")).not.toHaveAttribute("data-interactive")
  })

  it("takes a router link as mainRender, and the root as another element", () => {
    render(
      <ul>
        <ListRow {...TASK} render={<li />} mainRender={<a href="/router/sea-51" data-router="" />} />
      </ul>
    )
    expect(screen.getByRole("listitem")).toHaveAttribute("data-slot", "list-row")
    expect(screen.getByRole("link", { name: TASK.title })).toHaveAttribute("data-router")
  })

  it("progress is a real value on the segmented bar, up to 360 wide, named by the title", () => {
    const { container, rerender } = render(<ListRow {...TASK} progress={19 / 32} />)
    const wrap = slot(container, "list-row-progress")!
    expect(wrap.className).toContain("max-w-(--c-list-row-progress-max-width)")
    expect(wrap.className).toContain("pt-1")
    const bar = screen.getByRole("progressbar", { name: TASK.title })
    expect(bar).toHaveAttribute("data-variant", "segmented")
    expect(container.querySelectorAll('[data-slot="progress-segment"][data-filled]')).toHaveLength(19)
    rerender(<ListRow {...TASK} metaStyle="plain" progress={{ value: 3, max: 7, segments: 7 }} />)
    expect(slot(container, "list-row-progress")!.className).toContain("pt-1.5")
    expect(container.querySelectorAll('[data-slot="progress-segment"]')).toHaveLength(7)
    expect(container.querySelectorAll('[data-slot="progress-segment"][data-filled]')).toHaveLength(3)
  })

  it("message: unread dot in info/fill, sender, time, subject, preview cut at one line by default", () => {
    const { container } = render(
      <ListRow
        layout="message"
        unread
        sender="Mira Chen"
        time="09:14"
        subject="Cabin for the 20th, confirmed"
        preview="Booked the two-bedroom. Check-in is after 3."
        href="#cabin"
      />
    )
    const row = slot(container, "list-row")!
    expect(row.className.split(/\s+/)).toEqual(expect.arrayContaining(["px-3", "py-2.5"]))
    const unread = slot(container, "list-row-unread")!
    expect(unread).toHaveAttribute("aria-hidden", "true")
    expect(unread.className.split(/\s+/)).toEqual(expect.arrayContaining(["size-(--c-list-row-unread-size)", "bg-info-fill", "rounded-full"]))
    expect(slot(container, "list-row-sender")!.className).toContain("type-ui-emphasis")
    expect(slot(container, "list-row-time")!.className).toContain("type-caption")
    expect(slot(container, "list-row-subject")!.className).toContain("type-ui")
    expect(slot(container, "list-row-preview")!.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-caption", "line-clamp-1"]))
    const link = screen.getByRole("link", { name: "Unread Mira Chen Cabin for the 20th, confirmed" })
    expect(link).toHaveAccessibleDescription("09:14 Booked the two-bedroom. Check-in is after 3.")
  })

  it("message: count, tag, account and previewLines", () => {
    const { container } = render(
      <ListRow layout="message" sender="Theo Park" count={3} tag={<span>Work</span>} account="Personal" time="Wed" subject="Re: Saturday carpool" preview="I can take both kids" previewLines={2} />
    )
    expect(slot(container, "list-row-count")).toHaveTextContent("03")
    expect(slot(container, "list-row-tag")).toHaveTextContent("Work")
    expect(slot(container, "list-row-time")).toHaveTextContent("Personal · Wed")
    expect(slot(container, "list-row-preview")!.className).toContain("line-clamp-2")
  })

  it("leading takes the 40px column in place of the index; marks follow the title; a badge follows the status", () => {
    const { container } = render(
      <ListRow {...TASK} leading={<input type="checkbox" aria-label="Done" />} marks={<span>★</span>} badge={<span>Stale</span>} />
    )
    expect(slot(container, "list-row-index")).toBeNull()
    expect(slot(container, "list-row-leading")!.className).toContain("w-(--c-list-row-leading-width)")
    expect(screen.getByRole("checkbox", { name: "Done" })).toBeInTheDocument()
    expect(slot(container, "list-row-title")).toContainElement(slot(container, "list-row-marks"))
    expect(slot(container, "list-row-trailing")).toContainElement(slot(container, "list-row-badge"))
  })

  it("the action is its own control beside the row's, above the stretched click", async () => {
    const onRow = vi.fn()
    const onFill = vi.fn()
    const { container } = render(<ListRow {...TASK} onClick={onRow} action={<button onClick={onFill}>Fill</button>} />)
    await userEvent.click(screen.getByRole("button", { name: "Fill" }))
    expect(onFill).toHaveBeenCalledTimes(1)
    expect(onRow).not.toHaveBeenCalled()
    expect(slot(container, "list-row-action")!.className).toContain("z-10")
    expect(screen.getByRole("button", { name: TASK.title })).not.toContainElement(screen.getByRole("button", { name: "Fill" }))
  })

  it("the trailing part reads status, badge, then the action, as Figma List Row draws it (F19)", () => {
    const { container } = render(
      <ListRow {...TASK} badge={<span>Optional</span>} action={<button>Connect</button>} />
    )
    const trailing = slot(container, "list-row-trailing")!
    const order = [slot(container, "list-row-status")!, slot(container, "list-row-badge")!, screen.getByRole("button", { name: "Connect" })]
    order.forEach((el) => expect(trailing).toContainElement(el))
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1].compareDocumentPosition(order[i]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })

  it("detail is a caption line, two lines at most, and describes the row", () => {
    const { container } = render(<ListRow title="Groq" detail="May train on prompts. Tasks never use it." href="#groq" />)
    expect(slot(container, "list-row-detail")!.className.split(/\s+/)).toEqual(expect.arrayContaining(["type-caption", "line-clamp-2"]))
    expect(screen.getByRole("link", { name: "Groq" })).toHaveAccessibleDescription("May train on prompts. Tasks never use it.")
  })

  it("disabled: dimmed, aria-disabled, does nothing, stays in the tab order, says why", async () => {
    const onClick = vi.fn()
    const { container } = render(<ListRow title="Other (JMAP)" disabled disabledReason="This build cannot sign in to a JMAP server." onClick={onClick} />)
    const row = slot(container, "list-row")!
    expect(row.className.split(/\s+/)).toEqual(expect.arrayContaining(["opacity-50", "pointer-events-none"]))
    const button = screen.getByRole("button", { name: "Other (JMAP)" })
    expect(button).toHaveAttribute("aria-disabled", "true")
    expect(button).toHaveAccessibleDescription("This build cannot sign in to a JMAP server.")
    fireEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
    await userEvent.tab()
    expect(button).toHaveFocus()
  })

  it("a disabled link keeps no address but stays a focusable link", () => {
    render(<ListRow title="Steam" href="#steam" disabled />)
    const link = screen.getByRole("link", { name: "Steam" })
    expect(link).not.toHaveAttribute("href")
    expect(link).toHaveAttribute("tabindex", "0")
  })

  it("compact: 56 tall, the ui role for the title, centred", () => {
    const { container } = render(<ListRow size="compact" title="Spotify" meta="spotify.com" />)
    const row = slot(container, "list-row")!.className.split(/\s+/)
    expect(row).toEqual(expect.arrayContaining(["min-h-14", "items-center", "py-2"]))
    expect(slot(container, "list-row-title")!.className).toContain("type-ui")
  })

  it("the menu: an overflow button named for the row, and the Menu key, Shift+F10 and a right click open it", async () => {
    const { container } = render(
      <ListRow {...TASK} href="#sea-51" menu={<DropdownMenuItem>Open chat</DropdownMenuItem>} />
    )
    const trigger = screen.getByRole("button", { name: `More actions ${TASK.title}` })
    expect(trigger).toHaveAttribute("aria-haspopup", "menu")
    const wrap = slot(container, "list-row-menu")!.className
    expect(wrap).toContain("pointer-coarse:opacity-100")
    expect(wrap).toContain("group-hover/list-row:opacity-100")
    expect(wrap).toContain("group-focus-within/list-row:opacity-100")
    await userEvent.click(trigger)
    expect(await screen.findByRole("menuitem", { name: "Open chat" })).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")

    const link = screen.getByRole("link", { name: TASK.title })
    fireEvent.keyDown(link, { key: "F10", shiftKey: true })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    fireEvent.keyDown(link, { key: "ContextMenu" })
    expect(await screen.findByRole("menu")).toBeInTheDocument()
    await userEvent.keyboard("{Escape}")
    fireEvent.contextMenu(link)
    expect(await screen.findByRole("menu")).toBeInTheDocument()
  })

  it("with no menu, a right click is the browser's", () => {
    render(<ListRow {...TASK} href="#sea-51" />)
    const event = fireEvent.contextMenu(screen.getByRole("link", { name: TASK.title }))
    expect(event).toBe(true)
  })
})

describe("formatListCount (decisions §13)", () => {
  it("three digits, as every Figma sidebar draws them, a comma from 1,000 (Unicron 13)", () => {
    expect(formatListCount(0)).toBe("000")
    expect(formatListCount(7)).toBe("007")
    expect(formatListCount(12)).toBe("012")
    expect(formatListCount(146)).toBe("146")
    expect(formatListCount(1204)).toBe("1,204")
  })

  it("a status mark: a glyph in its tone where the words would be, its word said with the row, never drawn (Warpcore 18)", () => {
    const { container } = render(
      <ListRow
        size="compact"
        title="Promote the staging build"
        href="#chat-14"
        statusMark={{ icon: "time", label: "Waiting on you", tone: "needs-you" }}
      />
    )
    const link = screen.getByRole("link", { name: "Promote the staging build" })
    // The word is the description, not the name, and it is not drawn.
    expect(link).toHaveAccessibleDescription("Waiting on you")
    const mark = slot(container, "list-row-status-mark")!
    expect(mark).toHaveAttribute("data-tone", "needs-you")
    expect(mark.querySelector('[data-icon-name="time"]')).toHaveAttribute("aria-hidden", "true")
    expect(mark.querySelector('[data-icon-name="time"]')).toHaveAttribute("width", "16")
    expect(screen.getByText("Waiting on you")).toHaveClass("sr-only")
    expect(mark.querySelector(".bg-needs-you-fill")).not.toBeNull()
    // It takes the place of the status words.
    expect(slot(container, "list-row-status")).toBeNull()
  })

  it("a status mark's tones: label ink, live, critical", () => {
    const { container } = render(
      <>
        <ListRow title="Draft the brief" statusMark={{ icon: "pending", label: "Queued" }} />
        <ListRow title="Run the suite" statusMark={{ icon: "renew", label: "Running", tone: "live" }} />
        <ListRow title="Deploy" statusMark={{ icon: "warning", label: "Failed", tone: "critical" }} />
      </>
    )
    const marks = [...container.querySelectorAll('[data-slot="list-row-status-mark"] > span:first-child')]
    expect(marks.map((m) => m.className)).toEqual([
      expect.stringContaining("text-muted-foreground"),
      expect.stringContaining("text-secondary-live"),
      expect.stringContaining("text-critical-text"),
    ])
  })

  it("Shift+Enter does not open the row's menu: the menu keys are Shift+F10 and the Menu key (Unicron 48)", () => {
    render(<ListRow {...TASK} href="#sea-51" menu={<DropdownMenuItem>Open chat</DropdownMenuItem>} />)
    fireEvent.keyDown(screen.getByRole("link", { name: TASK.title }), { key: "Enter", shiftKey: true })
    expect(screen.queryByRole("menu")).toBeNull()
  })
})
