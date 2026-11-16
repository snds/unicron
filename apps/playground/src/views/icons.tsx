// Icons (?view=icons): the curated Carbon set, every icon by its name, at the two sizes the
// direction allows: 20 px by default, 16 px in compact controls.
//
// The list is read from the same file the build reads (packages/ui/src/icons/names.json), so
// this page cannot show a name the package does not draw, or miss one it does.
//
// Since 1.1 the set has no extras: an app adds what else it needs with registerIcons(). The last
// section shows the one the docs use as the example, Vale's forward: Carbon's reply, mirrored.
import { Button, Icon, registerIcons, type IconName } from "@unicron/ui"

import { iconData } from "../../../../packages/ui/src/icons/data.gen"
import names from "../../../../packages/ui/src/icons/names.json"

declare module "@unicron/ui" {
  interface UnicronIconRegistry {
    "vale--forward": true
  }
}

// An app would read Carbon's own file (`@carbon/icons/svg/32/reply.svg`); the playground reuses the
// drawing the package already holds. The mirror is a transform on a group: no new art.
registerIcons({ "vale--forward": `<g transform="matrix(-1 0 0 1 32 0)">${iconData.reply}</g>` })

const GROUPS: Array<{ id: "figma" | "ui" | "apps"; title: string; note: string }> = [
  { id: "figma", title: "Figma", note: "The icons on the Unicron / Components page (frame 18:738), in Figma's order." },
  { id: "ui", title: "Unicron", note: "What the components draw beyond those." },
  { id: "apps", title: "Apps", note: "The Carbon match for every other Material name the four apps use (packages/ui/codemod/MAPPING.md)." },
]
const total = GROUPS.reduce((sum, group) => sum + names[group.id].length, 0)
const count = (n: number) => String(n).padStart(3, "0")

function IconTile({ name }: { name: IconName }) {
  return (
    <li data-specimen="icon" data-icon={name} className="flex min-w-0 items-center gap-3 py-2">
      <span className="flex w-12 shrink-0 items-center justify-between">
        <Icon name={name} />
        <Icon name={name} size="sm" />
      </span>
      <span className="type-meta min-w-0 truncate font-mono" title={name}>
        {name}
      </span>
    </li>
  )
}

export default function IconsView() {
  return (
    <div className="flex flex-col gap-12 p-6">
      <header className="flex flex-col gap-1">
        <p className="type-overline font-mono text-muted-foreground">Icons // Carbon // {count(total)}</p>
        <p className="type-measure text-muted-foreground">
          Each tile shows one icon at 20 px and at 16 px, then its name. The drawing is Carbon's 32 px art, scaled, filled with the
          text color.
        </p>
      </header>

      <section className="flex flex-col gap-4" aria-labelledby="icons-sizes">
        <h2 id="icons-sizes" className="type-overline font-mono text-muted-foreground">
          Sizes and tones // 06
        </h2>
        <div className="flex flex-wrap items-end gap-8">
          <figure data-specimen="icon-size" data-size="md" className="flex flex-col gap-2">
            <Icon name="arrow--right" />
            <figcaption className="type-meta font-mono text-muted-foreground">md // 20 // default</figcaption>
          </figure>
          <figure data-specimen="icon-size" data-size="sm" className="flex flex-col gap-2">
            <Icon name="arrow--right" size="sm" />
            <figcaption className="type-meta font-mono text-muted-foreground">sm // 16 // compact controls</figcaption>
          </figure>
          <figure data-specimen="icon-size" data-size="32" className="flex flex-col gap-2">
            <Icon name="arrow--right" size={32} />
            <figcaption className="type-meta font-mono text-muted-foreground">32 // a number, as drawn</figcaption>
          </figure>
          <figure data-specimen="icon-in-button" className="flex flex-col gap-2">
            <Button>
              <Icon name="add" data-icon="inline-start" />
              New item
            </Button>
            <figcaption className="type-meta font-mono text-muted-foreground">in a button // the button sets 16</figcaption>
          </figure>
          <figure data-specimen="icon-label" className="flex flex-col gap-2">
            <Icon name="warning--alt" label="Warning" tone="destructive" />
            <figcaption className="type-meta font-mono text-muted-foreground">label="Warning" // role img</figcaption>
          </figure>
          <figure data-specimen="icon-tone" className="flex flex-col gap-2">
            <Icon name="time" tone="muted" />
            <figcaption className="type-meta font-mono text-muted-foreground">tone="muted" // standing alone, outside a control</figcaption>
          </figure>
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.id} className="flex flex-col gap-4" aria-labelledby={`icons-${group.id}`}>
          <div className="flex flex-col gap-1">
            <h2 id={`icons-${group.id}`} className="type-overline font-mono text-muted-foreground">
              {group.title} // {count(names[group.id].length)}
            </h2>
            <p className="type-meta text-muted-foreground">{group.note}</p>
          </div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-x-6" aria-label={`${group.title} icons`}>
            {names[group.id].map((name) => (
              <IconTile key={name} name={name as IconName} />
            ))}
          </ul>
        </section>
      ))}

      <section className="flex flex-col gap-4" aria-labelledby="icons-registered">
        <div className="flex flex-col gap-1">
          <h2 id="icons-registered" className="type-overline font-mono text-muted-foreground">
            Registered by an app // {count(1)}
          </h2>
          <p className="type-meta text-muted-foreground">
            Not in the core. Vale registers forward as Carbon's reply, mirrored (docs/03-components.md, Icons).
          </p>
        </div>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-x-6" aria-label="Registered icons">
          <IconTile name="reply" />
          <IconTile name="vale--forward" />
        </ul>
      </section>
    </div>
  )
}
