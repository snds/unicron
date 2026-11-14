import { act, fireEvent, render, screen } from "@testing-library/react"
import type * as React from "react"

import { AdaptiveMenuItem } from "../ui/adaptive"
import { CrownJewelSurface } from "./crown-jewel"
import {
  SecretField,
  SecretFieldMenuItem,
  SecretFieldRemoteButton,
  secretFieldAnnouncements,
  secretFieldErrors,
  secretStrengthFromScore,
  spellSecret,
  type SecretFieldAction,
  type SecretFieldHost,
  type SecretFieldReferenceHost,
  useSecretFieldRemote,
} from "./secret-field"

const SECRET = "Tr4-ck3t"
const bytes = () => new TextEncoder().encode(SECRET)

function fakeHost(overrides: Partial<SecretFieldHost> = {}): SecretFieldHost {
  return {
    copy: vi.fn((_bytes: Uint8Array) => Promise.resolve()),
    clear: vi.fn(() => Promise.resolve()),
    ...overrides,
  }
}

/** Let the pending promises (gate → fetch → hash → DOM write) settle under fake timers. SubtleCrypto resolves off the microtask queue, so drain a few real immediates too. */
const settle = () =>
  act(async () => {
    await vi.advanceTimersByTimeAsync(0)
    for (let i = 0; i < 50; i++) await nextTurn()
  })
/** Wait until a mock has been called `times` times (the copy path crosses SubtleCrypto, which lands on a later macrotask). */
const untilCalled = (fn: unknown, times = 1) =>
  act(async () => {
    const mock = fn as { mock: { calls: unknown[] } }
    for (let i = 0; i < 20_000 && mock.mock.calls.length < times; i++) await nextTurn()
    if (mock.mock.calls.length < times) throw new Error(`mock not called ${times}× in time`)
  })
/** One macrotask turn, so threadpool work (SubtleCrypto) can land. setImmediate is left real by the fake-timer config. */
const nextTurn = () => new Promise<void>((r) => setImmediate(r))
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

const revealButton = (label = "Password") => screen.getByRole("button", { name: new RegExp(`(Show|Hide|Hold to show) ${label}`) })
const copyButton = (label = "Password") => screen.getByRole("button", { name: `Copy ${label}` })
const valueOf = (container: HTMLElement) => container.querySelector('[data-slot="secret-field-revealed"]')!

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
})
afterEach(() => {
  vi.useRealTimers()
})

describe("SecretField read mode: the value never sits in the DOM while masked", () => {
  it("shows a fixed 12-dot mask, no secret text, and the hidden label", () => {
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(container.textContent).not.toContain(SECRET)
    expect(container.textContent).toContain("•".repeat(12))
    expect(screen.getByRole("textbox", { name: "Password, hidden" })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-state", "masked")
  })

  it("toggle mode: reveals on click, spells it for a screen reader, and the text is gone after the lifetime", async () => {
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const onReveal = vi.fn()
    const { container } = render(<SecretField label="Password" getSecret={getSecret} host={fakeHost()} revealMode="toggle" onReveal={onReveal} />)
    fireEvent.click(revealButton())
    await settle()
    expect(getSecret).toHaveBeenCalledTimes(1)
    expect(valueOf(container)).toHaveTextContent(SECRET)
    expect(screen.getByRole("textbox", { name: spellSecret(SECRET) })).toBeInTheDocument()
    expect(spellSecret(SECRET)).toBe("capital t, r, 4, dash, c, k, 3, t")
    expect(revealButton()).toHaveAttribute("aria-pressed", "true")
    expect(onReveal).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shown("Password", 30))

    await advance(29_000)
    expect(valueOf(container)).toHaveTextContent(SECRET)
    await advance(1_000)
    expect(container.textContent).not.toContain(SECRET)
    expect(screen.getByRole("textbox", { name: "Password, hidden" })).toBeInTheDocument()
    expect(revealButton()).toHaveAttribute("aria-pressed", "false")
  })

  it("reveals a secret whose fetch resolves after the loading render (a bridge call), not only a microtask later", async () => {
    // Regression: the loading branch used to unmount the value span, so `reveal` found a null ref after the await
    // and silently fell back to masked for every host whose `getSecret` takes real time.
    const getSecret = vi.fn(() => new Promise<Uint8Array>((resolve) => setTimeout(() => resolve(bytes()), 30)))
    const { container } = render(<SecretField label="Password" getSecret={getSecret} host={fakeHost()} revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-state", "loading")
    expect(container.querySelector('[data-slot="secret-field-loading"]')).toBeInTheDocument()
    expect(container.querySelector('[data-slot="secret-field-value"]')).toBeInTheDocument()
    await advance(30)
    await settle()
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-state", "revealed")
    expect(valueOf(container)).toHaveTextContent(SECRET)
  })

  it("zeroes the buffer it was handed after the reveal ends", async () => {
    const buf = bytes()
    render(<SecretField label="Password" getSecret={() => Promise.resolve(buf)} host={fakeHost()} revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    fireEvent.click(revealButton())
    expect(Array.from(buf).every((b) => b === 0)).toBe(true)
  })

  it("hold mode (default): pointer down reveals, release masks; Space held reveals, Enter does nothing", async () => {
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    const button = revealButton()
    fireEvent.pointerDown(button, { button: 0 })
    await settle()
    expect(valueOf(container)).toHaveTextContent(SECRET)
    fireEvent.pointerUp(button)
    expect(container.textContent).not.toContain(SECRET)

    fireEvent.keyDown(button, { key: "Enter" })
    await settle()
    expect(container.textContent).not.toContain(SECRET)

    fireEvent.keyDown(button, { key: " " })
    await settle()
    expect(valueOf(container)).toHaveTextContent(SECRET)
    fireEvent.keyUp(button, { key: " " })
    expect(container.textContent).not.toContain(SECRET)
    // A click on its own (what a keyboard Enter or a tap produces) never reveals in hold mode.
    fireEvent.click(button)
    await settle()
    expect(container.textContent).not.toContain(SECRET)
  })

  it("one revealed field per document: revealing B masks A", async () => {
    const { container } = render(
      <>
        <SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="toggle" />
        <SecretField label="PIN" getSecret={() => Promise.resolve(new TextEncoder().encode("0420"))} host={fakeHost()} revealMode="toggle" />
      </>
    )
    fireEvent.click(revealButton("Password"))
    await settle()
    expect(container.textContent).toContain(SECRET)
    fireEvent.click(revealButton("PIN"))
    await settle()
    expect(container.textContent).toContain("0420")
    expect(container.textContent).not.toContain(SECRET)
  })

  it("masks on window blur, on the tab going hidden, and on lock", async () => {
    const { container, rerender } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    expect(container.textContent).toContain(SECRET)
    act(() => {
      window.dispatchEvent(new Event("blur"))
    })
    expect(container.textContent).not.toContain(SECRET)

    fireEvent.click(revealButton())
    await settle()
    expect(container.textContent).toContain(SECRET)
    rerender(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="toggle" locked />)
    expect(container.textContent).not.toContain(SECRET)
  })

  it("formats groups of four for display, but spells the raw value", async () => {
    const { container } = render(
      <SecretField label="Card" getSecret={() => Promise.resolve(new TextEncoder().encode("4242424242424242"))} host={fakeHost()} revealMode="toggle" format="groups-of-4" />
    )
    fireEvent.click(revealButton("Card"))
    await settle()
    expect(valueOf(container)).toHaveTextContent("4242 4242 4242 4242")
    expect(screen.getByRole("textbox", { name: "4, 2, 4, 2, 4, 2, 4, 2, 4, 2, 4, 2, 4, 2, 4, 2" })).toBeInTheDocument()
  })

  it("shows the error state with Retry when the handle fails, and no value", async () => {
    const getSecret = vi.fn<() => Promise<Uint8Array>>(() => Promise.reject(new Error("locked")))
    const { container } = render(<SecretField label="Password" getSecret={getSecret} host={fakeHost()} revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    expect(screen.getByRole("alert")).toHaveTextContent("Couldn't read this field")
    expect(container.textContent).not.toContain(SECRET)
    getSecret.mockImplementation(() => Promise.resolve(bytes()))
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    await settle()
    expect(container.textContent).toContain(SECRET)
  })
})

describe("SecretField copy: through the host, with a countdown and a conditional clear", () => {
  it("hands the bytes to the host, counts down, and clears only when the clipboard still holds our value", async () => {
    const clipboardHolds = vi.fn((_hash: string) => Promise.resolve(true))
    const host = fakeHost({ clipboardHolds })
    const onCopy = vi.fn()
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} onCopy={onCopy} />)
    fireEvent.click(copyButton())
    await untilCalled(host.copy)
    await settle()
    expect(host.copy).toHaveBeenCalledTimes(1)
    const handed = (host.copy as unknown as { mock: { calls: [Uint8Array][] } }).mock.calls[0]![0]
    expect(ArrayBuffer.isView(handed)).toBe(true)
    expect(Array.from(handed).every((b) => b === 0)).toBe(true) // zeroed after the host took it
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.copied(30))

    await advance(29_000)
    expect(host.clear).not.toHaveBeenCalled()
    await advance(1_000)
    await settle()
    expect(clipboardHolds).toHaveBeenCalledTimes(1)
    expect(clipboardHolds.mock.calls[0]![0]).toMatch(/^[0-9a-f]{64}$|^fnv1a-/)
    expect(host.clear).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.cleared)
    await advance(60_000)
    expect(host.clear).toHaveBeenCalledTimes(1)
  })

  it("does not clear when the clipboard holds something else", async () => {
    const host = fakeHost({ clipboardHolds: vi.fn(() => Promise.resolve(false)) })
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} clipboardTimer={10} />)
    fireEvent.click(copyButton())
    await untilCalled(host.copy)
    await settle()
    await advance(10_000)
    await settle()
    expect(host.clipboardHolds).toHaveBeenCalledTimes(1)
    expect(host.clear).not.toHaveBeenCalled()
  })

  it("clears unconditionally where the platform cannot read the clipboard, and says so", async () => {
    const host = fakeHost()
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} clipboardTimer={10} />)
    fireEvent.click(copyButton())
    await untilCalled(host.copy)
    await settle()
    const button = screen.getByRole("button", { name: "Copy Password" })
    expect(button).toBeInTheDocument()
    await advance(10_000)
    await settle()
    expect(host.clear).toHaveBeenCalledTimes(1)
  })

  it("clamps the clipboard timer to 10–90 seconds (no never)", async () => {
    const host = fakeHost()
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} clipboardTimer={600} />)
    fireEvent.click(copyButton())
    await untilCalled(host.copy)
    await settle()
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.copied(90))
  })

  it("Cmd/Ctrl+C on the focused control runs the timed copy; the value is not selectable", async () => {
    const host = fakeHost()
    const onCopy = vi.fn()
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} onCopy={onCopy} />)
    const control = screen.getByRole("textbox", { name: "Password, hidden" })
    control.focus()
    fireEvent.keyDown(control, { key: "c", ctrlKey: true })
    await untilCalled(host.copy)
    await settle()
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(host.copy).toHaveBeenCalledTimes(1)
    expect(getComputedStyle(control).userSelect).toBe("none")
    expect(container.textContent).not.toContain(SECRET)
  })
})

describe("SecretField gate: the field asks, it never decides", () => {
  it("gate=password runs the gate before getSecret and never fetches when it rejects", async () => {
    const calls: string[] = []
    const gate = vi.fn(async () => {
      calls.push("gate")
      return false
    })
    const getSecret = vi.fn(async () => {
      calls.push("secret")
      return bytes()
    })
    const { container, rerender } = render(<SecretField label="Password" getSecret={getSecret} host={fakeHost({ gate })} gate="password" revealMode="toggle" />)
    expect(container.querySelector('[data-slot="secret-field-gate"]')).toBeInTheDocument()
    fireEvent.click(revealButton())
    await settle()
    expect(gate).toHaveBeenCalledWith("password")
    expect(getSecret).not.toHaveBeenCalled()
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.gateReveal)

    gate.mockImplementation(async () => {
      calls.push("gate")
      return true
    })
    rerender(<SecretField label="Password" getSecret={getSecret} host={fakeHost({ gate })} gate="password" revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    expect(calls).toEqual(["gate", "gate", "secret"])
    expect(container.textContent).toContain(SECRET)
  })

  it("inside a CrownJewelSurface, asks the surface for proof: use for copy, reveal for show", async () => {
    const requestProof = vi.fn(() => Promise.resolve(false))
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const hostGate = vi.fn(() => Promise.resolve(true))
    const { container } = render(
      <CrownJewelSurface host="app" title="Seed phrase" requestProof={requestProof}>
        <SecretField label="Password" getSecret={getSecret} host={fakeHost({ gate: hostGate })} />
      </CrownJewelSurface>
    )
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-gate", "crown-jewel")
    fireEvent.click(copyButton())
    await settle()
    expect(requestProof).toHaveBeenCalledWith("use")
    // Gated, so the default hold reveals as a toggle (a hold cannot outlive the gate's dialog).
    fireEvent.click(revealButton())
    await settle()
    expect(requestProof).toHaveBeenCalledWith("reveal")
    expect(hostGate).not.toHaveBeenCalled()
    expect(getSecret).not.toHaveBeenCalled()
  })

  it("inside a CrownJewelSurface, the reveal lifetime is the crown-jewel knob (20 s), unless the prop says otherwise", async () => {
    const requestProof = vi.fn(() => Promise.resolve(true))
    const { container, unmount } = render(
      <CrownJewelSurface host="app" title="Seed phrase" requestProof={requestProof}>
        <SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="toggle" />
      </CrownJewelSurface>
    )
    fireEvent.click(revealButton())
    await settle()
    expect(valueOf(container)).toHaveTextContent(SECRET)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shown("Password", 20))
    await advance(19_000)
    expect(valueOf(container)).toHaveTextContent(SECRET)
    await advance(1_000)
    expect(container.textContent).not.toContain(SECRET)
    unmount()

    const explicit = render(
      <CrownJewelSurface host="app" title="Seed phrase" requestProof={requestProof}>
        <SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="toggle" revealLifetime={5} />
      </CrownJewelSurface>
    )
    fireEvent.click(revealButton())
    await settle()
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shown("Password", 5))
    await advance(5_000)
    expect(explicit.container.textContent).not.toContain(SECRET)
  })
})

describe("SecretField states: reduced motion, high contrast, edit mode", () => {
  it("renders the countdown as text under reduced motion", async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes("reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as typeof window.matchMedia
    try {
      const host = fakeHost()
      const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} clipboardTimer={20} />)
      fireEvent.click(copyButton())
      await untilCalled(host.copy)
      await settle()
      expect(container.querySelector('[data-slot="secret-field-copy-countdown"]')?.tagName).toBe("SPAN")
      expect(container.querySelector('[data-slot="secret-field-copy-countdown"]')).toHaveTextContent("20 s")
    } finally {
      window.matchMedia = original
    }
  })

  it("carries the forced-colors and high-contrast hooks (text placeholder for the dots, tint dropped)", () => {
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(container.querySelector(".forced-colors\\:inline")).toHaveTextContent("Hidden")
    expect(container.querySelector('[data-slot="secret-field-value"]')!.className).not.toContain("revealed-bg")
  })

  it("edit mode: a new-password input with the strength word, and disabled when asked", () => {
    const onChange = vi.fn()
    const { container, rerender } = render(<SecretField mode="edit" label="New password" value="abc" onChange={onChange} strength="weak" />)
    const input = screen.getByLabelText("New password") as HTMLInputElement
    expect(input).toHaveAttribute("type", "password")
    expect(input).toHaveAttribute("autocomplete", "new-password")
    expect(input).toHaveAttribute("spellcheck", "false")
    expect(container.querySelector('[data-slot="secret-field-meter"]')).toHaveTextContent("Weak")
    expect(input.getAttribute("aria-describedby")).toBe(container.querySelector('[data-slot="secret-field-meter"]')!.id)
    fireEvent.change(input, { target: { value: "abcd" } })
    expect(onChange).toHaveBeenCalledWith("abcd")
    fireEvent.click(screen.getByRole("button", { name: "Show New password" }))
    expect(input).toHaveAttribute("type", "text")
    rerender(<SecretField mode="edit" label="New password" value="abc" onChange={onChange} strength="strong" disabled />)
    expect(input).toBeDisabled()
    expect(container.querySelector('[data-slot="secret-field-meter"]')).toHaveTextContent("Strong")
  })
})

describe("SecretField host contract: copy by reference", () => {
  it("with copyRef, never fetches the bytes for a copy, and asks clipboardHolds about the host's hash", async () => {
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const clipboardHolds = vi.fn((_hash: string) => Promise.resolve(true))
    const host = fakeHost({ copyRef: vi.fn(() => Promise.resolve({ hash: "host-record-7" })), clipboardHolds })
    const onCopy = vi.fn()
    render(<SecretField label="Password" getSecret={getSecret} host={host} onCopy={onCopy} clipboardTimer={10} />)
    fireEvent.click(copyButton())
    await settle()
    expect(host.copyRef).toHaveBeenCalledTimes(1)
    expect(getSecret).not.toHaveBeenCalled()
    expect(host.copy).not.toHaveBeenCalled()
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.copied(10))

    await advance(10_000)
    await settle()
    expect(clipboardHolds).toHaveBeenCalledWith("host-record-7")
    expect(host.clear).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.cleared)
  })

  it("a reference host without copy compiles; with no hash back, clipboardHolds is skipped and the clear is unconditional", async () => {
    const clipboardHolds = vi.fn((_hash: string) => Promise.resolve(false))
    const host: SecretFieldReferenceHost = {
      copyRef: vi.fn(() => Promise.resolve()),
      clear: vi.fn(() => Promise.resolve()),
      clipboardHolds,
    }
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    render(<SecretField label="Password" getSecret={getSecret} host={host} clipboardTimer={10} />)
    fireEvent.click(copyButton())
    await settle()
    expect(getSecret).not.toHaveBeenCalled()
    await advance(10_000)
    await settle()
    expect(clipboardHolds).not.toHaveBeenCalled()
    expect(host.clear).toHaveBeenCalledTimes(1)
  })

  it("inside a CrownJewelSurface, copy by reference runs after the use proof and still fetches nothing", async () => {
    const calls: string[] = []
    const requestProof = vi.fn(async (kind: string) => {
      calls.push(`proof:${kind}`)
      return true
    })
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const host = fakeHost({
      copyRef: vi.fn(async () => {
        calls.push("copyRef")
      }),
    })
    render(
      <CrownJewelSurface host="app" title="Seed phrase" requestProof={requestProof}>
        <SecretField label="Password" getSecret={getSecret} host={host} />
      </CrownJewelSurface>
    )
    fireEvent.click(copyButton())
    await settle()
    expect(calls).toEqual(["proof:use", "copyRef"])
    expect(getSecret).not.toHaveBeenCalled()
  })
})

describe("SecretField host contract: the host's error words", () => {
  it("errorText as a string replaces the generic words; Retry still works", async () => {
    const getSecret = vi.fn<() => Promise<Uint8Array>>(() => Promise.reject(new Error("vault locked")))
    const { container } = render(
      <SecretField label="Password" getSecret={getSecret} host={fakeHost()} revealMode="toggle" errorText="The vault locked before this field was read." />
    )
    fireEvent.click(revealButton())
    await settle()
    expect(screen.getByRole("alert")).toHaveTextContent("The vault locked before this field was read.")
    expect(screen.getByRole("alert")).not.toHaveTextContent(secretFieldErrors.read)
    getSecret.mockImplementation(() => Promise.resolve(bytes()))
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    await settle()
    expect(container.textContent).toContain(SECRET)
  })

  it("errorText as a function gets the rejection and the action, and falls back when it returns undefined", async () => {
    const errorText = vi.fn((error: unknown, action: SecretFieldAction) =>
      action === "copy" && error instanceof Error ? `${error.message}.` : undefined
    )
    const host = fakeHost({ copyRef: vi.fn(() => Promise.reject(new Error("The clipboard is in use by another app"))) })
    render(<SecretField label="Password" getSecret={() => Promise.reject(new Error("no"))} host={host} revealMode="toggle" errorText={errorText} />)
    fireEvent.click(copyButton())
    await settle()
    expect(errorText).toHaveBeenLastCalledWith(expect.any(Error), "copy")
    expect(screen.getByRole("alert")).toHaveTextContent("The clipboard is in use by another app.")
  })

  it("errorText as a function returning undefined keeps the default words", async () => {
    render(<SecretField label="Password" getSecret={() => Promise.reject(new Error("no"))} host={fakeHost()} revealMode="toggle" errorText={() => undefined} />)
    fireEvent.click(revealButton())
    await settle()
    expect(screen.getByRole("alert")).toHaveTextContent(secretFieldErrors.read)
  })
})

describe("SecretField host contract: a gated reveal is a toggle", () => {
  it("gate set and hold asked for: the button is a tap, the reveal survives the gate taking focus, and the live region says how it hides", async () => {
    let button!: HTMLElement
    // A gate that takes focus, as a dialog or an OS prompt does: the reveal control blurs while it runs.
    const gate = vi.fn(async () => {
      fireEvent.blur(button)
      return true
    })
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost({ gate })} gate="password" />)
    button = screen.getByRole("button", { name: "Show Password" })
    expect(screen.queryByRole("button", { name: "Hold to show Password" })).toBeNull()
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-reveal-mode", "toggle")
    fireEvent.click(button)
    await settle()
    expect(gate).toHaveBeenCalledWith("password")
    expect(valueOf(container)).toHaveTextContent(SECRET)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shownUntilHidden("Password", 30))
    fireEvent.click(revealButton())
    expect(container.textContent).not.toContain(SECRET)
  })

  it("inside a CrownJewelSurface the hold becomes a tap with the 20 s lifetime, with no revealMode or revealLifetime from the host", async () => {
    const requestProof = vi.fn(() => Promise.resolve(true))
    const { container } = render(
      <CrownJewelSurface host="app" title="Seed phrase" requestProof={requestProof}>
        <SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} revealMode="hold" />
      </CrownJewelSurface>
    )
    fireEvent.click(revealButton())
    await settle()
    expect(requestProof).toHaveBeenCalledWith("reveal")
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shownUntilHidden("Password", 20))
    await advance(20_000)
    expect(container.textContent).not.toContain(SECRET)
  })

  it("an ungated field keeps the hold, and an explicit toggle keeps its own announcement", async () => {
    const { container, unmount } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-reveal-mode", "hold")
    expect(screen.getByRole("button", { name: "Hold to show Password" })).toBeInTheDocument()
    unmount()
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost({ gate: () => Promise.resolve(true) })} gate="password" revealMode="toggle" />)
    fireEvent.click(revealButton())
    await settle()
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shown("Password", 30))
  })
})

describe("SecretField edit mode: several lines, form attributes, strength mapping", () => {
  const KEY = "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA\n-----END OPENSSH PRIVATE KEY-----"

  it("multiline: a masked textarea that keeps line breaks, lifted by Show", () => {
    const onChange = vi.fn()
    const { container } = render(<SecretField mode="edit" multiline label="Private key" value="" onChange={onChange} />)
    const box = screen.getByLabelText("Private key") as HTMLTextAreaElement
    expect(box.tagName).toBe("TEXTAREA")
    expect(box).toHaveAttribute("rows", "4")
    expect(box).toHaveAttribute("data-masked")
    expect(box).toHaveAttribute("autocomplete", "off")
    expect(box).toHaveAttribute("spellcheck", "false")
    expect(box).toHaveAttribute("autocorrect", "off")
    expect(box).toHaveAttribute("autocapitalize", "off")
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-multiline", "true")
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-state", "masked")
    fireEvent.change(box, { target: { value: KEY } })
    expect(onChange).toHaveBeenCalledWith(KEY)
    const show = screen.getByRole("button", { name: "Show Private key" })
    expect(show).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(show)
    expect(box).not.toHaveAttribute("data-masked")
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-state", "revealed")
    expect(screen.getByRole("button", { name: "Hide Private key" })).toHaveAttribute("aria-pressed", "true")
  })

  it("multiline: copy, cut and drag are blocked while masked, and allowed once shown", () => {
    render(<SecretField mode="edit" multiline rows={6} label="Recovery phrase" value="abandon ability able" onChange={() => {}} />)
    const box = screen.getByLabelText("Recovery phrase")
    expect(box).toHaveAttribute("rows", "6")
    expect(fireEvent.copy(box)).toBe(false)
    expect(fireEvent.cut(box)).toBe(false)
    expect(fireEvent.dragStart(box)).toBe(false)
    fireEvent.click(screen.getByRole("button", { name: "Show Recovery phrase" }))
    expect(fireEvent.copy(box)).toBe(true)
  })

  it("name, required and aria-required reach the control, one line or several, and the form check sees them", () => {
    const onBlur = vi.fn()
    const { container, rerender } = render(
      <form>
        <SecretField mode="edit" label="Password" name="password" required value="" onChange={() => {}} onBlur={onBlur} />
      </form>
    )
    const form = container.querySelector("form")!
    const input = screen.getByLabelText("Password") as HTMLInputElement
    expect(input).toHaveAttribute("name", "password")
    expect(input).toBeRequired()
    expect(input).toHaveAttribute("aria-required", "true")
    expect(form.checkValidity()).toBe(false)
    expect(input.validity.valueMissing).toBe(true)
    fireEvent.blur(input)
    expect(onBlur).toHaveBeenCalledTimes(1)

    rerender(
      <form>
        <SecretField mode="edit" multiline label="Password" name="key" required value="" onChange={() => {}} />
      </form>
    )
    const box = screen.getByLabelText("Password") as HTMLTextAreaElement
    expect(box).toHaveAttribute("name", "key")
    expect(box).toBeRequired()
    expect(box).toHaveAttribute("aria-required", "true")
    expect(form.checkValidity()).toBe(false)
    rerender(
      <form>
        <SecretField mode="edit" multiline label="Password" name="key" required value={"line one\nline two"} onChange={() => {}} />
      </form>
    )
    expect(form.checkValidity()).toBe(true)
    expect(new FormData(form).get("key")).toBe("line one\nline two")
  })

  it("without the new props the one-line control is unchanged: no name, not required", () => {
    render(<SecretField mode="edit" label="Password" value="" onChange={() => {}} />)
    const input = screen.getByLabelText("Password")
    expect(input.tagName).toBe("INPUT")
    expect(input).not.toHaveAttribute("name")
    expect(input).not.toBeRequired()
    expect(input).not.toHaveAttribute("aria-required")
  })

  it("secretStrengthFromScore maps a 0–4 guess score to the three words", () => {
    expect([0, 1, 2, 3, 4].map(secretStrengthFromScore)).toEqual(["weak", "weak", "weak", "fair", "strong"])
    expect(secretStrengthFromScore(-1)).toBe("weak")
    expect(secretStrengthFromScore(Number.NaN)).toBe("weak")
    expect(secretStrengthFromScore(5)).toBe("strong")
  })
})

describe("SecretField 1.0: the Field Row look", () => {
  it("draws the actions as words that sit inside their names, and the countdown as visible words", async () => {
    const host = fakeHost()
    const { container } = render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={host} clipboardTimer={20} />)
    const root = container.querySelector('[data-slot="secret-field"]')!
    // The row: the rule on top (it adds no height), a container so it can stack on a phone.
    expect(root.className).toContain("rule-t")
    expect(root.className).toContain("@container/row")
    expect(root).toHaveAttribute("data-size", "auto")
    expect(container.querySelector('[data-slot="secret-field-label"]')).toHaveClass("type-overline", "text-text-label")
    expect(container.querySelector('[data-slot="secret-field-value"]')).toHaveClass("type-code-inline", "text-text-body")
    // The visible word is part of the accessible name (WCAG 2.5.3).
    const reveal = revealButton()
    expect(reveal).toHaveTextContent("Hold to show")
    expect(reveal.getAttribute("aria-label")).toContain("Hold to show")
    expect(reveal).toHaveClass("type-overline")
    const copy = copyButton()
    expect(copy).toHaveTextContent("Copy")
    fireEvent.click(copy)
    await untilCalled(host.copy)
    await settle()
    const status = container.querySelector('[data-slot="secret-field-copy-countdown"]')!
    expect(status).toHaveTextContent("Clears in 20 s")
    expect(status).toHaveClass("text-secondary-live")
    // The old tooltip's words describe the control now: how the clear will run.
    expect(copy).toHaveAccessibleDescription(/clears in 20 s, even if you copy something else/)
  })

  it("a shown value sits on the revealed knob with a hairline, never on the masked value", async () => {
    const { container } = render(<SecretField label="Password" revealMode="toggle" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(valueOf(container).className).not.toContain("revealed-bg")
    fireEvent.click(revealButton())
    await settle()
    expect(valueOf(container).className).toContain("bg-(--c-secret-field-revealed-bg)")
    expect(valueOf(container).className).toContain("rule-box")
    expect(revealButton()).toHaveTextContent("Hide")
  })

  it("size pins the layout: default keeps the label column, stacked puts it over the value", () => {
    const { container, rerender } = render(<SecretField label="Password" size="default" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(container.querySelector('[data-slot="secret-field-label"]')!.className).toContain("w-(--c-security-row-label-width)")
    rerender(<SecretField label="Password" size="stacked" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(container.querySelector('[data-slot="secret-field-label"]')!.className).not.toContain("w-(--c-security-row-label-width)")
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-size", "stacked")
  })
})

describe("SecretField 1.0: fill only", () => {
  it("draws the label and one sentence, no reveal, no copy, and never fetches", () => {
    const { container } = render(<SecretField label="Password" fillOnly />)
    expect(container.querySelector('[data-slot="secret-field"]')).toHaveAttribute("data-fill-only", "")
    expect(screen.getByRole("textbox", { name: /Password.*Fills in the browser only; never shown or copied\./ })).toBeInTheDocument()
    expect(screen.queryByRole("button")).toBeNull()
    // Cmd+C has nothing to copy.
    fireEvent.keyDown(container.querySelector('[data-slot="secret-field-value"]')!, { key: "c", metaKey: true })
    expect(screen.queryByRole("status")).toBeNull()
  })

  it("takes the host's own sentence", () => {
    render(<SecretField label="Wi-Fi password" fillOnly fillOnlyText="Fills on the guest network only." />)
    expect(screen.getByText("Fills on the guest network only.")).toBeInTheDocument()
  })
})

describe("SecretField 1.0: remote buttons (the phone's bottom row)", () => {
  function Remote(props: { revealMode?: "hold" | "toggle"; gate?: "none" | "password"; host?: SecretFieldHost; fillOnly?: boolean; getSecret?: () => Promise<Uint8Array> }) {
    const remote = useSecretFieldRemote()
    return (
      <>
        {props.fillOnly ? (
          <SecretField label="Password" fillOnly remote={remote} />
        ) : (
          <SecretField
            label="Password"
            revealMode={props.revealMode ?? "toggle"}
            gate={props.gate}
            getSecret={props.getSecret ?? (() => Promise.resolve(bytes()))}
            host={props.host ?? fakeHost()}
            remote={remote}
          />
        )}
        <SecretFieldRemoteButton remote={remote} action="reveal" />
        <SecretFieldRemoteButton remote={remote} action="copy" />
      </>
    )
  }
  const remoteReveal = () => document.querySelector('[data-slot="secret-field-remote-reveal"]') as HTMLElement
  const remoteCopy = () => document.querySelector('[data-slot="secret-field-remote-copy"]') as HTMLElement

  it("the eye shows the value in the field's own row, named and pressed as the field's control is", async () => {
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const { container } = render(<Remote getSecret={getSecret} />)
    expect(remoteReveal()).toHaveAttribute("aria-label", "Show Password")
    expect(remoteReveal()).toHaveAttribute("aria-pressed", "false")
    fireEvent.click(remoteReveal())
    await settle()
    expect(getSecret).toHaveBeenCalledTimes(1)
    expect(valueOf(container)).toHaveTextContent(SECRET)
    expect(remoteReveal()).toHaveAttribute("aria-label", "Hide Password")
    expect(remoteReveal()).toHaveAttribute("aria-pressed", "true")
    // Its text never leaves the row: the float button holds a glyph only.
    expect(remoteReveal().textContent).not.toContain(SECRET)
    fireEvent.click(remoteReveal())
    await settle()
    expect(valueOf(container).textContent).toBe("")
  })

  it("held: shows while the pointer is down, masks on release, as the row's own control does", async () => {
    const { container } = render(<Remote revealMode="hold" />)
    expect(remoteReveal()).toHaveAttribute("aria-label", "Hold to show Password")
    fireEvent.pointerDown(remoteReveal(), { button: 0 })
    await settle()
    expect(valueOf(container)).toHaveTextContent(SECRET)
    fireEvent.pointerUp(remoteReveal())
    await settle()
    expect(valueOf(container).textContent).toBe("")
  })

  it("copy runs the field's timed copy, with its gate, and the row shows the countdown", async () => {
    const gate = vi.fn(() => Promise.resolve(true))
    const host = fakeHost({ gate })
    const { container } = render(<Remote gate="password" host={host} />)
    expect(remoteCopy()).toHaveAttribute("aria-label", "Copy Password")
    fireEvent.click(remoteCopy())
    await untilCalled(host.copy)
    await settle()
    expect(gate).toHaveBeenCalledWith("password")
    expect(container.querySelector('[data-slot="secret-field-copy-countdown"]')).toHaveTextContent(/Clears in \d+ s/)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.copied(30))
  })

  it("draws nothing for a fill-only field", () => {
    render(<Remote fillOnly />)
    expect(remoteReveal()).toBeNull()
    expect(remoteCopy()).toBeNull()
  })

  it("draws nothing until a field binds, and stops when it unmounts", () => {
    function Unbound({ show }: { show: boolean }) {
      const remote = useSecretFieldRemote()
      return (
        <>
          {show && <SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} remote={remote} />}
          <SecretFieldRemoteButton remote={remote} action="copy" />
        </>
      )
    }
    const { rerender } = render(<Unbound show={false} />)
    expect(remoteCopy()).toBeNull()
    rerender(<Unbound show />)
    expect(remoteCopy()).not.toBeNull()
    rerender(<Unbound show={false} />)
    expect(remoteCopy()).toBeNull()
  })
})

describe("SecretField 1.0: edit mode in the Text Field box", () => {
  it("the box is raised with a hairline, 2px primary on focus, 2px critical on error", () => {
    const { container, rerender } = render(<SecretField mode="edit" label="Password" value="" onChange={() => {}} />)
    const box = container.querySelector('[data-slot="secret-field-control"]')!
    expect(box).toHaveClass("bg-surface-raised", "rule-box", "focus-within:rule-box-emphasis", "min-h-control")
    rerender(<SecretField mode="edit" label="Password" value="" onChange={() => {}} error="That isn't the master password." />)
    expect(box).toHaveClass("rule-box-emphasis")
    expect(box.className).toContain("[--rule-color:var(--critical-fill)]")
    expect(screen.getByRole("alert")).toHaveTextContent("That isn't the master password.")
    expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true")
  })

  it("stateText stands in for the input: no value, no Show; actions sit on the label's line", () => {
    const options = vi.fn()
    render(
      <SecretField
        mode="edit"
        label="Password"
        value=""
        onChange={() => {}}
        stateText="Made when you save"
        description="20 characters: letters, digits and symbols // Strong"
        actions={[{ label: "Options", onClick: options }, { label: "Type one instead", onClick: () => {} }]}
      />
    )
    expect(screen.getByText("Made when you save")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Show/ })).toBeNull()
    expect(document.querySelector("input")).toBeNull()
    fireEvent.click(screen.getByRole("button", { name: "Options" }))
    expect(options).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("button", { name: "Type one instead" })).toBeInTheDocument()
  })

  it("placeholder, autoComplete and inputRef reach the input", () => {
    const ref = { current: null as HTMLInputElement | null }
    render(
      <SecretField
        mode="edit"
        label="Account password"
        value=""
        onChange={() => {}}
        placeholder="Left empty, it stays as it is."
        autoComplete="current-password"
        inputRef={ref as React.RefObject<HTMLInputElement & HTMLTextAreaElement>}
      />
    )
    const input = screen.getByLabelText("Account password")
    expect(input).toHaveAttribute("placeholder", "Left empty, it stays as it is.")
    expect(input).toHaveAttribute("autocomplete", "current-password")
    expect(ref.current).toBe(input)
  })

  it("the strength rule is three cells and the word; the description joins the meter in aria-describedby", () => {
    const { container } = render(<SecretField mode="edit" label="Password" value="abc" onChange={() => {}} strength="fair" description="Use at least 8 characters." />)
    const meter = container.querySelector('[data-slot="secret-field-meter"]')!
    expect(meter.querySelectorAll('[class*="--c-secret-field-meter-fair"]')).toHaveLength(2)
    const ids = screen.getByLabelText("Password").getAttribute("aria-describedby")!.split(" ")
    expect(ids[0]).toBe(meter.id)
    expect(document.getElementById(ids[1]!)).toHaveTextContent("Use at least 8 characters.")
  })
})

describe("SecretField menu: the trailing ⋯ (contract 5.1c C18, Lockdown LA5)", () => {
  const more = (label = "Password") => screen.getByRole("button", { name: `More actions for ${label}` })
  const openMenu = async (label = "Password") => {
    fireEvent.click(more(label))
    await settle()
    return screen.getByRole("menu", { name: `More actions for ${label}` })
  }
  const item = (name: string | RegExp) => screen.getByRole("menuitem", { name })

  function Field(props: Partial<React.ComponentProps<typeof SecretField>> & { onLarge?: () => void }) {
    const { onLarge, ...rest } = props
    return (
      <SecretField
        label="Password"
        getSecret={() => Promise.resolve(bytes())}
        host={fakeHost()}
        menu={
          <>
            <AdaptiveMenuItem icon="text--scale" onSelect={onLarge}>
              Show large type
            </AdaptiveMenuItem>
            <SecretFieldMenuItem action="reveal" />
            <SecretFieldMenuItem action="copy" />
          </>
        }
        {...(rest as object)}
      />
    )
  }

  it("is a real button after the text actions, always shown, named for the field", () => {
    const { container } = render(<Field />)
    const actions = container.querySelector('[data-slot="secret-field-actions"]') as HTMLElement
    const buttons = Array.from(actions.querySelectorAll("button"))
    expect(buttons.map((b) => b.getAttribute("aria-label"))).toEqual(["Hold to show Password", "Copy Password", "More actions for Password"])
    expect(more().tagName).toBe("BUTTON")
    expect(more()).toHaveAttribute("data-overflow-menu")
  })

  it("its copy row runs the field's own timed copy: the host's copy, the countdown, the conditional clear", async () => {
    const clipboardHolds = vi.fn((_hash: string) => Promise.resolve(true))
    const host = fakeHost({ clipboardHolds })
    const onCopy = vi.fn()
    const { container } = render(<Field host={host} onCopy={onCopy} />)
    await openMenu()
    fireEvent.click(item("Copy"))
    await untilCalled(host.copy)
    await settle()
    expect(host.copy).toHaveBeenCalledTimes(1)
    // The bytes are zeroed after the host took them, as on the row's own Copy.
    const handed = (host.copy as unknown as { mock: { calls: [Uint8Array][] } }).mock.calls[0]![0]
    expect(Array.from(handed).every((b) => b === 0)).toBe(true)
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-slot="secret-field-copy-countdown"]')).toHaveTextContent("Clears in 30 s")
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.copied(30))
    await advance(30_000)
    await settle()
    expect(clipboardHolds).toHaveBeenCalledTimes(1)
    expect(host.clear).toHaveBeenCalledTimes(1)
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.cleared)
  })

  it("its copy row asks the gate first, and copies nothing when the gate says no", async () => {
    const gate = vi.fn(() => Promise.resolve(false))
    const host = fakeHost({ gate })
    render(<Field host={host} gate="password" />)
    await openMenu()
    fireEvent.click(item("Copy"))
    await settle()
    expect(gate).toHaveBeenCalledWith("password")
    expect(host.copy).not.toHaveBeenCalled()
  })

  it("held reveal: the menu has no Show row (Hold to show stays on the row)", async () => {
    render(<Field />)
    const menu = await openMenu()
    expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map((i) => i.textContent)).toEqual(["Show large type", "Copy"])
  })

  it("tap reveal: its Show row runs the field's own reveal, shown in the row, for the lifetime; Hide masks", async () => {
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    const { container } = render(<Field revealMode="toggle" getSecret={getSecret} />)
    await openMenu()
    fireEvent.click(item("Show"))
    await settle()
    expect(getSecret).toHaveBeenCalledTimes(1)
    expect(valueOf(container)).toHaveTextContent(SECRET)
    expect(revealButton()).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("status")).toHaveTextContent(secretFieldAnnouncements.shown("Password", 30))
    await openMenu()
    fireEvent.click(item("Hide"))
    await settle()
    expect(valueOf(container).textContent).toBe("")
    // And the lifetime still runs for a reveal from the menu.
    await openMenu()
    fireEvent.click(item("Show"))
    await settle()
    await advance(30_000)
    expect(valueOf(container).textContent).toBe("")
  })

  it("a gated field reveals by tap, so its Show row runs the gate before it fetches", async () => {
    const calls: string[] = []
    const gate = vi.fn(async () => {
      calls.push("gate")
      return true
    })
    const getSecret = vi.fn(async () => {
      calls.push("secret")
      return bytes()
    })
    render(<Field gate="password" host={fakeHost({ gate })} getSecret={getSecret} />)
    await openMenu()
    fireEvent.click(item("Show"))
    await settle()
    expect(calls).toEqual(["gate", "secret"])
  })

  it("the one-revealed rule holds: a reveal from B's menu masks A", async () => {
    const { container } = render(
      <>
        <Field label="Password" revealMode="toggle" />
        <Field label="PIN" revealMode="toggle" />
      </>
    )
    fireEvent.click(revealButton("Password"))
    await settle()
    const [a, b] = Array.from(container.querySelectorAll('[data-slot="secret-field-revealed"]'))
    expect(a).toHaveTextContent(SECRET)
    await openMenu("PIN")
    fireEvent.click(item("Show"))
    await settle()
    expect(a!.textContent).toBe("")
    expect(b).toHaveTextContent(SECRET)
  })

  it("the app's own rows run as they are; none of them reaches the secret", async () => {
    const onLarge = vi.fn()
    const getSecret = vi.fn(() => Promise.resolve(bytes()))
    render(<Field onLarge={onLarge} getSecret={getSecret} />)
    await openMenu()
    fireEvent.click(item("Show large type"))
    await settle()
    expect(onLarge).toHaveBeenCalledOnce()
    expect(getSecret).not.toHaveBeenCalled()
  })

  it("a locked field keeps the ⋯ but its copy and show rows draw nothing", async () => {
    render(<Field locked revealMode="toggle" />)
    const menu = await openMenu()
    expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map((i) => i.textContent)).toEqual(["Show large type"])
  })

  it("a fill-only field takes a ⋯ too, with no copy or show rows", async () => {
    render(
      <SecretField
        label="Password"
        fillOnly
        menu={
          <>
            <AdaptiveMenuItem>History</AdaptiveMenuItem>
            <SecretFieldMenuItem action="copy" />
            <SecretFieldMenuItem action="reveal" />
          </>
        }
      />
    )
    const menu = await openMenu()
    expect(Array.from(menu.querySelectorAll('[role="menuitem"]')).map((i) => i.textContent)).toEqual(["History"])
  })

  it("a SecretFieldMenuItem outside a field's menu is a mistake, said at once", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {})
    expect(() => render(<SecretFieldMenuItem action="copy" />)).toThrow(/inside a SecretField/)
    quiet.mockRestore()
  })

  it("without a menu the row is as before: no ⋯", () => {
    render(<SecretField label="Password" getSecret={() => Promise.resolve(bytes())} host={fakeHost()} />)
    expect(screen.queryByRole("button", { name: /More actions/ })).toBeNull()
  })
})

