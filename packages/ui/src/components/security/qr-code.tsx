// Owned component (not generated): a QR code drawn as one SVG path, safe under a strict CSP.
// Spec: docs/specs/security/qr-code.md.
// Promoted from: Seeded in snds/unicron (2026-11 design direction, Lockdown brief L-24 and Vale P2, contract 5.1b row 53; no app PR, no DSA record)
import * as React from "react"
import qrcode from "qrcode-generator"

import { cn } from "../../lib/utils"

/** How much of the code may be damaged and still read: about 7, 15, 25 or 30 percent. */
export type QrErrorCorrection = "L" | "M" | "Q" | "H"

/** A module grid: rows of `0` and `1` (`1` is dark), as Lockdown's core hands them over, or rows of booleans. */
export type QrModules = readonly string[] | readonly (readonly boolean[])[]

export interface QrCodeProps extends Omit<React.ComponentProps<"svg">, "children" | "fill" | "viewBox"> {
  /** What the code holds. Encoded here as UTF-8 bytes. Leave it out when `modules` is given. */
  value?: string
  /**
   * The grid from the host's own encoder (Lockdown's core makes it in Rust, so no JavaScript
   * encoder runs there). When given, `value` and `errorCorrection` are ignored.
   */
  modules?: QrModules
  /** What scanning it does, never the payload: "QR code to join PineHollow-Guest". */
  label: string
  /** Default `M`, as Lockdown's core uses. */
  errorCorrection?: QrErrorCorrection
  /** CSS pixels. Default: the `--c-qr-code-size` knob (240). */
  size?: number
  /** Light modules round the code, in modules. Default 4, as the standard asks. */
  quietZone?: number
}

/** Shown in the code's place when the value does not fit in a QR code (2,331 bytes at level M). */
export const qrCodeTooLongText = "This is too long for a QR code."

/** Encode a value to a module grid (rows of booleans). Throws when it does not fit. */
export function encodeQrModules(value: string, errorCorrection: QrErrorCorrection = "M"): boolean[][] {
  const qr = qrcode(0, errorCorrection)
  // The encoder reads a string one byte per character; hand it the UTF-8 bytes that way, so a
  // name with an accent survives without changing the encoder's global string conversion.
  const utf8 = new TextEncoder().encode(value)
  let binary = ""
  for (const b of utf8) binary += String.fromCharCode(b)
  qr.addData(binary, "Byte")
  qr.make()
  const n = qr.getModuleCount()
  return Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => qr.isDark(r, c)))
}

function toRows(modules: QrModules): boolean[][] {
  return modules.map((row) => (typeof row === "string" ? Array.from(row, (c) => c === "1") : Array.from(row)))
}

/** The dark modules as one path: a run of dark modules in a row is one rectangle. */
export function qrPath(rows: boolean[][], quiet: number): string {
  let d = ""
  rows.forEach((row, y) => {
    let x = 0
    while (x < row.length) {
      if (!row[x]) {
        x += 1
        continue
      }
      let run = 1
      while (x + run < row.length && row[x + run]) run += 1
      d += `M${x + quiet} ${y + quiet}h${run}v1h-${run}z`
      x += run
    }
  })
  return d
}

/**
 * A QR code: one SVG path of the dark modules on a light square, with the quiet zone the standard
 * asks for. It always draws dark on light (the stone ground and its ink, in both themes), because
 * a camera reads that best and it prints as it shows. No image, no `data:` URL, no injected style:
 * the markup is a `viewBox`, a rectangle and a path, and the colours come from the stylesheet.
 */
export function QrCode({ value, modules, label, errorCorrection = "M", size, quietZone = 4, className, ...props }: QrCodeProps) {
  const rows = React.useMemo<boolean[][] | null>(() => {
    if (modules) return toRows(modules)
    if (value === undefined) return []
    try {
      return encodeQrModules(value, errorCorrection)
    } catch {
      return null
    }
  }, [modules, value, errorCorrection])

  if (rows === null) {
    return (
      <span data-slot="qr-code" data-error="" role="img" aria-label={label} className="type-caption text-critical-text">
        {qrCodeTooLongText}
      </span>
    )
  }
  const quiet = Math.max(0, Math.round(quietZone))
  const side = rows.length + quiet * 2
  return (
    <svg
      data-slot="qr-code"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${side} ${side}`}
      shapeRendering="crispEdges"
      width={size}
      height={size}
      // `light`: the stone ground and its ink whatever the page's ground, so the code reads dark on light.
      className={cn("light shrink-0", size === undefined && "size-(--c-qr-code-size)", className)}
      {...props}
    >
      <rect width={side} height={side} className="fill-surface-ground" />
      <path d={qrPath(rows, quiet)} className="fill-text-body" />
    </svg>
  )
}
