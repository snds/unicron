import { useEffect, useState } from "react"
import { SecurityShowcase } from "./security"
import { SecurityApprovalsShowcase } from "./security-approvals"
import { toast } from "sonner"
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  Badge,
  Button,
  ButtonGroup,
  Chip,
  ChipAction,
  ChipRemove,
  ButtonGroupSeparator,
  ButtonGroupText,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Dialog,
  DialogAction,
  DialogActions,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemActions,
  ItemMain,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Kbd,
  KbdGroup,
  Label,
  NativeSelect,
  NativeSelectOption,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  ResizableHandle,
  ResizablePane,
  ResizablePanes,
  AppFrameNav,
  AppFrameNavEnd,
  AppFrameNavItem,
  FoldPanes,
  ScrollArea,
  Separator,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Progress,
  ProgressLabel,
  ProgressValue,
  RunTrace,
  AgentPrompt,
  Spinner,
  StatusOrb,
  statusOrbCopy,
  statusOrbStates,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  AutoCheckSwitch,
  UpdateStatusRow,
  type UpdateState,
  type UpdateStatus,
} from "@unicron/ui"

const SELECT_ITEMS = {
  general: "General",
  code: "Code",
  deep: "A deep model with a long name that wraps past the trigger",
  off: "Not connected",
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

/** A status role as it's drawn: its fill (a dot), its ink on the page, and its ink on its own wash. */
const STATUS_CLASSES = {
  success: { fill: "bg-success", ink: "text-success-foreground", surface: "bg-success-surface", icon: "check_circle" },
  attention: { fill: "bg-attention", ink: "text-attention-foreground", surface: "bg-attention-surface", icon: "front_hand" },
  running: { fill: "bg-running", ink: "text-running-foreground", surface: "bg-running-surface", icon: "progress_activity" },
} as const

function StatusSwatch({ role }: { role: keyof typeof STATUS_CLASSES }) {
  const c = STATUS_CLASSES[role]
  return (
    <div className="flex items-center gap-2">
      <span className={`${c.fill} size-2.5 rounded-full`} />
      <span className={`${c.ink} type-meta flex items-center gap-1`}>
        <Icon name={c.icon} />
        {role}
      </span>
      <span className={`${c.surface} ${c.ink} type-meta rounded-md px-2 py-0.5`}>{role}</span>
    </div>
  )
}

const REASONING = ["Looking at the failing import.", "The path changed in the last commit.", "Trying the new path."].join("\n")

/** A run that plays through its steps, then folds; Replay starts it again. */
function PlaybackDemo() {
  const [t0, setT0] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])
  const plan = [
    { id: "read", label: "Read package.json", ms: 1500 },
    { id: "install", label: "pnpm install", ms: 2500, asks: true },
    { id: "test", label: "Run tests", ms: 3000, fails: true },
    { id: "fix", label: "Fix import", ms: 2000 },
  ]
  let at = t0
  const steps = plan.flatMap((p) => {
    if (now < at) return []
    const startedAt = at
    at += p.ms
    const done = now >= at
    return [{
      id: p.id,
      label: p.label,
      startedAt,
      endedAt: done ? at : undefined,
      // A step that asks waits on you until it's answered.
      state: (done ? (p.fails ? "failed" : "done") : p.asks ? "needs-you" : "running") as "failed" | "done" | "running" | "needs-you",
      detail: p.fails ? <p className="type-support">1 test failed. Full output is in the log.</p> : undefined,
    }]
  })
  const live = now < at
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <RunTrace
        steps={steps}
        marks={steps.some((s) => s.id === "install" && s.endedAt) ? [{ id: "allowed", after: "install", label: "Allowed once", icon: "check" }] : []}
        live={live}
        reasoning={live ? REASONING : undefined}
      />
      <div><Button variant="outline" size="sm" onClick={() => setT0(Date.now())}>
        Replay
      </Button></div>
    </div>
  )
}

/** Three prompts: the newest listens for keys; answering one marks it. */
function PromptDemo() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const answer = (key: string) => (id: string) => setAnswers((a) => ({ ...a, [key]: id }))
  // The reply goes out, spins for a moment, then lands; the permission denies itself in five minutes.
  const [sending, setSending] = useState(false)
  const reply = (id: string) => {
    setAnswers((a) => ({ ...a, ask: id }))
    setSending(true)
    setTimeout(() => setSending(false), 1500)
  }
  const [deadline] = useState(() => Date.now() + 5 * 60_000)
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <AgentPrompt kind="continue" answer={answers.go} onAnswer={answer("go")}>
        Ten steps done. Keep going?
      </AgentPrompt>
      <AgentPrompt
        kind="choice"
        answer={answers.fix}
        onAnswer={answer("fix")}
        options={[
          { id: "patch", label: "Patch the import", detail: "The smallest change that fixes the test" },
          { id: "rewrite", label: "Rewrite the module", detail: "Cleaner, but touches 6 files" },
          { id: "skip", label: "Skip the test" },
        ]}
      >
        How should I fix the failing test?
      </AgentPrompt>
      <AgentPrompt kind="reply" options={[{ id: "deny", label: "Deny" }]} answer={answers.ask} pending={sending} onAnswer={reply}>
        Which branch should the fix go on?
      </AgentPrompt>
      <AgentPrompt
        kind="permission"
        tier="tolerated"
        verified
        options={[{ id: "allow", label: "Allow once" }, { id: "deny", label: "Deny" }]}
        expiresAt={deadline}
        safeAnswer="deny"
        answer={answers.net}
        onAnswer={answer("net")}
      >
        Download packages from registry.npmjs.org
      </AgentPrompt>
    </div>
  )
}

const BUTTON_VARIANTS = ["default", "secondary", "outline", "ghost", "ghost-muted", "destructive", "ghost-destructive", "link"] as const
const BUTTON_SIZES = ["xs", "sm", "default", "lg"] as const
const ICON_SIZES = ["icon-xs", "icon-sm", "icon", "icon-lg"] as const

/** Every Button variant × size, then each variant disabled and invalid (aria-invalid). */
function ButtonMatrix() {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium">Button matrix (variant × size · disabled · aria-invalid)</h3>
      <div className="overflow-x-auto">
        <table className="text-muted-foreground border-separate border-spacing-2 text-xs">
          <thead>
            <tr>
              <th />
              {[...BUTTON_SIZES, ...ICON_SIZES, "disabled", "aria-invalid"].map((h) => (
                <th key={h} className="text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {BUTTON_VARIANTS.map((variant) => (
              <tr key={variant}>
                <th className="text-left font-medium">{variant}</th>
                {BUTTON_SIZES.map((size) => (
                  <td key={size}>
                    <Button variant={variant} size={size}>Button</Button>
                  </td>
                ))}
                {ICON_SIZES.map((size) => (
                  <td key={size}>
                    <Button variant={variant} size={size} aria-label="Add">
                      <Icon name="add" />
                    </Button>
                  </td>
                ))}
                <td>
                  <Button variant={variant} disabled>Disabled</Button>
                </td>
                <td>
                  <Button variant={variant} aria-invalid>Invalid</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

const UPDATE_STATES: UpdateState[] = ["idle", "checking", "up_to_date", "downloading", "ready", "available", "failed"]

/** Settings → About's updates rows in every state the update kit reports. */
function UpdatesDemo() {
  const [status, setStatus] = useState<UpdateStatus>({
    version: "0.1.0-main.20261107093000",
    channel: "main",
    enabled: true,
    off: null,
    auto_check: true,
    state: "idle",
    percent: 42,
    offered: "0.1.0-main.20261108120000",
    error: "The download stopped. Check your connection and try again.",
    link: "https://github.com/snds/releases/releases/tag/lockdown-main",
    link_why: "This copy can't update itself.",
    asked: false,
  })
  return (
    <div className="flex w-full max-w-lg flex-col gap-4">
      <NativeSelect
        aria-label="Update state"
        value={status.state}
        onChange={(e) => setStatus({ ...status, state: e.target.value as UpdateState })}
      >
        {UPDATE_STATES.map((s) => (
          <NativeSelectOption key={s} value={s}>
            {s}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <UpdateStatusRow
        status={status}
        appName="Lockdown"
        onCheck={() => setStatus({ ...status, state: "checking" })}
        onRestart={() => toast("Restarting…")}
        onReload={() => toast("Reloading…")}
        restartNote="Restarting locks Lockdown. Unlock it with your master password as usual."
      />
      <AutoCheckSwitch status={status} onCheckedChange={(on) => setStatus({ ...status, auto_check: on })} />
    </div>
  )
}

export function Showcase() {
  const [checked, setChecked] = useState(true)

  return (
    <div>
      <Section title="Button · Toggle · ToggleGroup · ButtonGroup (Action)">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="link">Link</Button>
        <Button variant="ghost-muted">
          <Icon name="add" data-icon="inline-start" /> Ghost muted
        </Button>
        <Button variant="ghost-destructive">Ghost destructive</Button>
        <Button size="xs" shape="pill" variant="secondary" aria-pressed>
          Pill · on <span className="text-muted-foreground tabular-nums">12</span>
        </Button>
        <Button size="xs" shape="pill" variant="ghost" aria-pressed={false}>
          Pill · off
        </Button>
        <IconButton icon="archive" label="Archive" shortcut="E" />
        <IconButton label="Pin" render={<Toggle size="sm" defaultPressed />}>
          <Icon name="keep" fill />
        </IconButton>
        <div className="w-full max-w-md rounded-xl border p-4">
          <p className="mb-4 text-sm">DialogActions (narrow the window to see the phone row)</p>
          <DialogActions>
            <DialogAction kind="destructive">Delete split</DialogAction>
            <DialogAction kind="cancel">Cancel</DialogAction>
            <DialogAction>Save</DialogAction>
          </DialogActions>
        </div>
        <Icon name="schedule" tone="muted" />
        <Icon name="error" tone="destructive" />
        <Button size="icon" aria-label="Add">
          <Icon name="add" />
        </Button>
        <Button disabled>
          <Spinner data-icon="inline-start" /> Saving
        </Button>
        <Toggle aria-label="Bold">
          <Icon name="format_bold" />
        </Toggle>
        <ToggleGroup defaultValue={["left"]}>
          <ToggleGroupItem value="left" aria-label="Align left">
            <Icon name="format_align_left" />
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align centre">
            <Icon name="format_align_center" />
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            <Icon name="format_align_right" />
          </ToggleGroupItem>
        </ToggleGroup>
        <ButtonGroup>
          <Button variant="outline">Reply</Button>
          <ButtonGroupSeparator />
          <Button variant="outline" size="icon" aria-label="More">
            <Icon name="keyboard_arrow_down" />
          </Button>
          <ButtonGroupText>3</ButtonGroupText>
        </ButtonGroup>
        <p className="text-sm text-muted-foreground">
          Your Google account needs you to{" "}
          <Button variant="link" size="inline" onClick={() => toast("Signing in…")}>
            sign in again
          </Button>{" "}
          before mail syncs.
        </p>
      </Section>

      <ButtonMatrix />

      <Section title="Input · Textarea · Checkbox · Switch · NativeSelect · InputGroup · Field (Form)">
        <div className="w-full max-w-sm">
          <FieldSet>
            <FieldLegend>Account</FieldLegend>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="pg-name">Name</FieldLabel>
                <Input id="pg-name" placeholder="Ada Lovelace" />
                <FieldDescription>Shown on shared items.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="pg-bio">Bio</FieldLabel>
                <Textarea id="pg-bio" placeholder="A short line about you" />
              </Field>
              <Field data-invalid="true">
                <FieldLabel htmlFor="pg-email">Email</FieldLabel>
                <InputGroup>
                  <InputGroupAddon>
                    <Icon name="mail" />
                  </InputGroupAddon>
                  <InputGroupInput id="pg-email" aria-invalid placeholder="you@example.com" />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton size="icon-xs" aria-label="Clear">
                      <Icon name="close" />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FieldError errors={[{ message: "Enter a valid address." }]} />
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="pg-cb" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
                <FieldLabel htmlFor="pg-cb">Send me a weekly digest</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Switch id="pg-sw" defaultChecked />
                <Label htmlFor="pg-sw">Notifications</Label>
              </Field>
              <Field>
                <FieldLabel htmlFor="pg-sel">Time zone</FieldLabel>
                <NativeSelect id="pg-sel" defaultValue="utc">
                  <NativeSelectOption value="utc">UTC</NativeSelectOption>
                  <NativeSelectOption value="cet">Central European</NativeSelectOption>
                  <NativeSelectOption value="est">Eastern</NativeSelectOption>
                </NativeSelect>
              </Field>
            </FieldGroup>
          </FieldSet>
        </div>
      </Section>

      <Section title="Select · Popover">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pg-select">Model</Label>
          <Select items={SELECT_ITEMS} defaultValue="general">
            <SelectTrigger id="pg-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Local</SelectLabel>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="code">Code</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Frontier</SelectLabel>
                <SelectItem value="deep">A deep model with a long name that wraps past the trigger</SelectItem>
                <SelectItem value="off" disabled>
                  Not connected
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pg-select-sm">Small</Label>
          <Select items={SELECT_ITEMS}>
            <SelectTrigger id="pg-select-sm" size="sm">
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="deep">A deep model with a long name that wraps past the trigger</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pg-select-bad">Invalid</Label>
          <Select items={SELECT_ITEMS}>
            <SelectTrigger id="pg-select-bad" aria-invalid>
              <SelectValue placeholder="Choose" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pg-select-off">Disabled</Label>
          <Select items={SELECT_ITEMS} defaultValue="code" disabled>
            <SelectTrigger id="pg-select-off">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="code">Code</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Popover>
          <PopoverTrigger render={<Button variant="outline" />}>Route details</PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Route</PopoverTitle>
              <PopoverDescription>Runs locally, and falls back to a frontier model when the desktop is off.</PopoverDescription>
            </PopoverHeader>
            <PopoverClose render={<Button variant="outline" size="sm" />}>Done</PopoverClose>
          </PopoverContent>
        </Popover>
      </Section>

      <Section title="ResizablePanes (Layout)">
        <div className="h-48 w-full rounded-lg border">
          <ResizablePanes>
            <ResizablePane id="list" defaultSize="30%" minSize="20%">
              <p className="p-3 text-sm">List: at least 20%</p>
            </ResizablePane>
            <ResizableHandle label="Resize the list" />
            <ResizablePane id="detail" minSize="30%">
              <ResizablePanes orientation="vertical">
                <ResizablePane id="detail-top" minSize="20%">
                  <p className="p-3 text-sm">Detail</p>
                </ResizablePane>
                <ResizableHandle label="Resize the log" withGrip />
                <ResizablePane id="detail-log" defaultSize="35%" minSize="20%">
                  <p className="p-3 text-sm">Log, with a grip on its handle</p>
                </ResizablePane>
              </ResizablePanes>
            </ResizablePane>
          </ResizablePanes>
        </div>
      </Section>

      <Section title="AppFrameNav · FoldPanes (Layout)">
        {/* AppFrame itself takes over the page, so it can't sit in a gallery. Narrow or turn this window to see the rail. */}
        <div className="relative flex h-16 w-full items-center justify-center rounded-lg border">
          <AppFrameNav aria-label="Example places">
            <AppFrameNavItem icon="forum" label="Conversation" current />
            <AppFrameNavItem icon="article" label="Canvas" indicator={{ kind: "unread", count: 12 }} />
            <AppFrameNavItem icon="task_alt" label="Tasks" indicator={{ kind: "attention", count: 2 }} />
            <AppFrameNavEnd>
              <p className="type-meta p-1">End</p>
            </AppFrameNavEnd>
          </AppFrameNav>
        </div>
        <div className="flex h-32 w-full rounded-lg border">
          <FoldPanes split="columns">
            <p className="p-3 text-sm">Left of a fold</p>
            <p className="border-l p-3 text-sm">Right of a fold</p>
          </FoldPanes>
        </div>
      </Section>

      <Section title="Tabs · DropdownMenu (Navigation)">
        <Tabs defaultValue="inbox" className="w-full max-w-sm">
          <TabsList>
            <TabsTrigger value="inbox">Inbox</TabsTrigger>
            <TabsTrigger value="starred">Starred</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox" className="text-muted-foreground text-sm">
            Nothing new.
          </TabsContent>
          <TabsContent value="starred" className="text-muted-foreground text-sm">
            Three starred threads.
          </TabsContent>
          <TabsContent value="sent" className="text-muted-foreground text-sm">
            Sent this week: 12.
          </TabsContent>
        </Tabs>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" />}>
            Options <Icon name="keyboard_arrow_down" data-icon="inline-end" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Thread</DropdownMenuLabel>
              <DropdownMenuItem>
                <Icon name="archive" /> Archive <DropdownMenuShortcut>E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Icon name="snooze" /> Snooze
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Mark as read</DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Icon name="delete" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* The list's width apart from its trigger: trigger (default), fit, auto. */}
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" className="w-56 justify-between" />}>
            width="trigger" <Icon name="keyboard_arrow_down" />
          </DropdownMenuTrigger>
          <DropdownMenuContent width="trigger">
            <DropdownMenuItem>Matches the field</DropdownMenuItem>
            <DropdownMenuItem>Every item fits</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>Change</DropdownMenuTrigger>
          <DropdownMenuContent width="fit" align="end">
            <DropdownMenuGroup>
              <DropdownMenuLabel>width="fit"</DropdownMenuLabel>
              <DropdownMenuItem>Follow the system setting</DropdownMenuItem>
              <DropdownMenuItem>Always use the compact layout, even on a large screen with room to spare</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label="More (width auto)" />}>
            <Icon name="more_vert" />
          </DropdownMenuTrigger>
          <DropdownMenuContent width="auto">
            <DropdownMenuGroup>
              <DropdownMenuLabel>width="auto"</DropdownMenuLabel>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Move to another project</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      <Section title="Status roles · Spinner (Feedback)">
        {(["success", "attention", "running"] as const).map((role) => (
          <StatusSwatch key={role} role={role} />
        ))}
        <Spinner />
        <span className="text-running-foreground">
          <Spinner label="Saving" />
        </span>
      </Section>

      <Section title="StatusOrb · Item indicator (Feedback)">
        {(["xs", "sm", "md"] as const).map((size) => (
          <div key={size} className="flex items-center gap-3">
            {statusOrbStates.map((state) => (
              <StatusOrb key={state} state={state} size={size} />
            ))}
          </div>
        ))}
        {/* A run's lifecycle, with the words the tooltip carries. */}
        <ol className="type-meta flex flex-wrap items-center gap-3">
          {(["queued", "working", "paused", "working", "stopped"] as const).map((state, i) => (
            <li key={i} className="flex items-center gap-1">
              <StatusOrb state={state} tooltip={false} />
              {statusOrbCopy[state]}
            </li>
          ))}
        </ol>
        <div className="flex w-full max-w-sm flex-col">
          <Item render={<button type="button" />} indicator={{ kind: "attention", count: 1 }}>
            <ItemMedia>
              <StatusOrb state="needs-you" tooltip={false} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Fix the build</ItemTitle>
            </ItemContent>
          </Item>
          <Item render={<button type="button" />} indicator={{ kind: "unread" }}>
            <ItemMedia>
              <StatusOrb state="done" tooltip={false} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Weekly plan</ItemTitle>
            </ItemContent>
          </Item>
        </div>
      </Section>

      <Section title="Progress (Feedback)">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Progress value={40}>
            <ProgressLabel>Upload</ProgressLabel>
            <ProgressValue />
          </Progress>
          <Progress value={100} aria-label="Done" />
          <Progress variant="segmented" value={3} max={7} aria-label="Plan, 3 of 7" />
          <Progress variant="segmented" value={4} max={4} aria-label="Plan done" />
          <Progress tone="budget" value={76} aria-label="Spend" />
          <Progress tone="budget" value={94} aria-label="Spend" />
          <Progress value={null} aria-label="Loading" />
        </div>
      </Section>

      <Section title="RunTrace · Collapsible (Feedback)">
        <PlaybackDemo />
      </Section>

      <Section title="AgentPrompt (Security)">
        <PromptDemo />
      </Section>

      <Section title="UpdateStatusRow · AutoCheckSwitch (Feedback)">
        <UpdatesDemo />
      </Section>

      <Section title="Spinner · Skeleton · Empty · Toast (Feedback)">
        <Spinner />
        <div className="flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => toast.success("Saved", { description: "Your changes are safe." })}>
          Show toast
        </Button>
        <Empty className="max-w-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Icon name="inbox" />
            </EmptyMedia>
            <EmptyTitle>No messages</EmptyTitle>
            <EmptyDescription>When something arrives it shows up here.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm">Compose</Button>
          </EmptyContent>
        </Empty>
      </Section>

      <Section title="Avatar · Badge · Item · Kbd (Data Display)">
        <Avatar>
          <AvatarImage src="https://avatars.githubusercontent.com/u/0?v=4" alt="" />
          <AvatarFallback>SS</AvatarFallback>
          <AvatarBadge />
        </Avatar>
        <AvatarGroup>
          <Avatar size="sm">
            <AvatarFallback>A</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarFallback>B</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+3</AvatarGroupCount>
        </AvatarGroup>
        <Badge>Default</Badge>
        <Badge variant="secondary">Secondary</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="destructive">Destructive</Badge>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
        <Item variant="outline" className="w-full max-w-sm">
          <ItemMedia variant="icon">
            <Icon name="description" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Quarterly notes.pdf</ItemTitle>
            <ItemDescription>1.2 MB · updated yesterday</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="ghost" size="icon-sm" aria-label="Download">
              <Icon name="download" />
            </Button>
          </ItemActions>
        </Item>
        {/* Rows that are one button each: hover, selected, disabled. */}
        <div className="flex w-full max-w-sm flex-col gap-2">
          {/* A row with a main action and a button of its own: the row opens; Copy copies. */}
          <Item variant="outline">
            <ItemMain onClick={() => toast("Opening Intro call")}>
              <ItemMedia variant="icon">
                <Icon name="event_available" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Intro call</ItemTitle>
                <ItemDescription>30 minutes · the row opens it</ItemDescription>
              </ItemContent>
            </ItemMain>
            <ItemActions>
              <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={() => toast("Link copied")}>
                <Icon name="content_copy" />
              </Button>
            </ItemActions>
          </Item>
          <Item variant="outline" render={<button type="button" onClick={() => toast("Opening signatures")} />}>
            <ItemMedia variant="icon">
              <Icon name="signature" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>Signatures and templates</ItemTitle>
              <ItemDescription>A row that is one button: hover, focus, selected, disabled</ItemDescription>
            </ItemContent>
          </Item>
          <Item variant="muted" render={<button type="button" data-selected="true" />}>
            <ItemContent>
              <ItemTitle>Selected</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant="outline" render={<button type="button" disabled />}>
            <ItemContent>
              <ItemTitle>Disabled</ItemTitle>
              <ItemDescription>Not available here</ItemDescription>
            </ItemContent>
          </Item>
        </div>
        <Chip variant="secondary">
          #trip
          <ChipRemove label="Remove tag trip" onClick={() => toast("Removed")} />
        </Chip>
        <Chip variant="outline">
          <ChipAction onClick={() => toast("Opening the event")}>
            <Icon name="event" />
            <span>Design crit</span>
          </ChipAction>
          <ChipRemove label="Unlink Design crit" />
        </Chip>
        <Chip>
          10 minutes before
          <ChipRemove label="Remove reminder 10 minutes before" />
        </Chip>
        <Chip>Read only</Chip>
      </Section>

      <Section title="Separator · ScrollArea (Layout)">
        <div className="flex h-6 items-center gap-3 text-sm">
          <span>Mail</span>
          <Separator orientation="vertical" />
          <span>Calendar</span>
          <Separator orientation="vertical" />
          <span>Notes</span>
        </div>
        <ScrollArea className="h-24 w-full max-w-sm rounded-lg border p-3 text-sm">
          {Array.from({ length: 12 }, (_, i) => (
            <p key={i} className="py-0.5">
              Row {i + 1}
            </p>
          ))}
        </ScrollArea>
      </Section>

      <Section title="Tooltip · Dialog · Sheet · Command (Overlay)">
        <Tooltip>
          <TooltipTrigger render={<Button variant="outline" size="sm" />}>Hover me</TooltipTrigger>
          <TooltipContent>Tooltips explain, never hide required info.</TooltipContent>
        </Tooltip>
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete thread?</DialogTitle>
              <DialogDescription>This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter showCloseButton>
              <Button variant="destructive">Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* A wider dialog that's taller than the screen scrolls inside itself; its footer stays put. */}
        <Dialog>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>Open a long settings dialog</DialogTrigger>
          <DialogContent size="lg">
            <DialogHeader>
              <DialogTitle>Advanced settings</DialogTitle>
              <DialogDescription>size="lg", and it scrolls when it's taller than the screen.</DialogDescription>
            </DialogHeader>
            {Array.from({ length: 24 }, (_, i) => (
              <p key={i} className="text-muted-foreground">Setting {i + 1}</p>
            ))}
            <DialogFooter sticky showCloseButton>
              <Button>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Each size is a range: short content sits at the min, long content pushes out to the max. */}
        {(["xs", "sm", "md", "lg", "xl", "2xl"] as const).map((size) => (
          <Dialog key={size}>
            <DialogTrigger render={<Button variant="ghost" size="sm" />}>size="{size}"</DialogTrigger>
            <DialogContent size={size}>
              <DialogHeader>
                <DialogTitle>{size === "xs" ? "Enter PIN" : `size="${size}"`}</DialogTitle>
                <DialogDescription>
                  {size === "xs"
                    ? "Four digits."
                    : "Between this size's min and max width. This sentence runs long on purpose, so the dialog widens to its max and then wraps, instead of staying at its narrowest."}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter showCloseButton>
                <Button>OK</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ))}
        {/* Unsaved work: a stray click outside does not close it. Escape and Cancel still do. */}
        <Dialog closeOnOutsideClick={false}>
          <DialogTrigger render={<Button variant="outline" size="sm" />}>Open an editor (no outside close)</DialogTrigger>
          <DialogContent size="md">
            <DialogHeader>
              <DialogTitle>Edit note</DialogTitle>
              <DialogDescription>closeOnOutsideClick=false: clicking the backdrop keeps your draft.</DialogDescription>
            </DialogHeader>
            <Textarea defaultValue="A draft you'd hate to lose." />
            <DialogActions>
              <DialogAction kind="cancel">Cancel</DialogAction>
              <DialogAction>Save</DialogAction>
            </DialogActions>
          </DialogContent>
        </Dialog>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>Open a long sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>The list scrolls; SheetFooter sticky keeps Apply in view.</SheetDescription>
            </SheetHeader>
            {/* The part of the sheet that scrolls; the sticky footer sits at its end. */}
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              {Array.from({ length: 30 }, (_, i) => (
                <p key={i} className="text-muted-foreground px-4 py-1">Filter {i + 1}</p>
              ))}
              <SheetFooter sticky>
                <Button>Apply</Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>Open sheet</SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Details</SheetTitle>
              <SheetDescription>A side panel for secondary content.</SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <Button>Done</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
        <Command className="w-full max-w-sm rounded-xl border">
          <CommandInput placeholder="Type a command…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Go to">
              <CommandItem>
                <Icon name="inbox" /> Inbox <CommandShortcut>G I</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Icon name="calendar_month" /> Calendar <CommandShortcut>G C</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </Section>

      <Section title="Icon (Content)">
        <Icon name="inbox" />
        <Icon name="inbox" fill />
        <Icon name="favorite" fill weight={600} className="text-destructive" />
        <Icon name="settings" className="size-6" label="Settings" />
      </Section>

      <SecurityShowcase />
      <SecurityApprovalsShowcase />
    </div>
  )
}
