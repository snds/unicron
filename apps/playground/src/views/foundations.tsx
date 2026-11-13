// Foundations (?view=foundations): what every component is built from. Color roles, the 23 type
// roles, spacing, radius, strokes, sizes, and the stylesheet's rule, scrim, focus and touch-target
// utilities.
//
// Every reading on this page is measured from the page itself, not typed in: a swatch prints the
// color the browser resolved, a specimen prints its own computed font, a box prints its own size.
// So the page is true in each of the eight theme modes, and a token that did not arrive shows as
// "not set". The focus ring and the touch target only show on a keyboard or a touch screen; the
// browser checks in tests/foundations.spec.ts measure those, and read the same parts as this
// page, by their data attributes.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react"

import { useAddress } from "../address"

// ── measuring ──────────────────────────────────────────────────────────────────────────────────

/** Counts up whenever the theme on <html> changes or a font arrives, so every reading is retaken. */
const Reading = createContext(0)

function useReadingTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const again = () => setTick((n) => n + 1)
    const observer = new MutationObserver(again)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    window.addEventListener("resize", again)
    void document.fonts.ready.then(again)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", again)
    }
  }, [])
  return tick
}

/** Read something off an element after it has drawn, and again when the theme changes. */
function useRead<T>(read: (element: HTMLElement) => T): [RefObject<HTMLDivElement | null>, T | null] {
  const ref = useRef<HTMLDivElement>(null)
  const tick = useContext(Reading)
  const [value, setValue] = useState<T | null>(null)
  // `read` is a new function each render; the tick is what says "read again".
  const latest = useRef(read)
  useLayoutEffect(() => {
    latest.current = read
  })
  useLayoutEffect(() => {
    if (ref.current) setValue(latest.current(ref.current))
  }, [tick])
  return [ref, value]
}

const hex = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase()
const trim = (n: number, places = 2) => String(Number(n.toFixed(places)))

let canvas: CanvasRenderingContext2D | null | undefined

/** A computed color as Figma writes it: #18191D, or #141618 @ 64% when it carries an alpha. */
function colorText(computed: string): string | null {
  let rgb: [number, number, number] | null = null
  let alpha = 1
  const plain = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(computed)
  if (plain) {
    rgb = [Number(plain[1]), Number(plain[2]), Number(plain[3])]
    if (plain[4]) alpha = plain[4].endsWith("%") ? parseFloat(plain[4]) / 100 : Number(plain[4])
  } else {
    // A color-mix() result comes back as oklab() or color(srgb …). Take the alpha from the text,
    // and let a canvas turn the opaque color into sRGB (with an alpha it would round the channels).
    const slash = /\s*\/\s*([\d.]+%?)\s*\)$/.exec(computed)
    if (slash) alpha = slash[1]!.endsWith("%") ? parseFloat(slash[1]!) / 100 : Number(slash[1])
    canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (!canvas) return computed
    canvas.clearRect(0, 0, 1, 1)
    canvas.fillStyle = slash ? computed.replace(slash[0], ")") : computed
    canvas.fillRect(0, 0, 1, 1)
    const [r, g, b] = canvas.getImageData(0, 0, 1, 1).data
    rgb = [r!, g!, b!]
  }
  if (alpha === 0) return null
  const text = `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`
  return alpha < 1 ? `${text} @ ${trim(alpha * 100, 0)}%` : text
}

const px = (value: string) => `${trim(parseFloat(value))} px`
/** Tailwind's rounded-full is an infinite radius; say so instead of printing the number. */
const radius = (value: string) => (parseFloat(value) > 9999 ? "round" : px(value))

// ── layout ─────────────────────────────────────────────────────────────────────────────────────

function Block({ id, overline, title, children }: { id: string; overline: string; title: string; children: ReactNode }) {
  return (
    <section data-foundation={id} className="py-10">
      <header className="mb-6">
        <p className="type-overline">{overline}</p>
        <h2 className="type-title mt-1">{title}</h2>
      </header>
      {children}
    </section>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="type-overline mb-3">{title}</h3>
      {children}
    </div>
  )
}

/** A name over a reading: the two lines under every specimen. */
function Caption({ name, value, note }: { name: string; value?: string | null; note?: string }) {
  return (
    <figcaption className="mt-2 min-w-0">
      <p className="type-meta text-text-body truncate">{name}</p>
      {value === undefined ? null : (
        <p className="type-meta truncate" data-reading>
          {value ?? "not set"}
        </p>
      )}
      {note ? <p className="type-meta">{note}</p> : null}
    </figcaption>
  )
}

const count = (n: number) => String(n).padStart(2, "0")

// ── color ──────────────────────────────────────────────────────────────────────────────────────

// Each swatch is painted by the role's own Tailwind class, written out in full so Tailwind sees
// it. A role the tokens do not expose paints nothing, and reads "not set".
const COLOR_GROUPS: { title: string; roles: [role: string, paint: string][] }[] = [
  {
    title: "Surface",
    roles: [
      ["surface-ground", "bg-surface-ground"],
      ["surface-raised", "bg-surface-raised"],
      ["surface-scrim", "bg-surface-scrim"],
    ],
  },
  {
    title: "Line",
    roles: [
      ["line-rule", "bg-line-rule"],
      ["line-grid-dot", "bg-line-grid-dot"],
    ],
  },
  {
    title: "Text",
    roles: [
      ["text-body", "bg-text-body"],
      ["text-secondary", "bg-text-secondary"],
      ["text-label", "bg-text-label"],
      ["text-faint", "bg-text-faint"],
    ],
  },
  {
    title: "Primary // the app's identity",
    roles: [
      ["primary-fill", "bg-primary-fill"],
      ["primary-on-fill", "bg-primary-on-fill"],
      ["primary-text", "bg-primary-text"],
      ["primary-soft", "bg-primary-soft"],
      ["primary-display", "bg-primary-display"],
    ],
  },
  {
    title: "Secondary // live activity and agents",
    roles: [["secondary-live", "bg-secondary-live"]],
  },
  {
    title: "Needs you // the same in every app",
    roles: [
      ["needs-you-fill", "bg-needs-you-fill"],
      ["needs-you-on-fill", "bg-needs-you-on-fill"],
    ],
  },
  {
    title: "Critical",
    roles: [
      ["critical-fill", "bg-critical-fill"],
      ["critical-on-fill", "bg-critical-on-fill"],
      ["critical-text", "bg-critical-text"],
      ["critical-soft", "bg-critical-soft"],
    ],
  },
  {
    title: "State and diff",
    roles: [
      ["state-hover", "bg-state-hover"],
      ["state-pressed", "bg-state-pressed"],
      ["diff-added", "bg-diff-added"],
      ["diff-removed", "bg-diff-removed"],
    ],
  },
  {
    title: "Status",
    roles: [
      ["success", "bg-success"],
      ["success-foreground", "bg-success-foreground"],
      ["success-surface", "bg-success-surface"],
      ["warning", "bg-warning"],
      ["warning-foreground", "bg-warning-foreground"],
      ["info", "bg-info"],
      ["info-foreground", "bg-info-foreground"],
      ["attention", "bg-attention"],
      ["attention-foreground", "bg-attention-foreground"],
      ["attention-surface", "bg-attention-surface"],
      ["running", "bg-running"],
      ["running-foreground", "bg-running-foreground"],
      ["running-surface", "bg-running-surface"],
      ["protected", "bg-protected"],
      ["protected-foreground", "bg-protected-foreground"],
    ],
  },
  {
    title: "Aliases // the shadcn names, kept",
    roles: [
      ["background", "bg-background"],
      ["foreground", "bg-foreground"],
      ["card", "bg-card"],
      ["card-foreground", "bg-card-foreground"],
      ["popover", "bg-popover"],
      ["popover-foreground", "bg-popover-foreground"],
      ["primary", "bg-primary"],
      ["primary-foreground", "bg-primary-foreground"],
      ["secondary", "bg-secondary"],
      ["secondary-foreground", "bg-secondary-foreground"],
      ["muted", "bg-muted"],
      ["muted-foreground", "bg-muted-foreground"],
      ["muted-foreground-on-fill", "bg-muted-foreground-on-fill"],
      ["support-foreground", "bg-support-foreground"],
      ["faint-foreground", "bg-faint-foreground"],
      ["accent", "bg-accent"],
      ["accent-foreground", "bg-accent-foreground"],
      ["destructive", "bg-destructive"],
      ["border", "bg-border"],
      ["input", "bg-input"],
      ["ring", "bg-ring"],
    ],
  },
  {
    title: "Sidebar",
    roles: [
      ["sidebar", "bg-sidebar"],
      ["sidebar-foreground", "bg-sidebar-foreground"],
      ["sidebar-primary", "bg-sidebar-primary"],
      ["sidebar-primary-foreground", "bg-sidebar-primary-foreground"],
      ["sidebar-accent", "bg-sidebar-accent"],
      ["sidebar-accent-foreground", "bg-sidebar-accent-foreground"],
      ["sidebar-border", "bg-sidebar-border"],
      ["sidebar-ring", "bg-sidebar-ring"],
    ],
  },
]

function Swatch({ role, paint }: { role: string; paint: string }) {
  const [ref, value] = useRead((element) => colorText(getComputedStyle(element).backgroundColor))
  return (
    <figure data-swatch={role} className="min-w-0">
      {/* The hairline draws over the swatch's own fill, so one the color of the ground still has an edge. */}
      <div ref={ref} className={`${paint} rule-box h-14`} />
      <Caption name={role} value={value} />
    </figure>
  )
}

function Colors() {
  const total = COLOR_GROUPS.reduce((sum, group) => sum + group.roles.length, 0)
  return (
    <Block id="color" overline={`Color // ${count(total)} roles`} title="Color">
      {COLOR_GROUPS.map((group) => (
        <Group key={group.title} title={group.title}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {group.roles.map(([role, paint]) => (
              <Swatch key={role} role={role} paint={paint} />
            ))}
          </div>
        </Group>
      ))}
    </Block>
  )
}

// ── type ───────────────────────────────────────────────────────────────────────────────────────

// The text is what the Figma file shows in each role. The app's name and initial follow the theme.
const TYPE_ROLES: { role: string; paint: string; sample: string | ((app: string) => string) }[] = [
  { role: "display", paint: "type-display", sample: "Inbox" },
  { role: "display-compact", paint: "type-display-compact", sample: "Today" },
  { role: "title", paint: "type-title", sample: "Cabin Wi-Fi" },
  { role: "lead", paint: "type-lead", sample: "212 of 218 checks pass." },
  { role: "subtitle", paint: "type-subtitle", sample: "Cabin for the 20th, confirmed" },
  { role: "body", paint: "type-body", sample: "Booked the two-bedroom. Check-in is after 3." },
  { role: "body-strong", paint: "type-body-strong", sample: "Fastmail refused the password." },
  { role: "response", paint: "type-response", sample: "Claude Code changed 6 files." },
  { role: "ui", paint: "type-ui", sample: "Lock after 5 minutes" },
  { role: "ui-emphasis", paint: "type-ui-emphasis", sample: "Mira Chen" },
  { role: "label", paint: "type-label", sample: "Username" },
  { role: "caption", paint: "type-caption", sample: "Also locks when the screen sleeps." },
  { role: "overline", paint: "type-overline", sample: "Inbox // 012 unread" },
  { role: "folio", paint: "type-folio", sample: "012" },
  { role: "meta", paint: "type-meta", sample: "PDF // Pine Hollow booking.pdf // 84 KB" },
  { role: "code-inline", paint: "type-code-inline", sample: "mira.chen@fastmail.com" },
  { role: "code-display", paint: "type-code-display", sample: "R7K2N" },
  { role: "number-hero", paint: "type-number-hero", sample: "94" },
  { role: "number-metric", paint: "type-number-metric", sample: "218" },
  { role: "number-index", paint: "type-number-index", sample: "S" },
  { role: "number-count", paint: "type-number-count", sample: "04" },
  { role: "brand-wordmark", paint: "type-brand-wordmark", sample: (app) => app.toUpperCase() },
  { role: "icon-glyph", paint: "type-icon-glyph", sample: (app) => app.charAt(0).toUpperCase() },
]

/** A specimen's own font, as the browser computed it: "72/68 · 700 · −4% · Geist Variable". */
function fontText(element: HTMLElement) {
  const style = getComputedStyle(element)
  const size = parseFloat(style.fontSize)
  const leading = parseFloat(style.lineHeight)
  const tracking = style.letterSpacing === "normal" ? 0 : parseFloat(style.letterSpacing)
  const percent = Number(((tracking / size) * 100).toFixed(1))
  const family = style.fontFamily.split(",")[0]!.trim().replace(/^["']|["']$/g, "")
  return [
    `${trim(size)}/${Number.isNaN(leading) ? style.lineHeight : trim(leading)}`,
    style.fontWeight,
    `${percent < 0 ? "−" : percent > 0 ? "+" : ""}${Math.abs(percent)}%`,
    family,
    style.textTransform === "uppercase" ? "caps" : null,
    style.fontVariantNumeric.includes("tabular-nums") ? "tabular" : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** Names from before 1.0 that still work, and the role each one now draws. */
const KEPT_NAMES: { name: string; paint: string; role: string; sample: string }[] = [
  { name: "page-title", paint: "type-page-title", role: "title", sample: "Cabin Wi-Fi" },
  { name: "section-title", paint: "type-section-title", role: "subtitle", sample: "Cabin for the 20th, confirmed" },
  { name: "group-title", paint: "type-group-title", role: "label", sample: "Username" },
  { name: "support", paint: "type-support", role: "caption", sample: "Also locks when the screen sleeps." },
]

// The label and the specimen sit side by side from md up, top-aligned: each row is then the taller
// of the label (two 20px lines) and the role's own line box (a multiple of 4), plus 32, so every
// row and every section after the type sits on the 4px grid. Baseline alignment here would make
// each row an odd height and push the rest of the page off the grid.
function Specimen({ role, alias, paint, sample }: { role: string; alias?: string; paint: string; sample: string }) {
  const [ref, value] = useRead(fontText)
  return (
    <div
      data-type-role={alias ? undefined : role}
      data-type-alias={alias}
      className="rule-t grid gap-x-6 gap-y-2 py-4 md:grid-cols-[18rem_minmax(0,1fr)] md:items-start"
    >
      <div className="min-w-0">
        <p className="type-meta text-text-body">{alias ? `type-${alias} → type-${role}` : `type-${role}`}</p>
        <p className="type-meta" data-reading>
          {value ?? "not set"}
        </p>
      </div>
      <div ref={ref} data-specimen className={`${paint} min-w-0 break-words`}>
        {sample}
      </div>
    </div>
  )
}

function Type({ app }: { app: string }) {
  return (
    <Block id="type" overline={`Type // ${count(TYPE_ROLES.length)} roles`} title="Type">
      <p className="type-caption text-text-secondary type-measure mb-6">Size / line height, weight, letter spacing, family.</p>
      {TYPE_ROLES.map(({ role, paint, sample }) => (
        <Specimen key={role} role={role} paint={paint} sample={typeof sample === "string" ? sample : sample(app)} />
      ))}
      <h3 className="type-overline mt-10 mb-3">Kept names // deprecated</h3>
      {KEPT_NAMES.map(({ name, paint, role, sample }) => (
        <Specimen key={name} role={role} alias={name} paint={paint} sample={sample} />
      ))}
    </Block>
  )
}

// ── space, radius, stroke, size ────────────────────────────────────────────────────────────────

const SPACE = [0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56, 64, 96]
/** 2, 6, 10 and 14: for inside a component only. */
const HALF_STEPS = new Set([2, 6, 10, 14])

function Step({ value }: { value: number }) {
  const [ref, width] = useRead((element) => px(getComputedStyle(element).width))
  return (
    <div data-space={value} className="grid grid-cols-[5.5rem_3.5rem_1fr] items-center gap-x-4 py-1">
      <p className="type-meta text-text-body">space/{String(value).padStart(3, "0")}</p>
      <p className="type-meta" data-reading>
        {width ?? "not set"}
      </p>
      <div className="flex items-center gap-3">
        {/* Tailwind's own unit: `p-4`, `gap-4` and the rest are this many times --spacing. */}
        <div ref={ref} className="bg-text-body h-2 shrink-0" style={{ width: `calc(var(--spacing) * ${value / 4})` }} />
        <p className="type-meta">
          {value / 4}
          {HALF_STEPS.has(value) ? " // inside a component only" : ""}
        </p>
      </div>
    </div>
  )
}

function Space() {
  return (
    <Block id="space" overline={`Space // ${count(SPACE.length)} steps`} title="Spacing">
      <p className="type-caption text-text-secondary type-measure mb-4">The step in Figma, its size here, and the number Tailwind takes (p-4, gap-4).</p>
      {SPACE.map((value) => (
        <Step key={value} value={value} />
      ))}
    </Block>
  )
}

function Measured({
  name,
  paint,
  note,
  read,
}: {
  name: string
  paint: string
  note?: string
  read: (style: CSSStyleDeclaration) => string
}) {
  const [ref, value] = useRead((element) => read(getComputedStyle(element)))
  return (
    <figure data-measure={name} className="min-w-0">
      <div className="flex h-16 items-end">
        <div ref={ref} className={paint} />
      </div>
      <Caption name={name} value={value} note={note} />
    </figure>
  )
}

/** The bare class and every step of Tailwind's radius scale draw the control radius, so no class rounds more than another. */
const RADIUS_SCALE: [name: string, paint: string][] = [
  ["rounded", "rounded"],
  ["rounded-sm", "rounded-sm"],
  ["rounded-md", "rounded-md"],
  ["rounded-lg", "rounded-lg"],
  ["rounded-xl", "rounded-xl"],
  ["rounded-2xl", "rounded-2xl"],
  ["rounded-3xl", "rounded-3xl"],
  ["rounded-4xl", "rounded-4xl"],
]

function Shape() {
  return (
    <>
      <Block id="radius" overline="Radius // 03" title="Radius">
        <div className="mb-8 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
          <Measured name="radius/none" paint="bg-surface-raised rule-box size-12 rounded-none" read={(style) => radius(style.borderTopLeftRadius)} />
          <Measured
            name="radius/control"
            paint="bg-surface-raised rule-box size-12 rounded-(--radius)"
            note="every control"
            read={(style) => radius(style.borderTopLeftRadius)}
          />
          <Measured
            name="radius/round"
            paint="bg-surface-raised rule-box size-12 rounded-full"
            note="rounded-full // not a control shape"
            read={(style) => radius(style.borderTopLeftRadius)}
          />
        </div>
        <Group title={`Tailwind's scale // ${count(RADIUS_SCALE.length)} classes, one radius`}>
          <div className="grid grid-cols-4 gap-x-4 gap-y-6 lg:grid-cols-8">
            {RADIUS_SCALE.map(([name, paint]) => (
              <Measured key={name} name={name} paint={`bg-surface-raised rule-box size-12 ${paint}`} read={(style) => radius(style.borderTopLeftRadius)} />
            ))}
          </div>
        </Group>
      </Block>

      <Block id="stroke" overline="Stroke // 02" title="Strokes">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
          <Measured name="stroke-rule" paint="bg-text-body h-(--stroke-rule) w-full" note="rules and borders" read={(style) => px(style.height)} />
          <Measured
            name="stroke-emphasis"
            paint="bg-text-body h-(--stroke-emphasis) w-full"
            note="focus, error, the selected edge"
            read={(style) => px(style.height)}
          />
        </div>
      </Block>

      <Block id="size" overline="Size // 02" title="Sizes">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
          <Measured name="size/control" paint="bg-surface-raised rule-box size-control" note="h-control, size-control" read={(style) => px(style.height)} />
          <Measured
            name="size/touch-min"
            paint="bg-surface-raised rule-box size-touch-min"
            note="the floor for a touch target"
            read={(style) => px(style.height)}
          />
        </div>
      </Block>
    </>
  )
}

// ── rules ──────────────────────────────────────────────────────────────────────────────────────

// The last three take a ring that arrives with a state: shown on (`data-state="on"`), or under the
// pointer. The rule keeps drawing beside the ring (the stylesheet's unlayered rule after the
// utilities).
const RULES: { name: string; paint: string; on?: boolean }[] = [
  { name: "rule-t", paint: "rule-t" },
  { name: "rule-r", paint: "rule-r" },
  { name: "rule-b", paint: "rule-b" },
  { name: "rule-l", paint: "rule-l" },
  { name: "rule-t rule-b", paint: "rule-t rule-b" },
  { name: "rule-box", paint: "rule-box" },
  { name: "rule-box-emphasis", paint: "rule-box-emphasis" },
  { name: "rule-box-emphasis // --rule-color", paint: "rule-box-emphasis [--rule-color:var(--critical-fill)]" },
  { name: "edge-l", paint: "edge-l bg-primary-soft" },
  { name: "rule-b edge-l", paint: "rule-b edge-l bg-primary-soft" },
  { name: "rule-b // + a ring on a state", paint: "rule-b data-[state=on]:ring-1 data-[state=on]:ring-primary-fill", on: true },
  { name: "rule-box // + an invalid edge", paint: "rule-box data-[state=on]:inset-ring-2 data-[state=on]:inset-ring-critical-fill", on: true },
  { name: "edge-l // + a ring under the pointer", paint: "edge-l bg-primary-soft hover:ring-1 hover:ring-primary-fill" },
]

/** A line of text that hugs its height, with and without a rule: the two heights must match. */
function RuleRow({ name, paint, on }: { name: string; paint: string; on?: boolean }) {
  const [ref, height] = useRead((element) => px(getComputedStyle(element).height))
  return (
    <figure data-rule={name} className="min-w-0">
      <div ref={ref} data-state={on ? "on" : undefined} className={`${paint} type-ui px-4 py-3`}>
        Cabin for the 20th, confirmed
      </div>
      <Caption name={name} value={height} />
    </figure>
  )
}

function Rules() {
  return (
    <Block id="rules" overline={`Rules // ${count(RULES.length + 1)} rows`} title="Rules">
      <p className="type-caption text-text-secondary type-measure mb-6">
        A rule is drawn inside the box, so it never adds height. Every row below is as tall as the first, which has none.
      </p>
      <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
        <RuleRow name="no rule" paint="" />
        {RULES.map((rule) => (
          <RuleRow key={rule.name} name={rule.name} paint={rule.paint} on={rule.on} />
        ))}
      </div>
    </Block>
  )
}

// ── scrim, focus, touch ────────────────────────────────────────────────────────────────────────

const SCRIMS: { name: string; paint: string; use: string }[] = [
  { name: "scrim-sheet", paint: "scrim-sheet", use: "behind a phone sheet" },
  { name: "scrim-dialog", paint: "scrim-dialog", use: "behind a desktop dialog" },
  { name: "scrim-menu", paint: "scrim-menu", use: "behind a menu" },
]

function Scrim({ name, paint, use }: { name: string; paint: string; use: string }) {
  const [ref, value] = useRead((element) => colorText(getComputedStyle(element).backgroundColor))
  return (
    <figure data-scrim={name} className="min-w-0">
      <div className="bg-surface-ground rule-box relative">
        <div className="px-4 py-3">
          <p className="type-overline">Inbox // 012 unread</p>
          <p className="type-subtitle">Cabin for the 20th, confirmed</p>
          <p className="type-caption text-text-label">Booked the two-bedroom. Check-in is after 3.</p>
        </div>
        <div ref={ref} className={`${paint} absolute inset-0`} />
      </div>
      <Caption name={name} value={value} note={use} />
    </figure>
  )
}

function Touch() {
  const [ref, height] = useRead((element) => px(getComputedStyle(element).height))
  return (
    <figure>
      <div className="flex h-16 items-center px-4">
        <div ref={ref} role="button" tabIndex={0} data-touch className="hit-area rule-box type-ui flex h-8 items-center px-3">
          All 12
        </div>
      </div>
      <Caption name="hit-area" value={height} note="reaches size/touch-min on a coarse pointer" />
    </figure>
  )
}

function Layers() {
  return (
    <>
      <Block id="scrim" overline={`Scrim // ${count(SCRIMS.length)} layers`} title="Scrims">
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-3">
          {SCRIMS.map((scrim) => (
            <Scrim key={scrim.name} name={scrim.name} paint={scrim.paint} use={scrim.use} />
          ))}
        </div>
      </Block>

      <Block id="focus" overline="Focus // keyboard only" title="Focus and touch">
        <div className="flex flex-wrap items-start gap-x-8 gap-y-6">
          <figure>
            <div className="flex h-16 items-center px-4">
              {/* A bare part, not a system control: this shows the stylesheet's own ring. */}
              <div role="button" tabIndex={0} data-focus="ground" className="rule-box type-ui flex h-10 items-center px-4">
                Compose
              </div>
            </div>
            <Caption name=":focus-visible" note="press Tab" />
          </figure>
          <figure>
            <div data-slot="needs-you" className="bg-needs-you-fill text-needs-you-on-fill flex h-16 items-center px-4">
              <div role="button" tabIndex={0} data-focus="needs-you" className="type-ui flex h-10 items-center px-4">
                Review diff
              </div>
            </div>
            <Caption name="in a needs-you block" note="the ring takes needs-you-on-fill" />
          </figure>
          <Touch />
        </div>
      </Block>
    </>
  )
}

// ── the view ───────────────────────────────────────────────────────────────────────────────────

const APP_NAMES: Record<string, string> = { warpcore: "Warpcore", vale: "Vale", lockdown: "Lockdown", synapse: "Synapse" }

export default function FoundationsView() {
  const tick = useReadingTick()
  const { theme } = useAddress()
  // With no ?theme= the tokens show their default mode, which is Warpcore's.
  const app = APP_NAMES[theme ?? "warpcore"]!
  return (
    <Reading.Provider value={tick}>
      <div data-slot="foundations" className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="pt-10">
          <p className="type-overline">Unicron // {app}</p>
          <h1 className="type-display-compact md:type-display mt-1">Foundations</h1>
        </header>
        <Colors />
        <Type app={app} />
        <Space />
        <Shape />
        <Rules />
        <Layers />
      </div>
    </Reading.Provider>
  )
}
