import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import * as ui from "./index"

// Helpers that sibling files and tests share. Each one that reached the root index would be public
// API of a 1.0 package and need a major to change. They are imported from their own files.
const INTERNAL = [
  "nextMinimized",
  "pullOffsetFor",
  "shrinkFor",
  "stripStateFor",
  "frameLayoutFor",
  "rovingTarget",
  "textOfNode",
  "waitingToasts",
  "toasterVisibleToasts",
  "toasterVisibleToastsPhone",
  "markKeyShortcuts",
  "resolveNavMark",
  "nameWithMark",
  "fieldTextOnTouch",
  "textFieldMessageRows",
  "readLength",
  "joinIds",
]

describe("the public surface of @unicron/ui", () => {
  it("keeps the shared helpers out of the root index", () => {
    const leaked = INTERNAL.filter((name) => name in ui)
    expect(leaked).toEqual([])
  })

  it("still exports what the named modules offer an app", () => {
    for (const name of [
      "AppFrame",
      "useAppFrame",
      "useScrollMinimize",
      "usePullToRefresh",
      "toastPlacementFor",
      "Rail",
      "RailItem",
      "NavMark",
      "formatNavCount",
      "NavItem",
      "Toaster",
      "toast",
      "toastDurations",
      "TextField",
      "SearchField",
      "Input",
      "fieldBoxVariants",
      "AdaptiveDialog",
      "AdaptiveMenu",
      "AdaptivePopover",
      "OverflowMenu",
      "useAdaptiveSheet",
    ]) {
      expect(ui, name).toHaveProperty(name)
    }
  })

  it("closes the subpaths of files that are parts of another module", () => {
    const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { exports: Record<string, unknown> }
    for (const part of ["app-frame-context", "app-frame-deprecated", "app-frame-desktop", "app-frame-focus", "app-frame-phone", "app-frame-pull", "dialog-size", "security/parts"]) {
      expect(pkg.exports[`./${part}`], part).toBeNull()
    }
    // A closed subpath must come before the pattern that would open it.
    const keys = Object.keys(pkg.exports)
    expect(keys.indexOf("./app-frame-desktop")).toBeLessThan(keys.indexOf("./*"))
    expect(keys.indexOf("./security/parts")).toBeLessThan(keys.indexOf("./security/*"))
  })
})
