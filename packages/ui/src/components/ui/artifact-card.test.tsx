import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { ArtifactCard } from "./artifact-card"

describe("ArtifactCard", () => {
  it("is a button with Figma's parts: a 40px primary-soft tile with the icon, the title over the meta, an arrow", () => {
    const onClick = vi.fn()
    const { container } = render(<ArtifactCard title="OPAQUE migration diff" meta="Diff // 6 files // v2" onClick={onClick} />)
    const card = screen.getByRole("button", { name: /OPAQUE migration diff/ })
    expect(card).toHaveAttribute("type", "button")
    expect(card).toHaveAttribute("data-slot", "artifact-card")
    expect(card).toHaveAccessibleName("OPAQUE migration diff Diff // 6 files // v2")
    for (const c of ["bg-surface-raised", "rule-box", "p-2", "gap-3", "rounded-lg", "w-full", "items-center"]) expect(card.className).toContain(c)
    const tile = container.querySelector('[data-slot="artifact-card-tile"]')!
    for (const c of ["size-10", "bg-primary-soft", "text-primary-text"]) expect(tile.className).toContain(c)
    expect(tile.querySelector('[data-icon-name="code"]')).toBeInTheDocument()
    const title = container.querySelector('[data-slot="artifact-card-title"]')!
    expect(title.className).toContain("type-ui-emphasis")
    expect(title.className).toContain("truncate")
    expect(container.querySelector('[data-slot="artifact-card-meta"]')!.className).toContain("type-meta")
    const go = container.querySelector('[data-slot="artifact-card-go"]')!
    expect(go.className).toContain("text-text-label")
    expect(go.querySelector('[data-icon-name="arrow--right"]')).toBeInTheDocument()
    fireEvent.click(card)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("takes the kind's icon", () => {
    const { container } = render(<ArtifactCard icon="flow" title="Login flow" meta="Diagram // 2 messages // v1" />)
    expect(container.querySelector('[data-icon-name="flow"]')).toBeInTheDocument()
  })

  it("is the open one when selected: the soft fill, the 2px edge, the tile raised, aria-current", () => {
    render(<ArtifactCard selected title="Login flow" />)
    const card = screen.getByRole("button", { name: /Login flow/ })
    expect(card).toHaveAttribute("aria-current", "true")
    expect(card).toHaveAttribute("data-selected", "true")
    expect(card.className).toContain("data-selected:bg-primary-soft")
    expect(card.className).toContain("data-selected:edge-l")
    expect(card.querySelector('[data-slot="artifact-card-tile"]')!.className).toContain("group-data-selected/artifact:bg-surface-raised")
  })

  it("washes on hover and press with the state roles, on a layer under its content", () => {
    render(<ArtifactCard title="Test report" />)
    const card = screen.getByRole("button")
    for (const c of ["relative", "isolate", "before:absolute", "before:inset-0", "before:-z-10", "hover:before:bg-state-hover", "active:before:bg-state-pressed"]) {
      expect(card.className).toContain(c)
    }
  })

  it("is a link with href, and the host's own link with render", () => {
    const { rerender } = render(<ArtifactCard href="/chat/51?beside=diff:51" title="OPAQUE migration diff" />)
    const link = screen.getByRole("link", { name: /OPAQUE migration diff/ })
    expect(link).toHaveAttribute("href", "/chat/51?beside=diff:51")
    expect(link).not.toHaveAttribute("type")
    rerender(<ArtifactCard render={<a href="/docs/auth" data-router="" />} title="auth.md draft" />)
    expect(screen.getByRole("link", { name: /auth\.md draft/ })).toHaveAttribute("data-router")
  })

  describe("state=\"writing\" (contract 5.1c C14, Warpcore NA3)", () => {
    it("draws the meta in the live tone after a working StatusOrb, and says so in its name", () => {
      const { container } = render(<ArtifactCard icon="code" title="Page" meta="HTML // writing" state="writing" />)
      const card = screen.getByRole("button", { name: /Page/ })
      expect(card).toHaveAttribute("data-state", "writing")
      expect(card).toHaveAccessibleName("Page HTML // writing")
      const status = container.querySelector('[data-slot="artifact-card-status"]')!
      const orb = status.querySelector('[data-slot="status-orb"]')!
      expect(orb).toHaveAttribute("data-state", "working")
      expect(orb).toHaveAttribute("data-size", "xs")
      // The meta's words say it; the orb is decoration beside them.
      expect(orb).toHaveAttribute("aria-hidden", "true")
      const meta = container.querySelector('[data-slot="artifact-card-meta"]')!
      expect(meta.className).toContain("text-secondary-live")
      expect(meta.className).not.toContain("text-text-label")
      // The orb comes first, then the meta.
      expect(orb.compareDocumentPosition(meta) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it("still opens while it writes", () => {
      const onClick = vi.fn()
      render(<ArtifactCard title="Page" meta="HTML // writing" state="writing" onClick={onClick} />)
      fireEvent.click(screen.getByRole("button", { name: /Page/ }))
      expect(onClick).toHaveBeenCalledOnce()
    })

    it("with no meta, the orb's own name says it is working", () => {
      render(<ArtifactCard title="Page" state="writing" />)
      expect(screen.getByRole("button", { name: /Page/ })).toHaveAccessibleName("Page Working")
    })

    it("back to ready: label ink, no orb", () => {
      const { container, rerender } = render(<ArtifactCard title="Page" meta="HTML // writing" state="writing" />)
      rerender(<ArtifactCard title="Page" meta="HTML // 124 lines" />)
      expect(screen.getByRole("button")).toHaveAttribute("data-state", "ready")
      expect(container.querySelector('[data-slot="status-orb"]')).toBeNull()
      expect(container.querySelector('[data-slot="artifact-card-meta"]')!.className).toContain("text-text-label")
    })
  })
})

