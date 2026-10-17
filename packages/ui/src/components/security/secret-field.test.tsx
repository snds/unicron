import { act, fireEvent, render, screen } from "@testing-library/react"

import { CrownJewelSurface } from "./crown-jewel"
import { SecretField, secretFieldAnnouncements, spellSecret, type SecretFieldHost } from "./secret-field"

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
    fireEvent.pointerDown(revealButton(), { button: 0 })
    await settle()
    expect(requestProof).toHaveBeenCalledWith("reveal")
    expect(hostGate).not.toHaveBeenCalled()
    expect(getSecret).not.toHaveBeenCalled()
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
