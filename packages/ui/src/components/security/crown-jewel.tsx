// Owned component (not generated): the CrownJewel treatment, three parts in one module. Spec:
// docs/specs/security/crown-jewel-treatment.md.
// Promoted from: snds/lockdown · PR snds/unicron (this PR) · DSA none (first principles, Lockdown brief §5.7)
"use client"

import * as React from "react"

import { cn } from "../../lib/utils"
import { Icon } from "../icon"
import { IconButton } from "../icon-button"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogAction,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Field, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Skeleton } from "../ui/skeleton"
import { readSecondsToken } from "./copy-countdown"

// ── Context: what nested SecretField, CodeDisplay and LargeTypeView read ──────────────────────

export type CrownJewelProofKind = "use" | "reveal"
export type CrownJewelLevel = "biometric" | "password"
export type CrownJewelHost = "app" | "os" | "extension-top-layer"

/** The proof the gate hands the host. Opaque to the component; the core judges it. */
export type CrownJewelProof =
  | { level: "biometric"; token: unknown }
  | { level: "password"; password: string }

export interface CrownJewelContextValue {
  /** True inside a `CrownJewelSurface`: children mask, hide fill affordances, and gate use and reveal. */
  gated: boolean
  /** Ask for proof before an action. `use` (copy, sign) asks for a biometric; `reveal` (show, export) asks for the password. Resolves `false` when the person backs out or the host refuses. */
  requestProof: (kind: CrownJewelProofKind) => Promise<boolean>
}

const CrownJewelContext = React.createContext<CrownJewelContextValue>({
  gated: false,
  requestProof: async () => true,
})

/** Read the crown-jewel context. Outside a surface: `{ gated: false }` and a proof that always resolves. */
export function useCrownJewel(): CrownJewelContextValue {
  return React.useContext(CrownJewelContext)
}

const HOSTS: readonly CrownJewelHost[] = ["app", "os", "extension-top-layer"]
const DEFAULT_ATTEMPTS = 3
const DEFAULT_ARM_DELAY_S = 0.5
const DEFAULT_BIOMETRIC = "Touch ID"

/**
 * The gate's own sentences, exported so a host that runs the re-ask itself (its core judges the
 * proof when the gated call arrives, not in `onConfirm`) says the same words as the built-in gate.
 */
export const crownJewelGateErrors = {
  wrongPassword: (attemptsLeft: number) =>
    `Password incorrect. ${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left.`,
  biometricRefused: (biometricName: string) => `${biometricName} didn't confirm it's you. Use your account password instead.`,
} as const

function isDevelopment(): boolean {
  const env = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env
  return env?.NODE_ENV !== "production"
}

// ── Mark ──────────────────────────────────────────────────────────────────────────────────────

export interface CrownJewelMarkProps extends React.ComponentProps<"span"> {
  size?: "sm" | "md"
}

/** Inline: a filled lock plus sr-only "Crown jewel", after a title in rows, headings and search results. */
export function CrownJewelMark({ size = "md", className, ...props }: CrownJewelMarkProps) {
  return (
    <span
      data-slot="crown-jewel-mark"
      data-size={size}
      className={cn("inline-flex shrink-0 items-center align-middle", className)}
      {...props}
    >
      <Icon name="lock" fill weight={500} className={size === "sm" ? "size-3.5" : "size-4"} />
      <span className="sr-only">Crown jewel</span>
    </span>
  )
}

// ── Gate ──────────────────────────────────────────────────────────────────────────────────────

export interface CrownJewelGateProps {
  open: boolean
  onOpenChange?: (open: boolean) => void
  /** `biometric` for use; `password` for reveal or export. */
  level: CrownJewelLevel
  /** Always shown, never generic: "To show the recovery phrase for Ledger". */
  reason: string
  /** Hands the host the proof. The component never judges it. */
  onConfirm: (proof: CrownJewelProof) => void | Promise<void>
  onCancel?: () => void
  /** At the biometric level: ask the OS. Resolves to an opaque token, or `null` when the person backed out. */
  onBiometric?: () => Promise<unknown>
  attemptsLeft?: number
  /** Host-driven: "Password incorrect. 2 tries left." Read through the dialog's live region. */
  error?: string
  busy?: boolean
  /** The platform's word for the biometric step; defaults to "Touch ID". `null`: this device has no biometric. */
  biometricName?: string | null
}

/**
 * "Confirm it's you." A Dialog that collects proof at one of two levels and hands it to the host.
 * Its actions are inert for the arming delay after open, the same window ApprovalSheet uses, so a
 * double click that opened the request cannot land on Confirm.
 */
export function CrownJewelGate({
  open,
  onOpenChange,
  level,
  reason,
  onConfirm,
  onCancel,
  onBiometric,
  attemptsLeft,
  error,
  busy = false,
  biometricName = DEFAULT_BIOMETRIC,
}: CrownJewelGateProps) {
  const [password, setPassword] = React.useState("")
  const [armed, setArmed] = React.useState(false)
  const [waiting, setWaiting] = React.useState(false)
  const passwordRef = React.useRef<HTMLInputElement>(null)
  const popupRef = React.useRef<HTMLDivElement>(null)
  const biometricRan = React.useRef(false)

  // Arming delay: read the shared knob from the popup once it exists; fall back to the spec's 500 ms.
  React.useEffect(() => {
    if (!open) return
    const delay = readSecondsToken(popupRef.current ?? document.body, "--c-approval-arm-delay", DEFAULT_ARM_DELAY_S)
    const t = setTimeout(() => setArmed(true), delay * 1000)
    return () => {
      clearTimeout(t)
      // Closing disarms and forgets the typed password; the next open starts the delay again.
      setArmed(false)
      setPassword("")
      biometricRan.current = false
    }
  }, [open])

  const runBiometric = React.useCallback(async () => {
    if (!onBiometric) return
    setWaiting(true)
    try {
      const token = await onBiometric()
      if (token !== null && token !== undefined) await onConfirm({ level: "biometric", token })
    } catch {
      // The host reports failures through `error`; nothing to judge here.
    } finally {
      setWaiting(false)
    }
  }, [onBiometric, onConfirm])

  // The biometric step hands focus to the OS prompt as soon as the dialog opens.
  React.useEffect(() => {
    if (!open || level !== "biometric" || biometricRan.current) return
    biometricRan.current = true
    void runBiometric()
  }, [open, level, runBiometric])

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!armed || busy) return
    if (level === "password") {
      if (!password) return
      void onConfirm({ level: "password", password })
      setPassword("")
    } else {
      void runBiometric()
    }
  }

  const cancel = () => {
    onCancel?.()
    onOpenChange?.(false)
  }

  const tries =
    attemptsLeft === undefined ? undefined : `${attemptsLeft} ${attemptsLeft === 1 ? "try" : "tries"} left`

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel?.()
        onOpenChange?.(next)
      }}
    >
      <DialogContent
        ref={popupRef}
        data-slot="crown-jewel-gate"
        data-level={level}
        data-armed={armed ? "true" : "false"}
        showCloseButton={false}
        initialFocus={level === "password" ? passwordRef : undefined}
      >
        <form onSubmit={submit} className="contents">
          <DialogHeader>
            <DialogTitle>Confirm it's you</DialogTitle>
            <DialogDescription data-slot="crown-jewel-gate-reason">{reason}</DialogDescription>
          </DialogHeader>
          <div data-slot="crown-jewel-gate-step" className="flex flex-col gap-2">
            {level === "password" ? (
              <Field>
                <FieldLabel htmlFor="crown-jewel-gate-password">Account password</FieldLabel>
                <Input
                  ref={passwordRef}
                  id="crown-jewel-gate-password"
                  type="password"
                  autoComplete="current-password"
                  spellCheck={false}
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
            ) : (
              <p className="text-muted-foreground text-sm">
                {biometricName === null
                  ? "This device has no biometric check; use your account password instead."
                  : waiting || busy
                    ? `Waiting for ${biometricName}…`
                    : onBiometric
                      ? `${biometricName} confirms it's you. No password is needed for this.`
                      : `This device cannot use ${biometricName}; use your account password instead.`}
              </p>
            )}
            <p aria-live="polite" className="text-destructive min-h-5 text-sm">
              {error ? (
                <>
                  {error}
                  {tries && !error.includes("left") ? ` ${tries}.` : null}
                </>
              ) : null}
            </p>
          </div>
          <DialogActions>
            <DialogAction kind="cancel" type="button" onClick={cancel} disabled={!armed || busy}>
              Cancel
            </DialogAction>
            <DialogAction
              kind="confirm"
              type="submit"
              disabled={!armed || busy || (level === "password" ? password.length === 0 : !onBiometric || waiting)}
            >
              Confirm
            </DialogAction>
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Surface ───────────────────────────────────────────────────────────────────────────────────

export interface CrownJewelSurfaceProps extends Omit<React.ComponentProps<"section">, "title"> {
  /** Where this surface is being drawn. Anything but the app, an OS surface or the extension's top-layer frame renders nothing (and logs in development). */
  host: CrownJewelHost
  /** Shows the "This device only" badge and adds the sync rule to the explain copy. */
  deviceOnly?: boolean
  /** Names the thing for the region: "Ledger recovery phrase". */
  title: string
  loading?: boolean
  /** The item failed to decrypt: the banner stays, the content shows this. */
  error?: string
  /** The product's name in the explain copy; without it the sentence says "the app". */
  appName?: string
  /**
   * The platform's word for the biometric step; defaults to "Touch ID". `null` says this device has
   * no biometric: the explain copy and the announcement name only the account password, and the
   * built-in gate asks for the password for use too (`onBiometric` is ignored).
   */
  biometricName?: string | null
  /**
   * Host-owned gate. When given, nested components call this instead of the built-in gate, and the
   * host shows its own prompt. Otherwise the surface opens `CrownJewelGate` and uses `onConfirm`.
   */
  requestProof?: (kind: CrownJewelProofKind) => Promise<boolean>
  /** Built-in gate: hand the proof to the core; resolve `true` when it accepts. Nothing is cached; the next use asks again. */
  onConfirm?: (proof: CrownJewelProof, kind: CrownJewelProofKind) => boolean | Promise<boolean>
  /** Built-in gate: ask the OS for a biometric. Omit where there is none (Linux); use then gates on the password. */
  onBiometric?: () => Promise<unknown>
  /** After the last password try the host locks the vault. */
  onLock?: () => void
}

interface GateState {
  kind: CrownJewelProofKind
  level: CrownJewelLevel
  attemptsLeft: number
  error?: string
  busy: boolean
  resolve: (ok: boolean) => void
}

/**
 * The inverted frame. Inside it the semantic roles point at the protected values (the same trick
 * `.dark` uses), so nested primitives invert with no overrides, and nested SecretField, CodeDisplay
 * and LargeTypeView read `useCrownJewel()` and switch to gated mode.
 */
export function CrownJewelSurface({
  host,
  deviceOnly = false,
  title,
  loading = false,
  error,
  appName,
  biometricName = DEFAULT_BIOMETRIC,
  requestProof: hostRequestProof,
  onConfirm,
  onBiometric,
  onLock,
  className,
  style,
  children,
  onFocus,
  ...props
}: CrownJewelSurfaceProps) {
  const [explain, setExplain] = React.useState(false)
  const [announced, setAnnounced] = React.useState<string | null>(null)
  const [gate, setGate] = React.useState<GateState | null>(null)
  const sectionRef = React.useRef<HTMLElement>(null)
  const gateRef = React.useRef<GateState | null>(null)
  React.useEffect(() => {
    gateRef.current = gate
  }, [gate])

  const hostOk = HOSTS.includes(host)
  React.useEffect(() => {
    if (!hostOk && isDevelopment()) {
      console.error(
        `CrownJewelSurface: host="${String(host)}" is not a place this surface may be drawn. It renders only in the app, an OS surface or the extension's top-layer frame, never in web content.`
      )
    }
  }, [host, hostOk])

  const builtInRequestProof = React.useCallback(
    (kind: CrownJewelProofKind) =>
      new Promise<boolean>((resolve) => {
        // Settle any gate still open; a new request never reuses an old one (no cached proof).
        gateRef.current?.resolve(false)
        const wantsBiometric = kind === "use" && Boolean(onBiometric) && biometricName !== null
        const attempts = Math.max(
          1,
          Math.round(readSecondsToken(sectionRef.current, "--c-crown-jewel-gate-attempts", DEFAULT_ATTEMPTS))
        )
        setGate({
          kind,
          level: wantsBiometric ? "biometric" : "password",
          attemptsLeft: attempts,
          busy: false,
          resolve,
        })
      }),
    [onBiometric, biometricName]
  )

  const context = React.useMemo<CrownJewelContextValue>(
    () => ({ gated: true, requestProof: hostRequestProof ?? builtInRequestProof }),
    [hostRequestProof, builtInRequestProof]
  )

  const settle = (ok: boolean) => {
    const g = gateRef.current
    setGate(null)
    g?.resolve(ok)
  }

  const handleConfirm = async (proof: CrownJewelProof) => {
    const g = gateRef.current
    if (!g) return
    setGate({ ...g, busy: true, error: undefined })
    let accepted = false
    try {
      accepted = onConfirm ? await onConfirm(proof, g.kind) : false
    } catch {
      accepted = false
    }
    if (!onConfirm && isDevelopment()) console.error("CrownJewelSurface: no onConfirm; the gate cannot accept any proof.")
    if (accepted) {
      settle(true)
      return
    }
    if (proof.level === "biometric") {
      setGate({
        ...g,
        busy: false,
        level: "password",
        error: crownJewelGateErrors.biometricRefused(biometricName ?? "The biometric check"),
      })
      return
    }
    const left = g.attemptsLeft - 1
    if (left <= 0) {
      settle(false)
      onLock?.()
      return
    }
    setGate({ ...g, busy: false, attemptsLeft: left, error: crownJewelGateErrors.wrongPassword(left) })
  }

  if (!hostOk) return null

  const reason = `To ${gate?.kind === "use" ? "use" : "show"} ${title}`
  const announcement =
    biometricName === null
      ? "Crown jewel. Using it or showing it needs your account password."
      : `Crown jewel. Using it needs ${biometricName}. Showing it needs your account password.`

  const remap = {
    "--background": "var(--c-crown-jewel-surface)",
    "--card": "var(--c-crown-jewel-surface)",
    "--popover": "var(--c-crown-jewel-surface)",
    "--foreground": "var(--c-crown-jewel-ink)",
    "--card-foreground": "var(--c-crown-jewel-ink)",
    "--popover-foreground": "var(--c-crown-jewel-ink)",
    "--primary": "var(--c-crown-jewel-ink)",
    "--primary-foreground": "var(--c-crown-jewel-surface)",
    "--secondary": "var(--c-crown-jewel-muted)",
    "--secondary-foreground": "var(--c-crown-jewel-ink)",
    "--muted": "var(--c-crown-jewel-muted)",
    "--muted-foreground": "var(--c-crown-jewel-muted-ink)",
    "--accent": "var(--c-crown-jewel-muted)",
    "--accent-foreground": "var(--c-crown-jewel-ink)",
    "--border": "var(--c-crown-jewel-border)",
    "--input": "var(--c-crown-jewel-border)",
    "--ring": "var(--c-crown-jewel-muted-ink)",
    "--c-icon-fill": "var(--c-crown-jewel-icon-fill)",
    "--c-icon-wght": "var(--c-crown-jewel-icon-wght)",
  } as React.CSSProperties

  return (
    <CrownJewelContext.Provider value={context}>
      <section
        ref={sectionRef}
        data-slot="crown-jewel-surface"
        data-protected=""
        data-gated=""
        data-device-only={deviceOnly ? "" : undefined}
        role="region"
        aria-label={`Crown jewel: ${title}`}
        className={cn(
          "bg-background text-foreground flex min-w-80 flex-col gap-3 rounded-xl border p-4 text-sm",
          // Forced colors drop the inversion; a 2px border, the lock and the word carry the treatment.
          "forced-colors:border-2 contrast-more:border-2",
          className
        )}
        style={{ ...remap, ...style }}
        onFocus={(e) => {
          onFocus?.(e)
          if (announced === null) setAnnounced(announcement)
        }}
        {...props}
      >
        <div data-slot="crown-jewel-banner" className="flex items-center gap-2">
          <Icon data-slot="crown-jewel-icon" name="lock" />
          <span data-slot="crown-jewel-label" className="font-medium">
            Crown jewel
          </span>
          {deviceOnly && (
            <Badge data-slot="crown-jewel-device-only" variant="outline">
              This device only
            </Badge>
          )}
          <span className="ml-auto">
            <IconButton
              data-slot="crown-jewel-explain"
              label="What crown jewel means"
              icon="help"
              size="icon-sm"
              onClick={() => setExplain(true)}
            />
          </span>
        </div>
        <div data-slot="crown-jewel-content" className="flex flex-col gap-3">
          {loading ? (
            <>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-8 w-full" />
            </>
          ) : error ? (
            <p className="text-destructive" role="alert">
              {error}
            </p>
          ) : (
            children
          )}
        </div>
        <span aria-live="polite" className="sr-only">
          {announced}
        </span>
      </section>

      <Dialog open={explain} onOpenChange={setExplain}>
        <DialogContent data-slot="crown-jewel-explain-dialog">
          <DialogHeader>
            <DialogTitle>Crown jewel</DialogTitle>
            <DialogDescription>A secret that could unlock everything else, so it follows stricter rules.</DialogDescription>
          </DialogHeader>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {biometricName === null ? (
              <li>To use it, show it in full or export it, you type your account password, every time.</li>
            ) : (
              <>
                <li>To use it, {biometricName} confirms it's you, every time.</li>
                <li>To show it in full or to export it, you type your account password.</li>
              </>
            )}
            <li>It never fills in on its own, never appears in search previews, and is never handed to agents.</li>
            {deviceOnly && <li>It stays on this device and is not synced.</li>}
          </ul>
          <p className="font-medium">
            You will only ever see this frame inside {appName ? `the ${appName} app` : "the app"} or a system prompt, never on a
            web page.
          </p>
          <DialogFooter>
            <Button onClick={() => setExplain(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hostRequestProof && (
        <CrownJewelGate
          open={gate !== null}
          onOpenChange={(open) => {
            if (!open) settle(false)
          }}
          level={gate?.level ?? "password"}
          reason={reason}
          attemptsLeft={gate?.attemptsLeft}
          error={gate?.error}
          busy={gate?.busy ?? false}
          biometricName={biometricName}
          onBiometric={onBiometric}
          onConfirm={handleConfirm}
        />
      )}
    </CrownJewelContext.Provider>
  )
}
