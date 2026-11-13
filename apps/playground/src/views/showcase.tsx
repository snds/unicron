// The primitives showcase from before 1.0, as a view (?view=showcase). It draws once, in the theme
// and ground the playground bar sets. It goes when its sections have moved into views of their own.
import { Showcase } from "../showcase"

export default function ShowcaseView() {
  return (
    <div className="p-4 sm:p-6">
      <Showcase />
    </div>
  )
}
