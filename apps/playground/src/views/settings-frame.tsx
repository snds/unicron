// SettingsFrame: one Settings for all four apps (decisions §5): the section list (204) beside one
// content column up to 720 on a desktop, grouped under overlines past seven sections, "Find a
// setting" from ten; on a phone the drawn rows first, then every section, each pushed.
// View: ?view=settings-frame
import { useState } from "react"
import { Input, SettingsFrame, type SettingsSection } from "@unicron/ui"

import { FrameBox, Specimen } from "./_frame-boxes"
import { StandInField } from "./_shell-parts"

const SYNAPSE: SettingsSection[] = [
  { value: "profile", label: "Profile", icon: "user--avatar", group: "You", description: "The persona in focus and how agents address you." },
  { value: "personas", label: "Personas", icon: "user--multiple", group: "You" },
  { value: "agents", label: "Agents", icon: "bot", group: "You" },
  { value: "workspace", label: "Workspace", icon: "folder", group: "Workspace" },
  { value: "rules", label: "Rules", icon: "rule", group: "Workspace" },
  { value: "harnesses", label: "Harnesses", icon: "flow", group: "Workspace" },
  { value: "appearance", label: "Appearance", icon: "contrast", group: "This Mac" },
  { value: "device", label: "Device and security", icon: "locked", group: "This Mac" },
  { value: "shortcuts", label: "Shortcuts and gestures", icon: "keyboard", group: "This Mac" },
  { value: "about", label: "About", icon: "information", group: "About", mark: { square: true, label: "Update ready" } },
]

function Many({ phone = false }: { phone?: boolean }) {
  const [value, setValue] = useState<string | null>(phone ? null : "profile")
  return (
    <SettingsFrame sections={SYNAPSE} value={value} onValueChange={setValue} search={<Input aria-label="Find a setting" placeholder="Find a setting" />}>
      <StandInField label="Persona" value="Sean // personal" action="Change" />
      <StandInField label="Address me as" value="Sean" action="Edit" />
    </SettingsFrame>
  )
}

export default function SettingsFrameView() {
  return (
    <div className="flex flex-col gap-10 p-4 sm:p-6">
      <Specimen label="Ten sections // grouped under overlines; Find a setting">
        <FrameBox width={1280} height={640} layout="expanded" label="Synapse // Profile">
          <Many />
        </FrameBox>
      </Specimen>
      <Specimen label="Phone // the section list, each one pushes">
        <FrameBox width={390} height={844} layout="phone" label="Synapse // the list">
          <Many phone />
        </FrameBox>
      </Specimen>
    </div>
  )
}
