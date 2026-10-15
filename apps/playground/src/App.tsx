import { useTheme } from "next-themes"
import { Button, Icon, Toaster, Kbd } from "@unicron/ui"
import { Showcase } from "./showcase"

export function App() {
  const { resolvedTheme, setTheme } = useTheme()
  const dark = resolvedTheme === "dark"

  return (
    <div className="min-h-dvh">
      <header className="bg-background/80 sticky top-0 z-40 flex items-center gap-3 border-b px-4 py-2 backdrop-blur">
        <span className="font-heading text-sm font-semibold">unicron playground</span>
        <span className="text-muted-foreground text-xs">
          every primitive, rendered in light and dark side by side
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Kbd>{dark ? "dark" : "light"}</Kbd>
          <Button variant="outline" size="sm" onClick={() => setTheme(dark ? "light" : "dark")}>
            <Icon name={dark ? "light_mode" : "dark_mode"} data-icon="inline-start" />
            Toggle theme
          </Button>
        </div>
      </header>

      {/* Both columns always render; the page theme swaps which column reads as "native". */}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <section className="bg-background text-foreground border-r p-6">
          <h2 className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">Light</h2>
          <Showcase />
        </section>
        <section className="dark bg-background text-foreground p-6">
          <h2 className="text-muted-foreground mb-4 text-xs font-medium tracking-wide uppercase">Dark</h2>
          <Showcase />
        </section>
      </div>
      <Toaster />
    </div>
  )
}
