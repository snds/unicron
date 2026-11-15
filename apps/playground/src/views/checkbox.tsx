// Checkbox, as Vale's Notes frames draw a checklist: square, with done items struck through. View: ?view=checkbox
import { useState, type ReactNode } from "react"
import { Checkbox, Label } from "@unicron/ui"

function Specimen({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="type-overline">{label}</h3>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

const PACKING = ["Sleeping bags", "Headlamps", "Board games (Theo)", "Groceries for night one", "Firewood starter", "Snow chains (not needed)"]

export default function CheckboxView() {
  const [done, setDone] = useState<readonly string[]>(["Sleeping bags", "Headlamps", "Snow chains (not needed)"])
  const toggle = (item: string, on: boolean) => setDone((list) => (on ? [...list, item] : list.filter((other) => other !== item)))
  const all = done.length === PACKING.length

  return (
    <div className="flex flex-col gap-8 p-6">
      <Specimen label="State // unchecked, checked, some">
        <Checkbox aria-label="Sleeping bags" />
        <Checkbox aria-label="Sleeping bags" defaultChecked />
        <Checkbox aria-label="Cabin packing list" indeterminate />
      </Specimen>

      <Specimen label="State // disabled">
        <Checkbox aria-label="Sleeping bags" disabled />
        <Checkbox aria-label="Sleeping bags" defaultChecked disabled />
      </Specimen>

      <Specimen label="State // invalid">
        <Checkbox aria-label="Accept the terms" aria-invalid />
      </Specimen>

      <Specimen label="Note // Edited 08:40">
        <div className="flex w-full max-w-sm flex-col">
          <div className="flex items-center gap-3 py-3">
            <Checkbox
              id="view-checkbox-all"
              checked={all}
              indeterminate={!all && done.length > 0}
              onCheckedChange={(on) => setDone(on ? PACKING : [])}
            />
            <Label htmlFor="view-checkbox-all">Cabin packing list</Label>
          </div>
          {PACKING.map((item, i) => {
            const checked = done.includes(item)
            return (
              <div key={item} className="rule-t flex items-center gap-3 py-3">
                <Checkbox id={`view-checkbox-${i}`} checked={checked} onCheckedChange={(on) => toggle(item, on)} />
                <Label htmlFor={`view-checkbox-${i}`}>
                  <span className={checked ? "text-muted-foreground line-through" : undefined}>{item}</span>
                </Label>
              </div>
            )
          })}
        </div>
      </Specimen>
    </div>
  )
}
