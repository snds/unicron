import { useState } from "react"
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
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
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
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Kbd,
  KbdGroup,
  Label,
  NativeSelect,
  NativeSelectOption,
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
  Spinner,
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
} from "@unicron/ui"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
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
      </Section>

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
            <DropdownMenuLabel>Thread</DropdownMenuLabel>
            <DropdownMenuItem>
              <Icon name="archive" /> Archive <DropdownMenuShortcut>E</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icon name="snooze" /> Snooze
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Mark as read</DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Icon name="delete" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
    </div>
  )
}
