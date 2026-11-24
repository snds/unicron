// The playground shell: a bar to pick the view and the theme, and the view below it. The address
// is the state (./address.ts), views are the files in ./views (./registry.ts), and the theme is
// two axes applied to <html> (./theme-switcher.tsx). With ?split=1 the view shows twice, graphite
// beside stone, each half its own ground box (Unicron 113). The shell lays out with plain elements
// and styles no system component: design-system analytics scans this app.
import { Component, Suspense, useCallback, useLayoutEffect, useState, type ReactNode } from "react"
import { NativeSelect, NativeSelectOption, Toaster } from "@unicron/ui"

import { setAddress, useAddress } from "./address"
import { DEFAULT_VIEW, findView, views } from "./registry"
import { ThemeSwitcher } from "./theme-switcher"
import { usePlaygroundTheme } from "./use-playground-theme"

/** Shows what a view threw instead of a blank page; the other views stay reachable. */
class ViewBoundary extends Component<{ children: ReactNode; onError: () => void }, { error: Error | null }> {
  state: { error: Error | null } = { error: null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    if (!this.state.error) return this.props.children
    return (
      <div role="alert" className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="type-overline text-critical-text">View failed</p>
        <p className="type-code-inline mt-1 break-words">{this.state.error.message}</p>
      </div>
    )
  }
}

/** Rendered after the view, inside its Suspense boundary: when this mounts, the view has. */
function Mounted({ onMount }: { onMount: () => void }) {
  useLayoutEffect(onMount, [onMount])
  return null
}

function Missing({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="type-overline">Views // {String(views.length).padStart(2, "0")}</p>
      <h1 className="type-title mt-1">No view named “{id}”.</h1>
      <p className="type-body text-text-secondary mt-2">A view is a file in apps/playground/src/views. These exist:</p>
      <p className="type-meta mt-2">{views.map((item) => item.id).join(" // ")}</p>
    </div>
  )
}

export function App() {
  const address = useAddress()
  const shown = usePlaygroundTheme()
  const id = address.view ?? DEFAULT_VIEW
  const view = findView(id)
  // "ready" once the view has mounted (its chunk has loaded); scripts/shots.mjs waits for it.
  const [settled, setSettled] = useState<{ id: string; state: "ready" | "error" } | null>(null)
  const state = !view ? "missing" : settled?.id === id ? settled.state : "loading"
  const ready = useCallback(() => setSettled({ id, state: "ready" }), [id])
  const failed = useCallback(() => setSettled({ id, state: "error" }), [id])

  return (
    <div data-slot="playground" className="min-h-dvh">
      {address.chrome ? (
        <header
          data-slot="playground-bar"
          className="bg-surface-ground rule-b sticky top-0 z-40 flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 sm:px-6"
        >
          <p className="flex items-baseline gap-2">
            <span className="type-brand-wordmark">UNICRON</span>
            <span className="type-overline">Playground</span>
          </p>
          <NativeSelect aria-label="View" size="sm" value={view ? id : ""} onChange={(event) => setAddress({ view: event.target.value })}>
            {view ? null : <NativeSelectOption value="">Pick a view</NativeSelectOption>}
            {views.map((item) => (
              <NativeSelectOption key={item.id} value={item.id}>
                {item.title}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <div className="ml-auto flex min-w-0 max-w-full flex-wrap items-center gap-x-4 gap-y-2">
            <ThemeSwitcher theme={shown.theme} ground={shown.ground} split={shown.split} />
          </div>
        </header>
      ) : null}

      <main data-slot="playground-view" data-view={id} data-view-state={state} data-split={shown.split ? "" : undefined}>
        {!view ? (
          <Missing id={id} />
        ) : shown.split ? (
          // Both grounds side by side: a `dark` box and a `light` box, which the tokens resolve at
          // any depth. What a view portals out (a dialog, a menu, a toast) takes the page's ground.
          <div data-slot="playground-split" className="grid md:grid-cols-2">
            {(["graphite", "stone"] as const).map((ground) => (
              <section
                key={ground}
                data-ground={ground}
                aria-label={ground === "graphite" ? "Graphite" : "Stone"}
                className={`${ground === "graphite" ? "dark" : "light"} bg-surface-ground text-foreground min-w-0`}
              >
                <ViewBoundary key={id} onError={failed}>
                  <Suspense fallback={null}>
                    <view.Component />
                    {ground === "stone" ? <Mounted onMount={ready} /> : null}
                  </Suspense>
                </ViewBoundary>
              </section>
            ))}
          </div>
        ) : (
          <ViewBoundary key={id} onError={failed}>
            <Suspense fallback={null}>
              <view.Component />
              <Mounted onMount={ready} />
            </Suspense>
          </ViewBoundary>
        )}
      </main>
      <Toaster />
    </div>
  )
}
