# QrCode

_Spec v1.0 · 2026-11-13 · Proposed by Lockdown (undrawn-area brief L-24) and Vale (P2); contract 5.1b row 53 · Status: built in `@unicron/ui` 1.0; this spec describes the build_

## Purpose and the user job

A person lets another device read something from this screen with its camera: a guest joins the Wi-Fi, a new device joins the vault, a friend adds a contact or checks a fingerprint.

## Uniqueness check

No part draws a QR code. Lockdown's desktop drew one in its own layer from the core's module rows; Vale needs one with no core encoder. QrCode owns one drawing that is safe under the strictest policy any product runs (Lockdown's web vault: `img-src 'self'`, `style-src 'self'`) and reads in both themes.

## Anatomy

```
qr-code        svg role="img", aria-label; class "light"; viewBox in modules; shape-rendering crispEdges
├─ rect        the light square (fill-surface-ground, stone's ground in both themes)
└─ path        every dark module, a run in a row as one rectangle (fill-text-body, stone's ink)
```

## Props and variants

| Prop | Values | Notes |
|---|---|---|
| `value` | string | Encoded here, as UTF-8 bytes in byte mode |
| `modules` | rows of `0`/`1` strings, or rows of booleans | The grid from the host's own encoder (Lockdown's core). Wins over `value`; nothing is encoded in the UI |
| `label` | string, required | What scanning it does, never the payload: "QR code to join PineHollow-Guest" |
| `errorCorrection` | `L` · `M` (default) · `Q` · `H` | `M` is what Lockdown's core uses |
| `size` | number | CSS pixels, as the width and height attributes. Default: the `--c-qr-code-size` knob (240) |
| `quietZone` | number, default 4 | Light modules round the code, as the standard asks |

Exports: `QrCode`, `encodeQrModules(value, level)`, `qrPath(rows, quiet)`, `qrCodeTooLongText`, `QrCodeProps`, `QrErrorCorrection`, `QrModules`.

## States

| State | What shows |
|---|---|
| A code | The square |
| Too long (over 2,331 bytes at level M) | "This is too long for a QR code." in critical ink, as the same named image |

## Behavior

- **Always dark on light.** The element carries the `light` ground class, so it draws stone's ground and ink whatever the page's ground: a camera reads that best, and it prints as it shows. Vale's brief asks for this ("the QR code's light square in both themes").
- **Strict-CSP safe.** The markup is a `viewBox`, one `rect` and one `path`; the colours come from the stylesheet's classes. No `<img>`, no `data:` URL, no `<style>`, no `style` attribute, nothing injected at run time.
- **The encoder.** `qrcode-generator` 2.0.4 (Kazuhiko Arase, MIT, no dependencies, no install script), pinned exactly in `@unicron/ui`. The UTF-8 bytes are handed to it one byte per character, so its global string conversion is never changed. A host with its own encoder passes `modules` and never runs it.

## Tokens

Tier 3: `--c-qr-code-size` (15rem). Roles: `surface-ground`, `text-body` (under `.light`).

## Keyboard and screen reader

Not focusable. Named by `label`. The payload is never spoken: the host shows the code to type or copy beside it when there is one (`DigitGroups`, a Field Row).

## Security notes

A QR code is readable by any camera in view. Hosts show it only while it is needed and hide it on blur and lock, as Lockdown's guest card does; the component holds no timer of its own.

## Provenance and release

DSA record: none (first principles, Lockdown L-24, Vale P2). Shipped: `@unicron/ui` 1.0; subpath `@unicron/ui/security/qr-code`. New dependency: `qrcode-generator` 2.0.4.

## Acceptance tests

**Vitest (`qr-code.test.tsx`):** a value makes a square grid of 21 + 4k modules with the three finder patterns; UTF-8 survives; a run of dark modules is one rectangle offset by the quiet zone; the drawing is one named SVG with one rect and one path and no `data:`, `<img>`, `<style>` or `style=`; a host's grid is drawn as given with the quiet zone; a number size sets the attributes and drops the knob; a value too long says so.

**Still needs a browser:** a phone camera reads it on the graphite and stone grounds, on screen and printed; WebKit draws it crisp at 160 and 240.
