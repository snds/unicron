import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"

import {
  AutoCheckSwitch,
  UpdateStatusRow,
  canCheckForUpdates,
  updateLine,
  updateWords,
  type UpdateStatus,
} from "./update-status"

const base: UpdateStatus = {
  version: "0.1.0-main.20261107093000",
  channel: "main",
  enabled: true,
  off: null,
  auto_check: true,
  state: "idle",
  percent: null,
  offered: null,
  error: null,
  link: null,
  link_why: null,
  asked: false,
}
const at = (over: Partial<UpdateStatus>): UpdateStatus => ({ ...base, ...over })

function row(status: UpdateStatus, extra: Partial<React.ComponentProps<typeof UpdateStatusRow>> = {}) {
  const calls = { onCheck: vi.fn(), onRestart: vi.fn(), onReload: vi.fn() }
  const view = render(<UpdateStatusRow status={status} appName="Lockdown" {...calls} {...extra} />)
  return { ...calls, ...view }
}

describe("updateLine: Lockdown's and Synapse's words", () => {
  it.each<[Partial<UpdateStatus>, string]>([
    [{ enabled: false }, "Updates are off in this build."],
    [{ enabled: false, off: "Updates are off in this build: it was made without the update key." }, "Updates are off in this build: it was made without the update key."],
    [{}, "Lockdown checks for updates when it opens and every six hours."],
    [{ auto_check: false }, "Automatic checks are off. Check whenever you like."],
    [{ state: "checking" }, "Checking for updates…"],
    [{ state: "up_to_date" }, "Lockdown is up to date."],
    [{ state: "downloading", offered: "0.2.0", percent: 42 }, "Downloading version 0.2.0… 42%"],
    [{ state: "downloading" }, "Downloading the update… 0%"],
    [{ state: "ready", offered: "0.2.0" }, "Version 0.2.0 is ready. Restart to update, or it installs when you quit."],
    [{ state: "available", offered: "0.2.0", link_why: "This copy can't update itself." }, "Version 0.2.0 is out. This copy can't update itself."],
    [{ state: "available" }, "A newer build is out."],
    [{ state: "failed", error: "The download stopped." }, "The download stopped."],
    [{ state: "failed" }, "The update didn't work."],
  ])("%o reads %s", (over, line) => {
    expect(updateLine(at(over), "Lockdown")).toBe(line)
  })

  it("talks about builds on the local channel, as Synapse does", () => {
    const local = (over: Partial<UpdateStatus>) => updateLine(at({ channel: "local", offered: "0.2.0", ...over }), "Synapse")
    expect(local({})).toBe("Synapse looks for a new build from this Mac every five minutes.")
    expect(local({ state: "downloading", percent: 7 })).toBe("Downloading the update… 7%")
    expect(local({ state: "ready" })).toBe("A new build is ready. Restart to update, or it installs when you quit.")
    expect(local({ state: "available" })).toBe("A newer build is out.")
  })

  it("can check unless off, checking or downloading", () => {
    expect(canCheckForUpdates(base)).toBe(true)
    expect(canCheckForUpdates(at({ enabled: false }))).toBe(false)
    expect(canCheckForUpdates(at({ state: "checking" }))).toBe(false)
    expect(canCheckForUpdates(at({ state: "downloading" }))).toBe(false)
    expect(canCheckForUpdates(at({ state: "failed" }))).toBe(true)
  })
})

describe("UpdateStatusRow", () => {
  it("shows the version and channel, and the status line in a live region", () => {
    row(base)
    expect(screen.getByText("Lockdown 0.1.0-main.20261107093000 · main channel (every merged change)")).toBeVisible()
    const line = screen.getByRole("status")
    expect(line).toHaveAttribute("aria-live", "polite")
    expect(line).toHaveTextContent("Lockdown checks for updates when it opens and every six hours.")
  })

  it("names the channel for stable and local", () => {
    const { rerender } = row(at({ channel: "stable" }))
    expect(screen.getByText(/· stable channel$/)).toBeVisible()
    rerender(<UpdateStatusRow status={at({ channel: "local" })} appName="Lockdown" onCheck={() => {}} onRestart={() => {}} onReload={() => {}} />)
    expect(screen.getByText(/· builds made on this Mac$/)).toBeVisible()
  })

  it("offers Check for updates and Reload app when idle, and calls back", async () => {
    const { onCheck, onReload } = row(base)
    expect(screen.queryByRole("button", { name: "Restart to update" })).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Check for updates" }))
    await userEvent.click(screen.getByRole("button", { name: "Reload app" }))
    expect(onCheck).toHaveBeenCalledOnce()
    expect(onReload).toHaveBeenCalledOnce()
  })

  it("offers Restart to update in place of Reload app once ready, with the restart note", async () => {
    const { onRestart } = row(at({ state: "ready", offered: "0.2.0" }), { restartNote: "Restarting locks Lockdown." })
    expect(screen.queryByRole("button", { name: "Reload app" })).toBeNull()
    await userEvent.click(screen.getByRole("button", { name: "Restart to update" }))
    expect(onRestart).toHaveBeenCalledOnce()
    expect(screen.getByText("Restarting locks Lockdown.")).toBeVisible()
  })

  it("leaves the restart note out until an update is ready", () => {
    row(base, { restartNote: "Restarting locks Lockdown." })
    expect(screen.queryByText("Restarting locks Lockdown.")).toBeNull()
  })

  it.each<Partial<UpdateStatus>>([{ state: "checking" }, { state: "downloading", percent: 10 }, { enabled: false }])(
    "disables Check for updates when %o",
    (over) => {
      row(at(over))
      expect(screen.getByRole("button", { name: "Check for updates" })).toBeDisabled()
    }
  )

  it("holds the live region busy while downloading, so each percent isn't read out", () => {
    const { rerender } = row(at({ state: "downloading", percent: 10 }))
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
    rerender(<UpdateStatusRow status={at({ state: "ready" })} appName="Lockdown" onCheck={() => {}} onRestart={() => {}} onReload={() => {}} />)
    expect(screen.getByRole("status")).not.toHaveAttribute("aria-busy")
  })

  it("shows the release page link only when an update is available", () => {
    const link = "https://github.com/snds/releases/releases/tag/lockdown-main"
    const { rerender } = row(at({ state: "ready", link }))
    expect(screen.queryByRole("link")).toBeNull()
    rerender(<UpdateStatusRow status={at({ state: "available", link })} appName="Lockdown" onCheck={() => {}} onRestart={() => {}} onReload={() => {}} />)
    const a = screen.getByRole("link", { name: "Get it from GitHub" })
    expect(a).toHaveAttribute("href", link)
    expect(a).toHaveAttribute("target", "_blank")
  })

  it("hands the link to onOpenLink instead of following it, when given", async () => {
    const link = "https://github.com/snds/releases/releases/tag/lockdown-main"
    const onOpenLink = vi.fn()
    row(at({ state: "available", link }), { onOpenLink })
    await userEvent.click(screen.getByRole("link", { name: "Get it from GitHub" }))
    expect(onOpenLink).toHaveBeenCalledWith(link)
  })

  it("draws a failure in destructive ink, and an action's error as an alert", () => {
    row(at({ state: "failed", error: "The download stopped." }), { error: "Couldn't reach the shell." })
    expect(screen.getByRole("status")).toHaveClass("text-destructive")
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't reach the shell.")
  })

  it("takes any words in place of the defaults", () => {
    row(base, { words: { check: "Nach Updates suchen", line: () => "Bereit." } })
    expect(screen.getByRole("button", { name: "Nach Updates suchen" })).toBeVisible()
    expect(screen.getByRole("status")).toHaveTextContent("Bereit.")
    expect(screen.getByRole("button", { name: updateWords.reload })).toBeVisible()
  })
})

describe("AutoCheckSwitch", () => {
  it("is a named switch, described by when the check runs", async () => {
    const onCheckedChange = vi.fn()
    render(<AutoCheckSwitch status={base} onCheckedChange={onCheckedChange} />)
    const sw = screen.getByRole("switch", { name: "Check automatically" })
    expect(sw).toHaveAccessibleDescription("When the app opens, and every six hours.")
    expect(sw).toBeChecked()
    await userEvent.click(sw)
    expect(onCheckedChange).toHaveBeenCalledWith(false)
  })

  it("says five minutes on the local channel", () => {
    render(<AutoCheckSwitch status={at({ channel: "local", auto_check: false })} onCheckedChange={() => {}} />)
    const sw = screen.getByRole("switch", { name: "Check automatically" })
    expect(sw).toHaveAccessibleDescription("When the app opens, and every five minutes.")
    expect(sw).not.toBeChecked()
  })

  it("can be held disabled", () => {
    render(<AutoCheckSwitch status={base} onCheckedChange={() => {}} disabled />)
    expect(screen.getByRole("switch", { name: "Check automatically" })).toHaveAttribute("aria-disabled", "true")
  })

  it("renders nothing when the build has no updates", () => {
    const { container } = render(<AutoCheckSwitch status={at({ enabled: false })} onCheckedChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
})
