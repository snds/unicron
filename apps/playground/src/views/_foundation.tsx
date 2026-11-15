// Shared parts for the round-2 foundation views (swatches, edges, plain-css): the page frame, a
// section block and a caption. Not a view: the registry skips files that start with "_".
import type { ReactNode } from "react"

import { Reading, useReadingTick } from "./_foundation-read"

export function Block({ id, overline, title, lead, children }: { id: string; overline: string; title: string; lead?: string; children: ReactNode }) {
  return (
    <section data-foundation={id} className="py-10">
      <header className="mb-6">
        <p className="type-overline">{overline}</p>
        <h2 className="type-title mt-1">{title}</h2>
        {lead ? <p className="type-caption text-text-secondary type-measure mt-2">{lead}</p> : null}
      </header>
      {children}
    </section>
  )
}

/** A name over a reading: the two lines under every specimen. */
export function Caption({ name, value, note }: { name: string; value?: string | null; note?: string }) {
  return (
    <figcaption className="mt-2 min-w-0">
      <p className="type-meta text-text-body truncate">{name}</p>
      {value === undefined ? null : (
        <p className="type-meta truncate" data-reading>
          {value ?? "not set"}
        </p>
      )}
      {note ? <p className="type-meta truncate">{note}</p> : null}
    </figcaption>
  )
}

/** The page frame every foundation view shares. */
export function Page({ slot, overline, title, lead, children }: { slot: string; overline: string; title: string; lead: string; children: ReactNode }) {
  const tick = useReadingTick()
  return (
    <Reading.Provider value={tick}>
      <div data-slot={slot} className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="pt-10">
          <p className="type-overline">{overline}</p>
          <h1 className="type-title mt-1">{title}</h1>
          <p className="type-body text-text-secondary type-measure mt-3">{lead}</p>
        </header>
        {children}
      </div>
    </Reading.Provider>
  )
}
