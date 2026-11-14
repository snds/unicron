// The Motion view (?view=motion): one card per contract in @unicron/ui's motionContracts, each
// with a live specimen. The browser checks in tests/motion.spec.ts drive these same cards, by
// data-contract, data-trigger and data-specimen, so what is documented, shown and tested is one
// thing. Specimens are plain boxes on purpose: a recipe is shown on its own, not on a component.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react"
import {
  Button,
  CheckDraw,
  Dialog,
  DialogAction,
  DialogActions,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Kbd,
  motionContracts,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useShake,
  type MotionContractId,
} from "@unicron/ui"

type Mode = "full" | "reduced"

const DURATIONS = ["--motion-press", "--motion-fast", "--motion-base", "--motion-state", "--motion-move"] as const
const CURVES = [
  "--motion-ease",
  "--motion-ease-exit",
  "--motion-ease-move",
  "--motion-ease-emphasis",
  "--motion-spring-settle",
  "--motion-spring-firm",
] as const

/** Sample a CSS easing value (cubic-bezier or linear) into [x, y] points, 0–1 on x. */
function sampleEasing(value: string): [number, number][] {
  const linear = /^linear\((.+)\)$/.exec(value.trim())
  if (linear) {
    const ys = linear[1]!.split(",").map(Number)
    return ys.map((y, i) => [i / (ys.length - 1), y])
  }
  const bezier = /^cubic-bezier\((.+)\)$/.exec(value.trim())
  if (!bezier) return []
  const [x1, y1, x2, y2] = bezier[1]!.split(",").map(Number) as [number, number, number, number]
  const points: [number, number][] = []
  for (let i = 0; i <= 40; i++) {
    const u = i / 40
    const a = 3 * (1 - u) ** 2 * u
    const b = 3 * (1 - u) * u ** 2
    points.push([a * x1 + b * x2 + u ** 3, a * y1 + b * y2 + u ** 3])
  }
  return points
}

/** The roles as the stylesheet resolves them. The stylesheet is loaded before the app renders. */
function useRoles(names: readonly string[]) {
  const [values] = useState<Record<string, string>>(() => {
    const style = getComputedStyle(document.documentElement)
    return Object.fromEntries(names.map((name) => [name, style.getPropertyValue(name).trim()]))
  })
  return values
}

function Curve({ name, value }: { name: string; value: string }) {
  const points = sampleEasing(value)
  // The box leaves headroom above 1 for a curve that overshoots.
  const path = points.map(([x, y], i) => `${i ? "L" : "M"}${(x * 100).toFixed(1)} ${(70 - y * 50).toFixed(1)}`).join(" ")
  return (
    <figure data-curve={name} className="w-32">
      <svg viewBox="0 0 100 80" className="bg-muted text-foreground w-full rounded-md" role="img" aria-label={`${name} curve`}>
        <line x1="0" x2="100" y1="20" y2="20" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="2 3" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <figcaption className="text-muted-foreground mt-1 font-mono text-[11px] break-all">{name}</figcaption>
    </figure>
  )
}

function TokenStrip() {
  const durations = useRoles(DURATIONS)
  const curves = useRoles(CURVES)
  return (
    <section data-slot="motion-tokens" className="mb-8">
      <h3 className="mb-3 text-sm font-medium">Roles</h3>
      <div className="mb-4 flex flex-wrap gap-2">
        {DURATIONS.map((name) => (
          <span key={name} className="text-muted-foreground font-mono text-xs">
            {name} <Kbd>{durations[name] || "…"}</Kbd>
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-4">
        {CURVES.map((name) => (
          <Curve key={name} name={name} value={curves[name] ?? ""} />
        ))}
      </div>
    </section>
  )
}

/**
 * Keeps a specimen mounted while it leaves: `open` false sets data-ending-style, and the box is
 * removed when its transition ends (or at once, where nothing transitions).
 */
function Presence({ open, className, children }: { open: boolean; className: string; children: ReactNode }) {
  const [mounted, setMounted] = useState(open)
  const ref = useRef<HTMLDivElement>(null)
  if (open && !mounted) setMounted(true)
  useEffect(() => {
    if (open || !mounted) return
    const el = ref.current
    if (!el) return
    const running = el.getAnimations().length > 0
    if (!running) {
      setMounted(false)
      return
    }
    const done = () => setMounted(false)
    el.addEventListener("transitionend", done, { once: true })
    return () => el.removeEventListener("transitionend", done)
  }, [open, mounted])
  if (!mounted) return null
  return (
    <div ref={ref} data-specimen className={className} data-ending-style={open ? undefined : ""}>
      {children}
    </div>
  )
}

const SURFACE = "bg-popover text-popover-foreground ring-foreground/10 rounded-lg px-3 py-2 text-sm shadow-md ring-1"

function PressSpecimen() {
  return (
    <div
      data-specimen
      role="button"
      tabIndex={0}
      className="motion-press bg-primary text-primary-foreground inline-flex h-8 cursor-default items-center rounded-lg px-3 text-sm font-medium select-none"
    >
      Press and hold
    </div>
  )
}

function ToggleSpecimen({ className, label, clip = false }: { className: string; label: string; clip?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button data-trigger variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Open"}
      </Button>
      <div className={clip ? "h-12 w-48 overflow-hidden" : "flex h-12 w-48 items-center"}>
        <Presence open={open} className={`${className} ${SURFACE}`}>
          {label}
        </Presence>
      </div>
    </>
  )
}

function CollapseSpecimen() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState(0)
  useLayoutEffect(() => {
    if (ref.current) setHeight(ref.current.scrollHeight)
  }, [])
  return (
    <>
      <Button data-trigger variant="outline" size="sm" onClick={() => setOpen((o) => !o)}>
        {open ? "Close" : "Open"}
      </Button>
      <div className="w-56">
        <div
          ref={ref}
          data-specimen
          className="motion-collapse text-sm"
          style={{ "--collapsible-panel-height": `${height}px` } as CSSProperties}
          data-ending-style={open ? undefined : ""}
          inert={!open}
        >
          <p className="bg-muted rounded-md p-2">Three steps ran. Two passed, and one was skipped because its input had not changed.</p>
        </div>
        <p className="text-muted-foreground mt-1 text-xs">The line below moves with the panel.</p>
      </div>
    </>
  )
}

function StaggerSpecimen() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Button data-trigger variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
      <div key={run} data-specimen className="motion-stagger grid w-48 gap-1">
        {["Inbox", "Starred", "Sent", "Drafts", "Archive", "Spam", "Bin", "All mail"].map((row) => (
          <div key={row} className="bg-muted rounded-md px-2 py-1 text-xs">
            {row}
          </div>
        ))}
      </div>
    </>
  )
}

function DrawSpecimen() {
  const [run, setRun] = useState(0)
  return (
    <>
      <Button data-trigger variant="outline" size="sm" onClick={() => setRun((n) => n + 1)}>
        Replay
      </Button>
      <div data-specimen className="text-success-foreground flex items-center gap-1.5 text-sm">
        <span className="text-2xl leading-none">
          <CheckDraw key={run} />
        </span>
        Copied
      </div>
    </>
  )
}

function ShakeSpecimen() {
  const shake = useShake()
  const [refused, setRefused] = useState(false)
  return (
    <>
      <Button
        data-trigger
        variant="outline"
        size="sm"
        onClick={() => {
          setRefused(true)
          shake.shake()
        }}
      >
        Refuse
      </Button>
      <div className="w-48">
        <div
          data-specimen
          {...shake.props}
          className={`rounded-lg border px-3 py-1.5 font-mono text-sm ${refused ? "border-destructive text-destructive" : "border-input"}`}
        >
          4 8 2 9 1 0
        </div>
        <p role="status" className="text-destructive mt-1 h-4 text-xs">
          {refused ? "That code is not right." : ""}
        </p>
      </div>
    </>
  )
}

const SELECT_ITEMS = { general: "General", code: "Code", deep: "Deep" }

function DialogSpecimen() {
  return (
    <Dialog>
      <DialogTrigger data-trigger render={<Button variant="outline" size="sm" />}>
        Open dialog
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete thread?</DialogTitle>
          <DialogDescription>This cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogActions>
          <DialogClose render={<DialogAction kind="cancel" />}>Cancel</DialogClose>
          <DialogClose render={<DialogAction kind="destructive" />}>Delete</DialogClose>
        </DialogActions>
      </DialogContent>
    </Dialog>
  )
}

function PopoverSpecimen() {
  return (
    <Popover>
      <PopoverTrigger data-trigger render={<Button variant="outline" size="sm" />}>
        Route details
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Route</PopoverTitle>
          <PopoverDescription>Runs locally, and falls back when the desktop is off.</PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  )
}

function TooltipSpecimen() {
  return (
    <Tooltip>
      <TooltipTrigger data-trigger render={<Button variant="outline" size="sm" />}>
        Hover me
      </TooltipTrigger>
      <TooltipContent>Tooltips explain, never hide required info.</TooltipContent>
    </Tooltip>
  )
}

function MenuSpecimen() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger data-trigger render={<Button variant="outline" size="sm" />}>
        Options
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Thread</DropdownMenuLabel>
          <DropdownMenuItem>Archive</DropdownMenuItem>
          <DropdownMenuItem>Snooze</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SelectSpecimen() {
  return (
    <Select items={SELECT_ITEMS} defaultValue="general">
      <SelectTrigger data-trigger aria-label="Model">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="general">General</SelectItem>
        <SelectItem value="code">Code</SelectItem>
        <SelectItem value="deep">Deep</SelectItem>
      </SelectContent>
    </Select>
  )
}

const SPECIMENS: Record<MotionContractId, () => ReactNode> = {
  press: () => <PressSpecimen />,
  pop: () => <ToggleSpecimen className="motion-pop" label="A small surface" />,
  slide: () => <ToggleSpecimen className="motion-slide motion-slide-from-bottom" label="From the bottom edge" clip />,
  collapse: () => <CollapseSpecimen />,
  stagger: () => <StaggerSpecimen />,
  draw: () => <DrawSpecimen />,
  shake: () => <ShakeSpecimen />,
  dialog: () => <DialogSpecimen />,
  popover: () => <PopoverSpecimen />,
  tooltip: () => <TooltipSpecimen />,
  menu: () => <MenuSpecimen />,
  select: () => <SelectSpecimen />,
}

function Fact({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-2">
      <dt className="text-muted-foreground">{term}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function MotionView() {
  const [mode, setMode] = useState<Mode>("full")
  const [slow, setSlow] = useState(false)
  return (
    <div
      data-slot="motion-view"
      data-motion={mode === "reduced" ? "reduced" : undefined}
      data-motion-speed={slow ? "slow" : undefined}
      className="mx-auto max-w-5xl p-6"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h2 className="font-heading mr-auto text-base font-semibold">Motion</h2>
        <Button data-mode="full" variant={mode === "full" ? "default" : "outline"} size="sm" aria-pressed={mode === "full"} onClick={() => setMode("full")}>
          Full
        </Button>
        <Button data-mode="reduced" variant={mode === "reduced" ? "default" : "outline"} size="sm" aria-pressed={mode === "reduced"} onClick={() => setMode("reduced")}>
          Reduced
        </Button>
        <Button data-speed variant={slow ? "default" : "outline"} size="sm" aria-pressed={slow} onClick={() => setSlow((s) => !s)}>
          10× slow
        </Button>
      </div>
      <TokenStrip />
      {(["Recipes", "Components"] as const).map((group) => (
        <section key={group} className="mb-8">
          <h3 className="mb-3 text-sm font-medium">{group}</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {motionContracts
              .filter((contract) => ("surfaces" in contract) === (group === "Components"))
              .map((contract) => (
                <article key={contract.id} data-contract={contract.id} className="rounded-xl border p-4">
                  <header className="mb-3">
                    <h4 className="text-sm font-medium capitalize">{contract.id}</h4>
                    <p className="text-muted-foreground font-mono text-xs">{contract.recipe}</p>
                  </header>
                  <div className="mb-4 flex min-h-24 flex-wrap items-start gap-3">{SPECIMENS[contract.id]()}</div>
                  <dl className="grid gap-1 text-xs">
                    <Fact term="Trigger">{contract.trigger}</Fact>
                    <Fact term="Moves">{contract.properties.join(", ")}</Fact>
                    <Fact term="Runs">
                      up to <code>{contract.duration}</code> on {contract.easing.map((e) => e.replace("--motion-", "")).join(", ")}
                      {"stagger" in contract ? `, ${contract.stagger} apart` : ""}
                    </Fact>
                    <Fact term="Met">{contract.frequency}</Fact>
                    <Fact term="Interrupted">{contract.interrupted}</Fact>
                    <Fact term="Reduced">{contract.reduced}</Fact>
                    {"exception" in contract ? <Fact term="Exception">{contract.exception}</Fact> : null}
                  </dl>
                </article>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
