import { render, screen } from "@testing-library/react"

import { QrCode, encodeQrModules, qrCodeTooLongText, qrPath } from "./qr-code"

const WIFI = "WIFI:T:WPA;S:PineHollow-Guest;P:cedar-lantern-42;;"

describe("QrCode: the encoder", () => {
  it("makes a square grid of 21 + 4k modules with the three finder patterns", () => {
    const rows = encodeQrModules(WIFI)
    const n = rows.length
    expect(n).toBeGreaterThanOrEqual(21)
    expect((n - 21) % 4).toBe(0)
    expect(rows.every((r) => r.length === n)).toBe(true)
    const finder = (r: number, c: number) => rows[r]!.slice(c, c + 7).every(Boolean)
    expect(finder(0, 0)).toBe(true)
    expect(finder(0, n - 7)).toBe(true)
    expect(finder(n - 1, 0)).toBe(true)
  })

  it("encodes UTF-8, so a name with an accent changes the code (it is not cut to Latin-1)", () => {
    expect(encodeQrModules("Zoë")).not.toEqual(encodeQrModules("Zoë".normalize("NFD")))
    expect(() => encodeQrModules("Zoë Ünsal 東京")).not.toThrow()
  })

  it("draws a run of dark modules as one rectangle, offset by the quiet zone", () => {
    expect(qrPath([[true, true, false, true]], 4)).toBe("M4 4h2v1h-2zM7 4h1v1h-1z")
  })
})

describe("QrCode: what it draws", () => {
  it("is one named SVG: a light square and one path, no image, no data: URL, no style attribute", () => {
    const { container } = render(<QrCode value={WIFI} label="QR code to join PineHollow-Guest" />)
    const svg = screen.getByRole("img", { name: "QR code to join PineHollow-Guest" })
    expect(svg.tagName.toLowerCase()).toBe("svg")
    expect(svg).toHaveClass("light")
    expect(svg.querySelectorAll("rect")).toHaveLength(1)
    expect(svg.querySelectorAll("path")).toHaveLength(1)
    expect(container.innerHTML).not.toMatch(/data:|<img|<style|style=/)
    // The default size is the knob; a number size is the width and height attributes instead.
    expect(svg.getAttribute("class")).toContain("size-(--c-qr-code-size)")
    expect(svg).toHaveAttribute("shape-rendering", "crispEdges")
  })

  it("draws a host's own grid as given, with the quiet zone round it", () => {
    render(<QrCode modules={["101", "010", "101"]} label="QR code" size={160} quietZone={4} />)
    const svg = screen.getByRole("img", { name: "QR code" })
    expect(svg).toHaveAttribute("viewBox", "0 0 11 11")
    expect(svg).toHaveAttribute("width", "160")
    expect(svg.getAttribute("class")).not.toContain("size-(--c-qr-code-size)")
    expect(svg.querySelector("path")).toHaveAttribute("d", "M4 4h1v1h-1zM6 4h1v1h-1zM5 5h1v1h-1zM4 6h1v1h-1zM6 6h1v1h-1z")
  })

  it("says so when the value does not fit in a QR code", () => {
    render(<QrCode value={"x".repeat(5000)} label="QR code" />)
    expect(screen.getByRole("img", { name: "QR code" })).toHaveTextContent(qrCodeTooLongText)
  })
})
