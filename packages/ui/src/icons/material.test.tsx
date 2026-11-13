import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { iconFromMaterial } from "./material"
import { isIconName } from "./registry"

const map = JSON.parse(readFileSync(resolve(__dirname, "../../codemod/material-to-carbon.json"), "utf8")) as Record<string, unknown>
const names = Object.keys(map).filter((key) => !key.startsWith("_"))

describe("iconFromMaterial", () => {
  it("gives the codemod's Carbon name for every Material name in the map, and Icon can draw it", () => {
    expect(names.length).toBeGreaterThan(300)
    for (const name of names) {
      expect(iconFromMaterial(name), name).toBe(map[name])
      const to = iconFromMaterial(name)
      if (to !== null) expect(isIconName(to), `${name} → ${to}`).toBe(true)
    }
  })

  it("translates the names data carries", () => {
    expect(iconFromMaterial("done_all")).toBe("checkmark--double")
    expect(iconFromMaterial("front_hand")).toBe("user--feedback")
    expect(iconFromMaterial("lock_person")).toBe("user--access-locked")
    expect(iconFromMaterial("category")).toBe(map.category as string)
  })

  it("is null for a name with no Carbon match, for a Carbon name, and for anything else", () => {
    const unmapped = names.filter((name) => map[name] === null)
    expect(unmapped.length).toBeGreaterThan(0)
    for (const name of unmapped) expect(iconFromMaterial(name), name).toBeNull()
    expect(iconFromMaterial("arrow--right")).toBeNull()
    expect(iconFromMaterial("")).toBeNull()
    expect(iconFromMaterial("constructor")).toBeNull()
    expect(iconFromMaterial("__proto__")).toBeNull()
  })
})
