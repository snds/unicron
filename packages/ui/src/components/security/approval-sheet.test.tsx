import { act, fireEvent, render, screen, within } from "@testing-library/react"

import { ApprovalSheet, approvalSheetAnnouncements, type ApprovalSheetProps } from "./approval-sheet"

const context = [
  { label: "What", value: "Sign in to the vault" },
  { label: "Who", value: "Sean's MacBook" },
  { label: "Where", value: "Berlin" },
  { label: "When", value: "just now" },
]

function setup(overrides: Partial<ApprovalSheetProps> = {}) {
  const onApprove = vi.fn()
  const onDeny = vi.fn()
  const onReport = vi.fn()
  const onOpenChange = vi.fn()
  const props: ApprovalSheetProps = {
    kind: "device",
    origin: "pairing",
    context,
    matching: { mode: "enter", digits: 2, expected: "42" },
    onApprove,
    onDeny,
    onReport,
    onOpenChange,
    ...overrides,
  }
  const utils = render(<ApprovalSheet {...props} />)
  return { ...utils, props, onApprove, onDeny, onReport, onOpenChange }
}

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))
const arm = () => advance(500)
const dialog = () => screen.getByRole("dialog")
const cells = () => screen.getAllByRole("textbox", { name: /Digit \d of \d/ }) as HTMLInputElement[]
const approve = () => screen.queryByRole("button", { name: /Approve/ })
const deny = () => document.querySelector('[data-action="deny"]') as HTMLButtonElement
const report = () => screen.getByRole("button", { name: "This wasn't me" })

function enter(digits: string) {
  const inputs = cells()
  Array.from(digits).forEach((d, i) => fireEvent.change(inputs[i]!, { target: { value: d } }))
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"] })
})
afterEach(() => {
  vi.useRealTimers()
})

describe("ApprovalSheet: number matching gates the approve action", () => {
  it("1. Approve is disabled until the digits match; clicking it before then does nothing", async () => {
    const { onApprove } = setup()
    await arm()
    expect(approve()).toBeDisabled()
    fireEvent.click(approve()!)
    expect(onApprove).not.toHaveBeenCalled()
    enter("42")
    expect(approve()).toBeEnabled()
    expect(screen.getByRole("status")).toHaveTextContent(approvalSheetAnnouncements.matched)
    expect(document.activeElement).toBe(approve())
    fireEvent.click(approve()!)
    expect(onApprove).toHaveBeenCalledTimes(1)
  })

  it("2. Within 500 ms of open, clicks on any action are ignored", async () => {
    const { onDeny, onReport, onApprove } = setup()
    enter("42")
    fireEvent.click(approve()!)
    fireEvent.click(deny())
    fireEvent.click(report())
    expect(onApprove).not.toHaveBeenCalled()
    expect(onDeny).not.toHaveBeenCalled()
    expect(onReport).not.toHaveBeenCalled()
    expect(dialog().querySelector('[data-slot="approval-sheet"]')).toHaveAttribute("data-armed", "false")
    await arm()
    expect(dialog().querySelector('[data-slot="approval-sheet"]')).toHaveAttribute("data-armed", "true")
    fireEvent.click(deny())
    expect(onDeny).toHaveBeenCalledWith("user")
  })

  it("3. Two wrong entries call onDeny('retries') and close", async () => {
    const { onDeny, onOpenChange } = setup()
    await arm()
    enter("17")
    expect(cells().map((c) => c.value)).toEqual(["", ""])
    expect(screen.getByRole("alert")).toHaveTextContent("That number does not match. 1 try left.")
    expect(screen.getByRole("status")).toHaveTextContent(approvalSheetAnnouncements.wrong)
    expect(onDeny).not.toHaveBeenCalled()
    enter("99")
    expect(onDeny).toHaveBeenCalledWith("retries")
    expect(onDeny).toHaveBeenCalledTimes(1)
    expect(onOpenChange).not.toHaveBeenCalled()
    await advance(1000)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("4. Past expiresAt, onDeny('timeout') fires, no approve control remains, and Deny becomes Close", async () => {
    const { onDeny, onApprove } = setup({ expiresAt: Date.now() + 15_000 })
    await arm()
    expect(screen.getByRole("timer")).toHaveTextContent("15 s left")
    await advance(5_000)
    expect(screen.getByRole("status")).toHaveTextContent(approvalSheetAnnouncements.urgent)
    await advance(10_000)
    expect(onDeny).toHaveBeenCalledWith("timeout")
    expect(onDeny).toHaveBeenCalledTimes(1)
    expect(approve()).toBeNull()
    expect(screen.getByRole("timer")).toHaveTextContent("Expired")
    expect(deny()).toHaveTextContent("Close")
    expect(screen.getByRole("status")).toHaveTextContent(approvalSheetAnnouncements.expired)
    expect(onApprove).not.toHaveBeenCalled()
  })

  it("5. kind=device-code origin=push renders no approve action in the DOM", async () => {
    const { container, onDeny } = setup({ kind: "device-code", origin: "push" })
    await arm()
    expect(approve()).toBeNull()
    expect(document.querySelector('[data-action="approve"]')).toBeNull()
    expect(container.ownerDocument.body.textContent).toContain(approvalSheetAnnouncements.refused)
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
    fireEvent.click(deny())
    expect(onDeny).toHaveBeenCalledWith("origin")
  })

  it("5b. kind=device-code origin=scan keeps the approve action", async () => {
    setup({ kind: "device-code", origin: "scan" })
    await arm()
    expect(approve()).not.toBeNull()
  })

  it("6. Escape calls onDeny('user'); Enter in the match input never calls onApprove", async () => {
    const { onApprove, onDeny } = setup()
    await arm()
    const [first] = cells()
    fireEvent.keyDown(first!, { key: "Enter" })
    enter("42")
    fireEvent.keyDown(cells()[1]!, { key: "Enter" })
    fireEvent.keyDown(approve()!, { key: "Enter" }) // keydown alone is not a click
    expect(onApprove).not.toHaveBeenCalled()
    fireEvent.keyDown(dialog(), { key: "Escape" })
    expect(onDeny).toHaveBeenCalledWith("user")
  })

  it("7. The dialog's accessible description contains every context value", async () => {
    setup()
    await arm()
    const ids = dialog().getAttribute("aria-describedby")!.split(/\s+/)
    const text = ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" ")
    for (const row of context) expect(text).toContain(row.value)
    expect(text).toContain("Enter the two digits")
    expect(dialog()).toHaveAccessibleName("Approve a new device?")
  })
})

describe("ApprovalSheet: the other states", () => {
  it("choose mode: a wrong pick counts as a try, the right one matches", async () => {
    const { onDeny } = setup({ matching: { mode: "choose", digits: 2, expected: "42", choices: ["17", "42", "88"] } })
    await arm()
    const group = screen.getByRole("group", { name: /Enter the two digits/ })
    fireEvent.click(within(group).getByRole("button", { name: "17" }))
    expect(screen.getByRole("alert")).toHaveTextContent("1 try left")
    fireEvent.click(within(group).getByRole("button", { name: "42" }))
    expect(approve()).toBeEnabled()
    expect(onDeny).not.toHaveBeenCalled()
  })

  it("This wasn't me is a real third action: it reports, then closes", async () => {
    const { onReport, onOpenChange } = setup()
    await arm()
    fireEvent.click(report())
    expect(onReport).toHaveBeenCalledTimes(1)
    await advance(1000)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("busy: Approve spins, cells and Deny are disabled, Report stays enabled", async () => {
    setup({ busy: true })
    await arm()
    enter("42")
    expect(deny()).toBeDisabled()
    expect(report()).toBeEnabled()
    expect(approve()!.querySelector('[data-slot="spinner"]')).toBeInTheDocument()
    expect(approve()).toBeDisabled()
  })

  it("error: a worded notice in destructive ink and Approve disabled", async () => {
    setup({ error: "Too many attempts. Try again in a minute." })
    await arm()
    enter("42")
    expect(screen.getByRole("alert")).toHaveTextContent("Error: Too many attempts.")
    expect(approve()).toBeDisabled()
  })

  it("defaults the tier by kind and shows it as a plain word", async () => {
    setup({ kind: "bridge" })
    await arm()
    expect(within(dialog()).getByText("Use with care")).toBeInTheDocument()
  })

  it("forced colors: the locked Approve carries a strike word", async () => {
    setup()
    await arm()
    expect(approve()!.querySelector(".forced-colors\\:inline")).toHaveTextContent("Locked")
  })

  it("reduced motion: the timer reads in 5-second steps", async () => {
    const original = window.matchMedia
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes("reduced-motion"), media: query, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList) as typeof window.matchMedia
    try {
      setup({ expiresAt: Date.now() + 58_000 })
      await arm()
      expect(screen.getByRole("timer")).toHaveTextContent("60 s left")
      await advance(4_000)
      expect(screen.getByRole("timer")).toHaveTextContent("55 s left")
    } finally {
      window.matchMedia = original
    }
  })
})
