// Select and NativeSelect in the Text Field box; the Select list solid, a rule, the 2px corner. View: ?view=select
import { Field, FieldLabel, NativeSelect, NativeSelectOption, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@unicron/ui"

import { Column, Page, Specimen } from "./_primitives"

const SEPARATORS = { dash: "A dash", space: "A space", dot: "A dot", none: "Nothing" }
const MODELS = { general: "General", code: "Code", vision: "Vision" }

export default function SelectView() {
  return (
    <Page>
      <Specimen label="NativeSelect // the platform's list, in the box; sm 40">
        <Column>
          <Field>
            <FieldLabel htmlFor="view-native-between">Between words</FieldLabel>
            <NativeSelect id="view-native-between" defaultValue="dash">
              {Object.entries(SEPARATORS).map(([value, label]) => (
                <NativeSelectOption key={value} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </Column>
        <Column>
          <Field>
            <FieldLabel htmlFor="view-native-sm">Clears after</FieldLabel>
            <NativeSelect id="view-native-sm" size="sm" defaultValue="90">
              <NativeSelectOption value="30">30 s</NativeSelectOption>
              <NativeSelectOption value="90">90 s</NativeSelectOption>
            </NativeSelect>
          </Field>
          <Field>
            <FieldLabel htmlFor="view-native-disabled">Clears after</FieldLabel>
            <NativeSelect id="view-native-disabled" size="sm" defaultValue="90" disabled>
              <NativeSelectOption value="90">90 s</NativeSelectOption>
            </NativeSelect>
          </Field>
        </Column>
      </Specimen>

      <Specimen label="Select // placeholder, chosen, invalid">
        <Column>
          <Field>
            <FieldLabel htmlFor="view-select-empty">Model</FieldLabel>
            <Select items={MODELS}>
              <SelectTrigger id="view-select-empty">
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(MODELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="view-select-invalid">Model</FieldLabel>
            <Select items={MODELS}>
              <SelectTrigger id="view-select-invalid" aria-invalid>
                <SelectValue placeholder="Choose a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Column>
        <Column>
          <div className="pb-56">
          <Field>
            <FieldLabel htmlFor="view-select-open">Model</FieldLabel>
            <Select items={MODELS} defaultValue="code" defaultOpen>
              <SelectTrigger id="view-select-open">
                <SelectValue />
              </SelectTrigger>
              <SelectContent width="trigger">
                <SelectGroup>
                  <SelectLabel>Aliases</SelectLabel>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="code">Code</SelectItem>
                </SelectGroup>
                <SelectSeparator />
                <SelectItem value="vision" disabled>
                  Vision
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
          </div>
        </Column>
      </Specimen>
    </Page>
  )
}
