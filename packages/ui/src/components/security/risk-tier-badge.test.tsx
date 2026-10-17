import { render, screen } from "@testing-library/react"

import { RiskTierBadge, riskTierCopy, riskTierUnverifiedAnnouncement, riskTiers, type RiskTier } from "./risk-tier-badge"

describe("RiskTierBadge: the closed vocabulary", () => {
  it.each(riskTiers)("renders the plain word for %s, never the id, never icon-only", (tier) => {
    const { container } = render(<RiskTierBadge tier={tier} verified />)
    const label = container.querySelector('[data-slot="risk-tier-badge-label"]')!
    expect(label).toBeVisible()
    expect(label).toHaveTextContent(riskTierCopy[tier].label)
    expect(container.textContent).not.toMatch(new RegExp(`\\b${tier}\\b`))
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-tier", tier)
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
  })

  it("shows the plain words from the copy map (Built in / Verified / Use with care)", () => {
    expect(riskTierCopy.standard.label).toBe("Built in")
    expect(riskTierCopy.official.label).toBe("Verified")
    expect(riskTierCopy.tolerated.label).toBe("Use with care")
  })

  it.each(riskTiers)("verified={false} renders the unverified state for %s", (tier) => {
    const { container } = render(<RiskTierBadge tier={tier} verified={false} />)
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-tier", "unverified")
    expect(screen.getByText("Unverified")).toBeVisible()
  })

  it("reads Checking until the host has verified the manifest", () => {
    const { container } = render(<RiskTierBadge tier="official" />)
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-tier", "loading")
    expect(screen.getByText("Checking")).toBeVisible()
  })

  it("renders unverified for an unknown tier at runtime", () => {
    const { container } = render(<RiskTierBadge tier={"closed" as unknown as RiskTier} verified />)
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-tier", "unverified")
    expect(screen.getByText("Unverified")).toBeVisible()
  })

  it("names the explain button with the word and describes it with every disclosure", () => {
    const disclosures = ["Uses an unofficial endpoint.", "May break when the vendor changes its site."]
    render(<RiskTierBadge tier="tolerated" verified explain disclosures={disclosures} />)
    const button = screen.getByRole("button", { name: "What does Use with care mean?" })
    const descId = button.getAttribute("aria-describedby")!
    const description = document.getElementById(descId)!
    expect(description).toHaveTextContent(riskTierCopy.tolerated.meaning)
    for (const d of disclosures) expect(description).toHaveTextContent(d)
  })

  it("announces unverified only when it appears after a check, not on first render", () => {
    const { rerender } = render(<RiskTierBadge tier="official" verified={false} />)
    expect(screen.queryByRole("status")).toBeNull()
    rerender(<RiskTierBadge tier="official" />)
    rerender(<RiskTierBadge tier="official" verified={false} />)
    expect(screen.getByRole("status")).toHaveTextContent(riskTierUnverifiedAnnouncement)
  })

  it("keeps a border and the word under forced colors and high contrast (class hooks)", () => {
    const { container } = render(<RiskTierBadge tier="official" verified size="md" />)
    const pill = container.querySelector('[data-slot="risk-tier-badge-pill"]')!
    expect(pill.className).toContain("forced-colors:border-current")
    expect(pill.className).toContain("contrast-more:bg-transparent")
    expect(pill.className).toContain("h-(--c-risk-tier-height-md)")
    expect(pill.className).toContain("motion-reduce:")
  })
})
