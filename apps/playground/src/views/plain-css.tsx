// Plain CSS (?view=plain-css): @unicron/tokens/plain.css, the token sheet for a page with no
// Tailwind, such as Lockdown's in-page extension frames (contract 5.1b #54). Each card below is a
// frame of its own whose only policy is `default-src 'none'; style-src 'self'` and whose only
// stylesheet is plain.css, linked from this origin. The page reads every custom property the
// frame's sheet declares, resolves each colour inside the frame, and compares it with the same
// role resolved from tokens.css (this page's own stylesheet) in the same mode. The chips are
// painted from the frame's values, not from this page's.
//
// The last frame carries the class `system`: it follows the browser's light or dark setting.
import { useEffect, useRef, useState } from "react"

import plainUrl from "@unicron/tokens/plain.css?url"

import { Block, Caption, Page } from "./_foundation"
import { count } from "./_foundation-read"

const APPS = ["warpcore", "vale", "lockdown", "synapse"] as const
type Ground = "light" | "dark" | "system"
type Frame = { app: (typeof APPS)[number]; ground: Ground }

const FRAMES: Frame[] = [
  ...APPS.flatMap((app) => [
    { app, ground: "dark" as const },
    { app, ground: "light" as const },
  ]),
  { app: "lockdown", ground: "system" },
]
const groundName = (ground: Ground) => (ground === "dark" ? "graphite" : ground === "light" ? "stone" : "system")

/** The roles each card paints, from the frame's own values. */
const ROLE_CHIPS = [
  "--surface-ground", "--surface-raised", "--line-rule", "--text-body", "--text-label", "--primary-fill", "--primary-soft",
  "--secondary-live", "--needs-you-fill", "--critical-fill",
]
const SWATCH_CHIPS = Array.from({ length: 12 }, (_, i) => `--swatch-${String(i + 1).padStart(2, "0")}`)

const SENTINEL = "rgb(1, 2, 3)"

/** Every custom property a stylesheet declares, in its rules and in its @media rules. */
function declared(sheet: CSSStyleSheet) {
  const names = new Set<string>()
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) walk((rule as CSSGroupingRule).cssRules)
      const style = (rule as CSSStyleRule).style
      if (style) for (const name of Array.from(style)) if (name.startsWith("--")) names.add(name)
    }
  }
  walk(sheet.cssRules)
  return names
}

/** Resolve each name as a colour under `host`; a name that is not a colour reads as the sentinel. */
function colours(host: HTMLElement, names: Iterable<string>) {
  const doc = host.ownerDocument
  const box = doc.createElement("div")
  box.style.color = SENTINEL
  const probe = doc.createElement("span")
  box.append(probe)
  host.append(box)
  const out = new Map<string, string>()
  for (const name of names) {
    probe.style.color = `var(${name})`
    const value = doc.defaultView!.getComputedStyle(probe).color
    if (value !== SENTINEL) out.set(name, value)
  }
  box.remove()
  return out
}

type Result = { properties: number; colours: number; equal: number; differ: string[]; sheets: number; values: Map<string, string> }

function srcDoc(frame: Frame, href: string) {
  return [
    "<!doctype html>",
    `<html class="${frame.ground}" data-theme="${frame.app}">`,
    "<head>",
    '<meta charset="utf-8">',
    `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self'">`,
    `<link rel="stylesheet" href="${href}">`,
    "</head>",
    "<body></body>",
    "</html>",
  ].join("")
}

function FrameCard({ frame }: { frame: Frame }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const mirror = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [href] = useState(() => new URL(plainUrl, window.location.href).href)
  const prefersDark = typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  // The same mode from this page's tokens.css. A `system` frame is compared with the ground the
  // browser prefers.
  const mirrorGround = frame.ground === "system" ? (prefersDark ? "dark" : "light") : frame.ground

  useEffect(() => {
    const iframe = ref.current
    if (!iframe) return
    const read = () => {
      const doc = iframe.contentDocument
      const host = mirror.current
      if (!doc || !host || !doc.body) return
      const sheets = Array.from(doc.styleSheets)
      const names = new Set<string>()
      for (const sheet of sheets) for (const name of declared(sheet)) names.add(name)
      const inFrame = colours(doc.body, names)
      const onPage = colours(host, inFrame.keys())
      const differ = [...inFrame].filter(([name, value]) => onPage.get(name) !== value).map(([name]) => name)
      setResult({ properties: names.size, colours: inFrame.size, equal: inFrame.size - differ.length, differ, sheets: sheets.length, values: inFrame })
    }
    iframe.addEventListener("load", read)
    if (iframe.contentDocument?.readyState === "complete" && iframe.contentDocument.styleSheets.length) read()
    return () => iframe.removeEventListener("load", read)
  }, [])

  const name = frame.ground === "system" ? `${frame.app} / system (prefers ${prefersDark ? "dark" : "light"})` : `${frame.app} / ${groundName(frame.ground)}`
  const reading = result ? `${result.sheets === 1 ? "loaded" : "NOT loaded"} under style-src 'self' // ${result.properties} properties` : null
  const equal = result
    ? `${result.equal} of ${result.colours} colours equal tokens.css${result.differ.length ? ` // differs: ${result.differ.slice(0, 2).join(", ")}` : ""}`
    : undefined
  return (
    <figure data-plain-frame={name} data-equal={result ? result.equal === result.colours && result.colours > 0 : undefined} className="min-w-0">
      <iframe ref={ref} title={`plain.css in ${name}`} srcDoc={srcDoc(frame, href)} className="absolute size-0 border-0" aria-hidden tabIndex={-1} />
      <div ref={mirror} className={mirrorGround} data-theme={frame.app} hidden />
      <div className="rule-box grid gap-1 p-2">
        {[ROLE_CHIPS, SWATCH_CHIPS].map((chips) => (
          <div key={chips[0]} className={`grid gap-1 ${chips.length === 12 ? "grid-cols-12" : "grid-cols-10"}`}>
            {chips.map((chip) => (
              <span key={chip} data-chip={chip} title={chip} className="h-6" style={{ background: result?.values.get(chip) ?? "transparent" }} />
            ))}
          </div>
        ))}
      </div>
      <Caption name={name} value={reading} note={equal} />
    </figure>
  )
}

export default function PlainCssView() {
  return (
    <Page
      slot="plain-css"
      overline="Foundation // Plain CSS // @unicron/tokens/plain.css"
      title="Plain CSS"
      lead="Every role and knob in every mode, as plain custom properties: no Tailwind, nothing nested, nothing to fetch. Each card is a frame that allows only style-src 'self' and links only this sheet; its colours are read inside the frame and compared with this page's tokens.css."
    >
      <Block id="frames" overline={`Frames // ${count(FRAMES.length)}`} title="One frame per mode">
        <div className="relative grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
          {FRAMES.map((frame) => (
            <FrameCard key={`${frame.app}-${frame.ground}`} frame={frame} />
          ))}
        </div>
      </Block>
      <Block id="use" overline="Use" title="In an extension frame">
        <pre className="type-code-inline bg-surface-raised rule-box overflow-x-auto p-4">{`<html data-theme="lockdown" class="system">
  <link rel="stylesheet" href="plain.css">

.frame { background: var(--surface-raised); color: var(--text-body); }`}</pre>
        <p className="type-caption text-text-secondary type-measure mt-3">
          The class dark or light fixes the ground; system follows the browser. The roles go by their own names, var(--surface-raised); Tailwind's --color-* names are not in this sheet. Fonts load from the page's own origin.
        </p>
      </Block>
    </Page>
  )
}
