import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Banner, bannerIcons, bannerVariants, type BannerTone } from "./banner"
import { Button } from "./button"

const classesOf = (el: Element) => el.className.split(/\s+/)
const TONES: BannerTone[] = ["critical", "info", "warning", "success"]
const part = (name: string) => document.querySelector(`[data-slot="${name}"]`) as HTMLElement

describe("Banner (Figma 32:89)", () => {
  it("critical is an alert; the other tones are status", () => {
    const { rerender } = render(<Banner tone="critical" title="Sync failed" body="Fastmail refused the password." />)
    expect(screen.getByRole("alert")).toHaveAttribute("data-tone", "critical")
    for (const tone of ["info", "warning", "success"] as const) {
      rerender(<Banner tone={tone} title="Sync failed" />)
      expect(screen.getByRole("status")).toHaveAttribute("data-tone", tone)
      expect(screen.queryByRole("alert")).toBeNull()
    }
  })

  it("pins the drawn tones: critical-soft in a critical edge; info raised in a hairline", () => {
    expect(bannerVariants({ tone: "critical" }).split(/\s+/)).toEqual(expect.arrayContaining(["bg-critical-soft", "inset-ring", "inset-ring-critical-fill"]))
    expect(bannerVariants({ tone: "info" }).split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-raised", "rule-box"]))
    expect(bannerVariants({ tone: "warning" }).split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-raised", "inset-ring-warning"]))
    expect(bannerVariants({ tone: "success" }).split(/\s+/)).toEqual(expect.arrayContaining(["bg-surface-raised", "inset-ring-success"]))
    for (const tone of TONES) {
      const classes = bannerVariants({ tone }).split(/\s+/)
      expect(classes).toEqual(expect.arrayContaining(["rounded-lg", "items-center"]))
      // Edges are inset: a border would add to the height.
      expect(classes.some((c) => c === "border" || c.startsWith("border-"))).toBe(false)
    }
  })

  it("pins the drawn spacing, and the compact size", () => {
    expect(bannerVariants({ size: "default" }).split(/\s+/)).toEqual(expect.arrayContaining(["gap-3", "px-4", "py-3"]))
    expect(bannerVariants({ size: "compact" }).split(/\s+/)).toEqual(expect.arrayContaining(["gap-2", "px-3", "py-2"]))
  })

  it("each tone draws its own glyph, in its ink; critical keeps Figma's warning--alt", () => {
    expect(bannerIcons).toEqual({ critical: "warning--alt", info: "information", warning: "warning", success: "checkmark--outline" })
    const inks: Record<BannerTone, string> = {
      critical: "text-critical-text",
      info: "text-foreground",
      warning: "text-warning",
      success: "text-success-foreground",
    }
    for (const tone of TONES) {
      const { unmount } = render(<Banner tone={tone} title="Sync failed" />)
      const icon = part("banner-icon")
      expect(classesOf(icon)).toContain(inks[tone])
      expect(icon.querySelector("svg")).toHaveAttribute("data-icon-name", bannerIcons[tone])
      expect(icon.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
      unmount()
    }
  })

  it("an icon of the caller's, or none", () => {
    const { rerender } = render(<Banner icon="time" title="Clock is off" />)
    expect(part("banner-icon").querySelector("svg")).toHaveAttribute("data-icon-name", "time")
    rerender(<Banner icon={null} title="Clock is off" />)
    expect(part("banner-icon")).toBeNull()
  })

  it("default: title in ui/emphasis, body in caption, a 20px glyph", () => {
    render(<Banner title="Sync failed" body="Fastmail refused the password. Mail from 09:16 on is not here yet." />)
    expect(classesOf(screen.getByText("Sync failed"))).toEqual(expect.arrayContaining(["type-ui-emphasis", "text-foreground"]))
    expect(classesOf(screen.getByText(/Fastmail refused/))).toEqual(expect.arrayContaining(["type-caption", "text-support-foreground"]))
    expect(part("banner-icon").querySelector("svg")).toHaveAttribute("width", "20")
  })

  it("compact: one caption paragraph that wraps (the title starts it), a 16px glyph", () => {
    render(<Banner size="compact" tone="critical" title="Couldn't save." body="The vault is locked on another device." />)
    const text = part("banner-text")
    expect(text.tagName).toBe("P")
    expect(text).toHaveTextContent("Couldn't save. The vault is locked on another device.")
    expect(classesOf(text)).toEqual(expect.arrayContaining(["type-caption", "min-w-0", "flex-1"]))
    expect(classesOf(text).some((c) => c === "truncate" || c.startsWith("line-clamp"))).toBe(false)
    expect(part("banner-icon").querySelector("svg")).toHaveAttribute("width", "16")
  })

  it("compact: a long server message wraps and is never cut, a long unbroken token included (contract 5.1c C12)", () => {
    const message =
      "imap.fastmail.com refused the sign-in: AUTHENTICATIONFAILED_INVALID_CREDENTIALS_FOR_sean@fastmail.com. Check the app password in Settings, then try again."
    render(<Banner size="compact" tone="critical" title="Couldn't add the account." body={message} action={<Button variant="secondary" size="sm">Try again</Button>} />)
    const text = part("banner-text")
    expect(text).toHaveTextContent(message)
    const cls = classesOf(text)
    // Wraps between words, and inside a token only when it would run out of the box.
    expect(cls).toContain("wrap-break-word")
    expect(cls).toEqual(expect.arrayContaining(["min-w-0", "flex-1"]))
    // Nothing cuts it: no clamp, no ellipsis, no single line, no hidden overflow.
    expect(cls.some((c) => c === "truncate" || c.startsWith("line-clamp") || c === "whitespace-nowrap" || c.startsWith("overflow-"))).toBe(false)
    expect(classesOf(screen.getByRole("alert")).some((c) => c.startsWith("overflow-") || c.startsWith("h-") || c.startsWith("max-h"))).toBe(false)
    // The action keeps its own width beside the text.
    expect(classesOf(part("banner-action"))).toContain("shrink-0")
  })

  it("the default size's body breaks a long token too", () => {
    render(<Banner title="Sync failed" body="ERR_CONNECTION_REFUSED_BY_GATEWAY_AT_relay.vale.example" />)
    expect(classesOf(part("banner-body"))).toContain("wrap-break-word")
  })

  it("children are the body", () => {
    render(<Banner tone="info">Caps Lock is on.</Banner>)
    expect(screen.getByRole("status")).toHaveTextContent("Caps Lock is on.")
  })

  it("holds one action, and a close button only when asked", async () => {
    const onDismiss = vi.fn()
    const signIn = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <Banner title="Sync failed" action={<Button variant="secondary" size="sm" onClick={signIn}>Sign in</Button>} />
    )
    expect(screen.queryByRole("button", { name: "Dismiss" })).toBeNull()
    await user.click(screen.getByRole("button", { name: "Sign in" }))
    expect(signIn).toHaveBeenCalledTimes(1)
    rerender(<Banner tone="info" title="In the desktop app" onDismiss={onDismiss} dismissLabel="Hide this notice" />)
    const close = screen.getByRole("button", { name: "Hide this notice" })
    expect(close).toHaveAttribute("data-size", "icon-sm")
    await user.tab()
    expect(close).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
