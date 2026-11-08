// Owned component (not generated): the updates part of an app's Settings → About, so every app
// shows its version, channel, status and update actions in the same words and the same shape.
// Promoted from: snds/lockdown, snds/synapse · PR snds/unicron (this PR) · DSA none (hand-raised in the unified updates plan, U6)
import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { Button, buttonVariants } from "./button"
import { Field, FieldContent, FieldDescription, FieldLabel } from "./field"
import { Switch } from "./switch"

/** Where an update stands, as the update kit's shell reports it. */
export type UpdateState = "idle" | "checking" | "up_to_date" | "downloading" | "ready" | "available" | "failed"

/** Where updates come from: the web feed's two channels, or builds made on this computer. */
export type UpdateChannel = "main" | "stable" | "local"

/**
 * The update kit's `UpdateStatus` (snds/app-updates), field for field. Plain data and plain words
 * from the shell; nothing in it is secret. The components only read it.
 */
export interface UpdateStatus {
  /** The running version, such as `0.1.0-main.20261107093000`. */
  version: string
  channel: UpdateChannel
  /** Whether this build checks for updates at all. */
  enabled: boolean
  /** Why it doesn't, in one line. */
  off: string | null
  /** The "Check automatically" switch. */
  auto_check: boolean
  state: UpdateState
  /** 0 to 99 while downloading. */
  percent: number | null
  /** The newer version (downloading, ready, available). */
  offered: string | null
  /** What went wrong, in plain words (failed). */
  error: string | null
  /** Where to get the newer build by hand (available). */
  link: string | null
  /** Why the app points there instead of updating itself (available). */
  link_why: string | null
  /** The last check was asked for (a button, the menu or the palette). */
  asked: boolean
}

/**
 * Every word the two components show. The defaults are Lockdown's and Synapse's; pass any of them
 * to `words` to change it (a translation, an app's own phrasing).
 */
export interface UpdateWords {
  /** The check button. */
  check: string
  /** The button shown once an update is ready. */
  restart: string
  /** The button shown otherwise. */
  reload: string
  /** The link to the release page, shown when an update is available but can't install itself. */
  release: string
  /** The automatic check switch's label. */
  autoCheck: string
  /** Where updates come from, as Settings names it. */
  channel: (channel: UpdateChannel) => string
  /** The version line: the app, its version, and the channel's name. */
  version: (appName: string, version: string, channelName: string) => string
  /** The one status line. */
  line: (status: UpdateStatus, appName: string) => string
  /** When the automatic check runs, for the switch's description. */
  autoCheckWhen: (channel: UpdateChannel) => string
}

/** Whether "Check for updates" can be pressed now. */
export function canCheckForUpdates(status: Pick<UpdateStatus, "enabled" | "state">): boolean {
  return status.enabled && status.state !== "checking" && status.state !== "downloading"
}

/**
 * The one status line under the version, in Lockdown's and Synapse's words. The local channel
 * talks about builds, as Synapse does; the web channels name the version, as Lockdown does.
 */
export function updateLine(status: UpdateStatus, appName: string): string {
  const s = status
  if (!s.enabled) return s.off ?? "Updates are off in this build."
  const local = s.channel === "local"
  switch (s.state) {
    case "idle":
      if (!s.auto_check) return "Automatic checks are off. Check whenever you like."
      return local
        ? `${appName} looks for a new build from this Mac every five minutes.`
        : `${appName} checks for updates when it opens and every six hours.`
    case "checking":
      return "Checking for updates…"
    case "up_to_date":
      return `${appName} is up to date.`
    case "downloading":
      return `Downloading ${!local && s.offered ? `version ${s.offered}` : "the update"}… ${s.percent ?? 0}%`
    case "ready":
      return `${local ? "A new build is" : s.offered ? `Version ${s.offered} is` : "The update is"} ready. Restart to update, or it installs when you quit.`
    case "available":
      return `${!local && s.offered ? `Version ${s.offered} is` : "A newer build is"} out. ${s.link_why ?? ""}`.trim()
    case "failed":
      return s.error ?? "The update didn't work."
    default:
      return ""
  }
}

/** The default English words. */
export const updateWords: UpdateWords = {
  check: "Check for updates",
  restart: "Restart to update",
  reload: "Reload app",
  release: "Get it from GitHub",
  autoCheck: "Check automatically",
  channel: (channel) =>
    channel === "local"
      ? "builds made on this Mac"
      : channel === "main"
        ? "main channel (every merged change)"
        : "stable channel",
  version: (appName, version, channelName) => `${appName} ${version} · ${channelName}`,
  line: updateLine,
  autoCheckWhen: (channel) =>
    channel === "local" ? "When the app opens, and every five minutes." : "When the app opens, and every six hours.",
}

export interface UpdateStatusRowProps extends Omit<React.ComponentProps<"div">, "children"> {
  /** What the shell reports. */
  status: UpdateStatus
  /** The app's name, as people know it ("Lockdown"). */
  appName: string
  /** Any words to change; the rest stay the defaults. */
  words?: Partial<UpdateWords>
  /** Check now (and start the download if there is one). */
  onCheck: () => void
  /** Install the ready update and restart. */
  onRestart: () => void
  /** Close and reopen the app. */
  onReload: () => void
  /**
   * Open the release page. A desktop shell passes its own opener, since a web view won't open a
   * new window by itself. Without it the link opens in a new tab.
   */
  onOpenLink?: (link: string) => void
  /** A line under the actions once an update is ready ("Restarting locks Lockdown…"). */
  restartNote?: React.ReactNode
  /** What went wrong with the last action, read out at once. */
  error?: React.ReactNode
}

/**
 * The version and channel, one status line, and the update actions: Check for updates, Restart to
 * update once an update is ready (Reload app otherwise), and the release page when the update has
 * to be fetched by hand. It only shows what it is given and calls back; the app owns the data.
 */
function UpdateStatusRow({
  status,
  appName,
  words,
  onCheck,
  onRestart,
  onReload,
  onOpenLink,
  restartNote,
  error,
  className,
  ...props
}: UpdateStatusRowProps) {
  const w = { ...updateWords, ...words }
  const ready = status.state === "ready"
  const failed = status.state === "failed"
  const link = status.state === "available" ? status.link : null
  return (
    <div
      data-slot="update-status-row"
      data-state={status.state}
      className={cn("gap-3 flex flex-col", className)}
      {...props}
    >
      <div data-slot="update-status-row-text" className="gap-0.5 flex flex-col">
        <p data-slot="update-status-row-version" className="type-body-strong">
          {w.version(appName, status.version, w.channel(status.channel))}
        </p>
        {/* A live region, so a check's outcome is read out. Busy while downloading, so the
            percentage isn't read out at every step; the outcome is. */}
        <p
          data-slot="update-status-row-line"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-busy={status.state === "downloading" || undefined}
          className={cn("type-support", failed && "text-destructive")}
        >
          {w.line(status, appName)}
        </p>
      </div>
      <div data-slot="update-status-row-actions" className="gap-2 flex flex-wrap items-center">
        <Button size="sm" variant="outline" disabled={!canCheckForUpdates(status)} onClick={onCheck}>
          <Icon name="refresh" data-icon="inline-start" />
          {w.check}
        </Button>
        {ready ? (
          <Button size="sm" onClick={onRestart}>
            <Icon name="restart_alt" data-icon="inline-start" />
            {w.restart}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onReload}>
            <Icon name="replay" data-icon="inline-start" />
            {w.reload}
          </Button>
        )}
        {link && (
          // A link drawn as a button: it goes somewhere, so it keeps the link role.
          <a
            data-slot="update-status-row-release"
            href={link}
            target="_blank"
            rel="noreferrer"
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={
              onOpenLink
                ? (event) => {
                    event.preventDefault()
                    onOpenLink(link)
                  }
                : undefined
            }
          >
            <Icon name="open_in_new" data-icon="inline-start" />
            {w.release}
          </a>
        )}
      </div>
      {ready && restartNote && (
        <p data-slot="update-status-row-note" className="type-meta">
          {restartNote}
        </p>
      )}
      {error && (
        <p data-slot="update-status-row-error" role="alert" className="type-support text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export interface AutoCheckSwitchProps extends Omit<React.ComponentProps<"div">, "children" | "onChange"> {
  /** What the shell reports. The switch shows `auto_check`, and only when `enabled`. */
  status: Pick<UpdateStatus, "enabled" | "auto_check" | "channel">
  /** Turn the automatic check on or off. */
  onCheckedChange: (on: boolean) => void
  /** Hold the switch still, such as while the change is being saved. */
  disabled?: boolean
  /** The label and description; the rest of the words are ignored here. */
  words?: Partial<Pick<UpdateWords, "autoCheck" | "autoCheckWhen">>
}

/**
 * The "Check automatically" row: a label, when the check runs, and a switch. Nothing renders when
 * the build has no updates, since there is nothing to check.
 */
function AutoCheckSwitch({ status, onCheckedChange, disabled, words, className, ...props }: AutoCheckSwitchProps) {
  const w = { ...updateWords, ...words }
  const id = React.useId()
  if (!status.enabled) return null
  return (
    <Field
      orientation="horizontal"
      data-disabled={disabled ? "true" : undefined}
      className={className}
      {...props}
    >
      <FieldContent>
        <FieldLabel htmlFor={`${id}-switch`}>{w.autoCheck}</FieldLabel>
        <FieldDescription id={`${id}-description`}>{w.autoCheckWhen(status.channel)}</FieldDescription>
      </FieldContent>
      <Switch
        id={`${id}-switch`}
        aria-describedby={`${id}-description`}
        checked={status.auto_check}
        disabled={disabled}
        onCheckedChange={(on) => onCheckedChange(on)}
      />
    </Field>
  )
}

export { UpdateStatusRow, AutoCheckSwitch }
