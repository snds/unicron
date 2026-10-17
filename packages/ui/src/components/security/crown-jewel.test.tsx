import fs from "node:fs"
import path from "node:path"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CodeDisplay } from "./code-display"
import { CrownJewelGate, CrownJewelMark, CrownJewelSurface, useCrownJewel, type CrownJewelProof } from "./crown-jewel"

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
