// Readings for the round-2 foundation views (swatches, edges, plain-css), measured from the page.
// Not a view: the registry skips files that start with "_". The same approach as
// views/foundations.tsx: every reading is taken from what the browser drew, so a token that did
// not arrive reads "not set" instead of a typed-in number. The parts that draw are in
// _foundation.tsx.
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"

/** Counts up whenever the theme on <html> changes or a font arrives, so every reading is retaken. */
export const Reading = createContext(0)

export function useReadingTick() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const again = () => setTick((n) => n + 1)
    const observer = new MutationObserver(again)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] })
    window.addEventListener("resize", again)
    void document.fonts.ready.then(again)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", again)
    }
  }, [])
  return tick
}

/** Read something off an element after it has drawn, and again when the theme changes. */
export function useRead<T>(read: (element: HTMLElement) => T): [RefObject<HTMLDivElement | null>, T | null] {
  const ref = useRef<HTMLDivElement>(null)
  const tick = useContext(Reading)
  const [value, setValue] = useState<T | null>(null)
  const latest = useRef(read)
  useLayoutEffect(() => {
    latest.current = read
  })
  useLayoutEffect(() => {
    if (ref.current) setValue(latest.current(ref.current))
  }, [tick])
  return [ref, value]
}

const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, "0").toUpperCase()
let canvas: CanvasRenderingContext2D | null | undefined

/** A computed colour as Figma writes it (#18191D), or null when nothing is painted. */
export function colorText(computed: string): string | null {
  const plain = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/.exec(computed)
  let rgb: number[]
  let alpha = 1
  if (plain) {
    rgb = [Number(plain[1]), Number(plain[2]), Number(plain[3])]
    if (plain[4]) alpha = plain[4].endsWith("%") ? parseFloat(plain[4]) / 100 : Number(plain[4])
  } else {
    canvas ??= document.createElement("canvas").getContext("2d", { willReadFrequently: true })
    if (!canvas) return computed
    canvas.clearRect(0, 0, 1, 1)
    canvas.fillStyle = computed
    canvas.fillRect(0, 0, 1, 1)
    const data = canvas.getImageData(0, 0, 1, 1).data
    rgb = [data[0]!, data[1]!, data[2]!]
    alpha = data[3]! / 255
  }
  if (alpha === 0) return null
  return `#${hex2(rgb[0]!)}${hex2(rgb[1]!)}${hex2(rgb[2]!)}`
}

export const px = (value: string) => `${Number(parseFloat(value).toFixed(2))} px`
export const count = (n: number) => String(n).padStart(2, "0")
