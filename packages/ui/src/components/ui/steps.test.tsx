import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { Badge } from "./badge"
import { Checkbox } from "./checkbox"
import { Step, Steps, StepsFolio, stepStatusWords } from "./steps"

const classesOf = (el: Element) => el.className.split(/\s+/)

describe("Steps (contract 5.1b #32)", () => {
  it("is an ordered list; the current step says aria-current=step", () => {
    render(
      <Steps aria-label="Import steps">
        <Step title="Snapshot and inventory" status="done" />
        <Step title="Deep scan" status="current" />
        <Step title="Review" />
      </Steps>
    )
    const list = screen.getByRole("list", { name: "Import steps" })
    expect(list.tagName).toBe("OL")
    const items = within(list).getAllByRole("listitem")
    expect(items).toHaveLength(3)
    expect(items[1]).toHaveAttribute("aria-current", "step")
    expect(items[0]).not.toHaveAttribute("aria-current")
  })

  it("shows the state word for each status, and the step's own words when given", () => {
    expect(stepStatusWords).toEqual({ done: "Done", current: "Now", upcoming: "Later", failed: "Failed" })
    render(
      <Steps>
        <Step title="Plan the change" status="done" />
        <Step title="Run tests" status="done" statusLabel="128 / 128 pass" />
        <Step title="Merge" statusLabel={null} />
      </Steps>
    )
    const items = screen.getAllByRole("listitem")
    expect(within(items[0]).getByText("Done")).toHaveAttribute("data-slot", "step-status")
    expect(within(items[1]).getByText("128 / 128 pass")).toBeInTheDocument()
    expect(items[2].querySelector('[data-slot="step-status"]')).toBeNull()
  })

  it("inks the state: done and later in label ink, now in body ink, failed critical, live in the live ink", () => {
    render(
      <Steps>
        <Step title="Scan lockfiles" status="done" />
        <Step title="Resolve 31 updates" status="failed" />
        <Step title="Deep scan" status="current" />
        <Step title="Deep scan" status="current" live statusLabel="Reading" />
        <Step title="Review" />
      </Steps>
    )
    const word = (text: string) => classesOf(screen.getByText(text))
    expect(word("Done")).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground"]))
    expect(word("Failed")).toContain("text-destructive")
    expect(word("Now")).toContain("text-foreground")
    expect(word("Reading")).toContain("text-secondary-live")
    expect(word("Later")).toContain("text-muted-foreground")
  })

  it("pins the row: the inline List Row rhythm, a 40px number column, subtitle title, a top rule", () => {
    render(
      <Steps>
        <Step title="Plan the change" detail="Claude Code" status="done" />
      </Steps>
    )
    const row = document.querySelector('[data-slot="step-row"]') as HTMLElement
    expect(classesOf(row)).toEqual(expect.arrayContaining(["items-baseline", "flex-wrap", "gap-x-6", "px-4", "py-5", "rule-t"]))
    // On a narrow row the state word (and an action) move under the body together.
    expect(classesOf(document.querySelector('[data-slot="step-trailing"]') as HTMLElement)).toEqual(expect.arrayContaining(["ml-auto", "shrink-0"]))
    const index = document.querySelector('[data-slot="step-index"]') as HTMLElement
    expect(classesOf(index)).toEqual(expect.arrayContaining(["type-folio", "w-10", "before:content-[counter(step,decimal-leading-zero)]"]))
    expect(index).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(screen.getByText("Plan the change"))).toEqual(expect.arrayContaining(["type-subtitle", "text-foreground"]))
    expect(classesOf(screen.getByText("Claude Code"))).toEqual(expect.arrayContaining(["type-overline", "text-muted-foreground"]))
    expect(classesOf(screen.getByRole("list"))).toContain("[counter-reset:step]")
    expect(classesOf(screen.getByRole("listitem"))).toContain("[counter-increment:step]")
  })

  it("a step that opens is a button: named by its words, aria-current on the button, later steps disabled", async () => {
    const go = vi.fn()
    const user = userEvent.setup()
    render(
      <Steps>
        <Step title="Pre-pass" status="done" onClick={() => go(2)} />
        <Step title="Deep scan" status="current" onClick={() => go(3)} />
        <Step title="Review" disabled onClick={() => go(4)} />
      </Steps>
    )
    const [prepass, scan, review] = screen.getAllByRole("button")
    expect(prepass).toHaveAccessibleName("Pre-pass Done")
    expect(scan).toHaveAttribute("aria-current", "step")
    expect(scan.closest("li")).not.toHaveAttribute("aria-current")
    expect(review).toBeDisabled()
    expect(classesOf(scan)).toEqual(expect.arrayContaining(["hover:bg-state-hover", "active:bg-state-pressed"]))
    await user.click(prepass)
    await user.tab()
    await user.keyboard("{Enter}")
    expect(go.mock.calls.map(([n]) => n)).toEqual([2, 3])
  })

  it("a step with href is a link", () => {
    render(
      <Steps>
        <Step title="Write and score" href="#write" />
      </Steps>
    )
    expect(screen.getByRole("link", { name: "Write and score Later" })).toHaveAttribute("href", "#write")
  })

  it("a checklist step: a checkbox in the number column, a badge, content, a text action", () => {
    render(
      <Steps>
        <Step
          leading={<Checkbox aria-label="Sign out other devices" />}
          title="Sign out other devices"
          badge={<Badge>Next</Badge>}
          status="current"
          statusLabel={null}
          action={<button type="button">Go to devices</button>}
        >
          Any device you don't know loses access.
        </Step>
      </Steps>
    )
    expect(screen.getByRole("checkbox", { name: "Sign out other devices" })).toBeInTheDocument()
    const index = document.querySelector('[data-slot="step-index"]') as HTMLElement
    expect(index).not.toHaveAttribute("aria-hidden")
    expect(classesOf(index)).not.toContain("before:content-[counter(step,decimal-leading-zero)]")
    expect(screen.getByText("Next")).toHaveAttribute("data-slot", "badge")
    expect(screen.getByText("Any device you don't know loses access.")).toHaveAttribute("data-slot", "step-content")
    expect(screen.getByRole("button", { name: "Go to devices" }).parentElement).toHaveAttribute("data-slot", "step-action")
    expect(screen.getByRole("listitem")).toHaveAttribute("aria-current", "step")
  })
})

describe("StepsFolio", () => {
  it("draws STEP 02 // 07 and the name; reads Step 2 of 7: the name", () => {
    render(<StepsFolio current={2} total={7} title="Apps" />)
    const folio = document.querySelector('[data-slot="steps-folio"]') as HTMLElement
    expect(within(folio).getByText("STEP 02 // 07")).toHaveAttribute("aria-hidden", "true")
    expect(classesOf(within(folio).getByText("STEP 02 // 07"))).toContain("type-folio")
    expect(within(folio).getByText("Step 2 of 7: Apps")).toHaveClass("sr-only")
  })

  it("counts in two digits, three from 100, and takes another word", () => {
    render(<StepsFolio current={3} total={120} label="Pass" />)
    expect(screen.getByText("PASS 03 // 120")).toBeInTheDocument()
    expect(screen.getByText("Pass 3 of 120")).toBeInTheDocument()
  })
})
