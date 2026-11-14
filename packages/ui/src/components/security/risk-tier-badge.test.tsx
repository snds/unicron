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

  // An asking AgentPrompt is the needs-you yellow. The page's inks are near-white on graphite
  // (1.15:1 on the yellow), so there the word, the glyph and the edge take the yellow's own ink.
  it.each(riskTiers)("surface=needs-you draws %s in the ink that sits on the yellow", (tier) => {
    const { container } = render(<RiskTierBadge tier={tier} verified surface="needs-you" />)
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-surface", "needs-you")
    const pill = container.querySelector('[data-slot="risk-tier-badge-pill"]')!
    const classes = pill.className.split(/\s+/)
    expect(classes).toEqual(expect.arrayContaining(["text-needs-you-on-fill", "inset-ring", "inset-ring-needs-you-on-fill"]))
    for (const page of ["text-foreground", "text-text-body", "text-muted-foreground", "inset-ring-warning"]) expect(classes).not.toContain(page)
    // The word still says the tier.
    expect(pill).toHaveTextContent(riskTierCopy[tier].label)
  })

  it("on the yellow the blocked state keeps its own critical tile; on the page nothing changes", () => {
    const { container, rerender } = render(<RiskTierBadge tier="official" verified={false} surface="needs-you" />)
    const pill = () => container.querySelector('[data-slot="risk-tier-badge-pill"]')!
    expect(pill().className).toContain("bg-critical-soft")
    expect(pill().className).not.toContain("text-needs-you-on-fill")
    rerender(<RiskTierBadge tier="tolerated" verified />)
    expect(container.querySelector('[data-slot="risk-tier-badge"]')).toHaveAttribute("data-surface", "page")
    expect(pill().className).not.toContain("needs-you")
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
    // Carbon icons are SVG paths: no icon-font axes to raise, and no glyph fill to animate.
    expect(pill.className).not.toContain("--c-icon-")
    expect(pill.className).not.toContain("svg>text")
  })

  it("stops the loading pulse under reduced motion", () => {
    // No verdict yet (verified is undefined) is the loading state.
    const { container } = render(<RiskTierBadge tier="official" />)
    const pill = container.querySelector('[data-slot="risk-tier-badge-pill"]')!
    expect(pill.className).toContain("animate-pulse")
    expect(pill.className).toContain("motion-reduce:animate-none")
  })
})

describe("RiskTierBadge 1.0: Badge's square mono caps, a tone per state", () => {
  it("built in and verified are quiet, use with care is the warning tone, unverified the critical one", () => {
    const pill = (tier: RiskTier, verified?: boolean) => {
      const { container, unmount } = render(<RiskTierBadge tier={tier} verified={verified} />)
      const cls = container.querySelector('[data-slot="risk-tier-badge-pill"]')!.className
      unmount()
      return cls
    }
    expect(pill("standard", true)).toContain("type-overline")
    expect(pill("standard", true)).toContain("rule-box")
    expect(pill("official", true)).toContain("text-text-body")
    expect(pill("tolerated", true)).toContain("inset-ring-warning")
    expect(pill("standard", false)).toContain("inset-ring-critical-fill")
    expect(pill("standard", true)).not.toMatch(/rounded-full/)
  })
})
