import { describe, expect, it } from "vitest"
import { classifyViewport, detailPlacementFor, viewportWidthFor, type Viewport, type ViewportReading } from "./use-viewport"

const reading = (width: number, height: number, more: Partial<ViewportReading> = {}): ViewportReading => ({
  width,
  height,
  visualHeight: height,
  visualOffsetTop: 0,
  typing: false,
  fold: null,
  ...more,
})

const at = (width: number, height: number, previous: Viewport | null = null, more: Partial<ViewportReading> = {}) =>
  classifyViewport(reading(width, height, more), previous)

describe("viewportWidthFor", () => {
  it.each([
    [320, "compact"],
    [382, "compact"],
    [639, "compact"],
    [640, "medium"],
    [669, "medium"],
    [767, "medium"],
    [768, "expanded"],
    [951, "expanded"],
    [1279, "expanded"],
    [1280, "wide"],
    [2559, "wide"],
    [2560, "ultrawide"],
  ])("%i px is %s", (width, expected) => expect(viewportWidthFor(width)).toBe(expected))
})

describe("where a detail goes", () => {
  it.each([
    ["ultrawide", 5120, 2160, "beside"],
    ["laptop", 1440, 900, "beside"],
    ["iPad on its side", 1180, 820, "beside"],
    ["iPhone Duo open, on its side", 951, 585, "beside"],
    ["iPad upright", 820, 1180, "sheet"],
    ["iPhone Duo open, upright", 669, 867, "sheet"],
    ["iPhone", 390, 844, "sheet"],
    ["iPhone on its side", 844, 390, "sheet"],
    ["iPhone Duo folded", 382, 580, "sheet"],
    ["iPhone Duo folded, on its side", 594, 368, "sheet"],
    ["two windows on an iPhone Duo", 385, 571, "sheet"],
  ])("%s: %s×%s is %s", (_, w, h, placement) => expect(at(w, h).detailPlacement).toBe(placement))

  it("uses a book-pose fold if each side can hold something", () => {
    expect(detailPlacementFor({ widthClass: "expanded", landscape: false, short: false, fold: { kind: "book", sizes: [330, 330] } })).toBe("fold")
    expect(detailPlacementFor({ widthClass: "compact", landscape: false, short: false, fold: { kind: "book", sizes: [300, 300] } })).toBe("sheet")
  })

  it("doesn't count a tabletop fold, whose parts are one above the other", () => {
    expect(detailPlacementFor({ widthClass: "expanded", landscape: false, short: false, fold: { kind: "tabletop", sizes: [430, 430] } })).toBe("sheet")
  })
})

describe("short screens", () => {
  it.each([
    ["iPhone in landscape", 844, 390],
    ["large iPhone in landscape", 956, 440],
    ["small iPhone in landscape", 667, 375],
    ["iPhone Duo, folded, in landscape", 594, 368],
    ["iPhone Duo, folded, in landscape with Safari's bars away", 594, 406],
  ])("%s is short", (_, w, h) => expect(at(w, h).short).toBe(true))

  it.each([
    ["iPhone", 390, 844],
    ["iPhone Duo, folded", 382, 580],
    ["iPhone Duo, open", 669, 867],
    ["iPhone Duo, open, in landscape", 951, 585],
    ["iPhone Duo, two windows side by side", 385, 571],
    ["iPad in landscape", 1180, 820],
    ["a laptop", 1440, 900],
  ])("%s isn't", (_, w, h) => expect(at(w, h).short).toBe(false))
})

describe("where the nav goes", () => {
  it.each([
    ["iPhone", 390, 844, "bar"],
    ["small iPhone", 375, 667, "bar"],
    ["iPhone in Safari, with its bars showing", 390, 664, "bar"],
    ["Android foldable, cover", 344, 882, "bar"],
    ["iPhone Duo, open", 669, 867, "bar"],
    ["iPad", 820, 1180, "bar"],
    ["iPhone in landscape", 844, 390, "rail"],
    ["iPhone Duo, folded", 382, 580, "rail"],
    ["iPhone Duo, folded, in landscape", 594, 368, "rail"],
    ["iPhone Duo, two windows", 385, 571, "rail"],
  ])("%s: %s", (_, w, h, expected) => expect(at(w, h).navPlacement).toBe(expected))

  it("doesn't move because a keyboard resized the page", () => {
    expect(at(412, 500, at(412, 915), { typing: true }).navPlacement).toBe("bar")
  })
})

describe("the page's height", () => {
  it("is what's measured", () => expect(at(390, 793).pageHeight).toBe(793))

  it("takes the smaller reading, so nothing is cropped when they disagree", () => {
    expect(at(390, 852, null, { visualHeight: 793 }).pageHeight).toBe(793)
  })

  it("ignores a pinch, which shrinks only the visual viewport", () => {
    expect(at(390, 844, null, { visualHeight: 400, visualScale: 2 }).pageHeight).toBe(844)
  })

  it("isn't reduced by a keyboard twice: the frame takes the keyboard off separately", () => {
    expect(at(390, 844, at(390, 844), { typing: true, visualHeight: 508 }).pageHeight).toBe(844)
  })
})

describe("a keyboard", () => {
  it("is seen on iOS, where the page stays tall and only the visual viewport shrinks", () => {
    const v = at(390, 844, at(390, 844), { typing: true, visualHeight: 508 })
    expect(v).toMatchObject({ keyboardOpen: true, keyboardInset: 336, visibleHeight: 508, room: "tight", height: 844 })
  })

  it("includes how far iOS panned, so the frame can follow it", () => {
    const v = at(390, 844, at(390, 844), { typing: true, visualHeight: 508, visualOffsetTop: 100 })
    expect(v).toMatchObject({ keyboardInset: 236, offsetTop: 100 })
  })

  it("is seen on Android, where it resizes the page, without changing the layout", () => {
    const before = at(412, 915)
    const v = at(412, 500, before, { typing: true })
    expect(v).toMatchObject({ keyboardOpen: true, keyboardInset: 0, visibleHeight: 500, height: 915, landscape: false, short: false })
  })

  it("leaves almost nothing on a folded Duo in landscape", () => {
    const v = at(594, 368, at(594, 368), { typing: true, visualHeight: 180 })
    expect(v).toMatchObject({ short: true, room: "minimal" })
  })

  it("leaves a tablet its room", () => {
    expect(at(1180, 820, at(1180, 820), { typing: true, visualHeight: 600 }).room).toBe("full")
  })

  it("isn't assumed from a shorter window on a laptop, with nobody typing", () => {
    expect(at(1440, 400, at(1440, 900))).toMatchObject({ keyboardOpen: false, height: 400, short: true })
  })

  it("isn't assumed from a focused field and a hardware keyboard's small bar", () => {
    expect(at(1180, 820, at(1180, 820), { typing: true, visualHeight: 765 }).keyboardOpen).toBe(false)
  })

  it("stops holding the old height once the window's width changes: a rotation or an unfold", () => {
    const typing = at(390, 500, at(390, 844), { typing: true })
    expect(at(844, 390, typing, { typing: true })).toMatchObject({ height: 390, short: true, keyboardOpen: false })
  })
})

describe("a fold", () => {
  it("passes through what the device reports", () => {
    expect(at(669, 867, null, { fold: { kind: "book", sizes: [330, 330] } }).fold).toEqual({ kind: "book", sizes: [330, 330] })
  })
})
