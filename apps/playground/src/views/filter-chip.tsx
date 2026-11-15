// Filter Chip, as Figma draws it (15:503), and the group's round-2 parts (contract 5.1b #25). View: ?view=filter-chip
import { useState, type ReactNode } from "react"
import { Button, FilterChip, FilterChipGroup, Icon, Popover, PopoverContent, PopoverHeader, PopoverTrigger } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex w-full max-w-160 flex-col gap-4">{children}</div>
    </section>
  )
}

export default function FilterChipView() {
  const [tasks, setTasks] = useState("all")
  const [items, setItems] = useState("all")
  const [scopes, setScopes] = useState<string[]>(["mail"])
  const [own, setOwn] = useState(true)

  return (
    <div className="flex flex-col gap-10 p-6">
      <Specimen label="As drawn // default and active: inverted ink, square corners, 24 tall">
        <div className="flex items-center gap-2">
          <FilterChip count={12}>All</FilterChip>
          <FilterChip count={12} active>
            All
          </FilterChip>
        </div>
      </Specimen>

      <Specimen label="Single // a radio group: arrow keys move and choose (Warpcore tasks)">
        <FilterChipGroup label="Show tasks" value={tasks} onValueChange={setTasks}>
          <FilterChip value="all" count={12}>
            All
          </FilterChip>
          <FilterChip value="running" count={3}>
            Running
          </FilterChip>
          <FilterChip value="waiting" count={1}>
            Waiting
          </FilterChip>
          <FilterChip value="done" count={8}>
            Done
          </FilterChip>
        </FilterChipGroup>
      </Specimen>

      <Specimen label="Multiple // toggles, any of them (Vale search scopes)">
        <FilterChipGroup type="multiple" label="Search in" value={scopes} onValueChange={setScopes}>
          <FilterChip value="mail">Mail</FilterChip>
          <FilterChip value="calendar">Calendar</FilterChip>
          <FilterChip value="contacts">Contacts</FilterChip>
          <FilterChip value="notes">Notes</FilterChip>
        </FilterChipGroup>
      </Specimen>

      <Specimen label="Scroll // one line, cut at the column's edge with no fade (Lockdown items, 320 wide)">
        <div className="w-80">
          <FilterChipGroup scroll label="Show" value={items} onValueChange={setItems}>
            <FilterChip value="all" count={items === "all" ? 248 : undefined}>
              All
            </FilterChip>
            <FilterChip value="favorites">Favorites</FilterChip>
            <FilterChip value="logins">Logins</FilterChip>
            <FilterChip value="passkeys">Passkeys</FilterChip>
            <FilterChip value="cards">Cards</FilterChip>
            <FilterChip value="notes">Notes</FilterChip>
            <FilterChip value="more">More</FilterChip>
          </FilterChipGroup>
        </div>
      </Specimen>

      <Specimen label="Trailing action // after the chips, outside the scroll (Synapse checks)">
        <FilterChipGroup
          label="Show checks"
          defaultValue="failing"
          action={
            <Button variant="ghost" size="icon-sm" aria-label="Severity">
              <Icon name="filter" />
            </Button>
          }
        >
          <FilterChip value="failing" count={6}>
            Failing
          </FilterChip>
          <FilterChip value="upkeep" count={3}>
            Upkeep
          </FilterChip>
          <FilterChip value="migration" count={1} disabled>
            Migration
          </FilterChip>
        </FilterChipGroup>
      </Specimen>

      <Specimen label="On its own // a toggle (aria-pressed)">
        <div>
          <FilterChip active={own} onActiveChange={setOwn}>
            Unread
          </FilterChip>
        </div>
      </Specimen>

      <Specimen label="Kinds // trigger (chevron, aria-haspopup) and button: a chat's chips above the composer; neither is ever on (Warpcore NA2, U-08)">
        <div className="flex flex-wrap items-center gap-2">
          <Popover>
            <PopoverTrigger render={<FilterChip kind="trigger">Auto // Coding</FilterChip>} />
            <PopoverContent>
              <PopoverHeader title="Who answers" />
              <p className="type-caption">Coding for code, files or errors. General otherwise.</p>
            </PopoverContent>
          </Popover>
          <FilterChip kind="button">snds/lockdown // main</FilterChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip kind="trigger">General</FilterChip>
          <FilterChip kind="trigger" disabled>
            No models
          </FilterChip>
          <FilterChip kind="button">Envs</FilterChip>
        </div>
      </Specimen>
    </div>
  )
}
