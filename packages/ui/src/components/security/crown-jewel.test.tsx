import fs from "node:fs"
import path from "node:path"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CodeDisplay } from "./code-display"
import * as React from "react"

import {
  CrownJewelGate,
  CrownJewelMark,
  CrownJewelSurface,
  crownJewelGateErrors,
  useCrownJewel,
  type CrownJewelProof,
  type CrownJewelProofKind,
} from "./crown-jewel"

const surface = () => document.querySelector('[data-slot="crown-jewel-surface"]') as HTMLElement
const code = { issuer: "Ledger", code: "482917", next: "330558", period: 30, expiresAt: 1000, now: 980 }

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("the re-mapped tier (test 1)", () => {
  it("points --background at the crown-jewel surface knob, which the tokens map to --protected", () => {
    render(
      <CrownJewelSurface host="app" title="Ledger recovery phrase">
        <p>inside</p>
      </CrownJewelSurface>
    )
    const s = surface()
    expect(s).toHaveAttribute("role", "region")
    expect(s).toHaveAttribute("aria-label", "Crown jewel: Ledger recovery phrase")
    expect(s.style.getPropertyValue("--background")).toBe("var(--c-crown-jewel-surface)")
    expect(s.style.getPropertyValue("--card")).toBe("var(--c-crown-jewel-surface)")
    expect(s.style.getPropertyValue("--foreground")).toBe("var(--c-crown-jewel-ink)")
    expect(s.style.getPropertyValue("--muted")).toBe("var(--c-crown-jewel-muted)")
    expect(s.style.getPropertyValue("--border")).toBe("var(--c-crown-jewel-border)")
    expect(s.style.getPropertyValue("--secondary")).toBe("var(--c-crown-jewel-muted)")

    // Built by `pnpm tokens:build` (CI runs it before the tests).
    const css = fs.readFileSync(path.resolve(process.cwd(), "..", "tokens", "dist", "tokens.css"), "utf8")
    expect(css).toMatch(/^ {2}--c-crown-jewel-surface: var\(--protected\);$/m)
    expect(css).toMatch(/^ {2}--c-crown-jewel-ink: var\(--protected-foreground\);$/m)
    expect(css).toMatch(/^ {2}--protected: var\(--g-neutral-950\);$/m)
  })

  it("draws the banner: lock, the word, the badge when device-only, and the explain control", () => {
    render(<CrownJewelSurface host="app" title="Seed phrase" deviceOnly appName="Lockdown" />)
    expect(screen.getByText("Crown jewel")).toBeInTheDocument()
    expect(screen.getByText("This device only")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "What crown jewel means" }))
    expect(screen.getByText(/You will only ever see this frame inside the Lockdown app or a system prompt, never on a web page\./)).toBeInTheDocument()
    expect(screen.getByText(/It stays on this device and is not synced\./)).toBeInTheDocument()
  })

  it("announces the rules once, on first focus inside", () => {
    render(
      <CrownJewelSurface host="app" title="Seed phrase">
        <button>inside</button>
      </CrownJewelSurface>
    )
    const live = surface().querySelector("[aria-live]") as HTMLElement
    expect(live).toHaveTextContent("")
    fireEvent.focus(screen.getByRole("button", { name: "inside" }))
    expect(live).toHaveTextContent("Crown jewel. Using it needs Touch ID. Showing it needs your account password.")
  })
})

describe("gated children (test 2)", () => {
  it("a CodeDisplay inside asks for proof before copying; one outside does not", async () => {
    const requestProof = vi.fn().mockResolvedValue(true)
    const onCopy = vi.fn()
    render(
      <>
        <CrownJewelSurface host="app" title="Ledger recovery phrase" requestProof={requestProof}>
          <CodeDisplay {...code} account="inside" onCopy={onCopy} />
        </CrownJewelSurface>
        <CodeDisplay {...code} account="outside" onCopy={onCopy} />
      </>
    )
    const [inside, outside] = Array.from(document.querySelectorAll('[data-slot="code-display"]')) as HTMLElement[]
    expect(inside).toHaveAttribute("data-gated")
    expect(inside).toHaveAttribute("data-state", "concealed")
    expect(outside).not.toHaveAttribute("data-gated")

    await act(async () => {
      fireEvent.click(outside.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    expect(requestProof).not.toHaveBeenCalled()
    expect(onCopy).toHaveBeenCalledTimes(1)

    await act(async () => {
      fireEvent.click(inside.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    expect(requestProof).toHaveBeenCalledWith("use")
    expect(onCopy).toHaveBeenCalledTimes(2)

    requestProof.mockResolvedValue(false)
    await act(async () => {
      fireEvent.click(inside.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    expect(onCopy).toHaveBeenCalledTimes(2)
  })

  it("useCrownJewel outside a surface is not gated", () => {
    function Probe() {
      const { gated } = useCrownJewel()
      return <span data-testid="gated">{String(gated)}</span>
    }
    render(<Probe />)
    expect(screen.getByTestId("gated")).toHaveTextContent("false")
  })
})

describe("host assertion (test 3)", () => {
  it('host="page" renders nothing and logs a development error', () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    render(
      <CrownJewelSurface host={"page" as "app"} title="Seed phrase">
        <p>leaked</p>
      </CrownJewelSurface>
    )
    expect(surface()).toBeNull()
    expect(screen.queryByText("leaked")).toBeNull()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('host="page"'))
  })
})

describe("the built-in gate (tests 4 and 5)", () => {
  async function arm() {
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
  }
  async function typeAndConfirm(password: string) {
    fireEvent.change(screen.getByLabelText("Account password"), { target: { value: password } })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    })
  }

  it("two confirmed uses in a row open the gate twice; nothing is cached", async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn(async (proof: CrownJewelProof) => proof.level === "password" && proof.password === "right")
    const onCopy = vi.fn()
    render(
      <CrownJewelSurface host="app" title="Ledger recovery phrase" onConfirm={onConfirm}>
        <CodeDisplay {...code} onCopy={onCopy} />
      </CrownJewelSurface>
    )
    const copy = () => fireEvent.click(document.querySelector('[data-slot="code-display-copy"]') as HTMLElement)

    for (let i = 1; i <= 2; i++) {
      await act(async () => {
        copy()
      })
      const dialog = screen.getByRole("dialog", { name: "Confirm it's you" })
      expect(dialog).toHaveTextContent("To use Ledger recovery phrase")
      // No biometric on this host, so use gates on the password too.
      expect(dialog).toHaveAttribute("data-slot", "crown-jewel-gate")
      expect(dialog).toHaveAttribute("data-level", "password")
      expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled()
      await arm()
      await typeAndConfirm("right")
      expect(onConfirm).toHaveBeenCalledTimes(i)
      expect(onCopy).toHaveBeenCalledTimes(i)
      await act(async () => {
        vi.advanceTimersByTime(500)
      })
      expect(screen.queryByRole("dialog", { name: "Confirm it's you" })).toBeNull()
    }
  })

  it("counts tries down, then fires the host's lock and closes", async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn(async () => false)
    const onLock = vi.fn()
    const onCopy = vi.fn()
    render(
      <CrownJewelSurface host="app" title="Ledger recovery phrase" onConfirm={onConfirm} onLock={onLock}>
        <CodeDisplay {...code} onCopy={onCopy} />
      </CrownJewelSurface>
    )
    await act(async () => {
      fireEvent.click(document.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    await arm()
    await typeAndConfirm("wrong")
    expect(screen.getByText("Password incorrect. 2 tries left.")).toBeInTheDocument()
    await typeAndConfirm("wrong")
    expect(screen.getByText("Password incorrect. 1 try left.")).toBeInTheDocument()
    expect(onLock).not.toHaveBeenCalled()
    await typeAndConfirm("wrong")
    expect(onLock).toHaveBeenCalledTimes(1)
    expect(onCopy).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(500)
    })
    expect(screen.queryByRole("dialog", { name: "Confirm it's you" })).toBeNull()
  })
})

describe("the standalone gate and the mark", () => {
  it("shows the reason, is inert for the arming delay, and hands the password proof to the host", async () => {
    vi.useFakeTimers()
    const onConfirm = vi.fn()
    render(<CrownJewelGate open level="password" reason="To show the recovery phrase for Ledger" attemptsLeft={2} error="Password incorrect." onConfirm={onConfirm} />)
    expect(screen.getByText("To show the recovery phrase for Ledger")).toBeInTheDocument()
    expect(screen.getByText(/Password incorrect\. 2 tries left\./)).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Account password"), { target: { value: "pw" } })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    })
    expect(onConfirm).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(600)
    })
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    })
    expect(onConfirm).toHaveBeenCalledWith({ level: "password", password: "pw" })
  })

  it("at the biometric level asks the OS on open and hands its token to the host", async () => {
    const onBiometric = vi.fn().mockResolvedValue("os-token")
    const onConfirm = vi.fn()
    render(<CrownJewelGate open level="biometric" reason="To use the Ledger key" onBiometric={onBiometric} onConfirm={onConfirm} />)
    await act(async () => {})
    expect(onBiometric).toHaveBeenCalledTimes(1)
    expect(onConfirm).toHaveBeenCalledWith({ level: "biometric", token: "os-token" })
  })

  it("the mark hides its icon and carries the word for assistive tech", () => {
    render(
      <p>
        Ledger <CrownJewelMark size="sm" />
      </p>
    )
    const mark = document.querySelector('[data-slot="crown-jewel-mark"]') as HTMLElement
    expect(mark).toHaveAttribute("data-size", "sm")
    expect(mark.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
    expect(mark).toHaveTextContent("Crown jewel")
  })
})

describe("no biometric on this device (biometricName={null})", () => {
  it("the announcement and the explain copy name only the account password", () => {
    render(
      <CrownJewelSurface host="app" title="Seed phrase" biometricName={null}>
        <button>inside</button>
      </CrownJewelSurface>
    )
    fireEvent.focus(screen.getByRole("button", { name: "inside" }))
    const live = surface().querySelector("[aria-live]") as HTMLElement
    expect(live).toHaveTextContent("Crown jewel. Using it or showing it needs your account password.")
    expect(live).not.toHaveTextContent("Touch ID")
    fireEvent.click(screen.getByRole("button", { name: "What crown jewel means" }))
    const explain = document.querySelector('[data-slot="crown-jewel-explain-dialog"]') as HTMLElement
    expect(explain).toHaveTextContent("To use it, show it in full or export it, you type your account password, every time.")
    expect(explain).not.toHaveTextContent("Touch ID")
    expect(explain).not.toHaveTextContent("null")
  })

  it("the built-in gate asks for the password for use, even when onBiometric is passed", async () => {
    const onBiometric = vi.fn().mockResolvedValue("token")
    render(
      <CrownJewelSurface host="app" title="Ledger recovery phrase" biometricName={null} onBiometric={onBiometric} onConfirm={() => true}>
        <CodeDisplay {...code} onCopy={() => {}} />
      </CrownJewelSurface>
    )
    await act(async () => {
      fireEvent.click(document.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    expect(screen.getByRole("dialog", { name: "Confirm it's you" })).toHaveAttribute("data-level", "password")
    expect(onBiometric).not.toHaveBeenCalled()
  })

  it("the standalone gate at the biometric level says the device has none", () => {
    render(<CrownJewelGate open level="biometric" reason="To use the Ledger key" biometricName={null} onConfirm={() => {}} />)
    expect(screen.getByText("This device has no biometric check; use your account password instead.")).toBeInTheDocument()
  })
})

describe("a host whose core judges the proof at call time", () => {
  /**
   * The pattern the spec documents: the surface takes the host's `requestProof`, which only collects
   * the password through the standalone gate. The gated call carries it; when the core says it was
   * wrong, the host re-opens the gate with `attemptsLeft` and `crownJewelGateErrors.wrongPassword`,
   * and locks after the last try.
   */
  function CallTimeHost({ core, onLock }: { core: (password: string) => Promise<boolean>; onLock: () => void }) {
    const [ask, setAsk] = React.useState<{ attemptsLeft: number; error?: string; resolve: (p: string | null) => void } | null>(null)
    const collect = (attemptsLeft: number, error?: string) =>
      new Promise<string | null>((resolve) => setAsk({ attemptsLeft, error, resolve }))
    const close = (p: string | null) => {
      ask?.resolve(p)
      setAsk(null)
    }
    // The gated call: collect, call, re-ask on a wrong password.
    const gatedCopy = async () => {
      let left = 3
      let password = await collect(left)
      while (password !== null) {
        if (await core(password)) return
        left -= 1
        if (left === 0) {
          onLock()
          throw new Error("locked") // nothing was copied, so CodeDisplay starts no countdown
        }
        password = await collect(left, crownJewelGateErrors.wrongPassword(left))
      }
      throw new Error("cancelled")
    }
    const requestProof = async (_kind: CrownJewelProofKind) => true // nothing to judge yet; the call carries the proof
    return (
      <>
        <CrownJewelSurface host="app" title="Ledger recovery phrase" requestProof={requestProof}>
          <CodeDisplay {...code} onCopy={gatedCopy} />
        </CrownJewelSurface>
        <CrownJewelGate
          open={ask !== null}
          level="password"
          reason="To use Ledger recovery phrase"
          attemptsLeft={ask?.attemptsLeft}
          error={ask?.error}
          biometricName={null}
          onConfirm={(p) => close(p.level === "password" ? p.password : null)}
          onCancel={() => close(null)}
        />
      </>
    )
  }

  it("re-asks with the tries left in the gate's own words, and locks after the third wrong password", async () => {
    vi.useFakeTimers()
    const core = vi.fn(async (password: string) => password === "right")
    const onLock = vi.fn()
    render(<CallTimeHost core={core} onLock={onLock} />)
    await act(async () => {
      fireEvent.click(document.querySelector('[data-slot="code-display-copy"]') as HTMLElement)
    })
    const typeAndConfirm = async (password: string) => {
      await act(async () => {
        vi.advanceTimersByTime(600)
      })
      fireEvent.change(screen.getByLabelText("Account password"), { target: { value: password } })
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
      })
    }
    await typeAndConfirm("wrong")
    expect(screen.getByText(crownJewelGateErrors.wrongPassword(2))).toBeInTheDocument()
    expect(crownJewelGateErrors.wrongPassword(2)).toBe("Password incorrect. 2 tries left.")
    await typeAndConfirm("wrong")
    expect(screen.getByText("Password incorrect. 1 try left.")).toBeInTheDocument()
    await typeAndConfirm("wrong")
    expect(core).toHaveBeenCalledTimes(3)
    expect(onLock).toHaveBeenCalledTimes(1)
    expect(document.querySelector('[data-slot="code-display"]')).not.toHaveAttribute("data-copied")
  })
})
